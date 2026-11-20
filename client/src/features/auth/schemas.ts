import { z } from 'zod';

/** Email address or registered phone number. */
export const identifierSchema = z
  .string()
  .trim()
  .min(3, 'Enter the email address or phone number linked to your account.');

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, 'Enter your password.')
});

export type LoginFields = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema
});

export type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code.');

export const resetPasswordSchema = z
  .object({
    code: otpCodeSchema,
    newPassword: z
      .string()
      .min(8, 'Your new password must be at least 8 characters long.')
      .regex(/[A-Za-z]/, 'Include at least one letter.')
      .regex(/\d/, 'Include at least one number.'),
    confirmPassword: z.string().min(1, 'Re-enter your new password.')
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'The passwords you entered do not match.'
  });

export type ResetPasswordFields = z.infer<typeof resetPasswordSchema>;

export const verifyOtpSchema = z.object({
  code: otpCodeSchema
});

export type VerifyOtpFields = z.infer<typeof verifyOtpSchema>;
