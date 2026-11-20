/**
 * Neulens hospital portals API client
 * Connects Frontend to Patient & Doctor Backend Endpoints
 */

import { notifySessionExpired } from '../components/systemStates';

const API_BASE_URL = ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '').replace(/\/$/, '');
const API_ROOT = `${API_BASE_URL}/api/v1`;

/**
 * The session credential is an HttpOnly cookie, so it is sent automatically.
 * No bearer token is read from or written to browser storage.
 */
const WITH_SESSION: RequestInit = { credentials: 'include' };

/**
 * Reads a response body without assuming it is JSON.
 *
 * `res.json()` throws "Unexpected end of JSON input" whenever the body is empty,
 * which is what a proxy returns when the API is not running. That message tells
 * the user nothing, so translate every non-JSON outcome into a real one.
 */
async function readResponse(res: Response, notifyOnUnauthorized = true): Promise<any> {
  let text: string;
  try {
    text = await res.text();
  } catch {
    throw new Error(`Could not read the server response (status ${res.status}).`);
  }

  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`The server returned an unexpected response (status ${res.status}).`);
    }
  }

  const serverMessage = json && (json.error || json.message);

  if (res.status === 401) {
    // Expired or revoked token: surface the sign-in prompt rather than a blank page.
    // A rejected sign-in is not an expired session, so login calls opt out.
    if (notifyOnUnauthorized) {
      notifySessionExpired();
      throw new Error('Your session has expired. Please sign in again.');
    }
    throw new Error(serverMessage || 'Invalid credentials.');
  }

  if (!res.ok) {
    throw new Error(serverMessage || `Request failed (status ${res.status}).`);
  }

  if (json === null) {
    if (res.status >= 500) {
      throw new Error('The API server did not respond. Please check that it is running and try again.');
    }
    throw new Error(`The server returned an empty response (status ${res.status}).`);
  }

  return json;
}

async function apiRequest(
  path: string,
  init?: RequestInit,
  options: { notifyOnUnauthorized?: boolean } = {}
): Promise<any> {
  let res: Response;
  try {
    res = await fetch(`${API_ROOT}${path}`, { ...WITH_SESSION, ...init });
  } catch {
    throw new Error('Cannot reach the Neulens server. Please check that the API server is running and try again.');
  }
  return readResponse(res, options.notifyOnUnauthorized ?? true);
}

// ----------------------------------------------------------------------------
// PATIENT PORTAL API
// ----------------------------------------------------------------------------
export interface PatientRegisterData {
  name: string;
  age: number;
  dob?: string;
  gender: string;
  language: string;
  educationYears?: number;
  handedness?: string;
  pin?: string;
}

export interface PatientLoginData {
  patientId: string;
  verification: string;
}

// No measurement is optional-with-a-default: an unrecorded value is sent as null.
// `overallScore` is null when the battery did not produce an interpretable result.
// There is deliberately no risk tier in the submission contract.
export interface PatientSubmitAssessmentData {
  patientId?: string;
  overallScore: number | null;
  reactionTime: number | null;
  blinkRate: number | null;
  fixationScore: number | null;
  speechRate: number | null;
  pauseScore: number | null;
  jitter: number | null;
  shimmer: number | null;
  symmetry: number | null;
  tremorScore: number | null;
  taskResponses?: any;
  recommendation?: string;
}

export type PatientApi = {
  register(data: PatientRegisterData): Promise<any>;
  login(data: PatientLoginData): Promise<any>;
  getSession(): Promise<any>;
  submitAssessmentComplete(data: any): Promise<any>;
  getConfirmationCard(): Promise<any>;
  analyzeArabic(text: string, model?: 'RIGHTNOW_ARABIC' | 'ARABERT'): Promise<any>;
  getLanguageReadiness(): Promise<LanguageReadinessResponse>;
};

export interface LanguageReadinessEntry {
  id: string;
  name: string;
  nativeName: string;
  bcp47: string;
  dir: 'ltr' | 'rtl';
  taskAdministrationReady: boolean;
  readinessPercent: number;
  pendingStages: Array<{ key: string; label: string }>;
  participantNotice: string;
}

export interface LanguageReadinessResponse {
  generatedAt: string;
  note: string;
  languages: LanguageReadinessEntry[];
}

export const patientApi: PatientApi = {
  async register(data: PatientRegisterData) {
    return apiRequest('/patient/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async login(data: PatientLoginData) {
    return apiRequest('/patient/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async getSession() {
    return apiRequest('/patient/session', {
    });
  },

  async submitAssessmentComplete(data: any) {
    return apiRequest('/patient/assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
  },

  async getLanguageReadiness() {
    // Public endpoint: the language screen must be able to tell the truth about
    // which languages can actually administer the tasks.
    return apiRequest('/language-readiness', {});
  },

  async getConfirmationCard() {
    return apiRequest('/patient/confirmation-card', {
    });
  },
  async analyzeArabic(text: string, model?: 'RIGHTNOW_ARABIC' | 'ARABERT') {
    return apiRequest('/arabic/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model })
    });
  },
};

// ----------------------------------------------------------------------------
// DOCTOR PORTAL API
// ----------------------------------------------------------------------------
export interface DoctorDashboardStats {
  totalPatients: number;
  assessmentsToday: number;
  completedAssessments: number;
  pendingReviews: number;
  changeReviewCount: number;
  changeReviewQueue: Array<{
    patientId: string;
    patientName: string;
    latestAssessmentDate: string;
    cognitiveChange: number | null;
    worsenedActivityIds: string[];
    reviewReasons: Array<'OUTSIDE_RELIABLE_CHANGE' | 'FUNCTIONAL_CHANGE' | 'CONTEXT_CHANGE'>;
  }>;
  recentAssessments: Array<{
    id: string;
    patientId: string;
    patientName: string;
    age: number;
    date: string;
    assessmentType: string;
    score: number | null;
    reviewState: string;
    reviewStatus: string;
  }>;
}

export const doctorApi = {
  async login(email: string, password: string) {
    return apiRequest(
      '/doctor/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      },
      { notifyOnUnauthorized: false }
    );
  },

  async getDashboard(): Promise<DoctorDashboardStats> {
    const json = await apiRequest('/doctor/dashboard', {
    });
    return json.stats;
  },

  async getPatients(query = '', reviewState = 'ALL') {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (reviewState && reviewState !== 'ALL') params.set('reviewState', reviewState);

    const json = await apiRequest(`/doctor/patients?${params.toString()}`, {
    });
    return json.patients;
  },

  async getPatientProfile(id: string) {
    return apiRequest(`/doctor/patients/${id}`, {
    });
  },

  async getScreeningReport(assessmentId: string) {
    const json = await apiRequest(`/doctor/reports/${assessmentId}`, {
    });
    return json.report;
  },

  async updateReportReview(assessmentId: string, reviewStatus: 'PENDING_REVIEW' | 'REVIEWED' | 'FOLLOWUP_REQUIRED', doctorNotes: string) {
    return apiRequest(`/doctor/reports/${assessmentId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reviewStatus, doctorNotes })
    });
  },

  async saveCarePlan(assessmentId: string, plan: {
    action: 'REPEAT_SCREENING' | 'CLINICAL_REVIEW' | 'REVIEW_CONTEXT' | 'SUPPORT_FUNCTION';
    followUpDate: string | null;
    notes: string;
    plan?: Record<string, unknown>;
  }) {
    return apiRequest(`/doctor/reports/${assessmentId}/care-plan`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plan)
    });
  },

  async exportAssessment(assessmentId: string): Promise<void> {
    let res: Response;
    try {
      res = await fetch(`${API_ROOT}/doctor/reports/${assessmentId}/export`, { ...WITH_SESSION });
    } catch {
      throw new Error('Cannot reach the Neulens server. Please check that the API server is running and try again.');
    }
    if (res.status === 401) {
      notifySessionExpired();
      throw new Error('Your session has expired. Please sign in again.');
    }
    if (!res.ok) {
      let message = `Export failed (status ${res.status}).`;
      try {
        const j = await res.json();
        message = j.error || j.message || message;
      } catch {}
      throw new Error(message);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neulens-assessment-${assessmentId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  async getReferrals() {
    const json = await apiRequest('/doctor/referrals', {
    });
    return json.referrals || [];
  },

  async getPatientReferrals(patientId: string) {
    const json = await apiRequest(`/doctor/patients/${patientId}/referrals`, {
    });
    return json.referrals || [];
  },

  async createReferral(patientId: string, referral: any) {
    return apiRequest(`/doctor/patients/${patientId}/referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(referral)
    });
  },

  async updateReferralOutcome(referralId: string, updates: any) {
    return apiRequest(`/doctor/referrals/${referralId}/outcome`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
  },

  async getExternalInstrumentCatalog() {
    return apiRequest('/external-instruments/catalog', {});
  },

  async recordExternalInstrument(patientId: string, record: {
    instrumentKey: string;
    instrumentVersion?: string;
    language: string;
    administeredOn: string;
    administeredBy: string;
    score: number;
    licenceConfirmed: boolean;
    licenceReference?: string;
    notes?: string;
  }) {
    return apiRequest(`/external-instruments/patients/${patientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  },

  async getAppointments() {
    const json = await apiRequest('/doctor/appointments', {
    });
    return json.appointments || [];
  },

  async createAppointment(patientId: string, appointment: {
    title: string;
    type: 'FOLLOW_UP' | 'REPEAT_ASSESSMENT' | 'RESULTS_REVIEW' | 'TELEHEALTH';
    date: string;
    time: string;
    location?: string;
    communication?: string;
    assessmentId?: string | null;
  }) {
    return apiRequest(`/doctor/patients/${patientId}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointment)
    });
  },

  async updateAppointment(id: string, updates: { status?: string; date?: string; time?: string }) {
    return apiRequest(`/doctor/appointments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
  },

  async getPlatformInsights() {
    return apiRequest('/doctor/platform-insights', {
    });
  },

  async getAssessmentLanguageReadiness() {
    return apiRequest('/doctor/assessment-language-readiness', {
    });
  },

  async recordLanguageSignOff(payload: { language: string; stage: string; status?: string; notes?: string }) {
    return apiRequest('/doctor/assessment-language-readiness/sign-off', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  },

  /**
   * Analyze Arabic text using the research-stage language model.
   *
   * Body: { text: string, model?: 'RIGHTNOW_ARABIC' | 'ARABERT' }
   *
   * Response: { modelUsed, sentiment?, keyPhrases?, backTranslationOk?, disclaimer }
   *
   * Note: Output is exploratory only – not a clinical score or diagnosis.
   */
  async analyzeArabic(text: string, model?: 'RIGHTNOW_ARABIC' | 'ARABERT') {
    return apiRequest('/arabic/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model })
    });
  }
};
