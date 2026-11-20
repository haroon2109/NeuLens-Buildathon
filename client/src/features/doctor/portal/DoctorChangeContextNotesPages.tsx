import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Database,
  Droplets,
  FileText,
  HeartPulse,
  Info,
  Moon,
  ShieldCheck,
  Stethoscope,
  Users
} from 'lucide-react';
import { doctorApi, type DoctorDashboardStats } from '../../../services/portalApi';
import { useAuthStore } from '../../../store/authStore';
import { useDoctorPortalStore, type NoteDecision } from '../../../store/doctorPortalStore';
import { useDoctorPatient, getQuality, type DoctorAssessment } from './useDoctorPatient';
import {
  Card,
  ChangePill,
  DoctorPageHeader,
  EmptyState,
  InfoRow,
  MetricTile,
  Notice,
  PatientWorkflowNav,
  Pill,
  ReviewPill,
  fieldClass,
  formatDate,
  formatDateTime,
  formatScore,
  labelClass,
  primaryButton,
  secondaryButton
} from './ui';

const activityLabels: Record<string, string> = {
  dressing: 'Dressing',
  grooming: 'Grooming',
  cooking: 'Preparing meals',
  shopping: 'Shopping',
  finances: 'Managing finances',
  medications: 'Managing medications',
  transport: 'Getting around',
  walking: 'Walking',
  housework: 'Housework',
  social: 'Social participation'
};

const contextLabels: Record<string, string> = {
  sleep: 'Sleep',
  sleepQuality: 'Sleep quality',
  activity: 'Physical activity',
  stress: 'Stress',
  mood: 'Mood',
  energy: 'Energy',
  appetite: 'Appetite',
  pain: 'Pain'
};

const reasonLabel: Record<string, string> = {
  OUTSIDE_RELIABLE_CHANGE: 'A score declined further than this patient’s measured session-to-session variability.',
  FUNCTIONAL_CHANGE: 'The patient reported a change in daily function.',
  CONTEXT_CHANGE: 'Sleep, activity, stress, or mood context changed.'
};

const BackToPatient: React.FC<{ patientId: string }> = ({ patientId }) => (
  <Link to={`/doctor/patients/${patientId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
    <ArrowLeft className="h-3.5 w-3.5" /> Patient overview
  </Link>
);

const latestAssessmentOf = (assessments: DoctorAssessment[]) =>
  [...assessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

// ---------------------------------------------------------------------------
// Screen 55 — Change Detection Review
// ---------------------------------------------------------------------------
const ChangeStatusHero: React.FC<{ status: 'REVIEW' | 'NO_CHANGE' | 'INSUFFICIENT_DATA' }> = ({ status }) => {
  if (status === 'REVIEW') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><AlertTriangle className="h-5 w-5" /></span>
          <div>
            <h2 className="text-[15px] font-semibold text-amber-950">Review — closer clinical look suggested</h2>
            <p className="mt-1 text-xs leading-5 text-amber-900/80">
              One or more within-person signals deserves review alongside context. This is not a diagnosis and does not establish a condition.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (status === 'NO_CHANGE') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <h2 className="text-[15px] font-semibold text-emerald-950">Stable — no current review prompt</h2>
            <p className="mt-1 text-xs leading-5 text-emerald-900/80">
              Current observations do not trigger a within-person review cue. Continue routine monitoring and interpret alongside clinical judgement.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-line bg-warm p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-muted"><Clock3 className="h-5 w-5" /></span>
        <div>
          <h2 className="text-[15px] font-semibold text-ink">More comparable data needed</h2>
          <p className="mt-1 text-xs leading-5 text-body">
            A change check requires comparable prior sessions and a completed functional check-in. The absence of a flag does not mean stability.
          </p>
        </div>
      </div>
    </div>
  );
};

export const DoctorChangeDetectionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patient, assessments, changeSummary, isLoading } = useDoctorPatient(id);
  const { notes, changeAcknowledgements, acknowledgeChange } = useDoctorPortalStore();
  const latest = latestAssessmentOf(assessments);
  const [decision, setDecision] = useState<'ACKNOWLEDGED' | 'MONITOR' | 'ESCALATED'>('ACKNOWLEDGED');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const patientAcks = changeAcknowledgements.filter((item) => item.patientId === patient?.patientId);
  const latestAck = patientAcks[0];

  if (isLoading) return <div className="p-12 text-center text-[14px] text-muted">Loading change review…</div>;
  if (!patient) return <div className="p-12 text-center text-[14px] text-muted">Patient not found.</div>;

  const status = changeSummary?.status || 'INSUFFICIENT_DATA';
  const quality = getQuality(latest);
  const comparable = changeSummary?.cognitive.comparableAssessments ?? 0;
  const confidenceLabel = comparable >= 3 ? 'Moderate evidence base' : comparable > 0 ? 'Limited evidence base' : 'No comparable history';
  const functionalChanges = changeSummary?.function.worsenedActivityIds || [];
  const changedFactors = changeSummary?.context.changedFactors || [];
  const handleAcknowledge = (event: React.FormEvent) => {
    event.preventDefault();
    acknowledgeChange({
      patientId: patient.patientId,
      assessmentId: latest?.id || null,
      status: decision,
      note: note.trim()
    });
    setNote('');
    setSaved(true);
  };

  return (
    <div className="space-y-5">
      <BackToPatient patientId={patient.patientId} />
      <DoctorPageHeader
        screen="Screen 55 · Change detection review"
        title="Change detection review"
        description={`Review the evidence behind ${patient.name}’s monitoring status, the uncertainty around it, and any contextual contributors.`}
        actions={<Pill tone={status === 'REVIEW' ? 'amber' : status === 'NO_CHANGE' ? 'green' : 'slate'} dot><ChangePill status={status} /></Pill>}
      />
      <PatientWorkflowNav patientId={patient.patientId} />
      <ChangeStatusHero status={status} />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Evidence</h2>
            <p className="mt-0.5 text-xs text-muted">What triggered or did not trigger a review prompt.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile label="Cognitive change" value={changeSummary?.cognitive.change != null ? `${changeSummary.cognitive.change > 0 ? '+' : ''}${changeSummary.cognitive.change} pts` : 'Unavailable'} detail="Latest vs previous comparable" />
              <MetricTile label="Observed spread" value={changeSummary?.cognitive.baselineRange ? `${changeSummary.cognitive.baselineRange.minimum}–${changeSummary.cognitive.baselineRange.maximum}` : 'Not established'} detail={`Descriptive only, ${comparable} comparable sessions`} />
              <MetricTile
                label="Reliable-change threshold"
                value={changeSummary?.cognitive.reliability.reliableChangeThreshold != null ? `±${changeSummary.cognitive.reliability.reliableChangeThreshold} pts` : 'Not established'}
                detail="1.96 × this patient’s SD of change"
              />
              <MetricTile label="Decline beyond threshold" value={changeSummary?.cognitive.declineBeyondReliableChange ? 'Yes' : 'No'} detail={changeSummary?.cognitive.reliability.state === 'PROVISIONAL' ? 'Latest vs prior mean' : 'No threshold yet'} />
            </div>

            {(changeSummary?.reviewReasons || []).length > 0 ? (
              <ul className="mt-3 space-y-2">
                {changeSummary?.reviewReasons.map((reason) => (
                  <li key={reason} className="flex gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs leading-5 text-amber-950">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" /> {reasonLabel[reason]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-lg border border-line bg-warm px-3 py-2 text-xs leading-4 text-muted">
                No review reasons are currently recorded. Review the source session before concluding that nothing changed.
              </p>
            )}
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <h2 className="text-[14px] font-semibold text-ink">Confidence & uncertainty</h2>
              <p className="mt-2 text-xs font-semibold text-slate-800">{confidenceLabel}</p>
              <ul className="mt-2 space-y-1.5 text-xs leading-4 text-body">
                <li>• Comparison uses {comparable} comparable session{comparable === 1 ? '' : 's'}.</li>
                <li>• {quality.comparable === true ? 'Latest session meets comparability criteria.' : quality.comparable === false ? 'Latest session has limited comparability.' : 'Comparability was not recorded for the latest session.'}</li>
                <li>• A single out-of-range observation is not proof of persistent change.</li>
                <li>• Sleep, stress, medication timing, and environment can affect performance.</li>
              </ul>
            </Card>

            <Card>
              <h2 className="text-[14px] font-semibold text-ink">Quality warnings</h2>
              {quality.comparable === true && quality.completion === 'FULL' ? (
                <p className="mt-2 flex items-start gap-1.5 text-xs leading-4 text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> No session-quality warning is recorded for the latest assessment.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-xs leading-4 text-amber-800">
                  {quality.comparable === false && <li>• Limited comparability; trend interpretation is suppressed.</li>}
                  {quality.completion && quality.completion !== 'FULL' && <li>• Session completion: {quality.completion.toLowerCase()}.</li>}
                  {quality.audio === 'POOR' && <li>• Poor audio quality may limit vocal measures.</li>}
                  {quality.video === 'POOR' && <li>• Poor video quality may limit ocular and facial measures.</li>}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Contextual contributors</h2>
            <p className="mt-0.5 text-xs text-muted">Context can explain a change but does not establish cause.</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Reported functional changes</p>
                {functionalChanges.length ? (
                  <ul className="mt-2 space-y-1.5">
                    {functionalChanges.map((activity) => (
                      <li key={activity} className="flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900">
                        <Activity className="h-3 w-3" /> {activityLabels[activity] || activity.replace(/_/g, ' ')}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted">No functional change reported in the current check-in.</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Changed health-context factors</p>
                {changedFactors.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {changedFactors.map((factor) => (
                      <Pill key={factor} tone="blue">{contextLabels[factor] || factor.replace(/_/g, ' ')}</Pill>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted">No context-factor change is currently flagged.</p>
                )}
                <Link to={`/doctor/patients/${patient.patientId}/context`} className="mt-3 inline-block text-xs font-semibold text-blue-700">
                  Review full health context
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Acknowledge review</h2>
            <p className="mt-0.5 text-xs leading-4 text-muted">
              Record that you reviewed this prompt. Acknowledgement does not change the underlying assessment data.
            </p>
            {saved && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-800">Review acknowledgement saved.</div>}
            <form onSubmit={handleAcknowledge} className="mt-3 space-y-3">
              <div>
                <label htmlFor="ack-decision" className={labelClass}>Review decision</label>
                <select id="ack-decision" value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)} className={fieldClass}>
                  <option value="ACKNOWLEDGED">Acknowledged · no immediate action</option>
                  <option value="MONITOR">Monitor · repeat comparison</option>
                  <option value="ESCALATED">Escalate · clinical follow-up</option>
                </select>
              </div>
              <div>
                <label htmlFor="ack-note" className={labelClass}>Review note <span className="font-normal text-muted">(optional)</span></label>
                <textarea id="ack-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} className={fieldClass} placeholder="What did you consider? Any next step?" />
              </div>
              <button type="submit" className={`${primaryButton} w-full`}>
                <ClipboardCheck className="h-4 w-4" /> Save acknowledgement
              </button>
            </form>
          </Card>

          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Review history</h2>
            {latestAck ? (
              <div className="mt-2 rounded-xl border border-line bg-warm p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-800">{latestAck.status.toLowerCase()}</p>
                  <span className="text-xs text-muted">{formatDateTime(latestAck.acknowledgedAt)}</span>
                </div>
                {latestAck.note && <p className="mt-1 text-xs leading-4 text-body">{latestAck.note}</p>}
              </div>
            ) : (
              <p className="mt-2 text-xs leading-4 text-muted">No acknowledgement has been recorded for this patient.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/doctor/patients/${patient.patientId}/review`} className={secondaryButton}><FileText className="h-3.5 w-3.5" /> Assessment</Link>
              <Link to={`/doctor/patients/${patient.patientId}/notes`} className={secondaryButton}>Clinical notes</Link>
            </div>
          </Card>

          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Related notes</h2>
            {notes.filter((item) => item.patientId === patient.patientId).length === 0 ? (
              <p className="mt-2 text-xs text-muted">No notes recorded.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {notes.filter((item) => item.patientId === patient.patientId).slice(0, 3).map((item) => (
                  <li key={item.id} className="rounded-lg border border-line p-2.5">
                    <p className="text-xs font-semibold text-slate-800">{item.decision.replace(/_/g, ' ').toLowerCase()}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted">{item.observations}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export const ChangeDetectionQueuePage: React.FC = () => {
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { changeAcknowledgements } = useDoctorPortalStore();

  useEffect(() => {
    let cancelled = false;
    doctorApi
      .getDashboard()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load the change queue.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const queue = (stats?.changeReviewQueue || []).filter(
    (item) => !changeAcknowledgements.some((ack) => ack.patientId === item.patientId)
  );

  return (
    <div className="space-y-5">
      <DoctorPageHeader
        screen="Change detection queue"
        title="Change review queue"
        description="Patients with an active within-person review prompt. Open each record to examine evidence, context, and quality before acknowledging."
      />
      {error && <Notice tone="warning" title="Queue unavailable">{error}</Notice>}
      <Card padded={false}>
        {loading ? (
          <p className="p-10 text-center text-xs text-muted">Loading change queue…</p>
        ) : queue.length === 0 ? (
          <div className="p-6">
            <EmptyState scene="emptyNotifications" icon={CheckCircle2} title="No open change reviews" detail="Review prompts appear here when comparable sessions and functional context produce a within-person signal." />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {queue.map((item) => (
              <li key={item.patientId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link to={`/doctor/patients/${item.patientId}/change-detection`} className="text-[14px] font-semibold text-ink hover:text-blue-700">
                    {item.patientName}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    {item.patientId} · latest {formatDate(item.latestAssessmentDate)}
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    {item.reviewReasons.map((reason) => reasonLabel[reason]).join(' ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone="amber" dot>Review</Pill>
                  <Link to={`/doctor/patients/${item.patientId}/change-detection`} className={secondaryButton}>Open review</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 56 — Health Context Review
// ---------------------------------------------------------------------------
export const DoctorHealthContextPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patient, assessments, isLoading, contextInputs = [] } = useDoctorPatient(id);
  const { clinicalContexts } = useDoctorPortalStore();
  const latest = latestAssessmentOf(assessments);
  const stored = patient ? clinicalContexts[patient.patientId] : undefined;
  const sharedContext = latest?.taskResponses?.healthContext || latest?.taskResponses?.functionalCheckIn?.context || null;
  const familyHistoryRecord = contextInputs.find((input) => input.source === 'family_history');
  const genomicRecord = contextInputs.find((input) => input.source === 'genomic' && input.consentGranted);

  if (isLoading) return <div className="p-12 text-center text-[14px] text-muted">Loading health context…</div>;
  if (!patient) return <div className="p-12 text-center text-[14px] text-muted">Patient not found.</div>;

  const sleepHours = stored?.sleepHours ?? sharedContext?.sleepHours ?? null;
  const sleepQuality = stored?.sleepQuality ?? sharedContext?.sleepQuality ?? null;
  const activityLevel = stored?.activityLevel ?? sharedContext?.activityLevel ?? null;
  const stressLevel = stored?.stressLevel ?? sharedContext?.stressLevel ?? null;
  const mood = stored?.mood ?? sharedContext?.mood ?? null;
  const hasContext = Boolean(stored || sharedContext || contextInputs.length);

  return (
    <div className="space-y-5">
      <BackToPatient patientId={patient.patientId} />
      <DoctorPageHeader
        screen="Screen 56 · Health context review"
        title="Health context"
        description={`Review the patient-reported and imported context that may influence ${patient.name}’s screening performance. Context is associative, not causal.`}
        actions={<Link to={`/doctor/patients/${patient.patientId}/change-detection`} className={secondaryButton}>Change review</Link>}
      />
      <PatientWorkflowNav patientId={patient.patientId} />

      {!hasContext ? (
        <EmptyState
          scene="contextLifestyle"
          icon={HeartPulse}
          title="No health context shared"
          detail="The patient has not completed a health-context check-in, and no external source has been imported. Missing context should be noted when interpreting results."
          action={<Link to={`/doctor/patients/${patient.patientId}/notes`} className={primaryButton}>Note missing context</Link>}
        />
      ) : (
        <>
          <Notice tone="info" title="How to use context">
            Sleep disruption, stress, medication timing, and acute illness can influence attention and motor performance. Treat these as possible contributors to review, not explanations of cause.
          </Notice>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink"><Moon className="h-3.5 w-3.5 text-blue-700" /> Sleep & lifestyle</h2>
              <dl className="mt-2">
                <InfoRow label="Typical sleep" value={sleepHours != null ? `${sleepHours} hours` : 'Not shared'} />
                <InfoRow label="Sleep quality" value={sleepQuality != null ? `${sleepQuality} / 5` : 'Not shared'} />
                <InfoRow label="Physical activity" value={activityLevel != null ? `${activityLevel} / 5` : 'Not shared'} />
                <InfoRow label="Last updated" value={stored ? formatDate(stored.lastUpdated) : latest ? formatDate(latest.date) : 'Unknown'} />
              </dl>
            </Card>

            <Card>
              <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink"><Users className="h-3.5 w-3.5 text-blue-700" /> Mental wellbeing</h2>
              <dl className="mt-2">
                <InfoRow label="Stress level" value={stressLevel != null ? `${stressLevel} / 5` : 'Not shared'} />
                <InfoRow label="Mood" value={mood != null ? `${mood} / 5` : 'Not shared'} />
                <InfoRow label="Source" value={stored ? 'Patient check-in' : 'Session context'} />
              </dl>
              <p className="mt-2 text-xs leading-4 text-muted">Brief context only; not a validated mood or anxiety instrument.</p>
            </Card>

            <Card>
              <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink"><Droplets className="h-3.5 w-3.5 text-blue-700" /> Metabolic</h2>
              <p className="mt-2 text-xs leading-5 text-body">
                {stored?.metabolic || 'No recent metabolic information is available in the shared record.'}
              </p>
            </Card>

            <Card>
              <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink"><Stethoscope className="h-3.5 w-3.5 text-blue-700" /> Medical history</h2>
              <dl className="mt-2">
                <InfoRow label="Conditions" value={stored?.conditions?.length ? stored.conditions.join(', ') : 'None recorded'} />
                <InfoRow label="Medications" value={stored?.medications?.length ? stored.medications.join(', ') : 'None recorded'} />
                <InfoRow label="Allergies" value={stored?.allergies?.length ? stored.allergies.join(', ') : 'None recorded'} />
              </dl>
            </Card>

            <Card>
              <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink"><Users className="h-3.5 w-3.5 text-blue-700" /> Family history</h2>
              <p className="mt-2 text-xs leading-5 text-body">
                {stored?.familyHistory || familyHistoryRecord?.values?.familyHistory || 'No family history has been shared.'}
              </p>
              {familyHistoryRecord && (
                <p className="mt-2 text-xs leading-4 text-muted">Patient-reported · {formatDate(familyHistoryRecord.recordedAt)}</p>
              )}
            </Card>

            <Card>
              <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink"><Database className="h-3.5 w-3.5 text-blue-700" /> Genomic context</h2>
              {genomicRecord ? (
                <>
                  <p className="mt-2 text-xs leading-5 text-body">
                    {genomicRecord.values?.genomicSummary || 'Shared without a written summary.'}
                  </p>
                  <p className="mt-2 text-xs leading-4 text-muted">
                    Patient-shared with consent · {formatDate(genomicRecord.recordedAt)}
                  </p>
                  <p className="mt-2 rounded-lg bg-warm px-2.5 py-2 text-xs leading-4 text-muted">
                    Context only. Not interpreted by NeuLens, not used in scoring, and not a genetic risk assessment. Confirm against the source laboratory report.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs leading-4 text-muted">No genomic context has been shared with consent.</p>
              )}
            </Card>

            <Card>
              <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink"><Database className="h-3.5 w-3.5 text-blue-700" /> Imported sources</h2>
              {stored?.sources?.length ? (
                <ul className="mt-2 space-y-2">
                  {stored.sources.map((source) => (
                    <li key={source} className="flex items-start gap-2 rounded-lg bg-warm px-2.5 py-2 text-xs text-body">
                      <Database className="mt-0.5 h-3 w-3 shrink-0 text-muted" /> {source}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs leading-4 text-muted">No external sources are connected. Only self-reported context is available.</p>
              )}
              <p className="mt-2 text-xs leading-4 text-muted">Imported values remain read-only and do not overwrite clinician records.</p>
            </Card>
          </div>

          <Card>
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
              <div>
                <h2 className="text-[14px] font-semibold text-ink">Limitations of this context view</h2>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Self-report can be incomplete or affected by recall. Imported device and EHR values depend on external data quality and consent. This view does not establish causality or replace a clinical history.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 57 — Clinical Notes & Findings
// ---------------------------------------------------------------------------
const decisionOptions: Array<{ value: NoteDecision; label: string }> = [
  { value: 'NO_CHANGE', label: 'No change · routine monitoring' },
  { value: 'MONITOR', label: 'Monitor · repeat comparison' },
  { value: 'CLINICAL_REVIEW', label: 'Clinical review · discuss with patient' },
  { value: 'REFER', label: 'Refer · onward assessment' }
];

export const DoctorClinicalNotesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { profile, notes, addNote } = useDoctorPortalStore();
  const { patient, assessments, isLoading } = useDoctorPatient(id);
  const ordered = useMemo(() => [...assessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [assessments]);
  const requestedAssessment = searchParams.get('assessment');
  const [assessmentId, setAssessmentId] = useState(requestedAssessment || ordered[0]?.id || '');
  const [observations, setObservations] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [questions, setQuestions] = useState('');
  const [decision, setDecision] = useState<NoteDecision>('MONITOR');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!assessmentId && ordered[0]?.id) setAssessmentId(ordered[0].id);
  }, [assessmentId, ordered]);

  if (isLoading) return <div className="p-12 text-center text-[14px] text-muted">Loading clinical notes…</div>;
  if (!patient) return <div className="p-12 text-center text-[14px] text-muted">Patient not found.</div>;

  const patientId = patient.patientId;
  const patientNotes = notes.filter((item) => item.patientId === patientId);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (observations.trim().length < 10) return setError('Enter observations of at least 10 characters.');
    if (!interpretation.trim()) return setError('Enter your interpretation or state that none can be drawn.');
    if (followUpRequired && !followUpDate) return setError('Choose a follow-up date or turn off follow-up.');

    addNote({
      patientId,
      assessmentId: assessmentId || null,
      observations: observations.trim(),
      interpretation: interpretation.trim(),
      questions: questions.trim(),
      decision,
      followUpRequired,
      followUpDate: followUpRequired ? followUpDate : null,
      author: profile.fullName || user?.name || 'Clinician'
    });
    setObservations('');
    setInterpretation('');
    setQuestions('');
    setFollowUpDate('');
    setFollowUpRequired(false);
    setSaved(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-5">
      <BackToPatient patientId={patientId} />
      <DoctorPageHeader
        screen="Screen 57 · Clinical notes & findings"
        title="Clinical notes & findings"
        description={`Record observations, interpretation, unresolved questions, and your review decision for ${patient.name}. Notes are retained in the local clinical workspace.`}
      />
      <PatientWorkflowNav patientId={patientId} />

      {saved && <Notice tone="success" title="Finding saved">The clinical note has been added to this patient’s review history.</Notice>}

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><ClipboardCheck className="h-4 w-4" /></span>
              <div>
                <h2 className="text-[14px] font-semibold text-ink">New finding</h2>
                <p className="mt-0.5 text-xs text-muted">Use objective language and explicitly separate observation from interpretation.</p>
              </div>
            </div>

            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800" role="alert">{error}</div>}

            <div>
              <label htmlFor="note-assessment" className={labelClass}>Related assessment</label>
              <select id="note-assessment" value={assessmentId} onChange={(event) => setAssessmentId(event.target.value)} className={fieldClass}>
                <option value="">No specific assessment</option>
                {ordered.map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {formatDate(assessment.date)} · {formatScore(assessment.overallScore)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="note-observations" className={labelClass}>Observations</label>
              <textarea id="note-observations" rows={4} value={observations} onChange={(event) => setObservations(event.target.value)} className={fieldClass} placeholder="What did you observe in the record, session, or discussion? Include quality limitations and missing data." />
            </div>
            <div>
              <label htmlFor="note-interpretation" className={labelClass}>Interpretation</label>
              <textarea id="note-interpretation" rows={3} value={interpretation} onChange={(event) => setInterpretation(event.target.value)} className={fieldClass} placeholder="What might this mean, and what alternative explanations remain? Avoid diagnostic certainty from screening alone." />
            </div>
            <div>
              <label htmlFor="note-questions" className={labelClass}>Questions / next information needed</label>
              <textarea id="note-questions" rows={2} value={questions} onChange={(event) => setQuestions(event.target.value)} className={fieldClass} placeholder="e.g. Ask about sleep routine, medication timing, or functional change duration." />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="note-decision" className={labelClass}>Review decision</label>
                <select id="note-decision" value={decision} onChange={(event) => setDecision(event.target.value as NoteDecision)} className={fieldClass}>
                  {decisionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="note-followup-date" className={labelClass}>Follow-up date</label>
                <input id="note-followup-date" type="date" value={followUpDate} disabled={!followUpRequired} onChange={(event) => setFollowUpDate(event.target.value)} className={`${fieldClass} disabled:bg-warm disabled:text-muted`} />
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line p-3">
              <input type="checkbox" checked={followUpRequired} onChange={(event) => setFollowUpRequired(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-line-strong text-blue-700 focus:ring-blue-500" />
              <span className="text-xs text-body">Follow-up is required for this finding</span>
            </label>

            <div className="flex flex-col-reverse gap-2 border-t border-line pt-3 sm:flex-row sm:justify-end">
              <Link to={`/doctor/patients/${patientId}/care-plan`} className={secondaryButton}>Skip to care plan</Link>
              <button type="submit" className={primaryButton}>Save finding</button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Finding summary</h2>
            <dl className="mt-2">
              <InfoRow label="Patient" value={patient.name} />
              <InfoRow label="Latest assessment" value={ordered[0] ? formatDate(ordered[0].date) : 'None'} />
              <InfoRow label="Latest review" value={<ReviewPill status={ordered[0]?.reviewStatus} />} />
              <InfoRow label="Notes on file" value={String(patientNotes.length)} />
            </dl>
            <p className="mt-3 text-xs leading-4 text-muted">
              Notes are clinical working records in this browser workspace. The printable report should be used for formal documentation.
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[14px] font-semibold text-ink">Notes history</h2>
              <span className="text-xs text-muted">{patientNotes.length} total</span>
            </div>
            {patientNotes.length === 0 ? (
              <p className="mt-2 text-xs leading-4 text-muted">No clinical notes have been saved for this patient.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {patientNotes.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-800">{item.decision.replace(/_/g, ' ').toLowerCase()}</span>
                      <span className="text-xs text-muted">{formatDateTime(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-xs leading-4 text-body">{item.observations}</p>
                    {item.interpretation && <p className="mt-1.5 text-xs leading-4 text-muted"><span className="font-semibold text-body">Interpretation:</span> {item.interpretation}</p>}
                    {item.followUpRequired && <p className="mt-1.5 text-xs font-semibold text-amber-700">Follow-up: {item.followUpDate ? formatDate(item.followUpDate) : 'required'}</p>}
                    <p className="mt-1.5 text-xs text-muted">{item.author}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
