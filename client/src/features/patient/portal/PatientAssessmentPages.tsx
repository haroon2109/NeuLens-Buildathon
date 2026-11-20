import React, { useEffect } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  AudioLines,
  Brain,
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  Fingerprint,
  Info,
  Languages,
  ListChecks,
  Mic,
  MonitorPlay,
  PauseCircle,
  Play,
  Printer,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
  Volume2,
  Waves
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PatientAssessmentRecord } from '../../../services/patientPortalApi';
import { usePatientPortalStore } from '../../../store/patientPortalStore';
import { usePatientOverview } from './usePatientOverview';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { getAssessmentCopy, type StageKey } from '../../../services/language/assessmentCopy';
import { useVoiceAssistantStore } from '../../../services/voice/VoiceInstructionEngine';
import { HealthcareScene } from '../../../components/illustrations/HealthcareScene';
import { MotionReveal } from '../../../components/motion/Reveal';
import { AssessmentProgress, AssessmentShell, QuietDetails } from './AssessmentFlow';
import {
  AssessmentStatusPill,
  Card,
  EmptyState,
  InfoRow,
  Pill,
  PortalPageHeader,
  ScoreDial,
  SectionTitle,
  formatDate,
  formatDateTime,
  primaryButton,
  secondaryButton
} from './ui';

const getQuality = (assessment: PatientAssessmentRecord | null) => {
  const stored = assessment?.taskResponses?.quality || {};
  return {
    audio: stored.audio || 'ADEQUATE',
    video: stored.video || 'ADEQUATE',
    completion: stored.completion || 'FULL',
    comprehension: stored.comprehension || 'CLEAR',
    interruptions: typeof stored.interruptions === 'number' ? stored.interruptions : 0,
    comparable: stored.comparable !== false
  };
};

type AssessmentCopy = ReturnType<typeof getAssessmentCopy>;

const qualityLabel = (value: string, labels: AssessmentCopy['qualityLabels']) => {
  if (value === 'GOOD') return labels.good;
  if (value === 'ADEQUATE') return labels.adequate;
  if (value === 'POOR') return labels.limited;
  if (value === 'FULL') return labels.full;
  if (value === 'CLEAR') return labels.clear;
  return labels.notRecorded;
};

const domainObservations = (assessment: PatientAssessmentRecord, copy: AssessmentCopy['domain']) => {
  const tasks = assessment.taskResponses || {};
  const task2 = tasks.task2 || {};
  const task5 = tasks.task5 || {};

  return [
    {
      label: copy.labels[0],
      detail:
        task2.matchedPairs != null
          ? copy.memoryPairs(task2.matchedPairs, task2.mismatches ?? 0)
          : copy.memoryDone
    },
    {
      label: copy.labels[1],
      detail: assessment.eyeMetrics
        ? copy.eyeValue(Math.round(assessment.eyeMetrics.reactionTime))
        : copy.eyeDone
    },
    {
      label: copy.labels[2],
      detail: assessment.voiceMetrics
        ? copy.voiceValue(Math.round(assessment.voiceMetrics.speechRate))
        : copy.voiceDone
    },
    {
      label: copy.labels[3],
      detail: assessment.faceMetrics ? copy.faceDone : copy.faceNone
    },
    {
      label: copy.labels[4],
      detail:
        task5.trailBCompletionSec != null
          ? copy.functionalValue(task5.trailBCompletionSec, task5.sequencingErrors ?? 0)
          : copy.functionalDone
    }
  ];
};

// ---------------------------------------------------------------------------
// Screen 21 — Assessment Introduction
// ---------------------------------------------------------------------------
const SESSION_STEP_META: Array<{ icon: LucideIcon; path: string }> = [
  { icon: Fingerprint, path: '/patient/assessment/cognitive' },
  { icon: Eye, path: '/patient/assessment/ocular' },
  { icon: AudioLines, path: '/patient/assessment/vocal' },
  { icon: ScanFace, path: '/patient/assessment/facial' }
];


export const AssessmentIntroductionPage: React.FC = () => {
  const { getTranslation, currentLanguage } = useLanguageStore();
  const t = getTranslation();
  const copy = getAssessmentCopy(currentLanguage);
  const sessionSteps = SESSION_STEP_META.map((meta, index) => ({
    ...meta,
    ...copy.sessionSteps[index]
  }));
  const { speak, stopSpeaking } = useVoiceAssistantStore();

  // Re-read the introduction whenever the language changes, so switching the
  // voice-guidance language mid-screen is heard immediately instead of only
  // taking effect on the next visit.
  useEffect(() => {
    speak(t.intro.spokenIntro);
    return () => {
      stopSpeaking();
    };
  }, [t.intro.spokenIntro, speak, stopSpeaking]);

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.intro.eyebrow}
        title={copy.intro.title}
        description={copy.intro.description}
        actions={<Pill tone="forest" dot>{copy.intro.duration}</Pill>}
      />

      <AssessmentProgress />

      <MotionReveal className="w-full">
        <HealthcareScene
          kind="assessmentIntro"
          className="w-full"
          title={copy.intro.sceneTitle}
          animated={false}
        />
      </MotionReveal>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionTitle title={copy.intro.purposeTitle} detail={copy.intro.purposeDetail} />
          <p className="text-[14px] leading-6 text-muted">{copy.intro.purposeBody}</p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {[Eye, Mic, ScanFace, Fingerprint].map((Icon, index) => ({
              Icon,
              title: copy.intro.actions[index].title,
              detail: copy.intro.actions[index].detail
            })).map(({ Icon, title, detail }) => (
              <div key={title} className="flex items-start gap-2.5 rounded-xl border border-line bg-warm/70 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-forest shadow-xs">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-ink">{title}</span>
                  <span className="mt-0.5 block text-[13px] leading-4 text-muted">{detail}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-amber/60 bg-amber/10 p-3.5">
            <p className="flex items-center gap-1.5 text-[14px] font-bold text-amber-900">
              <PauseCircle className="h-4 w-4" aria-hidden="true" />
              {copy.intro.pauseTitle}
            </p>
            <p className="mt-1 text-[13px] leading-5 text-amber-900/80">{copy.intro.pauseBody}</p>
          </div>
        </Card>

        <Card>
          <SectionTitle title={copy.intro.environmentTitle} detail={copy.intro.environmentDetail} />
          <ul className="space-y-2.5">
            {copy.intro.environment.map((item) => (
              <li key={item} className="flex gap-2 text-[13px] leading-5 text-muted">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-mint bg-mint/50 p-3">
            <p className="flex items-center gap-1.5 text-[14px] font-bold text-forest">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.intro.accessibilityTitle}
            </p>
            <p className="mt-1 text-[13px] leading-5 text-forest/80">{copy.intro.accessibilityBody}</p>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title={copy.intro.sessionTitle} detail={copy.intro.sessionDetail} />
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {sessionSteps.map(({ icon: Icon, title, detail, minutes, path }, index) => (
            <li key={title} className="pp-card p-4">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-forest shadow-xs">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-[12px] font-bold text-muted">0{index + 1}</span>
              </div>
              <h3 className="mt-3 text-[14px] font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-[13px] leading-4 text-muted">{detail}</p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-muted">{minutes}</span>
                <Link to={path} className="text-[13px] font-bold text-forest hover:underline">{copy.intro.preview}</Link>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-5 text-muted">{copy.intro.privacy}</p>
          <Link to="/patient/assessment" className={primaryButton}>
            <Play className="h-4 w-4" aria-hidden="true" />
            {copy.intro.begin}
          </Link>
        </div>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screens 22–25 — Assessment stages
// ---------------------------------------------------------------------------
type StageDefinition = {
  stage: string;
  eyebrow: string;
  title: string;
  icon: LucideIcon;
  minutes: string;
  description: string;
  tasks: string[];
  observations: string[];
  equipment: string[];
  quality: string[];
  exploratoryNote?: string;
};

const STAGE_ICONS: Record<StageKey, LucideIcon> = {
  cognitive: Fingerprint,
  ocular: Eye,
  vocal: AudioLines,
  facial: ScanFace
};


const StagePage: React.FC<{ stage: StageKey }> = ({ stage }) => {
  const copy = getAssessmentCopy(useLanguageStore((state) => state.currentLanguage));
  const definition = copy.stages[stage];
  const Icon = STAGE_ICONS[stage];

  return (
    <AssessmentShell
      step={stage}
      eyebrow={`${definition.stage} · ${definition.eyebrow}`}
      title={definition.title}
      description={definition.description}
      icon={Icon}
      actions={<Link to="/patient/assessment/intro" className={secondaryButton}>{copy.stageChrome.backToPlan}</Link>}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[14px] font-semibold text-ink">{copy.stageChrome.whatYouWillDo}</h2>
        <Pill tone="sage">
          <Clock3 className="h-3 w-3" aria-hidden="true" />
          {definition.minutes}
        </Pill>
      </div>
      <p className="mt-1 text-[13px] leading-5 text-muted">{copy.stageChrome.guidance}</p>

      <ol className="mt-4 space-y-2">
        {definition.tasks.map((task, index) => (
          <li key={task} className="flex items-start gap-3 rounded-xl border border-line/70 bg-warm/50 px-3 py-2.5">
            <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint text-[12px] font-bold text-forest">
              {index + 1}
            </span>
            <span className="text-[14px] leading-5 text-ink">{task}</span>
          </li>
        ))}
      </ol>

      {definition.exploratoryNote && (
        <div className="mt-4 rounded-xl border border-amber/60 bg-amber/10 p-3.5">
          <p className="flex items-center gap-1.5 text-[14px] font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {copy.stageChrome.exploratory}
          </p>
          <p className="mt-1 text-[13px] leading-5 text-amber-900/80">{definition.exploratoryNote}</p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-line/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-5 text-muted">{copy.stageChrome.pauseNote}</p>
        <Link to="/patient/assessment" className={primaryButton}>
          <Play className="h-4 w-4" aria-hidden="true" />
          {copy.stageChrome.begin}
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        <QuietDetails summary={copy.stageChrome.whatIsObserved}>
          <ul className="space-y-2">
            {definition.observations.map((item) => (
              <li key={item} className="flex gap-2">
                <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] leading-4 text-muted">{copy.stageChrome.derivedNote}</p>
        </QuietDetails>

        <QuietDetails summary={copy.stageChrome.beforeYouBegin}>
          <div className="flex flex-wrap gap-1.5">
            {definition.equipment.map((item) => (
              <Pill key={item} tone="sage">{item}</Pill>
            ))}
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {definition.quality.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-forest" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </QuietDetails>
      </div>
    </AssessmentShell>
  );
};

export const CognitiveAssessmentPage: React.FC = () => <StagePage stage="cognitive" />;
export const OcularAssessmentPage: React.FC = () => <StagePage stage="ocular" />;
export const VocalAssessmentPage: React.FC = () => <StagePage stage="vocal" />;
export const FacialAssessmentPage: React.FC = () => <StagePage stage="facial" />;

// ---------------------------------------------------------------------------
// Screen 26 — Assessment Completion
// ---------------------------------------------------------------------------
export const AssessmentCompletionPage: React.FC = () => {
  const { latestAssessment } = usePatientOverview();
  const copy = getAssessmentCopy(useLanguageStore((state) => state.currentLanguage));
  const tasks = latestAssessment?.taskResponses || {};
  const completedTasks = ['task1', 'task2', 'task3', 'task4', 'task5'].filter((key) => Boolean(tasks[key]));
  const skipped = 5 - completedTasks.length;

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.completion.eyebrow}
        title={copy.completion.title}
        description={copy.completion.description}
      />

      <AssessmentProgress complete />

      {!latestAssessment ? (
        <EmptyState
          scene="emptyAssessment"
          icon={ClipboardList}
          title={copy.completion.emptyTitle}
          detail={copy.completion.emptyDetail}
          action={<Link to="/patient/assessment/intro" className={primaryButton}>{copy.completion.startScreening}</Link>}
        />
      ) : (
        <>
          <MotionReveal className="w-full">
            <HealthcareScene
              kind="explainResults"
              className="w-full"
              title={copy.completion.sceneTitle}
              animated={false}
            />
          </MotionReveal>

          <Card className="border-forest/40 bg-mint/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-white shadow-xs">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">{copy.completion.submittedTitle}</h2>
                  <p className="mt-1 text-[13px] leading-5 text-muted">
                    {copy.completion.reference(formatDateTime(latestAssessment.date), latestAssessment.id.slice(0, 14))}
                  </p>
                </div>
              </div>
              <AssessmentStatusPill reviewStatus={latestAssessment.reviewStatus} status={latestAssessment.status} />
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <SectionTitle title={copy.completion.statusTitle} />
              <div className="space-y-1">
                <InfoRow label={copy.completion.tasksCompleted} value={copy.completion.ofFive(completedTasks.length)} />
                <InfoRow label={copy.completion.tasksSkipped} value={String(skipped)} />
                <InfoRow label={copy.completion.technicalIssues} value={copy.completion.noneReported} />
                <InfoRow label={copy.completion.submitted} value={formatDateTime(latestAssessment.date)} />
              </div>
            </Card>
            <Card>
              <SectionTitle title={copy.completion.activitiesTitle} />
              <ul className="space-y-2">
                {copy.completion.activities.map((label, index) => {
                  const key = ['task2', 'task1', 'task3', 'task4', 'task5'][index];
                  return (
                    <li key={key} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="text-muted">{label}</span>
                      {tasks[key] ? (
                        <Pill tone="forestSoft" dot>{copy.completion.captured}</Pill>
                      ) : (
                        <Pill tone="sage">{copy.completion.skippedLabel}</Pill>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
            <Card>
              <SectionTitle title={copy.completion.nextTitle} />
              <ol className="space-y-2.5 text-[13px] leading-5 text-muted">
                {copy.completion.nextSteps.map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="font-bold text-forest">{index + 1}.</span> {step}
                  </li>
                ))}
              </ol>
              <Link to="/patient/assessment/quality" className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-forest hover:underline">
                {copy.completion.viewQuality} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/patient/assessment/quality" className={primaryButton}>{copy.completion.quality}</Link>
            <Link to="/patient/assessment/report" className={secondaryButton}>{copy.completion.summary}</Link>
            <Link to="/patient/dashboard" className={secondaryButton}>{copy.completion.dashboard}</Link>
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 27 — Assessment Quality Report
// ---------------------------------------------------------------------------
export const AssessmentQualityReportPage: React.FC = () => {
  const { latestAssessment, assessments } = usePatientOverview();
  const copy = getAssessmentCopy(useLanguageStore((state) => state.currentLanguage)).qualityPage;
  const quality = getQuality(latestAssessment);
  // Three prior comparable sessions are required before a change interpretation is shown.
  const comparable = quality.comparable === true && assessments.length >= 4;
  const labels = getAssessmentCopy(useLanguageStore((state) => state.currentLanguage)).qualityLabels;

  const items = [
    { label: copy.audio, value: qualityLabel(quality.audio, labels), icon: Mic, good: quality.audio === 'GOOD' || quality.audio === 'ADEQUATE' },
    { label: copy.video, value: qualityLabel(quality.video, labels), icon: Camera, good: quality.video === 'GOOD' || quality.video === 'ADEQUATE' },
    { label: copy.completion, value: qualityLabel(quality.completion, labels), icon: ListChecks, good: quality.completion === 'FULL' },
    { label: copy.comprehension, value: qualityLabel(quality.comprehension, labels), icon: Languages, good: quality.comprehension === 'CLEAR' },
    { label: copy.interruptions, value: quality.interruptions === null ? copy.notRecordedValue : String(quality.interruptions), icon: Volume2, good: quality.interruptions === 0 }
  ];

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      {!latestAssessment ? (
        <EmptyState scene="emptyAssessment" icon={ShieldCheck} title={copy.emptyTitle} detail={copy.emptyDetail} />
      ) : (
        <>
          <div className={`rounded-2xl border p-4 ${comparable ? 'border-forest/40 bg-mint/50' : 'border-amber/60 bg-amber/10'}`}>
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${comparable ? 'bg-forest text-white shadow-xs' : 'bg-amber-100 text-amber-700 shadow-xs'}`}>
                {comparable ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <AlertTriangle className="h-5 w-5" aria-hidden="true" />}
              </span>
              <div>
                <h2 className={`text-[14px] font-semibold ${comparable ? 'text-ink' : 'text-amber-900'}`}>
                  {comparable ? copy.validTitle : copy.withheldTitle}
                </h2>
                <p className={`mt-1 text-[13px] leading-5 ${comparable ? 'text-muted' : 'text-amber-900/80'}`}>
                  {comparable ? copy.validBody : copy.withheldBody}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <Card>
              <SectionTitle title={copy.indicatorsTitle} detail={formatDateTime(latestAssessment.date)} />
              <div className="space-y-2">
                {items.map(({ label, value, icon: Icon, good }) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-warm/70 p-3">
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                      <Icon className="h-4 w-4 text-sage-deep" aria-hidden="true" />
                      {label}
                    </span>
                    <Pill tone={good ? 'forestSoft' : 'amber'} dot>{value}</Pill>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <SectionTitle title={copy.validityTitle} />
                <dl>
                  <InfoRow label={copy.previousSessions} value={`${Math.max(assessments.length - 1, 0)}`} />
                  <InfoRow label={copy.minimum} value={copy.minimumValue} />
                  <InfoRow label={copy.status} value={comparable ? copy.available : copy.unavailable} />
                  <InfoRow label={copy.included} value={comparable ? copy.yes : copy.no} />
                </dl>
              </Card>
              <div className="rounded-xl border border-line bg-warm/70 p-3.5">
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.whyTitle}
                </p>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  {copy.whyBody}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/patient/assessment/baseline" className={primaryButton}>{copy.baselineBtn}</Link>
            <Link to="/patient/assessment/report" className={secondaryButton}>{copy.summaryBtn}</Link>
            <Link to="/patient/trends" className={secondaryButton}>{copy.compareBtn}</Link>
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 28 — Personal Baseline Report
// ---------------------------------------------------------------------------
export const PersonalBaselineReportPage: React.FC = () => {
  const { baseline } = usePatientOverview();
  const copy = getAssessmentCopy(useLanguageStore((state) => state.currentLanguage)).baselinePage;

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<Pill tone="amber" dot>{copy.provisional}</Pill>}
      />

      {!baseline ? (
        <EmptyState
          scene="emptyAssessment"
          icon={Brain}
          title={copy.emptyTitle}
          detail={copy.emptyDetail}
          action={<Link to="/patient/assessment/intro" className={primaryButton}>{copy.start}</Link>}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="flex flex-col items-center justify-center text-center">
              <ScoreDial value={baseline.overallScore} label={copy.dialLabel} tone="#2f5e4e" />
              <p className="mt-3 text-[14px] font-semibold text-ink">{copy.recorded(formatDate(baseline.establishedAt))}</p>
              <p className="mt-1 max-w-[220px] text-[13px] leading-5 text-muted">
                {copy.scoreNote}
              </p>
            </Card>

            <Card>
              <SectionTitle title={copy.domainsTitle} detail={copy.domainsDetail} />
              <div className="space-y-3">
                {[
                  baseline.cognitiveScore,
                  baseline.functionalScore,
                  baseline.eyeScore,
                  baseline.voiceScore,
                  baseline.faceScore,
                  baseline.contextScore
                ].map((value, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted">{copy.domainLabels[index]}</span>
                      <span className="font-semibold text-ink">{value == null ? copy.notAvailable : value}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-forest"
                        style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionTitle title={copy.limitationsTitle} />
              <ul className="space-y-2 text-[13px] leading-5 text-muted">
                {copy.limitations.map((item) => (
                  <li key={item} className="flex gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />{item}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <SectionTitle title={copy.confidenceTitle} />
              <dl>
                {copy.confidence.map((item) => (
                  <InfoRow key={item.label} label={item.label} value={item.value} />
                ))}
              </dl>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/patient/trends" className={primaryButton}>{copy.trendsBtn}</Link>
            <Link to="/patient/assessment/report" className={secondaryButton}>{copy.summaryBtn}</Link>
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 29 — Assessment Report
// ---------------------------------------------------------------------------
export const AssessmentReportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const language = useLanguageStore((state) => state.currentLanguage);
  const { assessments, baseline, latestAssessment } = usePatientOverview();
  const id = searchParams.get('id');
  const assessment = assessments.find((item) => item.id === id) || latestAssessment;
  // Cognitive sessions have their own read-only record and must not be rendered
  // as a five-part screening report.
  if (assessment?.taskResponses?.cognitiveSummary) {
    return <Navigate to={`/patient/cognitive/history/${assessment.id}`} replace />;
  }
  const copy = getAssessmentCopy(language).reportPage;
  const domainCopy = getAssessmentCopy(language).domain;
  const labels = getAssessmentCopy(language).qualityLabels;
  const quality = getQuality(assessment);
  const change = assessment && baseline ? Number((assessment.overallScore - baseline.overallScore).toFixed(1)) : null;

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          assessment ? (
            <button type="button" onClick={() => window.print()} className={secondaryButton}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              {copy.print}
            </button>
          ) : undefined
        }
      />

      {!assessment ? (
        <EmptyState scene="emptyAssessment" icon={FileText} title={copy.emptyTitle} detail={copy.emptyDetail} />
      ) : (
        <>
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <AssessmentStatusPill reviewStatus={assessment.reviewStatus} status={assessment.status} />
                  <Pill tone={quality.comparable === true ? 'forestSoft' : quality.comparable === false ? 'amber' : 'sage'} dot>
                    {quality.comparable === true ? copy.qualityChecked : quality.comparable === false ? copy.limitedQuality : copy.qualityNotRecorded}
                  </Pill>
                </div>
                <h2 className="mt-2 text-[18px] font-semibold text-ink">{copy.sessionTitle(formatDate(assessment.date))}</h2>
                <p className="mt-1 text-[13px] text-muted">{copy.reference(assessment.id)}</p>
              </div>
              <div className="rounded-xl border border-line bg-warm/70 px-3 py-2 text-right">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-sage-deep">{copy.exploratory}</p>
                <p className="mt-0.5 text-[20px] font-semibold text-ink">{Math.round(assessment.overallScore)}</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <SectionTitle title={copy.domainsTitle} detail={copy.domainsDetail} />
              <div className="space-y-2.5">
                {domainObservations(assessment, domainCopy).map((item) => (
                  <div key={item.label} className="rounded-xl border border-line bg-warm/70 p-3">
                    <p className="text-[14px] font-semibold text-ink">{item.label}</p>
                    <p className="mt-1 text-[13px] leading-5 text-muted">{item.detail}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <SectionTitle title={copy.comparisonTitle} />
                {baseline && change != null ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] text-muted">{copy.thisSession}</span>
                      <span className="text-[13px] font-semibold text-ink">{Math.round(assessment.overallScore)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-[13px] text-muted">{copy.personalBaseline}</span>
                      <span className="text-[13px] font-semibold text-ink">{Math.round(baseline.overallScore)}</span>
                    </div>
                    <p className={`mt-3 rounded-xl border p-3 text-[13px] leading-5 ${Math.abs(change) <= 5
                        ? 'border-forest/40 bg-mint/50 text-ink'
                        : 'border-amber/60 bg-amber/10 text-amber-900'}
                    `}>
                      {Math.abs(change) <= 5
                        ? copy.withinRange(Math.abs(change), change >= 0 ? copy.above : copy.below)
                        : copy.outsideRange(Math.abs(change), change >= 0 ? copy.above : copy.below)}
                    </p>
                    <p className="mt-2 text-[13px] leading-5 text-muted">
                      {copy.comparisonNote}
                    </p>
                  </>
                ) : (
                  <p className="text-[13px] leading-5 text-muted">
                    {copy.noBaseline}
                  </p>
                )}
              </Card>

              <Card>
                <SectionTitle title={copy.reviewTitle} />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-muted">{copy.statusLabel}</span>
                  <AssessmentStatusPill reviewStatus={assessment.reviewStatus} status={assessment.status} />
                </div>
                {assessment.clinicianNotes ? (
                  <div className="mt-3 rounded-xl border border-mint bg-mint/50 p-3">
                    <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-forest">{copy.sharedNote}</p>
                    <p className="mt-1 text-[13px] leading-5 text-forest/80">{assessment.clinicianNotes}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-[13px] leading-5 text-muted">
                    {assessment.reviewStatus === 'PENDING_REVIEW' ? copy.notePending : copy.noNote}
                  </p>
                )}
              </Card>
            </div>
          </div>

          <Card>
            <SectionTitle title={copy.dataTitle} />
            <div className="flex flex-wrap gap-2">
              <Pill tone={quality.audio === 'POOR' ? 'amber' : quality.audio ? 'forestSoft' : 'sage'}>{copy.audio} · {qualityLabel(quality.audio, labels)}</Pill>
              <Pill tone={quality.video === 'POOR' ? 'amber' : quality.video ? 'forestSoft' : 'sage'}>{copy.video} · {qualityLabel(quality.video, labels)}</Pill>
              <Pill tone={quality.completion === 'FULL' ? 'forestSoft' : quality.completion ? 'amber' : 'sage'}>{qualityLabel(quality.completion, labels)}</Pill>
              <Pill tone={quality.interruptions ? 'amber' : quality.interruptions === 0 ? 'forestSoft' : 'sage'}>
                {quality.interruptions === null ? copy.interruptionsNone : copy.interruptions(quality.interruptions)}
              </Pill>
              <Pill tone={quality.comparable === true ? 'mint' : quality.comparable === false ? 'amber' : 'sage'}>
                {quality.comparable === true ? copy.comparisonMet : quality.comparable === false ? copy.comparisonWithheld : copy.comparisonNotRecorded}
              </Pill>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[13px] leading-5 text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {copy.disclaimer}
            </p>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Link to="/patient/documents" className={primaryButton}>{copy.saveBtn}</Link>
            <Link to="/patient/history" className={secondaryButton}>{copy.backBtn}</Link>
          </div>
        </>
      )}
    </div>
  );
};

export { getQuality };
