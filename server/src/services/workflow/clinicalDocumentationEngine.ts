import { MIN_PAIRS_FOR_RELIABLE_CHANGE } from '../changeMonitor';
import { collectPreventionSignals } from './clinicalContextEngine';
import type { ClinicalDocumentationResult, FollowUpCoordinationResult, LongitudinalIntelligenceResult, SafetyAccessibilityResult } from './types';

function buildPathway(args: {
  baselineCreated: boolean;
  hasBaseline: boolean;
  status: 'INSUFFICIENT_DATA' | 'NO_CHANGE' | 'REVIEW';
  comparable: boolean;
  assessmentsCount: number;
  hasContext: boolean;
  requiresClinicalReview: boolean;
  reviewStatus: string;
}) {
  const { baselineCreated, hasBaseline, status, comparable, assessmentsCount, hasContext, requiresClinicalReview, reviewStatus } = args;
  const baselineStage = baselineCreated
    ? { state: 'PROVISIONAL', summary: 'First comparable-quality screening established a provisional personal brain-health baseline.' }
    : hasBaseline
      ? { state: 'ACTIVE', summary: 'Personal brain-health baseline is available for within-person comparison.' }
      : { state: 'NOT_ESTABLISHED', summary: 'No personal baseline is established yet: this session has no recorded comparison point.' };

  const changeStage = !comparable
    ? { state: 'SAFETY_GATED', summary: 'This session did not meet quality/comparability gates, so it was not interpreted as change.' }
    : status === 'INSUFFICIENT_DATA'
      ? { state: 'INSUFFICIENT_DATA', summary: 'Not enough comparable sessions yet to determine meaningful change; continue follow-up.' }
      : status === 'REVIEW'
        ? { state: 'REVIEW_SIGNAL', summary: 'A meaningful review signal was detected relative to personal baseline and comparable history.' }
        : { state: 'WITHIN_PERSONAL_RANGE', summary: 'Recent comparable observations are within the recorded personal range.' };

  const referralState = requiresClinicalReview
    ? 'CLINICAL_REVIEW_RECOMMENDED'
    : reviewStatus === 'REVIEWED' ? 'CLINICIAN_REVIEWED' : 'MONITORING';

  return [
    {
      stage: 1,
      key: 'population_signals_and_screening',
      title: 'Population signals and screening',
      state: 'COLLECTED',
      summary: 'Collected cognitive, functional, and available lifestyle/health/context screening signals for this session.',
      details: { hasHealthContext: hasContext }
    },
    {
      stage: 2,
      key: 'personal_baseline',
      title: 'Personal baseline',
      state: baselineStage.state,
      summary: baselineStage.summary,
      details: { assessmentsCount }
    },
    {
      stage: 3,
      key: 'meaningful_change_detection',
      title: 'Meaningful change detection',
      state: changeStage.state,
      summary: `${changeStage.summary} Normal variation and measurement quality are considered; poor quality is never treated as decline.`,
    },
    {
      stage: 4,
      key: 'personalized_prevention',
      title: 'Personalized prevention',
      state: 'SUGGESTED',
      summary: 'Personalized, non-diagnostic prevention and brain-health support suggestions are provided to discuss with a clinician.',
    },
    {
      stage: 5,
      key: 'clinical_referral_and_closed_loop_outcomes',
      title: 'Clinical referral and closed-loop outcomes',
      state: referralState,
      summary: requiresClinicalReview
        ? 'Clinician review is recommended to determine appropriate care, referral needs, and follow-up; outcomes should be tracked to close the loop.'
        : 'Continue clinician-guided monitoring and track follow-up outcomes over time; referral is a clinician decision if indicated.',
    },
  ];
}

function buildNextSteps(args: {
  baselineCreated: boolean;
  status: 'INSUFFICIENT_DATA' | 'NO_CHANGE' | 'REVIEW';
  comparable: boolean;
  reasons: string[];
  preventionSignals: string[];
}) {
  const { baselineCreated, status, comparable, reasons, preventionSignals } = args;
  const steps: any[] = [];

  steps.push({
    id: 'follow-up-screening',
    stage: 2,
    type: 'COGNITIVE_FOLLOW_UP',
    action: baselineCreated
      ? 'Complete another screening to strengthen your provisional personal baseline'
      : status === 'INSUFFICIENT_DATA' || !comparable
        ? 'Repeat screening under comparable, good-quality conditions'
        : 'Continue routine longitudinal screening',
    priority: status === 'REVIEW' ? 'high' : 'normal',
    timeframe: status === 'REVIEW' ? 'Within 2-4 weeks' : 'Next 30-90 days',
    owner: 'PATIENT_AND_CLINICIAN',
  });

  // Stage 4: Personalized prevention (supportive, non-diagnostic suggestions to discuss with clinician)
  const preventionMap: Record<string, string> = {
    sleep: 'Discuss sleep quality and routines with your clinician; consistent, restorative sleep supports brain health.',
    stress: 'Discuss stress-management strategies with your clinician or care team as part of brain-health support.',
    mood: 'If mood changes are present, discuss them with your clinician for appropriate support and follow-up.',
    activity: 'Discuss safe, regular physical activity with your clinician as part of personalized prevention.',
    social: 'Consider maintaining social connection and mentally engaging activities; discuss supports with your clinician if helpful.',
    sensory: 'Discuss hearing or vision checks with your clinician, as sensory changes can affect day-to-day function and screening.',
    medication_review: 'Review current medications and any side effects with your clinician or pharmacist.',
    nutrition: 'Discuss nutrition and hydration habits with your clinician as part of overall brain-health support.',
  };
  const chosen = preventionSignals.filter(s => preventionMap[s]).slice(0, 3);
  const preventionActions = chosen.length ? chosen.map(s => preventionMap[s]) : [
    'Discuss heart, sleep, mood, activity, and social-engagement habits with your clinician as part of personalized brain-health prevention.',
  ];
  for (let i = 0; i < preventionActions.length; i++) {
    steps.push({
      id: `prevention-${i + 1}`,
      stage: 4,
      type: 'PERSONALIZED_PREVENTION',
      action: preventionActions[i],
      priority: 'normal',
      timeframe: 'Ongoing / discuss at next visit',
      owner: 'PATIENT_AND_CLINICIAN',
    });
  }

  if (status === 'REVIEW') {
    steps.push({
      id: 'clinical-review',
      stage: 5,
      type: 'CLINICAL_REVIEW',
      action: 'Clinician reviews this change with history, health context, and safety factors to determine appropriate care',
      priority: 'high',
      timeframe: 'Within 14 days',
      owner: 'CLINICIAN',
    });
    steps.push({
      id: 'referral-follow-up',
      stage: 5,
      type: 'REFERRAL_AND_FOLLOW_UP',
      action: 'If indicated, clinician arranges appropriate referral and records follow-up outcomes to close the loop',
      priority: 'high',
      timeframe: 'As clinically indicated',
      owner: 'CLINICIAN',
    });
  }

  if (reasons.includes('CONTEXT_CHANGE')) {
    steps.push({
      id: 'review-context',
      stage: 4,
      type: 'REVIEW_CONTEXT',
      action: 'Review recent sleep, stress, mood, activity, or health-context changes with your clinician',
      priority: 'normal',
      timeframe: 'At next review',
      owner: 'PATIENT_AND_CLINICIAN',
    });
  }

  if (!comparable) {
    steps.push({
      id: 'quality-repeat',
      stage: 1,
      type: 'QUALITY_GATE',
      action: 'Repeat in a quiet setting with stable device, lighting, and matching task conditions',
      priority: 'normal',
      timeframe: 'Before trend interpretation',
      owner: 'PATIENT',
    });
  }

  steps.push({
    id: 'closed-loop-monitoring',
    stage: 5,
    type: 'CLOSED_LOOP_MONITORING',
    action: 'Track follow-up actions and outcomes over time as part of longitudinal, clinician-guided monitoring',
    priority: 'normal',
    timeframe: 'Ongoing',
    owner: 'PATIENT_AND_CLINICIAN',
  });

  return steps;
}

export function buildClinicalDocumentation(args: {
  baselineCreated: boolean;
  hasBaseline: boolean;
  status: 'INSUFFICIENT_DATA' | 'NO_CHANGE' | 'REVIEW';
  safety: SafetyAccessibilityResult;
  longitudinal: LongitudinalIntelligenceResult;
  assessmentsCount: number;
  hasContext: boolean;
  reviewStatus: string;
  taskResponses: unknown;
  contextInputs: any[];
}): ClinicalDocumentationResult & { followUp: FollowUpCoordinationResult } {
  const { baselineCreated, hasBaseline, status, safety, longitudinal, assessmentsCount, hasContext, reviewStatus, taskResponses, contextInputs } = args;
  const comparable = safety.sessionQuality.comparable;
  const preventionSignals = collectPreventionSignals(taskResponses, contextInputs);
  const requiresClinicalReview = status === 'REVIEW' || safety.urgentFlags.length > 0;

  // Whether this record's own variability supports a change claim at all. When it
  // does not, the draft says so instead of reporting "within range" as though a
  // range set a threshold.
  const changeReliability = longitudinal.reliability;
  const changeReliabilityLimitation = !changeReliability
    ? null
    : changeReliability.state === 'NOT_ESTABLISHED'
      ? `Change detection is inactive for this record: ${changeReliability.pairs} comparable repeat pair(s) available, ${MIN_PAIRS_FOR_RELIABLE_CHANGE} needed to estimate this patient's session-to-session variability. No score-based decline is reported until then.`
      : `Decline must exceed ${changeReliability.reliableChangeThreshold} points to be reported, derived as 1.96 × SD of change (${changeReliability.standardDeviationOfChange}) across ${changeReliability.pairs} repeat pairs. This is the patient's own measured variability, and it is provisional at this sample size.`;

  const interpretation = baselineCreated
    ? 'Provisional personal baseline established from this first completed screening. Repeat comparable, quality-checked sessions over time to enable meaningful within-person change detection. This is not a diagnosis.'
    : !comparable
      ? 'This session did not meet quality/comparability safety gates, so it is not interpreted as brain-health change. A repeat screening under comparable conditions is recommended.'
      : status === 'REVIEW'
        ? 'A review signal was recorded: a decline larger than this record can distinguish from measurement variability, a reported functional change, or a change in sleep, activity or mood/stress context. A clinician should interpret this in context of health, function, and measurement quality. This is not a diagnosis.'
        : status === 'INSUFFICIENT_DATA'
          ? changeReliability?.state === 'NOT_ESTABLISHED'
            ? 'No change conclusion is possible from these sessions: too few comparable repeats exist to know how much this score moves when nothing has changed, so no decline is reported from it. Continue longitudinal follow-up to build a reliable personal record.'
            : 'Not enough comparable, quality-checked sessions are available yet to determine meaningful change. Continue longitudinal follow-up to build a reliable personal record.'
          : 'No decline larger than the variability this record can distinguish was observed across comparable sessions. This is not evidence of stability beyond that threshold. Continue routine longitudinal monitoring and clinician follow-up as planned.';

  const pathway = buildPathway({
    baselineCreated,
    hasBaseline,
    status,
    comparable,
    assessmentsCount,
    hasContext,
    requiresClinicalReview: status === 'REVIEW',
    reviewStatus,
  });

  const nextSteps = buildNextSteps({
    baselineCreated,
    status,
    comparable,
    reasons: longitudinal.reviewReasons,
    preventionSignals,
  });

  // Language provenance recorded at submission: which language the session was
  // administered in, and whether its task wording had completed review. A
  // clinician reading the draft should not have to infer this from the portal.
  const languageReadiness = (taskResponses as { languageReadiness?: {
    language?: string;
    taskAdministrationReady?: boolean;
    acknowledged?: boolean;
    pendingStages?: string[];
  } } | null | undefined)?.languageReadiness;
  const languageLimitations: string[] = [];
  if (languageReadiness?.language) {
    if (languageReadiness.taskAdministrationReady) {
      languageLimitations.push(`Tasks were administered in ${languageReadiness.language}, a language with reviewed task wording.`);
    } else {
      languageLimitations.push(
        `Tasks were administered in ${languageReadiness.language}, whose task wording has not completed linguistic/clinical review (${
          (languageReadiness.pendingStages || []).join(', ') || 'review pending'
        }). Scores should not be compared across language versions.`
      );
    }
  }

  // Which cognitive domains this session actually has a measurement for. An
  // activity that could not run (no camera, no microphone, skipped, timed out)
  // leaves its domain unmeasured; nothing is filled in to make the battery look
  // complete.
  const administration = (taskResponses as {
    administration?: {
      measured?: string[];
      notMeasured?: Array<{ task?: string; reason?: string }>;
      unmeasuredDomains?: string[];
    };
  } | null | undefined)?.administration;
  const REASON_LABELS: Record<string, string> = {
    CAMERA_UNAVAILABLE: 'no camera',
    MICROPHONE_UNAVAILABLE: 'no microphone',
    SKIPPED: 'skipped',
    TIME_LIMIT: 'time limit reached',
    NOT_COMPLETED: 'not completed',
    NO_RECORDING: 'no recording',
    NOT_RECORDED: 'not recorded',
  };
  const coverageLimitations: string[] = [];
  if (administration?.unmeasuredDomains?.length) {
    const reasons = Array.from(
      new Set((administration.notMeasured || []).map((item) => REASON_LABELS[item.reason || ''] || 'not recorded'))
    );
    coverageLimitations.push(
      `Domains not measured in this session: ${administration.unmeasuredDomains.join(', ')}${
        reasons.length ? ` (${reasons.join('; ')})` : ''
      }. No score was substituted for a missing domain.`
    );
  }

  const evidence = {
    sources: [
      'assessment.overallScore_and_taskResponses (recorded session)',
      ...(administration ? ['taskResponses.administration (measured / not measured coverage)'] : []),
      'baseline (personal, when available)',
      'comparable completed assessment history',
      ...(contextInputs.length ? ['context_inputs (recorded, consented as provided)'] : []),
      ...(languageReadiness?.language ? ['taskResponses.languageReadiness (administration language)'] : []),
    ],
    limitations: [
      'Deterministic, non-diagnostic screening workflow; not a diagnosis and not a substitute for clinical evaluation.',
      'Change interpretation is safety-gated by session quality/comparability; poor quality is never treated as decline.',
      'Missing data remains missing and is not imputed.',
      ...(changeReliabilityLimitation ? [changeReliabilityLimitation] : []),
      ...coverageLimitations,
      ...languageLimitations,
      ...(safety.urgentFlags.length ? ['Urgent/safety flags detected from recorded inputs require clinician attention.'] : []),
    ],
    uncertainty: !comparable
      ? 'High uncertainty for change interpretation due to quality/comparability gating.'
      : status === 'INSUFFICIENT_DATA'
        ? changeReliability?.state === 'NOT_ESTABLISHED'
          ? 'No reliable-change threshold exists for this record, so no change is asserted in either direction.'
          : 'Insufficient comparable history for a reliable change conclusion.'
        : 'Within-person comparison against this record\'s own measured variability; not a validated reliable-change statistic for the population.',
  };

  return {
    interpretation,
    pathway,
    preventionSignals,
    nextSteps,
    evidence,
    followUp: {
      recommended: true,
      cadence: status === 'REVIEW' ? 'WITHIN_2_4_WEEKS' : 'ROUTINE_30_90_DAYS',
      closedLoop: 'TRACK_OUTCOMES_WITH_CLINICIAN',
      requiresClinicalReview: status === 'REVIEW',
      referralDecision: 'CLINICIAN_OWNED',
    },
  };
}
