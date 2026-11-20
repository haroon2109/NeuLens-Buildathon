/**
 * Camera-based gaze calibration.
 *
 * MediaPipe gives us the iris position *inside the eye opening* as a ratio.
 * That ratio depends on the person's face, the camera height and how far away
 * they sit, so it cannot be mapped to screen coordinates with fixed constants.
 * We ask the person to look at a handful of known on-screen points and fit a
 * 2D affine transform from ratio space to screen percentages.
 *
 * This is a coarse, person-specific mapping for a guided activity — not a
 * clinical eye tracker. The fit is validated against its own samples and
 * rejected (falling back to the default mapping, marked unreliable) when the
 * residuals are large, e.g. because the person moved or looked away.
 */

export interface GazeRatio {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number; // percent 0..100
  y: number; // percent 0..100
}

export interface CalibrationSample {
  ratio: GazeRatio;
  screen: ScreenPoint;
}

export interface GazeCalibration {
  /** screenX% = x[0] + x[1] * ratio.x + x[2] * ratio.y */
  x: [number, number, number];
  y: [number, number, number];
  reliable: boolean;
  meanError: number;
  sampleCount: number;
  createdAt: string;
}

export const DEFAULT_GAZE_MAPPING = {
  // ((ratio - 0.43) / 0.14) * 100 and ((ratio - 0.40) / 0.20) * 100, the
  // fixed mapping used before calibration existed.
  x: [-307.14, 714.29, 0] as [number, number, number],
  y: [-200, 0, 500] as [number, number, number],
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

/** Solve a small dense system with partial pivoting. Returns null if singular. */
const solve3 = (A: number[][], b: number[]): [number, number, number] | null => {
  const m = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < 3; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < 3; row += 1) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    if (Math.abs(m[pivot][col]) < 1e-9) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];

    for (let row = 0; row < 3; row += 1) {
      if (row === col) continue;
      const factor = m[row][col] / m[col][col];
      for (let k = col; k < 4; k += 1) m[row][k] -= factor * m[col][k];
    }
  }

  return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]];
};

const fitAxis = (samples: CalibrationSample[], target: 'screenX' | 'screenY'): [number, number, number] | null => {
  // Normal equations for [1, rx, ry] features.
  const A = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const b = [0, 0, 0];

  for (const sample of samples) {
    const features = [1, sample.ratio.x, sample.ratio.y];
    const value = target === 'screenX' ? sample.screen.x : sample.screen.y;
    for (let i = 0; i < 3; i += 1) {
      b[i] += features[i] * value;
      for (let j = 0; j < 3; j += 1) A[i][j] += features[i] * features[j];
    }
  }

  return solve3(A, b);
};

/**
 * Fit a calibration from samples. Needs at least three samples that are not
 * collinear; returns null when the fit cannot be solved.
 */
export const fitGazeCalibration = (samples: CalibrationSample[]): GazeCalibration | null => {
  if (samples.length < 3) return null;

  const x = fitAxis(samples, 'screenX');
  const y = fitAxis(samples, 'screenY');
  if (!x || !y) return null;

  const errors = samples.map((sample) => {
    const predicted = applyAffine(x, y, sample.ratio);
    return Math.hypot(predicted.x - sample.screen.x, predicted.y - sample.screen.y);
  });
  const meanError = errors.reduce((sum, value) => sum + value, 0) / errors.length;

  // Reject fits that are numerically wild (person moved mid-calibration, iris
  // ratio saturated) or that miss the calibration targets by more than a
  // quarter of the screen.
  const coefficientSane =
    [x[1], x[2], y[1], y[2]].every((value) => Number.isFinite(value) && Math.abs(value) < 5000);

  return {
    x,
    y,
    reliable: coefficientSane && meanError <= 25,
    meanError: Number(meanError.toFixed(2)),
    sampleCount: samples.length,
    createdAt: new Date().toISOString(),
  };
};

const applyAffine = (
  x: [number, number, number],
  y: [number, number, number],
  ratio: GazeRatio
): ScreenPoint => ({
  x: clampPercent(x[0] + x[1] * ratio.x + x[2] * ratio.y),
  y: clampPercent(y[0] + y[1] * ratio.x + y[2] * ratio.y),
});

/**
 * Map a raw iris ratio to screen percentages. Without calibration the default
 * mapping approximates the earlier fixed constants, so the activity still runs
 * on browsers where calibration was skipped.
 */
export const applyGazeCalibration = (
  calibration: GazeCalibration | null | undefined,
  ratio: GazeRatio | null | undefined
): ScreenPoint | null => {
  if (!ratio || !Number.isFinite(ratio.x) || !Number.isFinite(ratio.y)) return null;

  if (calibration && calibration.reliable) {
    return applyAffine(calibration.x, calibration.y, ratio);
  }

  return applyAffine(
    DEFAULT_GAZE_MAPPING.x,
    DEFAULT_GAZE_MAPPING.y,
    ratio
  );
};

/** Suggested calibration targets: centre, then the four cardinal points. */
export const CALIBRATION_TARGETS: ScreenPoint[] = [
  { x: 50, y: 50 },
  { x: 15, y: 50 },
  { x: 85, y: 50 },
  { x: 50, y: 18 },
  { x: 50, y: 82 },
];

export const CALIBRATION_DWELL_MS = 1600;
