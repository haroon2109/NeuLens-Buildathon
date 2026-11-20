import { z } from 'zod';

/**
 * Shared account authentication schemas (screens 08–14).
 *
 * The shared flow covers both patients and healthcare professionals. Role-specific
 * fields are optional at the schema level and enforced in the controller so a
 * single endpoint can serve every registration form.
 */

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/\d/, 'Password must include a number');

export const accountRoleSchema = z.enum(['PATIENT', 'CLINICIAN', 'INSTITUTION']);

export const accountSignupSchema = z.object({
  role: accountRoleSchema,
  name: z.string().min(2, 'Name is required').max(120),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(7, 'Enter a valid phone number').max(20),
  password: passwordSchema,
  acceptedTerms: z.boolean().refine((value) => value === true, {
    message: 'Please accept the privacy and consent notice to continue',
  }),

  // Patient fields
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date of birth').optional(),
  gender: z.string().max(30).optional(),
  language: z.string().max(10).optional(),

  // Clinician fields
  specialty: z.string().max(80).optional(),
  professionalRegistrationNumber: z.string().max(60).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  institutionName: z.string().max(160).optional(),

  // Institution fields
  institutionType: z.string().max(60).optional(),
  institutionRegistrationNumber: z.string().max(80).optional(),
  contactPerson: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
});

export const accountLoginSchema = z.object({
  identifier: z.string().min(3, 'Enter your email address or phone number').max(160),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const verifyOtpSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit verification code'),
});

export const resendOtpSchema = z.object({
  challengeId: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(3).max(160),
});

export const resetPasswordSchema = z.object({
  identifier: z.string().min(3).max(160),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit reset code'),
  newPassword: passwordSchema,
});

export type AccountSignupInput = z.infer<typeof accountSignupSchema>;
export type AccountLoginInput = z.infer<typeof accountLoginSchema>;
