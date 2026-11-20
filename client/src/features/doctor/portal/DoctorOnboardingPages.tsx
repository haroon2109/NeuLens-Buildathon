import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileUp,
  GraduationCap,
  Hash,
  FileText as IdCard,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserRound
} from 'lucide-react';
import { NeuLensLogo } from '../../../components/NeuLensLogo';
import { useAuthStore } from '../../../store/authStore';
import { useDoctorPortalStore } from '../../../store/doctorPortalStore';
import { Card, DoctorPageHeader, Notice, fieldClass, labelClass, primaryButton, secondaryButton } from './ui';



const steps = [
  { id: 1, label: 'Registration', path: '/doctor/onboarding/registration' },
  { id: 2, label: 'Verification', path: '/doctor/onboarding/verification' },
  { id: 3, label: 'Clinic setup', path: '/doctor/onboarding/clinic' }
];

const DoctorOnboardingShell: React.FC<{
  step: number;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ step, eyebrow, title, description, children }) => {
  const { user } = useAuthStore();
  const verificationStatus = useDoctorPortalStore((state) => state.verificationStatus);
  const isVerified = user?.verificationStatus === 'VERIFIED';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-warm text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <NeuLensLogo height="h-9" />
              <span className="mt-0.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Clinical workspace setup
              </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-body">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              {isVerified ? 'Verified clinician' : `Verification: ${verificationStatus.replace('_', ' ').toLowerCase()}`}
            </span>
            <Link
              to={isVerified ? '/doctor/dashboard' : '/auth/pending-approval'}
              className="text-xs font-semibold text-muted hover:text-ink"
            >
              Save and exit
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
          <aside className="h-fit rounded-2xl border border-line bg-white p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Professional onboarding
            </p>
            <ol className="space-y-1">
              {steps.map((item) => {
                const complete = item.id < step;
                const active = item.id === step;
                return (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                        active
                          ? 'bg-blue-50 text-blue-800'
                          : complete
                            ? 'text-emerald-800 hover:bg-emerald-50'
                            : 'text-muted hover:bg-warm'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          active
                            ? 'bg-blue-700 text-white'
                            : complete
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-warm text-muted'
                        }`}
                      >
                        {complete ? <CheckCircle2 className="h-3 w-3" /> : item.id}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 rounded-xl border border-line bg-warm p-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-body">
                <Clock3 className="h-3.5 w-3.5" /> Review timeline
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Credential checks usually complete within 1–2 business days. Patient records remain locked until approval.
              </p>
            </div>
          </aside>

          <main className="min-w-0 space-y-5">
            <DoctorPageHeader screen={eyebrow} title={title} description={description} />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

const StepActions: React.FC<{
  back?: string;
  backLabel?: string;
  nextLabel: string;
  onNext?: () => void;
  nextDisabled?: boolean;
  detail?: string;
}> = ({ back, backLabel = 'Back', nextLabel, onNext, nextDisabled, detail }) => (
  <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      {back && (
        <Link to={back} className={secondaryButton}>
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
      )}
      {detail && <p className="mt-2 text-xs text-muted sm:mt-0">{detail}</p>}
    </div>
    <button type="button" onClick={onNext} disabled={nextDisabled} className={primaryButton}>
      {nextLabel} <ArrowRight className="h-4 w-4" />
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// Screen 46 — Doctor Registration
// ---------------------------------------------------------------------------
export const DoctorRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { profile, setProfile } = useDoctorPortalStore();
  const [error, setError] = useState('');

  const profileMatchesUser =
    !profile.ownerEmail ||
    profile.ownerEmail === user?.email;

  const [form, setForm] = useState({
    fullName: profileMatchesUser ? profile.fullName : user?.name || '',
    professionalEmail: profileMatchesUser ? profile.professionalEmail : user?.email || '',
    phone: profileMatchesUser ? profile.phone : user?.phone || '',
    medicalRegistrationNumber: profileMatchesUser ? profile.medicalRegistrationNumber : user?.professionalRegistrationNumber || '',
    qualification: profileMatchesUser ? profile.qualification : '',
    specialization: profileMatchesUser ? profile.specialization : user?.specialty || 'Neurology',
    yearsExperience: profileMatchesUser ? profile.yearsExperience : ''
  });

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      fullName: current.fullName || user.name || '',
      professionalEmail: current.professionalEmail || user.email || '',
      phone: current.phone || user.phone || ''
    }));
  }, [user]);

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleContinue = () => {
    setError('');
    if (form.fullName.trim().length < 2) return setError('Enter your full legal name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.professionalEmail.trim())) return setError('Enter a valid professional email address.');
    if (form.phone.replace(/\D/g, '').length < 7) return setError('Enter a valid phone number.');
    if (!form.medicalRegistrationNumber.trim()) return setError('Enter your medical registration number.');
    if (!form.qualification.trim()) return setError('Enter your medical qualification.');
    if (!form.specialization.trim()) return setError('Select your specialization.');
    if (form.yearsExperience === '' || Number(form.yearsExperience) < 0) return setError('Enter your years of clinical experience.');

    setProfile({
      ...form,
      ownerEmail: user?.email || form.professionalEmail,
      yearsExperience: Number(form.yearsExperience)
    });
    updateUser({
      name: form.fullName,
      phone: form.phone,
      specialty: form.specialization,
      professionalRegistrationNumber: form.medicalRegistrationNumber
    });
    navigate('/doctor/onboarding/verification');
  };

  return (
    <DoctorOnboardingShell
      step={1}
      eyebrow="Screen 46 · Doctor registration"
      title="Your professional registration"
      description="These details identify you across clinical notes, care plans, and signed reports. They are checked against your medical registration and institutional affiliation."
    >
      <Card>
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Stethoscope className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Registrant details</h2>
            <p className="mt-0.5 text-xs text-muted">All fields are required unless marked optional.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800" role="alert">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="doctor-name" className={labelClass}>Full name</label>
            <div className="relative">
              <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="doctor-name" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} className={`${fieldClass} pl-9`} autoComplete="name" />
            </div>
          </div>
          <div>
            <label htmlFor="doctor-email" className={labelClass}>Professional email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="doctor-email" type="email" value={form.professionalEmail} onChange={(event) => update('professionalEmail', event.target.value)} className={`${fieldClass} pl-9`} autoComplete="email" />
            </div>
          </div>
          <div>
            <label htmlFor="doctor-phone" className={labelClass}>Phone number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="doctor-phone" type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} className={`${fieldClass} pl-9`} autoComplete="tel" />
            </div>
          </div>
          <div>
            <label htmlFor="doctor-registration" className={labelClass}>Medical registration number</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="doctor-registration" value={form.medicalRegistrationNumber} onChange={(event) => update('medicalRegistrationNumber', event.target.value)} className={`${fieldClass} pl-9`} placeholder="e.g. REG-2026-001" />
            </div>
          </div>
          <div>
            <label htmlFor="doctor-qualification" className={labelClass}>Qualification</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="doctor-qualification" value={form.qualification} onChange={(event) => update('qualification', event.target.value)} className={`${fieldClass} pl-9`} placeholder="e.g. MBBS, MD, DM (Neurology)" />
            </div>
          </div>
          <div>
            <label htmlFor="doctor-specialization" className={labelClass}>Specialization</label>
            <select id="doctor-specialization" value={form.specialization} onChange={(event) => update('specialization', event.target.value)} className={fieldClass}>
              {['Neurology', 'Geriatric Medicine', 'Psychiatry', 'Neuropsychology', 'General Medicine', 'Rehabilitation Medicine', 'Other'].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="doctor-experience" className={labelClass}>Years of experience</label>
            <input id="doctor-experience" type="number" min="0" max="70" value={form.yearsExperience} onChange={(event) => update('yearsExperience', event.target.value)} className={fieldClass} placeholder="e.g. 14" />
          </div>
          <div className="rounded-xl border border-line bg-warm p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-body">
              <BadgeCheck className="h-3.5 w-3.5 text-blue-600" /> Account identity
            </p>
            <p className="mt-1 break-all text-xs leading-5 text-muted">
              Signed in as {user?.email || 'clinician'}. Email changes are managed through account security.
            </p>
          </div>
        </div>
      </Card>

      <Notice tone="info" title="Why we ask for registration details">
        Your registration number appears on clinical reports and is used to confirm prescribing and review authority. It is not shared with patients as a public profile.
      </Notice>

      <StepActions
        nextLabel="Continue to verification"
        onNext={handleContinue}
        detail="You can return to this step before verification is submitted."
      />
    </DoctorOnboardingShell>
  );
};

// ---------------------------------------------------------------------------
// Screen 47 — Professional Verification
// ---------------------------------------------------------------------------
const documentRows = [
  { key: 'medicalCertificate' as const, label: 'Medical registration certificate', detail: 'Current certificate from your medical council.', icon: FileCheck2 },
  { key: 'identity' as const, label: 'Identity verification', detail: 'Government-issued photo identification.', icon: IdCard },
  { key: 'hospitalAffiliation' as const, label: 'Hospital affiliation', detail: 'Letter or credential confirming current affiliation.', icon: Building2 }
];

export const DoctorVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    documents,
    identityReference,
    verificationStatus,
    clinic,
    uploadDocument,
    setIdentityReference,
    setClinic,
    setVerificationStatus
  } = useDoctorPortalStore();
  const [error, setError] = useState('');
  const uploadedCount = documentRows.filter((row) => documents[row.key].status !== 'MISSING').length;
  const complete = uploadedCount === documentRows.length;

  const handleSubmit = () => {
    setError('');
    if (!complete) return setError('Upload all three documents before submitting for verification.');
    if (!clinic.hospitalName.trim()) return setError('Add your hospital or clinic affiliation before submitting.');
    setVerificationStatus(user?.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'SUBMITTED');
    navigate('/doctor/onboarding/clinic');
  };

  return (
    <DoctorOnboardingShell
      step={2}
      eyebrow="Screen 47 · Professional verification"
      title="Verify your clinical credentials"
      description="Upload the documents our credentialing team uses to confirm your registration and affiliation. Document names are retained here for the demo; files stay in this browser."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Required documents</h2>
              <p className="mt-0.5 text-xs text-muted">PDF, JPG, or PNG · maximum 10 MB each.</p>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${complete ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              {uploadedCount} of {documentRows.length} uploaded
            </span>
          </div>

          <div className="space-y-3">
            {documentRows.map(({ key, label, detail, icon: Icon }) => {
              const document = documents[key];
              return (
                <div key={key} className="rounded-xl border border-line p-3.5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${document.status === 'MISSING' ? 'bg-warm text-muted' : 'bg-emerald-50 text-emerald-700'}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{label}</p>
                        <p className="mt-0.5 text-xs leading-4 text-muted">{detail}</p>
                        {document.name && (
                          <p className="mt-1.5 break-all font-mono text-xs text-body">
                            {document.name} · {document.status.toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                    <label className={`${secondaryButton} cursor-pointer text-xs`}>
                      <FileUp className="h-3.5 w-3.5" />
                      {document.status === 'MISSING' ? 'Upload' : 'Replace'}
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) uploadDocument(key, file.name);
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {error && <p className="mt-3 text-xs font-semibold text-rose-700" role="alert">{error}</p>}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Verification status</h2>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted">Documents</span>
                <span className={`font-semibold ${complete ? 'text-emerald-700' : 'text-amber-700'}`}>{complete ? 'Received' : 'Incomplete'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted">Credential review</span>
                <span className="font-semibold text-slate-800">{verificationStatus === 'VERIFIED' ? 'Verified' : verificationStatus === 'SUBMITTED' ? 'Submitted' : 'Not submitted'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted">Patient access</span>
                <span className={`font-semibold ${user?.verificationStatus === 'VERIFIED' ? 'text-emerald-700' : 'text-body'}`}>
                  {user?.verificationStatus === 'VERIFIED' ? 'Unlocked' : 'Locked until approval'}
                </span>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-line bg-warm p-2.5 text-xs leading-5 text-muted">
              Uploading replacement documents creates a new review entry. Previously approved credentials remain valid until review completes.
            </div>
          </Card>

          <Card>
            <h2 className="text-[14px] font-semibold text-ink">Identity and affiliation</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="identity-reference" className={labelClass}>Identity reference</label>
                <input id="identity-reference" value={identityReference} onChange={(event) => setIdentityReference(event.target.value)} className={fieldClass} placeholder="e.g. Passport ending 4821" />
              </div>
              <div>
                <label htmlFor="affiliation-name" className={labelClass}>Hospital affiliation</label>
                <input id="affiliation-name" value={clinic.hospitalName} onChange={(event) => setClinic({ hospitalName: event.target.value })} className={fieldClass} placeholder="e.g. Your hospital or clinic" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <StepActions
        back="/doctor/onboarding/registration"
        backLabel="Registration details"
        nextLabel="Continue to clinic setup"
        onNext={handleSubmit}
        nextDisabled={!complete}
        detail="Verification may take 1–2 business days. Clinic setup can be completed now."
      />
    </DoctorOnboardingShell>
  );
};

// ---------------------------------------------------------------------------
// Screen 48 — Clinic / Institution Setup
// ---------------------------------------------------------------------------
export const ClinicSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    clinic,
    setClinic,
    addClinician,
    removeClinician,
    completeOnboarding,
    verificationStatus
  } = useDoctorPortalStore();
  const [newClinician, setNewClinician] = useState({ name: '', role: '', email: '' });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleFinish = () => {
    setError('');
    if (!clinic.hospitalName.trim()) return setError('Enter the hospital or clinic name.');
    if (!clinic.department.trim()) return setError('Enter your department.');
    if (!clinic.address.trim()) return setError('Enter the clinic address.');
    if (!clinic.institutionId.trim()) return setError('Enter the institution ID.');
    if (!clinic.contactPhone.trim() && !clinic.contactEmail.trim()) return setError('Add at least one clinic contact detail.');

    completeOnboarding();
    setSaved(true);
    if (user?.verificationStatus === 'VERIFIED') {
      navigate('/doctor/dashboard', { replace: true });
    } else {
      navigate('/auth/pending-approval', { replace: true });
    }
  };

  const handleAddClinician = () => {
    if (!newClinician.name.trim() || !newClinician.email.trim()) return;
    addClinician({
      name: newClinician.name.trim(),
      role: newClinician.role.trim() || 'Authorized clinician',
      email: newClinician.email.trim()
    });
    setNewClinician({ name: '', role: '', email: '' });
  };

  return (
    <DoctorOnboardingShell
      step={3}
      eyebrow="Screen 48 · Clinic / institution setup"
      title="Connect your clinical institution"
      description="Set the default hospital, department, and contact details used on referrals and reports. You can change these later in doctor settings."
    >
      <Card>
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Institution details</h2>
            <p className="mt-0.5 text-xs text-muted">This information appears in the footer of clinical documents.</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800" role="alert">{error}</div>}
        {saved && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">Clinic setup saved.</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="clinic-name" className={labelClass}>Hospital / clinic name</label>
            <input id="clinic-name" value={clinic.hospitalName} onChange={(event) => setClinic({ hospitalName: event.target.value })} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="clinic-department" className={labelClass}>Department</label>
            <input id="clinic-department" value={clinic.department} onChange={(event) => setClinic({ department: event.target.value })} className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="clinic-address" className={labelClass}>Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted" />
              <textarea id="clinic-address" rows={2} value={clinic.address} onChange={(event) => setClinic({ address: event.target.value })} className={`${fieldClass} pl-9`} />
            </div>
          </div>
          <div>
            <label htmlFor="institution-id" className={labelClass}>Institution ID</label>
            <input id="institution-id" value={clinic.institutionId} onChange={(event) => setClinic({ institutionId: event.target.value })} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="clinic-phone" className={labelClass}>Clinic phone</label>
            <input id="clinic-phone" type="tel" value={clinic.contactPhone} onChange={(event) => setClinic({ contactPhone: event.target.value })} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="clinic-email" className={labelClass}>Clinic email</label>
            <input id="clinic-email" type="email" value={clinic.contactEmail} onChange={(event) => setClinic({ contactEmail: event.target.value })} className={fieldClass} />
          </div>
          <div className="rounded-xl border border-line bg-warm p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-body">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Access model
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Only authorized clinicians listed below can be assigned patients under this institution.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Other authorized clinicians</h2>
            <p className="mt-0.5 text-xs text-muted">Optional. These colleagues can receive referrals or co-manage patients.</p>
          </div>
          <span className="rounded-full border border-line bg-warm px-2.5 py-1 text-xs font-bold text-body">
            {clinic.otherClinicians.length} listed
          </span>
        </div>

        <div className="space-y-2">
          {clinic.otherClinicians.map((clinician) => (
            <div key={clinician.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">{clinician.name}</p>
                <p className="truncate text-xs text-muted">{clinician.role} · {clinician.email}</p>
              </div>
              <button type="button" onClick={() => removeClinician(clinician.id)} className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${clinician.name}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {clinic.otherClinicians.length === 0 && <p className="rounded-xl border border-dashed border-line-strong bg-warm p-3 text-xs text-muted">No additional clinicians listed.</p>}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr_auto]">
          <div>
            <label htmlFor="new-clinician-name" className={labelClass}>Name</label>
            <input id="new-clinician-name" value={newClinician.name} onChange={(event) => setNewClinician({ ...newClinician, name: event.target.value })} className={fieldClass} placeholder="Dr. Meera Krishnan" />
          </div>
          <div>
            <label htmlFor="new-clinician-role" className={labelClass}>Role</label>
            <input id="new-clinician-role" value={newClinician.role} onChange={(event) => setNewClinician({ ...newClinician, role: event.target.value })} className={fieldClass} placeholder="Geriatrician" />
          </div>
          <div>
            <label htmlFor="new-clinician-email" className={labelClass}>Email</label>
            <input id="new-clinician-email" type="email" value={newClinician.email} onChange={(event) => setNewClinician({ ...newClinician, email: event.target.value })} className={fieldClass} placeholder="name@hospital.org" />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={handleAddClinician} className={secondaryButton}>
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>
      </Card>

      <Notice tone={verificationStatus === 'VERIFIED' ? 'success' : 'info'} title={verificationStatus === 'VERIFIED' ? 'Credentials already verified' : 'Final step is credential review'}>
        {verificationStatus === 'VERIFIED'
          ? 'Your account can access patient records immediately. Clinic changes are saved to this workspace.'
          : 'After saving, your application moves to credential review. You will unlock patient records once approved.'}
      </Notice>

      <StepActions
        back="/doctor/onboarding/verification"
        backLabel="Verification documents"
        nextLabel={user?.verificationStatus === 'VERIFIED' ? 'Finish and open dashboard' : 'Submit for approval'}
        onNext={handleFinish}
      />
    </DoctorOnboardingShell>
  );
};
