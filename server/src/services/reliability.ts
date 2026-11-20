/**
 * Test–retest reliability for repeated administrations.
 *
 * The platform could not previously report a reliability coefficient at all, and
 * the honest position was to say so. This module makes the gap measurable without
 * pretending it is closed: it computes ICC(2,1) from genuinely repeated
 * administrations under matched conditions, and returns `null` when the sample is
 * too small to support a coefficient. A number produced from two or three pairs is
 * not a reliability estimate, and reporting one would be the same fabrication the
 * rest of the scoring path was cleaned of.
 *
 * ICC(2,1) — two-way random effects, absolute agreement, single measurement — is
 * the formulation the validation plan commits to
 * (`docs/future-health-challenge/VALIDATION_STUDY_PLAN.md`). Absolute agreement is
 * used because a systematic offset between two administrations is disagreement,
 * not merely a shift.
 */

/** Fewer than this many repeat pairs cannot support a usable estimate. */
export const MIN_REPEAT_PAIRS_FOR_ICC = 3;

export interface RepeatPair {
  /** Earlier administration. */
  first: number;
  /** Later administration under matched conditions. */
  second: number;
}

export interface IccEstimate {
  /**
   * ICC(2,1). A negative value means between-session variance is not
   * distinguishable from measurement error: poor agreement, not a small one.
   */
  value: number;
  pairs: number;
  /** Provisional: computed from available repeats, not a validated property. */
  provisional: true;
}

const round4 = (value: number): number => Math.round(value * 10_000) / 10_000;

/**
 * ICC(2,1) for exactly two administrations per participant.
 *
 * Returns null when there are too few pairs, or when every participant scored the
 * same value in both administrations (the coefficient is then 0/0 — undefined, not
 * perfect agreement).
 */
export function icc21(pairs: RepeatPair[]): IccEstimate | null {
  const usable = pairs.filter((pair) => Number.isFinite(pair.first) && Number.isFinite(pair.second));
  const n = usable.length;
  if (n < MIN_REPEAT_PAIRS_FOR_ICC) return null;

  const k = 2;
  const all = usable.flatMap((pair) => [pair.first, pair.second]);
  const grandMean = all.reduce((sum, value) => sum + value, 0) / all.length;
  const rowMeans = usable.map((pair) => (pair.first + pair.second) / 2);
  const colMeans = [
    usable.reduce((sum, pair) => sum + pair.first, 0) / n,
    usable.reduce((sum, pair) => sum + pair.second, 0) / n
  ];

  const msRows =
    (k * rowMeans.reduce((sum, mean) => sum + (mean - grandMean) ** 2, 0)) / (n - 1);
  const msCols =
    (n * colMeans.reduce((sum, mean) => sum + (mean - grandMean) ** 2, 0)) / (k - 1);

  let residualSum = 0;
  for (const pair of usable) {
    const rowMean = (pair.first + pair.second) / 2;
    [pair.first, pair.second].forEach((value, index) => {
      const residual = value - rowMean - colMeans[index] + grandMean;
      residualSum += residual ** 2;
    });
  }
  const msError = residualSum / ((n - 1) * (k - 1));

  const denominator = msRows + (k - 1) * msError + (k * (msCols - msError)) / n;
  if (!Number.isFinite(denominator) || denominator <= 0) return null;

  return {
    value: round4((msRows - msError) / denominator),
    pairs: n,
    provisional: true
  };
}
