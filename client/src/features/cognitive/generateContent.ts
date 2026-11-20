import type { CognitiveTaskDefinition } from './types';
import type { TaskContent } from './contentTypes';
import { generateChoiceContent } from './generatorsChoice';
import { generateOtherContent } from './generatorsOther';

/**
 * Deterministic content generation. The same task, form and level always yield
 * the same stimuli, so a session can be reproduced from its recorded form and
 * level without storing every stimulus.
 */
export function generateTaskContent(
  task: CognitiveTaskDefinition,
  form: string,
  level: number
): TaskContent {
  const safeLevel = Math.min(5, Math.max(1, level));
  const content = generateChoiceContent(task.id, safeLevel, form) || generateOtherContent(task.id, safeLevel, form);
  if (!content) throw new Error(`No interactive content is registered for ${task.id}`);
  return content;
}
