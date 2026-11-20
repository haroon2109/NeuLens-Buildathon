import { Response, NextFunction } from 'express';
import { HospitalDataStore } from '../models/dataStore';
import { AuthenticatedRequest } from '../middleware/auth';
import { runAssessmentCompletionWorkflow } from '../services/workflow';
import { patientSubmitAssessmentSchema } from '../validation/schemas';
import { reviewStateForAssessment } from '../services/reviewState';
import { scoreBatterySession } from '../services/sessionScoring';
import { languageSubmissionGate } from '../services/assessmentLanguageReadiness';
import { importExternalContext } from '../services/fhirContext';

export const submitAssessmentComplete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    // Strict parse: a client cannot submit a score, a risk tier or an undeclared
    // field. Missing measurements stay null rather than becoming placeholders.
    const validated = patientSubmitAssessmentSchema.parse(req.body);
    const {
      language,
      languageAcknowledged,
      reactionTime,
      blinkRate,
      fixationScore,
      speechRate,
      pauseScore,
      jitter,
      shimmer,
      symmetry,
      tremorScore,
      taskResponses: submittedResponses,
      recommendation
    } = validated;

    const taskResponses: Record<string, any> = { ...(submittedResponses || {}) };

    // The administration language is never inferred from the UI locale: the
    // session states it, and the server checks that language against its own
    // readiness registry rather than trusting the client's claim of readiness.
    const administeredLanguage =
      language
      || (taskResponses.assessmentContext?.language as string | undefined)
      || (taskResponses.functionalCheckIn?.assessmentContext?.language as string | undefined)
      || 'en';
    const gate = languageSubmissionGate(administeredLanguage, languageAcknowledged === true);

    if (!gate.allowed) {
      // Refusing is the point: previously nothing consulted the registry, so an
      // Arabic participant was quietly run through English task wording with no
      // record that the wording had never been reviewed.
      return res.status(422).json({
        error: 'LANGUAGE_NOT_VALIDATED',
        message: gate.readiness
          ? `Task wording in ${gate.readiness.language} is still under review (${gate.pendingStages
              .map((stage) => stage.label.toLowerCase())
              .join(', ')}). Tell the participant what is unverified and resubmit with their acknowledgement, or administer the battery in a task-ready language.`
          : `"${administeredLanguage}" is not a language this build can administer. Choose one of the supported languages.`,
        language: gate.readiness?.language ?? administeredLanguage,
        pendingStages: gate.pendingStages.map((stage) => ({ key: stage.key, status: stage.status })),
        acknowledgementRequired: gate.acknowledgementRequired
      });
    }

    // Provenance travels with the record, so a clinician reading this session can
    // see which language it was administered in and what was still unverified.
    taskResponses.languageReadiness = {
      language: gate.readiness?.language ?? administeredLanguage,
      taskAdministrationReady: gate.taskAdministrationReady,
      acknowledged: !gate.taskAdministrationReady && languageAcknowledged === true,
      pendingStages: gate.pendingStages.map((stage) => stage.key),
      recordedAt: new Date().toISOString()
    };

    // Patient-consented FHIR R4 context, read-only and limited to the supported
    // LOINC list. Consent is read from the session record, not the query string,
    // and a failure here is recorded on the session rather than blocking it: the
    // screening result never depends on an external system being reachable.
    try {
      const externalContext = await importExternalContext(
        taskResponses.externalContextConsent?.granted === true,
        req.user.patientId || req.user.id
      );
      if (externalContext) taskResponses.externalContext = externalContext;
    } catch (error) {
      console.error('[FHIR R4]: context import skipped:', error instanceof Error ? error.message : error);
    }

    // The score comes from the recorded task responses, never from the request.
    const battery = scoreBatterySession(taskResponses);

    // What the session actually measured, and why anything was not measured.
    // Derived from the records, so the clinician reads observed coverage rather
    // than a claim the browser made about itself.
    taskResponses.administration = battery.coverage;

    const assessmentData = {
      overallScore: battery.composite,
      reactionTime: reactionTime ?? null,
      blinkRate: blinkRate ?? null,
      fixationScore: fixationScore ?? null,
      speechRate: speechRate ?? null,
      pauseScore: pauseScore ?? null,
      jitter: jitter ?? null,
      shimmer: shimmer ?? null,
      symmetry: symmetry ?? null,
      tremorScore: tremorScore ?? null,
      taskResponses,
      recommendation
    };

    // 1. Persist assessment (creates assessment record; review state is derived
    //    from what was actually recorded, never supplied by the browser).
    const savedAssessment = await HospitalDataStore.submitAssessment(req.user.id, assessmentData);

    // 2. Run deterministic NeuLens workflow:
    //    Safety & Accessibility -> History/Baseline -> Longitudinal Intelligence (change/evidence/uncertainty)
    //    -> Clinical Documentation (source-linked draft) -> Follow-up Coordination (clinician-owned actions).
    const result = await runAssessmentCompletionWorkflow(req.user.id, savedAssessment, taskResponses);

    // 3. Persist the administrative review state that the deterministic rules produced.
    const changeStatus = result.platform?.meaningfulChange?.status ?? null;
    const reviewState = reviewStateForAssessment(savedAssessment.overallScore, changeStatus);
    if (reviewState !== savedAssessment.reviewState) {
      await HospitalDataStore.setAssessmentReviewState(savedAssessment.id, reviewState);
      savedAssessment.reviewState = reviewState;
      result.assessment = savedAssessment;
    }

    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};
