import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AuthShell } from './AuthShell';
import { AuthRequestError, authApi, type AuthResponse } from '../../services/authApi';
import { forgotPasswordSchema, type ForgotPasswordFields } from './schemas';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDoctorPortal = searchParams.get('portal') === 'doctor';
  const loginPath = isDoctorPortal ? '/doctor/login' : '/patient/login';
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<AuthResponse | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '' },
  });

  const onSubmit = async (values: ForgotPasswordFields) => {
    setErrorMsg('');
    try {
      const response = await authApi.forgotPassword(values.identifier.trim());
      setResult(response);
    } catch (error) {
      setErrorMsg(
        error instanceof AuthRequestError
          ? error.message
          : 'We could not send a reset code. Please try again.'
      );
    }
  };

  const continueToReset = () => {
    if (!result?.challengeId) return;
    const identifier = result.identifier || getValues('identifier').trim();
    const portalQuery = isDoctorPortal ? '&portal=doctor' : '';
    navigate(`/auth/reset-password?identifier=${encodeURIComponent(identifier)}${portalQuery}`, {
      state: {
        identifier,
        portal: isDoctorPortal ? 'doctor' : 'patient',
        challengeId: result.challengeId,
        devOtp: result.devOtp,
      },
    });
  };

  return (
    <AuthShell
      variant={isDoctorPortal ? 'clinician' : 'patient'}
      icon={KeyRound}
      eyebrow="Account recovery"
      badge="Screen 12"
      title={result ? 'Check your messages' : 'Forgot your password?'}
      description={
        result
          ? 'If an account matches those details, a 6-digit reset code has been sent. Enter it on the next screen to choose a new password.'
          : 'Enter the email address or registered phone number on your account. We will send a 6-digit code to reset your password.'
      }
      backTo={loginPath}
      backLabel="Back to sign in"
      footer={
        <p className="portal-login-switch">
          Remembered it? <Link to={loginPath}>Return to sign in</Link>
        </p>
      }
    >
      {errorMsg && (
        <div className="portal-error-alert" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <strong>Recovery error</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {!result ? (
        <form onSubmit={handleSubmit(onSubmit)} className="portal-login-form" noValidate>
          <div className="portal-field">
            <label htmlFor="recovery-identifier">Email address or phone number</label>
            <div className="portal-input-wrap">
              <Mail className="portal-input-icon" />
              <input
                id="recovery-identifier"
                type="text"
                autoComplete="username"
                placeholder="name@domain.com or phone number"
                className="portal-input"
                aria-invalid={Boolean(errors.identifier)}
                aria-describedby={errors.identifier ? 'recovery-identifier-error' : undefined}
                {...register('identifier')}
              />
            </div>
            {errors.identifier ? (
              <span id="recovery-identifier-error" className="auth-field-error">
                {errors.identifier.message}
              </span>
            ) : (
              <p className="portal-field-hint">Use the same contact detail you registered with.</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="portal-submit-button">
            <span>{isSubmitting ? 'Sending reset code…' : 'Send reset code'}</span>
            {!isSubmitting && <Send className="h-4 w-4" />}
          </button>
        </form>
      ) : (
        <div className="auth-stack">
          <div className="auth-success-panel">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <strong>Reset code issued</strong>
              <p>{result.message}</p>
            </div>
          </div>

          {result.devOtp && (
            <div className="auth-demo-code" role="note">
              <span className="auth-demo-code-label">
                <Sparkles className="h-3.5 w-3.5" /> Demo reset code
              </span>
              <span className="auth-demo-code-static">{result.devOtp}</span>
            </div>
          )}

          {result.challengeId ? (
            <button type="button" onClick={continueToReset} className="portal-submit-button">
              <span>Continue to reset password</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <p className="portal-field-hint">
              No account was found for those details. Check the information and try again, or
              create a new account.
            </p>
          )}

          <button
            type="button"
            className="auth-text-button"
            onClick={() => {
              setResult(null);
              setErrorMsg('');
              reset({ identifier: '' });
            }}
          >
            Try a different email or phone
          </button>
        </div>
      )}

      <div className="portal-secure-note">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        For privacy, we do not reveal whether an account exists.
      </div>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
