/**
 * Client-side cognitive task metadata.
 *
 * CLINICAL SAFETY: every activity is RESEARCH-STAGE. These are prototype
 * activities inspired by established paradigms, not validated instruments.
 * They must not be presented to patients or clinicians as diagnostic.
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

export type PlayerKind =
  | 'choice'
  | 'sequence-recall'
  | 'grid-recall'
  | 'tap-stream'
  | 'visual-search'
  | 'sort'
  | 'pair-match'
  | 'order'
  | 'schedule'
  | 'budget'
  | 'clock'
  | 'fluency'
  | 'tower'
  | 'trail'
  | 'route';

export type AssessmentMode = 'STANDARDIZED' | 'EXPLORATORY';

export interface DomainDefinition {
  id: CognitiveDomain;
  label: string;
  description: string;
}

export interface CognitiveTaskDefinition {
  id: string;
  name: string;
  domain: CognitiveDomain;
  subdomain: string;
  description: string;
  instructions: string;
  example: string;
  /** Level 1 → 5 descriptions, task-specific. */
  difficultyLevels: [string, string, string, string, string];
  durationMinutes: number;
  scoringMethod: string;
  responseType: string;
  accessibilityRequirements: string[];
  languageSupport: string[];
  alternateForms: string[];
  validationStatus: 'RESEARCH_STAGE';
  validationNote: string;
  version: string;
  playerKind: PlayerKind;
  requiresAudio?: boolean;
  /** Detailed visual discrimination required. */
  visualDetail?: 'basic' | 'detailed';
  /** Fine motor input beyond large taps. */
  motorDemand?: 'coarse' | 'fine';
  /** Whether prior exposure warrants extra practice by default. */
  practiceRecommended?: boolean;
}

export const COGNITIVE_DOMAINS: DomainDefinition[] = [
  { id: 'MEMORY', label: 'Memory', description: 'Remembering, retaining and recalling information.' },
  { id: 'ATTENTION', label: 'Attention', description: 'Concentration and selective attention.' },
  { id: 'EXECUTIVE', label: 'Executive function', description: 'Planning, switching and decision-making.' },
  { id: 'REASONING', label: 'Reasoning', description: 'Problem-solving and logical thinking.' },
  { id: 'LANGUAGE', label: 'Language', description: 'Naming, comprehension and verbal fluency.' },
  { id: 'VISUOSPATIAL', label: 'Visuospatial ability', description: 'Spatial relationships and visual construction.' },
  { id: 'FUNCTIONAL', label: 'Functional cognition', description: 'Everyday cognitive activities and practical tasks.' },
  { id: 'PROCESSING_SPEED', label: 'Processing speed', description: 'Speed and accuracy of information processing.' }
];

export const DOMAIN_LABEL: Record<CognitiveDomain, string> = COGNITIVE_DOMAINS.reduce(
  (acc, domain) => ({ ...acc, [domain.id]: domain.label }),
  {} as Record<CognitiveDomain, string>
);

// This research build administers instructions and stimuli in English only.
// Other languages remain explicitly pending linguistic and clinical review.
export const LANGUAGES = ['en'];
export const FORMS = ['A', 'B', 'C'];

export const VALIDATION_NOTE =
  'Research-stage prototype. Not a validated clinical instrument, not diagnostic, and not calibrated against population norms.';

/** Helper keeps the catalogue readable while ensuring every field exists. */
export function defineTask(
  task: Omit<CognitiveTaskDefinition, 'validationStatus' | 'validationNote' | 'version' | 'languageSupport' | 'alternateForms'> &
    Partial<Pick<CognitiveTaskDefinition, 'languageSupport' | 'alternateForms' | 'version'>>
): CognitiveTaskDefinition {
  return {
    validationStatus: 'RESEARCH_STAGE',
    validationNote: VALIDATION_NOTE,
    version: '1.0.0',
    languageSupport: LANGUAGES,
    alternateForms: FORMS,
    ...task
  };
}
