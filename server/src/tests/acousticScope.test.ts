import { describe, it } from 'node:test';
import assert from 'node:assert';
import { toPatientAssessmentView } from '../services/patientAssessmentView';
import { scoreBatterySession } from '../services/sessionScoring';
import { summarizePatientChanges } from '../services/changeMonitor';

/**
 * Jitter and shimmer are measured through whatever microphone the participant
 * owns, and are dominated by hardware, codec, room noise and browser resampling.
 * They are kept as acoustic quality/engagement signals and must never reach a
 * cognitive score, a change comparison, or a patient-facing field.
 */
const matchingContext = {
  language: 'en',
  ageYears: 71,
  educationYears: 12,
  taskVersion: 'battery-v1',
  accessibility: { vision: 0, hearing: 0, motor: 0, digitalFamiliarity: 1 }
};

const voiceHeavySession = {
  game1: { score: 82 },
  game2: { score: 91 },
  game3: { score: 94 },
  game4: { score: 78 },
  game5: { score: 88 },
  pianoSequence: { score: 76 },
  voiceMetrics: { speechRate: 4.2, pauseScore: 88, jitter: 0.31, shimmer: 3.4 }
};

describe('Acoustic perturbation stays out of cognitive evidence', () => {
  it('does not enter a task score or the composite', () => {
    const clean = scoreBatterySession({
      game1: { score: 82 },
      game2: { score: 91 },
      game3: { score: 94 },
      game4: { score: 78 },
      game5: { score: 88 },
      pianoSequence: { score: 76 }
    });
    const noisy = scoreBatterySession(voiceHeavySession);

    assert.strictEqual(noisy.composite, clean.composite);
    assert.deepStrictEqual(noisy.domains, clean.domains);
  });

  it('is excluded from the patient-facing assessment view', () => {
    const view = toPatientAssessmentView({
      id: 'a1',
      date: '2026-04-01T00:00:00.000Z',
      status: 'COMPLETED',
      reviewStatus: 'REVIEWED',
      overallScore: 80,
      taskResponses: {},
      eyeMetrics: { reactionTime: 240, blinkRate: 12, fixationScore: 88 },
      voiceMetrics: { speechRate: 4.2, pauseScore: 88, jitter: 0.31, shimmer: 3.4 },
      faceMetrics: { symmetry: 94, tremorScore: 6 },
      report: { recommendation: 'Review', doctorNotes: 'Seen.' }
    });

    assert.deepStrictEqual(view.voiceMetrics, { speechRate: 4.2, pauseScore: 88 });
    const serialized = JSON.stringify(view);
    assert.strictEqual(/jitter|shimmer/i.test(serialized), false, 'raw acoustic perturbation must not be returned');
  });

  it('is not used to form a change comparison', () => {
    const summary = summarizePatientChanges([
      {
        id: 'a2',
        date: '2026-02-01T00:00:00.000Z',
        status: 'COMPLETED',
        overallScore: 80,
        voiceMetrics: { speechRate: 4.2, pauseScore: 70, jitter: 0.9, shimmer: 9 },
        taskResponses: {
          functionalCheckIn: {
            completedAt: '2026-02-01T00:00:00.000Z',
            activities: { appointments: 0, medication: 1, finances: 0, household: 0 },
            assessmentContext: matchingContext
          }
        }
      },
      {
        id: 'a1',
        date: '2026-01-01T00:00:00.000Z',
        status: 'COMPLETED',
        overallScore: 80,
        voiceMetrics: { speechRate: 4.2, pauseScore: 70, jitter: 0.1, shimmer: 0.5 },
        taskResponses: {
          functionalCheckIn: {
            completedAt: '2026-01-01T00:00:00.000Z',
            activities: { appointments: 0, medication: 1, finances: 0, household: 0 },
            assessmentContext: matchingContext
          }
        }
      }
    ] as never);

    // Identical scores, wildly different acoustic perturbation: the comparison
    // sees no change, because jitter is not part of it.
    assert.deepStrictEqual(summary.reviewReasons, []);
    assert.strictEqual(summary.cognitive.change, 0);
    assert.strictEqual(summary.cognitive.declineBeyondReliableChange, false);
  });
});
