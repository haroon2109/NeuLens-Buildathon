import React, { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useDoctorPortalStore } from '../../../store/doctorPortalStore';
import { useDoctorPatient } from './useDoctorPatient';
import type { ClinicalReportCardProps } from './types';
import { LoadingState } from '../../../components/systemStates';



import {
  FileText,
  Users,
} from 'lucide-react';
import {
  DoctorPageHeader,
  PatientWorkflowNav,
  EmptyState,
  Card,
  Toggle,
  InfoRow,
  Notice,
  ReviewStatePill,
  ReviewPill,
  ChangePill,
  MetricTile,
  fieldClass,
  labelClass,
  primaryButton,
  secondaryButton,
  dangerButton,
  formatDate,
  formatDateTime,
  formatScore,
} from './ui';

/* ---------------------------------------------------------------
 * Screen 61 — Doctor Reports (Clinical Report Center)
 * --------------------------------------------------------------- */


const printWindow = (title: string, rows: Array<{ label: string; value: string }>) => {
  const html = [
    '<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title>',
    '<style>body{font-family:system-ui,Segoe UI,Roboto,sans-serif;margin:32px;color:#0f172a;}h1{font-size:20px;margin:0 0 4px;}h2{font-size:12px;margin:18px 0 6px;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:4px;}table{width:100%;border-collapse:collapse;font-size:13px;}td{padding:5px 8px;border-bottom:1px solid #e2e8f0;}td:first-child{font-weight:600;width:42%;}footer{margin-top:24px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:8px;}</style>',
    '</head><body>',
    '<h1>' + escapeHtml(title) + '</h1>',
    rows.map((r) => '<h2>' + escapeHtml(r.label) + '</h2>' + (r.value ? '<table>' + r.value.split('\n').map((line) => '<tr><td>' + escapeHtml(line) + '</td></tr>').join('') + '</table>' : '<p style="color:#94a3b8;">No data recorded.</p>')).join(''),
    '<footer>Generated from NeuLens clinical screening portal · ' + new Date().toLocaleString() + '</footer>',
    '</body></html>'
  ].join('');
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  if (typeof win.print === 'function') {
    setTimeout(() => win.print(), 50);
  }
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[c] ?? c;
  });

const ReportCenterCard: React.FC<{
  patients: Array<{ id: string; patientId: string; name: string; age: number; reviewState?: string | null }>;
  onSelect: (id: string) => void;
  selectedId: string | null;
}> = ({ patients, onSelect, selectedId }) => (
  <Card padded>
    <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted mb-3">Patient report center</h2>
    {patients.length === 0 ? (
      <EmptyState scene="emptySearch" icon={Users} title="No patients on file" detail="Register patients to generate clinical reports." />
    ) : (
      <ul className="space-y-1.5">
        {patients.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              className={`w-full text-left rounded-xl border px-3.5 py-3 text-xs transition ${
                selectedId === p.id ? 'border-blue-300 bg-blue-50/70 text-ink font-semibold' : 'border-line bg-white text-body hover:bg-warm'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{p.name}</span>
                <span className="text-xs text-muted">{p.age} yrs</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs text-muted truncate">{p.patientId}</span>
                <span className="ml-auto"><ReviewStatePill state={p.reviewState} /></span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    )}
  </Card>
);

const ClinicalReportCard: React.FC<ClinicalReportCardProps> = ({ patient, assessments, changeSummary, changeAcknowledgements, notes, referrals, appointments, onPrint }) => {
  const latest = assessments[0] ?? null;
  return (
    <div className="space-y-4">
      <Card padded>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Clinical report</p>
            <h3 className="mt-2 text-[17px] font-semibold text-ink">{patient.name}</h3>
            <p className="mt-1 text-[14px] text-body">{patient.age} yrs · {patient.gender ?? 'Not recorded'} · {patient.patientId}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onPrint} className={primaryButton}>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print
            </button>
            <Link to="/doctor/reports" className={secondaryButton}>Close</Link>
          </div>
        </div>
        {latest && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <MetricTile label="Latest screening" value={formatDate(latest.date) || 'Not available'} detail={latest.assessmentType ? `Type: ${latest.assessmentType}` : 'Standard battery'} />
            <MetricTile
              label="Overall score"
              value={formatScore(latest.overallScore)}
            />
            <div className="rounded-xl border border-line bg-warm/60 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Review status</p>
              <div className="mt-1.5"><ReviewPill status={latest.reviewStatus} /></div>
            </div>
          </div>
        )}
        {latest && (
          <div className="mt-4 rounded-xl border border-line bg-warm/60 p-4 text-[14px] leading-6 text-body">
            <p className="font-semibold text-ink mb-1">Screening recommendation</p>
            {latest.report?.recommendation ? <p className="whitespace-pre-line">{latest.report.recommendation}</p> : <p className="text-muted italic">No recommendation recorded for this session.</p>}
            {latest.report?.doctorNotes ? (
              <>
                <p className="mt-3 font-semibold text-ink">Reviewer notes</p>
                <p className="whitespace-pre-line">{latest.report.doctorNotes}</p>
              </>
            ) : null}
          </div>
        )}
      </Card>

      <Card padded>
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted mb-3">Assessment history</h2>
        {assessments.length === 0 ? (
          <p className="text-[14px] text-muted">No assessments recorded for this patient.</p>
        ) : (
          <ul className="space-y-2">
            {assessments.map((a) => (
              <li key={a.id} className="rounded-xl border border-line bg-white p-3.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{formatDate(a.date)}</span>
                  <span className="text-xs text-muted">{a.assessmentType ?? 'Standard'}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                  <InfoRow label="Overall score" value={formatScore(a.overallScore)} />
                  <InfoRow label="Review state" value={String(a.reviewState || 'NOT_REVIEWED').replace(/_/g, ' ').toLowerCase()} />
                  <InfoRow label="Status" value={a.status} />
                  <InfoRow label="Review" value={<ReviewPill status={a.reviewStatus} />} />
                </div>
                {a.reviewedBy && (
                  <p className="mt-2 text-xs text-muted">Reviewed by {a.reviewedBy} · {formatDateTime(a.reviewedAt ?? '')}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {changeSummary && (
        <Card padded>
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted mb-3">Change summary</h2>
          <div className="flex items-center gap-2 mb-3">
            <ChangePill status={changeSummary.status === 'REVIEW' ? 'REVIEW' : changeSummary.status === 'NO_CHANGE' ? 'NO_CHANGE' : 'REVIEW'} />
            <span className="text-[14px] font-semibold text-body">
              {changeSummary.status === 'INSUFFICIENT_DATA' ? 'Not enough comparable data' : changeSummary.status === 'NO_CHANGE' ? 'No notable change detected' : 'Review suggested'}
            </span>
          </div>
          <InfoRow label="Latest score" value={changeSummary.cognitive.latestScore !== null ? `${Math.round(changeSummary.cognitive.latestScore)} / 100` : 'Missing'} />
          <InfoRow label="Previous score" value={changeSummary.cognitive.previousScore !== null ? `${Math.round(changeSummary.cognitive.previousScore)} / 100` : 'Missing'} />
          <InfoRow label="Change" value={changeSummary.cognitive.change !== null ? `${changeSummary.cognitive.change > 0 ? '+' : ''}${changeSummary.cognitive.change.toFixed(1)} pts` : '—'} />
          <InfoRow label="Comparable assessments" value={String(changeSummary.cognitive.comparableAssessments)} />
          <InfoRow label="Decline beyond measured variability" value={changeSummary.cognitive.declineBeyondReliableChange ? 'Yes' : 'No'} />
          <InfoRow
            label="Reliable-change threshold"
            value={changeSummary.cognitive.reliability.reliableChangeThreshold != null ? `±${changeSummary.cognitive.reliability.reliableChangeThreshold} pts` : 'Not established'}
          />
          {changeSummary.reviewReasons.length > 0 && (
            <div className="mt-2 text-xs text-body">
              <p className="font-semibold mb-1">Review reasons</p>
              <ul className="list-disc list-inside space-y-0.5">
                {changeSummary.reviewReasons.map((r) => (
                  <li key={r}>{r.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {changeAcknowledgements.length > 0 && (
        <Card padded>
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted mb-3">Change acknowledgements</h2>
          <ul className="space-y-1.5 text-xs">
            {changeAcknowledgements.map((a) => (
              <li key={a.id} className="rounded-lg border border-line bg-white px-3 py-2">
                <span className="font-semibold">{a.status}</span>
                <span className="ml-2 text-muted">{formatDateTime(a.acknowledgedAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {notes.length > 0 && (
        <Card padded>
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted mb-3">Clinical notes</h2>
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-line bg-white p-3.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{formatDate(n.createdAt)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${n.decision === 'CLINICAL_REVIEW' ? 'bg-rose-100 text-rose-800' : n.decision === 'REFER' ? 'bg-blue-100 text-blue-800' : n.decision === 'MONITOR' ? 'bg-amber-100 text-amber-800' : 'bg-warm text-body'}`}>{n.decision}</span>
                </div>
                {n.observations && <p className="mt-2 text-body whitespace-pre-line">{n.observations}</p>}
                {n.interpretation && <p className="mt-1.5 text-body whitespace-pre-line">{n.interpretation}</p>}
                {n.followUpRequired && n.followUpDate && <p className="mt-1.5 text-rose-700 font-semibold">Follow-up · {formatDate(n.followUpDate)}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {referrals.length > 0 && (
        <Card padded>
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted mb-3">Referrals</h2>
          <ul className="space-y-2 text-xs">
            {referrals.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-white p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold capitalize">{r.type.replace(/_/g, ' ')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.status === 'SENT' ? 'bg-blue-100 text-blue-800' : r.status === 'ACKNOWLEDGED' ? 'bg-emerald-100 text-emerald-800' : r.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-warm text-body'}`}>{r.status}</span>
                </div>
                <p className="mt-1.5 text-body">{r.reason}</p>
                <div className="mt-2 flex items-center gap-3 text-muted">
                  <span>{r.destination}</span>
                  <span>{r.urgency}</span>
                  <span>{formatDate(r.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {appointments.length > 0 && (
        <Card padded>
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted mb-3">Appointments</h2>
          <ul className="space-y-1.5 text-xs">
            {appointments.map((a) => (
              <li key={a.id} className="rounded-lg border border-line bg-white px-3 py-2 flex items-center justify-between">
                    <span>{a.title}</span>
                    <span className="text-muted">{formatDate(a.date)} · {a.time}</span>
                  </li>
            ))}
          </ul>
        </Card>
      )}

      <Notice tone="info" title="Clinical report">
        This report summarizes screening sessions and clinician notes. It supports review and care planning; it is not a diagnosis and does not replace a clinical evaluation.
      </Notice>
    </div>
  );
};

interface ReportRow {
  label: string;
  value: string;
}

const buildReportRows = (latest: { overallScore: number; assessmentType?: string | null; taskResponses?: Record<string, any> | null; eyeMetrics?: { reactionTime?: number; blinkRate?: number; fixationScore?: number } | null; voiceMetrics?: { speechRate?: number; pauseScore?: number; jitter?: number; shimmer?: number } | null; faceMetrics?: { symmetry?: number; tremorScore?: number } | null } | null, changeSummary: { status: string; cognitive: { latestScore: number | null; previousScore: number | null; change: number | null; baselineRange: { minimum: number; maximum: number } | null; comparableAssessments: number; declineBeyondReliableChange: boolean } | null }): ReportRow[] => {
  if (!latest) return [];
  const rows: ReportRow[] = [
    { label: 'Screening date', value: '' },
    { label: 'Overall score', value: `${Math.round(latest.overallScore)} / 100` },
    { label: 'Assessment type', value: latest.assessmentType ?? 'Standard battery' },
  ];
  return rows;
};

export const DoctorReportsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryPatientId = searchParams.get('patient');
  const [chosenPatientId, setChosenPatientId] = useState<string | null>(null);

  const store = useDoctorPortalStore();
  const patientList: Array<{ id: string; patientId: string; name: string; age: number; risk?: string | null }> = store.registeredPatients.map((p) => ({
    id: p.id,
    patientId: p.patientId,
    name: p.name,
    age: p.age,
    risk: null,
  }));

  const selectedPatientId =
    chosenPatientId ??
    (queryPatientId ? patientList.find((p) => p.patientId === queryPatientId)?.id ?? null : null);
  const selected = selectedPatientId ? patientList.find((p) => p.id === selectedPatientId) ?? null : null;

  const { patient, assessments, changeSummary, isLoading } = useDoctorPatient(selected?.patientId);
  const patientKey = patient?.patientId ?? '';

  const handleSelect = useCallback((id: string) => {
    setChosenPatientId(id);
  }, []);

  const handlePrint = useCallback(() => {
    if (!patient || !assessments.length) return;
    printWindow(`NeuLens Clinical Report — ${patient.name}`, [
      { label: 'Patient', value: `${patient.name}\n${patient.age} yrs · ${patient.gender ?? 'Not recorded'}\n${patient.patientId}\n${patient.email ?? 'No email'}` },
      { label: 'Latest screening', value: assessments[0] ? `${formatDateTime(assessments[0].date)}\n${assessments[0].assessmentType ?? 'Standard battery'}\nOverall score: ${formatScore(assessments[0].overallScore)}` : '' },
      { label: 'Change summary', value: changeSummary ? `${changeSummary.status}\nLatest score: ${changeSummary.cognitive.latestScore !== null ? Math.round(changeSummary.cognitive.latestScore) + ' / 100' : 'Missing'}\nPrevious score: ${changeSummary.cognitive.previousScore !== null ? Math.round(changeSummary.cognitive.previousScore) + ' / 100' : 'Missing'}\nComparable assessments: ${changeSummary.cognitive.comparableAssessments}` : '' },
      { label: 'Reviewer note', value: assessments[0]?.report?.doctorNotes ?? 'No reviewer notes recorded.' },
    ]);
  }, [patient, assessments, changeSummary]);

  return (
    <div className="min-w-0">
      <DoctorPageHeader
        screen="Clinical reports"
        title="Report center"
        description="Select a patient to generate a clinical report from their screening sessions and clinician notes."
        actions={
          selectedPatientId ? (
            <Link to="/doctor/patients" className={secondaryButton}>Back to patients</Link>
          ) : null
        }
      />
      {selectedPatientId && patient && !isLoading ? (
        <div className="mt-6 flex min-w-0 flex-col gap-6 lg:flex-row">
          <div className="w-full min-w-0 shrink-0 lg:w-72">
            <PatientWorkflowNav patientId={patient.patientId} />
          </div>
          <div className="flex-1 min-w-0">
            <ClinicalReportCard
              patient={patient}
              assessments={assessments}
              changeSummary={changeSummary}
              changeAcknowledgements={store.changeAcknowledgements.filter((a) => a.patientId === patientKey)}
              notes={store.notes.filter((n) => n.patientId === patientKey)}
              referrals={store.referrals.filter((r) => r.patientId === patientKey)}
              appointments={store.appointments.filter((a) => a.patientId === patientKey)}
              onPrint={handlePrint}
            />
          </div>
        </div>
      ) : (
        <div className="mt-6 flex min-w-0 flex-col gap-6 lg:flex-row">
          <div className="w-full min-w-0 shrink-0 lg:w-72">
            <ReportCenterCard patients={patientList} onSelect={handleSelect} selectedId={selectedPatientId ?? null} />
          </div>
          <div className="flex-1 min-w-0">
            {selectedPatientId && isLoading ? (
              <LoadingState label="Preparing this patient's report" detail="Collecting completed observations and quality notes." />
            ) : (
              <EmptyState scene="emptySearch" icon={FileText} title="Select a patient" detail="Choose a patient from the list to generate a clinical report." />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------
 * Screen 62 — Doctor Settings
 * --------------------------------------------------------------- */

const SectionHeading: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="border-b border-line pb-3 mb-4">
    <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
    {description && <p className="mt-1 text-[14px] text-body">{description}</p>}
  </div>
);

const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-line last:border-0">
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-800">{label}</p>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

export const DoctorSettingsPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { profile, clinic, preferences, verificationStatus, documents, setProfile, setClinic, setPreferences, setVerificationStatus } = useDoctorPortalStore();

  const [draftProfile, setDraftProfile] = useState(profile);
  const [draftClinic, setDraftClinic] = useState(clinic);
  const [draftPrefs, setDraftPrefs] = useState(preferences);
  const [activeSection, setActiveSection] = useState('profile');
  const [savedSection, setSavedSection] = useState<string | null>(null);

  const reset = useCallback((section: string) => {
    if (section === 'profile') setDraftProfile(profile);
    if (section === 'clinic') setDraftClinic(clinic);
    if (section === 'notifications') setDraftPrefs(preferences);
  }, [profile, clinic, preferences]);

  const save = useCallback((section: string) => {
    if (section === 'profile') setProfile(draftProfile);
    if (section === 'clinic') setClinic(draftClinic);
    if (section === 'notifications') setPreferences(draftPrefs);
    setSavedSection(section);
    reset(section);
  }, [draftProfile, draftClinic, draftPrefs, setProfile, setClinic, setPreferences, reset]);

  const clinicianName = user?.name
    ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`)
    : user?.firstName || user?.lastName
    ? `Dr. ${`${user.firstName || ''} ${user.lastName || ''}`.trim()}`
    : user?.email
    ? `Dr. ${user.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`
    : 'Dr. Clinician';

  return (
    <div className="min-w-0">
      <DoctorPageHeader
        screen="Settings"
        title="Clinician settings"
        description="Manage your profile, clinic, notifications, and security preferences."
      />

      <div className="mt-6 flex min-w-0 flex-col gap-6 lg:flex-row lg:gap-8">
        <nav className="flex w-full shrink-0 gap-1 overflow-x-auto pb-1 lg:block lg:w-48 lg:space-y-1 lg:pb-0">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'clinic', label: 'Clinic' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'security', label: 'Security' },
            { id: 'privacy', label: 'Privacy & support' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveSection(item.id); reset(item.id); setSavedSection(null); }}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition lg:w-full lg:whitespace-normal ${
                activeSection === item.id ? 'bg-blue-50 text-blue-800 font-bold' : 'text-body hover:bg-warm'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          {activeSection === 'profile' && (
            <Card padded>
              <SectionHeading title="Profile" description="Your clinician profile and verification details." />
              <div className="space-y-4">
                <div className="rounded-xl border border-line bg-warm/60 p-4 text-xs">
                  <p className="font-semibold text-ink">{clinicianName}</p>
                  <p className="mt-1 text-body">{user?.email ?? 'No email on file'}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                      verificationStatus === 'IN_PROGRESS' || verificationStatus === 'SUBMITTED' ? 'bg-amber-100 text-amber-800' :
                      verificationStatus === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                      'bg-warm text-body'
                    }`}>
                      Verification: {verificationStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Full name</label>
                  <input
                    type="text"
                    value={draftProfile.fullName}
                    onChange={(e) => setDraftProfile({ ...draftProfile, fullName: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Professional email</label>
                  <input
                    type="email"
                    value={draftProfile.professionalEmail}
                    onChange={(e) => setDraftProfile({ ...draftProfile, professionalEmail: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={draftProfile.phone}
                    onChange={(e) => setDraftProfile({ ...draftProfile, phone: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Medical registration number</label>
                  <input
                    type="text"
                    value={draftProfile.medicalRegistrationNumber}
                    onChange={(e) => setDraftProfile({ ...draftProfile, medicalRegistrationNumber: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Qualification</label>
                  <input
                    type="text"
                    value={draftProfile.qualification}
                    onChange={(e) => setDraftProfile({ ...draftProfile, qualification: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Specialization</label>
                  <input
                    type="text"
                    value={draftProfile.specialization}
                    onChange={(e) => setDraftProfile({ ...draftProfile, specialization: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Years of experience</label>
                  <input
                    type="number"
                    min={0}
                    value={draftProfile.yearsExperience}
                    onChange={(e) => setDraftProfile({ ...draftProfile, yearsExperience: e.target.valueAsNumber || '' })}
                    className={fieldClass}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={() => save('profile')} className={primaryButton}>Save changes</button>
                  <button type="button" onClick={() => reset('profile')} className={secondaryButton}>Reset</button>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'clinic' && (
            <Card padded>
              <SectionHeading title="Clinic" description="The hospital and department you operate from." />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Hospital name</label>
                  <input
                    type="text"
                    value={draftClinic.hospitalName}
                    onChange={(e) => setDraftClinic({ ...draftClinic, hospitalName: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Department</label>
                  <input
                    type="text"
                    value={draftClinic.department}
                    onChange={(e) => setDraftClinic({ ...draftClinic, department: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Address</label>
                  <input
                    type="text"
                    value={draftClinic.address}
                    onChange={(e) => setDraftClinic({ ...draftClinic, address: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Institution ID</label>
                  <input
                    type="text"
                    value={draftClinic.institutionId}
                    onChange={(e) => setDraftClinic({ ...draftClinic, institutionId: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Contact phone</label>
                  <input
                    type="tel"
                    value={draftClinic.contactPhone}
                    onChange={(e) => setDraftClinic({ ...draftClinic, contactPhone: e.target.value })}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className={labelClass}>Contact email</label>
                  <input
                    type="email"
                    value={draftClinic.contactEmail}
                    onChange={(e) => setDraftClinic({ ...draftClinic, contactEmail: e.target.value })}
                    className={fieldClass}
                  />
                </div>

                <div className="pt-2">
                  <button type="button" onClick={() => save('clinic')} className={primaryButton}>Save changes</button>
                  <button type="button" onClick={() => reset('clinic')} className={secondaryButton}>Reset</button>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card padded>
              <SectionHeading title="Notifications" description="Choose which updates you receive by email." />
              <div className="divide-y divide-line">
                <SettingRow label="New assessment results" description="When a patient completes a screening battery.">
                  <Toggle
                    label="New assessment results"
                    detail="When a patient completes a screening battery."
                    checked={draftPrefs.emailNewAssessment}
                    onChange={(value) => setDraftPrefs({ ...draftPrefs, emailNewAssessment: value })}
                  />
                </SettingRow>
                <SettingRow label="Change alerts" description="When a notable change is detected.">
                  <Toggle
                    label="Change alerts"
                    detail="When a notable change is detected."
                    checked={draftPrefs.emailChangeAlert}
                    onChange={(value) => setDraftPrefs({ ...draftPrefs, emailChangeAlert: value })}
                  />
                </SettingRow>
                <SettingRow label="Follow-up reminders" description="Upcoming follow-up tasks for your patients.">
                  <Toggle
                    label="Follow-up reminders"
                    detail="Upcoming follow-up tasks for your patients."
                    checked={draftPrefs.emailFollowUp}
                    onChange={(value) => setDraftPrefs({ ...draftPrefs, emailFollowUp: value })}
                  />
                </SettingRow>
                <SettingRow label="Daily digest" description="A daily summary of portal activity.">
                  <Toggle
                    label="Daily digest"
                    detail="A daily summary of portal activity."
                    checked={draftPrefs.dailyDigest}
                    onChange={(value) => setDraftPrefs({ ...draftPrefs, dailyDigest: value })}
                  />
                </SettingRow>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-2">
                <button type="button" onClick={() => save('notifications')} className={primaryButton}>Save changes</button>
                <button type="button" onClick={() => reset('notifications')} className={secondaryButton}>Reset</button>
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card padded>
              <SectionHeading title="Security" description="Account security and session preferences." />
              <div className="divide-y divide-line">
                <SettingRow label="Two-factor authentication" description="Add a second verification step on login.">
                  <Toggle
                    label="Two-factor authentication"
                    detail="Add a second verification step on login."
                    checked={draftPrefs.twoFactor}
                    onChange={(value) => setDraftPrefs({ ...draftPrefs, twoFactor: value })}
                  />
                </SettingRow>
                <SettingRow label="Session timeout" description="Automatically sign out after inactivity.">
                  <Toggle
                    label="Session timeout"
                    detail="Automatically sign out after inactivity."
                    checked={draftPrefs.sessionTimeout}
                    onChange={(value) => setDraftPrefs({ ...draftPrefs, sessionTimeout: value })}
                  />
                </SettingRow>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-2">
                <button type="button" onClick={() => save('notifications')} className={primaryButton}>Save changes</button>
                <button type="button" onClick={() => reset('notifications')} className={secondaryButton}>Reset</button>
              </div>
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 text-xs text-rose-800">
                <p className="font-semibold">Sign out of this session</p>
                <p className="mt-1 text-rose-700">Use the sign-out button in the sidebar to end your current clinician session.</p>
              </div>
            </Card>
          )}

          {activeSection === 'privacy' && (
            <Card padded>
              <SectionHeading title="Privacy & support" description="Data sharing preferences and help resources." />
              <div className="divide-y divide-line">
                <SettingRow label="Share data for second opinion" description="Allow anonymized data to be shared with consulting clinicians.">
                  <Toggle
                    label="Share data for second opinion"
                    detail="Allow anonymized data to be shared with consulting clinicians."
                    checked={draftPrefs.shareForSecondOpinion}
                    onChange={(value) => setDraftPrefs({ ...draftPrefs, shareForSecondOpinion: value })}
                  />
                </SettingRow>
              </div>
              <div className="mt-4 rounded-xl border border-line bg-warm/60 p-4 text-xs">
                <p className="font-semibold text-ink">Privacy & data use</p>
                <p className="mt-1.5 text-body leading-5">
                  Screening data is used to support clinical review and care planning. It is not a diagnosis and does not replace a clinical evaluation. You can review and adjust your sharing preferences above.
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-line bg-warm/60 p-4 text-xs">
                <p className="font-semibold text-ink">Help & support</p>
                <p className="mt-1.5 text-body leading-5">
                  For technical issues, verification questions, or training requests, contact the NeuLens clinical support team through the hospital help desk.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-2">
                <button type="button" onClick={() => save('notifications')} className={primaryButton}>Save changes</button>
                <button type="button" onClick={() => reset('notifications')} className={secondaryButton}>Reset</button>
              </div>
            </Card>
          )}

          {savedSection && (
            <Notice tone="success" title="Saved">
              Your {savedSection} preferences have been updated.
            </Notice>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-warm/60 p-4 text-xs">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-ink">{clinicianName}</p>
            <p className="text-body">Signed in as clinician</p>
          </div>
          <button
            type="button"
            onClick={() => { logout(); navigate('/doctor/login', { replace: true }); }}
            className={dangerButton}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------
 * Legacy / redirect helpers (kept minimal and non-breaking)
 * --------------------------------------------------------------- */

export const DoctorReportViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { registeredPatients } = useDoctorPortalStore();
  const patient = registeredPatients[0];
  if (!patient) {
    return <EmptyState scene="emptySearch" icon={FileText} title="No report available" detail="Select a patient to view a clinical report." />;
  }
  return (
    <div className="min-w-0">
      <DoctorPageHeader screen="Report" title="Report view" />
      <Card padded>
        <p className="text-xs text-body">This legacy report view is preserved for backward compatibility. Use the report center at <Link to="/doctor/reports" className={secondaryButton}>/doctor/reports</Link> for the current clinical report experience.</p>
      </Card>
    </div>
  );
};

