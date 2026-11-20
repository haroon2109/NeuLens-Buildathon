import { TASK_BY_ID, type CognitiveDomain, DOMAIN_LABELS, STANDARDIZED_PROTOCOL } from './taskCatalog';
import type {
  AssessmentContext,
  AssessmentMode,
  CognitiveSessionRecord,
  CognitiveTaskResultInput,
  DomainSummary,
  QualityFlag,
  SessionQuality,
  TaskScore
} from './types';

/**
 * Deterministic, rule-based scoring. No model, LLM or generated value is
 * involved. Every number is derived from captured trial responses.
 */

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
};

const round = (value: number, places = 1) => Math.round(value * 10 ** places) / 10 ** places;

export function scoreTask(
  input: CognitiveTaskResultInput,
  mode: AssessmentMode
): TaskScore | null {
  const entry = TASK_BY_ID.get(input.taskId);
  if (!entry) return null;

  const trials = Array.isArray(input.trials) ? input.trials : [];
  const scoredTrials = trials.filter((trial) => typeof trial?.correct === 'boolean');
  const correct = scoredTrials.filter((trial) => trial.correct).length;
  const misses = scoredTrials.filter((trial) => trial.missed).length;
  const responseTimes = scoredTrials
    .map((trial) => Number(trial.responseMs))
    .filter((ms) => Number.isFinite(ms) && ms > 0 && ms <= 120_000);

  const skipped = Boolean(input.skipped);
  const completed = !skipped && scoredTrials.length > 0;
  const accuracy = scoredTrials.length > 0 ? round(correct / scoredTrials.length, 3) : null;
  const medianResponseMs = median(responseTimes);
  const difficultyLevel =
    mode === 'STANDARDIZED'
      ? STANDARDIZED_PROTOCOL.difficultyLevel
      : Math.min(5, Math.max(1, Number(input.difficultyLevel) || 2));

  const notes: string[] = [];
  if (skipped) notes.push('Task was skipped by the patient.');
  if (!skipped && scoredTrials.length === 0) notes.push('No scored responses were captured.');
  if (scoredTrials.length > 0 && scoredTrials.length < 3) {
    notes.push('Fewer than three scored trials — treat this task result as provisional.');
  }
  if (medianResponseMs != null && medianResponseMs < 150) {
    notes.push('Median response time under 150 ms is unusually fast; check for accidental input.');
  }
  if (mode === 'EXPLORATORY') {
    notes.push('Exploratory mode: difficulty is adaptive and not comparable with standardized administration.');
  }

  return {
    taskId: entry.id,
    taskName: entry.name,
    domain: entry.domain,
    version: entry.version,
    form: input.form || entry.forms[0],
    difficultyLevel,
    completed,
    skipped,
    trials: scoredTrials.length,
    correct,
    errors: scoredTrials.length - correct,
    misses,
    accuracy,
    medianResponseMs,
    score: accuracy == null ? null : round(accuracy * 100, 1),
    notes: [...notes, ...(Array.isArray(input.notes) ? input.notes : [])]
  };
}

export function summariseDomains(tasks: TaskScore[]): DomainSummary[] {
  const domains = Array.from(new Set(tasks.map((task) => task.domain))) as CognitiveDomain[];
  return domains.map((domain) => {
    const domainTasks = tasks.filter((task) => task.domain === domain);
    const trials = domainTasks.reduce((sum, task) => sum + task.trials, 0);
    const correct = domainTasks.reduce((sum, task) => sum + task.correct, 0);
    const rts = domainTasks
      .map((task) => task.medianResponseMs)
      .filter((value): value is number => value != null);
    return {
      domain,
      tasks: domainTasks.length,
      trials,
      accuracy: trials > 0 ? round(correct / trials, 3) : null,
      medianResponseMs: median(rts)
    };
  });
}

/**
 * Quality checks describe the administration, not the patient's ability.
 * A confounder is recorded for interpretation; it never adjusts a score.
 */
export function assessQuality(
  mode: AssessmentMode,
  tasks: TaskScore[],
  plannedTaskIds: string[],
  context: AssessmentContext
): { quality: SessionQuality; confounders: QualityFlag[] } {
  const flags: QualityFlag[] = [];
  const planned = plannedTaskIds.length || tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const completeness = planned > 0 ? round(completed / planned, 3) : 0;

  const totalTrials = tasks.reduce((sum, task) => sum + task.trials, 0);
  const totalMisses = tasks.reduce((sum, task) => sum + task.misses, 0);

  if (tasks.some((task) => task.skipped)) {
    flags.push({
      code: 'TASK_SKIPPED',
      label: 'A task was skipped',
      detail: 'Skipped activities are recorded as missing, not scored as incorrect.',
      severity: 'WARNING'
    });
  }
  if (completeness < 0.6) {
    flags.push({
      code: 'INCOMPLETE_SESSION',
      label: 'Incomplete session',
      detail: 'Fewer than 60% of planned activities produced a scored result.',
      severity: 'BLOCKER'
    });
  } else if (completeness < 0.85) {
    flags.push({
      code: 'PARTIAL_SESSION',
      label: 'Partial session',
      detail: 'Some planned activities did not produce a scored result.',
      severity: 'WARNING'
    });
  }
  if (totalTrials > 0 && totalMisses / totalTrials > 0.15) {
    flags.push({
      code: 'MISSING_RESPONSES',
      label: 'Missing responses',
      detail: `${Math.round((totalMisses / totalTrials) * 100)}% of trials had no recorded response.`,
      severity: 'WARNING'
    });
  }
  const sessionMedian = median(
    tasks.map((task) => task.medianResponseMs).filter((value): value is number => value != null)
  );
  if (sessionMedian != null && sessionMedian < 180) {
    flags.push({
      code: 'FAST_RESPONSES',
      label: 'Unusually fast responses',
      detail: 'Median response time was under 180 ms. Confirm the patient was not tapping through activities.',
      severity: 'WARNING'
    });
  }

  const confounders: QualityFlag[] = [];
  if (context.sleepHours != null && context.sleepHours < 6) {
    confounders.push({
      code: 'SHORT_SLEEP',
      label: 'Short sleep',
      detail: `Patient reported ${context.sleepHours} hours of sleep. Recorded as context only; no score adjustment is applied.`,
      severity: 'WARNING'
    });
  }
  if (context.sleepQuality != null && context.sleepQuality <= 2) {
    confounders.push({
      code: 'POOR_SLEEP_QUALITY',
      label: 'Reported sleep difficulty',
      detail: 'Patient reported poor sleep quality for the night before assessment.',
      severity: 'WARNING'
    });
  }
  if (context.fatigue != null && context.fatigue >= 4) {
    confounders.push({
      code: 'HIGH_FATIGUE',
      label: 'High fatigue',
      detail: 'Patient reported high fatigue. Consider a break or rescheduling the session.',
      severity: 'WARNING'
    });
  }
  if (context.stress != null && context.stress >= 4) {
    confounders.push({
      code: 'HIGH_STRESS',
      label: 'High stress',
      detail: 'Patient reported high stress on the day of assessment.',
      severity: 'WARNING'
    });
  }
  if (context.vision === 'significant') {
    confounders.push({
      code: 'VISION_ACCESS',
      label: 'Vision accessibility need',
      detail: 'Significant visual difficulty was reported. Large targets and enlarged text were applied; visual task results require cautious interpretation.',
      severity: 'WARNING'
    });
  }
  if (context.hearing === 'significant') {
    confounders.push({
      code: 'HEARING_ACCESS',
      label: 'Hearing accessibility need',
      detail: 'Significant hearing difficulty was reported. Auditory activities should be avoided or administered with support.',
      severity: 'WARNING'
    });
  }
  if (context.motor === 'significant') {
    confounders.push({
      code: 'MOTOR_ACCESS',
      label: 'Motor accessibility need',
      detail: 'Significant motor difficulty was reported. Touch response and enlarged controls were used.',
      severity: 'WARNING'
    });
  }
  if (context.digitalFamiliarity === 'low') {
    confounders.push({
      code: 'LOW_DIGITAL_FAMILIARITY',
      label: 'Low device familiarity',
      detail: 'Extra practice trials and simplified instructions were offered.',
      severity: 'INFO'
    });
  }
  if (mode === 'EXPLORATORY') {
    flags.push({
      code: 'EXPLORATORY_MODE',
      label: 'Exploratory session',
      detail: 'Adaptive difficulty and task choice make this session non-comparable with standardized administration. It is reported separately.',
      severity: 'INFO'
    });
  }
  flags.push({
    code: 'RESEARCH_STAGE',
    label: 'Research-stage tasks',
    detail: 'Activities are not validated clinical instruments. Results require clinician review.',
    severity: 'INFO'
  });

  const hasBlocker = flags.some((flag) => flag.severity === 'BLOCKER');
  const comparable =
    mode === 'STANDARDIZED' &&
    !hasBlocker &&
    completeness >= 0.8 &&
    (totalTrials === 0 || totalMisses / totalTrials <= 0.2);

  return {
    quality: {
      completeness,
      comparable,
      comparableReason: comparable
        ? 'The standardized protocol was completed with acceptable response capture. Comparison is limited to within-person, same-protocol sessions.'
        : mode === 'EXPLORATORY'
          ? 'Exploratory sessions use adaptive difficulty and are never merged with standardized measurements.'
          : hasBlocker
            ? 'Administration conditions were insufficient for comparison.'
            : 'Completion or response capture was insufficient for comparison.',
      flags
    },
    confounders
  };
}

export function buildSessionRecord(params: {
  sessionId: string;
  mode: AssessmentMode;
  planId: string | null;
  protocolVersion: string;
  startedAt: string;
  completedAt: string;
  language: string;
  context: AssessmentContext;
  results: CognitiveTaskResultInput[];
  plannedTaskIds: string[];
}): CognitiveSessionRecord {
  const tasks = params.results
    .map((input) => scoreTask(input, params.mode))
    .filter((task): task is TaskScore => task != null)
    .sort((a, b) => params.plannedTaskIds.indexOf(a.taskId) - params.plannedTaskIds.indexOf(b.taskId));

  const { quality, confounders } = assessQuality(
    params.mode,
    tasks,
    params.plannedTaskIds,
    params.context
  );

  const scoredTasks = tasks.filter((task) => task.trials > 0);
  const trials = scoredTasks.reduce((sum, task) => sum + task.trials, 0);
  const correct = scoredTasks.reduce((sum, task) => sum + task.correct, 0);
  const started = new Date(params.startedAt).getTime();
  const completed = new Date(params.completedAt).getTime();
  const administrationMinutes =
    Number.isFinite(started) && Number.isFinite(completed) && completed > started
      ? round((completed - started) / 60_000, 1)
      : null;

  return {
    sessionId: params.sessionId,
    mode: params.mode,
    protocolVersion: params.protocolVersion,
    algorithmVersion: 'neulens-cognitive-engine-1.0.0',
    startedAt: params.startedAt,
    completedAt: params.completedAt,
    language: params.language,
    tasks,
    domains: summariseDomains(tasks),
    compositeAccuracy: trials > 0 ? round((correct / trials) * 100, 1) : null,
    quality,
    context: params.context,
    confounders,
    clinicianReviewRequired: true,
    synthetic: false,
    planId: params.planId,
    administrationMinutes
  };
}

export function domainLabel(domain: CognitiveDomain): string {
  return DOMAIN_LABELS[domain];
}

/** Extracts previously stored cognitive sessions from assessment records. */
export function extractCognitiveSessions(assessments: unknown[]): CognitiveSessionRecord[] {
  const sessions: CognitiveSessionRecord[] = [];
  for (const assessment of assessments) {
    const record = assessment as { id?: string; taskResponses?: Record<string, unknown> } | null;
    const session = record?.taskResponses?.cognitiveSession as CognitiveSessionRecord | undefined;
    if (session && Array.isArray(session.tasks)) {
      sessions.push({ ...session, assessmentId: record?.id || session.assessmentId || null });
    }
  }
  return sessions.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}
