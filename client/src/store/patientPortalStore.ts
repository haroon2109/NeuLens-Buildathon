import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TextSize = 'normal' | 'large' | 'xlarge';
export type ConsentKey =
  | 'dataCollection'
  | 'cameraMic'
  | 'processing'
  | 'clinicianAccess'
  | 'optionalSharing'
  | 'withdrawalAcknowledged';

export interface ConsentState {
  dataCollection: boolean;
  cameraMic: boolean;
  processing: boolean;
  clinicianAccess: boolean;
  optionalSharing: boolean;
  withdrawalAcknowledged: boolean;
  signedAt: string | null;
  history: Array<{ action: string; detail: string; at: string }>;
}

export interface Appointment {
  id: string;
  title: string;
  clinician: string;
  location: string;
  date: string;
  time: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  notes?: string;
}

export interface PortalNotification {
  id: string;
  title: string;
  detail: string;
  category: 'ASSESSMENT' | 'APPOINTMENT' | 'REVIEW' | 'CARE_PLAN' | 'ACCOUNT';
  date: string;
  read: boolean;
}

export interface PatientDocument {
  id: string;
  title: string;
  type: 'Assessment report' | 'Clinician summary' | 'Care plan';
  date: string;
  status: 'Available' | 'Pending review';
  summary: string;
}

interface PatientPortalState {
  onboardingComplete: boolean;
  personal: {
    fullName: string;
    dateOfBirth: string;
    language: string;
    education: string;
    email: string;
    phone: string;
    emergencyName: string;
    emergencyPhone: string;
  };
  health: {
    conditions: string[];
    medications: string;
    sensory: string[];
    familyHistory: string;
    previousAssessments: string;
    lifestyleNotes: string;
    /**
     * Optional, consent-gated genomic context supplied by the patient.
     * NeuLens stores what was shared for clinician context only. It does not
     * interpret variants, calculate genetic risk, or change any score.
     */
    genomicConsent: boolean;
    genomicSummary: string;
  };
  consent: ConsentState;
  accessibility: {
    language: string;
    textSize: TextSize;
    highContrast: boolean;
    audioInstructions: boolean;
    touchPreference: string;
    cameraTested: boolean;
    micTested: boolean;
  };
  sleep: {
    durationHours: number;
    quality: number;
    awakenings: number;
    activeMinutes: number;
    steps: number;
    socialEngagement: number;
    notes: string;
  };
  wellbeing: {
    mood: number;
    stress: number;
    motivation: number;
    notes: string;
  };
  appointments: Appointment[];
  notifications: PortalNotification[];
  documents: PatientDocument[];
  carePlan: {
    approvedBy: string;
    approvedAt: string;
    nextReview: string;
    progress: number;
    steps: Array<{ id: string; title: string; detail: string; done: boolean }>;
  };
  privacy: {
    optionalSharing: boolean;
    deletionRequested: boolean;
    connectedDevices: Array<{ id: string; label: string; lastActive: string }>;
    requests: Array<{ id: string; type: string; status: string; date: string }>;
  };
  account: {
    emailUpdates: boolean;
    smsReminders: boolean;
    twoFactor: boolean;
  };

  setPersonal: (updates: Partial<PatientPortalState['personal']>) => void;
  setHealth: (updates: Partial<PatientPortalState['health']>) => void;
  setConsent: (key: ConsentKey, value: boolean) => void;
  signConsent: () => void;
  setAccessibility: (updates: Partial<PatientPortalState['accessibility']>) => void;
  completeOnboarding: () => void;
  setSleep: (updates: Partial<PatientPortalState['sleep']>) => void;
  setWellbeing: (updates: Partial<PatientPortalState['wellbeing']>) => void;
  setAppointments: (appointments: Appointment[]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  cancelAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, date: string, time: string) => void;
  toggleCareStep: (id: string) => void;
  setSharing: (value: boolean) => void;
  requestDeletion: () => void;
  removeDevice: (id: string) => void;
  setAccount: (updates: Partial<PatientPortalState['account']>) => void;
  logDocumentAccess: (id: string) => void;
  documentAccess: Array<{ id: string; title: string; at: string }>;
}

const nowIso = () => new Date().toISOString();

export const usePatientPortalStore = create<PatientPortalState>()(
  persist(
    (set, get) => ({
      onboardingComplete: false,
      personal: {
        fullName: '',
        dateOfBirth: '',
        language: 'en',
        education: '',
        email: '',
        phone: '',
        emergencyName: '',
        emergencyPhone: ''
      },
      health: {
        conditions: [],
        medications: '',
        sensory: [],
        familyHistory: '',
        previousAssessments: 'No previous assessments',
        lifestyleNotes: '',
        genomicConsent: false,
        genomicSummary: ''
      },
      consent: {
        dataCollection: false,
        cameraMic: false,
        processing: false,
        clinicianAccess: false,
        optionalSharing: false,
        withdrawalAcknowledged: false,
        signedAt: null,
        history: []
      },
      accessibility: {
        language: 'en',
        textSize: 'normal',
        highContrast: false,
        audioInstructions: true,
        touchPreference: 'Large tap targets',
        cameraTested: false,
        micTested: false
      },
      sleep: {
        durationHours: 0,
        quality: 0,
        awakenings: 0,
        activeMinutes: 0,
        steps: 0,
        socialEngagement: 0,
        notes: ''
      },
      wellbeing: {
        mood: 0,
        stress: 0,
        motivation: 0,
        notes: ''
      },
      appointments: [],
      notifications: [],
      documents: [],
      carePlan: {
        approvedBy: '',
        approvedAt: '',
        nextReview: '',
        progress: 0,
        steps: []
      },
      privacy: {
        optionalSharing: false,
        deletionRequested: false,
        connectedDevices: [],
        requests: []
      },
      account: {
        emailUpdates: true,
        smsReminders: true,
        twoFactor: false
      },
      documentAccess: [],

      setPersonal: (updates) => set((state) => ({ personal: { ...state.personal, ...updates } })),
      setHealth: (updates) => set((state) => ({ health: { ...state.health, ...updates } })),
      setConsent: (key, value) =>
        set((state) => ({ consent: { ...state.consent, [key]: value } })),
      signConsent: () =>
        set((state) => ({
          consent: {
            ...state.consent,
            signedAt: nowIso(),
            history: [
              ...state.consent.history,
              {
                action: 'Consent recorded',
                detail: 'Onboarding consent and privacy choices saved.',
                at: nowIso()
              }
            ]
          }
        })),
      setAccessibility: (updates) =>
        set((state) => ({ accessibility: { ...state.accessibility, ...updates } })),
      completeOnboarding: () => set({ onboardingComplete: true }),
      setSleep: (updates) => set((state) => ({ sleep: { ...state.sleep, ...updates } })),
      setWellbeing: (updates) => set((state) => ({ wellbeing: { ...state.wellbeing, ...updates } })),
      setAppointments: (appointments) => set({ appointments }),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item
          )
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, read: true }))
        })),
      cancelAppointment: (id) =>
        set((state) => ({
          appointments: state.appointments.map((item) =>
            item.id === id ? { ...item, status: 'CANCELLED' } : item
          )
        })),
      rescheduleAppointment: (id, date, time) =>
        set((state) => ({
          appointments: state.appointments.map((item) =>
            item.id === id ? { ...item, date, time, status: 'RESCHEDULED' } : item
          )
        })),
      toggleCareStep: (id) => {
        const nextSteps = get().carePlan.steps.map((step) =>
          step.id === id ? { ...step, done: !step.done } : step
        );
        const done = nextSteps.filter((step) => step.done).length;
        set({
          carePlan: {
            ...get().carePlan,
            steps: nextSteps,
            progress: Math.round((done / nextSteps.length) * 100)
          }
        });
      },
      setSharing: (value) =>
        set((state) => ({
          privacy: { ...state.privacy, optionalSharing: value },
          consent: {
            ...state.consent,
            optionalSharing: value,
            history: [
              ...state.consent.history,
              {
                action: value ? 'Optional sharing enabled' : 'Optional sharing disabled',
                detail: 'Patient updated optional data-sharing permission.',
                at: nowIso()
              }
            ]
          }
        })),
      requestDeletion: () =>
        set((state) => ({
          privacy: {
            ...state.privacy,
            deletionRequested: true,
            requests: [
              ...state.privacy.requests,
              {
                id: `req-${Date.now()}`,
                type: 'Account deletion request',
                status: 'Submitted · awaiting verification',
                date: new Date().toISOString().slice(0, 10)
              }
            ]
          }
        })),
      removeDevice: (id) =>
        set((state) => ({
          privacy: {
            ...state.privacy,
            connectedDevices: state.privacy.connectedDevices.filter((device) => device.id !== id)
          }
        })),
      setAccount: (updates) =>
        set((state) => ({ account: { ...state.account, ...updates } })),
      logDocumentAccess: (id) =>
        set((state) => {
          const document = state.documents.find((item) => item.id === id);
          if (!document) return state;
          return {
            documentAccess: [
              { id, title: document.title, at: nowIso() },
              ...state.documentAccess
            ].slice(0, 10)
          };
        })
    }),
    { name: 'nl_patient_portal' }
  )
);

export const treatmentTeam = {
  doctor: '',
  role: '',
  institution: '',
  department: '',
  phone: '',
  email: '',
  nextReview: ''
};
