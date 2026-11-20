import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  GraduationCap,
  Hand,
  KeyRound,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { patientApi } from '../../services/portalApi';
import { useAuthStore } from '../../store/authStore';
import { NeuLensLogo } from '../../components/NeuLensLogo';
import { PortalIllustration } from '../../components/PortalIllustration';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { getEntryCopy } from '../../services/language/entryCopy';
import { PublicLanguageToggle } from '../../components/PublicLanguageToggle';

export const PatientRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const copy = getEntryCopy(useLanguageStore((state) => state.currentLanguage));

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'MALE',
    language: 'en',
    handedness: 'RIGHT',
    educationYears: '12',
    pin: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg(copy.register.nameRequired);
      return;
    }

    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setErrorMsg(copy.register.ageInvalid);
      return;
    }

    if (!/^\d{4,8}$/.test(formData.pin)) {
      setErrorMsg(copy.register.pinInvalid);
      return;
    }

    setIsLoading(true);

    try {
      const pinToUse = formData.pin;
      const res = await patientApi.register({
        name: formData.name.trim(),
        age: ageNum,
        gender: formData.gender,
        language: formData.language,
        educationYears: parseInt(formData.educationYears, 10) || 12,
        handedness: formData.handedness,
        pin: pinToUse
      });

      // Save session in auth store
      login({ ...res.user, role: 'PATIENT' });

      // A new account lands on its own dashboard, the same place a returning
      // patient lands after signing in. Starting the assessment stays an
      // explicit choice from there, not something registration forces.
      navigate('/patient/dashboard', { replace: true });
    } catch (err: any) {
      const isArabic = useLanguageStore.getState().currentLanguage === 'ar';
      setErrorMsg(isArabic ? copy.register.fallbackError : err.message || copy.register.fallbackError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="portal-login-page portal-registration-page">
      <header className="portal-login-header">
        <Link to="/patient" className="portal-brand" aria-label={copy.register.homeLabel}>
          <NeuLensLogo height="h-9" />
        </Link>
        <div className="flex items-center gap-3">
          <PublicLanguageToggle />
          <Link to="/patient" className="portal-back-link">
            <ArrowLeft className="h-4 w-4" />
            <span>{copy.register.backToWelcome}</span>
          </Link>
        </div>
      </header>

      <main className="portal-login-main portal-registration-main">
        <PortalIllustration variant="patient" />

        <section className="portal-login-card portal-registration-card" aria-labelledby="registration-title">
          <div className="portal-form-step">
            <span className="portal-form-step-icon">
              <UserPlus className="h-4 w-4" />
            </span>
            <span>{copy.register.stepBadge}</span>
            <span className="portal-form-step-count">{copy.register.stepCount}</span>
          </div>

          <div className="portal-form-heading">
            <h1 id="registration-title">{copy.register.title}</h1>
            <p>{copy.register.subtitle}</p>
          </div>

          {errorMsg && (
            <div className="portal-error-alert" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <strong>{copy.register.errorHeading}</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="portal-login-form portal-registration-form">
            <div className="portal-field">
              <label htmlFor="patient-name">{copy.register.fullName} <span aria-hidden="true">*</span></label>
              <div className="portal-input-wrap">
                <UserRound className="portal-input-icon" />
                <input
                  id="patient-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={copy.register.namePlaceholder}
                  className="portal-input"
                />
              </div>
            </div>

            <div className="portal-registration-grid">
              <div className="portal-field">
                <label htmlFor="patient-age">{copy.register.age} <span aria-hidden="true">*</span></label>
                <div className="portal-input-wrap">
                  <CalendarDays className="portal-input-icon" />
                  <input
                    id="patient-age"
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder={copy.register.agePlaceholder}
                    className="portal-input"
                  />
                </div>
              </div>

              <div className="portal-field">
                <label htmlFor="patient-gender">{copy.register.gender} <span aria-hidden="true">*</span></label>
                <div className="portal-input-wrap">
                  <UserRound className="portal-input-icon" />
                  <select
                    id="patient-gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="portal-input portal-input-select"
                  >
                    {copy.register.genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="portal-field">
              <div className="portal-label-row">
                <label htmlFor="patient-pin">{copy.register.pinLabel}</label>
                <span className="portal-registration-field-note">{copy.register.pinNote}</span>
              </div>
              <div className="portal-input-wrap">
                <KeyRound className="portal-input-icon" />
                <input
                  id="patient-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={8}
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                  placeholder={copy.register.pinPlaceholder}
                  className="portal-input"
                />
              </div>
              <p className="portal-field-hint">{copy.register.pinHint}</p>
            </div>

            <div className="portal-registration-grid">
              <div className="portal-field">
                <label htmlFor="patient-handedness">{copy.register.handedness}</label>
                <div className="portal-input-wrap">
                  <Hand className="portal-input-icon" />
                  <select
                    id="patient-handedness"
                    value={formData.handedness}
                    onChange={(e) => setFormData({ ...formData, handedness: e.target.value })}
                    className="portal-input portal-input-select"
                  >
                    {copy.register.handednessOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="portal-field">
                <label htmlFor="patient-education">{copy.register.education}</label>
                <div className="portal-input-wrap">
                  <GraduationCap className="portal-input-icon" />
                  <input
                    id="patient-education"
                    type="number"
                    min="0"
                    max="30"
                    value={formData.educationYears}
                    onChange={(e) => setFormData({ ...formData, educationYears: e.target.value })}
                    className="portal-input"
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="portal-submit-button">
              <span>{isLoading ? copy.register.submitting : copy.register.submit}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="portal-login-switch">
            {copy.register.alreadyHave} <Link to="/patient/login">{copy.register.signIn}</Link>
          </p>

          <div className="portal-secure-note">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {copy.register.secureNote}
          </div>
        </section>
      </main>

      <footer className="portal-login-footer">
        <span>{copy.register.footerNote}</span>
        <span className="portal-registration-footer-note">
          <Sparkles className="h-3.5 w-3.5" />
          {copy.register.footerTime}
        </span>
      </footer>
    </div>
  );
};