import { COGNITIVE_DOMAINS, DOMAIN_LABEL, VALIDATION_NOTE, type CognitiveDomain, type CognitiveTaskDefinition } from './types';
import { memoryTasks } from './catalogMemory';
import { attentionTasks } from './catalogAttention';
import { executiveTasks } from './catalogExecutive';
import { reasoningTasks, languageTasks } from './catalogReasoningLanguage';
import { visuospatialTasks, functionalTasks, processingSpeedTasks } from './catalogEverydaySpeed';

/** Canonical client task library: 32 activities across eight domains. */
export const COGNITIVE_TASKS: CognitiveTaskDefinition[] = [
  ...memoryTasks,
  ...attentionTasks,
  ...executiveTasks,
  ...reasoningTasks,
  ...languageTasks,
  ...visuospatialTasks,
  ...functionalTasks,
  ...processingSpeedTasks
];

export const TASK_BY_ID = new Map(COGNITIVE_TASKS.map((task) => [task.id, task]));

export const STANDARDIZED_PROTOCOL_CLIENT = {
  id: 'neulens-standardized-screening',
  version: '1.0.0',
  difficultyLevel: 3,
  taskIds: [
    'memory.word-list',
    'attention.target-detection',
    'executive.rule-switch',
    'language.object-naming',
    'visuospatial.clock-construction',
    'processing.symbol-number'
  ]
};

export function tasksForDomain(domain: CognitiveDomain): CognitiveTaskDefinition[] {
  return COGNITIVE_TASKS.filter((task) => task.domain === domain);
}

export function domainTaskCounts(): Record<CognitiveDomain, number> {
  return COGNITIVE_DOMAINS.reduce(
    (acc, domain) => ({ ...acc, [domain.id]: tasksForDomain(domain.id).length }),
    {} as Record<CognitiveDomain, number>
  );
}

/** Copy shown on every library and clinician screen. */
export const LIBRARY_NOTICE =
  `${VALIDATION_NOTE} Activities are inspired by established neuropsychological paradigms and require clinical review, language adaptation and reliability testing before their scores can support interpretation.`;

export { COGNITIVE_DOMAINS, DOMAIN_LABEL, VALIDATION_NOTE };
export type { CognitiveDomain, CognitiveTaskDefinition };
