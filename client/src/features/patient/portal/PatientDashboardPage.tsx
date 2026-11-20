import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Brain,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  Moon,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
  TrendingUp,
  Users
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { treatmentTeam, usePatientPortalStore } from '../../../store/patientPortalStore';
import { usePatientOverview } from './usePatientOverview';
import { ErrorState, LoadingState } from '../../../components/systemStates';
import { BrainHealthPathway, derivePathwayFromOverview } from '../../../components/BrainHealthPathway';
import { HealthcareScene } from '../../../components/illustrations/HealthcareScene';
import { MotionReveal } from '../../../components/motion/Reveal';
import {
  AssessmentStatusPill,
  Card,
  EmptyState,
  Pill,
  PortalPageHeader,
  ScoreDial,
  SectionTitle,
  StatCard,
  formatDate
} from './ui';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { getDashboardCopy } from '../../../services/language/dashboardCopy';
import { getPathwayCopy } from '../../../services/language/pathwayCopy';
import { getPortalTranslation } from '../../../services/language/portalTranslations';

export const PatientDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const copy = getDashboardCopy(useLanguageStore((state) => state.currentLanguage));
  const statusText = getPortalTranslation(useLanguageStore((state) => state.currentLanguage)).shell.status;
  const { appointments, notifications, sleep, wellbeing } = usePatientPortalStore();
  // Context inputs start empty. Nothing has been recorded until the patient
  // enters it, so zeros must not be shown as measurements.
  const hasContext = [
    sleep.durationHours,
    sleep.quality,
    sleep.steps,
    sleep.activeMinutes,
    wellbeing.mood,
    wellbeing.stress
  ].some((value) => typeof value === 'number' && value > 0);
  const careTeamInitials = treatmentTeam.doctor
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const { assessments, latestAssessment, baseline, changes, brainHealth, context, isLoading, error, refresh } =
    usePatientOverview();

  const firstName = (user?.name || 'there').split(' ')[0];
  const nextAppointment = appointments.find((item) => item.status === 'UPCOMING' || item.status === 'RESCHEDULED');
  const latestChange = changes[0];
  const unread = notifications.filter((item) => !item.read).length;
  const recentAssessments = assessments.slice(0, 3);

  // Driven by the administrative review signal, not by a risk tier.
  const monitoringStatus = brainHealth?.reviewSignal === 'REVIEW_PROMPT'
    ? copy.hero.reviewSuggested
    : brainHealth?.reviewSignal === 'NOT_INTERPRETABLE'
      ? copy.hero.moreDataNeeded
      : copy.hero.monitoringOnly;
  const pathway = derivePathwayFromOverview(
    { baseline, changes, brainHealth, assessments, context },
    getPathwayCopy(useLanguageStore((state) => state.currentLanguage))
  );
  const preventionSteps = (brainHealth?.nextSteps || []).filter((s: any) => s?.stage === 4 || s?.type === 'PERSONALIZED_PREVENTION' || s?.type === 'REVIEW_CONTEXT');
  const personalizedPrevention = preventionSteps.length ? { signals: undefined, note: preventionSteps.map((s: any) => s.action || s).filter(Boolean).join(' ') } : null;

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.header.eyebrow}
        title={copy.header.greeting(firstName)}
        description={copy.header.description}
        actions={
          <Link
            to="/patient/assessment/intro"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 text-[14px] font-bold text-white transition hover:bg-blue-800"
          >
            <Sparkles className="h-4 w-4" /> {copy.header.startAssessment}
          </Link>
        }
      />

      <MotionReveal>
        <section className="pp-card overflow-hidden p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={baseline ? 'forest' : 'amber'} dot>
                  {baseline ? copy.hero.baselineActive : copy.hero.baselineMissing}
                </Pill>
                {baseline && <Pill tone="sage">{copy.hero.established(formatDate(baseline.establishedAt))}</Pill>}
              </div>
              <h2 className="mt-3 text-[21px] font-semibold tracking-[-0.03em] text-ink">
                {latestAssessment ? copy.hero.latestTitle : copy.hero.firstTitle}
              </h2>
              <p className="mt-1.5 text-[14px] leading-6 text-body">
                {latestAssessment
                  ? latestAssessment.reviewStatus === 'PENDING_REVIEW'
                    ? copy.hero.latestAwaiting(formatDate(latestAssessment.date))
                    : copy.hero.latestReviewed(formatDate(latestAssessment.date))
                  : copy.hero.firstBody}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={latestAssessment ? '/patient/assessment/report' : '/patient/assessment/intro'}
                  className="pp-btn pp-btn-primary pp-btn-sm"
                >
                  {latestAssessment ? copy.hero.readLatest : copy.hero.beginAssessment}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/patient/care-plan"
                  className="pp-btn pp-btn-secondary pp-btn-sm"
                >
                  {copy.hero.seeCarePlan}
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <HealthcareScene
                kind="patientHome"
                className="w-full max-w-[420px] lg:ml-auto"
                title={copy.hero.sceneTitle}
                animated={false}
              />
              <div className="grid min-w-[250px] grid-cols-2 gap-2.5">
                {[
                  { icon: Timer, label: copy.hero.duration, value: copy.hero.durationValue },
                  { icon: Stethoscope, label: copy.hero.careTeam, value: (user as any)?.assignedDoctor || treatmentTeam.doctor || copy.hero.careTeamFallback },
                  { icon: CalendarDays, label: copy.hero.nextVisit, value: nextAppointment ? formatDate(nextAppointment.date, { day: 'numeric', month: 'short' }) : copy.hero.notScheduled },
                  { icon: Activity, label: copy.hero.monitoring, value: monitoringStatus }
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-line bg-warm p-3">
                    <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-sage-deep">
                      <Icon className="h-3.5 w-3.5 text-sage-deep" aria-hidden="true" />
                      {label}
                    </span>
                    <p className="mt-1.5 text-[15px] font-semibold text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </MotionReveal>

      <MotionReveal>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <SectionTitle
              title={copy.followUp.title}
              detail={copy.followUp.detail}
              action={
                <Link to="/patient/appointments" className="text-[13px] font-bold text-forest hover:underline">
                  {copy.followUp.link}
                </Link>
              }
            />
            {nextAppointment ? (
              <div className="space-y-2">
                <div className="rounded-xl border border-mint bg-mint/50 p-3">
                  <p className="text-[14px] font-semibold text-ink">{formatDate(nextAppointment.date)}</p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {(nextAppointment as any).type || (nextAppointment as any).reason || copy.followUp.fallbackType} · {copy.followUp.scheduled}
                  </p>
                </div>
                <p className="text-[13px] leading-5 text-muted">{copy.followUp.note}</p>
              </div>
            ) : (
              <EmptyState
                scene="emptyAppointments"
                icon={CalendarDays}
                title={copy.followUp.emptyTitle}
                detail={copy.followUp.emptyDetail}
                action={
                  <Link to="/patient/appointments" className="text-[13px] font-bold text-forest">
                    {copy.followUp.emptyAction}
                  </Link>
                }
              />
            )}
          </Card>

          <Card>
            <SectionTitle
              title={copy.timeline.title}
              detail={copy.timeline.detail}
              action={
                <Link to="/patient/timeline" className="text-[13px] font-bold text-forest hover:underline">
                  {copy.timeline.open}
                </Link>
              }
            />
            {recentAssessments.length ? (
              <ol className="space-y-2">
                {recentAssessments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-warm/70 px-3 py-2">
                    <div>
                      <p className="text-[14px] font-semibold text-ink">{formatDate(a.date)}</p>
                      <p className="text-[13px] text-muted">{copy.timeline.itemNote}</p>
                    </div>
                    <AssessmentStatusPill reviewStatus={a.reviewStatus} status={a.status} />
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                scene="emptyAssessment"
                icon={TrendingUp}
                title={copy.timeline.emptyTitle}
                detail={copy.timeline.emptyDetail}
                action={
                  <Link to="/patient/assessment/intro" className="text-[13px] font-bold text-forest">
                    {copy.timeline.emptyAction}
                  </Link>
                }
              />
            )}
          </Card>
        </div>
      </MotionReveal>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={copy.stats.latestAssessment}
          value={latestAssessment ? formatDate(latestAssessment.date, { day: 'numeric', month: 'short' }) : copy.stats.notStarted}
          detail={
            latestAssessment
              ? latestAssessment.reviewStatus === 'REVIEWED'
                ? statusText.reviewed
                : latestAssessment.reviewStatus === 'FOLLOWUP_REQUIRED'
                ? statusText.followUpSuggested
                : statusText.awaitingReview
              : copy.stats.beginSession
          }
          icon={ClipboardList}
          tone="forest"
        />
        <StatCard
          label={copy.stats.personalBaseline}
          value={baseline ? copy.stats.established : copy.stats.pending}
          detail={baseline ? copy.stats.provisional : copy.stats.requiresFirst}
          icon={HeartPulse}
          tone="forestSoft"
        />
        <StatCard
          label={copy.stats.monitoring}
          value={latestChange?.status === 'REVIEW' ? copy.stats.review : latestChange?.status === 'NO_CHANGE' ? copy.stats.stable : copy.stats.building}
          detail={latestChange ? copy.stats.lastChecked(formatDate(latestChange.detectedAt)) : copy.stats.moreSessions}
          icon={TrendingUp}
          tone="mint"
        />
        <StatCard
          label={copy.stats.unread}
          value={String(unread)}
          detail={unread ? copy.stats.fromCareTeam : copy.stats.upToDate}
          icon={FileText}
          tone="amber"
        />
      </div>      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionTitle
            title={copy.baseline.title}
            detail={copy.baseline.detail}
            action={
              <Link to="/patient/assessment/baseline" className="text-[13px] font-bold text-forest hover:underline">
                {copy.baseline.view}
              </Link>
            }
          />
          {isLoading ? (
            <LoadingState label={copy.baseline.loading} detail={copy.baseline.loadingDetail} rows={2} />
          ) : error && !baseline ? (
            <ErrorState
              title={copy.baseline.errorTitle}
              description={copy.baseline.errorBody}
              onRetry={refresh}
            />
          ) : baseline ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <ScoreDial value={baseline.overallScore} label={copy.baseline.dial} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="amber" dot>{copy.baseline.provisional}</Pill>
                  <span className="text-[13px] text-muted">{formatDate(baseline.establishedAt)}</span>
                </div>
                <dl className="mt-3 grid gap-x-5 gap-y-1 sm:grid-cols-2">
                  {[
                    [copy.baseline.metrics[0], baseline.cognitiveScore],
                    [copy.baseline.metrics[1], baseline.functionalScore],
                    [copy.baseline.metrics[2], baseline.eyeScore],
                    [copy.baseline.metrics[3], baseline.voiceScore],
                    [copy.baseline.metrics[4], baseline.faceScore],
                    [copy.baseline.metrics[5], baseline.contextScore]
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex items-center justify-between border-b border-line py-1.5 last:border-0">
                      <dt className="text-[13px] text-muted">{label}</dt>
                      <dd className="text-[13px] font-semibold text-ink">{value == null ? '—' : `${value}`}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 rounded-lg bg-amber/10 border border-amber/60 px-3 py-2 text-[13px] leading-5 text-amber-900">
                  {copy.baseline.provisionalNote}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              scene="emptyAssessment"
              icon={Brain}
              title={copy.baseline.emptyTitle}
              detail={copy.baseline.emptyDetail}
              action={
                <Link to="/patient/assessment/intro" className="text-[13px] font-bold text-forest">
                  {copy.baseline.start}
                </Link>
              }
            />
          )}
        </Card>

        <Card>
          <SectionTitle
            title={copy.recent.title}
            detail={copy.recent.detail}
            action={
              <Link to="/patient/history" className="text-[13px] font-bold text-forest hover:underline">
                {copy.recent.all}
              </Link>
            }
          />
          {recentAssessments.length ? (
            <ol className="relative space-y-3 border-s border-line ps-4">
              {recentAssessments.map((assessment) => (
                <li key={assessment.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-forest" />
                  <div className="rounded-xl border border-line bg-warm/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-ink">{formatDate(assessment.date)}</span>
                      <AssessmentStatusPill reviewStatus={assessment.reviewStatus} status={assessment.status} />
                    </div>
                    <p className="mt-1 text-[13px] text-muted">
                      {copy.recent.itemNote}{' '}
                      {assessment.reviewStatus === 'REVIEWED' ? copy.recent.reviewed : copy.recent.availableAfterReview}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState scene="emptyAssessment" icon={ClipboardList} title={copy.recent.emptyTitle} detail={copy.recent.emptyDetail} />
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
        <Card>
          <SectionTitle
            title={copy.context.title}
            detail={copy.context.detail}
            action={
              <Link to="/patient/context" className="text-[13px] font-bold text-forest hover:underline">
                {copy.context.review}
              </Link>
            }
          />
          <div className="space-y-2.5">
            {hasContext ? [
              { icon: Moon, label: copy.context.sleep, detail: copy.context.sleepValue(sleep.durationHours, sleep.quality), chip: 'mint' },
              { icon: Activity, label: copy.context.activity, detail: copy.context.activityValue(sleep.steps.toLocaleString(), sleep.activeMinutes), chip: 'forestSoft' },
              { icon: Users, label: copy.context.wellbeing, detail: copy.context.wellbeingValue(wellbeing.mood, wellbeing.stress), chip: 'amber' }
            ].map(({ icon: Icon, label, detail, chip }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${chip === 'mint' ? 'border-mint bg-mint' : chip === 'forestSoft' ? 'border-line bg-white' : 'border-amber/60 bg-amber/10'}`}>
                  <Icon className="h-4 w-4 text-forest" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink">{label}</p>
                  <p className="text-[13px] text-muted">{detail}</p>
                </div>
              </div>
            ))
            : (
              <p className="text-[13px] text-muted">{copy.context.empty}</p>
            )}
          </div>
          {context.length > 0 && (
            <p className="mt-2.5 text-[13px] text-muted">
              {copy.context.linked(context.length, formatDate(context[0].recordedAt))}
            </p>
          )}
        </Card>

        <Card>
          <SectionTitle title={copy.careTeam.title} detail={copy.careTeam.detail} />
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-bold text-forest shadow-xs">
              {careTeamInitials || '—'}
            </span>
            <div>
              <p className="text-[14px] font-semibold text-ink">{treatmentTeam.doctor || copy.careTeam.notAssigned}</p>
              {treatmentTeam.role && <p className="text-[13px] text-muted">{treatmentTeam.role}</p>}
              {(treatmentTeam.department || treatmentTeam.institution) && (
                <p className="mt-0.5 text-[13px] text-muted">
                  {[treatmentTeam.department, treatmentTeam.institution].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
          {treatmentTeam.nextReview && (
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-[13px]">
              <div className="flex justify-between gap-3"><dt className="text-muted">{copy.careTeam.nextReview}</dt><dd className="font-semibold text-ink">{treatmentTeam.nextReview}</dd></div>
            </dl>
          )}
          <Link to="/patient/appointments" className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-forest hover:underline">
            {copy.careTeam.viewAppointments} <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Card>

        <Card className="rounded-2xl border border-line bg-forest text-white shadow-[0_24px_70px_-48px_rgba(27,51,43,0.28),0_2px_8px_rgba(27,51,43,0.035)]">
          <Pill tone="mint">{copy.disclaimer.pill}</Pill>
          <h2 className="mt-3 text-[16px] font-semibold tracking-[-0.02em] text-white">{copy.disclaimer.title}</h2>
          <p className="mt-2 text-[13px] leading-5 text-white/80">{copy.disclaimer.body}</p>
          <Link
            to="/patient/help"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/20"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.disclaimer.link}
          </Link>
        </Card>
      </div>
      <BrainHealthPathway
        pathway={pathway}
        personalizedPrevention={personalizedPrevention}
        compact
      />
    </div>
  );
};

export default PatientDashboardPage;
