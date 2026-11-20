import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BellRing,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Mail,
  MapPin,
  Plus,
  Send,
  ShieldCheck,
  Stethoscope,
  UserRound
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import {
  useDoctorPortalStore,
  type CareAction,
  type ReferralStatus,
  type ReferralType
} from '../../../store/doctorPortalStore';
import { useDoctorPatient } from './useDoctorPatient';
import { doctorApi } from '../../../services/portalApi';
import { HealthcareScene } from '../../../components/illustrations/HealthcareScene';
import { MotionReveal } from '../../../components/motion/Reveal';
import {
  Card,
  DoctorPageHeader,
  EmptyState,
  InfoRow,
  Notice,
  PatientWorkflowNav,
  Pill,
  fieldClass,
  formatDate,
  formatDateTime,
  formatScore,
  labelClass,
  primaryButton,
  secondaryButton
} from './ui';

const BackToPatient: React.FC<{ patientId: string }> = ({ patientId }) => (
  <Link to={`/doctor/patients/${patientId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
    <ArrowLeft className="h-3.5 w-3.5" /> Patient overview
  </Link>
);

// ---------------------------------------------------------------------------
// Screen 58 — Care Plan & Recommendations
// ---------------------------------------------------------------------------
const careActions: Array<{ id: CareAction; label: string; detail: string }> = [
  { id: 'REPEAT_ASSESSMENT', label: 'Repeat screening', detail: 'Schedule another comparable session to observe persistence.' },
  { id: 'PREVENTIVE_GUIDANCE', label: 'Preventive guidance', detail: 'Discuss sleep, activity, vascular health, and routine care.' },
  { id: 'FURTHER_EVALUATION', label: 'Further evaluation', detail: 'Arrange clinician review or additional assessment.' },
  { id: 'REFERRAL', label: 'Referral', detail: 'Send to primary care, neurology, geriatrics, or mental health.' },
  { id: 'MONITOR', label: 'Routine monitoring', detail: 'Continue scheduled observation without a new action.' }
];

export const DoctorCarePlanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { patient, assessments, isLoading } = useDoctorPatient(id);
  const { carePlans, profile, saveCarePlan } = useDoctorPortalStore();
  const latest = useMemo(
    () => [...assessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0],
    [assessments]
  );
  const existing = carePlans.find((plan) => plan.patientId === (patient?.patientId || id));
  const [actions, setActions] = useState<CareAction[]>(existing?.actions || []);
  const [repeatWeeks, setRepeatWeeks] = useState<string>(existing?.repeatAssessmentWeeks ? String(existing.repeatAssessmentWeeks) : '');
  const [guidance, setGuidance] = useState(existing?.preventiveGuidance || '');
  const [evaluation, setEvaluation] = useState(existing?.furtherEvaluation || '');
  const [clinician, setClinician] = useState(existing?.responsibleClinician || profile.fullName || user?.name || '');
  const [followUpDate, setFollowUpDate] = useState(existing?.followUpDate || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  if (isLoading) return <div className="p-12 text-center text-[14px] text-muted">Loading care plan…</div>;
  if (!patient) return <div className="p-12 text-center text-[14px] text-muted">Patient not found.</div>;

  const toggleAction = (action: CareAction) => {
    setActions((current) => current.includes(action) ? current.filter((item) => item !== action) : [...current, action]);
    setSaved(false);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (actions.length === 0) return setError('Select at least one approved next step.');
    if (actions.includes('REPEAT_ASSESSMENT') && !repeatWeeks) return setError('Choose a repeat interval for the repeat screening.');
    if (!followUpDate) return setError('Choose a follow-up date.');
    if (!latest) {
      return setError('Complete a screening assessment before approving a care plan, so the plan has a record to refer to.');
    }

    const primaryAction = actions.includes('REPEAT_ASSESSMENT')
      ? 'REPEAT_SCREENING'
      : actions.includes('FURTHER_EVALUATION') || actions.includes('REFERRAL')
        ? 'CLINICAL_REVIEW'
        : actions.includes('PREVENTIVE_GUIDANCE')
          ? 'REVIEW_CONTEXT'
          : 'SUPPORT_FUNCTION';

    const plan = {
      patientId: patient.patientId,
      assessmentId: latest.id,
      actions,
      repeatAssessmentWeeks: repeatWeeks ? Number(repeatWeeks) : '',
      preventiveGuidance: guidance,
      furtherEvaluation: evaluation,
      responsibleClinician: clinician,
      followUpDate,
      notes
    };

    try {
      await doctorApi.saveCarePlan(latest.id, {
        action: primaryAction,
        followUpDate: followUpDate || null,
        notes,
        plan
      });
      saveCarePlan({
        patientId: patient.patientId,
        assessmentId: latest.id,
        actions,
        repeatAssessmentWeeks: repeatWeeks ? Number(repeatWeeks) : '',
        preventiveGuidance: guidance,
        furtherEvaluation: evaluation,
        responsibleClinician: clinician,
        followUpDate,
        notes
      });
      setSaved(true);
    } catch (err: any) {
      setSaved(false);
      setError(err.message || 'The care plan could not be saved.');
    }
  };

  return (
    <div className="space-y-5">
      <BackToPatient patientId={patient.patientId} />
      <DoctorPageHeader
        screen="Screen 58 · Care plan & recommendations"
        title="Care plan & next steps"
        description={`Approve the next steps for ${patient.name}. Recommendations remain discussion prompts until confirmed by the responsible clinician.`}
        actions={<Link to="/doctor/referrals" className={secondaryButton}><Send className="h-4 w-4" /> Referrals</Link>}
      />
      <PatientWorkflowNav patientId={patient.patientId} />

      {saved && <Notice tone="success" title="Care plan approved">The plan has been saved with {profile.fullName || 'the responsible clinician'} as owner.</Notice>}

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Approved next steps</h2>
              <p className="mt-0.5 text-xs text-muted">Select the actions you have clinically approved for this patient.</p>
              <div className="mt-3 space-y-2">
                {careActions.map((action) => (
                  <label key={action.id} className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${actions.includes(action.id) ? 'border-blue-300 bg-blue-50/60' : 'border-line hover:bg-warm'}`}>
                    <input type="checkbox" checked={actions.includes(action.id)} onChange={() => toggleAction(action.id)} className="mt-0.5 h-4 w-4 rounded border-line-strong text-blue-700 focus:ring-blue-500" />
                    <span>
                      <span className="block text-xs font-semibold text-slate-800">{action.label}</span>
                      <span className="mt-0.5 block text-xs leading-4 text-muted">{action.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {actions.includes('REPEAT_ASSESSMENT') && (
              <div>
                <label htmlFor="repeat-weeks" className={labelClass}>Repeat screening interval</label>
                <select id="repeat-weeks" value={repeatWeeks} onChange={(event) => setRepeatWeeks(event.target.value)} className={fieldClass}>
                  <option value="">Select interval</option>
                  <option value="4">4 weeks</option>
                  <option value="8">8 weeks</option>
                  <option value="12">12 weeks</option>
                  <option value="24">24 weeks</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="preventive-guidance" className={labelClass}>Preventive guidance</label>
              <textarea id="preventive-guidance" rows={2} value={guidance} onChange={(event) => setGuidance(event.target.value)} className={fieldClass} placeholder="Sleep routine, physical activity, vascular risk, and safety advice to discuss." />
            </div>
            <div>
              <label htmlFor="further-evaluation" className={labelClass}>Further evaluation</label>
              <textarea id="further-evaluation" rows={2} value={evaluation} onChange={(event) => setEvaluation(event.target.value)} className={fieldClass} placeholder="Additional tests or specialist assessment under consideration." />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="responsible-clinician" className={labelClass}>Responsible clinician</label>
                <input id="responsible-clinician" value={clinician} onChange={(event) => setClinician(event.target.value)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="care-followup" className={labelClass}>Follow-up date</label>
                <input id="care-followup" type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} className={fieldClass} />
              </div>
            </div>
            <div>
              <label htmlFor="care-notes" className={labelClass}>Notes for the care team</label>
              <textarea id="care-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} className={fieldClass} placeholder="Optional context for the next reviewer." />
            </div>

            {error && <p className="text-xs font-semibold text-rose-700" role="alert">{error}</p>}

            <div className="flex flex-col-reverse gap-2 border-t border-line pt-3 sm:flex-row sm:justify-between">
              <Link to={`/doctor/patients/${patient.patientId}/notes`} className={secondaryButton}>Clinical notes</Link>
              <button type="submit" className={primaryButton}><ClipboardCheck className="h-4 w-4" /> Approve & save plan</button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Plan context</h2>
            <dl className="mt-2">
              <InfoRow label="Patient" value={patient.name} />
              <InfoRow label="Latest assessment" value={latest ? formatDate(latest.date) : 'None'} />
              <InfoRow label="Latest score" value={latest ? formatScore(latest.overallScore) : 'Not available'} />
              <InfoRow label="Review status" value={latest?.reviewStatus?.replace(/_/g, ' ').toLowerCase() || 'Not reviewed'} />
              <InfoRow label="Owner" value={clinician || 'Unassigned'} />
            </dl>
            <p className="mt-3 text-xs leading-4 text-muted">
              The plan does not alter the assessment result. It records the clinician-approved response to the review.
            </p>
          </Card>

          {existing ? (
            <Card>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h2 className="text-[14px] font-semibold text-ink">Current approved plan</h2>
              </div>
              <p className="mt-1 text-xs text-muted">Approved {formatDateTime(existing.approvedAt)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {existing.actions.map((action) => <Pill key={action} tone="blue">{action.replace(/_/g, ' ').toLowerCase()}</Pill>)}
              </div>
              <dl className="mt-2">
                {existing.repeatAssessmentWeeks && <InfoRow label="Repeat screen" value={`${existing.repeatAssessmentWeeks} weeks`} />}
                <InfoRow label="Follow-up" value={existing.followUpDate ? formatDate(existing.followUpDate) : 'Not set'} />
                <InfoRow label="Clinician" value={existing.responsibleClinician} />
              </dl>
              {existing.preventiveGuidance && <p className="mt-2 rounded-lg bg-warm p-2.5 text-xs leading-4 text-body">{existing.preventiveGuidance}</p>}
            </Card>
          ) : (
            <Card>
              <h2 className="text-[14px] font-semibold text-ink">No approved plan</h2>
              <p className="mt-2 text-xs leading-4 text-muted">Select next steps and save to create the first clinician-approved plan for this patient.</p>
            </Card>
          )}

          <Card>
            <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Safeguards</h2>
            <ul className="mt-2 space-y-1.5 text-xs leading-4 text-body">
              <li>• Recommendations are discussion prompts, not orders.</li>
              <li>• Screening results cannot establish a diagnosis.</li>
              <li>• Missing or low-quality data should be documented in the plan.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 59 — Referral Management
// ---------------------------------------------------------------------------
const referralTypes: Array<{ value: ReferralType; label: string; destination: string }> = [
  { value: 'PRIMARY_CARE', label: 'Primary care', destination: 'Primary care physician' },
  { value: 'NEUROLOGY', label: 'Neurology', destination: 'Neurology department' },
  { value: 'GERIATRICS', label: 'Geriatrics', destination: 'Geriatric medicine' },
  { value: 'MENTAL_HEALTH', label: 'Mental health', destination: 'Mental health services' }
];

const statusTone = (status: ReferralStatus) => {
  if (status === 'COMPLETED' || status === 'ACKNOWLEDGED') return 'green' as const;
  if (status === 'DECLINED') return 'rose' as const;
  if (status === 'SENT') return 'blue' as const;
  return 'slate' as const;
};

const ReferralWorkspace: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const { profile, referrals, registeredPatients, addReferral, setReferralStatus } = useDoctorPortalStore();
  const { patient, assessments } = useDoctorPatient(patientId);
  const latest = [...assessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const [selectedPatient, setSelectedPatient] = useState(patientId || registeredPatients[0]?.patientId || '');
  const [type, setType] = useState<ReferralType>('NEUROLOGY');
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('Neurology department');
  const [urgency, setUrgency] = useState<'ROUTINE' | 'PRIORITY'>('ROUTINE');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const visibleReferrals = referrals.filter((referral) => !patientId || referral.patientId === patientId);

  const handleType = (value: ReferralType) => {
    setType(value);
    setDestination(referralTypes.find((item) => item.value === value)?.destination || '');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!selectedPatient) return setError('Select a patient for the referral.');
    if (reason.trim().length < 8) return setError('Describe the reason for referral.');

    try {
      const res = await doctorApi.createReferral(selectedPatient, {
        assessmentId: latest?.id || null,
        type,
        reason: reason.trim(),
        destination: destination.trim(),
        urgency,
        status: 'DRAFT'
      });
      const created = res.referral;
      addReferral({
        id: created.id,
        patientId: selectedPatient,
        type: created.type,
        reason: created.reason,
        destination: created.destination,
        urgency: created.urgency,
        status: created.status
      });
      setReason('');
      setSaved(true);
    } catch (err: any) {
      setSaved(false);
      setError(err.message || 'The referral could not be saved.');
    }
  };

  const updateReferralStatus = async (id: string, status: ReferralStatus) => {
    setError('');
    try {
      await doctorApi.updateReferralOutcome(id, { status });
      setReferralStatus(id, status);
    } catch (err: any) {
      setError(err.message || 'The referral status could not be updated.');
    }
  };

  return (
    <>
      {saved && <Notice tone="success" title="Referral draft created">Review the details and mark it as sent when the receiving service has been contacted.</Notice>}
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card padded={false}>
          <div className="border-b border-line px-4 py-3.5">
            <h2 className="text-[14px] font-semibold text-ink">Referral records</h2>
            <p className="mt-0.5 text-xs text-muted">Status tracks the referral through your local workflow.</p>
          </div>
          {visibleReferrals.length === 0 ? (
            <div className="p-6">
              <EmptyState scene="emptySearch" icon={Send} title="No referrals" detail="Create a referral when onward assessment or coordinated care is clinically appropriate." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {visibleReferrals.map((referral) => {
                const referralPatient = registeredPatients.find((item) => item.patientId === referral.patientId);
                return (
                  <li key={referral.id} className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[14px] font-semibold text-ink">
                          {referralTypes.find((item) => item.value === referral.type)?.label || referral.type} · {referral.destination}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {referralPatient?.name || patient?.name || referral.patientId} · {formatDate(referral.createdAt)} · {referral.urgency.toLowerCase()}
                        </p>
                        <p className="mt-1.5 text-xs leading-4 text-body">{referral.reason}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Pill tone={statusTone(referral.status)}>{referral.status.toLowerCase()}</Pill>
                        <select
                          value={referral.status}
                          onChange={(event) => void updateReferralStatus(referral.id, event.target.value as ReferralStatus)}
                          aria-label={`Referral status for ${referral.destination}`}
                          className="rounded-lg border border-line-strong bg-white px-2 py-1 text-xs text-body outline-none focus:border-blue-500"
                        >
                          {['DRAFT', 'SENT', 'ACKNOWLEDGED', 'COMPLETED', 'DECLINED'].map((status) => <option key={status} value={status}>{status.toLowerCase()}</option>)}
                        </select>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-[14px] font-semibold text-ink">New referral</h2>
          <p className="mt-0.5 text-xs leading-4 text-muted">Only the reason and destination are shared with the receiving service after you mark it sent.</p>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            {!patientId && (
              <div>
                <label htmlFor="referral-patient" className={labelClass}>Patient</label>
                <select id="referral-patient" value={selectedPatient} onChange={(event) => setSelectedPatient(event.target.value)} className={fieldClass}>
                  <option value="">Select patient</option>
                  {registeredPatients.map((item) => <option key={item.patientId} value={item.patientId}>{item.name} · {item.patientId}</option>)}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="referral-type" className={labelClass}>Referral type</label>
              <select id="referral-type" value={type} onChange={(event) => handleType(event.target.value as ReferralType)} className={fieldClass}>
                {referralTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="referral-destination" className={labelClass}>Destination</label>
              <input id="referral-destination" value={destination} onChange={(event) => setDestination(event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="referral-reason" className={labelClass}>Reason for referral</label>
              <textarea id="referral-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className={fieldClass} placeholder="Summarise the clinical question and relevant findings. Avoid stating a diagnosis based on screening alone." />
            </div>
            <div>
              <label htmlFor="referral-urgency" className={labelClass}>Urgency</label>
              <select id="referral-urgency" value={urgency} onChange={(event) => setUrgency(event.target.value as typeof urgency)} className={fieldClass}>
                <option value="ROUTINE">Routine</option>
                <option value="PRIORITY">Priority</option>
              </select>
            </div>
            {error && <p className="text-xs font-semibold text-rose-700" role="alert">{error}</p>}
            <button type="submit" className={`${primaryButton} w-full`}><Plus className="h-4 w-4" /> Create draft</button>
          </form>
          {latest && (
            <p className="mt-3 rounded-lg bg-warm p-2.5 text-xs leading-4 text-muted">
              Latest assessment {formatDate(latest.date)} · {formatScore(latest.overallScore)}. Include quality limits in the referral reason where relevant.
            </p>
          )}
        </Card>
      </div>
    </>
  );
};

export const DoctorPatientReferralsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patient, isLoading } = useDoctorPatient(id);
  if (isLoading) return <div className="p-12 text-center text-[14px] text-muted">Loading referrals…</div>;
  if (!patient) return <div className="p-12 text-center text-[14px] text-muted">Patient not found.</div>;
  return (
    <div className="space-y-5">
      <BackToPatient patientId={patient.patientId} />
      <DoctorPageHeader
        screen="Screen 59 · Referral management"
        title={`Referrals · ${patient.name}`}
        description="Create and track onward referrals to primary care, neurology, geriatrics, or mental health services."
      />
      <PatientWorkflowNav patientId={patient.patientId} />
      <ReferralWorkspace patientId={patient.patientId} />
    </div>
  );
};

export const DoctorReferralManagementPage: React.FC = () => {
  const { referrals, registeredPatients } = useDoctorPortalStore();
  return (
    <div className="space-y-5">
      <DoctorPageHeader
        screen="Screen 59 · Referral management"
        title="Referrals"
        description="A single view of onward referrals across your panel, with reason, urgency, and workflow status."
      />
      <div className="grid gap-3 sm:grid-cols-4">
        {(['DRAFT', 'SENT', 'ACKNOWLEDGED', 'COMPLETED'] as ReferralStatus[]).map((status) => (
          <div key={status} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">{status.toLowerCase()}</p>
            <p className="mt-1 text-[22px] font-semibold text-ink">{referrals.filter((item) => item.status === status).length}</p>
          </div>
        ))}
      </div>
      <ReferralWorkspace />
      <Card>
        <h2 className="text-[14px] font-semibold text-ink">Patients in your panel</h2>
        <p className="mt-1 text-xs text-muted">{registeredPatients.length} locally registered. Referral creation currently supports locally registered patients in this workspace.</p>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 60 — Appointments & Follow-ups
// ---------------------------------------------------------------------------
const AppointmentWorkspace: React.FC<{ patientId?: string }> = ({ patientId }) => {
  const { appointments, registeredPatients, addAppointment, setAppointmentStatus } = useDoctorPortalStore();
  const { patient } = useDoctorPatient(patientId);
  const [selectedPatient, setSelectedPatient] = useState(patientId || registeredPatients[0]?.patientId || '');
  const [filter, setFilter] = useState<'UPCOMING' | 'HISTORY' | 'ALL'>('UPCOMING');
  const [form, setForm] = useState({
    title: 'Clinical follow-up',
    type: 'FOLLOW_UP' as 'FOLLOW_UP' | 'REPEAT_ASSESSMENT' | 'RESULTS_REVIEW' | 'TELEHEALTH',
    date: '',
    time: '',
    location: 'Neurology clinic',
    communication: 'Portal notification',
    repeatReminder: true
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const visible = appointments
    .filter((appointment) => !patientId || appointment.patientId === patientId)
    .filter((appointment) => filter === 'ALL' || (filter === 'UPCOMING' ? appointment.status === 'UPCOMING' : appointment.status !== 'UPCOMING'))
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!selectedPatient) return setError('Select a patient.');
    if (!form.date || !form.time) return setError('Choose a date and time.');
    if (!form.title.trim()) return setError('Enter an appointment title.');

    try {
      const res = await doctorApi.createAppointment(selectedPatient, {
        title: form.title.trim(),
        type: form.type,
        date: form.date,
        time: form.time,
        location: form.location.trim() || 'To be confirmed',
        communication: `${form.communication}${form.repeatReminder ? ' · repeat reminder 7 days before' : ''}`
      });
      const created = res.appointment;
      addAppointment({
        id: created.id,
        patientId: selectedPatient,
        title: created.title,
        type: created.type,
        date: created.date,
        time: created.time,
        location: created.location || 'To be confirmed',
        status: created.status,
        communication: created.communication || ''
      });
      setSaved(true);
      setForm((current) => ({ ...current, date: '', time: '' }));
    } catch (err: any) {
      setSaved(false);
      setError(err.message || 'The appointment could not be saved.');
    }
  };

  const updateAppointmentStatus = async (
    id: string,
    status: 'COMPLETED' | 'CANCELLED'
  ) => {
    setError('');
    try {
      await doctorApi.updateAppointment(id, { status });
      setAppointmentStatus(id, status);
    } catch (err: any) {
      setError(err.message || 'The appointment status could not be updated.');
    }
  };

  return (
    <>
      {saved && <Notice tone="success" title="Follow-up scheduled">The appointment is now visible in the patient’s upcoming care timeline.</Notice>}
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card padded={false}>
          <div className="flex flex-col gap-2 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Appointments & follow-ups</h2>
              <p className="mt-0.5 text-xs text-muted">Scheduled reviews, repeat assessments, and communication history.</p>
            </div>
            <div className="flex rounded-lg border border-line bg-warm p-0.5">
              {(['UPCOMING', 'HISTORY', 'ALL'] as const).map((item) => (
                <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${filter === item ? 'bg-white text-ink shadow-card' : 'text-muted'}`}>
                  {item.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <div className="p-6">
              <EmptyState scene="emptyAppointments" icon={CalendarDays} title="No appointments in this view" detail="Schedule a follow-up to coordinate the next clinical review or repeat screening." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((appointment) => {
                const appointmentPatient = registeredPatients.find((item) => item.patientId === appointment.patientId);
                return (
                  <li key={appointment.id} className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[14px] font-semibold text-ink">{appointment.title}</p>
                          <Pill tone={appointment.status === 'UPCOMING' ? 'blue' : appointment.status === 'COMPLETED' ? 'green' : 'slate'}>{appointment.status.toLowerCase()}</Pill>
                          {appointment.type === 'REPEAT_ASSESSMENT' && <Pill tone="amber">repeat screen</Pill>}
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {appointmentPatient?.name || patient?.name || appointment.patientId} · {formatDate(appointment.date)} at {appointment.time}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted"><MapPin className="h-3 w-3" /> {appointment.location}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><BellRing className="h-3 w-3" /> {appointment.communication}</p>
                      </div>
                      {appointment.status === 'UPCOMING' && (
                        <div className="flex shrink-0 gap-1.5">
                          <button type="button" onClick={() => void updateAppointmentStatus(appointment.id, 'COMPLETED')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">Complete</button>
                          <button type="button" onClick={() => void updateAppointmentStatus(appointment.id, 'CANCELLED')} className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-muted">Cancel</button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-[14px] font-semibold text-ink">Schedule a follow-up</h2>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            {!patientId && (
              <div>
                <label htmlFor="appt-patient" className={labelClass}>Patient</label>
                <select id="appt-patient" value={selectedPatient} onChange={(event) => setSelectedPatient(event.target.value)} className={fieldClass}>
                  <option value="">Select patient</option>
                  {registeredPatients.map((item) => <option key={item.patientId} value={item.patientId}>{item.name} · {item.patientId}</option>)}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="appt-title" className={labelClass}>Title</label>
              <input id="appt-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="appt-type" className={labelClass}>Type</label>
              <select id="appt-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as typeof form.type })} className={fieldClass}>
                <option value="FOLLOW_UP">Clinical follow-up</option>
                <option value="REPEAT_ASSESSMENT">Repeat assessment reminder</option>
                <option value="RESULTS_REVIEW">Results review</option>
                <option value="TELEHEALTH">Telehealth</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="appt-date" className={labelClass}>Date</label>
                <input id="appt-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="appt-time" className={labelClass}>Time</label>
                <input id="appt-time" type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className={fieldClass} />
              </div>
            </div>
            <div>
              <label htmlFor="appt-location" className={labelClass}>Location / link</label>
              <input id="appt-location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="appt-communication" className={labelClass}>Patient communication</label>
              <select id="appt-communication" value={form.communication} onChange={(event) => setForm({ ...form, communication: event.target.value })} className={fieldClass}>
                <option>Portal notification</option>
                <option>Email</option>
                <option>SMS</option>
                <option>No reminder</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 text-xs text-body">
              <input type="checkbox" checked={form.repeatReminder} onChange={(event) => setForm({ ...form, repeatReminder: event.target.checked })} className="mt-0.5 h-4 w-4 rounded border-line-strong text-blue-700" />
              Send a repeat reminder 7 days before
            </label>
            {error && <p className="text-xs font-semibold text-rose-700" role="alert">{error}</p>}
            <button type="submit" className={`${primaryButton} w-full`}><CalendarClock className="h-4 w-4" /> Schedule appointment</button>
          </form>
        </Card>
      </div>
    </>
  );
};

export const DoctorAppointmentsPage: React.FC = () => (
  <div className="space-y-5">
    <DoctorPageHeader
      screen="Screen 60 · Appointments & follow-ups"
      title="Appointments & follow-ups"
      description="Schedule clinical follow-ups, repeat assessment reminders, and track patient communication and attendance status."
    />
    <MotionReveal className="mx-auto w-full max-w-2xl">
      <HealthcareScene
        kind="followup"
        className="w-full"
        title="Dr. Mohamed reviewing progress with Haroon in a follow-up consultation"
      />
    </MotionReveal>
    <AppointmentWorkspace />
    <Card>
      <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-ink"><Mail className="h-3.5 w-3.5 text-blue-700" /> Communication note</h2>
      <p className="mt-1 text-xs leading-5 text-muted">
        Reminder details are recorded with the appointment. Actual delivery depends on the patient’s verified contact preferences and is not simulated in this workspace.
      </p>
    </Card>
  </div>
);

export const DoctorPatientAppointmentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { patient, isLoading } = useDoctorPatient(id);
  if (isLoading) return <div className="p-12 text-center text-[14px] text-muted">Loading appointments…</div>;
  if (!patient) return <div className="p-12 text-center text-[14px] text-muted">Patient not found.</div>;
  return (
    <div className="space-y-5">
      <BackToPatient patientId={patient.patientId} />
      <DoctorPageHeader
        screen="Screen 60 · Appointments & follow-ups"
        title={`Appointments · ${patient.name}`}
        description="Schedule the next review or repeat screening and review this patient’s appointment history."
      />
      <PatientWorkflowNav patientId={patient.patientId} />
      <AppointmentWorkspace patientId={patient.patientId} />
    </div>
  );
};
