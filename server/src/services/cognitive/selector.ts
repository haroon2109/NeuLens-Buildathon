import {
  DOMAIN_LABELS,
  STANDARDIZED_PROTOCOL,
  TASK_BY_ID,
  TASK_CATALOG,
  VALIDATION_NOTICE,
  type CognitiveDomain,
  type TaskCatalogEntry
} from './taskCatalog';
import { contextConfounders } from './context';
import { decideDifficulty, standardizedDifficulty } from './difficulty';
import { buildExposure, daysSinceLastUse, nextForm, standardizedForm, type ExposureMap } from './rotation';
import type {
  AssessmentContext,
  AssessmentMode,
  AssessmentPlan,
  CognitiveSessionRecord,
  PlanTask,
  QualityFlag
} from './types';

const ALGORITHM_VERSION = 'neulens-adaptive-selector-1.0.0';

/** Domains sampled in every exploratory session, then fillers by exposure. */
const EXPLORATORY_SLOTS: CognitiveDomain[] = [
  'MEMORY',
  'ATTENTION',
  'EXECUTIVE',
  'LANGUAGE',
  'VISUOSPATIAL'
];
const EXPLORATORY_FILLERS: CognitiveDomain[] = ['FUNCTIONAL', 'PROCESSING_SPEED', 'REASONING'];

export interface PlanRequest {
  patientId: string;
  mode: AssessmentMode;
  context: AssessmentContext;
  sessions: CognitiveSessionRecord[];
  sessionMinutes?: number;
}

/**
 * Builds the administration plan. Selection reasons are recorded so the
 * clinician can see why a task was chosen or avoided.
 */
export function buildAssessmentPlan(request: PlanRequest): AssessmentPlan {
  const exposure = buildExposure(request.sessions);
  const confounders = contextConfounders(request.context);
  const generatedAt = new Date().toISOString();
  const planId = `plan-${request.mode.toLowerCase()}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

  if (request.mode === 'STANDARDIZED') {
    return buildStandardizedPlan(request, exposure, confounders, planId, generatedAt);
  }
  return buildExploratoryPlan(request, exposure, confounders, planId, generatedAt);
}

function buildStandardizedPlan(
  request: PlanRequest,
  exposure: ExposureMap,
  confounders: QualityFlag[],
  planId: string,
  generatedAt: string
): AssessmentPlan {
  // Only adequately completed standardized sessions advance the alternate-form
  // rotation. A partial session must not change the next visit's form.
  const priorStandardized = request.sessions.filter(
    (session) => session.mode === 'STANDARDIZED' && session.quality.completeness >= 0.8
  ).length;
  const visitIndex = priorStandardized;
  const warnings: QualityFlag[] = [];
  const accommodations: string[] = [];

  if (request.context.vision === 'significant') {
    warnings.push({
      code: 'STANDARDIZATION_COMPROMISED',
      label: 'Vision may affect standardized administration',
      detail:
        'The fixed protocol contains detailed visual activities. They are retained for comparability, with enlarged targets. Clinician review is required before interpreting results.',
      severity: 'BLOCKER'
    });
    accommodations.push('Enlarged text and high-contrast visual targets');
  } else if (request.context.vision === 'mild') {
    accommodations.push('Enlarged text and high-contrast visual targets');
  }
  if (request.context.hearing === 'significant') {
    accommodations.push('All instructions shown in text; no audio-only activity is used in this protocol');
  }
  if (request.context.motor === 'significant') {
    warnings.push({
      code: 'MOTOR_ACCOMMODATION',
      label: 'Motor accommodation applied',
      detail:
        'The protocol includes a fine-motor clock activity. Large controls and an assisted entry alternative are offered; record any assistance given.',
      severity: 'WARNING'
    });
    accommodations.push('Large tap targets and assisted clock entry');
  }
  if (request.context.digitalFamiliarity === 'low') {
    accommodations.push('Extra practice trial before each activity');
  }
  if (request.context.fatigue != null && request.context.fatigue >= 4) {
    warnings.push({
      code: 'BREAK_RECOMMENDED',
      label: 'Break recommended',
      detail:
        'High fatigue was reported. A break is offered between activities. Difficulty and scoring are not adjusted.',
      severity: 'WARNING'
    });
  }
  if (priorStandardized > 0) {
    warnings.push({
      code: 'ALTERNATE_FORM',
      label: `Standardized visit ${priorStandardized + 1}`,
      detail: 'Alternate forms were selected to limit item exposure. Task constructs and administration are unchanged.',
      severity: 'INFO'
    });
  }

  const tasks: PlanTask[] = STANDARDIZED_PROTOCOL.taskIds.map((taskId, index) => {
    const entry = TASK_BY_ID.get(taskId);
    if (!entry) throw new Error(`Standardized protocol references unknown task ${taskId}`);
    return {
      taskId: entry.id,
      name: entry.name,
      domain: entry.domain,
      subdomain: entry.subdomain,
      form: standardizedForm(entry, exposure, visitIndex),
      difficultyLevel: standardizedDifficulty(),
      durationMinutes: entry.durationMinutes,
      order: index + 1,
      rationale: [
        `Fixed protocol task for ${DOMAIN_LABELS[entry.domain]} — same construct at every standardized visit.`,
        priorStandardized === 0
          ? 'Form A administered at the first standardized visit.'
          : `Alternate form selected for visit ${priorStandardized + 1}; administration and scoring are unchanged.`,
        'Difficulty is fixed; the adaptive engine does not modify standardized administration.'
      ],
      accommodations,
      alternateFormsAvailable: entry.forms
    };
  });

  return {
    planId,
    patientId: request.patientId,
    mode: 'STANDARDIZED',
    protocolId: STANDARDIZED_PROTOCOL.id,
    protocolVersion: STANDARDIZED_PROTOCOL.version,
    algorithmVersion: ALGORITHM_VERSION,
    generatedAt,
    sessionMinutes: tasks.reduce((sum, task) => sum + task.durationMinutes, 0),
    tasks,
    accommodations: Array.from(new Set(accommodations)),
    warnings,
    confounders,
    standardizationNotice:
      'Standardized mode: fixed task constructs, consistent instructions, controlled difficulty and alternate forms. Do not change difficulty between visits.',
    clinicianReviewRequired: true,
    clinicianApproval: null,
    validationNotice: VALIDATION_NOTICE
  };
}

function accessibilityExclusions(context: AssessmentContext): string[] {
  const excluded: string[] = [];
  if (context.hearing === 'significant') excluded.push('AUDIO');
  if (context.motor === 'significant') excluded.push('FINE_MOTOR');
  if (context.vision === 'significant') excluded.push('DETAILED_VISION');
  return excluded;
}

function isEligible(entry: TaskCatalogEntry, context: AssessmentContext): boolean {
  if (context.hearing === 'significant' && entry.accessibility.requiresHearing) return false;
  if (context.motor === 'significant' && entry.accessibility.motorDemand === 'fine') return false;
  if (context.vision === 'significant' && entry.accessibility.requiresVision === 'detailed') return false;
  return true;
}

function chooseTask(
  domain: CognitiveDomain,
  eligible: TaskCatalogEntry[],
  exposure: ExposureMap,
  selected: Set<string>,
  excludedNotes: string[]
): TaskCatalogEntry | null {
  const candidates = eligible
    .filter((entry) => entry.domain === domain && !selected.has(entry.id))
    .sort((a, b) => {
      const exposureA = exposure[a.id]?.count || 0;
      const exposureB = exposure[b.id]?.count || 0;
      if (exposureA !== exposureB) return exposureA - exposureB;
      const recencyA = daysSinceLastUse(a.id, exposure);
      const recencyB = daysSinceLastUse(b.id, exposure);
      if (recencyA !== recencyB) return recencyB - recencyA;
      if (a.priority !== b.priority) return a.priority === 'CORE' ? -1 : 1;
      return a.id.localeCompare(b.id);
    });

  if (candidates.length === 0) {
    excludedNotes.push(`No eligible ${DOMAIN_LABELS[domain]} activity was available for this session.`);
    return null;
  }
  return candidates[0];
}

function buildExploratoryPlan(
  request: PlanRequest,
  exposure: ExposureMap,
  confounders: QualityFlag[],
  planId: string,
  generatedAt: string
): AssessmentPlan {
  const minutes = Math.min(30, Math.max(8, Math.round(request.sessionMinutes || 15)));
  const targetTaskCount = Math.min(7, Math.max(4, Math.round(minutes / 3)));
  const eligible = TASK_CATALOG.filter((entry) => isEligible(entry, request.context));
  const selected = new Set<string>();
  const excludedNotes: string[] = [];
  const accommodations = buildAccommodations(request.context);
  const warnings: QualityFlag[] = [];

  // Domain coverage rotates across visits so repeated exploration does not
  // always sample the same five domains. Least-used, least-recent domains come
  // first; a visit offset guarantees functional, reasoning and speed
  // activities are reachable over a course of sessions.
  const allDomains: CognitiveDomain[] = [...EXPLORATORY_SLOTS, ...EXPLORATORY_FILLERS];
  const domainUseCount = (domain: CognitiveDomain) =>
    request.sessions.reduce(
      (total, session) => total + session.tasks.filter((task) => task.domain === domain).length,
      0
    );
  const orderedDomains = [...allDomains].sort((a, b) => {
    const usedA = domainUseCount(a);
    const usedB = domainUseCount(b);
    if (usedA !== usedB) return usedA - usedB;
    return allDomains.indexOf(a) - allDomains.indexOf(b);
  });
  const offset = request.sessions.length % orderedDomains.length;
  const domainOrder: CognitiveDomain[] = [
    ...orderedDomains.slice(offset),
    ...orderedDomains.slice(0, offset)
  ];

  const chosen: Array<{ entry: TaskCatalogEntry; rationale: string[] }> = [];
  for (const domain of domainOrder) {
    if (chosen.length >= targetTaskCount) break;
    const entry = chooseTask(domain, eligible, exposure, selected, excludedNotes);
    if (!entry) continue;
    selected.add(entry.id);
    chosen.push({ entry, rationale: [] });
  }

  const tasks: PlanTask[] = chosen.map(({ entry }, index) => {
    const decision = decideDifficulty(entry.id, exposure);
    const history = exposure[entry.id];
    const rationale = [
      `${DOMAIN_LABELS[entry.domain]} coverage — ${entry.subdomain.toLowerCase()}.`,
      history
        ? `Selected ahead of more recently used activities (${history.count} previous exposure${
            history.count === 1 ? '' : 's'
          }).`
        : 'Not previously administered, so it adds new information without repeating an activity.',
      decision.reason,
      'Exploratory mode: difficulty is adaptive and results are not comparable with standardized measurements.'
    ];
    return {
      taskId: entry.id,
      name: entry.name,
      domain: entry.domain,
      subdomain: entry.subdomain,
      form: nextForm(entry, exposure),
      difficultyLevel: decision.level,
      durationMinutes: entry.durationMinutes,
      order: index + 1,
      rationale,
      accommodations,
      alternateFormsAvailable: entry.forms
    };
  });

  if (tasks.length < targetTaskCount) {
    warnings.push({
      code: 'REDUCED_SESSION',
      label: 'Shorter session than requested',
      detail: `Only ${tasks.length} eligible activities were available for the requested ${minutes} minutes.`,
      severity: 'WARNING'
    });
  }
  for (const note of excludedNotes) {
    warnings.push({ code: 'ACCESSIBILITY_EXCLUSION', label: 'Activity excluded', detail: note, severity: 'INFO' });
  }
  if (request.context.hearing === 'significant') {
    warnings.push({
      code: 'AUDIO_EXCLUDED',
      label: 'Auditory activities excluded',
      detail: 'No activity requiring hearing was selected.',
      severity: 'INFO'
    });
  }
  if (request.context.motor === 'significant') {
    warnings.push({
      code: 'FINE_MOTOR_EXCLUDED',
      label: 'Fine-motor activities excluded',
      detail: 'Activities requiring precise dragging were not selected; large tap responses are used.',
      severity: 'INFO'
    });
  }
  if (request.context.fatigue != null && request.context.fatigue >= 4) {
    warnings.push({
      code: 'BREAK_RECOMMENDED',
      label: 'Break recommended',
      detail: 'Fatigue was reported. A break is offered between activities; difficulty is not lowered for fatigue.',
      severity: 'WARNING'
    });
  }

  return {
    planId,
    patientId: request.patientId,
    mode: 'EXPLORATORY',
    protocolId: 'neulens-exploratory',
    protocolVersion: '1.0.0',
    algorithmVersion: ALGORITHM_VERSION,
    generatedAt,
    sessionMinutes: tasks.reduce((sum, task) => sum + task.durationMinutes, 0),
    tasks,
    accommodations: Array.from(new Set(accommodations)),
    warnings,
    confounders,
    standardizationNotice:
      'Exploratory mode: task choice and difficulty adapt to previous performance. These results are reported separately from standardized measurements.',
    clinicianReviewRequired: true,
    clinicianApproval: null,
    validationNotice: VALIDATION_NOTICE
  };
}

function buildAccommodations(context: AssessmentContext): string[] {
  const accommodations: string[] = [];
  if (context.vision === 'significant') {
    accommodations.push('Enlarged text, high-contrast targets and reduced visual density');
  } else if (context.vision === 'mild') {
    accommodations.push('Enlarged text and high-contrast targets');
  }
  if (context.hearing === 'significant') {
    accommodations.push('Instructions shown as text; no audio-only activity');
  } else if (context.hearing === 'mild') {
    accommodations.push('Spoken instructions paired with on-screen text');
  }
  if (context.motor === 'significant') {
    accommodations.push('Large tap targets; no dragging or precise placement');
  }
  if (context.digitalFamiliarity === 'low') {
    accommodations.push('Additional practice trials and simplified instructions');
  }
  if (context.device === 'phone') {
    accommodations.push('Single-column layout with full-width response buttons');
  }
  return accommodations;
}
