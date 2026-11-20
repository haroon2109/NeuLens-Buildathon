import { useCallback, useEffect, useRef, useState } from 'react';
import { useFaceTrackingStore } from '../../../store/faceTrackingStore';
import { assessSignalQuality, type SignalQuality } from './signalQuality';

/**
 * Records session-level eye measurements while the target-following activity
 * runs, and folds in a signal-quality assessment.
 *
 * Fixations and saccade-like movements are derived from the estimated screen
 * gaze at ~10 Hz. That is coarse compared with dedicated eye-tracking hardware:
 * the numbers describe observable behaviour during the task, they are not
 * clinical eye-tracking parameters.
 */

const SAMPLE_INTERVAL_MS = 100;
const LUMINANCE_INTERVAL_MS = 500;
const FIXATION_MOVE_THRESHOLD = 1.5; // screen % between samples (~15 %/s)
const SACCADE_VELOCITY_THRESHOLD = 40; // screen % per second
const MIN_FIXATION_SAMPLES = 3; // 300 ms

interface OcularSample {
  t: number;
  x: number;
  y: number;
  facePresent: boolean;
}

export interface OcularSessionSummary {
  recordedAt: string;
  durationSeconds: number;
  sampleCount: number;
  facePresenceRatio: number;
  blinkCount: number;
  blinkRatePerMinute: number | null;
  fixationCount: number;
  meanFixationMs: number | null;
  saccadeCount: number;
  gazeDispersion: number | null;
  calibrated: boolean;
  calibrationError: number | null;
  quality: SignalQuality;
  note: string;
}

const emptyQuality = assessSignalQuality({
  facePresenceRatio: 0,
  meanLuminance: null,
  interocularPx: 0,
  headStability: 0,
});

export interface UseOcularSessionOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  active: boolean;
}

export const useOcularSession = ({ videoRef, active }: UseOcularSessionOptions) => {
  const samplesRef = useRef<OcularSample[]>([]);
  const luminanceRef = useRef<number[]>([]);
  const interocularRef = useRef<number[]>([]);
  const stabilityRef = useRef<number[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const blinkStartRef = useRef<number>(0);
  const lastBlinkRef = useRef<number>(0);
  const [liveQuality, setLiveQuality] = useState<SignalQuality>(emptyQuality);

  const reset = useCallback(() => {
    samplesRef.current = [];
    luminanceRef.current = [];
    interocularRef.current = [];
    stabilityRef.current = [];
    startTimeRef.current = null;
    blinkStartRef.current = useFaceTrackingStore.getState().metrics.blinkCount;
    lastBlinkRef.current = blinkStartRef.current;
    setLiveQuality(emptyQuality);
  }, []);

  useEffect(() => {
    if (!active) return;

    reset();
    startTimeRef.current = Date.now();

    const luminanceCanvas = document.createElement('canvas');
    luminanceCanvas.width = 32;
    luminanceCanvas.height = 24;
    const luminanceCtx = luminanceCanvas.getContext('2d', { willReadFrequently: true });

    let lastLuminance = 0;

    const sampleFrame = () => {
      const { metrics } = useFaceTrackingStore.getState();
      const now = Date.now();

      // Blink count is cumulative; count only new blinks since this session began.
      if (metrics.blinkCount > lastBlinkRef.current) {
        lastBlinkRef.current = metrics.blinkCount;
      }

      const facePresent = Boolean(metrics.screenGaze) && metrics.gaze !== 'Unknown';
      if (metrics.screenGaze) {
        samplesRef.current.push({
          t: now,
          x: metrics.screenGaze.x,
          y: metrics.screenGaze.y,
          facePresent,
        });
      } else {
        samplesRef.current.push({ t: now, x: NaN, y: NaN, facePresent: false });
      }

      interocularRef.current.push(metrics.interocularPx);
      stabilityRef.current.push(metrics.stability);

      const video = videoRef.current;
      if (luminanceCtx && video && video.readyState >= 2 && now - lastLuminance > LUMINANCE_INTERVAL_MS) {
        lastLuminance = now;
        try {
          luminanceCtx.drawImage(video, 0, 0, luminanceCanvas.width, luminanceCanvas.height);
          const { data } = luminanceCtx.getImageData(0, 0, luminanceCanvas.width, luminanceCanvas.height);
          let total = 0;
          for (let i = 0; i < data.length; i += 4) {
            total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          }
          luminanceRef.current.push(total / (data.length / 4));
        } catch {
          // Frame not readable yet (metadata/permissions); skip this sample.
        }
      }

      const facePresence =
        samplesRef.current.length > 0
          ? samplesRef.current.filter((sample) => sample.facePresent).length / samplesRef.current.length
          : 0;
      const mean = (values: number[]) =>
        values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

      setLiveQuality(
        assessSignalQuality({
          facePresenceRatio: facePresence,
          meanLuminance: luminanceRef.current.length ? mean(luminanceRef.current) : null,
          interocularPx: mean(interocularRef.current),
          headStability: mean(stabilityRef.current),
        })
      );
    };

    sampleFrame();
    const interval = window.setInterval(sampleFrame, SAMPLE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [active, reset, videoRef]);

  const getSummary = useCallback((): OcularSessionSummary => {
    const samples = samplesRef.current;
    const start = startTimeRef.current;
    const durationSeconds = start ? Math.max(0.1, (Date.now() - start) / 1000) : 0;

    const valid = samples.filter((sample) => sample.facePresent && Number.isFinite(sample.x));
    const facePresenceRatio = samples.length ? valid.length / samples.length : 0;

    // Fixations: runs of samples that stay within the movement threshold.
    const fixations: number[] = [];
    let runStart: OcularSample | null = null;
    let previous: OcularSample | null = null;
    let saccades = 0;
    let inSaccade = false;

    for (const sample of samples) {
      if (!sample.facePresent) {
        if (runStart && previous && (previous.t - runStart.t) >= MIN_FIXATION_SAMPLES * SAMPLE_INTERVAL_MS) {
          fixations.push(previous.t - runStart.t);
        }
        runStart = null;
        previous = null;
        inSaccade = false;
        continue;
      }

      if (previous) {
        const dt = Math.max(1, sample.t - previous.t) / 1000;
        const distance = Math.hypot(sample.x - previous.x, sample.y - previous.y);
        const velocity = distance / dt;

        if (velocity >= SACCADE_VELOCITY_THRESHOLD) {
          if (!inSaccade) saccades += 1;
          inSaccade = true;
          if (runStart) {
            const runMs = previous.t - runStart.t;
            if (runMs >= MIN_FIXATION_SAMPLES * SAMPLE_INTERVAL_MS) fixations.push(runMs);
          }
          runStart = null;
        } else {
          inSaccade = false;
          if (distance < FIXATION_MOVE_THRESHOLD) {
            if (!runStart) runStart = sample;
          } else {
            if (runStart) {
              const runMs = previous.t - runStart.t;
              if (runMs >= MIN_FIXATION_SAMPLES * SAMPLE_INTERVAL_MS) fixations.push(runMs);
            }
            runStart = sample;
          }
        }
      } else if (sample.facePresent) {
        runStart = sample;
      }

      previous = sample;
    }

    if (runStart && previous) {
      const runMs = previous.t - runStart.t;
      if (runMs >= MIN_FIXATION_SAMPLES * SAMPLE_INTERVAL_MS) fixations.push(runMs);
    }

    const mean = (values: number[]) =>
      values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

    const xs = valid.map((sample) => sample.x);
    const ys = valid.map((sample) => sample.y);
    let gazeDispersion: number | null = null;
    if (xs.length > 1) {
      const variance = (values: number[]) => {
        const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
        return values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
      };
      gazeDispersion = Number(Math.sqrt(variance(xs) + variance(ys)).toFixed(2));
    }

    const blinkCount = Math.max(0, lastBlinkRef.current - blinkStartRef.current);
    const meanLuminance = mean(luminanceRef.current);
    const meanInterocular = mean(interocularRef.current) ?? 0;
    const meanStability = mean(stabilityRef.current) ?? 0;

    const quality = assessSignalQuality({
      facePresenceRatio,
      meanLuminance,
      interocularPx: meanInterocular,
      headStability: meanStability,
    });

    const { calibration } = useFaceTrackingStore.getState();

    return {
      recordedAt: new Date().toISOString(),
      durationSeconds: Number(durationSeconds.toFixed(1)),
      sampleCount: samples.length,
      facePresenceRatio: Number(facePresenceRatio.toFixed(2)),
      blinkCount,
      blinkRatePerMinute:
        durationSeconds > 3 ? Number(((blinkCount / durationSeconds) * 60).toFixed(1)) : null,
      fixationCount: fixations.length,
      meanFixationMs: fixations.length
        ? Math.round(fixations.reduce((sum, value) => sum + value, 0) / fixations.length)
        : null,
      saccadeCount: saccades,
      gazeDispersion,
      calibrated: Boolean(calibration?.reliable),
      calibrationError: calibration ? calibration.meanError : null,
      quality,
      note: 'Observable eye behaviour during a guided task; not a clinical eye-tracking measurement.',
    };
  }, []);

  return { liveQuality, getSummary, reset, isRecording: active };
};
