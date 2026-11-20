import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CreditCard,
  KeyRound,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { patientApi } from '../../services/portalApi';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { DemoAccessPanel } from '../auth/DemoAccessPanel';
import { SupportedLanguage } from '../../services/language/types';
import { NeuLensLogo } from '../../components/NeuLensLogo';
import { PortalIllustration } from '../../components/PortalIllustration';
import { getEntryCopy } from '../../services/language/entryCopy';
import { PublicLanguageToggle } from '../../components/PublicLanguageToggle';

const buildLoginSchema = (idRequired: string, pinInvalid: string) =>
  z.object({
    patientId: z.string().trim().min(1, idRequired),
    verification: z.string().trim().regex(/^\d{4,8}$/, pinInvalid),
  });

type PatientLoginFields = { patientId: string; verification: string };

export const PatientLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { setLanguage, currentLanguage } = useLanguageStore();
  const copy = getEntryCopy(currentLanguage);

  const [errorMsg, setErrorMsg] = useState('');
  const schema = React.useMemo(
    () => buildLoginSchema(copy.login.idRequired, copy.login.pinInvalid),
    [copy]
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PatientLoginFields>({
    resolver: zodResolver(schema),
    defaultValues: { patientId: '', verification: '' },
  });

  const onSubmit = async (values: PatientLoginFields) => {
    setErrorMsg('');

    try {
      const res = await patientApi.login({
        patientId: values.patientId.trim(),
        verification: values.verification.trim(),
      });

      login({ ...res.user, role: 'PATIENT' });
      if (res.user.language) {
        setLanguage(res.user.language as SupportedLanguage);
      }

      // Sign-in lands on the portal dashboard, where language and assessment
      // options live. The standalone language screen remains reachable by URL
      // for the legacy screening flow, but it must not intercept every login.
      navigate('/patient/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMsg(
        currentLanguage === 'ar'
          ? copy.login.fallbackError
          : err.message || copy.login.fallbackError,
      );
    }
  };

  return (
    <div className="portal-login-page">
      <header className="portal-login-header">
        <Link to="/patient" className="portal-brand" aria-label={copy.login.homeLabel}>
          <NeuLensLogo height="h-9" />
        </Link>
        <div className="flex items-center gap-3">
          <PublicLanguageToggle />
          <Link to="/patient" className="portal-back-link">
            <ArrowLeft className="h-4 w-4" />
            <span>{copy.login.backToWelcome}</span>
          </Link>
        </div>
      </header>

      <main className="portal-login-main">
        <PortalIllustration variant="patient" />

        <section className="portal-login-card" aria-labelledby="patient-login-title">
          <div className="portal-form-step">
            <span className="portal-form-step-icon">
              <UserRound className="h-4 w-4" />
            </span>
            <span>{copy.login.stepBadge}</span>
            <span className="portal-form-step-count">{copy.login.stepCount}</span>
          </div>

          <div className="portal-form-heading">
            <h1 id="patient-login-title">{copy.login.title}</h1>
            <p>{copy.login.subtitle}</p>
          </div>

          {errorMsg && (
            <div className="portal-error-alert" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <strong>{copy.login.errorHeading}</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <DemoAccessPanel mode="patient-id" roles={['patient']} onError={setErrorMsg} />

          <form onSubmit={handleSubmit(onSubmit)} className="portal-login-form" noValidate>
            <div className="portal-field">
              <label htmlFor="patient-id">{copy.login.patientIdLabel}</label>
              <div className="portal-input-wrap">
                <CreditCard className="portal-input-icon" />
                <input
                  id="patient-id"
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="username"
                  placeholder="CV-2026-XXXXXX"
                  className="portal-input portal-input-mono"
                  aria-invalid={Boolean(errors.patientId)}
                  aria-describedby={errors.patientId ? 'patient-id-error' : undefined}
                  {...register('patientId', {
                    onChange: (e) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
                  })}
                />
              </div>
              {errors.patientId ? (
                <span id="patient-id-error" className="auth-field-error">
                  {errors.patientId.message}
                </span>
              ) : (
                <p className="portal-field-hint">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {copy.login.patientIdHint}
                </p>
              )}
            </div>

            <div className="portal-field">
              <label htmlFor="patient-verification">{copy.login.pinLabel}</label>
              <div className="portal-input-wrap">
                <KeyRound className="portal-input-icon" />
                <input
                  id="patient-verification"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder={copy.login.pinPlaceholder}
                  maxLength={8}
                  className="portal-input"
                  aria-invalid={Boolean(errors.verification)}
                  aria-describedby={errors.verification ? 'patient-verification-error' : undefined}
                  {...register('verification')}
                />
              </div>
              {errors.verification ? (
                <span id="patient-verification-error" className="auth-field-error">
                  {errors.verification.message}
                </span>
              ) : (
                <p className="portal-field-hint">{copy.login.pinHint}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="portal-submit-button">
              <span>{isSubmitting ? copy.login.submitting : copy.login.submit}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="portal-login-switch">
            {copy.login.newHere} <Link to="/patient/register">{copy.login.createProfile}</Link>
          </p>

          <div className="portal-secure-note">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {copy.login.secureNote}
          </div>
        </section>
      </main>

      <footer className="portal-login-footer">
        <span>{copy.login.footerLostId}</span>
        <Link to="/doctor/login">{copy.login.footerClinician}</Link>
      </footer>
    </div>
  );
};

export default PatientLoginPage;
