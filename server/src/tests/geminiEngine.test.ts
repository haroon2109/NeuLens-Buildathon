/**
 * Google Gemini Core AI Engine Tests (Google Startup Buildathon India 2026)
 *
 * Verifies the 4 Core Gemini capabilities:
 * 1. Generating structured clinician-facing summaries.
 * 2. Interpreting assessment metadata and task responses.
 * 3. Explaining observed changes in understandable language (personal baseline & RCI).
 * 4. Multilingual instructions and patient-friendly explanations (Tamil, Hindi, English).
 *
 * STRICT SAFETY RULE:
 * Verifies that all outputs follow strict JSON schemas and strictly refuse to independently diagnose cognitive impairment.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateClinicianSummary,
  interpretAssessmentMetadata,
  explainObservedChanges,
  generateMultilingualInstructions,
  ClinicianSummarySchema,
  MetadataInterpretationSchema,
  ObservedChangeExplanationSchema,
  MultilingualInstructionsSchema
} from '../services/geminiService';

describe('Google Gemini Core AI Engine — Buildathon Strict Contracts', () => {
  test('1. Generates structured clinician-facing summaries with mandatory disclaimer', async () => {
    const summary = await generateClinicianSummary({
      patientAge: 68,
      educationYears: 12,
      overallScore: 78.5,
      taskResponses: {
        game1: { fixationHoldPct: 82.4 },
        game2: { score: 85 },
        game3: { wpm: 118 },
        game4: { score: 90 },
        game5: { errors: 1 }
      },
      qualityRating: 'GOOD',
      language: 'en'
    });

    const validated = ClinicianSummarySchema.parse(summary);
    assert.ok(validated.executiveSummary.length > 10, 'Executive summary must be populated');
    assert.ok(validated.domainFindings.length >= 3, 'Must contain multi-domain observations');
    assert.strictEqual(
      validated.diagnosticDisclaimer,
      'EXPLORATORY_DECISION_SUPPORT_ONLY_NOT_A_DIAGNOSIS',
      'Must strictly enforce non-diagnostic boundary'
    );
  });

  test('2. Interprets assessment metadata and task responses without diagnostic projection', async () => {
    const interpretation = await interpretAssessmentMetadata({
      telemetry: {
        eyeAspectRatio: 0.28,
        saccadicJitter: 0.12,
        audioConfidence: 0.94,
        faceTrackingFps: 59.8
      },
      educationYears: 7,
      contextFactors: { sleepHours: 7.5 }
    });

    const validated = MetadataInterpretationSchema.parse(interpretation);
    assert.ok(
      ['HIGH_CONFIDENCE', 'ACCEPTABLE_WITH_CAUTION', 'INSUFFICIENT_QUALITY'].includes(
        validated.dataIntegrityVerdict
      )
    );
    assert.ok(validated.taskTelemetryInterpretation.ocular.length > 5);
    assert.ok(validated.taskTelemetryInterpretation.memory.length > 5);
    assert.ok(validated.nonDiagnosticNotice.length > 10);
  });

  test('3. Explains observed changes in understandable language (within baseline vs shift)', async () => {
    // Case A: Within personal baseline
    const stable = await explainObservedChanges({
      currentScore: 82,
      baselineScore: 83.5,
      scoreDelta: -1.5,
      comparableSessionsCount: 4,
      language: 'en'
    });
    const validatedStable = ObservedChangeExplanationSchema.parse(stable);
    assert.strictEqual(validatedStable.trajectoryClassification, 'WITHIN_PERSONAL_BASELINE');
    assert.ok(validatedStable.patientExplanation.length > 10);

    // Case B: Shift beyond Reliable Change Index threshold (<= -5.0)
    const shifted = await explainObservedChanges({
      currentScore: 74,
      baselineScore: 81.0,
      scoreDelta: -7.0,
      comparableSessionsCount: 4,
      changedDomains: ['Ocular Fixation', 'Trail Making Sequencing'],
      language: 'en'
    });
    const validatedShifted = ObservedChangeExplanationSchema.parse(shifted);
    assert.strictEqual(validatedShifted.trajectoryClassification, 'CHANGE_BEYOND_RELIABLE_THRESHOLD');
    assert.ok(!validatedShifted.patientExplanation.toLowerCase().includes('dementia'));
  });

  test('4. Generates culturally adapted multilingual instructions in Tamil, Hindi, and English', async () => {
    const tamil = await generateMultilingualInstructions({
      task: 'CORTEX_MATCH',
      language: 'ta'
    });
    const validatedTamil = MultilingualInstructionsSchema.parse(tamil);
    assert.strictEqual(validatedTamil.language, 'ta');
    assert.ok(validatedTamil.stepByStepInstructions.length >= 2);
    assert.ok(validatedTamil.culturalStimuliContext.includes('விளக்கு'));

    const hindi = await generateMultilingualInstructions({
      task: 'CORTEX_MATCH',
      language: 'hi'
    });
    const validatedHindi = MultilingualInstructionsSchema.parse(hindi);
    assert.strictEqual(validatedHindi.language, 'hi');
    assert.ok(validatedHindi.culturalStimuliContext.includes('दीया'));

    const english = await generateMultilingualInstructions({
      task: 'CORTEX_MATCH',
      language: 'en'
    });
    const validatedEnglish = MultilingualInstructionsSchema.parse(english);
    assert.strictEqual(validatedEnglish.language, 'en');
    assert.ok(validatedEnglish.culturalStimuliContext.includes('Diya'));
  });

  test('5. generateClinicalInsight synthesizes with Google Gemma 2 (2B) for offline rural PHC triage', async () => {
    const { generateClinicalInsight } = await import('../services/geminiClinicalService');
    const result = await generateClinicalInsight({
      patient: {
        patientId: 'PT-RURAL-001',
        age: 71,
        gender: 'FEMALE',
        language: 'ta'
      },
      assessment: {
        id: 'ASM-RURAL-789',
        date: new Date().toISOString(),
        score: 68,
        classification: 'MILD_DIVERGENCE'
      },
      metrics: {
        saccadicLatencyMs: 340,
        fixationHoldScore: 78,
        memoryMatchedPairs: 2,
        speechRateWpm: 92,
        pitchHz: 155,
        facialSymmetryPct: 83,
        trailBCompletionSec: 65,
        sequencingErrors: 2
      },
      modelPreference: 'gemma-2-2b'
    });

    assert.ok(result.executiveSummary.length > 20);
    assert.ok(result.modelUsed.includes('Gemma 2'));
    assert.strictEqual(result.provider, 'google-gemma-local');
    assert.ok(result.domainFindings.ocular.includes('340'));
  });

  test('6. generateClinicalInsight shields $5 credits via in-memory prompt cache', async () => {
    const { generateClinicalInsight } = await import('../services/geminiClinicalService');
    const req = {
      patient: {
        patientId: 'PT-CACHE-002',
        age: 65,
        gender: 'MALE',
        language: 'hi'
      },
      assessment: {
        id: 'ASM-CACHE-456',
        date: new Date().toISOString(),
        score: 84,
        classification: 'OPTIMAL'
      },
      metrics: {
        saccadicLatencyMs: 230,
        fixationHoldScore: 92,
        memoryMatchedPairs: 4,
        speechRateWpm: 125,
        pitchHz: 135,
        facialSymmetryPct: 96,
        trailBCompletionSec: 38,
        sequencingErrors: 0
      },
      modelPreference: 'gemma-2-2b' as const
    };

    const run1 = await generateClinicalInsight(req);
    assert.strictEqual(run1.cached, undefined);

    // Second call with same inputs triggers instant credit-guard cache (0ms, $0.00 cost)
    const run2 = await generateClinicalInsight(req);
    assert.strictEqual(run2.cached, true);
    assert.strictEqual(run2.executiveSummary, run1.executiveSummary);
  });

  test('7. GeminiKeyPool seamlessly fails over between personal and collaborator keys on 429 quota limits', async () => {
    const { GeminiKeyPool } = await import('../services/geminiService');
    const pool = GeminiKeyPool.getInstance();

    const origPrimary = process.env.GEMINI_API_KEY;
    const origCollab = process.env.COLLABORATOR_GEMINI_API_KEY;

    try {
      process.env.GEMINI_API_KEY = 'test_primary_key_abc123';
      process.env.COLLABORATOR_GEMINI_API_KEY = 'test_collab_key_xyz789';

      const keys = pool.refreshKeys();
      assert.ok(keys.includes('test_primary_key_abc123'));
      assert.ok(keys.includes('test_collab_key_xyz789'));

      // Simulate primary key failing with 429 Rate Limit
      const key1 = pool.getActiveKey();
      assert.strictEqual(key1, 'test_primary_key_abc123');

      // Failover occurs
      const key2 = pool.markFailed(key1, '429 Quota Exceeded');
      assert.strictEqual(key2, 'test_collab_key_xyz789');

      // Subsequent retrieval uses the healthy collaborator key
      assert.strictEqual(pool.getActiveKey(), 'test_collab_key_xyz789');

      // Test automatic failover wrapper
      let attemptCount = 0;
      const result = await pool.executeWithFailover(async (activeKey) => {
        attemptCount++;
        if (activeKey === 'test_primary_key_abc123') {
          throw new Error('429 RESOURCE_EXHAUSTED: Quota exceeded for project');
        }
        return `SUCCESS_WITH_${activeKey}`;
      });

      assert.strictEqual(result, 'SUCCESS_WITH_test_collab_key_xyz789');
      assert.strictEqual(attemptCount, 1); // was already rotated to collaborator key!
    } finally {
      process.env.GEMINI_API_KEY = origPrimary;
      process.env.COLLABORATOR_GEMINI_API_KEY = origCollab;
      pool.refreshKeys();
    }
  });
});
