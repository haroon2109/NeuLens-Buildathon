export type WorkflowStageState = string;

export interface SafetyAccessibilityResult {
  sessionQuality: {
    comparable: boolean;
    completion: string;
    interruptions: number;
    reasons: string[];
  };
  consent: {
    recorded: boolean;
    missing: boolean;
    details: string[];
  };
  urgentFlags: string[];
  accessibility: {
    contextAvailable: boolean;
    missingContext: string[];
    qualityGated: boolean;
  };
  canInterpretChange: boolean;
}

export interface HistoryResult {
  baseline: any | null;
  baselineCreated: boolean;
  assessments: any[];
  assessmentsCount: number;
  contextInputs: any[];
}

export interface LongitudinalIntelligenceResult {
  status: 'INSUFFICIENT_DATA' | 'NO_CHANGE' | 'REVIEW';
  cognitiveChange: number | null;
  outsideBaseline: boolean;
  reviewReasons: string[];
  comparableAssessments: number;
  /** Whether this patient's own variability supports a change claim at all. */
  reliability?: {
    state: 'NOT_ESTABLISHED' | 'PROVISIONAL';
    pairs: number;
    standardDeviationOfChange: number | null;
    reliableChangeThreshold: number | null;
  };
  changeSummary: any;
}

export interface ClinicalDocumentationResult {
  interpretation: string;
  pathway: any[];
  preventionSignals: string[];
  nextSteps: any[];
  evidence: {
    sources: string[];
    limitations: string[];
    uncertainty: string;
  };
}

export interface FollowUpCoordinationResult {
  recommended: boolean;
  cadence: string;
  closedLoop: string;
  requiresClinicalReview: boolean;
  referralDecision: 'CLINICIAN_OWNED';
}

export interface AssessmentWorkflowOutput {
  success: boolean;
  message: string;
  assessment: any;
  baseline: any | null;
  longitudinalRecord: any;
  changeDetection: any;
  brainHealthProfile: any;
  platform: any;
  /** Source-linked evidence and recorded limitations for this session. */
  documentation?: { evidence: ClinicalDocumentationResult['evidence'] };
  workflow: {
    architecture: 'deterministic-orchestrator-v1';
    stages: Array<{ key: string; engine: string; status: 'completed' | 'skipped'; summary: string }>;
    llmAssistance: { used: boolean; areas: string[]; note: string };
  };
}
