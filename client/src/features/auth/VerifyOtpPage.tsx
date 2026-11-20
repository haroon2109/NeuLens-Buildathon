import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Loader2,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AuthShell } from './AuthShell';
import { AuthRequestError, authApi } from '../../services/authApi';
import { useAuthStore } from '../../store/authStore';
import { portalPathForUser, roleLabel } from './authRouting';
import { verifyOtpSchema, type VerifyOtpFields } from './schemas';

type VerifyState = {
  challengeId?: string;
  devOtp?: string;
  identifier?: string;
  name?: string;
  role?: string;
  portal?: 'patient' | 'doctor';
  isPasswordReset?: boolean;
};

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const state = (location.state || {}) as VerifyState;
  const isDoctorPortal =
    state.portal === 'doctor' || state.role === 'CLINICIAN' || state.role === 'INSTITUTION';
  const loginPath = isDoctorPortal ? '/doctor/login' : '/patient/login';

  const [challengeId, setChallengeId] = useState(state.challengeId || '');
  const [devOtp, setDevOtp] = useState(state.devOtp || '');
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(30);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFields>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (values: VerifyOtpFields) => {
    setErrorMsg('');
    setNotice('');

    if (!challengeId) {
      setErrorMsg('This verification request has expired. Please sign in to request a new code.');
      return;
    }

    try {
      const response = await authApi.verifyOtp({ challengeId, code: values.code.trim() });
      if (!response.user) {
        setErrorMsg('Verification succeeded but no session was returned. Please sign in.');
        return;
      }

      login(response.user, false);
      navigate(
        response.requiresApproval ? '/auth/pending-approval' : portalPathForUser(response.user),
        { replace: true }
      );
    } catch (error) {
      setErrorMsg(
        error instanceof AuthRequestError ? error.message : 'We could not verify that code. Please try again.'
      );
    }
  };

  const handleResend = async () => {
    setErrorMsg('');
    setNotice('');
    if (!challengeId) {
      setErrorMsg('Please sign in again to request a new verification code.');
      return;
    }

    setIsResending(true);
    try {
      const response = await authApi.resendOtp(challengeId);
      if (response.challengeId) setChallengeId(response.challengeId);
      setDevOtp(response.devOtp || '');
      reset({ code: '' });
      setCooldown(30);
      setNotice('A new verification code has been issued.');
    } catch (error) {
      setErrorMsg(
        error instanceof AuthRequestError ? error.message : 'We could not resend the code. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell
      variant={state.role === 'CLINICIAN' || state.role === 'INSTITUTION' ? 'clinician' : 'patient'}
      icon={MailCheck}
      eyebrow="Verify your contact details"
      badge="Screen 11"
      title="Enter your verification code"
      description={
        state.identifier
          ? `We sent a 6-digit code to ${state.identifier}. Enter it below to activate your account.`
          : 'Enter the 6-digit code sent to your registered email or phone to activate your account.'
      }
      backTo={loginPath}
      backLabel="Back to sign in"
      footer={
        <p className="portal-login-switch">
          Wrong details? <Link to="/auth/role-selection">Start registration again</Link>
        </p>
      }
    >
      {state.name && (
        <div className="auth-identity-chip">
          <BadgeCheck className="h-4 w-4 shrink-0" />
          <span>
            {state.name} · {roleLabel(state.role)}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="portal-error-alert" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <strong>Verification error</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {notice && (
        <div className="auth-success-inline" role="status">
          <BadgeCheck className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(handleVerify)} className="portal-login-form" noValidate>
        <div className="portal-field">
          <label htmlFor="otp-code">6-digit verification code</label>
          <input
            id="otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="portal-input auth-otp-input"
            aria-describedby={errors.code ? 'otp-code-error' : 'otp-help'}
            aria-invalid={Boolean(errors.code)}
            {...register('code', {
              onChange: (event) => {
                event.target.value = event.target.value.replace(/\D/g, '').slice(0, 6);
              },
            })}
          />
          {errors.code ? (
            <span id="otp-code-error" className="auth-field-error">
              {errors.code.message}
            </span>
          ) : (
            <p id="otp-help" className="portal-field-hint">
              The code expires in 10 minutes and can be used once.
            </p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="portal-submit-button">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span>{isSubmitting ? 'Verifying…' : 'Verify and continue'}</span>
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      {devOtp && (
        <div className="auth-demo-code" role="note">
          <span className="auth-demo-code-label">
            <Sparkles className="h-3.5 w-3.5" /> Demo verification code
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

      <div className="auth-resend-row">
        <span>Didn't receive a code?</span>
        <button type="button" onClick={handleResend} disabled={isResending || cooldown > 0}>
          <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>

      <div className="portal-secure-note">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Never share this code. NeuLens staff will not ask for it.
      </div>
    </AuthShell>
  );
};

export default VerifyOtpPage;
