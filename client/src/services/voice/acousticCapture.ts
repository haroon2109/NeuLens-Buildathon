/**
 * Browser-side acoustic capture (Web Audio API).
 *
 * While the repeat-sentence activity records, this samples the microphone's
 * waveform at ~20 Hz and derives a small set of timing/pitch measurements
 * directly in the browser. It is the fallback when the server-side acoustic
 * service is unavailable, and it supplies response latency, which only the
 * browser knows.
 *
 * The measurements are coarse: a 2048-sample analyser frame at 48 kHz covers
 * ~43 ms, so pitch is estimated with autocorrelation and the syllable rate is
 * approximate. Anything finer comes from the server's Praat/librosa pass.
 */

export interface BrowserAcousticSummary {
  durationSeconds: number;
  speechDurationSeconds: number;
  speechOnsetMs: number | null;
  pauseCount: number;
  pauseDurationsMs: number[];
  meanPauseMs: number | null;
  speechRate: number | null;
  pitchMeanHz: number | null;
  pitchSdHz: number | null;
  intensityMean: number;
  intensityVariation: number;
  frameCount: number;
  quality: 'good' | 'fair' | 'poor';
}

interface Frame {
  t: number; // ms since capture started
  rms: number;
  pitch: number | null;
}

const SAMPLE_INTERVAL_MS = 50;
const PAUSE_MIN_MS = 250;
const MIN_SPEECH_MS = 120;
const MERGE_GAP_MS = 200;

/** Autocorrelation pitch estimate on a decimated copy of the frame. */
const estimatePitch = (samples: Float32Array, sampleRate: number): number | null => {
  const decimation = 4;
  const reducedRate = sampleRate / decimation;
  const length = Math.min(Math.floor(samples.length / decimation), 1024);
  if (length < 128) return null;

  const reduced = new Float32Array(length);
  let energy = 0;
  for (let i = 0; i < length; i += 1) {
    reduced[i] = samples[i * decimation];
    energy += reduced[i] * reduced[i];
  }
  if (energy / length < 1e-5) return null;

  const minLag = Math.floor(reducedRate / 400);
  const maxLag = Math.min(Math.floor(reducedRate / 60), Math.floor(length / 2));
  const scores: number[] = [];
  let bestScore = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i + lag < length; i += 1) {
      correlation += reduced[i] * reduced[i + lag];
      normA += reduced[i] * reduced[i];
      normB += reduced[i + lag] * reduced[i + lag];
    }
    const denominator = Math.sqrt(normA * normB) || 1;
    const score = correlation / denominator;
    scores.push(score);
    if (score > bestScore) bestScore = score;
  }

  if (bestScore < 0.35) return null;

  // Autocorrelation also peaks at multiples of the period; take the shortest
  // lag that is nearly as strong as the best one (the fundamental period).
  for (let index = 1; index < scores.length - 1; index += 1) {
    const score = scores[index];
    if (score < bestScore * 0.9) continue;
    if (score < scores[index - 1] || score <= scores[index + 1]) continue;
    return reducedRate / (minLag + index);
  }
  return null;
};

const summarise = (frames: Frame[], sampleIntervalMs: number): BrowserAcousticSummary => {
  const durationMs = frames.length ? frames[frames.length - 1].t + sampleIntervalMs : 0;
  const rmsValues = frames.map((frame) => frame.rms);
  const peak = rmsValues.length ? Math.max(...rmsValues) : 0;
  const floor = rmsValues.length ? Math.min(...rmsValues) : 0;
  const threshold = Math.max(floor + 0.2 * (peak - floor), 0.008);

  const segments: Array<{ start: number; end: number }> = [];
  let current: { start: number; end: number } | null = null;
  for (const frame of frames) {
    const active = frame.rms > threshold;
    if (active) {
      if (current) current.end = frame.t;
      else current = { start: frame.t, end: frame.t };
    } else if (current) {
      segments.push(current);
      current = null;
    }
  }
  if (current) segments.push(current);

  const merged: Array<{ start: number; end: number }> = [];
  for (const segment of segments) {
    const previous = merged[merged.length - 1];
    if (previous && segment.start - previous.end < MERGE_GAP_MS) previous.end = segment.end;
    else merged.push({ ...segment });
  }
  const speech = merged.filter((segment) => segment.end - segment.start >= MIN_SPEECH_MS);

  let speechDurationMs = 0;
  for (const segment of speech) speechDurationMs += segment.end - segment.start + sampleIntervalMs;

  const pauses: number[] = [];
  for (let i = 1; i < speech.length; i += 1) {
    const gap = speech[i].start - speech[i - 1].end;
    if (gap >= PAUSE_MIN_MS) pauses.push(Math.round(gap));
  }

  const speechFrames = frames.filter((frame) => frame.rms > threshold);
  const pitches = speechFrames
    .map((frame) => frame.pitch)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const mean = (values: number[]) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const pitchMean = mean(pitches);
  const pitchSd =
    pitchMean === null
      ? null
      : Math.sqrt(pitches.reduce((sum, value) => sum + (value - pitchMean) ** 2, 0) / pitches.length);

  // Syllable nuclei: local maxima in the RMS envelope, at least 120 ms apart.
  let syllables = 0;
  let lastPeakIndex = -Math.ceil(120 / sampleIntervalMs);
  for (let i = 2; i < frames.length - 2; i += 1) {
    const value = frames[i].rms;
    if (value <= threshold) continue;
    if (value < frames[i - 1].rms || value < frames[i + 1].rms) continue;
    // Ignore the ramps at the start/end of a speech segment: they are not
    // syllable nuclei, they are the envelope turning on and off.
    if (frames[i - 2].rms <= threshold || frames[i + 2].rms <= threshold) continue;
    const window = frames.slice(Math.max(0, i - 6), i + 7).map((frame) => frame.rms);
    if (value - Math.min(...window) < peak * 0.15) continue;
    if (i - lastPeakIndex < Math.ceil(120 / sampleIntervalMs)) continue;
    syllables += 1;
    lastPeakIndex = i;
  }

  const speechDurationSeconds = speechDurationMs / 1000;
  const speechRate = speechDurationSeconds > 0 && syllables > 0
    ? Math.round((syllables / speechDurationSeconds) * 60)
    : null;

  const meanRms = mean(rmsValues) ?? 0;
  const rmsSd =
    meanRms === 0
      ? 0
      : Math.sqrt(rmsValues.reduce((sum, value) => sum + (value - meanRms) ** 2, 0) / rmsValues.length);

  const quality: BrowserAcousticSummary['quality'] =
    speechDurationSeconds >= 1.2 && speech.length > 0
      ? peak > 0.05
        ? 'good'
        : 'fair'
      : 'poor';

  return {
    durationSeconds: Number((durationMs / 1000).toFixed(1)),
    speechDurationSeconds: Number(speechDurationSeconds.toFixed(1)),
    speechOnsetMs: speech.length ? Math.round(speech[0].start) : null,
    pauseCount: pauses.length,
    pauseDurationsMs: pauses,
    meanPauseMs: pauses.length
      ? Math.round(pauses.reduce((sum, value) => sum + value, 0) / pauses.length)
      : null,
    speechRate,
    pitchMeanHz: pitchMean === null ? null : Math.round(pitchMean * 10) / 10,
    pitchSdHz: pitchSd === null ? null : Math.round(pitchSd * 10) / 10,
    intensityMean: Number(meanRms.toFixed(4)),
    intensityVariation: Number(rmsSd.toFixed(4)),
    frameCount: frames.length,
    quality,
  };
};

export interface AcousticCapture {
  stop: () => BrowserAcousticSummary;
  startedAtEpochMs: number;
}

export const createAcousticCapture = (analyser: AnalyserNode, sampleRate: number): AcousticCapture => {
  const frames: Frame[] = [];
  const startedAtEpochMs = Date.now();
  const startedAt = performance.now();
  const buffer = new Float32Array(analyser.fftSize);

  const sample = () => {
    analyser.getFloatTimeDomainData(buffer);
    let energy = 0;
    for (let i = 0; i < buffer.length; i += 1) energy += buffer[i] * buffer[i];
    const rms = Math.sqrt(energy / buffer.length);
    frames.push({
      t: performance.now() - startedAt,
      rms,
      pitch: rms > 0.008 ? estimatePitch(buffer, sampleRate) : null,
    });
  };

  sample();
  const interval = window.setInterval(sample, SAMPLE_INTERVAL_MS);

  return {
    startedAtEpochMs,
    stop: () => {
      window.clearInterval(interval);
      return summarise(frames, SAMPLE_INTERVAL_MS);
    },
  };
};
