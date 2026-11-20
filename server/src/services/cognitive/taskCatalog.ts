/**
 * NeuLens cognitive task catalogue (server-side selection metadata).
 *
 * The client owns the full task presentation metadata; the server owns only the
 * fields used to compose, rotate and score an assessment. Keeping the two in
 * sync is enforced by the task-id test.
 *
 * CLINICAL SAFETY: every entry is RESEARCH-STAGE. None of these activities is a
 * validated clinical instrument. Scores produced from them are descriptive and
 * require clinician interpretation.
 */

export type CognitiveDomain =
  | 'MEMORY'
  | 'ATTENTION'
  | 'EXECUTIVE'
  | 'REASONING'
  | 'LANGUAGE'
  | 'VISUOSPATIAL'
  | 'FUNCTIONAL'
  | 'PROCESSING_SPEED';

export const DOMAIN_LABELS: Record<CognitiveDomain, string> = {
  MEMORY: 'Memory',
  ATTENTION: 'Attention',
  EXECUTIVE: 'Executive function',
  REASONING: 'Reasoning',
  LANGUAGE: 'Language',
  VISUOSPATIAL: 'Visuospatial ability',
  FUNCTIONAL: 'Functional cognition',
  PROCESSING_SPEED: 'Processing speed'
};

export type ValidationStatus = 'RESEARCH_STAGE';

export interface TaskCatalogEntry {
  id: string;
  name: string;
  domain: CognitiveDomain;
  subdomain: string;
  /** Estimated administration time for one form at the reference level. */
  durationMinutes: number;
  /** CORE tasks form the standardized protocol; SUPPLEMENTARY only appear in exploration. */
  priority: 'CORE' | 'SUPPLEMENTARY';
  /** Alternate forms can be rotated without changing the construct. */
  forms: string[];
  version: string;
  validationStatus: ValidationStatus;
  accessibility: {
    requiresVision: 'none' | 'basic' | 'detailed';
    requiresHearing: boolean;
    /** Input precision needed beyond a large tap target. */
    motorDemand: 'coarse' | 'fine';
  };
  /** Instructions and stimuli exist for these UI languages. */
  languages: string[];
}

// Only English administration exists in this research build. Additional
// language support must not be claimed until translation and review are done.
const LANGUAGES = ['en'];

const task = (
  id: string,
  name: string,
  domain: CognitiveDomain,
  subdomain: string,
  durationMinutes: number,
  priority: TaskCatalogEntry['priority'],
  accessibility: TaskCatalogEntry['accessibility'],
  forms = ['A', 'B', 'C']
): TaskCatalogEntry => ({
  id,
  name,
  domain,
  subdomain,
  durationMinutes,
  priority,
  forms,
  version: '1.0.0',
  validationStatus: 'RESEARCH_STAGE',
  accessibility,
  languages: LANGUAGES
});

const visual = (vision: 'none' | 'basic' | 'detailed' = 'basic') => ({
  requiresVision: vision,
  requiresHearing: false,
  motorDemand: 'coarse' as const
});

export const TASK_CATALOG: TaskCatalogEntry[] = [
  // MEMORY -----------------------------------------------------------------
  task('memory.face-name', 'Face–Name Association', 'MEMORY', 'Associative memory', 3, 'CORE', visual('detailed')),
  task('memory.picture-sequence', 'Picture Sequence Recall', 'MEMORY', 'Episodic / sequential memory', 3, 'CORE', visual()),
  task('memory.object-location', 'Object–Location Memory', 'MEMORY', 'Visual-spatial memory', 3, 'CORE', visual()),
  task('memory.word-list', 'Word List Recall', 'MEMORY', 'Verbal learning / delayed recall', 4, 'CORE', visual()),
  task('memory.story-recall', 'Story Recall', 'MEMORY', 'Contextual verbal memory', 4, 'SUPPLEMENTARY', visual()),
  task(
    'memory.prospective-memory',
    'Prospective Memory',
    'MEMORY',
    'Remembering to act',
    3,
    'SUPPLEMENTARY',
    visual()
  ),
  task('memory.paired-association', 'Paired Association Challenge', 'MEMORY', 'Associative learning', 3, 'CORE', visual()),

  // ATTENTION ---------------------------------------------------------------
  task('attention.target-detection', 'Target Detection', 'ATTENTION', 'Sustained attention', 2, 'CORE', visual()),
  task('attention.focus-finder', 'Focus Finder', 'ATTENTION', 'Selective attention / interference', 2, 'CORE', visual()),
  task('attention.visual-search', 'Visual Search', 'ATTENTION', 'Visual attention / search efficiency', 2, 'SUPPLEMENTARY', visual()),
  task('attention.go-no-go', 'Go / No-Go Challenge', 'ATTENTION', 'Inhibitory control', 2, 'CORE', visual()),
  task('attention.sound-recognition', 'Sound Recognition', 'ATTENTION', 'Auditory attention', 2, 'SUPPLEMENTARY', {
    requiresVision: 'basic',
    requiresHearing: true,
    motorDemand: 'coarse'
  }),

  // EXECUTIVE ---------------------------------------------------------------
  task('executive.rule-switch', 'Rule Switch', 'EXECUTIVE', 'Cognitive flexibility', 3, 'CORE', visual()),
  task('executive.planning-tower', 'Planning Tower', 'EXECUTIVE', 'Planning / problem-solving', 4, 'SUPPLEMENTARY', {
    requiresVision: 'basic',
    requiresHearing: false,
    motorDemand: 'fine'
  }),
  task('executive.connect-sequence', 'Connect the Sequence', 'EXECUTIVE', 'Sequencing / set shifting', 2, 'SUPPLEMENTARY', visual()),
  task('executive.colour-conflict', 'Colour Conflict', 'EXECUTIVE', 'Interference control', 2, 'SUPPLEMENTARY', visual()),
  task('executive.daily-schedule', 'Daily Schedule Planner', 'EXECUTIVE', 'Planning / organisation', 3, 'SUPPLEMENTARY', visual()),

  // REASONING ---------------------------------------------------------------
  task('reasoning.pattern-detective', 'Pattern Detective', 'REASONING', 'Abstract reasoning', 2, 'SUPPLEMENTARY', visual('detailed')),
  task('reasoning.sequence-logic', 'Sequence Logic', 'REASONING', 'Logical reasoning', 2, 'SUPPLEMENTARY', visual()),
  task('reasoning.everyday-decision', 'Everyday Decision Challenge', 'REASONING', 'Practical reasoning / judgement', 2, 'SUPPLEMENTARY', visual()),
  task('reasoning.shape-construction', 'Shape Construction', 'REASONING', 'Visuoconstruction', 3, 'SUPPLEMENTARY', visual('detailed')),

  // LANGUAGE ----------------------------------------------------------------
  task('language.object-naming', 'Object Naming', 'LANGUAGE', 'Naming / word retrieval', 2, 'CORE', visual()),
  task('language.category-fluency', 'Category Fluency', 'LANGUAGE', 'Semantic fluency', 2, 'SUPPLEMENTARY', visual()),
  task('language.sentence-understanding', 'Sentence Understanding', 'LANGUAGE', 'Comprehension', 2, 'CORE', visual()),

  // VISUOSPATIAL ------------------------------------------------------------
  task('visuospatial.mental-rotation', 'Mental Rotation', 'VISUOSPATIAL', 'Spatial visualisation', 2, 'SUPPLEMENTARY', visual('detailed')),
  task('visuospatial.clock-construction', 'Clock Construction', 'VISUOSPATIAL', 'Visuospatial organisation', 3, 'CORE', {
    requiresVision: 'detailed',
    requiresHearing: false,
    motorDemand: 'fine'
  }),
  task('visuospatial.route-finder', 'Route Finder', 'VISUOSPATIAL', 'Spatial navigation / planning', 3, 'SUPPLEMENTARY', visual()),

  // FUNCTIONAL --------------------------------------------------------------
  task('functional.medication-schedule', 'Medication Schedule Simulation', 'FUNCTIONAL', 'Prospective memory / sequencing', 3, 'SUPPLEMENTARY', visual()),
  task('functional.shopping-budget', 'Shopping and Budget Challenge', 'FUNCTIONAL', 'Functional numeracy / planning', 3, 'SUPPLEMENTARY', {
    requiresVision: 'basic',
    requiresHearing: false,
    motorDemand: 'fine'
  }),
  task('functional.activity-sequencing', 'Everyday Activity Sequencing', 'FUNCTIONAL', 'Sequencing / practical organisation', 2, 'SUPPLEMENTARY', visual()),

  // PROCESSING SPEED --------------------------------------------------------
  task('processing.symbol-number', 'Symbol–Number Matching', 'PROCESSING_SPEED', 'Processing speed / visual scanning', 2, 'CORE', visual()),
  task('processing.rapid-comparison', 'Rapid Pattern Comparison', 'PROCESSING_SPEED', 'Processing speed / discrimination', 2, 'SUPPLEMENTARY', visual())
];

export const TASK_BY_ID = new Map(TASK_CATALOG.map((entry) => [entry.id, entry]));

export const DOMAINS = Object.keys(DOMAIN_LABELS) as CognitiveDomain[];

/**
 * Fixed standardized protocol. The same six constructs are administered at
 * every visit so results stay comparable. Only the alternate form changes.
 */
export const STANDARDIZED_PROTOCOL = {
  id: 'neulens-standardized-screening',
  version: '1.0.0',
  /** Reference difficulty level. Never adjusted by the adaptive engine. */
  difficultyLevel: 3,
  taskIds: [
    'memory.word-list',
    'attention.target-detection',
    'executive.rule-switch',
    'language.object-naming',
    'visuospatial.clock-construction',
    'processing.symbol-number'
  ],
  estimatedMinutes: 17
} as const;

/** Tasks that need a delayed-recall interval; selected last in a session. */
export const DELAYED_MEASURES = ['memory.word-list', 'memory.story-recall', 'memory.paired-association'];

export const VALIDATION_NOTICE =
  'Research-stage activities inspired by established neuropsychological paradigms. They are not validated clinical instruments and do not establish diagnosis.';
