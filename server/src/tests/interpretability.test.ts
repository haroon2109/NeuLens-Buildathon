import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HospitalDataStore } from '../models/dataStore';
import type { AssessmentRecord } from '../models/dataStore';
import { summarizePatientChanges } from '../services/changeMonitor';
import { runAssessmentCompletionWorkflow } from '../services/workflow';
import { patientSubmitAssessmentSchema, screeningSubmitSchema } from '../validation/schemas';
import { reviewStateForAssessment, toReviewState } from '../services/reviewState';
import { scoreBatterySession } from '../services/sessionScoring';

/**
 * A battery that nobody completed must produce nothing interpretable.
 *
 * Before these tests, a fully skipped session received placeholder task scores
 * (85 / 90 / 80 / 78 / 80), a composite fallback of 84, per-metric defaults
 * (fixation 85, symmetry 94, …) and a LOW risk tier. The session therefore looked
 * like a normal screening and fed the longitudinal baseline.
 */

const blankSubmission = {
  overallScore: null,
  reactionTime: null,
  blinkRate: null,
  fixationScore: null,
  speechRate: null,
  pauseScore: null,
  jitter: null,
  shimmer: null,
  symmetry: null,
  tremorScore: null,
  taskResponses: {},
  recommendation: 'Session ended before any activity was completed.'
};

// The wire body: no score is accepted from the client at all.
const { overallScore: _clientSuppliedScore, ...blankBody } = blankSubmission;

const checkIn = (date: string, activities: Record<string, number>) => ({
  completedAt: date,
  activities,
  contextFactors: { sleep: 0, activity: 0, moodStress: 0 },
  assessmentContext: {
    language: 'en' as const,
    ageYears: 70,
    educationYears: 12,
    taskVersion: 'neulens-mvp-0.1',
    accessibility: { vision: 0, hearing: 0, motor: 0, digitalFamiliarity: 0 }
  }
});

const unscoredAssessment = (id: string, date: string): AssessmentRecord => ({
  id,
  userId: 'skipped-battery-patient',
  date: new Date(date),
  overallScore: null,
  reviewState: 'NOT_INTERPRETABLE',
  status: 'COMPLETED',
  reviewStatus: 'PENDING_REVIEW',
  taskResponses: {
    functionalCheckIn: checkIn(date, { appointments: 0, medication: 0, finances: 0, household: 0 })
  }
});

describe('Non-interpretable sessions produce no interpretable output', () => {
  describe('submission contract', () => {
    it('rejects a client-supplied score or risk tier', () => {
      // A claim the browser has no standing to make.
      assert.strictEqual(patientSubmitAssessmentSchema.safeParse({ overallScore: 80 }).success, false);
      assert.strictEqual(patientSubmitAssessmentSchema.safeParse({ overallScore: null }).success, false);
      assert.strictEqual(patientSubmitAssessmentSchema.safeParse({
        taskResponses: {},
        riskLevel: 'LOW'
      }).success, false);

      assert.strictEqual(screeningSubmitSchema.safeParse({
        overallScore: 80,
        recommendation: 'anything'
      }).success, false);
      assert.strictEqual(screeningSubmitSchema.safeParse({
        riskLevel: 'HIGH',
        recommendation: 'anything'
      }).success, false);
    });

    it('names the offending field instead of a blanket validation error', () => {
      const outOfRange = patientSubmitAssessmentSchema.safeParse({
        taskResponses: {
          functionalCheckIn: {
            completedAt: '2026-11-01T09:00:00.000Z',
            contextFactors: { sleep: 0, activity: 1, moodStress: 0 },
            assessmentContext: {
              language: 'en',
              ageYears: 71,
              educationYears: 12,
              taskVersion: 'neulens-mvp-0.1',
              accessibility: { vision: 0, hearing: 0, motor: 0, digitalFamiliarity: 0 }
            },
            activities: { appointments: 0, medication: 9, finances: 1, household: 0 }
          }
        }
      });
      assert.strictEqual(outOfRange.success, false);
      assert.deepStrictEqual(
        outOfRange.error?.issues[0].path,
        ['taskResponses', 'functionalCheckIn', 'activities', 'medication']
      );

      const strayKey = patientSubmitAssessmentSchema.safeParse({
        taskResponses: {
          functionalCheckIn: {
            completedAt: '2026-11-01T09:00:00.000Z',
            contextFactors: { sleep: 0, activity: 1, moodStress: 0 },
            assessmentContext: {
              language: 'en',
              ageYears: 71,
              educationYears: 12,
              taskVersion: 'neulens-mvp-0.1',
              accessibility: { vision: 0, hearing: 0, motor: 0, digitalFamiliarity: 0 }
            },
            activities: { appointments: 0, medication: 1, finances: 1, household: 0 },
            quality: { comparable: true }
          }
        }
      });
      assert.strictEqual(strayKey.success, false);
      assert.deepStrictEqual(
        strayKey.error?.issues[0].path,
        ['taskResponses', 'functionalCheckIn', 'quality']
      );
    });

    it('never fills absent measurements with placeholder defaults', () => {
      const parsed = patientSubmitAssessmentSchema.parse({});
      assert.strictEqual(parsed.fixationScore, undefined);
      assert.strictEqual(parsed.symmetry, undefined);
      assert.strictEqual(parsed.jitter, undefined);
      assert.strictEqual(parsed.recommendation, undefined);
    });

    it('accepts a session with no score at all', () => {
      const parsed = patientSubmitAssessmentSchema.parse(blankBody);
      assert.strictEqual(parsed.reactionTime, null);
      assert.strictEqual(parsed.fixationScore, null);
      assert.strictEqual('overallScore' in parsed, false);
    });
  });

  describe('a fully skipped battery', () => {
    it('stores no score, no metrics and a non-interpretable review state', async () => {
      const { user: patient } = await HospitalDataStore.createPatient({
        name: 'Skipped Battery Patient',
        age: 74,
        dob: '1952',
        pin: '7777',
        gender: 'FEMALE',
        language: 'en',
        educationYears: 12,
        handedness: 'RIGHT'
      });

      const saved = await HospitalDataStore.submitAssessment(patient.id, blankSubmission);

      assert.strictEqual(saved.overallScore, null, 'no score may be invented');
      assert.strictEqual(saved.reviewState, 'NOT_INTERPRETABLE');
      assert.strictEqual(saved.eyeMetrics, null);
      assert.strictEqual(saved.voiceMetrics, null);
      assert.strictEqual(saved.faceMetrics, null);
      assert.match(saved.report?.recommendation || '', /without an interpretable score/i);
    });

    it('writes no baseline, no longitudinal point and no profile score', async () => {
      const { user: patient } = await HospitalDataStore.createPatient({
        name: 'No Baseline Patient',
        age: 77,
        dob: '1949',
        pin: '8888',
        gender: 'MALE',
        language: 'en',
        educationYears: 10,
        handedness: 'RIGHT'
      });

      const saved = await HospitalDataStore.submitAssessment(patient.id, blankSubmission);
      const result = await runAssessmentCompletionWorkflow(patient.id, saved, {});

      assert.strictEqual(result.baseline, null, 'a skipped session cannot become a baseline');
      assert.strictEqual(result.longitudinalRecord, null, 'a skipped session cannot produce a trend point');
      assert.strictEqual(result.brainHealthProfile.profileScore, null);
      assert.strictEqual(result.brainHealthProfile.reviewSignal, 'NOT_INTERPRETABLE');
      assert.strictEqual(result.platform.meaningfulChange.status, 'INSUFFICIENT_DATA');

      // The pathway must not claim a baseline the record does not have.
      const baselineStage = result.platform.pathway.find((stage: any) => stage.key === 'personal_baseline');
      assert.strictEqual(baselineStage.state, 'NOT_ESTABLISHED');
      assert.match(baselineStage.summary, /no personal baseline is established/i);
      assert.strictEqual(result.platform.baselineType, 'NONE_ESTABLISHED');
      assert.strictEqual(result.changeDetection.baselineId, null);
    });

    it('yields no change summary numbers', async () => {
      const summary = summarizePatientChanges([unscoredAssessment('a1', '2026-01-01T00:00:00.000Z')]);

      assert.strictEqual(summary.status, 'INSUFFICIENT_DATA');
      assert.strictEqual(summary.cognitive.latestScore, null);
      assert.strictEqual(summary.cognitive.previousScore, null);
      assert.strictEqual(summary.cognitive.change, null);
      assert.strictEqual(summary.cognitive.baselineRange, null);
      assert.strictEqual(summary.cognitive.declineBeyondReliableChange, false);
      assert.strictEqual(summary.cognitive.reliability.state, 'NOT_ESTABLISHED');
      assert.strictEqual(summary.cognitive.reliability.reliableChangeThreshold, null);
    });

    it('never forms a personal range from unscored sessions', () => {
      const summary = summarizePatientChanges([
        unscoredAssessment('a4', '2026-04-01T00:00:00.000Z'),
        unscoredAssessment('a3', '2026-03-01T00:00:00.000Z'),
        unscoredAssessment('a2', '2026-02-01T00:00:00.000Z'),
        unscoredAssessment('a1', '2026-01-01T00:00:00.000Z')
      ]);

      assert.strictEqual(summary.status, 'INSUFFICIENT_DATA');
      assert.strictEqual(summary.cognitive.baselineRange, null);
      assert.strictEqual(summary.cognitive.comparableAssessments, 0);
      assert.strictEqual(summary.cognitive.change, null);
    });

    it('does not let one real score be compared against missing data', async () => {
      const { user: patient } = await HospitalDataStore.createPatient({
        name: 'Mixed Data Patient',
        age: 69,
        dob: '1957',
        pin: '9999',
        gender: 'MALE',
        language: 'en',
        educationYears: 14,
        handedness: 'RIGHT'
      });

      const scored = await HospitalDataStore.submitAssessment(patient.id, {
        ...blankSubmission,
        overallScore: 72,
        reactionTime: 260,
        blinkRate: 14,
        fixationScore: 80
      });
      const skipped = await HospitalDataStore.submitAssessment(patient.id, blankSubmission);

      assert.strictEqual(scored.overallScore, 72);
      assert.strictEqual(skipped.overallScore, null);

      // The scored session is comparable only with other recorded scores, so a
      // single score still cannot produce a change conclusion.
      const summary = summarizePatientChanges([skipped, scored]);
      assert.strictEqual(summary.cognitive.latestScore, 72);
      assert.strictEqual(summary.cognitive.change, null);
      assert.strictEqual(summary.status, 'INSUFFICIENT_DATA');
    });
  });

  describe('server-side scoring', () => {
    it('derives the composite from recorded task responses', () => {
      const battery = scoreBatterySession({
        game1: { score: 80 },
        game2: { score: 60 },
        game3: { score: 100 },
        game4: { score: 90 },
        game5: { score: 70 },
        pianoSequence: { score: 50 }
      });

      // memory 55, attention 85, visuospatial 70, executive 60 → 270 / 4 = 67.5
      assert.deepStrictEqual(battery.domains, {
        memory: 55,
        attention: 85,
        visuospatial: 70,
        executive: 60
      });
      assert.strictEqual(battery.composite, 68);
      assert.strictEqual(battery.complete, true);
    });

    it('produces no composite when a domain has no recorded task', () => {
      const battery = scoreBatterySession({ game1: { score: 80 }, game2: { score: 60 } });

      assert.strictEqual(battery.domains.visuospatial, null);
      assert.strictEqual(battery.composite, null);
      assert.strictEqual(battery.complete, false);
    });

    it('scores an accepted wire body from its tasks alone', () => {
      const parsed = patientSubmitAssessmentSchema.parse({
        taskResponses: {
          game1: { score: 80 },
          game2: { score: 60 },
          game4: { score: 90 },
          game5: { score: 70 },
          pianoSequence: { score: 50 }
        }
      });
      assert.strictEqual(scoreBatterySession(parsed.taskResponses).composite, 68);

      const blank = patientSubmitAssessmentSchema.parse(blankBody);
      assert.strictEqual(scoreBatterySession(blank.taskResponses).composite, null);
    });

    it('does not invent a score from missing or malformed task entries', () => {
      const battery = scoreBatterySession({ game1: {}, game2: { score: 'eighty' }, game5: null });

      assert.strictEqual(battery.taskScores.game1, null);
      assert.strictEqual(battery.taskScores.game2, null);
      assert.strictEqual(battery.taskScores.game5, null);
      assert.strictEqual(battery.composite, null);
    });
  });

  describe('review state semantics', () => {
    it('maps a missing score to NOT_INTERPRETABLE and a recorded score to NOT_REVIEWED', () => {
      assert.strictEqual(reviewStateForAssessment(null), 'NOT_INTERPRETABLE');
      assert.strictEqual(reviewStateForAssessment(Number.NaN), 'NOT_INTERPRETABLE');
      assert.strictEqual(reviewStateForAssessment(72), 'NOT_REVIEWED');
      assert.strictEqual(reviewStateForAssessment(72, 'REVIEW'), 'REVIEW_PROMPT');
    });

    it('collapses legacy risk tiers instead of reinterpreting them as clinical signals', () => {
      assert.strictEqual(toReviewState('LOW'), 'NOT_REVIEWED');
      assert.strictEqual(toReviewState('MODERATE'), 'NOT_REVIEWED');
      assert.strictEqual(toReviewState('HIGH'), 'NOT_REVIEWED');
      assert.strictEqual(toReviewState('UNRATED'), 'NOT_REVIEWED');
      assert.strictEqual(toReviewState('REVIEWED'), 'CLINICIAN_REVIEWED');
      assert.strictEqual(toReviewState('REVIEW_PROMPT'), 'REVIEW_PROMPT');
    });
  });
});
