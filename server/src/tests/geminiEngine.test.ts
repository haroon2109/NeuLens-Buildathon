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
});
