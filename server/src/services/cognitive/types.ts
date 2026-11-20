import type { CognitiveDomain } from './taskCatalog';

export type AssessmentMode = 'STANDARDIZED' | 'EXPLORATORY';

export type SeverityLevel = 'INFO' | 'WARNING' | 'BLOCKER';

export interface QualityFlag {
  code: string;
  label: string;
  detail: string;
  severity: SeverityLevel;
}

/**
 * Session context exactly as reported. `null` means "not reported" and is kept
 * missing — the engine never infers sleep, mood, sensory or health information.
 */
export interface AssessmentContext {
  age: number | null;
  educationYears: number | null;
  language: string;
  sleepHours: number | null;
  sleepQuality: number | null;
  fatigue: number | null;
  mood: number | null;
  stress: number | null;
  vision: 'none' | 'mild' | 'significant' | null;
  hearing: 'none' | 'mild' | 'significant' | null;
  motor: 'none' | 'mild' | 'significant' | null;
  digitalFamiliarity: 'low' | 'medium' | 'high' | null;
  device: 'tablet' | 'desktop' | 'phone' | null;
  reportedBy: 'PATIENT' | 'CLINICIAN' | 'UNKNOWN';
}

export interface TaskScore {
  taskId: string;
  taskName: string;
  domain: CognitiveDomain;
  version: string;
  form: string;
  difficultyLevel: number;
  completed: boolean;
  skipped: boolean;
  trials: number;
  correct: number;
  errors: number;
  misses: number;
  accuracy: number | null;
  medianResponseMs: number | null;
  /** Descriptive accuracy percentage. Not a clinical score. */
  score: number | null;
  notes: string[];
}

export interface DomainSummary {
  domain: CognitiveDomain;
  tasks: number;
  trials: number;
  accuracy: number | null;
  medianResponseMs: number | null;
}

export interface SessionQuality {
  completeness: number;
  comparable: boolean;
  comparableReason: string;
  flags: QualityFlag[];
}

export interface CognitiveTaskResultInput {
  taskId: string;
  form?: string;
  difficultyLevel?: number;
  startedAt?: string;
  completedAt?: string;
  skipped?: boolean;
  practiceCompleted?: boolean;
  trials?: Array<{
    index: number;
    correct: boolean;
    responseMs?: number;
    missed?: boolean;
    response?: unknown;
  }>;
  notes?: string[];
}

export interface CognitiveSessionRecord {
  sessionId: string;
  /** Assessment record that stores this session. Set when read back. */
  assessmentId?: string | null;
  mode: AssessmentMode;
  protocolVersion: string;
  algorithmVersion: string;
  startedAt: string;
  completedAt: string;
  language: string;
  tasks: TaskScore[];
  domains: DomainSummary[];
  compositeAccuracy: number | null;
  quality: SessionQuality;
  context: AssessmentContext;
  confounders: QualityFlag[];
  clinicianReviewRequired: true;
  synthetic: boolean;
  planId: string | null;
  administrationMinutes: number | null;
}

export interface PlanTask {
  taskId: string;
  name: string;
  domain: CognitiveDomain;
  subdomain: string;
  form: string;
  difficultyLevel: number;
  durationMinutes: number;
  order: number;
  rationale: string[];
  accommodations: string[];
  alternateFormsAvailable: string[];
}

export interface AssessmentPlan {
  planId: string;
  patientId: string;
  mode: AssessmentMode;
  protocolId: string;
  protocolVersion: string;
  algorithmVersion: string;
  generatedAt: string;
  sessionMinutes: number;
  tasks: PlanTask[];
  accommodations: string[];
  warnings: QualityFlag[];
  confounders: QualityFlag[];
  standardizationNotice: string | null;
  clinicianReviewRequired: boolean;
  clinicianApproval: {
    decision: 'APPROVED' | 'CHANGES_REQUESTED';
    note: string;
    reviewedBy: string;
    reviewedAt: string;
  } | null;
  validationNotice: string;
}
