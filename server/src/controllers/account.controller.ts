import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { HospitalDataStore } from '../models/dataStore';
import {
  accountSignupSchema,
  accountLoginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validation/account.schemas';
import { getJwtSecret } from '../config/jwt';
import {
  setSessionCookie,
  readSessionToken,
  SESSION_MAX_AGE_MS,
} from '../services/sessionCookie';
import { sendOtpEmail } from '../services/email';

export type AccountRole = 'PATIENT' | 'CLINICIAN' | 'INSTITUTION';
export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';

export interface AccountRecord {
  id: string;
  role: AccountRole;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  verificationStatus: VerificationStatus;
  emailVerified: boolean;
  patientId?: string | null;
  hospitalUserId?: string | null;
  specialty?: string;
  professionalRegistrationNumber?: string;
  yearsExperience?: number;
  institutionName?: string;
  institutionType?: string;
  institutionRegistrationNumber?: string;
  contactPerson?: string;
  city?: string;
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OtpChallenge {
  id: string;
  accountId: string;
  identifier: string;
  purpose: 'SIGNUP' | 'PASSWORD_RESET';
  code: string;
  expiresAt: number;
  attempts: number;
}

export interface AccountAuthenticatedRequest extends Request {
  account?: { id: string; role: AccountRole; verificationStatus: VerificationStatus };
}

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const normalisePhone = (value: string) => value.replace(/\D/g, '');

const toPublicUser = (account: AccountRecord) => ({
  id: account.hospitalUserId || account.id,
  accountId: account.id,
  patientId: account.patientId || null,
  name: account.name,
  email: account.email,
  phone: account.phone,
  role: account.role,
  verificationStatus: account.verificationStatus,
  emailVerified: account.emailVerified,
  specialty: account.specialty || null,
  professionalRegistrationNumber: account.professionalRegistrationNumber || null,
  institutionName: account.institutionName || null,
  institutionType: account.institutionType || null,
  city: account.city || null,
  language: account.language || 'en',
});

/**
 * Account store for the shared authentication flow.
 *
 * Doctor and institution accounts are intentionally not written to the clinical
 * User table until an administrator has verified their credentials. This keeps
 * unverified professionals out of patient-record APIs entirely.
 */
// In-memory account store for the shared authentication flow. Demo accounts
// are added at startup by services/demoAccess.ts when demo access is enabled;
// real clinicians are provisioned with `npm run clinician:create`.
export const accounts: AccountRecord[] = [];

const otpChallenges: OtpChallenge[] = [];

const findAccountByEmailOrPhone = (identifier: string): AccountRecord | undefined => {
  const value = identifier.trim().toLowerCase();
  const digits = normalisePhone(identifier);

  return accounts.find((account) => {
    if (account.email.toLowerCase() === value) return true;
    if (!digits) return false;
    const stored = normalisePhone(account.phone);
    return stored === digits || stored.slice(-10) === digits.slice(-10);
  });
};

const issueToken = (account: AccountRecord, rememberMe: boolean) => {
  // Unverified clinicians receive a role that clinical routes reject, so a pending
  // account cannot read patient records even if it holds a valid session token.
  let tokenRole: string = account.role;
  if (account.role === 'CLINICIAN' && account.verificationStatus !== 'VERIFIED') {
    tokenRole = 'PENDING_CLINICIAN';
  }

  return jwt.sign(
    {
      id: account.hospitalUserId || account.id,
      accountId: account.id,
      email: account.email,
      role: tokenRole,
      verificationStatus: account.verificationStatus,
      patientId: account.patientId || undefined,
    },
    getJwtSecret(),
    { expiresIn: rememberMe ? '30d' : '12h' }
  );
};

const createChallenge = (
  account: AccountRecord,
  purpose: OtpChallenge['purpose'],
  identifier: string
): OtpChallenge => {
  const challenge: OtpChallenge = {
    id: `otp_${crypto.randomUUID()}`,
    accountId: account.id,
    identifier: identifier.trim(),
    purpose,
    code: String(crypto.randomInt(100000, 1000000)),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  };
  otpChallenges.push(challenge);
  return challenge;
};

/**
 * Delivers the code to the account's registered email. Returns false when email
 * delivery is not configured or the provider rejected the message, in which
 * case the development fallback may still expose the code outside production.
 */
const deliverChallenge = async (challenge: OtpChallenge): Promise<boolean> => {
  const account = accounts.find((entry) => entry.id === challenge.accountId);
  if (!account) return false;

  return sendOtpEmail({
    to: account.email,
    code: challenge.code,
    purpose: challenge.purpose,
    name: account.name,
    expiresInMinutes: Math.floor(OTP_TTL_MS / 60000),
  });
};

const challengeResponse = (challenge: OtpChallenge, emailed = false) => ({
  challengeId: challenge.id,
  expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
  emailSent: emailed,
  // Never expose the code in production. Outside production it is only a
  // fallback for when a real email was not configured/delivered.
  devOtp: !emailed && process.env.NODE_ENV !== 'production' ? challenge.code : undefined,
});

const consumeChallenge = (challengeId: string, code: string, purpose: OtpChallenge['purpose']) => {
  const challenge = otpChallenges.find((entry) => entry.id === challengeId);
  if (!challenge || challenge.purpose !== purpose) {
    return { error: 'The verification code is invalid or has expired. Request a new one.' } as const;
  }
  if (challenge.expiresAt < Date.now()) {
    return { error: 'The verification code has expired. Request a new one.' } as const;
  }
  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    return { error: 'Too many incorrect attempts. Request a new code.' } as const;
  }
  if (challenge.code !== code) {
    challenge.attempts += 1;
    return { error: 'That code does not match. Please check and try again.' } as const;
  }
  otpChallenges.splice(otpChallenges.indexOf(challenge), 1);
  return { challenge } as const;
};

const isValidDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now();
};

const calculateAge = (dateOfBirth: string) => {
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
};

const requiredString = (value: string | undefined) => Boolean(value && value.trim().length > 0);

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = accountSignupSchema.parse(req.body);

    if (data.role === 'PATIENT') {
      if (!data.dateOfBirth || !isValidDate(data.dateOfBirth)) {
        return res.status(400).json({ error: 'Enter a valid date of birth to create a patient account.' });
      }
    }

    if (data.role === 'CLINICIAN') {
      if (!requiredString(data.professionalRegistrationNumber) || !requiredString(data.specialty) || !requiredString(data.institutionName)) {
        return res.status(400).json({
          error: 'Professional registration number, specialty, and institution are required for clinician accounts.',
        });
      }
    }

    if (data.role === 'INSTITUTION') {
      if (!requiredString(data.institutionName) || !requiredString(data.institutionRegistrationNumber) || !requiredString(data.contactPerson)) {
        return res.status(400).json({
          error: 'Institution name, registration number, and contact person are required for institution accounts.',
        });
      }
    }

    const emailTaken = accounts.some((account) => account.email.toLowerCase() === data.email.toLowerCase());
    if (emailTaken) {
      return res.status(409).json({ error: 'An account already exists with this email address.' });
    }

    const phoneDigits = normalisePhone(data.phone);
    const phoneTaken = accounts.some((account) => normalisePhone(account.phone) === phoneDigits);
    if (phoneTaken) {
      return res.status(409).json({ error: 'An account already exists with this phone number.' });
    }

    let patientId: string | null = null;
    let hospitalUserId: string | null = null;
    let language = data.language || 'en';

    if (data.role === 'PATIENT') {
      const age = calculateAge(data.dateOfBirth as string);
      if (age < 1 || age > 120) {
        return res.status(400).json({ error: 'The date of birth entered is not valid.' });
      }
      const created = await HospitalDataStore.createPatient({
        name: data.name,
        age,
        dob: data.dateOfBirth,
        gender: data.gender || 'PREFER_NOT_TO_SAY',
        language,
      });
      patientId = created.patientId;
      hospitalUserId = created.user.id;
      language = created.user.language;
    }

    const account: AccountRecord = {
      id: `acct_${crypto.randomUUID()}`,
      role: data.role,
      name: data.name.trim(),
      email: data.email.toLowerCase(),
      phone: data.phone.trim(),
      passwordHash: await bcrypt.hash(data.password, 10),
      // Patients can use the platform after email verification. Professional
      // accounts stay pending until their credentials are reviewed.
      verificationStatus: data.role === 'PATIENT' ? 'VERIFIED' : 'PENDING',
      emailVerified: false,
      patientId,
      hospitalUserId,
      specialty: data.specialty,
      professionalRegistrationNumber: data.professionalRegistrationNumber,
      yearsExperience: data.yearsExperience,
      institutionName: data.institutionName,
      institutionType: data.institutionType,
      institutionRegistrationNumber: data.institutionRegistrationNumber,
      contactPerson: data.contactPerson,
      city: data.city,
      language,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    accounts.push(account);
    const challenge = createChallenge(account, 'SIGNUP', account.email);
    const emailSent = await deliverChallenge(challenge);

    return res.status(201).json({
      success: true,
      message: 'Account created. Verify your email or phone to continue.',
      requiresVerification: true,
      account: toPublicUser(account),
      ...challengeResponse(challenge, emailSent),
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { challengeId, code } = verifyOtpSchema.parse(req.body);
    const result = consumeChallenge(challengeId, code, 'SIGNUP');
    if ('error' in result) {
      return res.status(400).json({ error: result.error });
    }

    const account = accounts.find((entry) => entry.id === result.challenge.accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    account.emailVerified = true;
    account.updatedAt = new Date();

    const token = issueToken(account, false);
    setSessionCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Verification complete.',
      user: toPublicUser(account),
      requiresApproval: account.role !== 'PATIENT' && account.verificationStatus !== 'VERIFIED',
    });
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { challengeId } = resendOtpSchema.parse(req.body);
    const challenge = otpChallenges.find((entry) => entry.id === challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'This verification request has expired. Start again.' });
    }

    challenge.code = String(crypto.randomInt(100000, 1000000));
    challenge.expiresAt = Date.now() + OTP_TTL_MS;
    challenge.attempts = 0;
    const emailSent = await deliverChallenge(challenge);

    return res.status(200).json({
      success: true,
      message: 'A new verification code has been issued.',
      ...challengeResponse(challenge, emailSent),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password, rememberMe } = accountLoginSchema.parse(req.body);
    const account = findAccountByEmailOrPhone(identifier);

    if (!account) {
      return res.status(401).json({ error: 'Invalid email, phone number, or password.' });
    }

    const passwordValid = await bcrypt.compare(password, account.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email, phone number, or password.' });
    }

    if (!account.emailVerified) {
      const existing = otpChallenges.find(
        (entry) => entry.accountId === account.id && entry.purpose === 'SIGNUP'
      );
      const challenge = existing || createChallenge(account, 'SIGNUP', account.email);
      const emailSent = existing ? false : await deliverChallenge(challenge);

      return res.status(403).json({
        error: 'Verify your email or phone before signing in.',
        requiresVerification: true,
        account: toPublicUser(account),
        ...challengeResponse(challenge, emailSent),
      });
    }

    setSessionCookie(
      res,
      issueToken(account, rememberMe),
      rememberMe ? SESSION_MAX_AGE_MS.remembered : SESSION_MAX_AGE_MS.clinician
    );

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      user: toPublicUser(account),
      requiresApproval: account.role !== 'PATIENT' && account.verificationStatus !== 'VERIFIED',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier } = forgotPasswordSchema.parse(req.body);
    const account = findAccountByEmailOrPhone(identifier);

    // Always respond with the same shape so the endpoint cannot be used to
    // enumerate accounts. Unknown identifiers receive a decoy challenge id that
    // will simply fail to consume.
    if (!account) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists for that email or phone, a reset code has been sent.',
        challengeId: `otp_${crypto.randomUUID()}`,
        expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
        emailSent: false,
      });
    }

    const challenge = createChallenge(account, 'PASSWORD_RESET', identifier);
    const emailSent = await deliverChallenge(challenge);

    return res.status(200).json({
      success: true,
      message: 'If an account exists for that email or phone, a reset code has been sent.',
      // Do not echo the account email here: it would confirm which identifiers
      // are registered and turn this endpoint into an account enumerator.
      ...challengeResponse(challenge, emailSent),
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, code, newPassword } = resetPasswordSchema.parse(req.body);
    const account = findAccountByEmailOrPhone(identifier);
    if (!account) {
      return res.status(400).json({ error: 'The reset request is invalid or has expired.' });
    }

    const challenge = otpChallenges.find(
      (entry) => entry.accountId === account.id && entry.purpose === 'PASSWORD_RESET'
    );
    if (!challenge) {
      return res.status(400).json({ error: 'The reset request is invalid or has expired.' });
    }

    const result = consumeChallenge(challenge.id, code, 'PASSWORD_RESET');
    if ('error' in result) {
      return res.status(400).json({ error: result.error });
    }

    account.passwordHash = await bcrypt.hash(newPassword, 10);
    account.updatedAt = new Date();
    // Completing a reset also confirms control of the registered contact channel.
    account.emailVerified = true;

    return res.status(200).json({
      success: true,
      message: 'Your password has been updated. You can now sign in.',
    });
  } catch (error) {
    next(error);
  }
};

export const authenticateAccountToken = (
  req: AccountAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = readSessionToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as {
      accountId?: string;
      role?: string;
      verificationStatus?: VerificationStatus;
    };
    if (decoded.accountId) {
      req.account = {
        id: decoded.accountId,
        role: (decoded.role === 'PENDING_CLINICIAN' ? 'CLINICIAN' : decoded.role) as AccountRole,
        verificationStatus: decoded.verificationStatus || 'PENDING',
      };
    }
    return next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired access token' });
  }
};

export const getVerificationStatus = (req: AccountAuthenticatedRequest, res: Response) => {
  if (!req.account) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const account = accounts.find((entry) => entry.id === req.account?.id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  return res.status(200).json({
    success: true,
    user: toPublicUser(account),
    requiresApproval: account.role !== 'PATIENT' && account.verificationStatus !== 'VERIFIED',
  });
};

export const __test = { accounts, otpChallenges };
