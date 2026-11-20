import React, { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Eye,
  FileText,
  Info,
  Mic,
  Printer,
  Smile,
  TrendingUp
} from 'lucide-react';
import { HealthcareScene } from '../../../components/illustrations/HealthcareScene';
import { MotionReveal } from '../../../components/motion/Reveal';
import type { DoctorAssessment } from './useDoctorPatient';
import {
  domainObservations,
  getQuality,
  qualityLabel,
  taskStatus,
  useDoctorPatient
} from './useDoctorPatient';
import {
  Card,
  DoctorPageHeader,
  EmptyState,
  MetricTile,
  Notice,
  PatientWorkflowNav,
  Pill,
  ScoreDial,
  TrendLine,
  formatDate,
  formatScore,
  iconForDomain,
  primaryButton,
  secondaryButton
} from './ui';

const sortedAssessments = (assessments: DoctorAssessment[]) =>
  [...assessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const OverviewLink: React.FC<{ patientId: string }> = ({ patientId }) => (
  <Link to={`/doctor/patients/${patientId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
    <ArrowLeft className="h-3.5 w-3.5" /> Patient overview
  </Link>
);

// ---------------------------------------------------------------------------
// Screen 53 — Assessment Review
// ---------------------------------------------------------------------------
export const DoctorAssessmentReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { patient, assessments, changeSummary, isLoading } = useDoctorPatient(id);
  const ordered = useMemo(() => sortedAssessments(assessments), [assessments]);
  const requested = searchParams.get('assessment');
  const initialIndex = Math.max(0, ordered.findIndex((assessment) => assessment.id === requested));
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const assessment = ordered[selectedIndex] || ordered[0];
  const previous = ordered[selectedIndex + 1];
  const quality = getQuality(assessment);
  const tasks = taskStatus(assessment);
  const missingTasks = tasks.filter((task) => !task.complete);
  const observations = domainObservations(assessment);

  const warnings: string[] = [];
  if (!assessment) warnings.push('No completed assessment is available.');
  if (assessment && quality.comparable === false) warnings.push('Session marked as limited comparability. Avoid trend interpretation.');
  if (quality.audio === 'POOR') warnings.push('Audio quality was poor; vocal measures may be unreliable.');
  if (quality.video === 'POOR') warnings.push('Video quality was poor; ocular or facial measures may be unreliable.');
  if (quality.completion === 'PARTIAL') warnings.push('Session was only partially completed.');
  if (missingTasks.length > 0) warnings.push(`${missingTasks.length} of 5 task${missingTasks.length === 1 ? '' : 's'} did not record usable data.`);
  if (quality.comprehension === 'UNCERTAIN') warnings.push('Task comprehension was recorded as uncertain.');
  if (typeof quality.interruptions === 'number' && quality.interruptions > 0) warnings.push(`${quality.interruptions} interruption${quality.interruptions === 1 ? '' : 's'} occurred during the session.`);

  const scoreDelta = assessment && previous
    && typeof assessment.overallScore === 'number'
    && typeof previous.overallScore === 'number'
    ? Math.round(assessment.overallScore) - Math.round(previous.overallScore)
    : null;

  if (isLoading) return <div className="p-12 text-center text-[14px] text-muted">Loading assessment…</div>;
  if (!patient) return <div className="p-12 text-center text-[14px] text-muted">Patient not found.</div>;

  return (
    <div className="space-y-5">
      <OverviewLink patientId={patient.patientId} />
      <DoctorPageHeader
        screen="Screen 53 · Assessment review"
        title={assessment ? `Screening review · ${formatDate(assessment.date)}` : 'Assessment review'}
        description={`Review the observed domains, task completion, and session quality for ${patient.name} before recording a clinical decision.`}
        actions={
          assessment ? (
            <>
              <Link to={`/doctor/reports/${assessment.id}`} className={secondaryButton}>
                <FileText className="h-4 w-4" /> Clinical report
              </Link>
              <Link to={`/doctor/patients/${patient.patientId}/notes?assessment=${assessment.id}`} className={primaryButton}>
                <ClipboardCheck className="h-4 w-4" /> Record findings
              </Link>
            </>
          ) : undefined
        }
      />
      <PatientWorkflowNav patientId={patient.patientId} />

      <MotionReveal className="mx-auto w-full max-w-2xl">
        <HealthcareScene
          kind="clinicalReview"
          className="w-full"
          title="Dr. Mohamed reviewing a screening report"
        />
      </MotionReveal>

      {!assessment ? (
        <EmptyState
          scene="emptyAssessment"
          icon={Activity}
          title="No completed assessment"
          detail="This patient has not completed a screening session. Start a session before clinical review."
          action={<Link to={`/doctor/patients/${patient.patientId}/screen`} className={primaryButton}>Start screening</Link>}
        />
      ) : (
        <>
          {warnings.length > 0 && (
            <Notice tone="warning" title="Interpret with caution">
              <ul className="list-disc space-y-1 pl-4">
                {warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </Notice>
          )}

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-ink">Session summary</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(assessment.date)} · {assessment.assessmentType || 'Full screening battery'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Pill tone={assessment.reviewState === 'REVIEW_PROMPT' ? 'amber' : assessment.reviewState === 'NOT_INTERPRETABLE' ? 'slate' : 'green'} dot>
                      {assessment.reviewState === 'REVIEW_PROMPT'
                        ? 'Review prompt'
                        : assessment.reviewState === 'NOT_INTERPRETABLE'
                          ? 'Not interpretable'
                          : assessment.reviewState === 'CLINICIAN_REVIEWED'
                            ? 'Clinician reviewed'
                            : 'No review cue'}
                    </Pill>
                    <Pill tone={quality.comparable === true ? 'green' : quality.comparable === false ? 'amber' : 'sage'}>
                      {quality.comparable === true ? 'Comparable session' : quality.comparable === false ? 'Limited comparability' : 'Quality not recorded'}
                    </Pill>
                    <Pill tone="slate">{assessment.reviewStatus?.replace(/_/g, ' ').toLowerCase() || 'Not reviewed'}</Pill>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {typeof assessment.overallScore === 'number' ? (
                    <ScoreDial value={assessment.overallScore} label="Composite" />
                  ) : (
                    <p className="max-w-[9rem] text-xs font-semibold text-amber-700">
                      Not interpretable — no score recorded for this session.
                    </p>
                  )}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Previous valid</p>
                    <p className="mt-1 text-[16px] font-semibold text-ink">
                      {previous && typeof previous.overallScore === 'number' ? Math.round(previous.overallScore) : '—'}
                    </p>
                    <p className={`mt-1 text-xs font-semibold ${scoreDelta === null ? 'text-muted' : scoreDelta < -3 ? 'text-amber-700' : scoreDelta > 3 ? 'text-emerald-700' : 'text-muted'}`}>
                      {scoreDelta === null ? 'No previous session' : `${scoreDelta > 0 ? '+' : ''}${scoreDelta} vs previous`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-line bg-warm p-3 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor="review-session" className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                  View another session
                </label>
                <select
                  id="review-session"
                  value={selectedIndex}
                  onChange={(event) => setSelectedIndex(Number(event.target.value))}
                  className="rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-xs font-semibold text-body outline-none focus:border-blue-500"
                >
                  {ordered.map((item, index) => (
                    <option key={item.id} value={index}>
                      {formatDate(item.date)} · {formatScore(item.overallScore)} {index === 0 ? '(latest)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            <Card>
              <h2 className="text-[14px] font-semibold text-ink">Task completion</h2>
              <p className="mt-0.5 text-xs text-muted">Missing tasks limit interpretation.</p>
              <ul className="mt-3 space-y-2">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-2 text-xs">
                    {task.complete ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />}
                    <span className={task.complete ? 'text-body' : 'text-muted'}>{task.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-lg bg-warm px-2.5 py-2 text-xs font-semibold text-body">
                {tasks.filter((task) => task.complete).length} of {tasks.length} tasks recorded
              </p>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Comparable sessions" value={String(changeSummary?.cognitive.comparableAssessments ?? ordered.filter((item) => item.taskResponses?.quality?.comparable !== false).length)} detail="Used for baseline comparison" />
            <MetricTile label="Observed baseline" value={changeSummary?.cognitive.baselineRange ? `${changeSummary.cognitive.baselineRange.minimum}–${changeSummary.cognitive.baselineRange.maximum}` : 'Not yet available'} detail="Within-person observed range" />
            <MetricTile label="Previous score" value={previous ? formatScore(previous.overallScore) : 'No prior session'} detail={previous ? formatDate(previous.date) : 'Establishing history'} />
            <MetricTile label="Overall change cue" value={changeSummary?.status === 'REVIEW' ? 'Review suggested' : changeSummary?.status === 'NO_CHANGE' ? 'No current cue' : 'Insufficient data'} detail="Not a diagnostic conclusion" />
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-ink">Domain observations</h2>
                <p className="mt-0.5 text-xs text-muted">Raw and derived signals from this session. Missing values are shown explicitly.</p>
              </div>
              <Activity className="h-4 w-4 text-muted" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {observations.map((domain) => {
                const Icon = iconForDomain[domain.id] || Activity;
                return (
                  <div key={domain.id} className="rounded-xl border border-line p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <Icon className="h-3.5 w-3.5 text-blue-700" /> {domain.domain}
                    </p>
                    <dl className="mt-2 space-y-1.5">
                      {domain.values.map((value) => (
                        <div key={value.label} className="flex items-start justify-between gap-2">
                          <dt className="text-xs text-muted">{value.label}</dt>
                          <dd className={`text-right text-xs font-semibold ${value.value === 'Missing' ? 'text-muted' : 'text-slate-800'}`}>{value.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="text-[14px] font-semibold text-ink">Session quality</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ['Audio', qualityLabel(quality.audio)],
                  ['Video', qualityLabel(quality.video)],
                  ['Completion', qualityLabel(quality.completion)],
                  ['Comprehension', qualityLabel(quality.comprehension)]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-line bg-warm/60 p-2.5">
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-4 text-muted">
                Interruptions: {quality.interruptions ?? 'Not recorded'}. {quality.comparable === true ? 'The session met the comparability requirement.' : quality.comparable === false ? 'This session should not be used alone to infer change.' : 'Session quality was not recorded for this session.'}
              </p>
            </Card>

            <Card>
              <h2 className="text-[14px] font-semibold text-ink">Baseline comparison</h2>
              {changeSummary ? (
                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between gap-3 border-b border-line pb-2">
                    <dt className="text-muted">Latest score</dt>
                    <dd className="font-semibold text-ink">{changeSummary.cognitive.latestScore !== null ? `${changeSummary.cognitive.latestScore} / 100` : 'Unavailable'}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-line pb-2">
                    <dt className="text-muted">Previous score</dt>
                    <dd className="font-semibold text-ink">{changeSummary.cognitive.previousScore !== null ? `${changeSummary.cognitive.previousScore} / 100` : 'Unavailable'}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-line pb-2">
                    <dt className="text-muted">Observed spread</dt>
                    <dd className="font-semibold text-ink">{changeSummary.cognitive.baselineRange ? `${changeSummary.cognitive.baselineRange.minimum}–${changeSummary.cognitive.baselineRange.maximum}` : 'Not yet established'}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-line pb-2">
                    <dt className="text-muted">Reliable-change threshold</dt>
                    <dd className="font-semibold text-ink">
                      {changeSummary.cognitive.reliability.reliableChangeThreshold != null
                        ? `±${changeSummary.cognitive.reliability.reliableChangeThreshold} pts`
                        : 'Not established'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-line pb-2">
                    <dt className="text-muted">Threshold basis</dt>
                    <dd className="text-right font-semibold text-ink">
                      {changeSummary.cognitive.reliability.state === 'PROVISIONAL'
                        ? `1.96 × SD ${changeSummary.cognitive.reliability.standardDeviationOfChange} over ${changeSummary.cognitive.reliability.pairs} repeat pairs`
                        : `${changeSummary.cognitive.reliability.pairs} repeat pair(s); 3 needed`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Decline beyond measured variability</dt>
                    <dd className="font-semibold text-ink">{changeSummary.cognitive.declineBeyondReliableChange ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-xs text-muted">Baseline comparison is unavailable for this record.</p>
              )}
              <p className="mt-3 rounded-lg border border-line bg-warm p-2.5 text-xs leading-4 text-muted">
                Comparison uses the patient’s own prior observations only. It does not establish a diagnosis or a universal cut-off.
              </p>
            </Card>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <Link to={`/doctor/patients/${patient.patientId}/notes?assessment=${assessment.id}`} className={primaryButton}>
              Continue to clinical notes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 54 — Longitudinal Clinical View
// ---------------------------------------------------------------------------
type TrendSeries = {
  id: string;
  title: string;
  icon: typeof Eye;
  unit: string;
  color: string;
  points: Array<{ label: string; value: number }>;
};

const getNumeric = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

export const DoctorLongitudinalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patient, assessments, changeSummary, isLoading } = useDoctorPatient(id);
  const chronological = useMemo(
    () => [...assessments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [assessments]
  );

  const series: TrendSeries[] = [
    {
      id: 'cognitive',
      title: 'Cognitive composite',
      icon: Activity,
      unit: ' / 100',
      color: '#2F5E4E',
      points: chronological
        .map((assessment) => ({ label: new Date(assessment.date).toLocaleDateString(document.documentElement.lang === 'ar' ? 'ar-AE' : (document.documentElement.lang || 'en-US'), { day: '2-digit', month: 'short' }), value: getNumeric(assessment.overallScore) }))
        .filter((point): point is { label: string; value: number } => point.value !== null)
    },
    {
      id: 'ocular',
      title: 'Ocular · fixation hold',
      icon: Eye,
      unit: '%',
      color: '#7FA692',
      points: chronological
        .map((assessment) => ({ label: new Date(assessment.date).toLocaleDateString(document.documentElement.lang === 'ar' ? 'ar-AE' : (document.documentElement.lang || 'en-US'), { day: '2-digit', month: 'short' }), value: getNumeric(assessment.taskResponses?.task1?.fixationHoldPct) }))
        .filter((point): point is { label: string; value: number } => point.value !== null)
    },
    {
      id: 'vocal',
      title: 'Vocal · speech rate',
      icon: Mic,
      unit: ' wpm',
      color: '#0E7490',
      points: chronological
        .map((assessment) => ({ label: new Date(assessment.date).toLocaleDateString(document.documentElement.lang === 'ar' ? 'ar-AE' : (document.documentElement.lang || 'en-US'), { day: '2-digit', month: 'short' }), value: getNumeric(assessment.taskResponses?.task3?.wpm) }))
        .filter((point): point is { label: string; value: number } => point.value !== null)
    },
    {
      id: 'functional',
      title: 'Functional · trail-making',
      icon: TrendingUp,
      unit: ' s',
      color: '#B45309',
      points: chronological
        .map((assessment) => ({ label: new Date(assessment.date).toLocaleDateString(document.documentElement.lang === 'ar' ? 'ar-AE' : (document.documentElement.lang || 'en-US'), { day: '2-digit', month: 'short' }), value: getNumeric(assessment.taskResponses?.task5?.trailBCompletionSec) }))
        .filter((point): point is { label: string; value: number } => point.value !== null)
    }
  ];

  const missing = series.filter((item) => item.points.length < chronological.length);
  const latestOf = (item: TrendSeries) => item.points[item.points.length - 1]?.value ?? null;
  const previousOf = (item: TrendSeries) => item.points.length > 1 ? item.points[item.points.length - 2].value : null;

  // Descriptive count only: how many recent scores sit outside the observed
  // spread. This is not a threshold and does not itself trigger a prompt.
  const sessionsOutsideObservedRange = useMemo(() => {
    const range = changeSummary?.cognitive.baselineRange;
    if (!range) return 0;
    return chronological.slice(-3).filter((assessment) => {
      if (assessment.taskResponses?.quality?.comparable === false) return false;
      const score = getNumeric(assessment.overallScore);
      return score !== null && (score < range.minimum || score > range.maximum);
    }).length;
  }, [changeSummary, chronological]);

  if (isLoading) return <div className="p-12 text-center text-[14px] text-muted">Loading longitudinal record…</div>;
  if (!patient) return <div className="p-12 text-center text-[14px] text-muted">Patient not found.</div>;

  return (
    <div className="space-y-5">
      <OverviewLink patientId={patient.patientId} />
      <DoctorPageHeader
        screen="Screen 54 · Longitudinal clinical view"
        title="Longitudinal view"
        description={`Compare ${patient.name}’s cognitive, ocular, vocal, and functional observations across sessions. Trends are descriptive and depend on comparable data.`}
        actions={
          <Link to={`/doctor/reports?patient=${patient.patientId}`} className={secondaryButton}>
            <Printer className="h-4 w-4" /> Longitudinal report
          </Link>
        }
      />
      <PatientWorkflowNav patientId={patient.patientId} />

      {chronological.length < 2 ? (
        <EmptyState
          scene="emptyAssessment"
          icon={TrendingUp}
          title="More sessions are needed"
          detail={`${chronological.length} completed session${chronological.length === 1 ? ' is' : 's are'} on file. At least two comparable sessions are needed before a trend can be shown.`}
          action={<Link to={`/doctor/patients/${patient.patientId}/review`} className={primaryButton}>Review available session</Link>}
        />
      ) : (
        <>
          <Notice tone="warning" title="Trend interpretation">
            A line connecting sessions does not show a diagnosis or prove decline. Look for persistence across comparable sessions and review health context, task completeness, and measurement quality.
          </Notice>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Sessions on file" value={String(assessments.length)} detail={`${chronological.filter((item) => item.taskResponses?.quality?.comparable !== false).length} comparable`} />
            <MetricTile label="Baseline status" value={changeSummary?.cognitive.baselineRange ? 'Established' : 'Building'} detail={changeSummary?.cognitive.baselineRange ? `Observed ${changeSummary.cognitive.baselineRange.minimum}–${changeSummary.cognitive.baselineRange.maximum}` : 'Needs more valid sessions'} />
            <MetricTile label="Latest overall" value={formatScore(chronological[chronological.length - 1].overallScore)} detail={formatDate(chronological[chronological.length - 1].date)} />
            <MetricTile label="Persistence" value={changeSummary?.status === 'REVIEW' ? `${sessionsOutsideObservedRange} of last 3` : 'No current cue'} detail="Sessions outside the observed spread (descriptive)" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {series.map((item) => {
              const Icon = item.icon;
              const latest = latestOf(item);
              const previous = previousOf(item);
              const delta = latest !== null && previous !== null ? latest - previous : null;
              return (
                <Card key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                        <Icon className="h-3.5 w-3.5 text-blue-700" /> {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {item.points.length} valid point{item.points.length === 1 ? '' : 's'} of {chronological.length} sessions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[17px] font-semibold text-ink">{latest !== null ? `${Math.round(latest * 10) / 10}${item.unit}` : 'Missing'}</p>
                      <p className={`text-xs font-semibold ${delta === null ? 'text-muted' : delta < 0 ? 'text-amber-700' : delta > 0 ? 'text-emerald-700' : 'text-muted'}`}>
                        {delta === null ? 'No comparison' : `${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10}${item.unit} vs previous`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <TrendLine points={item.points} tone={item.color} valueSuffix={item.unit} />
                  </div>
                  {delta !== null && Math.abs(delta) >= 5 && (
                    <p className="mt-1 text-xs text-muted">
                      Direction of change shown for review; not a validated threshold for clinical significance.
                    </p>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <h2 className="text-[14px] font-semibold text-ink">Previous session comparison</h2>
              <p className="mt-0.5 text-xs text-muted">Latest observation minus the preceding valid observation.</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-xs font-bold uppercase tracking-[0.08em] text-muted">
                      <th className="py-2">Domain</th>
                      <th className="py-2">Latest</th>
                      <th className="py-2">Previous</th>
                      <th className="py-2 text-right">Direction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {series.map((item) => {
                      const latest = latestOf(item);
                      const previous = previousOf(item);
                      const delta = latest !== null && previous !== null ? latest - previous : null;
                      return (
                        <tr key={item.id}>
                          <td className="py-2.5 font-medium text-body">{item.title}</td>
                          <td className="py-2.5 text-body">{latest !== null ? `${Math.round(latest * 10) / 10}${item.unit}` : 'Missing'}</td>
                          <td className="py-2.5 text-muted">{previous !== null ? `${Math.round(previous * 10) / 10}${item.unit}` : '—'}</td>
                          <td className={`py-2.5 text-right font-semibold ${delta === null ? 'text-muted' : delta < 0 ? 'text-amber-700' : delta > 0 ? 'text-emerald-700' : 'text-muted'}`}>
                            {delta === null ? 'No comparison' : `${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Missing data
                </h2>
                {missing.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                    All four domains have a valid value in every session.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {missing.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-2.5 py-2 text-xs">
                        <span className="text-amber-950">{item.title}</span>
                        <span className="font-semibold text-amber-800">{item.points.length} / {chronological.length}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs leading-4 text-muted">
                  Gaps are not assumed to represent stability or improvement. They remain missing in summaries.
                </p>
              </Card>

              <Card>
                <h2 className="text-[14px] font-semibold text-ink">Change persistence</h2>
                <p className="mt-2 text-xs leading-5 text-body">
                  {changeSummary?.status === 'REVIEW'
                    ? `${sessionsOutsideObservedRange} of the last three comparable sessions fall outside the observed spread. Persistence across sessions is worth a second look, but the prompt is the decline beyond measured variability, not the spread itself.`
                    : changeSummary?.status === 'NO_CHANGE'
                      ? 'The current comparison does not flag a persistent change. Continue routine monitoring.'
                      : 'Insufficient comparable history is available to assess persistence.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {changeSummary?.reviewReasons.map((reason) => (
                    <Pill key={reason} tone="amber">
                      {reason === 'OUTSIDE_RELIABLE_CHANGE' ? 'Decline beyond variability' : reason === 'FUNCTIONAL_CHANGE' ? 'Functional change' : 'Context change'}
                    </Pill>
                  ))}
                  {(!changeSummary || changeSummary.reviewReasons.length === 0) && <Pill tone="slate">No current cue</Pill>}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
