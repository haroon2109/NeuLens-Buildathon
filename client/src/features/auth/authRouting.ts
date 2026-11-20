import type { UserPayload } from '../../store/authStore';

/**
 * Single place that decides where an authenticated account belongs.
 * Professionals whose credentials are still under review never reach records.
 */
export const portalPathForUser = (user: UserPayload): string => {
  if (user.role === 'PATIENT') {
    return '/patient/welcome';
  }

  if (user.role === 'CLINICIAN' || user.role === 'ADMIN') {
    return user.verificationStatus === 'PENDING' ? '/auth/pending-approval' : '/doctor/dashboard';
  }

  if (user.role === 'INSTITUTION') {
    return '/auth/pending-approval';
  }

  return '/auth/pending-approval';
};

export const roleLabel = (role?: string | null): string => {
  switch (role) {
    case 'PATIENT':
      return 'Patient';
    case 'CLINICIAN':
      return 'Doctor';
    case 'INSTITUTION':
      return 'Healthcare institution';
    case 'ADMIN':
      return 'Administrator';
    default:
      return 'Account';
  }
};
