import { HospitalDataStore } from '../../models/dataStore';
import { evaluateSafetyAccessibility } from './safetyAccessibilityEngine';
import { loadHistory } from './historyEngine';
import { runLongitudinalIntelligence } from './longitudinalIntelligenceEngine';
import { buildClinicalDocumentation } from './clinicalDocumentationEngine';
import { isInterpretableScore } from '../reviewState';
import type { AssessmentWorkflowOutput } from './types';

/**
 * NeuLens central workflow orchestrator (deterministic modules).
 * Order: Safety & Accessibility -> History -> Longitudinal Intelligence -> Evidence/Clinical Documentation -> Follow-up Coordination.
 * Cognitive/Signal task coordination happens client-side during capture; this server workflow organizes recorded observations.
 * LLM assistance is not used by default (no autonomous diagnosis/prescription); add only where it adds genuine, reviewable value.
 */
export async function runAssessmentCompletionWorkflow(userId: string, savedAssessment: any, taskResponses: unknown): Promise<AssessmentWorkflowOutput> {
  const stages: Array<{ key: string; engine: string; status: 'completed' | 'skipped'; summary: string }> = [];

  // 1. History & baseline (needed for safety/context-aware interpretation)
  const history = await loadHistory(userId, savedAssessment);
  // Only claim a baseline when one exists. A session whose score or check-in was
  // missing establishes none, and the pathway must not report otherwise.
  const baselineStatus = history.baselineCreated
    ? 'created provisional'
    : history.baseline ? 'active' : 'none established';
  stages.push({ key: 'history', engine: 'HistoryEngine', status: 'completed', summary: `Loaded baseline (${baselineStatus}) and ${history.assessmentsCount} completed assessment(s).` });

  // 2. Safety & Accessibility gate
  const safety = evaluateSafetyAccessibility(taskResponses, history.contextInputs);
  stages.push({
    key: 'safety_accessibility',
    engine: 'SafetyAccessibilityEngine',
    status: 'completed',
    summary: safety.canInterpretChange ? 'Session eligible for within-person comparison.' : `Change interpretation gated (${safety.sessionQuality.reasons.join(', ') || 'quality/comparability'}).`,
  });

  // 3. Longitudinal intelligence (change detection, evidence, uncertainty)
  const longitudinal = runLongitudinalIntelligence(history.assessments, safety);
  stages.push({ key: 'longitudinal_intelligence', engine: 'LongitudinalIntelligenceEngine', status: 'completed', summary: `Status ${longitudinal.status}; comparable assessments ${longitudinal.comparableAssessments}.` });

  // 4. Persist longitudinal record (deterministic, safety-aware).
  //    A session with no interpretable score produces no longitudinal point:
  //    there is nothing to plot, and a placeholder would fabricate a trend.
  const status = longitudinal.status;
  const interpretableScore = isInterpretableScore(savedAssessment.overallScore)
    ? savedAssessment.overallScore
    : null;
  const baselineScore = isInterpretableScore(history.baseline?.overallScore)
    ? history.baseline.overallScore
    : null;
  const longitudinalRecord = interpretableScore === null
    ? null
    : await HospitalDataStore.createLongitudinalRecord({
        userId,
        assessmentId: savedAssessment.id,
        overallScore: interpretableScore,
        changeFromBaseline:
          history.baselineCreated || baselineScore === null ? null : interpretableScore - baselineScore,
        trendDirection:
          history.baselineCreated || status === 'INSUFFICIENT_DATA' || longitudinal.changeSummary.cognitive.change == null
            ? null
            : (longitudinal.changeSummary.cognitive.change > 0.5 ? 'IMPROVING' : longitudinal.changeSummary.cognitive.change < -0.5 ? 'DECLINING' : 'STABLE'),
        assessmentsCount: history.assessmentsCount,
      });
  stages.push({
    key: 'longitudinal_record',
    engine: 'HistoryEngine',
    status: interpretableScore === null ? 'skipped' : 'completed',
    summary: interpretableScore === null
      ? 'No longitudinal record written: the session produced no interpretable score.'
      : 'Longitudinal record persisted.'
  });

  // 5. Persist change detection (safety-aware outcome, always recorded)
  const changeDetection = await HospitalDataStore.createChangeDetection({
    userId,
    baselineId: history.baseline?.id ?? null,
    status,
    cognitiveChange: longitudinal.cognitiveChange,
    outsideBaseline: longitudinal.outsideBaseline,
    reviewReasons: longitudinal.reviewReasons,
  });
  stages.push({ key: 'change_detection', engine: 'ChangeDetectionEngine', status: 'completed', summary: `Change detection recorded (${status}).` });

  // 6. Clinical context + documentation (evidence, pathway, prevention) and follow-up coordination
  const hasContext = (history.contextInputs || []).length > 0 || !!(taskResponses as any)?.contextFactors;
  const doc = buildClinicalDocumentation({
    baselineCreated: history.baselineCreated,
    hasBaseline: Boolean(history.baseline),
    status,
    safety,
    longitudinal,
    assessmentsCount: history.assessmentsCount,
    hasContext,
    reviewStatus: savedAssessment.reviewStatus,
    taskResponses,
    contextInputs: history.contextInputs,
  });
  stages.push({ key: 'clinical_documentation', engine: 'ClinicalDocumentationEngine', status: 'completed', summary: 'Source-linked draft observations, pathway, and prevention suggestions prepared for clinician review.' });
  stages.push({ key: 'follow_up_coordination', engine: 'FollowUpCoordinationEngine', status: 'completed', summary: doc.followUp.requiresClinicalReview ? 'Clinical review and closed-loop follow-up flagged.' : 'Routine longitudinal follow-up planned.' });

  // 7. Brain health profile (clinician-in-the-loop)
  //    No risk tier is derived here. The profile records the descriptive score
  //    (or its absence) and an administrative review signal only.
  const brainHealthProfile = await HospitalDataStore.createBrainHealthProfile({
    userId,
    changeDetectionId: changeDetection.id,
    profileScore: interpretableScore,
    reviewSignal: interpretableScore === null
      ? 'NOT_INTERPRETABLE'
      : status === 'REVIEW' ? 'REVIEW_PROMPT' : 'NOT_REVIEWED',
    interpretation: doc.interpretation,
    nextSteps: doc.nextSteps,
  });
  stages.push({ key: 'profile', engine: 'ClinicalDocumentationEngine', status: 'completed', summary: 'Brain health profile drafted (clinician review required for actions/referrals).' });

  const message = safety.sessionQuality.comparable
    ? 'Assessment completed and longitudinal brain-health record updated with safety-gated change detection.'
    : 'Assessment completed. Session saved but excluded from change interpretation due to quality/comparability safety gates.';

  return {
    success: true,
    message,
    assessment: savedAssessment,
    baseline: history.baseline,
    longitudinalRecord,
    changeDetection,
    brainHealthProfile,
    platform: {
      pathway: doc.pathway,
      baselineType: history.baselineCreated
        ? 'PROVISIONAL_PERSONAL_BASELINE'
        : history.baseline ? 'PERSONAL_BASELINE' : 'NONE_ESTABLISHED',
      sessionQuality: safety.sessionQuality,
      meaningfulChange: {
        status,
        cognitiveChange: longitudinal.cognitiveChange,
        outsideBaseline: longitudinal.outsideBaseline,
        comparableAssessments: longitudinal.comparableAssessments,
        reviewReasons: longitudinal.reviewReasons,
      },
      personalizedPrevention: {
        signals: doc.preventionSignals,
        note: 'Supportive, non-diagnostic suggestions to discuss with a clinician; not medical advice or a treatment plan.',
      },
      clinicianInLoop: {
        reviewStatus: savedAssessment.reviewStatus,
        requiresClinicalReview: status === 'REVIEW',
        referralDecision: doc.followUp.referralDecision,
      },
      followUp: {
        recommended: doc.followUp.recommended,
        cadence: doc.followUp.cadence,
        closedLoop: doc.followUp.closedLoop,
      },
    },
    // The evidence and limitations were computed but never returned, so the
    // "source-linked draft" the documentation describes was not actually
    // available to any caller. It carries the recorded limitations (including the
    // administration language) so they travel with the result.
    documentation: {
      evidence: doc.evidence
    },
    workflow: {
      architecture: 'deterministic-orchestrator-v1',
      stages,
      llmAssistance: {
        used: false,
        areas: [],
        note: 'No LLM-generated diagnosis, prescription, or autonomous clinical decision. Deterministic modules produced this draft for clinician review.',
      },
    },
  };
}
