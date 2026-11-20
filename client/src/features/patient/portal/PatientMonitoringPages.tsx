import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Info,
  LineChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Waves
} from 'lucide-react';
import { usePatientPortalStore, treatmentTeam } from '../../../store/patientPortalStore';
import { usePatientOverview } from './usePatientOverview';
import { useLanguageStore } from '../../../services/language/LanguageManager';
import { getPortalPagesCopy } from '../../../services/language/portalPagesCopy';
import { ErrorState, LoadingState, MonitoringResultState } from '../../../components/systemStates';
import {
  AssessmentStatusPill,
  Card,
  EmptyState,
  InfoRow,
  Pill,
  PortalPageHeader,
  ScoreDial,
  SectionTitle,
  TrendLine,
  formatDate,
  primaryButton,
  secondaryButton
} from './ui';

type MonitoringCopy = ReturnType<typeof getPortalPagesCopy>['monitoring'];

const statusCopy = (status: string | undefined, copy: MonitoringCopy['status']) => {
  switch (status) {
    case 'NO_CHANGE':
      return { ...copy.stable, key: 'stable' as const, tone: 'forestSoft' as const };
    case 'REVIEW':
      return { ...copy.review, key: 'review' as const, tone: 'amber' as const };
    case 'INSUFFICIENT_DATA':
      return { ...copy.insufficient, key: 'insufficient' as const, tone: 'sage' as const };
    default:
      return { ...copy.monitoring, key: 'monitoring' as const, tone: 'mint' as const };
  }
};

const reasonLabel = (reason: string, copy: MonitoringCopy['reasons']) => {
  if (reason === 'OUTSIDE_RELIABLE_CHANGE') return copy.outsideChange;
  if (reason === 'FUNCTIONAL_CHANGE') return copy.functional;
  if (reason === 'CONTEXT_CHANGE') return copy.context;
  // Reasons that arrive as full sentences are shown as recorded.
  if (reason.includes(' ')) return reason;
  return reason.replace(/_/g, ' ').toLowerCase();
};

// ---------------------------------------------------------------------------
// Screen 30 — Brain Health Overview
// ---------------------------------------------------------------------------
export const BrainHealthOverviewPage: React.FC = () => {
  const { assessments, latestAssessment, baseline, changes, brainHealth } = usePatientOverview();
  const { carePlan } = usePatientPortalStore();
  const copy = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).monitoring.overview;
  const statusText = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).monitoring.status;
  const latestChange = changes[0];
  const status = statusCopy(latestChange?.status, statusText);

  const domainDeltas: Array<{ label: string; value: string; direction: 'up' | 'down' | 'flat' }> = [];
  if (baseline && latestAssessment) {
    const overall = latestAssessment.overallScore - baseline.overallScore;
    domainDeltas.push({
      label: copy.domainCognitive,
      value: `${overall >= 0 ? '+' : ''}${overall.toFixed(1)}`,
      direction: Math.abs(overall) < 0.5 ? 'flat' : overall > 0 ? 'up' : 'down'
    });
    if (latestAssessment.eyeMetrics && baseline.eyeScore != null) {
      domainDeltas.push({
        label: copy.domainOcular,
        value: `${latestAssessment.eyeMetrics.fixationScore - baseline.eyeScore >= 0 ? '+' : ''}${(latestAssessment.eyeMetrics.fixationScore - baseline.eyeScore).toFixed(1)}`,
        direction:
          Math.abs(latestAssessment.eyeMetrics.fixationScore - baseline.eyeScore) < 0.5
            ? 'flat'
            : latestAssessment.eyeMetrics.fixationScore > baseline.eyeScore
            ? 'up'
            : 'down'
      });
    }
    if (latestAssessment.voiceMetrics && baseline.voiceScore != null) {
      domainDeltas.push({
        label: copy.domainVocal,
        value: `${latestAssessment.voiceMetrics.pauseScore - baseline.voiceScore >= 0 ? '+' : ''}${(latestAssessment.voiceMetrics.pauseScore - baseline.voiceScore).toFixed(1)}`,
        direction:
          Math.abs(latestAssessment.voiceMetrics.pauseScore - baseline.voiceScore) < 0.5
            ? 'flat'
            : latestAssessment.voiceMetrics.pauseScore > baseline.voiceScore
            ? 'up'
            : 'down'
      });
    }
    if (latestAssessment.faceMetrics && baseline.faceScore != null) {
      domainDeltas.push({
        label: copy.domainFacial,
        value: `${latestAssessment.faceMetrics.symmetry - baseline.faceScore >= 0 ? '+' : ''}${(latestAssessment.faceMetrics.symmetry - baseline.faceScore).toFixed(1)}`,
        direction:
          Math.abs(latestAssessment.faceMetrics.symmetry - baseline.faceScore) < 0.5
            ? 'flat'
            : latestAssessment.faceMetrics.symmetry > baseline.faceScore
            ? 'up'
            : 'down'
      });
    }
  }

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <Link to="/patient/assessment/intro" className={primaryButton}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {copy.nextAssessment}
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="flex flex-col items-center justify-center text-center">
          <ScoreDial value={brainHealth?.profileScore ?? baseline?.overallScore ?? null} label={copy.dialLabel} tone="#2f5e4e" />
          <div className="mt-3">
            <Pill tone={status.tone} dot>{status.label}</Pill>
          </div>
          <p className="mt-2 max-w-[250px] text-[13px] leading-5 text-muted">
            {brainHealth?.interpretation || copy.fallbackInterpretation}
          </p>
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-sage-deep">
            {copy.prototypeNote}
          </p>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle title={copy.statusTitle} detail={latestChange ? copy.lastCheck(formatDate(latestChange.detectedAt)) : copy.notAssessed} />
            <div className={`rounded-xl border p-3 ${status.key === 'review' ? 'border-amber/60 bg-amber/10' : 'border-forest/40 bg-mint/50'}`}>
              <p className="text-[14px] font-semibold text-ink">{status.detail}</p>
              <p className="mt-1 text-[13px] leading-5 text-muted">
                {copy.reviewNotDiagnosis}
              </p>
            </div>
            <dl className="mt-3">
              <InfoRow label={copy.latestValid} value={latestAssessment ? formatDate(latestAssessment.date) : copy.none} />
              <InfoRow label={copy.validSessions} value={String(assessments.length)} />
              <InfoRow label={copy.baselineLabel} value={baseline ? copy.baselineActive : copy.baselineMissing} />
              <InfoRow label={copy.nextScheduled} value={formatDate(carePlan.nextReview)} />
            </dl>
          </Card>

          <Card>
            <SectionTitle title={copy.domainTitle} detail={copy.domainDetail} />
            {domainDeltas.length ? (
              <div className="grid grid-cols-2 gap-2.5">
                {domainDeltas.map((item) => (
                  <div key={item.label} className="rounded-xl border border-line bg-warm/70 p-3">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-sage-deep">{item.label}</p>
                    <p className={`mt-1 text-[17px] font-semibold ${
                      item.direction === 'up' ? 'text-forest' : item.direction === 'down' ? 'text-amber-900' : 'text-muted'
                    }`}>
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-[12px] text-sage-dark">{copy.pointsFromBaseline}</p>
                  </div>
                ))}
              </div>
            ) : (
              <MonitoringResultState
                compact
                finding={
                  !baseline
                    ? 'NO_BASELINE'
                    : latestChange?.status === 'INSUFFICIENT_DATA'
                    ? 'INSUFFICIENT_DATA'
                    : 'NO_SIGNIFICANT_CHANGE'
                }
                actions={
                  <Link to="/patient/assessment/intro" className={primaryButton}>
                    {baseline ? copy.completeAnother : copy.completeFirst}
                  </Link>
                }
              />
            )}
            <p className="mt-3 text-[13px] leading-5 text-muted">
              {copy.higherNote}
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle title={copy.observationsTitle} />
          <dl>
            <InfoRow label={copy.ocular} value={latestAssessment?.eyeMetrics ? copy.fixation(Math.round(latestAssessment.eyeMetrics.fixationScore)) : copy.notAvailable} />
            <InfoRow label={copy.vocal} value={latestAssessment?.voiceMetrics ? copy.wpm(Math.round(latestAssessment.voiceMetrics.speechRate)) : copy.notAvailable} />
            <InfoRow label={copy.facial} value={latestAssessment?.faceMetrics ? copy.symmetry(Math.round(latestAssessment.faceMetrics.symmetry)) : copy.notAvailable} />
            <InfoRow label={copy.functional} value={latestAssessment?.taskResponses?.task5?.trailBCompletionSec ? copy.trail(latestAssessment.taskResponses.task5.trailBCompletionSec) : copy.notAvailable} />
          </dl>
        </Card>

        <Card>
          <SectionTitle title={copy.nextTitle} detail={copy.nextDetail} />
          <div className="flex items-start gap-2.5 rounded-xl border border-mint bg-mint/50 p-3">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
            <div>
              <p className="text-[14px] font-semibold text-ink">{copy.nextAssessment}</p>
              <p className="mt-0.5 text-[13px] leading-5 text-forest/80">
                {copy.aimFor(carePlan.nextReview ? formatDate(carePlan.nextReview) : copy.notScheduled)}
              </p>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-[13px] leading-5 text-muted">
            {carePlan.steps.slice(0, 2).map((step) => (
              <li key={step.id} className="flex gap-2">
                <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${step.done ? 'text-forest' : 'text-sage-dark'}`} aria-hidden="true" />
                {step.title}
              </li>
            ))}
          </ul>
          <Link to="/patient/care-plan" className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-forest hover:underline">
            {copy.openPlan} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Card>

        <Card>
          <SectionTitle title={copy.clinicianTitle} />
          <p className="text-[14px] font-semibold text-ink">{treatmentTeam.doctor}</p>
          <p className="mt-0.5 text-[13px] text-muted">{treatmentTeam.role}</p>
          <p className="mt-2 text-[13px] leading-5 text-muted">
            {brainHealth?.reviewedAt
              ? copy.reviewedAt(formatDate(brainHealth.reviewedAt), brainHealth.reviewedBy || treatmentTeam.doctor)
              : copy.notReviewed}
          </p>
          <Link to="/patient/appointments" className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-forest hover:underline">
            {copy.viewFollowUp} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Card>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 31 — Assessment History
// ---------------------------------------------------------------------------
export const AssessmentHistoryPage: React.FC = () => {
  const { assessments, baseline, isLoading, error, refresh } = usePatientOverview();
  const copy = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).monitoring.history;

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<Link to="/patient/assessment/intro" className={primaryButton}>{copy.newAssessment}</Link>}
      />

      {isLoading ? (
        <LoadingState label={copy.loadingLabel} detail={copy.loadingDetail} />
      ) : error && assessments.length === 0 ? (
        <ErrorState
          title={copy.errorTitle}
          description={copy.errorDetail}
          onRetry={refresh}
        />
      ) : assessments.length === 0 ? (
        <EmptyState
          scene="emptyAssessment"
          icon={ClipboardList}
          title={copy.emptyTitle}
          detail={copy.emptyDetail}
          action={<Link to="/patient/assessment/intro" className={primaryButton}>{copy.startFirst}</Link>}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="pp-card p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-sage-deep">{copy.sessions}</p>
              <p className="mt-1 text-[22px] font-semibold text-ink">{assessments.length}</p>
            </div>
            <div className="pp-card p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-sage-deep">{copy.reviewed}</p>
              <p className="mt-1 text-[22px] font-semibold text-ink">
                {assessments.filter((item) => item.reviewStatus === 'REVIEWED').length}
              </p>
            </div>
            <div className="pp-card p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-sage-deep">{copy.awaitingReview}</p>
              <p className="mt-1 text-[22px] font-semibold text-ink">
                {assessments.filter((item) => item.reviewStatus === 'PENDING_REVIEW').length}
              </p>
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto] gap-3 border-b border-line bg-warm/70 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-sage-deep md:grid">
              <span>{copy.colSession}</span><span>{copy.colDate}</span><span>{copy.colStatus}</span><span>{copy.colChange}</span><span>{copy.colReport}</span>
            </div>
            <ul className="divide-y divide-line">
              {assessments.map((assessment) => {
                // The patient projection exposes the sanitised cognitive summary, not the raw mode field.
                const isCognitive = Boolean(assessment.taskResponses?.cognitiveSummary);
                const change = baseline ? assessment.overallScore - baseline.overallScore : null;
                return (
                  <li key={assessment.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto] md:items-center md:gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-ink">{isCognitive ? copy.cognitiveAssessment : copy.fivePart}</p>
                      <p className="mt-0.5 truncate text-[13px] text-muted">
                        {isCognitive
                          ? `${assessment.taskResponses?.cognitiveSummary?.mode === 'STANDARDIZED' ? copy.standardized : copy.exploratory} · ${copy.activities(assessment.taskResponses?.cognitiveSummary?.completedCount ?? 0)}`
                          : assessment.id}
                      </p>
                    </div>
                    <p className="text-[13px] text-muted">{formatDate(assessment.date)}</p>
                    <div><AssessmentStatusPill reviewStatus={assessment.reviewStatus} status={assessment.status} /></div>
                    <p className="text-[13px] text-muted">
                      {isCognitive ? copy.notCompared : change == null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(1)} pts`}
                    </p>
                    <Link to={isCognitive ? `/patient/cognitive/history/${assessment.id}` : `/patient/assessment/report?id=${assessment.id}`} className="inline-flex items-center gap-1 text-[13px] font-bold text-forest hover:underline">
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      {copy.view}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Link to="/patient/trends" className={secondaryButton}><TrendingUp className="h-4 w-4" aria-hidden="true" /> {copy.trendsLink}</Link>
            <Link to="/patient/documents" className={secondaryButton}><FileText className="h-4 w-4" aria-hidden="true" /> {copy.reportsLink}</Link>
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 32 — Longitudinal Trends
// ---------------------------------------------------------------------------
export const LongitudinalTrendsPage: React.FC = () => {
  const { assessments, baseline, longitudinal } = usePatientOverview();
  const copy = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).monitoring.trends;

  const ordered = [...assessments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Cognitive sessions use a separate composite and mode; they are never merged
  // into the legacy five-part screening trend line.
  const valid = ordered.filter(
    (item) => !item.taskResponses?.cognitiveSummary && item.taskResponses?.quality?.comparable !== false
  );
  const canShowTrend = valid.length >= 3;

  const labelFor = (index: number) => formatDate(valid[index].date, { day: 'numeric', month: 'short' });

  const cognitive = valid.map((item, index) => ({ label: labelFor(index), value: Number(item.overallScore.toFixed(1)) }));
  const ocular = valid
    .filter((item) => item.eyeMetrics)
    .map((item) => ({ label: formatDate(item.date, { day: 'numeric', month: 'short' }), value: item.eyeMetrics!.fixationScore }));
  const vocal = valid
    .filter((item) => item.voiceMetrics)
    .map((item) => ({ label: formatDate(item.date, { day: 'numeric', month: 'short' }), value: item.voiceMetrics!.pauseScore }));
  const functional = valid
    .filter((item) => item.taskResponses?.task5?.trailBCompletionSec != null)
    .map((item) => ({
      label: formatDate(item.date, { day: 'numeric', month: 'short' }),
      value: item.taskResponses!.task5.trailBCompletionSec
    }));

  const trendDirection = longitudinal[longitudinal.length - 1]?.trendDirection;

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<Pill tone={canShowTrend ? 'forestSoft' : 'amber'} dot>{canShowTrend ? copy.comparableSessions(valid.length) : copy.moreData}</Pill>}
      />

      {!canShowTrend ? (
        <EmptyState
          scene="emptyAssessment"
          icon={LineChart}
          title={copy.emptyTitle}
          detail={copy.emptyDetail}
          action={<Link to="/patient/assessment/intro" className={primaryButton}>{copy.completeScreening}</Link>}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="pp-card p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-sage-deep">{copy.plotted}</p>
              <p className="mt-1 text-[22px] font-semibold text-ink">{valid.length}</p>
            </div>
            <div className="pp-card p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-sage-deep">{copy.direction}</p>
              <p className="mt-1 text-[16px] font-semibold capitalize text-ink">{trendDirection?.toLowerCase() || copy.building}</p>
            </div>
            <div className="pp-card p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-sage-deep">{copy.baseline}</p>
              <p className="mt-1 text-[16px] font-semibold text-ink">{baseline ? `${Math.round(baseline.overallScore)}` : copy.notEstablished}</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <SectionTitle title={copy.cognitiveTitle} detail={copy.cognitiveDetail} action={<Pill tone="mint">{copy.composite}</Pill>} />
              <TrendLine points={cognitive} min={Math.min(...cognitive.map((p) => p.value), baseline?.overallScore ?? 100) - 3} max={Math.max(...cognitive.map((p) => p.value), baseline?.overallScore ?? 0) + 3} tone="#2f5e4e" />
              <p className="mt-2 text-[13px] leading-5 text-muted">
                {baseline ? copy.baselineNote(Math.round(baseline.overallScore)) : copy.noBaseline}
              </p>
            </Card>
            <Card>
              <SectionTitle title={copy.ocularTitle} detail={copy.ocularDetail} action={<Eye className="h-4 w-4 text-slate-400" />} />
              <TrendLine points={ocular} tone="#0D9488" />
              <p className="mt-2 text-[13px] leading-5 text-muted">{copy.ocularNote}</p>
            </Card>
            <Card>
              <SectionTitle title={copy.vocalTitle} detail={copy.vocalDetail} action={<Waves className="h-4 w-4 text-slate-400" />} />
              <TrendLine points={vocal} tone="#7FA692" />
              <p className="mt-2 text-[13px] leading-5 text-muted">{copy.vocalNote}</p>
            </Card>
            <Card>
              <SectionTitle title={copy.functionalTitle} detail={copy.functionalDetail} action={<Activity className="h-4 w-4 text-slate-400" />} />
              <TrendLine points={functional} tone="#D97706" valueSuffix=" s" />
              <p className="mt-2 text-[13px] leading-5 text-muted">{copy.functionalNote}</p>
            </Card>
          </div>

          <Card>
            <SectionTitle title={copy.qualityTitle} detail={copy.qualityDetail} />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [copy.comparable, `${valid.length}`],
                [copy.withheld, `${ordered.length - valid.length}`],
                [copy.qualityChecked, copy.yes],
                [copy.clinicalThresholds, copy.notApplied]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-line bg-warm/70 p-3">
                  <p className="text-[13px] text-muted">{label}</p>
                  <p className="mt-1 text-[14px] font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 flex gap-1.5 text-[13px] leading-5 text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {copy.chartsNote}
            </p>
          </Card>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 33 — Change Detection Details
// ---------------------------------------------------------------------------
export const ChangeDetectionPage: React.FC = () => {
  const { changes, brainHealth } = usePatientOverview();
  const copy = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).monitoring.change;
  const statusText = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).monitoring.status;
  const reasonCopy = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).monitoring.reasons;
  const common = getPortalPagesCopy(useLanguageStore((state) => state.currentLanguage)).common;
  const latest = changes[0];
  const status = statusCopy(latest?.status, statusText);
  const previous = changes[1];
  // Recorded next steps can be plain text or { action, timeline } objects.
  const firstStep = (brainHealth?.nextSteps || [])[0] as unknown;
  const suggestedStep = !firstStep
    ? copy.suggestedFallback
    : typeof firstStep === 'string'
    ? firstStep
    : [(firstStep as any).action, (firstStep as any).timeline].filter(Boolean).join(' · ') ||
      copy.suggestedFallback;

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<Pill tone={status.tone} dot>{status.label}</Pill>}
      />

      {!latest ? (
        <EmptyState
          scene="emptyAssessment"
          icon={Activity}
          title={copy.emptyTitle}
          detail={copy.emptyDetail}
        />
      ) : (
        <>
          <div className={`rounded-2xl border p-4 ${status.key === 'review' ? 'border-amber/60 bg-amber/10' : 'border-forest/40 bg-mint/50'}`}>
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${status.key === 'review' ? 'bg-amber-100 text-amber-700 shadow-xs' : 'bg-forest text-white shadow-xs'}`}>
                {status.key === 'review' ? <AlertTriangle className="h-5 w-5" aria-hidden="true" /> : <ShieldCheck className="h-5 w-5" aria-hidden="true" />}
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-ink">{status.label}: {status.detail}</h2>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  {copy.detected(formatDate(latest.detectedAt))}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
            <Card>
              <SectionTitle title={copy.whatChangedTitle} detail={copy.whatChangedDetail} />
              <dl>
                <InfoRow label={copy.cognitiveChange} value={latest.cognitiveChange == null ? copy.none : copy.points(latest.cognitiveChange.toFixed(1))} />
                <InfoRow label={copy.outsideRange} value={latest.outsideBaseline ? common.yes : common.no} />
                <InfoRow label={copy.firstDetected} value={formatDate(latest.detectedAt)} />
                <InfoRow label={copy.persisted} value={previous && previous.status === latest.status ? copy.persistedValue : copy.notEstablishedValue} />
                <InfoRow label={copy.contributedDomains} value={(latest.reviewReasons || []).length ? copy.reasonsCount((latest.reviewReasons || []).length) : copy.none} />
              </dl>
              {latest.reviewReasons?.length ? (
                <ul className="mt-3 space-y-2">
                  {latest.reviewReasons.map((reason) => (
                    <li key={reason} className="flex gap-2 rounded-lg bg-warm/70 px-3 py-2 text-[13px] leading-5 text-muted">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" aria-hidden="true" />
                      {reasonLabel(reason, reasonCopy)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>

            <div className="space-y-4">
              <Card>
                <SectionTitle title={copy.uncertaintyTitle} />
                <ul className="space-y-2 text-[13px] leading-5 text-muted">
                  {copy.limitations.map((item) => (
                    <li key={item} className="flex gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />{item}</li>
                  ))}
                </ul>
              </Card>
              <Card>
                <SectionTitle title={copy.suggestedTitle} />
                <p className="text-[13px] leading-5 text-muted">
                  {suggestedStep}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to="/patient/care-plan" className={primaryButton}>{copy.openPlan}</Link>
                  <Link to="/patient/appointments" className={secondaryButton}>{copy.talkToClinician}</Link>
                </div>
              </Card>
            </div>
          </div>

          <Card>
            <SectionTitle title={copy.timelineTitle} detail={copy.timelineDetail} />
            <ol className="space-y-2.5">
              {changes.map((change) => {
                const row = statusCopy(change.status, statusText);
                return (
                  <li key={change.id} className="flex flex-col gap-2 rounded-xl border border-line bg-warm/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${change.status === 'REVIEW' ? 'bg-amber-100 text-amber-700 shadow-xs' : 'bg-forest text-white shadow-xs'}`}>
                        {change.status === 'REVIEW' ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{row.label}</p>
                        <p className="text-[13px] text-muted">{formatDate(change.detectedAt)}</p>
                      </div>
                    </div>
                    <span className="text-[13px] text-muted">
                      {change.cognitiveChange == null ? copy.noNumericChange : `${change.cognitiveChange >= 0 ? '+' : ''}${copy.points(change.cognitiveChange.toFixed(1))}`}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
};
