/**
 * Shared NeuLens authentication client (screens 08–14).
 *
 * Uses the same /api/v1 root and Vite proxy as portalApi, with a typed error that
 * preserves the verification challenge returned by the server.
 */

import type { AccountRole, UserPayload } from '../store/authStore';

const API_BASE_URL = ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '').replace(/\/$/, '');
const API_ROOT = `${API_BASE_URL}/api/v1`;

export interface AuthChallenge {
  challengeId?: string;
  devOtp?: string;
  expiresInSeconds?: number;
}

export interface AuthResponse extends AuthChallenge {
  success: boolean;
  message?: string;
  identifier?: string;
  user?: UserPayload;
  account?: UserPayload;
  requiresVerification?: boolean;
  requiresApproval?: boolean;
}

export class AuthRequestError extends Error {
  status: number;
  payload: AuthResponse;

  constructor(message: string, status: number, payload: AuthResponse) {
    super(message);
    this.name = 'AuthRequestError';
    this.status = status;
    this.payload = payload;
  }
}

async function authRequest(path: string, init?: RequestInit): Promise<AuthResponse> {
  let res: Response;
  try {
    // Required so the HttpOnly session cookie is both sent and stored.
    res = await fetch(`${API_ROOT}${path}`, { credentials: 'include', ...init });
  } catch {
    throw new AuthRequestError(
      'Cannot reach the NeuLens server. Please check that the API server is running and try again.',
      0,
      { success: false }
    );
  }

  const text = await res.text();
  let payload: AuthResponse = { success: false };

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new AuthRequestError(`The server returned an unexpected response (status ${res.status}).`, res.status, {
        success: false,
      });
    }
  }

  if (!res.ok) {
    const message =
      (payload as any).error ||
      (payload as any).message ||
      `Request failed (status ${res.status}).`;
    throw new AuthRequestError(message, res.status, payload);
  }

  return payload;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export interface SignupPayload {
  role: AccountRole;
  name: string;
  email: string;
  phone: string;
  password: string;
  acceptedTerms: boolean;
  dateOfBirth?: string;
  gender?: string;
  language?: string;
  specialty?: string;
  professionalRegistrationNumber?: string;
  yearsExperience?: number;
  institutionName?: string;
  institutionType?: string;
  institutionRegistrationNumber?: string;
  contactPerson?: string;
  city?: string;
}

export const authApi = {
  async demoStatus(): Promise<{ enabled: boolean }> {
    const res = await fetch(`${API_ROOT}/auth/demo-status`, { credentials: 'include' });
    if (!res.ok) throw new Error('Unable to check demo access.');
    return res.json();
  },

  signup(payload: SignupPayload) {
    return authRequest('/auth/signup', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  },

  signin(payload: { identifier: string; password: string; rememberMe: boolean }) {
    return authRequest('/auth/signin', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  },

  verifyOtp(payload: { challengeId: string; code: string }) {
    return authRequest('/auth/verify', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  },

  resendOtp(challengeId: string) {
    return authRequest('/auth/resend', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ challengeId }),
    });
  },

  forgotPassword(identifier: string) {
    return authRequest('/auth/password/forgot', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ identifier }),
    });
  },

  resetPassword(payload: { identifier: string; code: string; newPassword: string }) {
    return authRequest('/auth/password/reset', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(payload),
    });
  },

  verificationStatus() {
    return authRequest('/auth/verification');
  },
};
