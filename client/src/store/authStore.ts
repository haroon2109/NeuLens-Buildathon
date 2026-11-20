import { create } from 'zustand';
import { endSession } from '../services/sessionApi';

export type AccountRole = 'PATIENT' | 'CLINICIAN' | 'INSTITUTION' | 'ADMIN';
export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';

export interface UserPayload {
  id: string;
  accountId?: string;
  patientId?: string | null;
  email: string;
  phone?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: AccountRole;
  verificationStatus?: VerificationStatus;
  /** Account lifecycle state; a suspended account is blocked from portal data. */
  status?: 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';
  emailVerified?: boolean;
  age?: number;
  dob?: string | null;
  gender?: string | null;
  language?: string | null;
  educationYears?: number | null;
  handedness?: string | null;
  specialty?: string | null;
  professionalRegistrationNumber?: string | null;
  institutionName?: string | null;
  institutionType?: string | null;
  city?: string | null;
}

interface AuthState {
  user: UserPayload | null;
  isAuthenticated: boolean;
  role: AccountRole | null;
  login: (user: UserPayload, rememberMe?: boolean) => void;
  updateUser: (updates: Partial<UserPayload>) => void;
  logout: () => void;
  isClinician: () => boolean;
  isPatient: () => boolean;
  isVerified: () => boolean;
  isPendingApproval: () => boolean;
}

const USER_KEY = 'cv_user';

/** Reads a value from either persistent (remember me) or per-tab storage. */
const readStored = (key: string): string | null => {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const clearStored = () => {
  try {
    localStorage.removeItem(USER_KEY);
    // Older clients persisted a bearer token here; remove any leftover copy.
    localStorage.removeItem('cv_token');
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('cv_token');
  } catch {
    // Ignore storage errors in sandboxed browsers
  }
};

/**
 * The signed-in profile is a display cache only. The credential is the HttpOnly
 * session cookie, which this store can neither read nor forge; every request
 * that matters is authorised by the server.
 */
export const useAuthStore = create<AuthState>((set, get) => {
  let cachedUser: UserPayload | null = null;

  try {
    const userStr = readStored(USER_KEY);
    cachedUser = userStr ? JSON.parse(userStr) : null;
  } catch {
    // Ignore storage errors in sandbox
  }

  return {
    user: cachedUser,
    isAuthenticated: Boolean(cachedUser),
    role: cachedUser ? cachedUser.role : null,

    login: (user: UserPayload, rememberMe: boolean = true) => {
      clearStored();
      try {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(USER_KEY, JSON.stringify(user));
      } catch {
        // Ignore storage errors in sandbox
      }
      set({ user, isAuthenticated: true, role: user.role });
    },

    updateUser: (updates: Partial<UserPayload>) => {
      const current = get().user;
      if (!current) return;
      const nextUser = { ...current, ...updates };
      try {
        const storage = localStorage.getItem(USER_KEY) ? localStorage : sessionStorage;
        storage.setItem(USER_KEY, JSON.stringify(nextUser));
      } catch {
        // Ignore storage errors in sandbox
      }
      set({ user: nextUser, role: nextUser.role });
    },

    logout: () => {
      clearStored();
      void endSession();
      set({ user: null, isAuthenticated: false, role: null });
    },

    isClinician: () => {
      const u = get().user;
      return Boolean(u && (u.role === 'CLINICIAN' || u.role === 'ADMIN'));
    },

    isPatient: () => {
      const u = get().user;
      return Boolean(u && u.role === 'PATIENT');
    },

    isVerified: () => {
      const u = get().user;
      if (!u) return false;
      return !u.verificationStatus || u.verificationStatus === 'VERIFIED';
    },

    isPendingApproval: () => {
      const u = get().user;
      return Boolean(u && u.role !== 'PATIENT' && u.verificationStatus === 'PENDING');
    }
  };
});
