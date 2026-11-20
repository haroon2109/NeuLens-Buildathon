/**
 * Patient-visible assessment projection.
 *
 * One policy, enforced in one place: a patient may see the measurements taken
 * from their own session, but never a clinical risk classification and never
 * clinician notes that are still pending review.
 *
 * This is an allowlist on purpose. Adding a field to the database or to the
 * clinician API must not silently widen what a patient receives — the new
 * field stays invisible until it is named here.
 */

const PATIENT_VISIBLE_TASK_KEYS = [
  'quality',
  'task2',
  'task3',
  'task5',
  'functionalCheckIn',
  'functionalAssessment',
  'dailyFunction',
  // Sanitised cognitive-session summary only. Task-level raw detail and the
  // exploratory composite stay clinician-side. No risk tier is included.
  'cognitiveSummary'
] as const;

type TaskResponses = Record<string, unknown> | null | undefined;

const pickTaskResponses = (taskResponses: TaskResponses): Record<string, unknown> => {
  if (!taskResponses || typeof taskResponses !== 'object') return {};
  const visible: Record<string, unknown> = {};
  for (const key of PATIENT_VISIBLE_TASK_KEYS) {
    if (taskResponses[key] !== undefined) visible[key] = taskResponses[key];
  }
  return visible;
};

interface AssessmentForPatient {
  id: string;
  date: Date | string;
  status: string;
  reviewStatus: string;
  overallScore: number | null;
  taskResponses?: TaskResponses;
  eyeMetrics?: { reactionTime: number; blinkRate: number; fixationScore: number } | null;
  voiceMetrics?: { speechRate: number; pauseScore: number; jitter?: number; shimmer?: number } | null;
  faceMetrics?: { symmetry: number; tremorScore?: number } | null;
  report?: { recommendation?: string | null; doctorNotes?: string | null } | null;
}

export interface PatientAssessmentView {
  id: string;
  date: Date | string;
  status: string;
  reviewStatus: string;
  overallScore: number | null;
  taskResponses: Record<string, unknown>;
  eyeMetrics: { reactionTime: number; blinkRate: number; fixationScore: number } | null;
  voiceMetrics: { speechRate: number; pauseScore: number } | null;
  faceMetrics: { symmetry: number } | null;
  recommendation: string | null;
  clinicianNotes: string | null;
}

export function toPatientAssessmentView(assessment: AssessmentForPatient): PatientAssessmentView {
  const reviewed = assessment.reviewStatus !== 'PENDING_REVIEW';

  return {
    id: assessment.id,
    date: assessment.date,
    status: assessment.status,
    reviewStatus: assessment.reviewStatus,
    overallScore: assessment.overallScore,
    taskResponses: pickTaskResponses(assessment.taskResponses),
    eyeMetrics: assessment.eyeMetrics
      ? {
          reactionTime: assessment.eyeMetrics.reactionTime,
          blinkRate: assessment.eyeMetrics.blinkRate,
          fixationScore: assessment.eyeMetrics.fixationScore
        }
      : null,
    // jitter and shimmer are acoustic research features, not patient-facing
    // measures, so they are deliberately not forwarded.
    voiceMetrics: assessment.voiceMetrics
      ? {
          speechRate: assessment.voiceMetrics.speechRate,
          pauseScore: assessment.voiceMetrics.pauseScore
        }
      : null,
    faceMetrics: assessment.faceMetrics
      ? { symmetry: assessment.faceMetrics.symmetry }
      : null,
    recommendation: assessment.report?.recommendation || null,
    clinicianNotes: reviewed ? assessment.report?.doctorNotes || null : null
  };
}
