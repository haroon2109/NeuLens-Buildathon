import type { TaskCatalogEntry } from './taskCatalog';
import type { CognitiveSessionRecord, TaskScore } from './types';

export interface TaskExposure {
  taskId: string;
  count: number;
  lastUsedAt: string | null;
  lastForm: string | null;
  recent: TaskScore[];
}

export type ExposureMap = Record<string, TaskExposure>;

/** Builds per-task exposure from previously recorded sessions. */
export function buildExposure(sessions: CognitiveSessionRecord[]): ExposureMap {
  const exposure: ExposureMap = {};
  for (const session of sessions) {
    for (const task of session.tasks) {
      const current = exposure[task.taskId] || {
        taskId: task.taskId,
        count: 0,
        lastUsedAt: null,
        lastForm: null,
        recent: []
      };
      current.count += 1;
      if (!current.lastUsedAt || new Date(session.completedAt) > new Date(current.lastUsedAt)) {
        current.lastUsedAt = session.completedAt;
        current.lastForm = task.form;
      }
      current.recent.push(task);
      exposure[task.taskId] = current;
    }
  }
  // Sessions arrive newest-first, so the first two entries are the two most
  // recent exposures of that task.
  for (const entry of Object.values(exposure)) {
    entry.recent = entry.recent.slice(0, 2);
  }
  return exposure;
}

/** Days since the task was last administered, or Infinity when never used. */
export function daysSinceLastUse(taskId: string, exposure: ExposureMap): number {
  const last = exposure[taskId]?.lastUsedAt;
  if (!last) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(last).getTime()) / 86_400_000;
}

/**
 * Picks the next alternate form without repeating the most recent one.
 * Forms change the stimuli, not the construct or the scoring rule.
 */
export function nextForm(entry: TaskCatalogEntry, exposure: ExposureMap): string {
  const lastForm = exposure[entry.id]?.lastForm;
  if (!lastForm || !entry.forms.includes(lastForm)) return entry.forms[0];
  const index = entry.forms.indexOf(lastForm);
  return entry.forms[(index + 1) % entry.forms.length];
}

/** Fixed form for standardized sessions, rotating only between visits. */
export function standardizedForm(entry: TaskCatalogEntry, exposure: ExposureMap, visitIndex: number): string {
  // Alternate forms rotate with each standardized visit; the construct and
  // administration protocol stay identical.
  return entry.forms[visitIndex % entry.forms.length];
}
