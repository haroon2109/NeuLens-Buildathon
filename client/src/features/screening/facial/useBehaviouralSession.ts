import { useCallback, useEffect, useRef, useState } from 'react';
import { useFaceTrackingStore } from '../../../store/faceTrackingStore';

/**
 * Behavioural observation session for the facial-expression activity.
 *
 * This is deliberately *not* an emotion classifier. It records observable
 * behaviour from MediaPipe landmarks — head movement, facial movement,
 * task-related response timing, movement consistency and camera tracking
 * quality — as supplementary research observations. Nothing here is a
 * cognitive or diagnostic signal.
 */

const SAMPLE_INTERVAL_MS = 100;
const BLINK_INTENSITY_THRESHOLD = 50;

interface BehaviourSample {
  t: number;
  faceDetected: boolean;
  yaw: number;
  pitch: number;
  roll: number;
  smile: number;
  jaw: number;
  brows: number;
  stability: number;
  interocularPx: number;
  blinkIntensity: number;
}

export interface BehaviourQuality {
  score: number;
  level: 'good' | 'fair' | 'poor';
  reasons: Array<'FACE_NOT_VISIBLE' | 'TOO_FAR' | 'HEAD_MOVEMENT' | 'UNSTABLE_TRACKING'>;
  comparable: boolean;
  summary: string;
}

export interface BehaviourSummary {
  recordedAt: string;
  durationSeconds: number;
  sampleCount: number;
  facePresenceRatio: number;
  head: {
    meanAngularSpeedDegPerSec: number | null;
    yawSdDeg: number | null;
    pitchSdDeg: number | null;
    rollSdDeg: number | null;
    /** 100 = perfectly even movement pacing; based on the speed CV. */
    movementConsistency: number | null;
  };
  facial: {
    meanChangePerSecond: number | null;
    expressionVariability: number | null;
    blinkCount: number;
  };
  task: {
    promptsCompleted: number;
    responseTimesMs: number[];
    meanResponseMs: number | null;
    responseVariabilityMs: number | null;
  };
  quality: BehaviourQuality;
  engagement: string;
  note: string;
}

const REASON_TEXT: Record<BehaviourQuality['reasons'][number], string> = {
  FACE_NOT_VISIBLE: 'The face was not visible for part of the activity.',
  TOO_FAR: 'The face was too far from the camera.',
  HEAD_MOVEMENT: 'There was a lot of head movement.',
  UNSTABLE_TRACKING: 'Tracking was unstable during the activity.',
};

const REASON_TEXT_TA: Record<BehaviourQuality['reasons'][number], string> = {
  FACE_NOT_VISIBLE: 'பயிற்சியின் போது முகம் முழுமையாகத் தெரியவில்லை.',
  TOO_FAR: 'கேமராவிலிருந்து முகம் அதிக தூரத்தில் இருந்தது.',
  HEAD_MOVEMENT: 'தலையின் அசைவு அதிகமாக இருந்தது.',
  UNSTABLE_TRACKING: 'பயிற்சியின் போது கண்காணிப்பு சீரற்றதாக இருந்தது.'
};

const REASON_TEXT_HI: Record<BehaviourQuality['reasons'][number], string> = {
  FACE_NOT_VISIBLE: 'गतिविधि के कुछ हिस्से में चेहरा स्पष्ट रूप से नहीं दिखा।',
  TOO_FAR: 'चेहरा कैमरे से बहुत दूर था।',
  HEAD_MOVEMENT: 'सिर की हलचल अधिक थी।',
  UNSTABLE_TRACKING: 'गतिविधि के दौरान ट्रैकिंग अस्थिर थी।'
};

export const behaviourReasonText = (
  reason: BehaviourQuality['reasons'][number],
  language?: string
) => {
  if (language === 'ta') return REASON_TEXT_TA[reason] ?? REASON_TEXT[reason];
  if (language === 'hi') return REASON_TEXT_HI[reason] ?? REASON_TEXT[reason];
  return REASON_TEXT[reason];
};

const emptyQuality: BehaviourQuality = {
  score: 0,
  level: 'poor',
  reasons: ['FACE_NOT_VISIBLE'],
  comparable: false,
  summary: 'No usable camera samples were recorded.',
};

const mean = (values: number[]): number | null =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const standardDeviation = (values: number[]): number | null => {
  const average = mean(values);
  if (average === null) return null;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
};

const buildQuality = (samples: BehaviourSample[]): BehaviourQuality => {
  if (!samples.length) return emptyQuality;

  const faces = samples.filter((sample) => sample.faceDetected);
  const facePresenceRatio = faces.length / samples.length;
  const distanceValues = faces.map((sample) => sample.interocularPx).filter((value) => value > 0);
  const meanInterocular = mean(distanceValues) ?? 0;
  const meanStability = mean(faces.map((sample) => sample.stability)) ?? 0;

  const reasons: BehaviourQuality['reasons'] = [];
  let score = facePresenceRatio * 60 + (meanStability / 100) * 20;
  if (facePresenceRatio < 0.6) reasons.push('FACE_NOT_VISIBLE');
  if (meanInterocular > 0 && meanInterocular < 32) {
    reasons.push('TOO_FAR');
  } else {
    score += 20;
  }
  if (meanStability < 35) reasons.push('HEAD_MOVEMENT');
  if (meanStability < 55) reasons.push('UNSTABLE_TRACKING');

  const rounded = Math.round(Math.max(0, Math.min(100, score)));
  const level: BehaviourQuality['level'] = rounded >= 75 ? 'good' : rounded >= 50 ? 'fair' : 'poor';
  const comparable = facePresenceRatio >= 0.6 && rounded >= 50;

  return {
    score: rounded,
    level,
    reasons,
    comparable,
    summary: comparable
      ? level === 'good'
        ? 'Facial tracking quality was good.'
        : 'Facial tracking quality was fair; observations are limited.'
      : 'Facial tracking quality was too low for usable observations. Please repeat the activity.',
  };
};

export const useBehaviouralSession = ({ active }: { active: boolean }) => {
  const samplesRef = useRef<BehaviourSample[]>([]);
  const startRef = useRef<number | null>(null);
  const [liveQuality, setLiveQuality] = useState<BehaviourQuality>(emptyQuality);

  useEffect(() => {
    if (!active) return;

    samplesRef.current = [];
    startRef.current = Date.now();
    setLiveQuality(emptyQuality);

    const sample = () => {
      const { metrics } = useFaceTrackingStore.getState();
      const now = Date.now();
      const start = startRef.current ?? now;

      samplesRef.current.push({
        t: now - start,
        faceDetected: metrics.faceDetected,
        yaw: metrics.headPose.yaw,
        pitch: metrics.headPose.pitch,
        roll: metrics.headPose.roll,
        smile: metrics.smile,
        jaw: metrics.jawMovement,
        brows: metrics.eyebrows,
        stability: metrics.stability,
        interocularPx: metrics.interocularPx,
        blinkIntensity: metrics.blinkIntensity,
      });

      setLiveQuality(buildQuality(samplesRef.current));
    };

    sample();
    const interval = window.setInterval(sample, SAMPLE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [active]);

  const getSummary = useCallback((responseTimesMs: number[] = []): BehaviourSummary => {
    const samples = samplesRef.current;
    const durationSeconds = startRef.current
      ? Math.max(0.1, (Date.now() - startRef.current) / 1000)
      : 0;

    const faces = samples.filter((sample) => sample.faceDetected);
    const facePresenceRatio = samples.length ? faces.length / samples.length : 0;

    // Head movement: angular displacement between consecutive face samples.
    const angularSpeeds: number[] = [];
    const facialChanges: number[] = [];
    for (let i = 1; i < samples.length; i += 1) {
      const previous = samples[i - 1];
      const current = samples[i];
      if (!previous.faceDetected || !current.faceDetected) continue;
      const dt = Math.max(0.001, (current.t - previous.t) / 1000);
      const angle = Math.hypot(
        current.yaw - previous.yaw,
        current.pitch - previous.pitch,
        current.roll - previous.roll
      );
      angularSpeeds.push(angle / dt);
      facialChanges.push(
        (Math.abs(current.smile - previous.smile) +
          Math.abs(current.jaw - previous.jaw) +
          Math.abs(current.brows - previous.brows)) /
          3 /
          dt
      );
    }

    const speedMean = mean(angularSpeeds);
    const speedSd = standardDeviation(angularSpeeds);
    const movementConsistency =
      speedMean !== null && speedMean > 0.5 && speedSd !== null
        ? Math.round(Math.max(0, Math.min(100, 100 - (speedSd / speedMean) * 100)))
        : null;

    const expression = faces.map((sample) => (sample.smile + sample.jaw + sample.brows) / 3);
    const expressionVariability = standardDeviation(expression);

    // Blinks are counted as rising edges of the eye-closure blendshape, so a
    // held blink is not counted on every sample.
    let blinkCount = 0;
    let wasBlinking = false;
    for (const sample of samples) {
      const blinking = sample.faceDetected && sample.blinkIntensity >= BLINK_INTENSITY_THRESHOLD;
      if (blinking && !wasBlinking) blinkCount += 1;
      wasBlinking = blinking;
    }

    const quality = buildQuality(samples);
    const meanResponse = mean(responseTimesMs);
    const responseVariability = standardDeviation(responseTimesMs);

    return {
      recordedAt: new Date().toISOString(),
      durationSeconds: Number(durationSeconds.toFixed(1)),
      sampleCount: samples.length,
      facePresenceRatio: Number(facePresenceRatio.toFixed(2)),
      head: {
        meanAngularSpeedDegPerSec: speedMean === null ? null : Number(speedMean.toFixed(1)),
        yawSdDeg: roundOrNull(standardDeviation(faces.map((sample) => sample.yaw))),
        pitchSdDeg: roundOrNull(standardDeviation(faces.map((sample) => sample.pitch))),
        rollSdDeg: roundOrNull(standardDeviation(faces.map((sample) => sample.roll))),
        movementConsistency,
      },
      facial: {
        meanChangePerSecond:
          facialChanges.length && durationSeconds > 0
            ? Number(
                (
                  facialChanges.reduce((sum, value) => sum + value, 0) /
                  facialChanges.length
                ).toFixed(1)
              )
            : null,
        expressionVariability: roundOrNull(expressionVariability),
        blinkCount,
      },
      task: {
        promptsCompleted: responseTimesMs.length,
        responseTimesMs,
        meanResponseMs: meanResponse === null ? null : Math.round(meanResponse),
        responseVariabilityMs: responseVariability === null ? null : Math.round(responseVariability),
      },
      quality,
      engagement:
        quality.comparable && responseTimesMs.length > 0
          ? `Responded to ${responseTimesMs.length} facial prompt(s); camera tracking was ${quality.level}.`
          : 'Engagement could not be described reliably from this recording.',
      note: 'Observable behaviour during a guided facial activity; not an emotion or cognitive assessment.',
    };
  }, []);

  return { liveQuality, getSummary };
};

const roundOrNull = (value: number | null): number | null =>
  value === null ? null : Number(value.toFixed(1));
