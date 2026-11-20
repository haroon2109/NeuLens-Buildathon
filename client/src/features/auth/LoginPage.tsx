import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { AuthShell } from './AuthShell';
import { DemoAccessPanel } from './DemoAccessPanel';
import { AuthRequestError, authApi } from '../../services/authApi';
import { useAuthStore } from '../../store/authStore';
import { portalPathForUser } from './authRouting';
import { loginSchema, type LoginFields } from './schemas';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();

  const roleHint = searchParams.get('role');
  const isDoctorHint = roleHint === 'doctor' || roleHint === 'institution';

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = async (values: LoginFields) => {
    setErrorMsg('');
    const identifier = values.identifier.trim();

    try {
      const response = await authApi.signin({
        identifier,
        password: values.password,
        rememberMe,
      });

      if (!response.user) {
        setErrorMsg('The server did not return a session. Please try again.');
        return;
      }

      login(response.user, rememberMe);
      navigate(portalPathForUser(response.user), { replace: true });
    } catch (error) {
      if (error instanceof AuthRequestError) {
        if (error.payload?.requiresVerification && error.payload.challengeId) {
          navigate('/auth/verify', {
            state: {
              challengeId: error.payload.challengeId,
              devOtp: error.payload.devOtp,
              identifier: error.payload.account?.email || identifier,
              name: error.payload.account?.name,
              role: error.payload.account?.role,
              isPasswordReset: false,
            },
          });
          return;
        }
        setErrorMsg(error.message);
      } else {
        setErrorMsg('We could not sign you in. Please try again.');
      }
    }
  };

  return (
    <AuthShell
      variant={isDoctorHint ? 'clinician' : 'patient'}
      icon={LockKeyhole}
      eyebrow={isDoctorHint ? 'Healthcare professionals' : 'Welcome back'}
      badge="Screen 10"
      title="Sign in to NeuLens"
      description="One secure sign-in for patients and care teams. We'll take you to the right portal based on your role and verification status."
      backTo="/auth/role-selection"
      backLabel="Create an account"
      footer={
        <p className="portal-login-switch">
          New to NeuLens? <Link to="/auth/role-selection">Choose an account type</Link>
        </p>
      }
    >
      {errorMsg && (
        <div className="portal-error-alert" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <strong>Sign-in error</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      <DemoAccessPanel mode="shared" onError={setErrorMsg} />

      <form onSubmit={handleSubmit(onSubmit)} className="portal-login-form" noValidate>
        <div className="portal-field">
          <label htmlFor="auth-identifier">Email address or phone number</label>
          <div className="portal-input-wrap">
            <Mail className="portal-input-icon" />
            <input
              id="auth-identifier"
              type="text"
              autoComplete="username"
              placeholder="name@domain.com or phone number"
              className="portal-input"
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? 'auth-identifier-error' : undefined}
              {...register('identifier')}
            />
          </div>
          {errors.identifier && (
            <span id="auth-identifier-error" className="auth-field-error">
              {errors.identifier.message}
            </span>
          )}
        </div>

        <div className="portal-field">
          <div className="portal-label-row">
            <label htmlFor="auth-password">Password</label>
            <Link to="/auth/forgot-password">Forgot password?</Link>
          </div>
          <div className="portal-input-wrap">
            <LockKeyhole className="portal-input-icon" />
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="portal-input"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'auth-password-error' : undefined}
              {...register('password')}
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
          {errors.password && (
            <span id="auth-password-error" className="auth-field-error">
              {errors.password.message}
            </span>
          )}
        </div>

        <label className="auth-check-row auth-check-row-compact" htmlFor="auth-remember">
          <input
            id="auth-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>Remember me on this device</span>
        </label>

        <button type="submit" disabled={isSubmitting} className="portal-submit-button">
          <span>{isSubmitting ? 'Signing you in…' : 'Sign in'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="portal-secure-note">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Role-based access · Sessions are private to this browser
      </div>
    </AuthShell>
  );
};

export default LoginPage;
