import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  HeartPulse,
  Info,
  LineChart,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { getPortalPagesCopy } from '../../../services/language/portalPagesCopy';
import { getPathwayCopy } from '../../../services/language/pathwayCopy';
import { getPortalTranslation } from '../../../services/language/portalTranslations';
import { treatmentTeam, usePatientPortalStore } from '../../../store/patientPortalStore';
import { usePatientOverview } from './usePatientOverview';
import { BrainHealthPathway, derivePathwayFromOverview } from '../../../components/BrainHealthPathway';
import { HealthcareScene } from '../../../components/illustrations/HealthcareScene';
import { MotionReveal } from '../../../components/motion/Reveal';
import {
  Card,
  EmptyState,
  InfoRow,
  Pill,
  PortalPageHeader,
  ScoreDial,
  SectionTitle,
  formatDate,
  primaryButton,
  secondaryButton
} from './ui';

const labelClass = 'mb-1 block text-[12px] font-bold uppercase tracking-[0.08em] text-sage-deep';

type PortalCopy = ReturnType<typeof getPortalPagesCopy>;

const responseLabel = (value: any, copy: PortalCopy['common']) => {
  if (value == null || value === '') return copy.notRecorded;
  if (typeof value === 'boolean') return value ? copy.yes : copy.no;
  if (typeof value === 'string') return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
  if (typeof value === 'number') return String(value);
  return copy.recorded;
};

export const PatientHealthProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const store = usePatientPortalStore() as any;
  const { health = {}, sleep = {}, wellbeing = {} } = store;
  const contextLog = store.contextLog || store.contextEntries || [];
  const { context } = usePatientOverview();
  const copy = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).healthProfile;
  const common = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).common;
  const fieldLabels = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).fieldLabels;
  const fieldLabel = (key: string) =>
    fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
  const hasContext = (Array.isArray(contextLog) && contextLog.length > 0) || Object.values(sleep || {}).some(Boolean) || Object.values(wellbeing || {}).some(Boolean) || Boolean(health?.conditions || health?.medications || health?.familyHistory);

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<Link to="/patient/context/clinical" className={secondaryButton}><Stethoscope className="h-4 w-4" /> {copy.editHistory}</Link>}
      />

      <MotionReveal><HealthcareScene kind="profile" className="w-full max-w-3xl" /></MotionReveal>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title={copy.profileTitle} detail={copy.profileDetail} />
          <dl>
            <InfoRow label={copy.name} value={user?.name || common.notRecorded} />
            <InfoRow label={copy.patientId} value={user?.patientId || common.notRecorded} />
            <InfoRow label={copy.clinician} value={treatmentTeam.doctor} />
            <InfoRow label={copy.careTeamRole} value={treatmentTeam.role} />
            <InfoRow label={copy.caregiver} value={health?.caregiverName || health?.caregiver || health?.supportContact || common.notRecorded} />
          </dl>
          <p className="mt-3 text-[13px] leading-5 text-muted">{copy.caregiverNote}</p>
        </Card>

        <Card>
          <SectionTitle title={copy.physicalTitle} />
          <dl>
            <InfoRow label={copy.conditions} value={health?.conditions || common.notRecorded} />
            <InfoRow label={copy.medications} value={health?.medications || common.notRecorded} />
            <InfoRow label={copy.familyHistory} value={health?.familyHistory || common.notRecorded} />
            <InfoRow label={copy.previousAssessments} value={health?.previousAssessments || common.notRecorded} />
            <InfoRow label={copy.contextEntries} value={String(context?.entries?.length ?? contextLog.length ?? 0)} />
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/patient/context/clinical" className={secondaryButton}>{copy.clinicalLink}</Link>
            <Link to="/patient/profile" className={secondaryButton}>{copy.profileLink}</Link>
          </div>
        </Card>

        <Card>
          <SectionTitle title={copy.sleepTitle} />
          <dl>
            {Object.keys(sleep || {}).length ? Object.entries(sleep).slice(0, 8).map(([k, v]) => (
              <InfoRow key={k} label={fieldLabel(k)} value={v == null || v === '' ? common.notRecorded : String(v)} />
            )) : <InfoRow label={common.status} value={common.notRecorded} />}
          </dl>
          <Link to="/patient/context/sleep" className={`${secondaryButton} mt-3`}>{copy.sleepLink}</Link>
        </Card>

        <Card>
          <SectionTitle title={copy.wellbeingTitle} />
          <dl>
            {Object.keys(wellbeing || {}).length ? Object.entries(wellbeing).slice(0, 8).map(([k, v]) => (
              <InfoRow key={k} label={fieldLabel(k)} value={v == null || v === '' ? common.notRecorded : String(v)} />
            )) : <InfoRow label={common.status} value={common.notRecorded} />}
          </dl>
          <Link to="/patient/context/wellbeing" className={`${secondaryButton} mt-3`}>{copy.wellbeingLink}</Link>
        </Card>
      </div>

      {!hasContext && (
        <div className="rounded-xl border border-amber/60 bg-amber\/10 p-3.5 text-[13px] leading-5 text-amber-900 flex gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{copy.limitedContext}</span>
        </div>
      )}
    </div>
  );
};

export const DailyFunctionQuestionnairePage: React.FC = () => {
  const { assessments, latestAssessment } = usePatientOverview();
  const copy = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).dailyFunction;
  const common = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).common;
  const activityLabels = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).activities;
  const latestFunctional = (latestAssessment?.taskResponses as any)?.functionalCheckIn || (latestAssessment?.taskResponses as any)?.functionalAssessment || (latestAssessment?.taskResponses as any)?.dailyFunction;

  const entries = latestFunctional?.activities && typeof latestFunctional.activities === 'object'
    ? Object.entries(latestFunctional.activities)
    : latestFunctional && typeof latestFunctional === 'object' && !Array.isArray(latestFunctional)
      ? Object.entries(latestFunctional).filter(([k]) => !['completedAt', 'skipped', 'note'].includes(k))
      : [];

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<Link to="/patient/assessment/intro" className={primaryButton}><Sparkles className="h-4 w-4" /> {copy.completeInAssessment}</Link>}
      />

      <MotionReveal><HealthcareScene kind="functional" className="w-full max-w-3xl" /></MotionReveal>
      <div className="rounded-xl border border-forest/40 bg-mint/50 p-3.5 text-[13px] leading-5 text-forest/90 flex gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>{copy.disclaimer}</span>
      </div>

      <Card>
        <SectionTitle title={copy.latestTitle} detail={latestAssessment ? copy.fromAssessment(formatDate(latestAssessment.date)) : copy.noAssessment} />
        {latestFunctional?.skipped ? (
          <p className="text-[14px] text-muted">{copy.skipped}</p>
        ) : entries.length ? (
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-start justify-between border-b border-line py-2 gap-3">
                <dt className="text-[14px] text-muted">{activityLabels[key] || key.replace(/_/g, ' ')}</dt>
                <dd className="text-[14px] font-semibold text-ink text-right">{responseLabel(value, common)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState
            scene="emptyAssessment"
            icon={ClipboardList}
            title={copy.emptyTitle}
            detail={copy.emptyDetail}
            action={<Link to="/patient/assessment/intro" className={primaryButton}>{copy.start}</Link>}
          />
        )}
      </Card>

      <Card>
        <SectionTitle title={copy.sessionsTitle} detail={copy.sessionsDetail(assessments.length)} />
        {assessments.length ? (
          <ul className="divide-y divide-line">
            {assessments.slice(0, 8).map((a: any) => {
              const fc = a?.taskResponses?.functionalCheckIn || a?.taskResponses?.functionalAssessment || a?.taskResponses?.dailyFunction;
              const has = fc && !fc.skipped && typeof fc === 'object';
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{formatDate(a.date)}</p>
                    <p className="text-[13px] text-muted">{has ? copy.recordedResponses : copy.notRecordedSession}</p>
                  </div>
                  <Pill tone={has ? 'forestSoft' : 'sage'}>{has ? common.recorded : common.notRecorded}</Pill>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">{copy.noHistory}</p>
        )}
      </Card>
    </div>
  );
};

export const BrainHealthTimelinePage: React.FC = () => {
  const { assessments, baseline, changes, brainHealth } = usePatientOverview();
  const copy = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).timeline;
  const statusText = getPortalTranslation(useLanguageStore((state) => state.currentLanguage)).shell.status;
  const monitoringStatus = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).monitoring.status;
  const reviewLabel = (status?: string) =>
    status === 'REVIEWED'
      ? statusText.reviewed
      : status === 'FOLLOWUP_REQUIRED'
      ? statusText.followUpSuggested
      : statusText.awaitingReview;
  const pathway = derivePathwayFromOverview(
    { baseline, changes, brainHealth, assessments } as any,
    getPathwayCopy(useLanguageStore((state) => state.currentLanguage))
  );

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <div className="flex gap-2">
            <Link to="/patient/history" className={secondaryButton}><ClipboardList className="h-4 w-4" /> {copy.history}</Link>
            <Link to="/patient/trends" className={secondaryButton}><LineChart className="h-4 w-4" /> {copy.trends}</Link>
          </div>
        }
      />

      <MotionReveal><HealthcareScene kind="timeline" className="w-full max-w-3xl" /></MotionReveal>
      <Card>
        <SectionTitle title={copy.pathwayTitle} detail={copy.pathwayDetail} />
        <BrainHealthPathway pathway={pathway} personalizedPrevention={null} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <SectionTitle title={copy.assessmentsTitle} detail={copy.assessmentsDetail} />
          {assessments.length ? (
            <ol className="relative border-s border-line/80 ms-2 space-y-4 ps-4">
              {assessments.slice(0, 12).map((a: any, idx: number) => (
                <li key={a.id} className="relative">
                  <span className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${idx === 0 ? 'bg-forest' : 'bg-line-strong'}`} />
                  <p className="text-[14px] font-semibold text-ink">{formatDate(a.date)} <span className="font-normal text-muted">· {a.assessmentType || copy.screening}</span></p>
                  <p className="text-[13px] text-muted">{copy.overall}: {a.overallScore != null ? `${Math.round(a.overallScore)} / 100` : '—'} · {a.reviewStatus ? reviewLabel(a.reviewStatus) : copy.statusNotRecorded}</p>
                  {baseline && idx === assessments.length - 1 && <p className="text-[13px] text-forest mt-0.5">{copy.baselineAvailable}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState scene="emptyAssessment" icon={Activity} title={copy.emptyTitle} detail={copy.emptyDetail} action={<Link to="/patient/assessment/intro" className={primaryButton}>{copy.start}</Link>} />
          )}
        </Card>

        <Card>
          <SectionTitle title={copy.changesTitle} detail={copy.changesDetail} />
          {changes.length ? (
            <ul className="space-y-2">
              {changes.slice(0, 8).map((c: any, i: number) => (
                <li key={c.id || i} className="rounded-xl border border-line bg-warm/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold text-ink">{formatDate(c.detectedAt || c.createdAt || c.date)}</p>
                    <Pill tone={c.status === 'REVIEW' ? 'amber' : c.status === 'NO_CHANGE' ? 'forestSoft' : 'sage'}>
                      {c.status === 'REVIEW'
                        ? monitoringStatus.review.label
                        : c.status === 'NO_CHANGE'
                        ? monitoringStatus.stable.label
                        : monitoringStatus.monitoring.label}
                    </Pill>
                  </div>
                  <p className="mt-1 text-[13px] leading-5 text-muted">
                    {Array.isArray(c.reasons) && c.reasons.length ? c.reasons.map((r: string) => r.replace(/_/g, ' ').toLowerCase()).join(', ') : (c.summary || copy.noReason)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-5 text-muted">{copy.noChanges}</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export const PersonalizedPreventionPlanPage: React.FC = () => {
  const { baseline, changes, brainHealth, assessments, context } = usePatientOverview();
  const { carePlan } = usePatientPortalStore();
  const copy = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).prevention;
  const pathway = derivePathwayFromOverview(
    { baseline, changes, brainHealth, assessments, context } as any,
    getPathwayCopy(useLanguageStore((state) => state.currentLanguage))
  );

  const nextSteps = (brainHealth?.nextSteps || []) as any[];
  const prevention = nextSteps.filter((s) => s?.stage === 4 || s?.type === 'PERSONALIZED_PREVENTION' || s?.type === 'REVIEW_CONTEXT' || s?.type === 'LIFESTYLE_SUPPORT');
  const general = nextSteps.filter((s) => !prevention.includes(s));

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<Link to="/patient/care-plan" className={secondaryButton}><ShieldCheck className="h-4 w-4" /> {copy.carePlanLink}</Link>}
      />

      <MotionReveal><HealthcareScene kind="prevention" className="w-full max-w-3xl" /></MotionReveal>
      <div className="rounded-xl border border-amber/60 bg-amber\/10 p-3.5 text-[13px] leading-5 text-amber-900 flex gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>{copy.disclaimer}</span>
      </div>

      <Card>
        <SectionTitle title={copy.signalsTitle} detail={copy.signalsDetail} />
        <BrainHealthPathway pathway={pathway} personalizedPrevention={prevention.length ? { note: copy.signalsNote } : null} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title={copy.stepsTitle} />
          {prevention.length || general.length ? (
            <ul className="space-y-2">
              {[...prevention, ...general].map((step: any, i: number) => (
                <li key={step.id || i} className="flex gap-2 rounded-xl border border-line bg-warm/70 p-3">
                  <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${step.done ? 'text-forest' : 'text-muted'}`} aria-hidden="true" />
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{step.action || step.title || step.type || copy.stepFallback}</p>
                    <p className="text-[13px] text-muted mt-0.5">{step.reason || step.detail || copy.stepDetailFallback}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-5 text-muted">{copy.noSteps}</p>
          )}
        </Card>

        <Card>
          <SectionTitle title={copy.planTitle} detail={copy.planDetail} />
          <dl className="mb-3">
            <InfoRow label={copy.nextReview} value={carePlan?.nextReview ? formatDate(carePlan.nextReview) : copy.notScheduled} />
            <InfoRow label={copy.planItems} value={String(carePlan?.steps?.length ?? 0)} />
          </dl>
          {carePlan?.steps?.length ? (
            <ul className="space-y-2 mb-3">
              {carePlan.steps.slice(0, 4).map((s: any) => (
                <li key={s.id} className="flex gap-2 text-[13px] text-muted"><CheckCircle2 className={`h-4 w-4 shrink-0 ${s.done ? 'text-forest' : 'text-muted'}`} aria-hidden="true" />{s.title}</li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link to="/patient/care-plan" className={secondaryButton}>{copy.openPlan}</Link>
            <Link to="/patient/appointments" className={secondaryButton}><CalendarClock className="h-4 w-4" /> {copy.appointments}</Link>
          </div>
        </Card>
      </div>

      <p className="text-[13px] text-muted">{copy.sources}</p>
    </div>
  );
};
