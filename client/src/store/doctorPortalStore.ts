import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DocumentStatus = 'MISSING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';
export type VerificationStatus =
  | 'NOT_STARTED'
  | 'NOT_SUBMITTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'REJECTED';

export interface DoctorProfile {
  ownerEmail: string;
  fullName: string;
  professionalEmail: string;
  phone: string;
  medicalRegistrationNumber: string;
  qualification: string;
  specialization: string;
  yearsExperience: number | '';
}

export interface DoctorDocument {
  name: string;
  uploadedAt: string | null;
  status: DocumentStatus;
}

export interface ClinicProfile {
  hospitalName: string;
  department: string;
  address: string;
  institutionId: string;
  contactPhone: string;
  contactEmail: string;
  otherClinicians: Array<{ id: string; name: string; role: string; email: string }>;
}

export interface PatientClinicalContext {
  sleepHours: number;
  sleepQuality: number;
  activityLevel: number;
  stressLevel: number;
  mood: number;
  metabolic: string;
  familyHistory: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
  sources: string[];
  lastUpdated: string;
}

export interface RegisteredPatient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  language: string;
  conditions: string;
  medications: string;
  familyHistory: string;
  assignedDoctor: string;
  consentConfirmed: boolean;
  invitationStatus: 'NOT_SENT' | 'SENT';
  invitationEmail: string;
  registeredAt: string;
}

export type NoteDecision = 'NO_CHANGE' | 'MONITOR' | 'CLINICAL_REVIEW' | 'REFER';

export interface ClinicalNote {
  id: string;
  patientId: string;
  assessmentId: string | null;
  observations: string;
  interpretation: string;
  questions: string;
  decision: NoteDecision;
  followUpRequired: boolean;
  followUpDate: string | null;
  author: string;
  createdAt: string;
}

export type CareAction =
  | 'REPEAT_ASSESSMENT'
  | 'PREVENTIVE_GUIDANCE'
  | 'FURTHER_EVALUATION'
  | 'REFERRAL'
  | 'MONITOR';

export interface CarePlanRecord {
  patientId: string;
  assessmentId: string | null;
  actions: CareAction[];
  repeatAssessmentWeeks: number | '';
  preventiveGuidance: string;
  furtherEvaluation: string;
  responsibleClinician: string;
  followUpDate: string;
  notes: string;
  approvedAt: string;
}

export type ReferralType = 'PRIMARY_CARE' | 'NEUROLOGY' | 'GERIATRICS' | 'MENTAL_HEALTH';
export type ReferralStatus = 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'COMPLETED' | 'DECLINED';

export interface ReferralRecord {
  id: string;
  patientId: string;
  type: ReferralType;
  reason: string;
  destination: string;
  urgency: 'ROUTINE' | 'PRIORITY';
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorAppointmentRecord {
  id: string;
  patientId: string;
  title: string;
  type: 'FOLLOW_UP' | 'REPEAT_ASSESSMENT' | 'RESULTS_REVIEW' | 'TELEHEALTH';
  date: string;
  time: string;
  location: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  communication: string;
  createdAt: string;
}

export interface ChangeAcknowledgement {
  id: string;
  patientId: string;
  assessmentId: string | null;
  status: 'ACKNOWLEDGED' | 'MONITOR' | 'ESCALATED';
  note: string;
  acknowledgedAt: string;
}

export interface DoctorPreferences {
  emailNewAssessment: boolean;
  emailChangeAlert: boolean;
  emailFollowUp: boolean;
  dailyDigest: boolean;
  twoFactor: boolean;
  sessionTimeout: boolean;
  shareForSecondOpinion: boolean;
}

interface DoctorPortalState {
  onboardingComplete: boolean;
  profile: DoctorProfile;
  verificationStatus: VerificationStatus;
  documents: {
    medicalCertificate: DoctorDocument;
    identity: DoctorDocument;
    hospitalAffiliation: DoctorDocument;
  };
  identityReference: string;
  clinic: ClinicProfile;
  registeredPatients: RegisteredPatient[];
  clinicalContexts: Record<string, PatientClinicalContext>;
  assignments: Record<string, string>;
  notes: ClinicalNote[];
  carePlans: CarePlanRecord[];
  referrals: ReferralRecord[];
  appointments: DoctorAppointmentRecord[];
  changeAcknowledgements: ChangeAcknowledgement[];
  preferences: DoctorPreferences;

  setProfile: (updates: Partial<DoctorProfile>) => void;
  setVerificationStatus: (status: VerificationStatus) => void;
  uploadDocument: (key: keyof DoctorPortalState['documents'], fileName: string) => void;
  setIdentityReference: (value: string) => void;
  setClinic: (updates: Partial<ClinicProfile>) => void;
  addClinician: (clinician: Omit<ClinicProfile['otherClinicians'][number], 'id'>) => void;
  removeClinician: (id: string) => void;
  completeOnboarding: () => void;
  addPatient: (patient: Omit<RegisteredPatient, 'id' | 'patientId' | 'registeredAt'>) => string;
  hydratePatients: (patients: Array<{ id: string; patientId: string; name: string; age: number; gender?: string | null; email?: string | null; phone?: string | null }>) => void;
  setAssignment: (patientId: string, clinician: string) => void;
  addNote: (note: Omit<ClinicalNote, 'id' | 'createdAt'>) => void;
  saveCarePlan: (plan: Omit<CarePlanRecord, 'approvedAt'>) => void;
  setReferrals: (referrals: ReferralRecord[]) => void;
  addReferral: (referral: Omit<ReferralRecord, 'createdAt' | 'updatedAt'>) => string;
  setReferralStatus: (id: string, status: ReferralStatus) => void;
  setAppointments: (appointments: DoctorAppointmentRecord[]) => void;
  addAppointment: (appointment: Omit<DoctorAppointmentRecord, 'createdAt'>) => string;
  setAppointmentStatus: (id: string, status: DoctorAppointmentRecord['status']) => void;
  acknowledgeChange: (entry: Omit<ChangeAcknowledgement, 'id' | 'acknowledgedAt'>) => void;
  setPreferences: (updates: Partial<DoctorPreferences>) => void;
}

const nowIso = () => new Date().toISOString();

export const useDoctorPortalStore = create<DoctorPortalState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      profile: {
        ownerEmail: '',
        fullName: '',
        professionalEmail: '',
        phone: '',
        medicalRegistrationNumber: '',
        qualification: '',
        specialization: '',
        yearsExperience: 0
      },
      verificationStatus: 'NOT_SUBMITTED',
      documents: {
        medicalCertificate: { name: '', uploadedAt: null, status: 'MISSING' },
        identity: { name: '', uploadedAt: null, status: 'MISSING' },
        hospitalAffiliation: { name: '', uploadedAt: null, status: 'MISSING' }
      },
      identityReference: '',
      clinic: {
        // No fabricated clinic identity. These fields are completed during clinic
        // onboarding and deployment configuration; empty values are shown as
        // "Not configured" rather than a made-up hospital or phone number.
        hospitalName: '',
        department: 'Neurology & Cognitive Health',
        address: '',
        institutionId: '',
        contactPhone: '',
        contactEmail: '',
        otherClinicians: []
      },
      registeredPatients: [],
      clinicalContexts: {},
      // No demo patients or clinicians are seeded; assignments are created as
      // real patients are registered and assigned.
      assignments: {},
      notes: [],
      carePlans: [],
      referrals: [],
      appointments: [],
      changeAcknowledgements: [],
      preferences: {
        emailNewAssessment: true,
        emailChangeAlert: true,
        emailFollowUp: true,
        dailyDigest: false,
        twoFactor: true,
        sessionTimeout: true,
        shareForSecondOpinion: false
      },

      setProfile: (updates) =>
        set((state) => ({ profile: { ...state.profile, ...updates } })),
      setVerificationStatus: (verificationStatus) => set({ verificationStatus }),
      uploadDocument: (key, fileName) =>
        set((state) => ({
          documents: {
            ...state.documents,
            [key]: {
              name: fileName,
              uploadedAt: nowIso(),
              status: 'UPLOADED'
            }
          },
          verificationStatus: state.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'IN_PROGRESS'
        })),
      setIdentityReference: (identityReference) => set({ identityReference }),
      setClinic: (updates) => set((state) => ({ clinic: { ...state.clinic, ...updates } })),
      addClinician: (clinician) =>
        set((state) => ({
          clinic: {
            ...state.clinic,
            otherClinicians: [
              ...state.clinic.otherClinicians,
              { ...clinician, id: `clinic-doc-${Date.now()}` }
            ]
          }
        })),
      removeClinician: (id) =>
        set((state) => ({
          clinic: {
            ...state.clinic,
            otherClinicians: state.clinic.otherClinicians.filter((clinician) => clinician.id !== id)
          }
        })),
      completeOnboarding: () => set({ onboardingComplete: true }),
      addPatient: (patient) => {
        const patientId = `CV-2026-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const record: RegisteredPatient = {
          ...patient,
          id: `local-patient-${Date.now()}`,
          patientId,
          registeredAt: nowIso()
        };
        set((state) => ({
          registeredPatients: [record, ...state.registeredPatients],
          assignments: {
            ...state.assignments,
            [patientId]: patient.assignedDoctor
          }
        }));
        return patientId;
      },
      hydratePatients: (patients) =>
        set((state) => {
          const merged = new Map(state.registeredPatients.map((patient) => [patient.patientId, patient]));
          for (const patient of patients) {
            if (!patient?.patientId || merged.has(patient.patientId)) continue;
            merged.set(patient.patientId, {
              id: patient.id,
              patientId: patient.patientId,
              name: patient.name,
              age: patient.age,
              dob: '',
              gender: patient.gender || '',
              email: patient.email || '',
              phone: patient.phone || '',
              language: 'en',
              conditions: '',
              medications: '',
              familyHistory: '',
              assignedDoctor: '',
              consentConfirmed: true,
              invitationStatus: 'NOT_SENT',
              invitationEmail: patient.email || '',
              registeredAt: ''
            });
          }
          return { registeredPatients: Array.from(merged.values()) };
        }),
      setAssignment: (patientId, clinician) =>
        set((state) => ({
          assignments: { ...state.assignments, [patientId]: clinician }
        })),
      addNote: (note) =>
        set((state) => ({
          notes: [
            { ...note, id: `note-${Date.now()}`, createdAt: nowIso() },
            ...state.notes
          ]
        })),
      saveCarePlan: (plan) =>
        set((state) => ({
          carePlans: [
            { ...plan, approvedAt: nowIso() },
            ...state.carePlans.filter(
              (item) =>
                !(item.patientId === plan.patientId && item.assessmentId === plan.assessmentId)
            )
          ]
        })),
      setReferrals: (referrals) => set({ referrals }),
      addReferral: (referral) => {
        const id = referral.id || `ref-${Date.now()}`;
        set((state) => ({
          referrals: [
            {
              ...referral,
              id,
              createdAt: nowIso(),
              updatedAt: nowIso()
            },
            ...state.referrals
          ]
        }));
        return id;
      },
      setReferralStatus: (id, status) =>
        set((state) => ({
          referrals: state.referrals.map((referral) =>
            referral.id === id ? { ...referral, status, updatedAt: nowIso() } : referral
          )
        })),
      setAppointments: (appointments) => set({ appointments }),
      addAppointment: (appointment) => {
        const id = appointment.id || `apt-${Date.now()}`;
        set((state) => ({
          appointments: [
            { ...appointment, id, createdAt: nowIso() },
            ...state.appointments
          ]
        }));
        return id;
      },
      setAppointmentStatus: (id, status) =>
        set((state) => ({
          appointments: state.appointments.map((appointment) =>
            appointment.id === id ? { ...appointment, status } : appointment
          )
        })),
      acknowledgeChange: (entry) =>
        set((state) => ({
          changeAcknowledgements: [
            {
              ...entry,
              id: `ack-${Date.now()}`,
              acknowledgedAt: nowIso()
            },
            ...state.changeAcknowledgements
          ]
        })),
      setPreferences: (updates) =>
        set((state) => ({ preferences: { ...state.preferences, ...updates } }))
    }),
    { name: 'nl_doctor_portal' }
  )
);

export const doctorPortalDefaults = {
  clinicianName: '',
  clinicianRole: 'Consultant Neurologist',
  hospital: '',
  department: 'Neurology & Cognitive Health'
};

export type { DoctorPortalState };
