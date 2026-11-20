export type DemoRole = 'patient' | 'doctor';

export const DEMO_ACCOUNTS = {
  patient: {
    email: 'patient.demo@neulens.ai',
    password: 'DemoPatient2026!',
    name: 'Haroon',
    patientId: 'CV-2026-HAROON',
    pin: '246810',
  },
  doctor: {
    email: 'doctor.demo@neulens.ai',
    password: 'DemoDoctor2026!',
    name: 'Dr. Mohamed',
  },
} as const;
