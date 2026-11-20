import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Brain,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  Info,
  Languages,
  Lock,
  Mic,
  Sparkles,
  Stethoscope,
  Timer,
  Type
} from 'lucide-react';
import { NeuLensLogo } from '../../../components/NeuLensLogo';
import { HealthcareScene } from '../../../components/illustrations/HealthcareScene';
import { MotionReveal } from '../../../components/motion/Reveal';
import { useAuthStore } from '../../../store/authStore';
import { usePatientPortalStore, type ConsentKey } from '../../../store/patientPortalStore';
import { patientPortalApi } from '../../../services/patientPortalApi';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { getPortalTranslation } from '../../../services/language/portalTranslations';
import { getOnboardingCopy } from '../../../services/language/onboardingCopy';
import { getLanguageInfo } from '../../../services/language/translations';
import type { SupportedLanguage } from '../../../services/language/types';
import { useVoiceAssistantStore } from '../../../services/voice/VoiceInstructionEngine';
import { Card, Pill, Toggle, formatDate, primaryButton, secondaryButton } from './ui';

const STEP_PATHS = [
  '/patient/welcome',
  '/patient/onboarding/personal-info',
  '/patient/onboarding/health-background',
  '/patient/onboarding/consent',
  '/patient/onboarding/accessibility'
];

const useOnboardingCopy = () =>
  getOnboardingCopy(useLanguageStore((state) => state.currentLanguage));

const fieldClass =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-muted focus:border-forest focus:ring-4 focus:ring-forest/12';
const labelClass = 'mb-1.5 block text-[14px] font-semibold text-ink';
/**
 * Onboarding shell — one NeuLens card, sage eyebrow, warm page background,
 * mint/forest progress steps. Preserves all existing step labels and routes.
 */
const OnboardingShell: React.FC<{
  step: number;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  backTo?: string;
  backLabel?: string;
}> = ({ step, eyebrow, title, description, children, backTo, backLabel }) => {
  const copy = useOnboardingCopy();
  const steps = copy.steps.map((label, index) => ({ label, path: STEP_PATHS[index] }));

  return (
  <div className="min-h-screen bg-warm text-ink">
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-[68px] max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link to="/patient/welcome" className="flex items-center gap-2.5 text-decoration-none" aria-label={copy.homeLabel}>
          <NeuLensLogo height="h-9" />
        </Link>
        {backTo && (
          <Link
            to={backTo}
            className="pp-btn pp-btn-ghost pp-btn-sm inline-flex items-center gap-1.5 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {backLabel ?? copy.back}
          </Link>
        )}
      </div>
    </header>

    <main className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      {/* Progress steps — sage/forest/mint */}
      <ol className="mb-7 grid grid-cols-5 gap-1.5" aria-label={copy.progressLabel}>
        {steps.map((item, index) => {
          const state = index < step ? 'done' : index === step ? 'current' : 'upcoming';
          return (
            <li key={item.label}>
              <div
                className={`h-1.5 rounded-full ${
                  state === 'done' ? 'bg-forest' : state === 'current' ? 'bg-forest' : 'bg-line'
                }`}
              />
              <span
                className={`mt-2 block truncate text-[13px] font-semibold ${
                  state === 'current' ? 'text-forest' : state === 'done' ? 'text-forest' : 'text-muted'
                }`}
              >
                {index + 1}. {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Card — NeuLens pp-card with mint header strip */}
      <div className="pp-card-deep p-5 shadow-[0_18px_50px_-42px_rgba(27,51,43,0.4)] sm:p-8">
        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-sage-deep">
          <Sparkles className="h-3.5 w-3.5 text-sage-deep" aria-hidden="true" />
          {eyebrow}
        </div>
        <h1 className="mt-2 max-w-2xl text-[26px] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-body">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 15 — Patient Welcome
// ---------------------------------------------------------------------------
export const PatientWelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { onboardingComplete } = usePatientPortalStore();
  const copy = useOnboardingCopy();
  const firstName = (user?.name || '').split(' ')[0];

  return (
    <OnboardingShell
      step={0}
      eyebrow={copy.welcome.eyebrow}
      title={copy.welcome.title(firstName)}
      description={copy.welcome.description}
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-line bg-warm/70 p-4 sm:p-5">
          <MotionReveal className="mb-4">
            <HealthcareScene
              kind="registration"
              className="w-full"
              title={copy.welcome.sceneTitle}
              animated={false}
            />
          </MotionReveal>
          <h2 className="text-[14px] font-semibold text-ink">{copy.welcome.whatToExpect}</h2>
          <ul className="mt-3 space-y-3">
            {[ClipboardCheck, Timer, Languages, Stethoscope].map((Icon, index) => ({
              Icon,
              title: copy.welcome.items[index].title,
              detail: copy.welcome.items[index].detail
            })).map(({ Icon, title, detail }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint text-forest shadow-xs">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-ink">{title}</span>
                  <span className="mt-0.5 block text-[13px] leading-5 text-muted">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-mint bg-mint/50 p-4 sm:p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-forest shadow-xs">
            <Brain className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <p className="mt-3 text-[14px] font-semibold text-ink">{copy.welcome.beforeTitle}</p>
          <p className="mt-1 text-[13px] leading-5 text-muted">{copy.welcome.beforeBody}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <Pill tone="mint">{copy.welcome.pills[0]}</Pill>
            <Pill tone="forestSoft">{copy.welcome.pills[1]}</Pill>
            <Pill tone="sage">{copy.welcome.pills[2]}</Pill>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="max-w-xl text-[13px] leading-5 text-muted">{copy.welcome.disclaimer}</p>
        <div className="flex flex-wrap gap-2">
          {onboardingComplete ? (
            <Link to="/patient/dashboard" className={primaryButton}>
              {copy.welcome.goDashboard}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              className={primaryButton}
              onClick={() => navigate('/patient/onboarding/personal-info')}
            >
              {copy.welcome.start}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </OnboardingShell>
  );
};

// ---------------------------------------------------------------------------
// Screen 16 — Personal Information
// ---------------------------------------------------------------------------
export const PersonalInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { personal, setPersonal } = usePatientPortalStore();
  const { setLanguage } = useLanguageStore();
  const copy = useOnboardingCopy();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!personal.fullName && user?.name) {
      setPersonal({
        fullName: user.name,
        email: user.email || '',
        phone: user.phone || '',
        language: user.language || 'en',
        dateOfBirth: personal.dateOfBirth
      });
    }
  }, [personal.fullName, personal.dateOfBirth, setPersonal, user]);

  const handleContinue = () => {
    if (!personal.fullName.trim()) return setError(copy.personal.errors.name);
    if (!personal.dateOfBirth) return setError(copy.personal.errors.dob);
    setError('');
    navigate('/patient/onboarding/health-background');
  };

  return (
    <OnboardingShell
      step={1}
      eyebrow={copy.personal.eyebrow}
      title={copy.personal.title}
      description={copy.personal.description}
      backTo="/patient/welcome"
    >
      {error && (
        <p className="mb-4 rounded-xl border border-rose/60 bg-rose/10 px-3.5 py-2.5 text-[14px] font-semibold text-rose-900" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="onboarding-name">{copy.personal.name}</label>
          <input
            id="onboarding-name"
            className={fieldClass}
            value={personal.fullName}
            onChange={(event) => setPersonal({ fullName: event.target.value })}
            placeholder={copy.personal.namePlaceholder}
            autoComplete="name"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="onboarding-dob">{copy.personal.dob}</label>
          <input
            id="onboarding-dob"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            className={fieldClass}
            value={personal.dateOfBirth}
            onChange={(event) => setPersonal({ dateOfBirth: event.target.value })}
            autoComplete="bday"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="onboarding-language">{copy.personal.language}</label>
          <select
            id="onboarding-language"
            className={fieldClass}
            value={personal.language}
            onChange={(event) => {
              const language = event.target.value as SupportedLanguage;
              // Keep the profile field and the spoken-guidance language in step:
              // this choice must actually reach the voice engine, not just be stored.
              setPersonal({ language });
              setLanguage(language);
            }}
          >
            <option value="en">English</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="ta">Tamil</option>
            <option value="hi">Hindi</option>
            <option value="te">Telugu</option>
            <option value="kn">Kannada</option>
            <option value="ml">Malayalam</option>
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="onboarding-education">{copy.personal.education}</label>
          <select
            id="onboarding-education"
            className={fieldClass}
            value={personal.education}
            onChange={(event) => setPersonal({ education: event.target.value })}
          >
            <option value="">{copy.personal.educationPlaceholder}</option>
            {copy.personal.educationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="onboarding-email">{copy.personal.email}</label>
          <input
            id="onboarding-email"
            type="email"
            className={fieldClass}
            value={personal.email}
            onChange={(event) => setPersonal({ email: event.target.value })}
            autoComplete="email"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="onboarding-phone">{copy.personal.phone}</label>
          <input
            id="onboarding-phone"
            type="tel"
            className={fieldClass}
            value={personal.phone}
            onChange={(event) => setPersonal({ phone: event.target.value })}
            autoComplete="tel"
          />
        </div>

        <div className="rounded-xl border border-line bg-warm/70 p-3.5 sm:col-span-2">
          <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-sage-deep">
            <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.personal.emergencyTitle} <span className="font-medium normal-case tracking-normal text-muted">{copy.personal.optional}</span>
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              aria-label={copy.personal.emergencyName}
              className={fieldClass}
              value={personal.emergencyName}
              onChange={(event) => setPersonal({ emergencyName: event.target.value })}
              placeholder={copy.personal.emergencyNamePlaceholder}
            />
            <input
              aria-label={copy.personal.emergencyPhone}
              type="tel"
              className={fieldClass}
              value={personal.emergencyPhone}
              onChange={(event) => setPersonal({ emergencyPhone: event.target.value })}
              placeholder={copy.personal.emergencyPhonePlaceholder}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <Link to="/patient/welcome" className={secondaryButton}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {copy.back}
        </Link>
        <button type="button" className={primaryButton} onClick={handleContinue}>
          {copy.personal.continue}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </OnboardingShell>
  );
};

// ---------------------------------------------------------------------------
// Screen 17 — Health Background
// ---------------------------------------------------------------------------
const NONE_VALUE = 'None of these';

const ChipSelect: React.FC<{
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
}> = ({ options, selected, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => {
      const active = selected.includes(option.value);
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={active}
          onClick={() => {
            if (option.value === NONE_VALUE) {
              onChange(active ? [] : [option.value]);
              return;
            }
            const withoutNone = selected.filter((value) => value !== NONE_VALUE);
            onChange(active ? withoutNone.filter((value) => value !== option.value) : [...withoutNone, option.value]);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            active
              ? 'border-forest/40 bg-mint text-forest'
              : 'border-line bg-white text-body hover:border-sage-dark/60'
          }`}
        >
          {active && <Check className="h-3 w-3" aria-hidden="true" />}
          {option.label}
        </button>
      );
    })}
  </div>
);

export const HealthBackgroundPage: React.FC = () => {
  const navigate = useNavigate();
  const { health, setHealth } = usePatientPortalStore();
  const copy = useOnboardingCopy();

  return (
    <OnboardingShell
      step={2}
      eyebrow={copy.health.eyebrow}
      title={copy.health.title}
      description={copy.health.description}
      backTo="/patient/onboarding/personal-info"
    >
      <div className="space-y-5">
        <div>
          <label className={labelClass}>{copy.health.conditionsLabel}</label>
          <ChipSelect
            options={copy.health.conditions}
            selected={health.conditions}
            onChange={(next) => setHealth({ conditions: next })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="health-medications">{copy.health.medications}</label>
            <textarea
              id="health-medications"
              rows={3}
              className={fieldClass}
              value={health.medications}
              onChange={(event) => setHealth({ medications: event.target.value })}
              placeholder={copy.health.medicationsPlaceholder}
            />
          </div>
          <div>
            <label className={labelClass}>{copy.health.sensoryLabel}</label>
            <ChipSelect
              options={copy.health.sensory}
              selected={health.sensory}
              onChange={(next) => setHealth({ sensory: next })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="health-family">{copy.health.family}</label>
            <textarea
              id="health-family"
              rows={3}
              className={fieldClass}
              value={health.familyHistory}
              onChange={(event) => setHealth({ familyHistory: event.target.value })}
              placeholder={copy.health.familyPlaceholder}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="health-previous">{copy.health.previous}</label>
            <select
              id="health-previous"
              className={fieldClass}
              value={health.previousAssessments}
              onChange={(event) => setHealth({ previousAssessments: event.target.value })}
            >
              {copy.health.previousOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="health-lifestyle">{copy.health.lifestyle}</label>
          <textarea
            id="health-lifestyle"
            rows={3}
            className={fieldClass}
            value={health.lifestyleNotes}
            onChange={(event) => setHealth({ lifestyleNotes: event.target.value })}
            placeholder={copy.health.lifestylePlaceholder}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <Link to="/patient/onboarding/personal-info" className={secondaryButton}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {copy.back}
        </Link>
        <button type="button" className={primaryButton} onClick={() => navigate('/patient/onboarding/consent')}>
          {copy.health.continue}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </OnboardingShell>
  );
};

// ---------------------------------------------------------------------------
// Screen 18 — Consent & Privacy
// ---------------------------------------------------------------------------
// Item wording is translated in portalTranslations so the consent text can be
// read in the language the patient chose; only the required/optional status
// (a clinical and legal decision) stays here.
const consentRows: Array<{ key: ConsentKey; required: boolean }> = [
  { key: 'dataCollection', required: true },
  { key: 'cameraMic', required: true },
  { key: 'processing', required: true },
  { key: 'clinicianAccess', required: true },
  { key: 'optionalSharing', required: false },
  { key: 'withdrawalAcknowledged', required: true }
];

export const ConsentPrivacyPage: React.FC = () => {
  const navigate = useNavigate();
  const { consent, setConsent, signConsent } = usePatientPortalStore();
  const { currentLanguage } = useLanguageStore();
  const pt = getPortalTranslation(currentLanguage);
  const [error, setError] = useState('');

  const requiredComplete = consentRows
    .filter((row) => row.required)
    .every((row) => consent[row.key]);

  const handleContinue = async () => {
    if (!requiredComplete) {
      setError(pt.consent.errors.required);
      return;
    }
    setError('');

    // Consent is a server-side record (version, timestamp, actor, request context).
    // Do not advance if it could not be saved.
    try {
      await patientPortalApi.recordConsent({
        dataCollection: consent.dataCollection,
        cameraMic: consent.cameraMic,
        processing: consent.processing,
        clinicianAccess: consent.clinicianAccess,
        optionalSharing: consent.optionalSharing,
        withdrawalAcknowledged: consent.withdrawalAcknowledged
      });
    } catch (err: any) {
      // Server messages are English-only, so an Arabic reader is shown the
      // translated message rather than text they cannot read.
      setError(
        currentLanguage === 'ar'
          ? pt.consent.errors.saveFailed
          : err.message || pt.consent.errors.saveFailed
      );
      return;
    }

    signConsent();
    navigate('/patient/onboarding/accessibility');
  };

  return (
    <OnboardingShell
      step={3}
      eyebrow={pt.consent.eyebrow}
      title={pt.consent.title}
      description={pt.consent.description}
      backTo="/patient/onboarding/health-background"
      backLabel={pt.consent.back}
    >
      {error && (
        <p className="mb-4 rounded-xl border border-rose/60 bg-rose/10 px-3.5 py-2.5 text-[14px] font-semibold text-rose-900" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-2.5">
          {consentRows.map((row) => {
            const copy = pt.consent.items[row.key];
            return (
              <Toggle
                key={row.key}
                label={`${copy.label}${row.required ? pt.consent.requiredSuffix : pt.consent.optionalSuffix}`}
                detail={copy.detail}
                checked={consent[row.key]}
                onChange={(value) => setConsent(row.key, value)}
              />
            );
          })}
        </div>

        <div className="space-y-3">
          <MotionReveal>
            <HealthcareScene
              kind="consent"
              className="w-full"
              title="Dr. Mohamed explaining consent and privacy to Haroon and care partner"
              animated={false}
            />
          </MotionReveal>
          <Card className="bg-warm/70">
            <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-sage-deep">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              {pt.consent.dataHandlingTitle}
            </p>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-5 text-muted">
              {pt.consent.dataHandling.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
          <div className="rounded-xl border border-mint bg-mint/50 p-3.5">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-forest">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              {pt.consent.clinicalNoteTitle}
            </p>
            <p className="mt-1.5 text-[13px] leading-5 text-forest/80">
              {pt.consent.clinicalNoteBody}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:flex-wrap sm:items-center">
        <Link to="/patient/onboarding/health-background" className={secondaryButton}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {pt.consent.back}
        </Link>
        <div className="flex w-full flex-col items-end gap-2 sm:w-auto">
          {!requiredComplete && <span className="text-[13px] font-medium text-muted">{pt.consent.requiredItemsMarked}</span>}
          <button type="button" className={primaryButton} onClick={() => void handleContinue()} disabled={!requiredComplete}>
            {pt.consent.acceptAndContinue}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
};

// ---------------------------------------------------------------------------
// Screen 19 — Accessibility Setup
// ---------------------------------------------------------------------------
export const AccessibilitySetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { accessibility, setAccessibility, completeOnboarding } = usePatientPortalStore();
  const { currentLanguage, setLanguage } = useLanguageStore();
  const copy = useOnboardingCopy();
  const { speak, stopSpeaking } = useVoiceAssistantStore();
  const [testing, setTesting] = useState<'camera' | 'mic' | null>(null);

  const changeLanguage = (value: string) => {
    const language = value as SupportedLanguage;
    setAccessibility({ language });
    setLanguage(language);
  };

  const previewVoice = () => {
    speak(getLanguageInfo(currentLanguage).sampleGreeting);
  };

  const runTest = (kind: 'camera' | 'mic') => {
    setTesting(kind);
    window.setTimeout(() => {
      setAccessibility(kind === 'camera' ? { cameraTested: true } : { micTested: true });
      setTesting(null);
    }, 1100);
  };

  const finish = () => {
    stopSpeaking();
    completeOnboarding();
    navigate('/patient/dashboard', { replace: true });
  };

  return (
    <OnboardingShell
      step={4}
      eyebrow={copy.accessibility.eyebrow}
      title={copy.accessibility.title}
      description={copy.accessibility.description}
      backTo="/patient/onboarding/consent"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="access-language">
              <Languages className="me-1 inline h-3.5 w-3.5" aria-hidden="true" />
              {copy.accessibility.language}
            </label>
            <select
              id="access-language"
              className={fieldClass}
              value={currentLanguage}
              onChange={(event) => changeLanguage(event.target.value)}
            >
              <option value="en">English</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="ta">Tamil</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
              <option value="kn">Kannada</option>
              <option value="ml">Malayalam</option>
            </select>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[13px] leading-5 text-muted">{copy.accessibility.voiceNote}</p>
              <button
                type="button"
                onClick={previewVoice}
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-forest hover:underline"
              >
                <AudioLines className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.accessibility.hearSample}
              </button>
            </div>
          </div>

          <div>
            <span className={labelClass}>
              <Type className="me-1 inline h-3.5 w-3.5" aria-hidden="true" />
              {copy.accessibility.textSize}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'normal' as const, ...copy.accessibility.sizes[0] },
                { value: 'large' as const, ...copy.accessibility.sizes[1] },
                { value: 'xlarge' as const, ...copy.accessibility.sizes[2] }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAccessibility({ textSize: option.value })}
                  aria-pressed={accessibility.textSize === option.value}
                  className={`rounded-xl border px-3 py-3 text-center transition-colors ${
                    accessibility.textSize === option.value
                      ? 'border-forest/40 bg-mint text-forest font-semibold'
                      : 'border-line bg-white text-body hover:border-sage-dark/60'
                  }`}
                >
                  <span className="block text-[17px] font-bold" style={{ fontFamily: 'var(--nl-font-sans)' }}>{option.label}</span>
                  <span className="mt-0.5 block text-[13px]">{option.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <Toggle
            label={copy.accessibility.highContrast}
            detail={copy.accessibility.highContrastDetail}
            checked={accessibility.highContrast}
            onChange={(value) => setAccessibility({ highContrast: value })}
          />
          <Toggle
            label={copy.accessibility.audio}
            detail={copy.accessibility.audioDetail}
            checked={accessibility.audioInstructions}
            onChange={(value) => setAccessibility({ audioInstructions: value })}
          />
          <div>
            <label className={labelClass} htmlFor="access-touch">{copy.accessibility.touch}</label>
            <select
              id="access-touch"
              className={fieldClass}
              value={accessibility.touchPreference}
              onChange={(event) => setAccessibility({ touchPreference: event.target.value })}
            >
              {copy.accessibility.touchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <Card className="bg-warm/70">
            <p className="text-[14px] font-semibold text-ink">{copy.accessibility.checkTitle}</p>
            <p className="mt-1 text-[13px] leading-5 text-muted">{copy.accessibility.checkBody}</p>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                  <Camera className="h-4 w-4 text-sage-deep" aria-hidden="true" />
                  {copy.accessibility.camera}
                </span>
                {accessibility.cameraTested ? (
                  <Pill tone="forestSoft" dot>{copy.accessibility.ready}</Pill>
                ) : (
                  <button type="button" className="text-[13px] font-bold text-forest" onClick={() => runTest('camera')}>
                    {testing === 'camera' ? copy.accessibility.checking : copy.accessibility.testCamera}
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                  <Mic className="h-4 w-4 text-sage-deep" aria-hidden="true" />
                  {copy.accessibility.microphone}
                </span>
                {accessibility.micTested ? (
                  <Pill tone="forestSoft" dot>{copy.accessibility.ready}</Pill>
                ) : (
                  <button type="button" className="text-[13px] font-bold text-forest" onClick={() => runTest('mic')}>
                    {testing === 'mic' ? copy.accessibility.checking : copy.accessibility.testMicrophone}
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[13px] leading-5 text-muted">
              <AudioLines className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {copy.accessibility.demoNote}
            </p>
          </Card>

          <div className="rounded-xl border border-forest/40 bg-mint/50 p-3.5">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-forest">
              <Accessibility className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.accessibility.builtTitle}
            </p>
            <p className="mt-1.5 text-[13px] leading-5 text-forest/80">{copy.accessibility.builtBody}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <Link to="/patient/onboarding/consent" className={secondaryButton}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {copy.back}
        </Link>
        <button type="button" className={primaryButton} onClick={finish}>
          {copy.accessibility.finish}
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </OnboardingShell>
  );
};

export const onboardingStepPaths = STEP_PATHS;
