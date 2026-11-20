import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  Info,
  Languages,
  Loader2,
  Moon,
  Play,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound
} from 'lucide-react';
import { patientPortalApi } from '../../services/patientPortalApi';
import { Card, Pill, PortalPageHeader } from '../patient/portal/ui';
import { usePatientPortalStore } from '../../store/patientPortalStore';
import { useAuthStore } from '../../store/authStore';
import type { AssessmentMode } from './types';
import { DOMAIN_LABEL } from './types';
import { cognitiveApi, type AssessmentPlan, type CognitiveSessionRecord, type SessionContext } from './cognitiveApi';
import { CognitiveSessionRunner } from './CognitiveSessionRunner';
import { CognitiveSummary } from './CognitiveSummary';
import { HealthcareScene } from '../../components/illustrations/HealthcareScene';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { getCognitiveCopy } from '../../services/language/cognitiveCopy';

type Stage = 'setup' | 'plan' | 'session' | 'summary';

const PROGRESS_KEY = 'nl_cognitive_paused_session';

const scoreLabels = ['1', '2', '3', '4', '5'];

const buildScaleOptions = (copy: ReturnType<typeof getCognitiveCopy>) => [
  { value: '', label: copy.scale.notReported },
  ...scoreLabels.map((value) => ({
    value,
    label: ['1', '2'].includes(value) ? copy.scale.low(value) : copy.scale.high(value)
  }))
];

const buildSleepOptions = (copy: ReturnType<typeof getCognitiveCopy>) => [
  { value: '', label: copy.sleep.notReported },
  ...scoreLabels.map((value) => ({
    value,
    label: ['1', '2', '3'].includes(value) ? copy.sleep.poor(value) : copy.sleep.good(value)
  }))
];

const fieldClass =
  'min-h-12 w-full rounded-xl border border-line bg-white px-3 text-base text-ink outline-none focus:border-forest focus:ring-4 focus:ring-forest/10';

const numberOrNull = (value: string) => (value === '' ? null : Number(value));

export const CognitiveHubPage: React.FC = () => {
  const { user } = useAuthStore();
  const { accessibility } = usePatientPortalStore();
  const copy = getCognitiveCopy(useLanguageStore((state) => state.currentLanguage));
  const scaleOptions = buildScaleOptions(copy);
  const sleepOptions = buildSleepOptions(copy);
  const [stage, setStage] = useState<Stage>('setup');
  const [mode, setMode] = useState<AssessmentMode>('STANDARDIZED');
  const [minutes, setMinutes] = useState(15);
  const [context, setContext] = useState<SessionContext>({
    age: null,
    educationYears: null,
    language: user?.language || 'en',
    sleepHours: null,
    sleepQuality: null,
    fatigue: null,
    mood: null,
    stress: null,
    vision: null,
    hearing: null,
    motor: null,
    digitalFamiliarity: null,
    device: 'tablet',
    reportedBy: 'PATIENT'
  });
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [largeText, setLargeText] = useState(accessibility.textSize !== 'normal');
  const [highContrast, setHighContrast] = useState(accessibility.highContrast);
  const [extraPractice, setExtraPractice] = useState(accessibility.textSize === 'xlarge');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<AssessmentPlan | null>(null);
  const [session, setSession] = useState<CognitiveSessionRecord | null>(null);
  const [pausedSnapshot, setPausedSnapshot] = useState<any>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    cognitiveApi
      .getContext()
      .then((result) => {
        setContext((current) => ({ ...current, ...result.context }));
        setMissingFields(result.missingFields);
      })
      .catch(() => {
        /* The form still works without pre-filled context. */
      });
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.plan && Array.isArray(parsed?.results)) setPausedSnapshot(parsed);
      }
    } catch {
      /* ignore corrupt snapshots */
    }
  }, []);

  const update = <K extends keyof SessionContext>(key: K, value: SessionContext[K]) =>
    setContext((current) => ({ ...current, [key]: value }));

  const accommodations = useMemo(
    () => ({ largeText, highContrast, extraPractice }),
    [largeText, highContrast, extraPractice]
  );

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...context, language: context.language || user?.language || 'en' };
      await patientPortalApi
        .saveContextInput('assessment_context', {
          sleepHours: payload.sleepHours,
          sleepQuality: payload.sleepQuality,
          fatigue: payload.fatigue,
          mood: payload.mood,
          stress: payload.stress,
          vision: payload.vision,
          hearing: payload.hearing,
          motor: payload.motor,
          digitalFamiliarity: payload.digitalFamiliarity,
          device: payload.device
        })
        .catch(() => undefined);
      const result = await cognitiveApi.createPlan(mode, minutes, payload);
      setPlan(result.plan);
      setStage('plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.hub.planError);
    } finally {
      setLoading(false);
    }
  };

  if (stage === 'session' && plan) {
    return (
      <CognitiveSessionRunner
        plan={plan}
        context={context}
        accommodations={accommodations}
        onCancel={() => setStage('plan')}
        onSubmitted={(record) => {
          setSession(record);
          setStage('summary');
          sessionStorage.removeItem(PROGRESS_KEY);
        }}
      />
    );
  }

  if (stage === 'summary' && session) {
    return (
      <CognitiveSummary
        session={session}
        onRestart={() => {
          setSession(null);
          setPlan(null);
          setStage('setup');
        }}
      />
    );
  }

  if (stage === 'plan' && plan) {
    return (
      <div className="space-y-5">
        <PortalPageHeader
          eyebrow={copy.plan.eyebrow}
          title={copy.plan.title}
          description={copy.plan.description}
          actions={<Pill tone={plan.mode === 'STANDARDIZED' ? 'forest' : 'amber'} dot>{plan.mode === 'STANDARDIZED' ? copy.plan.standardized : copy.plan.exploratory}</Pill>}
        />

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-ink">
                {copy.plan.activitiesSummary(plan.tasks.length, plan.sessionMinutes)}
              </h2>
              <span className="text-xs font-semibold text-muted">{copy.plan.planId(plan.planId.slice(-8))}</span>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted">{plan.standardizationNotice}</p>

            <ol className="mt-4 space-y-2.5">
              {plan.tasks.map((task) => (
                <li key={task.taskId} className="rounded-2xl border border-line bg-warm/60 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">
                      {task.order}
                    </span>
                    <span className="text-base font-semibold text-ink">{task.name}</span>
                    <Pill tone="sage">{copy.domains[task.domain] || DOMAIN_LABEL[task.domain]}</Pill>
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-muted">
                      <Clock3 className="h-3.5 w-3.5" /> {copy.plan.minutesShort(task.durationMinutes)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[13px]">
                    <Pill tone="mint">{copy.plan.form(task.form)}</Pill>
                    <Pill tone={plan.mode === 'STANDARDIZED' ? 'sage' : 'amber'}>
                      {plan.mode === 'STANDARDIZED' ? copy.plan.fixedDifficulty : copy.plan.adaptiveLevel(task.difficultyLevel)}
                    </Pill>
                    <Pill tone="sage">{task.subdomain}</Pill>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedTask((current) => (current === task.taskId ? null : task.taskId))}
                    aria-expanded={expandedTask === task.taskId}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-forest hover:underline"
                  >
                    {copy.plan.whyActivity} <ChevronDown className={`h-3.5 w-3.5 transition ${expandedTask === task.taskId ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedTask === task.taskId && (
                    <ul className="mt-2 space-y-1.5 rounded-xl border border-line bg-white p-3 text-xs leading-5 text-muted">
                      {task.rationale.map((reason) => (
                        <li key={reason} className="flex gap-2">
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-deep" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </Card>

          <div className="space-y-4">
            {plan.warnings.length > 0 && (
              <Card className="border-amber/60 bg-amber/5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-amber-900">
                  <AlertTriangle className="h-4 w-4" /> {copy.plan.beforeStart}
                </h2>
                <ul className="mt-2 space-y-2">
                  {plan.warnings.map((warning) => (
                    <li key={warning.code} className="text-xs leading-5 text-amber-900/90">
                      <span className="font-bold">{warning.label}.</span> {warning.detail}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {plan.confounders.length > 0 && (
              <Card>
                <h2 className="text-base font-semibold text-ink">{copy.plan.recordedContext}</h2>
                <ul className="mt-2 space-y-2">
                  {plan.confounders.map((item) => (
                    <li key={item.code} className="rounded-xl border border-line bg-warm/60 p-2.5 text-xs leading-5 text-muted">
                      <span className="font-semibold text-ink">{item.label}.</span> {item.detail}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[13px] leading-5 text-muted">
                  {copy.plan.confoundersNote}
                </p>
              </Card>
            )}

            <Card>
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <Accessibility className="h-4 w-4 text-sage-deep" /> {copy.plan.accommodations}
              </h2>
              <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted">
                {(plan.accommodations.length ? plan.accommodations : [copy.plan.defaultAccommodation]).map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" /> {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-xl border border-mint bg-mint/50 p-2.5 text-[13px] leading-5 text-forest">
                <ShieldCheck className="me-1 inline h-3.5 w-3.5" />
                {copy.plan.clinicianReviewNote}
              </p>
            </Card>

            <Card>
              <h2 className="text-base font-semibold text-ink">{copy.plan.adminTitle}</h2>
              <dl className="mt-2 space-y-1.5 text-xs">
                {[
                  [copy.plan.mode, plan.mode === 'STANDARDIZED' ? copy.hub.standardizedTitle : copy.hub.exploratoryTitle],
                  [copy.plan.protocol, `${plan.protocolId} v${plan.protocolVersion}`],
                  [copy.plan.algorithm, plan.algorithmVersion],
                  [copy.plan.language, context.language === 'en' ? copy.plan.english : context.language.toUpperCase()],
                  [copy.plan.clinicianApproval, plan.clinicianApproval ? plan.clinicianApproval.decision.replace('_', ' ') : copy.plan.notReviewed]
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-muted">{label}</dt>
                    <dd className="text-right font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </div>

        {error && <p className="rounded-xl border border-amber/60 bg-amber/10 p-3 text-sm text-amber-900">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStage('session')}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-forest px-6 text-lg font-semibold text-white shadow-elevated hover:bg-forest/90"
          >
            <Play className="h-5 w-5" aria-hidden="true" /> {copy.plan.startAssessment}
          </button>
          <button
            type="button"
            onClick={() => setStage('setup')}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-5 text-base font-semibold text-ink hover:bg-warm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {copy.plan.changeSettings}
          </button>
          <Link to="/patient/cognitive/library" className="inline-flex min-h-14 items-center gap-1 px-3 text-sm font-semibold text-forest hover:underline">
            {copy.plan.browseLibrary}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.hub.eyebrow}
        title={copy.hub.title}
        description={copy.hub.description}
        actions={
          <Link
            to="/patient/cognitive/library"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-forest hover:bg-mint"
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" /> {copy.hub.libraryLink(32)}
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-3xl">
        <HealthcareScene
          kind="assessmentIntro"
          className="w-full"
          title={copy.hub.sceneTitle}
          animated={false}
        />
      </div>

      {pausedSnapshot && (
        <div className="rounded-2xl border border-forest/40 bg-mint/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-ink">{copy.hub.pausedTitle}</p>
              <p className="mt-0.5 text-xs text-muted">
                {copy.hub.pausedDetail(pausedSnapshot.results?.length || 0, pausedSnapshot.plan?.tasks?.length || 0)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlan(pausedSnapshot.plan);
                  setContext(pausedSnapshot.context);
                  setStage('session');
                }}
                className="min-h-11 rounded-xl bg-forest px-4 text-sm font-semibold text-white"
              >
                {copy.hub.resume}
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem(PROGRESS_KEY);
                  setPausedSnapshot(null);
                }}
                className="min-h-11 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-body"
              >
                {copy.hub.discard}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            id: 'STANDARDIZED' as AssessmentMode,
            icon: Stethoscope,
            title: copy.hub.standardizedTitle,
            detail: copy.hub.standardizedDetail,
            points: copy.hub.standardizedPoints
          },
          {
            id: 'EXPLORATORY' as AssessmentMode,
            icon: Sparkles,
            title: copy.hub.exploratoryTitle,
            detail: copy.hub.exploratoryDetail,
            points: copy.hub.exploratoryPoints
          }
        ].map(({ id, icon: Icon, title, detail, points }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              aria-pressed={active}
              className={`rounded-2xl border-2 p-4 text-left transition ${
                active ? 'border-forest bg-mint/40 shadow-card' : 'border-line bg-white hover:border-sage'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-forest text-white' : 'bg-mint text-forest'}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-base font-semibold text-ink">{title}</span>
                {active && <Check className="ml-auto h-4 w-4 text-forest" aria-hidden="true" />}
              </span>
              <p className="mt-2 text-xs leading-5 text-muted">{detail}</p>
              <ul className="mt-2 space-y-1">
                {points.map((point) => (
                  <li key={point} className="flex gap-1.5 text-[13px] leading-5 text-body">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-forest" /> {point}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Moon className="h-4 w-4 text-sage-deep" /> {copy.hub.todayTitle}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            {copy.hub.todayDetail}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              {copy.hub.hoursSlept}
              <input
                type="number"
                min={0}
                max={14}
                step={0.5}
                value={context.sleepHours ?? ''}
                onChange={(event) => update('sleepHours', numberOrNull(event.target.value))}
                placeholder={copy.hub.notReported}
                className={`${fieldClass} mt-1`}
              />
            </label>
            <label className="block text-sm font-semibold text-ink">
              {copy.hub.sleepQuality}
              <select
                value={context.sleepQuality ?? ''}
                onChange={(event) => update('sleepQuality', numberOrNull(event.target.value))}
                className={`${fieldClass} mt-1`}
              >
                {sleepOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              {copy.hub.fatigue}
              <select
                value={context.fatigue ?? ''}
                onChange={(event) => update('fatigue', numberOrNull(event.target.value))}
                className={`${fieldClass} mt-1`}
              >
                {scaleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              {copy.hub.stress}
              <select
                value={context.stress ?? ''}
                onChange={(event) => update('stress', numberOrNull(event.target.value))}
                className={`${fieldClass} mt-1`}
              >
                {scaleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              {copy.hub.mood}
              <select
                value={context.mood ?? ''}
                onChange={(event) => update('mood', numberOrNull(event.target.value))}
                className={`${fieldClass} mt-1`}
              >
                {scaleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              {copy.hub.language}
              <select
                value={context.language}
                onChange={(event) => update('language', event.target.value)}
                className={`${fieldClass} mt-1`}
              >
                <option value="en">{copy.plan.english}</option>
                <option value="ar">{copy.hub.languagePending('العربية')}</option>
                <option value="ta">{copy.hub.languagePending('தமிழ்')}</option>
                <option value="hi">{copy.hub.languagePending('हिन्दी')}</option>
                <option value="te">{copy.hub.languagePending('తెలుగు')}</option>
                <option value="ml">{copy.hub.languagePending('മലയാളം')}</option>
                <option value="kn">{copy.hub.languagePending('ಕನ್ನಡ')}</option>
              </select>
            </label>
          </div>
          {missingFields.length > 0 && (
            <p className="mt-3 flex gap-2 rounded-xl border border-line bg-warm/60 p-2.5 text-[13px] leading-5 text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {copy.hub.missingReported(missingFields.join(', '))}
            </p>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <Accessibility className="h-4 w-4 text-sage-deep" /> {copy.hub.accessibilityTitle}
            </h2>
            <div className="mt-3 space-y-3">
              {[
                [copy.hub.vision, 'vision'],
                [copy.hub.hearing, 'hearing'],
                [copy.hub.motor, 'motor']
              ].map(([label, key]) => (
                <label key={key} className="block text-sm font-semibold text-ink">
                  {label}
                  <select
                    value={(context[key as 'vision' | 'hearing' | 'motor'] as string) || ''}
                    onChange={(event) =>
                      update(
                        key as 'vision' | 'hearing' | 'motor',
                        (event.target.value || null) as SessionContext['vision']
                      )
                    }
                    className={`${fieldClass} mt-1`}
                  >
                    <option value="">{copy.hub.notReported}</option>
                    <option value="none">{copy.hub.noDifficulty}</option>
                    <option value="mild">{copy.hub.mildDifficulty}</option>
                    <option value="significant">{copy.hub.significantDifficulty}</option>
                  </select>
                </label>
              ))}
              <label className="block text-sm font-semibold text-ink">
                {copy.hub.familiarity}
                <select
                  value={context.digitalFamiliarity || ''}
                  onChange={(event) =>
                    update('digitalFamiliarity', (event.target.value || null) as SessionContext['digitalFamiliarity'])
                  }
                  className={`${fieldClass} mt-1`}
                >
                  <option value="">{copy.hub.notReported}</option>
                  <option value="low">{copy.hub.familiarityLow}</option>
                  <option value="medium">{copy.hub.familiarityMedium}</option>
                  <option value="high">{copy.hub.familiarityHigh}</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-ink">
                {copy.hub.device}
                <select
                  value={context.device || 'tablet'}
                  onChange={(event) => update('device', event.target.value as SessionContext['device'])}
                  className={`${fieldClass} mt-1`}
                >
                  <option value="tablet">{copy.hub.deviceTablet}</option>
                  <option value="desktop">{copy.hub.deviceDesktop}</option>
                  <option value="phone">{copy.hub.devicePhone}</option>
                </select>
              </label>
            </div>
            <div className="mt-4 space-y-2 border-t border-line pt-3">
              {([
                [copy.hub.largerText, largeText, setLargeText],
                [copy.hub.highContrast, highContrast, setHighContrast],
                [copy.hub.extraPractice, extraPractice, setExtraPractice]
              ] as Array<[string, boolean, (value: boolean) => void]>).map(([label, value, setter]) => (
                <label key={label} className="flex items-center justify-between gap-3 text-sm text-ink">
                  {label}
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(event) => setter(event.target.checked)}
                    className="h-5 w-5 accent-[#2f5e4e]"
                  />
                </label>
              ))}
            </div>
          </Card>

          {mode === 'EXPLORATORY' && (
            <Card>
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <Clock3 className="h-4 w-4 text-sage-deep" /> {copy.hub.sessionLength}
              </h2>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[10, 15, 20].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMinutes(value)}
                    className={`min-h-12 rounded-xl border-2 text-sm font-semibold ${
                      minutes === value ? 'border-forest bg-mint text-forest' : 'border-line bg-white text-body'
                    }`}
                  >
                    {copy.hub.minutes(value)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[13px] leading-5 text-muted">
                {copy.hub.sessionLengthNote}
              </p>
            </Card>
          )}
        </div>
      </div>

      {error && <p className="rounded-xl border border-amber/60 bg-amber/10 p-3 text-sm text-amber-900">{error}</p>}

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-xs leading-5 text-muted">
          {copy.hub.disclaimer}
        </p>
        <button
          type="button"
          onClick={generatePlan}
          disabled={loading}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-forest px-6 text-lg font-semibold text-white shadow-elevated transition hover:bg-forest/90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-5 w-5" aria-hidden="true" />}
          {loading ? copy.hub.buildingPlan : copy.hub.reviewPlan}
        </button>
      </div>

      <p className="flex items-center gap-2 text-[13px] text-muted">
        <UserRound className="h-3.5 w-3.5" /> {copy.hub.signedInAs(user?.name || copy.hub.patientFallback, user?.patientId || copy.hub.notAvailable)}
      </p>
    </div>
  );
};
