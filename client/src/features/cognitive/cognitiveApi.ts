import type { AssessmentMode, CognitiveDomain } from './types';

const API_ROOT = `${((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '').replace(/\/$/, '')}/api/v1`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_ROOT}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }
  });
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* keep the status message */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export interface SessionContext {
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

export interface QualityFlag {
  code: string;
  label: string;
  detail: string;
  severity: 'INFO' | 'WARNING' | 'BLOCKER';
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
  score: number | null;
  notes: string[];
}

export interface CognitiveSessionRecord {
  sessionId: string;
  assessmentId?: string | null;
  mode: AssessmentMode;
  protocolVersion: string;
  algorithmVersion: string;
  startedAt: string;
  completedAt: string;
  language: string;
  tasks: TaskScore[];
  domains: Array<{
    domain: CognitiveDomain;
    tasks: number;
    trials: number;
    accuracy: number | null;
    medianResponseMs: number | null;
  }>;
  compositeAccuracy: number | null;
  quality: {
    completeness: number;
    comparable: boolean;
    comparableReason: string;
    flags: QualityFlag[];
  };
  context: SessionContext;
  confounders: QualityFlag[];
  clinicianReviewRequired: true;
  synthetic: boolean;
  planId: string | null;
  administrationMinutes: number | null;
}

export interface TaskResultPayload {
  taskId: string;
  form: string;
  difficultyLevel: number;
  startedAt: string;
  completedAt: string;
  skipped: boolean;
  trials: Array<{ index: number; correct: boolean; responseMs: number; missed?: boolean; response?: unknown }>;
  notes?: string[];
}

export interface SessionSubmission {
  mode: AssessmentMode;
  planId: string;
  protocolId: string;
  protocolVersion: string;
  plan: { tasks: Array<{ taskId: string; form: string; difficultyLevel: number }> };
  context: Partial<SessionContext>;
  language: string;
  startedAt: string;
  completedAt: string;
  results: TaskResultPayload[];
  interruptions: number;
  breaksTaken: number;
}

export const cognitiveApi = {
  async getContext() {
    return request<{ context: SessionContext; missingFields: string[] }>('/patient/cognitive/context');
  },
  async createPlan(mode: AssessmentMode, sessionMinutes: number, context: Partial<SessionContext>) {
    return request<{ plan: AssessmentPlan }>('/patient/cognitive/plan', {
      method: 'POST',
      body: JSON.stringify({ mode, sessionMinutes, context })
    });
  },
  async submitSession(payload: SessionSubmission) {
    return request<{ assessmentId: string; session: CognitiveSessionRecord }>('/patient/cognitive/sessions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async getHistory() {
    return request<{ sessions: CognitiveSessionRecord[]; note: string }>('/patient/cognitive/history');
  },
  async getClinicianPatientSessions(identifier: string) {
    return request<{
      patient: { id: string; patientId: string; name: string; age: number; language: string; educationYears: number | null };
      sessions: CognitiveSessionRecord[];
    }>(`/doctor/patients/${encodeURIComponent(identifier)}/cognitive`);
  },
  async getClinicianPatientPlan(identifier: string) {
    return request<{
      patient: { id: string; patientId: string; name: string };
      plan: AssessmentPlan | null;
    }>(`/doctor/patients/${encodeURIComponent(identifier)}/cognitive/plan`);
  },
  async approvePlan(identifier: string, planId: string, decision: 'APPROVED' | 'CHANGES_REQUESTED', note: string) {
    return request<{ approval: { planId: string; decision: string; note: string; reviewedBy: string; reviewedAt: string } }>(
      `/doctor/patients/${encodeURIComponent(identifier)}/cognitive/plan-approval`,
      { method: 'POST', body: JSON.stringify({ planId, decision, note }) }
    );
  }
};
