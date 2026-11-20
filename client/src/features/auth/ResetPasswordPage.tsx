import React, { useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AuthShell } from './AuthShell';
import { AuthRequestError, authApi } from '../../services/authApi';
import { resetPasswordSchema, type ResetPasswordFields } from './schemas';

type ResetState = {
  identifier?: string;
  portal?: 'patient' | 'doctor';
  challengeId?: string;
  devOtp?: string;
};

export const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = (location.state || {}) as ResetState;

  const identifier = state.identifier || searchParams.get('identifier') || '';
  const devOtp = state.devOtp || '';
  const isDoctorPortal =
    state.portal === 'doctor' || searchParams.get('portal') === 'doctor';
  const loginPath = isDoctorPortal ? '/doctor/login' : '/patient/login';
  const forgotPasswordPath = `/auth/forgot-password${isDoctorPortal ? '?portal=doctor' : ''}`;

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  if (!identifier) {
    return <Navigate to={forgotPasswordPath} replace />;
  }

  const onSubmit = async (values: ResetPasswordFields) => {
    setErrorMsg('');
    try {
      await authApi.resetPassword({
        identifier,
        code: values.code.trim(),
        newPassword: values.newPassword,
      });
      setIsComplete(true);
    } catch (error) {
      setErrorMsg(
        error instanceof AuthRequestError
          ? error.message
          : 'We could not reset your password. Please try again.'
      );
    }
  };

  return (
    <AuthShell
      variant={isDoctorPortal ? 'clinician' : 'patient'}
      icon={KeyRound}
      eyebrow="Account recovery"
      badge="Screen 13"
      title={isComplete ? 'Password updated' : 'Choose a new password'}
      description={
        isComplete
          ? 'Your password has been changed. You can now sign in with your new credentials.'
          : `Enter the reset code sent to ${identifier} and choose a new password for your account.`
      }
      backTo={loginPath}
      backLabel="Back to sign in"
      footer={
        <p className="portal-login-switch">
          Need a new code? <Link to={forgotPasswordPath}>Start again</Link>
        </p>
      }
    >
      {errorMsg && (
        <div className="portal-error-alert" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <strong>Reset error</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {isComplete ? (
        <div className="auth-stack">
          <div className="auth-success-panel">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <strong>All set</strong>
              <p>Your new password is active. Sign in to continue to your portal.</p>
            </div>
          </div>

          <Link to={loginPath} className="portal-submit-button">
            <span>Sign in with new password</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="portal-login-form" noValidate>
          <div className="portal-field">
            <label htmlFor="reset-code">6-digit reset code</label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="portal-input auth-otp-input"
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? 'reset-code-error' : undefined}
              {...register('code', {
                onChange: (event) => {
                  event.target.value = event.target.value.replace(/\D/g, '').slice(0, 6);
                },
              })}
            />
            {errors.code && (
              <span id="reset-code-error" className="auth-field-error">
                {errors.code.message}
              </span>
            )}
          </div>

          {devOtp && (
            <div className="auth-demo-code" role="note">
              <span className="auth-demo-code-label">
                <Sparkles className="h-3.5 w-3.5" /> Demo reset code
              </span>
              <button
                type="button"
                className="auth-demo-code-value"
                onClick={() => setValue('code', devOtp, { shouldValidate: true })}
              >
                {devOtp}
                <span>Use this code</span>
              </button>
            </div>
          )}

          <div className="portal-field">
            <label htmlFor="reset-new-password">New password</label>
            <div className="portal-input-wrap">
              <LockKeyhole className="portal-input-icon" />
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="portal-input"
                aria-invalid={Boolean(errors.newPassword)}
                aria-describedby={errors.newPassword ? 'reset-new-password-error' : undefined}
                {...register('newPassword')}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword ? (
              <span id="reset-new-password-error" className="auth-field-error">
                {errors.newPassword.message}
              </span>
            ) : (
              <p className="portal-field-hint">
                Use 8+ characters with at least one letter and one number.
              </p>
            )}
          </div>

          <div className="portal-field">
            <label htmlFor="reset-confirm-password">Confirm new password</label>
            <div className="portal-input-wrap">
              <LockKeyhole className="portal-input-icon" />
              <input
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                className="portal-input"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'reset-confirm-password-error' : undefined}
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <span id="reset-confirm-password-error" className="auth-field-error">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="portal-submit-button">
            <span>{isSubmitting ? 'Updating password…' : 'Update password'}</span>
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      )}

      <div className="portal-secure-note">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Choose a password you do not use for another service.
      </div>
    </AuthShell>
  );
};

export default ResetPasswordPage;
