/**
 * Server-side scoring for the browser-administered battery.
 *
 * The browser measures task performance; it does not decide what those
 * measurements mean. Until this module existed the client posted `overallScore`
 * and the server stored it verbatim, so a stale bundle, a replayed request or a
 * hand-written POST could attach any number to any session. The score is now
 * derived here from the recorded task responses, and neither submission schema
 * accepts a score from the client at all.
 *
 * The rules intentionally mirror the browser's task mapping so the number a
 * participant sees on the results screen and the number a clinician sees in the
 * record are the same number. If that mapping changes, it changes here first.
 */

export type BatteryTaskId = 'game1' | 'game2' | 'game3' | 'game4' | 'game5' | 'pianoSequence';

export interface BatteryDomainScores {
  memory: number | null;
  attention: number | null;
  visuospatial: number | null;
  executive: number | null;
}

export interface BatteryCoverage {
  measured: BatteryTaskId[];
  notMeasured: Array<{ task: BatteryTaskId; reason: string }>;
  /** Domains with no measurement at all, so a clinician sees what is missing. */
  unmeasuredDomains: Array<keyof BatteryDomainScores>;
}

export interface BatteryScore {
  taskScores: Record<BatteryTaskId, number | null>;
  domains: BatteryDomainScores;
  /** Null unless all four domains have a recorded contribution. */
  composite: number | null;
  /** False whenever any domain is missing: the battery was not completed as administered. */
  complete: boolean;
  /** What was actually measured in this session, and why anything was not. */
  coverage: BatteryCoverage;
}

/** Did the activity produce a measurement, and if not, what stopped it? */
const NOT_MEASURED_REASONS = new Set([
  'SKIPPED',
  'TIME_LIMIT',
  'NOT_COMPLETED',
  'NO_RECORDING',
  'CAMERA_UNAVAILABLE',
  'MICROPHONE_UNAVAILABLE'
]);

const notMeasuredReason = (responses: Record<string, unknown>, key: string): string => {
  const entry = responses[key];
  if (entry && typeof entry === 'object') {
    const reason = (entry as { notMeasured?: unknown }).notMeasured;
    if (typeof reason === 'string' && NOT_MEASURED_REASONS.has(reason)) return reason;
  }
  return 'NOT_RECORDED';
};

/** Only a recorded finite number is a measurement. Anything else is absent. */
const recordedNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const taskScore = (responses: Record<string, unknown>, key: string): number | null => {
  const entry = responses[key];
  if (entry === null || typeof entry !== 'object') return null;
  return recordedNumber((entry as { score?: unknown }).score);
};

/** Mean of recorded values, or null if any contributing value is missing. */
const meanIfComplete = (...values: Array<number | null>): number | null => {
  if (values.some((value) => value === null)) return null;
  const total = values.reduce<number>((sum, value) => sum + (value as number), 0);
  return Math.round(total / values.length);
};

/**
 * Score a submitted session from its recorded task responses.
 *
 * A skipped or interrupted task contributes nothing and never becomes a
 * placeholder: any missing task in a domain makes that domain null, and a null
 * domain makes the composite null. Such a session is recorded as
 * NOT_INTERPRETABLE rather than as an average performance.
 */
export function scoreBatterySession(
  taskResponses: Record<string, unknown> | null | undefined
): BatteryScore {
  const responses = taskResponses && typeof taskResponses === 'object' ? taskResponses : {};

  const taskScores: Record<BatteryTaskId, number | null> = {
    game1: taskScore(responses, 'game1'),
    game2: taskScore(responses, 'game2'),
    game3: taskScore(responses, 'game3'),
    game4: taskScore(responses, 'game4'),
    game5: taskScore(responses, 'game5'),
    // The fixed-observation sequencing task is stored under either key.
    pianoSequence: taskScore(responses, 'pianoSequence') ?? taskScore(responses, 'game6')
  };

  // Fixed-observation tasks only. Adaptive practice is deliberately excluded:
  // it is practice, not measurement.
  const domains: BatteryDomainScores = {
    memory: meanIfComplete(taskScores.game2, taskScores.pianoSequence),
    attention: meanIfComplete(taskScores.game1, taskScores.game4),
    visuospatial: taskScores.game5,
    executive: meanIfComplete(taskScores.game5, taskScores.game2, taskScores.pianoSequence)
  };

  const domainValues = [domains.memory, domains.attention, domains.visuospatial, domains.executive];
  const complete = domainValues.every((value) => value !== null);

  const measured: BatteryTaskId[] = [];
  const notMeasured: Array<{ task: BatteryTaskId; reason: string }> = [];
  (Object.keys(taskScores) as BatteryTaskId[]).forEach((task) => {
    if (taskScores[task] === null) {
      notMeasured.push({
        task,
        // The sequencing task is stored under either key depending on the build.
        reason: task === 'pianoSequence'
          ? notMeasuredReason(responses, 'pianoSequence')
          : notMeasuredReason(responses, task)
      });
    } else {
      measured.push(task);
    }
  });

  const unmeasuredDomains = (Object.keys(domains) as Array<keyof BatteryDomainScores>)
    .filter((domain) => domains[domain] === null);

  return {
    taskScores,
    domains,
    complete,
    composite: complete ? meanIfComplete(...domainValues) : null,
    coverage: { measured, notMeasured, unmeasuredDomains }
  };
}
