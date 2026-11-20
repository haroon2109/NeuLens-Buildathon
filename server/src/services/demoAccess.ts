import bcrypt from 'bcryptjs';
import { accounts, type AccountRecord } from '../controllers/account.controller';
import { DEMO_CLINICIAN_USER_ID, DEMO_PATIENT_USER_ID, demoAccessEnabled } from './demoRecords';
import {
  inMemoryUsers,
  inMemoryAssessments,
  inMemoryBaselines,
  inMemoryLongitudinalRecords,
  inMemoryChangeDetections,
  inMemoryContextInputs,
  inMemoryBrainHealthProfiles,
  inMemoryAppointments,
  inMemoryExternalInstruments,
  type UserRecord,
  type AssessmentRecord,
  type BaselineRecord,
  type LongitudinalRecordRecord,
  type ChangeDetectionRecord,
  type ContextInputRecord,
  type BrainHealthProfileRecord,
  type AppointmentRecord,
  type ExternalInstrumentRecord,
} from '../models/dataStore';

/**
 * Fictional jury accounts for the prototype.
 *
 * These are deliberately separate from real clinical accounts: the patient is a
 * made-up person and the clinician is a demo profile. Only the sign-in records
 * are seeded; no screening history, scores or sensor measurements are invented
 * for them, so both portals show exactly what has actually been measured.
 */
export const DEMO_PATIENT = {
  email: 'patient.demo@neulens.ai',
  password: 'DemoPatient2026!',
  name: 'Haroon',
  patientId: 'CV-2026-HAROON',
  pin: '246810',
};

export const DEMO_DOCTOR = {
  email: 'doctor.demo@neulens.ai',
  password: 'DemoDoctor2026!',
  name: 'Dr. Mohamed',
};

const DEMO_PATIENT_ACCOUNT_ID = 'acct_demo_patient';
const DEMO_DOCTOR_ACCOUNT_ID = 'acct_demo_doctor';

export { demoAccessEnabled } from './demoRecords';

function ensureDemoPatientUser(): UserRecord {
  const existing = inMemoryUsers.find((user) => user.id === DEMO_PATIENT_USER_ID);
  if (existing) return existing;

  const now = new Date();
  const user: UserRecord = {
    id: DEMO_PATIENT_USER_ID,
    patientId: DEMO_PATIENT.patientId,
    name: DEMO_PATIENT.name,
    email: 'haroon@demo.neulens.ai',
    // The portal uses the PIN; this random hash is only a non-login placeholder.
    passwordHash: bcrypt.hashSync(`internal-${Date.now()}-${Math.random()}`, 10),
    role: 'PATIENT',
    age: 62,
    dob: '1964-03-11',
    pinHash: bcrypt.hashSync(DEMO_PATIENT.pin, 10),
    failedLoginAttempts: 0,
    lockedUntil: null,
    gender: 'MALE',
    language: 'en',
    educationYears: 14,
    handedness: 'RIGHT',
    createdAt: now,
    updatedAt: now,
  };

  inMemoryUsers.push(user);
  return user;
}

const DEMO_DOCTOR_USER_ID = DEMO_CLINICIAN_USER_ID;

/**
 * The doctor portal signs in against the clinical user table, while the shared
 * account endpoint uses its own account store. Seed the demo clinician into
 * both so the documented demo credentials work from either portal.
 */
function ensureDemoDoctorUser(): UserRecord {
  const existing = inMemoryUsers.find((user) => user.id === DEMO_DOCTOR_USER_ID);
  if (existing) return existing;

  const now = new Date();
  const user: UserRecord = {
    id: DEMO_DOCTOR_USER_ID,
    patientId: null,
    name: DEMO_DOCTOR.name,
    email: DEMO_DOCTOR.email,
    passwordHash: bcrypt.hashSync(DEMO_DOCTOR.password, 10),
    role: 'CLINICIAN',
    age: 0,
    gender: 'PREFER_NOT_TO_SAY',
    language: 'en',
    educationYears: null,
    handedness: null,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryUsers.push(user);
  return user;
}

function ensureDemoAccount(account: AccountRecord): void {
  if (!accounts.some((entry) => entry.email === account.email)) {
    accounts.push(account);
  }
}

function seedDemoPatientHistory(): void {
  if (inMemoryAssessments.some((a) => a.userId === DEMO_PATIENT_USER_ID)) {
    return;
  }

  const baselineDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const followUpDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const baselineId = 'demo-baseline-haroon';
  const baselineAssessId = 'demo-assess-haroon-1';
  const followUpAssessId = 'demo-assess-haroon-2';
  const changeDetectionId = 'demo-change-haroon-1';

  // 1. Personal baseline record (established 60 days ago)
  const baseline: BaselineRecord = {
    id: baselineId,
    userId: DEMO_PATIENT_USER_ID,
    establishedAt: baselineDate,
    overallScore: 86.5,
    cognitiveScore: 87.0,
    functionalScore: 92.0,
    eyeScore: 90.0,
    voiceScore: 92.0,
    faceScore: 95.0,
    contextScore: 88.0,
    isActive: true,
  };
  inMemoryBaselines.push(baseline);

  // 2. Multimodal assessments
  // Assessment 1: Intake baseline screening (60 days ago) - Reviewed by Dr. Mohamed
  const assess1: AssessmentRecord = {
    id: baselineAssessId,
    userId: DEMO_PATIENT_USER_ID,
    date: baselineDate,
    overallScore: 86.5,
    reviewState: 'CLINICIAN_REVIEWED',
    status: 'COMPLETED',
    reviewStatus: 'REVIEWED',
    reviewedBy: DEMO_DOCTOR.name,
    reviewedAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000),
    baselineId,
    eyeMetrics: {
      reactionTime: 232.0,
      blinkRate: 14.0,
      fixationScore: 90.0,
    },
    voiceMetrics: {
      speechRate: 144.0,
      pauseScore: 92.0,
      jitter: 0.12,
      shimmer: 1.18,
    },
    faceMetrics: {
      symmetry: 95.0,
      tremorScore: 8.0,
    },
    taskResponses: {
      mode: 'DEMO',
      quality: { status: 'GOOD', signalQuality: 94 },
      task2: { score: 90, label: 'Visual spatial pattern matching' },
      task3: { score: 88, label: 'Acoustic verbal fluency' },
      task5: { score: 85, label: 'Executive number sequencing' },
      functionalAssessment: { score: 92, label: 'Daily Functional Ability' },
      dailyFunction: { score: 92 },
      cognitiveSummary: {
        score: 86.5,
        category: 'NORMAL_BASELINE',
        summary: 'Robust working memory, fluid processing speed, and intact executive sequencing.',
      },
    },
    report: {
      id: 'rep-demo-1',
      recommendation:
        'Baseline multimodal cognitive battery completed. Performance aligns with age- and education-adjusted reference parameters.',
      doctorNotes:
        'Comprehensive baseline established by Dr. Mohamed. Patient is alert, attentive, and fully oriented. Strong visuospatial and verbal fluency performance. Recommended standard longitudinal cadence (6-12 months).',
      pdfUrl: null,
    },
  };

  // Assessment 2: Follow-up screening (14 days ago) - Pending clinical review
  const assess2: AssessmentRecord = {
    id: followUpAssessId,
    userId: DEMO_PATIENT_USER_ID,
    date: followUpDate,
    overallScore: 81.0,
    reviewState: 'REVIEW_PROMPT',
    status: 'COMPLETED',
    reviewStatus: 'PENDING_REVIEW',
    baselineId,
    eyeMetrics: {
      reactionTime: 268.0,
      blinkRate: 16.0,
      fixationScore: 83.0,
    },
    voiceMetrics: {
      speechRate: 132.0,
      pauseScore: 81.0,
      jitter: 0.19,
      shimmer: 1.48,
    },
    faceMetrics: {
      symmetry: 91.0,
      tremorScore: 14.0,
    },
    taskResponses: {
      mode: 'DEMO',
      quality: { status: 'ACCEPTABLE', signalQuality: 88 },
      task2: { score: 84, label: 'Visual spatial pattern matching' },
      task3: { score: 80, label: 'Acoustic verbal fluency' },
      task5: { score: 79, label: 'Executive number sequencing' },
      functionalAssessment: { score: 86, label: 'Daily Functional Ability' },
      dailyFunction: { score: 86 },
      cognitiveSummary: {
        score: 81.0,
        category: 'REVIEW_SUGGESTED',
        summary:
          'Subtle variation observed in executive sequencing latency and acoustic pauses relative to 60-day baseline.',
      },
    },
    report: {
      id: 'rep-demo-2',
      recommendation:
        'Multimodal screening battery recorded. Subtle variation observed in saccadic reaction speed and speech pause intervals compared to personal baseline. Attending physician review recommended.',
      doctorNotes: '',
      pdfUrl: null,
    },
  };

  // Sorted newest first
  inMemoryAssessments.unshift(assess2, assess1);

  // 3. Longitudinal records tracking progression over time
  inMemoryLongitudinalRecords.push(
    {
      id: 'demo-long-1',
      userId: DEMO_PATIENT_USER_ID,
      assessmentId: baselineAssessId,
      recordedAt: baselineDate,
      overallScore: 86.5,
      changeFromBaseline: 0,
      trendDirection: 'STABLE',
      assessmentsCount: 1,
    },
    {
      id: 'demo-long-2',
      userId: DEMO_PATIENT_USER_ID,
      assessmentId: followUpAssessId,
      recordedAt: followUpDate,
      overallScore: 81.0,
      changeFromBaseline: -5.5,
      trendDirection: 'DECLINING',
      assessmentsCount: 2,
    }
  );

  // 4. Change detection record linking to personal baseline
  inMemoryChangeDetections.push({
    id: changeDetectionId,
    userId: DEMO_PATIENT_USER_ID,
    baselineId,
    detectedAt: followUpDate,
    status: 'REVIEW',
    cognitiveChange: -5.5,
    outsideBaseline: true,
    reviewReasons: [
      'Cognitive composite score shifted by -5.5 points relative to 60-day personal baseline.',
      'Saccadic reaction latency increased from 232ms to 268ms.',
      'Acoustic pause duration increased during serial recall task.',
    ],
  });

  // 5. Brain health profile
  inMemoryBrainHealthProfiles.push({
    id: 'demo-bhp-haroon-1',
    userId: DEMO_PATIENT_USER_ID,
    changeDetectionId,
    profileScore: 81.0,
    reviewSignal: 'REVIEW_PROMPT',
    interpretation:
      "Longitudinal monitoring identified a 5.5-point variance compared to Haroon's 60-day baseline, with subtle latency changes in ocular saccades and spoken pause intervals. Modifiable sleep quality and metabolic risk factors warrant primary care review.",
    nextSteps: [
      { action: 'Review clinical findings with Dr. Mohamed', timeline: 'Upcoming consultation' },
      { action: 'Optimize sleep hygiene and address sleep fragmentation', timeline: 'Active' },
      { action: 'Repeat multimodal screening battery in 60-90 days to track trend trajectory', timeline: 'Scheduled' },
    ],
    generatedAt: followUpDate,
    reviewedAt: null,
    reviewedBy: null,
  });

  // 6. Integrated physical, metabolic & sleep context
  inMemoryContextInputs.push(
    {
      id: 'demo-ctx-sleep',
      userId: DEMO_PATIENT_USER_ID,
      assessmentId: followUpAssessId,
      source: 'sleep',
      recordedAt: followUpDate,
      values: { durationHours: 6.2, quality: 3, awakenings: 2, sleepLatencyMin: 25 },
      consentGranted: true,
      consentAt: baselineDate,
    },
    {
      id: 'demo-ctx-act',
      userId: DEMO_PATIENT_USER_ID,
      assessmentId: followUpAssessId,
      source: 'lifestyle_activity',
      recordedAt: followUpDate,
      values: { steps: 6500, activeMinutes: 35, exerciseDaysPerWeek: 3, activityType: 'Brisk Walking' },
      consentGranted: true,
      consentAt: baselineDate,
    },
    {
      id: 'demo-ctx-clin',
      userId: DEMO_PATIENT_USER_ID,
      assessmentId: followUpAssessId,
      source: 'clinical_metabolic',
      recordedAt: followUpDate,
      values: { hba1c: 5.7, systolicBp: 126, diastolicBp: 82, bmi: 25.4, familyHistoryCognitiveChange: true },
      consentGranted: true,
      consentAt: baselineDate,
    }
  );

  // 7. Clinical follow-up appointment with Dr. Mohamed
  const upcomingApptDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  inMemoryAppointments.push({
    id: 'demo-appt-haroon-1',
    patientId: DEMO_PATIENT_USER_ID,
    assessmentId: followUpAssessId,
    title: 'Cognitive Health Review & Prevention Plan Consultation',
    type: 'RESULTS_REVIEW',
    date: upcomingApptDate,
    time: '10:30 AM',
    location: 'Neurology Department, Clinic Room 3B',
    status: 'UPCOMING',
    communication:
      'Follow-up consultation to review recent longitudinal assessment observations with Dr. Mohamed.',
    clinician: 'Dr. Mohamed',
    createdBy: DEMO_CLINICIAN_USER_ID,
    createdAt: followUpDate,
    updatedAt: followUpDate,
  });

  // 8. External validated instrument record (MoCA test administered by Dr. Mohamed)
  inMemoryExternalInstruments.push({
    id: 'demo-ext-moca-haroon',
    patientId: DEMO_PATIENT_USER_ID,
    instrumentKey: 'MOCA',
    instrumentVersion: '8.1',
    language: 'en',
    administeredOn: baselineDate,
    administeredBy: 'Dr. Mohamed',
    score: 27,
    maxScore: 30,
    licenceConfirmed: true,
    licenceReference: 'MOCA-IN-CLINICAL-2026',
    notes:
      'Baseline Montreal Cognitive Assessment administered by Dr. Mohamed at clinic intake. Visuospatial 5/5, naming 3/3, attention 5/6, language 2/3, abstraction 2/2, delayed recall 4/5, orientation 6/6.',
    recordedBy: DEMO_CLINICIAN_USER_ID,
    createdAt: baselineDate,
  });
}

/**
 * Seeds the fictional sign-in accounts. Called once as the API starts.
 * The accounts are verified so the jury is not sent through OTP or approval.
 */
export function seedDemoAccess(): void {
  if (!demoAccessEnabled()) return;

  const patient = ensureDemoPatientUser();
  ensureDemoDoctorUser();
  seedDemoPatientHistory();

  const now = new Date();

  ensureDemoAccount({
    id: DEMO_PATIENT_ACCOUNT_ID,
    role: 'PATIENT',
    name: DEMO_PATIENT.name,
    email: DEMO_PATIENT.email,
    phone: '+919876543210',
    passwordHash: bcrypt.hashSync(DEMO_PATIENT.password, 10),
    verificationStatus: 'VERIFIED',
    emailVerified: true,
    patientId: DEMO_PATIENT.patientId,
    hospitalUserId: patient.id,
    language: 'en',
    createdAt: now,
    updatedAt: now,
  });

  ensureDemoAccount({
    id: DEMO_DOCTOR_ACCOUNT_ID,
    role: 'CLINICIAN',
    name: DEMO_DOCTOR.name,
    email: DEMO_DOCTOR.email,
    phone: '+919876543211',
    passwordHash: bcrypt.hashSync(DEMO_DOCTOR.password, 10),
    verificationStatus: 'VERIFIED',
    emailVerified: true,
    patientId: null,
    hospitalUserId: DEMO_DOCTOR_USER_ID,
    specialty: 'Neurology',
    professionalRegistrationNumber: 'DEMO-REG-2026-001',
    yearsExperience: 12,
    institutionName: 'Apollo Memory & Brain Health Clinic',
    city: 'Bengaluru',
    language: 'en',
    createdAt: now,
    updatedAt: now,
  });

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[NeuLens Demo]: Jury demo access is enabled in production. Set DEMO_ACCESS_ENABLED=false for a clinical deployment.'
    );
  }
}
