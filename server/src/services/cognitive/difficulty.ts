import type { ExposureMap } from './rotation';

export interface DifficultyDecision {
  level: number;
  reason: string;
  /** True when the decision rests on enough trials to be worth acting on. */
  confident: boolean;
}

export const MIN_TRIALS_PER_EXPOSURE = 3;
export const MIN_EXPOSURES = 2;
export const UPPER_BAND = 0.85;
export const LOWER_BAND = 0.5;

/**
 * Exploratory difficulty control.
 *
 * Rules:
 *  - Start at level 2 when there is no usable history.
 *  - Improve only after two consecutive exposures with at least three scored
 *    trials each and accuracy at or above 85%.
 *  - Reduce only after two consecutive exposures at or below 50%.
 *  - A single wrong answer never changes the level.
 *  - Sleep, mood and fatigue are deliberately NOT inputs: they may affect
 *    performance, but they must not lower the cognitive challenge or the
 *    standard against which the patient is observed.
 */
export function decideDifficulty(taskId: string, exposure: ExposureMap): DifficultyDecision {
  const history = exposure[taskId]?.recent || [];
  // An exposure without a recorded accuracy did not yield a usable measurement.
  // Treating it as 0% would lower the difficulty on the strength of a missing
  // value, so it is excluded rather than filled in.
  const usable = history
    .filter((task) => task.completed && !task.skipped && task.trials >= MIN_TRIALS_PER_EXPOSURE)
    .filter((task): task is typeof task & { accuracy: number } =>
      typeof task.accuracy === 'number' && Number.isFinite(task.accuracy)
    );

  if (usable.length < MIN_EXPOSURES) {
    return {
      level: 2,
      reason:
        usable.length === 0
          ? 'Starting level: no reliable previous performance on this activity.'
          : 'Starting level: one exposure is not enough to adjust difficulty reliably.',
      confident: false
    };
  }

  const [latest, previous] = usable;
  const levels = [latest.difficultyLevel, previous.difficultyLevel].filter(Number.isFinite);
  const baseline = levels.length ? Math.max(...levels) : 2;

  const latestAccuracy = latest.accuracy;
  const previousAccuracy = previous.accuracy;

  if (latestAccuracy >= UPPER_BAND && previousAccuracy >= UPPER_BAND) {
    return {
      level: Math.min(5, baseline + 1),
      reason: `Raised after two exposures at ${Math.round(previousAccuracy * 100)}% and ${Math.round(
        latestAccuracy * 100
      )}% accuracy with at least ${MIN_TRIALS_PER_EXPOSURE} trials each.`,
      confident: true
    };
  }
  if (latestAccuracy <= LOWER_BAND && previousAccuracy <= LOWER_BAND) {
    return {
      level: Math.max(1, baseline - 1),
      reason: `Lowered after two exposures at ${Math.round(previousAccuracy * 100)}% and ${Math.round(
        latestAccuracy * 100
      )}% accuracy with at least ${MIN_TRIALS_PER_EXPOSURE} trials each.`,
      confident: true
    };
  }
  return {
    level: baseline,
    reason: 'Difficulty held: performance across the last two exposures was not consistent enough to change the level.',
    confident: true
  };
}

/** Standardized administration never enters this controller. */
export function standardizedDifficulty(): number {
  return 3;
}
