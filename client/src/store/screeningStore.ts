import { create } from 'zustand';

export type ScreeningStep =
  | 'language-select'
  | 'intro'
  | 'sensor-check'
  | 'functional-assessment'
  | 'adaptive-practice' // non-clinical, adaptive; never used for scores/baseline/change comparison
  | 'game1'
  | 'game2'
  | 'game3'
  | 'game4'
  | 'game5'
  | 'piano-sequence' // fixed-observation clinical sequencing task
  | 'submitting'
  | 'results';

/**
 * Every score is nullable by design.
 *
 * A task that was skipped, interrupted or failed to record produces `null`, not
 * a placeholder. A composite is only computed when every contributing domain has
 * a real recorded value, so a partially completed battery is recorded as
 * non-interpretable instead of looking like an average performance.
 */
export interface CognitiveScores {
  memoryScore: number | null;
  attentionScore: number | null;
  visuospatialScore: number | null;
  executiveScore: number | null;
  compositeScore: number | null;
  game1Score: number | null; // Focus Orbit (dot tracking)
  game2Score: number | null; // Cortex Match (memory match)
  game3Score: number | null; // Vocal Echo (voice repeat)
  game4Score: number | null; // Mimic Sync (facial tasks)
  game5Score: number | null; // Path Mapper (trail making)
  game6Score: number | null; // Piano Sequence (fixed observation)
}

export interface BiometricMetrics {
  eye: {
    reactionTimes: number[];
    fixationStability: number | null;
    blinkCount: number | null;
    avgEAR: number | null;
    trackingAccuracy: number | null;
  };
  face: {
    smileIntensity: number | null;
    jawOpening: number | null;
    eyebrowsRaising: number | null;
    stability: number | null;
    headPose: { yaw: number; pitch: number; roll: number } | null;
  };
  speech: {
    speechRate: number | null;
    pitch: number | null;
    jitter: number | null;
    shimmer: number | null;
    pauseCount: number | null;
    mfcc: number[] | null;
    duration: number | null;
  };
}

/**
 * What the participant chose on the language screen, including whether they were
 * told that task wording in that language is still under review. It survives a
 * session reset: re-answering a battery does not un-tell them.
 */
export interface LanguagePreference {
  language: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
}

interface ScreeningState {
  currentStep: ScreeningStep;
  rawResponses: Record<string, any>;
  scores: CognitiveScores;
  biometricMetrics: BiometricMetrics | null;
  isSubmitting: boolean;
  languagePreference: LanguagePreference | null;

  setStep: (step: ScreeningStep) => void;
  saveResponse: (domain: string, data: any) => void;
  setScores: (scores: CognitiveScores) => void;
  setSubmitting: (submitting: boolean) => void;
  setLanguagePreference: (preference: LanguagePreference | null) => void;
  resetSession: () => void;
  calculateFinalScores: () => void;
}

// No task has been performed yet, so no score exists. Zero would be a claim.
const initialScores: CognitiveScores = {
  memoryScore: null,
  attentionScore: null,
  visuospatialScore: null,
  executiveScore: null,
  compositeScore: null,
  game1Score: null,
  game2Score: null,
  game3Score: null,
  game4Score: null,
  game5Score: null,
  game6Score: null
};

/** Only a recorded finite number is a measurement. Anything else is absent. */
const recordedNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const recordedArray = (value: unknown): number[] => (Array.isArray(value) ? value : []);

/** Mean of recorded values, or null if any contributing value is missing. */
const meanIfComplete = (...values: Array<number | null>): number | null => {
  if (values.some(value => value === null)) return null;
  const total = values.reduce<number>((sum, value) => sum + (value as number), 0);
  return Math.round(total / values.length);
};

export const useScreeningStore = create<ScreeningState>((set, get) => ({
  currentStep: 'language-select',
  rawResponses: {},
  scores: initialScores,
  biometricMetrics: null,
  isSubmitting: false,
  languagePreference: null,

  setStep: (step: ScreeningStep) => set({ currentStep: step }),

  saveResponse: (domain: string, data: any) => {
    set((state) => ({
      rawResponses: {
        ...state.rawResponses,
        [domain]: data
      }
    }));
  },

  setScores: (scores: CognitiveScores) => set({ scores }),

  setSubmitting: (submitting: boolean) => set({ isSubmitting: submitting }),

  setLanguagePreference: (preference: LanguagePreference | null) => set({ languagePreference: preference }),

  // `languagePreference` deliberately survives: restarting the battery does not
  // undo the fact that the participant was told the wording is unverified.
  resetSession: () => set({
    currentStep: 'language-select',
    rawResponses: {},
    scores: initialScores,
    biometricMetrics: null,
    isSubmitting: false
  }),

  calculateFinalScores: () => {
    const { rawResponses } = get();

    // Fixed-observation clinical activities only. Adaptive practice is explicitly excluded.
    // A missing task yields null — it is never replaced with a plausible "normal" value.
    const g1Score = recordedNumber(rawResponses.game1?.score);
    const g2Score = recordedNumber(rawResponses.game2?.score);
    const g3Score = recordedNumber(rawResponses.game3?.score);
    const g4Score = recordedNumber(rawResponses.game4?.score);
    const g5Score = recordedNumber(rawResponses.game5?.score);
    const g6Score = recordedNumber(rawResponses.pianoSequence?.score)
      ?? recordedNumber(rawResponses.game6?.score);

    // Map fixed-observation tasks into cognitive domains (standardized observation, not adaptive practice):
    const memory = meanIfComplete(g2Score, g6Score); // Cortex Match + Piano Sequence (sequencing/recall)
    const attention = meanIfComplete(g1Score, g4Score); // Dot follow + gesture sync
    const spatial = g5Score; // Trail tracing maps visuospatial orientation
    const executive = meanIfComplete(g5Score, g2Score, g6Score); // Planning/flexibility/sequencing signals

    // The composite requires all four domains. Anything less is not interpretable.
    const composite = meanIfComplete(memory, attention, spatial, executive);

    // Biometric measurements are passed through exactly as recorded.
    const eye = {
      reactionTimes: recordedArray(rawResponses.game1?.reactionTimes),
      fixationStability: recordedNumber(rawResponses.game1?.fixationStability),
      blinkCount: recordedNumber(rawResponses.game1?.blinkCount),
      avgEAR: recordedNumber(rawResponses.game1?.avgEAR),
      trackingAccuracy: recordedNumber(rawResponses.game1?.trackingAccuracy)
    };

    const face = {
      smileIntensity: recordedNumber(rawResponses.game4?.smileIntensity),
      jawOpening: recordedNumber(rawResponses.game4?.jawOpening),
      eyebrowsRaising: recordedNumber(rawResponses.game4?.eyebrowsRaising),
      stability: recordedNumber(rawResponses.game4?.stability),
      headPose: rawResponses.game4?.headPose ?? null
    };

    const speech = {
      speechRate: recordedNumber(rawResponses.game3?.speechRate),
      pitch: recordedNumber(rawResponses.game3?.pitch),
      jitter: recordedNumber(rawResponses.game3?.jitter),
      shimmer: recordedNumber(rawResponses.game3?.shimmer),
      pauseCount: recordedNumber(rawResponses.game3?.pauseCount),
      mfcc: Array.isArray(rawResponses.game3?.mfcc) ? rawResponses.game3.mfcc : null,
      duration: recordedNumber(rawResponses.game3?.duration)
    };

    set({
      scores: {
        memoryScore: memory,
        attentionScore: attention,
        visuospatialScore: spatial,
        executiveScore: executive,
        compositeScore: composite,
        game1Score: g1Score,
        game2Score: g2Score,
        game3Score: g3Score,
        game4Score: g4Score,
        game5Score: g5Score,
        game6Score: g6Score
      },
      biometricMetrics: { eye, face, speech }
    });
  }
}));
