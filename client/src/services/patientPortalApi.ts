/**
 * Patient portal data access.
 *
 * Uses the signed-in patient's bearer token. Read failures resolve to empty
 * values so the portal can show an honest empty state instead of crashing.
 */

import { notifySessionExpired } from '../components/systemStates';

const API_BASE_URL = ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '').replace(/\/$/, '');
const API_ROOT = `${API_BASE_URL}/api/v1`;

/**
 * Authorisation travels in an HttpOnly session cookie, so the credential is
 * never handled by browser JavaScript.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${API_ROOT}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      }
    });
  } catch {
    throw new Error('Cannot reach the Neulens server. Check your connection and try again.');
  }

  // An expired or revoked token is not an empty result: ask the user to sign in.
  if (res.status === 401) {
    notifySessionExpired();
    return null;
  }

  if (!res.ok) {
    throw new Error(
      res.status >= 500
        ? 'The portal is temporarily unavailable. Please try again in a moment.'
        : `The portal could not complete this request (status ${res.status}).`
    );
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new Error('The portal returned an unreadable response. Please try again.');
  }
}

export interface PatientAssessmentRecord {
  id: string;
  date: string;
  status: string;
  reviewStatus: string;
  overallScore: number;
  taskResponses?: Record<string, any>;
  eyeMetrics?: { reactionTime: number; blinkRate: number; fixationScore: number } | null;
  voiceMetrics?: { speechRate: number; pauseScore: number; jitter: number; shimmer: number } | null;
  faceMetrics?: { symmetry: number; tremorScore: number } | null;
  recommendation?: string | null;
  clinicianNotes?: string | null;
}

export interface BaselineRecord {
  id: string;
  establishedAt: string;
  overallScore: number;
  cognitiveScore: number;
  functionalScore: number;
  eyeScore: number | null;
  voiceScore: number | null;
  faceScore: number | null;
  contextScore: number | null;
  isActive: boolean;
}

export interface LongitudinalRecord {
  id: string;
  assessmentId: string;
  recordedAt: string;
  overallScore: number;
  changeFromBaseline: number | null;
  trendDirection: string | null;
  assessmentsCount: number;
}

export interface ChangeDetectionRecord {
  id: string;
  detectedAt: string;
  status: string;
  cognitiveChange: number | null;
  outsideBaseline: boolean;
  reviewReasons: string[] | null;
}

export interface ContextInputRecord {
  id: string;
  source: string;
  recordedAt: string;
  values: Record<string, any>;
  consentGranted: boolean;
}

export interface BrainHealthProfileRecord {
  id: string;
  generatedAt: string;
  profileScore: number | null;
  reviewSignal: string;
  interpretation: string;
  nextSteps: string[];
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface PatientAppointmentRecord {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  communication: string;
  clinician: string;
}

export interface ConsentRecord {
  id: string;
  version: string;
  scopes: Record<string, boolean>;
  granted: boolean;
  grantedAt: string;
  withdrawnAt: string | null;
}

/** Version of the consent text shown in the patient onboarding flow. */
export const CONSENT_VERSION = '2026-11-consent-v1';

export interface PatientOverview {
  assessments: PatientAssessmentRecord[];
  baseline: BaselineRecord | null;
  longitudinal: LongitudinalRecord[];
  changes: ChangeDetectionRecord[];
  context: ContextInputRecord[];
  brainHealth: BrainHealthProfileRecord | null;
}

export const patientPortalApi = {
  async getOverview(): Promise<PatientOverview> {
    // Baseline and brain-health legitimately return 404 until the patient has
    // enough history. Those are empty states, not a failure of the whole
    // overview, so each optional resource settles independently.
    const optional = <T,>(promise: Promise<T | null>) => promise.catch(() => null);
    const [assessments, baseline, longitudinal, changes, context, brainHealth] = await Promise.all([
      request<{ assessments: PatientAssessmentRecord[] }>('/patient/assessments'),
      optional(request<{ baseline: BaselineRecord }>('/baseline')),
      optional(request<{ records: LongitudinalRecord[] }>('/longitudinal')),
      optional(request<{ detections: ChangeDetectionRecord[] }>('/change-detection')),
      optional(request<{ inputs: ContextInputRecord[] }>('/context-inputs')),
      optional(request<{ profile: BrainHealthProfileRecord }>('/brain-health'))
    ]);

    return {
      assessments: assessments?.assessments || [],
      baseline: baseline?.baseline || null,
      longitudinal: longitudinal?.records || [],
      changes: changes?.detections || [],
      context: context?.inputs || [],
      brainHealth: brainHealth?.profile || null
    };
  },

  async saveContextInput(source: string, values: Record<string, unknown>) {
    return request('/context-inputs', {
      method: 'POST',
      body: JSON.stringify({
        source,
        values,
        consentGranted: true,
        consentAt: new Date().toISOString()
      })
    });
  },

  /**
   * Records consent server-side. The browser copy is only a display cache; this
   * call is what makes the consent a durable record with version and timestamp.
   */
  async recordConsent(scopes: Record<string, boolean>) {
    return request<{ consent: ConsentRecord }>('/patient/consent', {
      method: 'POST',
      body: JSON.stringify({ version: CONSENT_VERSION, scopes })
    });
  },

  async getConsent() {
    return request<{ consents: ConsentRecord[] }>('/patient/consent');
  },

  async getAppointments(): Promise<PatientAppointmentRecord[]> {
    const json = await request<{ appointments: PatientAppointmentRecord[] }>('/patient/appointments');
    return json?.appointments || [];
  },

  async updateAppointment(
    id: string,
    updates: { status?: 'CANCELLED' | 'RESCHEDULED'; date?: string; time?: string }
  ) {
    return request<{ appointment: PatientAppointmentRecord }>(`/patient/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }
};
