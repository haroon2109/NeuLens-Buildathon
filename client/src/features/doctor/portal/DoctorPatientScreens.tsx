import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  FileText,
  MapPin,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users
} from 'lucide-react';
import { doctorApi } from '../../../services/portalApi';
import { useAuthStore } from '../../../store/authStore';
import { useDoctorPortalStore } from '../../../store/doctorPortalStore';
import { useDoctorPatient } from './useDoctorPatient';
import { ErrorState, LoadingState } from '../../../components/systemStates';
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
  ReviewStatePill,
  fieldClass,
  formatDate,
  formatScore,
  labelClass,
  primaryButton,
  secondaryButton
} from './ui';

interface PatientRecord {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  language: string;
  assessmentsCount: number;
  latestScore: number | null;
  reviewState: string | null;
  latestAssessmentDate: string | null;
  changeStatus: 'INSUFFICIENT_DATA' | 'NO_CHANGE' | 'REVIEW';
  cognitiveChange: number | null;
  worsenedActivityCount: number;
}

export const DoctorPortalPatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registeredPatients, assignments, profile, clinic } = useDoctorPortalStore();
  const [remotePatients, setRemotePatients] = useState<PatientRecord[]>([]);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [monitoring, setMonitoring] = useState<'ALL' | 'REVIEW' | 'NO_CHANGE' | 'INSUFFICIENT_DATA'>('ALL');
  const [assigned, setAssigned] = useState('ALL');
  const [sort, setSort] = useState<'NAME' | 'RECENT' | 'STATUS'>('RECENT');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isSelecting = searchParams.get('select') === 'true';

  useEffect(() => {
    let cancelled = false;
    doctorApi
      .getPatients()
      .then((rows) => {
        if (!cancelled) {
          setRemotePatients(rows || []);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRemotePatients([]);
          setLoadError(error instanceof Error ? error.message : 'Unable to load hospital directory.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const localRecords: PatientRecord[] = registeredPatients.map((patient) => ({
    id: patient.id,
    patientId: patient.patientId,
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    language: patient.language,
    assessmentsCount: 0,
    latestScore: null,
    reviewState: null,
    latestAssessmentDate: null,
    changeStatus: 'INSUFFICIENT_DATA',
    cognitiveChange: null,
    worsenedActivityCount: 0
  }));

  const allPatients = useMemo(() => {
    const merged = [...localRecords, ...remotePatients];
    return merged.filter((patient, index) => merged.findIndex((candidate) => candidate.patientId === patient.patientId) === index);
  }, [localRecords, remotePatients]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    const rows = allPatients.filter((patient) => {
      const matchesText =
        !text ||
        patient.name.toLowerCase().includes(text) ||
        patient.patientId.toLowerCase().includes(text);
      const matchesMonitoring = monitoring === 'ALL' || patient.changeStatus === monitoring;
      const patientAssigned = assignments[patient.patientId] || profile.fullName;
      const matchesAssigned = assigned === 'ALL' || patientAssigned === assigned;
      return matchesText && matchesMonitoring && matchesAssigned;
    });

    return rows.sort((a, b) => {
      if (sort === 'NAME') return a.name.localeCompare(b.name);
      if (sort === 'STATUS') {
        const order = { REVIEW: 0, NO_CHANGE: 1, INSUFFICIENT_DATA: 2 };
        return order[a.changeStatus] - order[b.changeStatus];
      }
      return (b.latestAssessmentDate || '').localeCompare(a.latestAssessmentDate || '');
    });
  }, [allPatients, query, monitoring, assigned, sort, assignments, profile.fullName, clinic.otherClinicians]);

  const clinicianOptions = Array.from(
    new Set([profile.fullName, ...Object.values(assignments), ...clinic.otherClinicians.map((clinician) => clinician.name)].filter(Boolean))
  );

  const reviewCount = allPatients.filter((patient) => patient.changeStatus === 'REVIEW').length;

  return (
    <div className="space-y-6">
      <DoctorPageHeader
        screen="Screen 50 · Patient list"
        title="Patient directory"
        description="Search the hospital record, filter by monitoring state or assigned clinician, and open a patient file for review."
        actions={
          <>
            <Link to="/doctor/patients/new" className={primaryButton}>
              <Plus className="h-4 w-4" /> Register patient
            </Link>
            <Link to="/doctor/patients?select=true" className={secondaryButton}>
              <Play className="h-4 w-4" /> Start screening
            </Link>
          </>
        }
      />

      {isSelecting && (
        <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-950 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4" /> Choose a patient to launch the screening battery.
          </p>
          <button type="button" onClick={() => navigate('/doctor/patients')} className="text-xs font-semibold text-blue-700">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Panel size</p>
          <p className="mt-1 text-[22px] font-semibold text-ink">{allPatients.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Monitoring</p>
          <p className="mt-1 text-[14px] font-semibold text-ink">{allPatients.length - reviewCount} without a current review cue</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-amber-800">Review prompts</p>
          <p className="mt-1 text-[22px] font-semibold text-amber-950">{reviewCount}</p>
        </div>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <label htmlFor="patient-search" className={labelClass}>Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="patient-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name or patient ID"
                className={`${fieldClass} pl-9`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="monitoring-filter" className={labelClass}>Monitoring status</label>
            <select id="monitoring-filter" value={monitoring} onChange={(event) => setMonitoring(event.target.value as typeof monitoring)} className={fieldClass}>
              <option value="ALL">All statuses</option>
              <option value="REVIEW">Review prompt</option>
              <option value="NO_CHANGE">Stable</option>
              <option value="INSUFFICIENT_DATA">More data needed</option>
            </select>
          </div>
          <div>
            <label htmlFor="assigned-filter" className={labelClass}>Assigned doctor</label>
            <select id="assigned-filter" value={assigned} onChange={(event) => setAssigned(event.target.value)} className={fieldClass}>
              <option value="ALL">All clinicians</option>
              {clinicianOptions.map((clinician) => (
                <option key={clinician} value={clinician}>{clinician}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort-filter" className={labelClass}>Sort by</label>
            <select id="sort-filter" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className={fieldClass}>
              <option value="RECENT">Most recent assessment</option>
              <option value="NAME">Patient name</option>
              <option value="STATUS">Review priority</option>
            </select>
          </div>
        </div>
        {loadError && <p className="mt-3 text-xs text-amber-700">Hospital directory unavailable; showing locally registered patients only.</p>}
      </Card>

      <Card padded={false}>
        {loading ? (
          <p className="p-10 text-center text-xs text-muted">Loading patient directory…</p>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              scene="emptySearch"
              icon={Users}
              title="No patients match these filters"
              detail="Try a different search, monitoring status, or clinician. Newly registered patients appear here immediately."
              action={<Link to="/doctor/patients/new" className={primaryButton}><Plus className="h-4 w-4" /> Register a patient</Link>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="border-b border-line bg-warm/70 text-xs font-bold uppercase tracking-[0.08em] text-muted">
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Age / sex</th>
                  <th className="px-4 py-3">Last assessment</th>
                  <th className="px-4 py-3">Monitoring</th>
                  <th className="px-4 py-3">Assigned doctor</th>
                  <th className="px-4 py-3">Latest score</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs">
                {filtered.map((patient) => (
                  <tr key={patient.patientId} className="hover:bg-warm/70">
                    <td className="px-4 py-3.5">
                      <Link to={`/doctor/patients/${patient.patientId}`} className="font-semibold text-ink hover:text-blue-700">
                        {patient.name}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-muted">{patient.patientId}</p>
                    </td>
                    <td className="px-4 py-3.5 text-body">
                      {patient.age} yrs · {patient.gender}
                      <p className="text-xs text-muted">{patient.language.toUpperCase()}</p>
                    </td>
                    <td className="px-4 py-3.5 text-body">
                      {patient.latestAssessmentDate ? (
                        <>
                          {formatDate(patient.latestAssessmentDate)}
                          <p className="text-xs text-muted">{patient.assessmentsCount} session{patient.assessmentsCount === 1 ? '' : 's'}</p>
                        </>
                      ) : (
                        <span className="text-muted">Not screened</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <ChangePill status={patient.changeStatus} />
                      {patient.worsenedActivityCount > 0 && (
                        <p className="mt-1 text-xs text-amber-700">{patient.worsenedActivityCount} function change{patient.worsenedActivityCount === 1 ? '' : 's'}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-body">{assignments[patient.patientId] || profile.fullName}</td>
                    <td className="px-4 py-3.5">
                      {patient.latestScore !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-ink">{Math.round(patient.latestScore)}</span>
                          <ReviewStatePill state={patient.reviewState} />
                        </div>
                      ) : (
                        <Pill tone="slate">No score</Pill>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/doctor/patients/${patient.patientId}/screen`} className="rounded-lg p-2 text-blue-700 hover:bg-blue-50" title="Start screening" aria-label={`Start screening for ${patient.name}`}>
                          <Play className="h-3.5 w-3.5" />
                        </Link>
                        <Link to={`/doctor/patients/${patient.patientId}`} className="rounded-lg p-2 text-body hover:bg-warm" title="Open patient file" aria-label={`Open ${patient.name}`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 51 — Add / Register Patient
// ---------------------------------------------------------------------------
export const AddPatientPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, clinic, addPatient } = useDoctorPortalStore();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    dob: '',
    age: '',
    gender: 'Female',
    language: 'en',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    conditions: '',
    medications: '',
    allergies: '',
    familyHistory: '',
    assignedDoctor: profile.fullName || user?.name || '',
    consentConfirmed: false,
    sendInvitation: true,
    invitationEmail: ''
  });

  const update = (field: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }));

  const clinicianOptions = [profile.fullName, ...clinic.otherClinicians.map((clinician) => clinician.name)].filter(Boolean);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const age = Number(form.age);
    if (form.name.trim().length < 2) return setError('Enter the patient’s full name.');
    if (!form.dob) return setError('Enter the patient’s date of birth.');
    if (!Number.isFinite(age) || age < 0 || age > 120) return setError('Enter a valid age.');
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Enter a valid patient email address.');
    if (!form.phone.trim()) return setError('Enter a contact phone number.');
    if (!form.consentConfirmed) return setError('Confirm that the patient has consented to screening and record use.');
    if (form.sendInvitation && form.invitationEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.invitationEmail.trim())) {
      return setError('Enter a valid invitation email address.');
    }

    const patientId = addPatient({
      name: form.name.trim(),
      age,
      dob: form.dob,
      gender: form.gender,
      email: form.email.trim(),
      phone: form.phone.trim(),
      language: form.language,
      conditions: [form.conditions, form.allergies && `Allergies: ${form.allergies}`].filter(Boolean).join('; '),
      medications: form.medications,
      familyHistory: form.familyHistory,
      assignedDoctor: form.assignedDoctor || profile.fullName,
      consentConfirmed: true,
      invitationStatus: form.sendInvitation ? 'SENT' : 'NOT_SENT',
      invitationEmail: form.sendInvitation ? form.invitationEmail.trim() || form.email.trim() : ''
    });
    navigate(`/doctor/patients/${patientId}?registered=true`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/doctor/patients" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to patient directory
      </Link>
      <DoctorPageHeader
        screen="Screen 51 · Add / register patient"
        title="Register a patient"
        description="Create a hospital-local patient record, record consent, and optionally send a portal invitation. Screening is support for clinical review, not a diagnosis."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800" role="alert">{error}</div>}

        <Card>
          <h2 className="text-[14px] font-semibold text-ink">Basic information</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="add-name" className={labelClass}>Full name</label>
              <input id="add-name" value={form.name} onChange={(event) => update('name', event.target.value)} className={fieldClass} placeholder="e.g. Eleanor Vance" autoComplete="off" />
            </div>
            <div>
              <label htmlFor="add-dob" className={labelClass}>Date of birth</label>
              <input id="add-dob" type="date" value={form.dob} onChange={(event) => {
                const dob = event.target.value;
                const age = dob ? Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))) : '';
                setForm((current) => ({ ...current, dob, age: String(age) }));
              }} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="add-age" className={labelClass}>Age</label>
              <input id="add-age" type="number" min="0" max="120" value={form.age} onChange={(event) => update('age', event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="add-gender" className={labelClass}>Sex / gender</label>
              <select id="add-gender" value={form.gender} onChange={(event) => update('gender', event.target.value)} className={fieldClass}>
                {['Female', 'Male', 'Non-binary', 'Prefer not to say'].map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="add-language" className={labelClass}>Preferred language</label>
              <select id="add-language" value={form.language} onChange={(event) => update('language', event.target.value)} className={fieldClass}>
                <option value="en">English</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="hi">Hindi</option>
                <option value="bn">Bengali</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-[14px] font-semibold text-ink">Contact details</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="add-email" className={labelClass}>Email</label>
              <input id="add-email" type="email" value={form.email} onChange={(event) => {
                const email = event.target.value;
                setForm((current) => ({
                  ...current,
                  email,
                  // Keep a deliberately different invitation address, but follow
                  // the main email while the invitation field is untouched.
                  invitationEmail:
                    current.invitationEmail && current.invitationEmail !== current.email
                      ? current.invitationEmail
                      : email
                }));
              }} className={fieldClass} placeholder="patient@domain.com" />
            </div>
            <div>
              <label htmlFor="add-phone" className={labelClass}>Phone</label>
              <input id="add-phone" type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} className={fieldClass} placeholder="+91 98765 43210" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="add-address" className={labelClass}>Address <span className="font-normal text-muted">(optional)</span></label>
              <input id="add-address" value={form.address} onChange={(event) => update('address', event.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="add-emergency" className={labelClass}>Emergency contact <span className="font-normal text-muted">(optional)</span></label>
              <input id="add-emergency" value={form.emergencyContact} onChange={(event) => update('emergencyContact', event.target.value)} className={fieldClass} placeholder="Name and phone" />
            </div>
            <div>
              <label htmlFor="add-clinician" className={labelClass}>Assigned clinician</label>
              <select id="add-clinician" value={form.assignedDoctor} onChange={(event) => update('assignedDoctor', event.target.value)} className={fieldClass}>
                {clinicianOptions.map((clinician) => <option key={clinician}>{clinician}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-[14px] font-semibold text-ink">Clinical details for context</h2>
          <p className="mt-0.5 text-xs leading-4 text-muted">These details help interpret screening results but do not alter the scoring engine.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="add-conditions" className={labelClass}>Known conditions</label>
              <textarea id="add-conditions" rows={2} value={form.conditions} onChange={(event) => update('conditions', event.target.value)} className={fieldClass} placeholder="e.g. Hypertension, type 2 diabetes" />
            </div>
            <div>
              <label htmlFor="add-medications" className={labelClass}>Current medications</label>
              <textarea id="add-medications" rows={2} value={form.medications} onChange={(event) => update('medications', event.target.value)} className={fieldClass} placeholder="Name, dose, frequency" />
            </div>
            <div>
              <label htmlFor="add-allergies" className={labelClass}>Allergies</label>
              <input id="add-allergies" value={form.allergies} onChange={(event) => update('allergies', event.target.value)} className={fieldClass} placeholder="e.g. Penicillin" />
            </div>
            <div>
              <label htmlFor="add-family" className={labelClass}>Family history</label>
              <input id="add-family" value={form.familyHistory} onChange={(event) => update('familyHistory', event.target.value)} className={fieldClass} placeholder="Relevant neurological or vascular history" />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-[14px] font-semibold text-ink">Consent and invitation</h2>
          <div className="mt-3 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3">
              <input type="checkbox" checked={form.consentConfirmed} onChange={(event) => update('consentConfirmed', event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-line-strong text-blue-700 focus:ring-blue-500" />
              <span>
                <span className="block text-xs font-semibold text-slate-800">Patient consent confirmed</span>
                <span className="mt-0.5 block text-xs leading-4 text-muted">The patient has agreed to complete screening tasks and for results to be reviewed by the care team.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3">
              <input type="checkbox" checked={form.sendInvitation} onChange={(event) => update('sendInvitation', event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-line-strong text-blue-700 focus:ring-blue-500" />
              <span>
                <span className="block text-xs font-semibold text-slate-800">Send portal invitation</span>
                <span className="mt-0.5 block text-xs leading-4 text-muted">Invite the patient to create their sign-in and complete baseline context before the first assessment.</span>
              </span>
            </label>
            {form.sendInvitation && (
              <div>
                <label htmlFor="add-invite-email" className={labelClass}>Invitation email</label>
                <input id="add-invite-email" type="email" value={form.invitationEmail} onChange={(event) => update('invitationEmail', event.target.value)} className={fieldClass} />
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <Link to="/doctor/patients" className={secondaryButton}>Cancel</Link>
          <button type="submit" className={primaryButton}>
            <UserRound className="h-4 w-4" /> Register patient
          </button>
        </div>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screen 52 — Patient Overview
// ---------------------------------------------------------------------------
export const DoctorPatientOverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const {
    notes,
    appointments,
    clinicalContexts,
    assignments,
    registeredPatients,
    changeAcknowledgements
  } = useDoctorPortalStore();
  const result = useDoctorPatient(id);
  const { patient, assessments, changeSummary, isLoading, error } = result;
  const isLocal = ('isLocal' in result ? result.isLocal : false) ?? false;
  const wasJustRegistered = searchParams.get('registered') === 'true';

  const sortedAssessments = useMemo(
    () => [...assessments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [assessments]
  );
  const latest = sortedAssessments[0];
  const local = registeredPatients.find((item) => item.patientId === (patient?.patientId || id) || item.id === patient?.id);
  const patientKey = patient?.patientId || id || '';
  const context = clinicalContexts[patientKey];
  const patientNotes = notes.filter((note) => note.patientId === patientKey);
  const nextAppointment = appointments
    .filter((appointment) => appointment.patientId === patientKey && appointment.status === 'UPCOMING')
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0];
  const comparables = sortedAssessments.filter((assessment) => assessment.taskResponses?.quality?.comparable !== false);
  const baselineStatus =
    comparables.length >= 3 ? 'Established' : comparables.length > 0 ? `Building · ${comparables.length} of 3` : 'Not established';
  const acknowledgement = changeAcknowledgements.find((item) => item.patientId === patientKey);
  const displayName = patient?.name || local?.name || 'Patient record';

  if (!id) return null;

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Loading patient record" detail="Fetching assessments, change summary and quality flags." />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <ErrorState
          title="Patient record unavailable"
          description={error || 'This patient could not be found in the hospital directory.'}
          secondaryAction={<Link to="/doctor/patients" className={secondaryButton}>Back to patient directory</Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {wasJustRegistered && (
        <Notice tone="success" title="Patient registered">
          Hospital ID <span className="font-mono font-bold">{patient.patientId}</span> is now in your panel. No assessment has been completed yet.
        </Notice>
      )}

      <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-[16px] font-bold text-blue-800">
            {displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Screen 52 · Patient overview</p>
            <h1 className="mt-1 text-[25px] font-semibold tracking-[-0.03em] text-ink">{displayName}</h1>
            <p className="mt-1 text-xs text-muted">
              <span className="font-mono">{patient.patientId}</span> · {patient.age} years · {patient.gender || 'Not recorded'} · {patient.language?.toUpperCase() || 'EN'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ChangePill status={changeSummary?.status || 'INSUFFICIENT_DATA'} />
              <ReviewPill status={latest?.reviewStatus} />
              {latest && <ReviewStatePill state={latest.reviewState} />}
              {isLocal && <Pill tone="slate">Local registration · no screening yet</Pill>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/doctor/patients/${patient.patientId}/dossier`} className={secondaryButton}>
            Full dossier
          </Link>
          <Link to={`/doctor/patients/${patient.patientId}/notes`} className={secondaryButton}>
            <FileText className="h-4 w-4" /> Add finding
          </Link>
          <Link to={`/doctor/patients/${patient.patientId}/screen`} className={primaryButton}>
            <Play className="h-4 w-4" /> Start screening
          </Link>
        </div>
      </div>

      <PatientWorkflowNav patientId={patient.patientId} />

      <Notice tone="info" title="Clinical use">
        Screening results support—but do not replace—clinical assessment. Interpret scores alongside session quality, missing tasks, health context, and the patient’s own baseline.
      </Notice>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-ink">Latest assessment</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {latest ? `${formatDate(latest.date)} · ${latest.assessmentType || 'Full screening'}` : 'No completed assessment'}
                </p>
              </div>
              {latest && (
                <Link to={`/doctor/patients/${patient.patientId}/review`} className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                  Open review
                </Link>
              )}
            </div>

            {latest ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <MetricTile
                    label="Overall score"
                    value={latest.overallScore === null ? 'Not interpretable' : `${Math.round(latest.overallScore)} / 100`}
                    detail={latest.overallScore === null ? 'Session produced no interpretable score' : 'Descriptive task accuracy'}
                  />
                  <MetricTile
                    label="Review state"
                    value={latest.reviewState ? latest.reviewState.replace(/_/g, ' ').toLowerCase() : 'Not set'}
                    detail="Administrative — not a diagnosis or risk tier"
                  />
                  <MetricTile label="Review" value={(latest.reviewStatus || 'PENDING_REVIEW').replace(/_/g, ' ').toLowerCase()} detail={latest.reviewedBy || 'No reviewer recorded'} />
                  <MetricTile label="Comparison" value={baselineStatus} detail={`${comparables.length} comparable session${comparables.length === 1 ? '' : 's'}`} />
                </div>
                <p className="mt-3 rounded-xl bg-warm p-3 text-xs leading-5 text-body">
                  {changeSummary?.status === 'REVIEW'
                    ? 'Within-person signals are present. Review the evidence and context before deciding whether this reflects a meaningful change.'
                    : changeSummary?.status === 'NO_CHANGE'
                      ? 'No within-person review cue is currently flagged in the latest comparable sessions.'
                      : 'Not enough comparable history is available to describe within-person change. Avoid interpreting this session as a trend.'}
                </p>
              </>
            ) : (
              <div className="mt-4">
                <EmptyState
                  scene="emptyAssessment"
                  icon={Activity}
                  title="No assessments yet"
                  detail="This record was registered recently. Start a screening session to establish the first observation."
                  action={<Link to={`/doctor/patients/${patient.patientId}/screen`} className={primaryButton}><Play className="h-4 w-4" /> Start screening</Link>}
                />
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-ink">Assessment timeline</h2>
                <p className="mt-0.5 text-xs text-muted">Most recent sessions first. Missing or low-quality sessions are labelled.</p>
              </div>
              <Link to={`/doctor/patients/${patient.patientId}/longitudinal`} className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                View trends
              </Link>
            </div>
            {sortedAssessments.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-line-strong bg-warm p-4 text-xs text-muted">No sessions on file.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {sortedAssessments.slice(0, 6).map((assessment, index) => (
                  <li key={assessment.id} className="relative flex gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                    <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-blue-700 text-white' : 'bg-warm text-body'}`}>
                      {sortedAssessments.length - index}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">{formatDate(assessment.date)}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-warm px-1.5 py-0.5 text-xs font-bold text-body">{formatScore(assessment.overallScore)}</span>
                          <ReviewPill status={assessment.reviewStatus} />
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {assessment.assessmentType || 'Full screening'} · {assessment.taskResponses?.quality?.comparable === false ? 'Limited comparability' : 'Comparable'}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Patient details</h2>
            <dl className="mt-2">
              <InfoRow label="Hospital ID" value={<span className="font-mono text-xs">{patient.patientId}</span>} />
              <InfoRow label="Date of birth" value={patient.dob ? formatDate(patient.dob) : local?.dob ? formatDate(local.dob) : 'Not recorded'} />
              <InfoRow label="Language" value={(patient.language || local?.language || 'en').toUpperCase()} />
              <InfoRow label="Email" value={patient.email || local?.email || 'Not recorded'} />
              <InfoRow label="Phone" value={patient.phone || local?.phone || 'Not recorded'} />
              <InfoRow label="Assigned clinician" value={assignments[patientKey] || local?.assignedDoctor || user?.name || 'Unassigned'} />
              <InfoRow label="Consent" value={local?.consentConfirmed === false ? 'Pending' : 'Confirmed'} />
            </dl>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[14px] font-semibold text-ink">Health context</h2>
              <Link to={`/doctor/patients/${patient.patientId}/context`} className="text-xs font-semibold text-blue-700">Review</Link>
            </div>
            {context ? (
              <dl className="mt-2">
                <InfoRow label="Sleep" value={`${context.sleepHours} h · quality ${context.sleepQuality}/5`} />
                <InfoRow label="Activity" value={`${context.activityLevel}/5`} />
                <InfoRow label="Stress" value={`${context.stressLevel}/5`} />
                <InfoRow label="Conditions" value={context.conditions?.join(', ') || 'None recorded'} />
                <InfoRow label="Medications" value={context.medications?.join(', ') || 'None recorded'} />
              </dl>
            ) : (
              <p className="mt-2 rounded-xl border border-dashed border-line-strong bg-warm p-3 text-xs leading-4 text-muted">
                No health-context record has been shared. Context can be reviewed during the session or entered by the patient.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Upcoming appointment</h2>
            {nextAppointment ? (
              <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-950">{nextAppointment.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-blue-800">
                  <CalendarClock className="h-3 w-3" /> {formatDate(nextAppointment.date)} at {nextAppointment.time}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-blue-800">
                  <MapPin className="h-3 w-3" /> {nextAppointment.location}
                </p>
                <Link to="/doctor/appointments" className="mt-2 inline-block text-xs font-semibold text-blue-700">Manage appointment</Link>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-xs leading-4 text-muted">No follow-up scheduled.</p>
                <Link to="/doctor/appointments" className={`${secondaryButton} mt-2`}>
                  <CalendarDays className="h-3.5 w-3.5" /> Schedule
                </Link>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[14px] font-semibold text-ink">Review history</h2>
              <Link to={`/doctor/patients/${patient.patientId}/notes`} className="text-xs font-semibold text-blue-700">All notes</Link>
            </div>
            {patientNotes.length === 0 ? (
              <p className="mt-2 text-xs leading-4 text-muted">No clinical notes saved for this patient.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {patientNotes.slice(0, 3).map((note) => (
                  <li key={note.id} className="rounded-lg border border-line bg-warm/60 p-2.5">
                    <p className="text-xs font-semibold text-slate-800">{note.decision.replace(/_/g, ' ').toLowerCase()}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted">{note.observations}</p>
                    <p className="mt-1 text-xs text-muted">{formatDate(note.createdAt)} · {note.author}</p>
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
