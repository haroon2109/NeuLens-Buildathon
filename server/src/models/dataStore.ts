import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { summarizePatientChanges } from '../services/changeMonitor';
import { isInterpretableScore, toReviewState, type ReviewState } from '../services/reviewState';
import { isDemoAssessment, isDemoUserId, demoAccessEnabled } from '../services/demoRecords';

export interface UserRecord {
  id: string;
  patientId?: string | null;
  name: string;
  email: string;
  passwordHash: string;
  role: 'PATIENT' | 'CLINICIAN' | 'ADMIN';
  age: number;
  dob?: string | null;
  pinHash?: string | null;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  gender: string;
  language: string;
  educationYears?: number | null;
  handedness?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentRecord {
  id: string;
  userId: string;
  date: Date;
  overallScore: number | null; // null when the session produced no interpretable score
  reviewState: string; // administrative review state — never a clinical risk tier
  status: string;    // 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'
  reviewStatus: string; // 'PENDING_REVIEW' | 'REVIEWED' | 'FOLLOWUP_REQUIRED'
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  taskResponses?: any;
  baselineId?: string | null;
  eyeMetrics?: {
    reactionTime: number;
    blinkRate: number;
    fixationScore: number;
  } | null;
  voiceMetrics?: {
    speechRate: number;
    pauseScore: number;
    jitter: number;
    shimmer: number;
  } | null;
  faceMetrics?: {
    symmetry: number;
    tremorScore: number;
  } | null;
  report?: {
    id: string;
    recommendation: string;
    doctorNotes: string;
    pdfUrl?: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// NEW INTERFACES — Baseline, Longitudinal, Change Detection, Context Input,
// Brain Health Profile
// ---------------------------------------------------------------------------

export interface BaselineRecord {
  id: string;
  userId: string;
  establishedAt: Date;
  overallScore: number;
  cognitiveScore: number;
  functionalScore: number;
  eyeScore: number | null;
  voiceScore: number | null;
  faceScore: number | null;
  contextScore: number | null;
  isActive: boolean;
}

export interface LongitudinalRecordRecord {
  id: string;
  userId: string;
  assessmentId: string;
  recordedAt: Date;
  overallScore: number;
  changeFromBaseline: number | null;
  trendDirection: string | null;
  assessmentsCount: number;
}

export interface ChangeDetectionRecord {
  id: string;
  userId: string;
  baselineId: string | null; // null when no personal baseline exists to compare against
  detectedAt: Date;
  status: string; // NO_CHANGE | REVIEW | INSUFFICIENT_DATA
  cognitiveChange: number | null;
  outsideBaseline: boolean;
  reviewReasons: string[] | null;
}

export interface ContextInputRecord {
  id: string;
  userId: string;
  assessmentId: string | null;
  source: string; // sleep | lifestyle_activity | clinical_metabolic | wearable
  recordedAt: Date;
  values: any;
  consentGranted: boolean;
  consentAt: Date | null;
}

export interface BrainHealthProfileRecord {
  id: string;
  userId: string;
  changeDetectionId: string;
  profileScore: number | null;
  reviewSignal: string;
  interpretation: string;
  nextSteps: any[];
  generatedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}

export type ReferralType = 'PRIMARY_CARE' | 'NEUROLOGY' | 'GERIATRICS' | 'MENTAL_HEALTH' | 'COGNITIVE_CLINIC' | 'OTHER';
export type ReferralWorkflowStatus = 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'COMPLETED' | 'DECLINED' | 'CANCELLED';
export type ReferralOutcomeStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'DECLINED' | 'FOLLOW_UP_REQUIRED';

export interface ConsentRecord {
  id: string;
  userId: string;
  version: string;
  scopes: Record<string, boolean>;
  granted: boolean;
  grantedAt: Date;
  withdrawnAt: Date | null;
  actorRole: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface CarePlanRecord {
  id: string;
  patientId: string;
  assessmentId: string;
  action: string;
  followUpDate: string | null;
  notes: string;
  plan?: Record<string, unknown> | null;
  version: number;
  savedBy: string;
  savedAt: Date;
}

export interface AppointmentRecord {
  id: string;
  patientId: string;
  assessmentId: string | null;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  status: string;
  communication: string;
  clinician: string;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A score from a validated instrument administered by a clinician outside the
 * platform. Written by hand, never computed here; see
 * `services/externalInstruments.ts` for the registry and the rules.
 */
export interface ExternalInstrumentRecord {
  id: string;
  patientId: string; // internal user id
  instrumentKey: string;
  instrumentVersion: string | null;
  language: string;
  administeredOn: Date;
  administeredBy: string;
  score: number;
  maxScore: number;
  licenceConfirmed: boolean;
  licenceReference: string | null;
  notes: string | null;
  recordedBy: string | null;
  createdAt: Date;
}

export interface ReferralOutcomeRecord {
  id: string;
  patientId: string; // internal user id
  assessmentId: string | null;
  type: ReferralType;
  reason: string;
  destination: string;
  urgency: 'ROUTINE' | 'PRIORITY' | 'URGENT';
  status: ReferralWorkflowStatus;
  outcomeStatus: ReferralOutcomeStatus;
  outcomeNotes: string | null;
  outcomeAt: Date | null;
  followUpDate: string | null; // YYYY-MM-DD
  closedLoop: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}


/**
 * Clinician and patient accounts are provisioned, never seeded.
 * Use `npm run clinician:create` to create a clinician account.
 */
export const inMemoryUsers: UserRecord[] = [];

export const inMemoryAssessments: AssessmentRecord[] = [];

export const inMemoryConsents: ConsentRecord[] = [];
export const inMemoryCarePlans: CarePlanRecord[] = [];
export const inMemoryAppointments: AppointmentRecord[] = [];

/** Memory fallback is a development aid; production must fail loudly instead. */
export function memoryFallbackAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_IN_MEMORY_FALLBACK === 'true';
}

/**
 * Generate a unique, hospital-compliant Patient Identifier
 * Example format: CV-2026-8F3K92
 */
export function generatePatientIdentifier(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid 0, O, 1, I to prevent human transcription errors
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CV-2026-${suffix}`;
}

// ---------------------------------------------------------------------------
// NEW IN-MEMORY STORES — Baseline, Longitudinal, Change Detection, Context Input,
// Brain Health Profile (Prisma fallback for demo / offline mode)
// ---------------------------------------------------------------------------

export const inMemoryBaselines: BaselineRecord[] = [];
export const inMemoryLongitudinalRecords: LongitudinalRecordRecord[] = [];
export const inMemoryChangeDetections: ChangeDetectionRecord[] = [];
export const inMemoryContextInputs: ContextInputRecord[] = [];
export const inMemoryBrainHealthProfiles: BrainHealthProfileRecord[] = [];
export const inMemoryReferrals: ReferralOutcomeRecord[] = [];
export const inMemoryExternalInstruments: ExternalInstrumentRecord[] = [];

export class HospitalDataStore {
  // --------------------------------------------------------------------------
  // USER / PATIENT METHODS
  // --------------------------------------------------------------------------
  public static async findUserByEmail(email: string): Promise<UserRecord | null> {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) return user as unknown as UserRecord;
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
    }
    const mem = inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    return mem || null;
  }

  public static async findUserByPatientId(patientId: string): Promise<UserRecord | null> {
    const normalized = patientId.trim().toUpperCase();
    try {
      const user = await prisma.user.findFirst({
        where: { patientId: normalized }
      });
      if (user) return user as unknown as UserRecord;
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
    }
    const mem = inMemoryUsers.find(
      u => u.patientId && u.patientId.toUpperCase() === normalized
    );
    return mem || null;
  }

  public static async findUserById(id: string): Promise<UserRecord | null> {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user) return user as unknown as UserRecord;
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
    }
    const mem = inMemoryUsers.find(u => u.id === id);
    return mem || null;
  }

  /**
   * Compares a patient PIN against the stored bcrypt hash.
   * bcrypt comparison is constant-time with respect to the hash contents.
   */
  public static verifyPatientPin(user: UserRecord, pin: string): boolean {
    // Always do the work, even for accounts without a PIN, so response timing
    // does not reveal whether an account exists.
    const hash = user.pinHash || '$2a$12$GYDMreXgIc6ON2SmjaH6P.osI4v7EkzbYKUQO9jHe.ZBB9n4rjR9O';
    try {
      return bcrypt.compareSync(pin, hash);
    } catch {
      return false;
    }
  }

  public static lockState(user: UserRecord): { locked: boolean; retryAfterSeconds: number } {
    if (!user.lockedUntil) return { locked: false, retryAfterSeconds: 0 };
    const remaining = new Date(user.lockedUntil).getTime() - Date.now();
    if (remaining <= 0) return { locked: false, retryAfterSeconds: 0 };
    return { locked: true, retryAfterSeconds: Math.ceil(remaining / 1000) };
  }

  /** Increments the failed-attempt counter and locks the account after five failures. */
  public static async recordFailedLogin(user: UserRecord, maxAttempts = 5, lockMs = 15 * 60 * 1000): Promise<void> {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const lockedUntil = attempts >= maxAttempts ? new Date(Date.now() + lockMs) : null;
    user.failedLoginAttempts = lockedUntil ? 0 : attempts;
    user.lockedUntil = lockedUntil;
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: user.failedLoginAttempts, lockedUntil },
      });
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
    }
  }

  public static async clearFailedLogins(user: UserRecord): Promise<void> {
    if (user.failedLoginAttempts === 0 && !user.lockedUntil) return;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
    }
  }

  /** Creates a clinician account from a provisioning script; never seeds one. */
  public static async createClinician(data: {
    name: string;
    email: string;
    password: string;
    role?: 'CLINICIAN' | 'ADMIN';
  }): Promise<UserRecord> {
    const email = data.email.trim().toLowerCase();
    const existing = await this.findUserByEmail(email);
    if (existing) throw new Error(`An account already exists for ${email}`);

    const record: UserRecord = {
      id: `clinician-${crypto.randomUUID()}`,
      patientId: null,
      name: data.name.trim(),
      email,
      passwordHash: bcrypt.hashSync(data.password, 12),
      role: data.role || 'CLINICIAN',
      age: 0,
      gender: 'PREFER_NOT_TO_SAY',
      language: 'en',
      educationYears: null,
      handedness: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const created = await prisma.user.create({
        data: {
          name: record.name,
          email: record.email,
          passwordHash: record.passwordHash,
          role: record.role,
          age: record.age,
          gender: record.gender,
          language: record.language,
        },
      });
      return created as unknown as UserRecord;
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
      inMemoryUsers.push(record);
      return record;
    }
  }

  public static async createPatient(data: {
    name: string;
    age: number;
    dob?: string;
    /** Patient-portal PIN. Accounts created without one cannot use PIN sign-in
     * until clinic staff issue a PIN; there is no default PIN. */
    pin?: string;
    gender: string;
    language: string;
    educationYears?: number;
    handedness?: string;
  }): Promise<{ user: UserRecord; patientId: string }> {
    // Generate collision-resistant Patient ID (database lookup is best-effort;
    // if the DB is unavailable we skip collision checking and proceed with the
    // generated ID — it is already collision-resistant by design).
    let patientId: string | null = null;
    try {
      patientId = generatePatientIdentifier();
      let collision = await this.findUserByPatientId(patientId);
      let attempts = 0;
      while (collision && attempts < 10) {
        patientId = generatePatientIdentifier();
        collision = await this.findUserByPatientId(patientId);
        attempts++;
      }
    } catch (e) {
      console.warn('[HospitalDataStore]: Patient ID collision check skipped due to database error:', e instanceof Error ? e.message : e);
      patientId = generatePatientIdentifier();
    }

    // The PIN is a patient credential: it is hashed, never stored or returned.
    const pinHash = data.pin ? bcrypt.hashSync(data.pin, 12) : null;
    // The internal patient email is not a login credential, so its password is random.
    const passwordHash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);
    const email = `patient-${patientId!.toLowerCase().replace(/[^a-z0-9]/g, '')}@cognivision.hospital`;

    const userPayload: UserRecord = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      patientId: patientId!,
      name: data.name.trim(),
      email,
      passwordHash,
      role: 'PATIENT',
      age: data.age,
      dob: data.dob || String(new Date().getFullYear() - data.age),
      pinHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      gender: data.gender || 'PREFER_NOT_TO_SAY',
      language: data.language || 'en',
      educationYears: data.educationYears || 12,
      handedness: data.handedness || 'RIGHT',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const created = await prisma.user.create({
        data: {
          patientId: userPayload.patientId,
          name: userPayload.name,
          email: userPayload.email,
          passwordHash: userPayload.passwordHash,
          role: userPayload.role,
          age: userPayload.age,
          dob: userPayload.dob,
          pinHash: userPayload.pinHash,
          gender: userPayload.gender,
          language: userPayload.language,
          educationYears: userPayload.educationYears,
          handedness: userPayload.handedness
        }
      });
      // Also cache in memory for instantaneous queries
      inMemoryUsers.push(created as unknown as UserRecord);
      return { user: created as unknown as UserRecord, patientId: patientId! };
    } catch (e) {
      console.error('[HospitalDataStore]: Database write failed on createPatient:', e instanceof Error ? e.message : e);
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true') {
        throw new Error('Database storage failure: Unable to persist patient record to PostgreSQL. Operation aborted for clinical safety.');
      }
      // Fallback in-memory in dev or explicit demo fallback mode
      inMemoryUsers.push(userPayload);
      return { user: userPayload, patientId };
    }
  }

  // --------------------------------------------------------------------------
  // DOCTOR & CLINICAL MANAGEMENT METHODS
  // --------------------------------------------------------------------------
  public static async getDoctorDashboardStats(options: { includeDemo?: boolean } = {}): Promise<{
    totalPatients: number;
    assessmentsToday: number;
    completedAssessments: number;
    pendingReviews: number;
    changeReviewCount: number;
    changeReviewQueue: Array<{
      patientId: string;
      patientName: string;
      latestAssessmentDate: string;
      cognitiveChange: number | null;
      worsenedActivityIds: string[];
      reviewReasons: Array<'OUTSIDE_RELIABLE_CHANGE' | 'FUNCTIONAL_CHANGE' | 'CONTEXT_CHANGE'>;
    }>;
    recentAssessments: Array<{
      id: string;
      patientId: string;
      patientName: string;
      age: number;
      date: string;
      assessmentType: string;
      score: number | null;
      reviewState: string;
      reviewStatus: string;
    }>;
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let patients = inMemoryUsers.filter(u => u.role === 'PATIENT');
    let patientAssessments = new Map<string, AssessmentRecord[]>();
    try {
      const databasePatients = await prisma.user.findMany({
        where: { role: 'PATIENT' },
        include: { assessments: { where: { status: 'COMPLETED' } } }
      });
      const patientById = new Map(patients.map(patient => [patient.id, patient]));
      for (const patient of databasePatients) patientById.set(patient.id, patient as unknown as UserRecord);
      patients = Array.from(patientById.values());
      patientAssessments = new Map(databasePatients.map(patient => [
        patient.id,
        patient.assessments as unknown as AssessmentRecord[]
      ]));
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      console.warn('Prisma DB error fetching dashboard patients. Falling back to memory:', error);
    }

    const assessmentsForPatient = (patientId: string) => {
      const merged = new Map<string, AssessmentRecord>();
      for (const assessment of patientAssessments.get(patientId) || []) merged.set(assessment.id, assessment);
      for (const assessment of inMemoryAssessments) {
        if (assessment.userId === patientId) merged.set(assessment.id, assessment);
      }
      return Array.from(merged.values());
    };
    // Demonstration records are shown inside demo and jury modes;
    // they are excluded in clinical production unless demo access is active.
    const includeDemo = options.includeDemo ?? demoAccessEnabled();
    if (!includeDemo) patients = patients.filter(patient => !isDemoUserId(patient.id));
    const totalPatients = patients.length;

    // Assessments
    const completed = Array.from(new Map(
      patients.flatMap(patient => assessmentsForPatient(patient.id))
        .filter(assessment => assessment.status === 'COMPLETED')
        .filter(assessment => includeDemo || !isDemoAssessment(assessment))
        .map(assessment => [assessment.id, assessment])
    ).values());
    const assessmentsToday = completed.filter(a => new Date(a.date).getTime() >= todayStart.getTime()).length;
    const pendingReviews = completed.filter(a => a.reviewStatus === 'PENDING_REVIEW').length;
    const changeReviewQueue = patients.flatMap(patient => {
      const patientHistory = assessmentsForPatient(patient.id);
      const summary = summarizePatientChanges(patientHistory);
      if (summary.status !== 'REVIEW') return [];
      const latestAssessmentDate = patientHistory
        .filter(assessment => assessment.status === 'COMPLETED')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;
      if (!latestAssessmentDate) return [];
      return [{
        patientId: patient.patientId || 'CV-2026-UNKNOWN',
        patientName: patient.name,
        latestAssessmentDate: new Date(latestAssessmentDate).toISOString(),
        cognitiveChange: summary.cognitive.change,
        worsenedActivityIds: summary.function.worsenedActivityIds,
        reviewReasons: summary.reviewReasons
      }];
    }).sort((a, b) => b.latestAssessmentDate.localeCompare(a.latestAssessmentDate));

    // Recent assessments with patient resolution
    const recent = completed
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(assess => {
        const patient = patients.find(u => u.id === assess.userId);
        return {
          id: assess.id,
          patientId: patient?.patientId || 'CV-2026-UNKNOWN',
          patientName: patient?.name || 'Anonymous Patient',
          age: patient?.age || 70,
          date: assess.date.toISOString(),
          assessmentType: 'Multimodal Cognitive Battery',
          score: assess.overallScore,
          reviewState: toReviewState(assess.reviewState),
          reviewStatus: assess.reviewStatus
        };
      });

    return {
      totalPatients,
      assessmentsToday,
      completedAssessments: completed.length,
      pendingReviews,
      changeReviewCount: changeReviewQueue.length,
      changeReviewQueue: changeReviewQueue.slice(0, 10),
      recentAssessments: recent
    };
  }

  public static async listPatients(
    query = '',
    reviewFilter = 'ALL',
    options: { includeDemo?: boolean } = {}
  ): Promise<Array<{
    id: string;
    patientId: string;
    name: string;
    age: number;
    gender: string;
    language: string;
    registrationDate: string;
    lastScreeningDate: string | null;
    compositeScore: number | null;
    reviewState: ReviewState;
    reviewStatus: string;
    assessmentCount: number;
  }>> {
    const q = query.trim().toUpperCase();
    let patients = inMemoryUsers.filter(u => u.role === 'PATIENT');
    let patientAssessments = new Map<string, AssessmentRecord[]>();
    try {
      const databasePatients = await prisma.user.findMany({
        where: { role: 'PATIENT' },
        include: { assessments: { where: { status: 'COMPLETED' }, orderBy: { date: 'desc' } } }
      });
      const patientById = new Map(patients.map(patient => [patient.id, patient]));
      for (const patient of databasePatients) patientById.set(patient.id, patient as unknown as UserRecord);
      patients = Array.from(patientById.values());
      patientAssessments = new Map(databasePatients.map(patient => [
        patient.id,
        patient.assessments as unknown as AssessmentRecord[]
      ]));
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      console.warn('Prisma DB error fetching patient directory. Falling back to memory:', error);
    }

    const includeDemo = options.includeDemo ?? demoAccessEnabled();
    if (!includeDemo) patients = patients.filter(patient => !isDemoUserId(patient.id));

    const result = patients.map(patient => {
      const merged = new Map<string, AssessmentRecord>();
      for (const assessment of patientAssessments.get(patient.id) || []) merged.set(assessment.id, assessment);
      for (const assessment of inMemoryAssessments) {
        if (assessment.userId === patient.id) merged.set(assessment.id, assessment);
      }
      const assessments = Array.from(merged.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const latest = assessments[0];
      const changeSummary = summarizePatientChanges(assessments);
      return {
        id: patient.id,
        patientId: patient.patientId || 'CV-2026-UNASSIGNED',
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        language: patient.language,
        registrationDate: patient.createdAt.toISOString(),
        lastScreeningDate: latest ? latest.date.toISOString() : null,
        compositeScore: latest ? latest.overallScore : null,
        reviewState: latest ? toReviewState(latest.reviewState) : 'NOT_REVIEWED',
        reviewStatus: latest ? latest.reviewStatus : 'NOT_SCREENED',
        assessmentCount: assessments.length,
        changeStatus: changeSummary.status,
        cognitiveChange: changeSummary.cognitive.change,
        worsenedActivityCount: changeSummary.function.worsenedActivityIds.length
      };
    });

    return result.filter(item => {
      const matchesQuery = !q ||
        item.patientId.toUpperCase().includes(q) ||
        item.name.toUpperCase().includes(q);

      const matchesReview = reviewFilter === 'ALL' || item.reviewState === reviewFilter;

      return matchesQuery && matchesReview;
    });
  }

  public static async getPatientDetail(identifier: string): Promise<{
    patient: UserRecord;
    assessments: AssessmentRecord[];
  } | null> {
    const patient = (await this.findUserByPatientId(identifier)) || (await this.findUserById(identifier));
    if (!patient) return null;

    let assessments: AssessmentRecord[] = [];
    try {
      const databaseAssessments = await prisma.assessment.findMany({
        where: { userId: patient.id },
        orderBy: { date: 'desc' },
        include: { eyeMetrics: true, voiceMetrics: true, faceMetrics: true, report: true }
      });
      assessments = databaseAssessments as unknown as AssessmentRecord[];
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      console.warn('Prisma DB error fetching patient assessment history. Falling back to memory:', error);
    }
    const merged = new Map(assessments.map(assessment => [assessment.id, assessment]));
    for (const assessment of inMemoryAssessments) {
      if (assessment.userId === patient.id) merged.set(assessment.id, assessment);
    }
    assessments = Array.from(merged.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { patient, assessments };
  }

  public static async getScreeningReport(assessmentId: string): Promise<{
    assessment: AssessmentRecord;
    patient: {
      id: string;
      patientId: string;
      name: string;
      age: number;
      gender: string;
      language: string;
      educationYears?: number | null;
      handedness?: string | null;
    };
  } | null> {
    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { eyeMetrics: true, voiceMetrics: true, faceMetrics: true, report: true }
      });
      if (assessment) {
        const patient = await prisma.user.findUnique({ where: { id: assessment.userId } });
        if (!patient) return null;
        return {
          assessment: assessment as unknown as AssessmentRecord,
          patient: {
            id: patient.id,
            patientId: patient.patientId || 'CV-2026-UNKNOWN',
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            language: patient.language,
            educationYears: patient.educationYears,
            handedness: patient.handedness
          }
        };
      }
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      console.warn('Prisma DB error fetching screening report. Falling back to memory:', error);
    }

    const assessment = inMemoryAssessments.find(a => a.id === assessmentId);
    if (!assessment) return null;

    const patient = inMemoryUsers.find(u => u.id === assessment.userId);
    if (!patient) return null;

    return {
      assessment,
      patient: {
        id: patient.id,
        patientId: patient.patientId || 'CV-2026-UNKNOWN',
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        language: patient.language,
        educationYears: patient.educationYears,
        handedness: patient.handedness
      }
    };
  }

  /**
   * Persists the administrative review state derived by the deterministic rules.
   * Never called with a clinical risk tier; see services/reviewState.ts.
   */
  public static async setAssessmentReviewState(
    assessmentId: string,
    reviewState: ReviewState
  ): Promise<void> {
    const cached = inMemoryAssessments.find(a => a.id === assessmentId);
    if (cached) cached.reviewState = reviewState;
    try {
      await prisma.assessment.update({ where: { id: assessmentId }, data: { reviewState } });
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      console.warn('Prisma DB error updating assessment review state. Memory copy updated only:', error);
    }
  }

  public static async updateAssessmentReview(
    assessmentId: string,
    reviewStatus: 'PENDING_REVIEW' | 'REVIEWED' | 'FOLLOWUP_REQUIRED',
    doctorNotes: string,
    clinicianName: string
  ): Promise<AssessmentRecord | null> {
    const reviewedAt = new Date();

    try {
      const existing = await prisma.assessment.findUnique({ where: { id: assessmentId } });
      if (existing) {
        const updated = await prisma.assessment.update({
          where: { id: assessmentId },
          data: {
            reviewStatus,
            reviewedBy: clinicianName,
            reviewedAt,
            report: {
              upsert: {
                create: {
                  recommendation: 'Clinical review updated.',
                  doctorNotes: doctorNotes || ''
                },
                update: { doctorNotes: doctorNotes || '' }
              }
            }
          },
          include: { eyeMetrics: true, voiceMetrics: true, faceMetrics: true, report: true }
        });

        // Keep the demo/read cache aligned with the persisted record.
        const cached = inMemoryAssessments.find(a => a.id === assessmentId);
        if (cached) Object.assign(cached, updated);

        return updated as unknown as AssessmentRecord;
      }
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      console.warn('Prisma DB error updating assessment review. Falling back to memory:', error);
    }

    const assessment = inMemoryAssessments.find(a => a.id === assessmentId);
    if (!assessment) return null;

    assessment.reviewStatus = reviewStatus;
    assessment.reviewedBy = clinicianName;
    assessment.reviewedAt = reviewedAt;
    if (!assessment.report) {
      assessment.report = {
        id: `rep-${Date.now()}`,
        recommendation: 'Clinical review updated.',
        doctorNotes: doctorNotes || ''
      };
    } else {
      assessment.report.doctorNotes = doctorNotes;
    }

    return assessment;
  }

  /**
   * Saves a clinician-confirmed follow-up plan.
   * The plan is a first-class CarePlan row (server-side, clinician-attributed);
   * the assessment's taskResponses copy is kept for the existing patient views.
   */
  public static async saveClinicianCarePlan(
    assessmentId: string,
    carePlan: {
      action: 'REPEAT_SCREENING' | 'CLINICAL_REVIEW' | 'REVIEW_CONTEXT' | 'SUPPORT_FUNCTION';
      followUpDate: string | null;
      notes: string;
      plan?: Record<string, unknown>;
      savedAt: string;
      savedBy: string;
    }
  ): Promise<AssessmentRecord | null> {
    const assessment = inMemoryAssessments.find(item => item.id === assessmentId);
    try {
      const saved = await prisma.assessment.findUnique({ where: { id: assessmentId } });
      const patientId = saved?.userId ?? assessment?.userId;
      if (!patientId) return null;

      const previous = await prisma.carePlan.findUnique({ where: { assessmentId } });
      await prisma.carePlan.upsert({
        where: { assessmentId },
        create: {
          patientId,
          assessmentId,
          action: carePlan.action,
          followUpDate: carePlan.followUpDate,
          notes: carePlan.notes,
          plan: (carePlan.plan ?? undefined) as Prisma.InputJsonValue | undefined,
          savedBy: carePlan.savedBy,
          savedAt: new Date(carePlan.savedAt),
        },
        update: {
          action: carePlan.action,
          followUpDate: carePlan.followUpDate,
          notes: carePlan.notes,
          plan: (carePlan.plan ?? undefined) as Prisma.InputJsonValue | undefined,
          savedBy: carePlan.savedBy,
          savedAt: new Date(carePlan.savedAt),
          version: (previous?.version ?? 1) + 1,
        },
      });

      if (!saved) {
        if (!assessment) return null;
        assessment.taskResponses = {
          ...(assessment.taskResponses || {}),
          clinicianCarePlan: carePlan
        };
        return assessment;
      }

      const taskResponses = saved.taskResponses && typeof saved.taskResponses === 'object' && !Array.isArray(saved.taskResponses)
        ? saved.taskResponses as Record<string, unknown>
        : {};
      const updated = await prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          taskResponses: {
            ...taskResponses,
            clinicianCarePlan: carePlan
          } as Prisma.InputJsonValue
        },
        include: { eyeMetrics: true, voiceMetrics: true, faceMetrics: true, report: true }
      });
      if (assessment) {
        assessment.taskResponses = {
          ...(assessment.taskResponses || {}),
          clinicianCarePlan: carePlan
        };
      }
      return updated as unknown as AssessmentRecord;
    } catch (error) {
      console.error('[HospitalDataStore]: Failed to save clinician care plan:', error instanceof Error ? error.message : error);
      if (assessment && memoryFallbackAllowed()) {
        inMemoryCarePlans.unshift({
          id: `care-${Date.now()}`,
          patientId: assessment.userId,
          assessmentId,
          action: carePlan.action,
          followUpDate: carePlan.followUpDate,
          notes: carePlan.notes,
          plan: carePlan.plan,
          version: 1,
          savedBy: carePlan.savedBy,
          savedAt: new Date(carePlan.savedAt),
        });
        assessment.taskResponses = {
          ...(assessment.taskResponses || {}),
          clinicianCarePlan: carePlan
        };
        return assessment;
      }
      throw new Error('Unable to persist the clinician follow-up plan.');
    }
  }

  // --------------------------------------------------------------------------
  // METHODS — Consent records
  // --------------------------------------------------------------------------

  public static async createConsent(data: {
    userId: string;
    version: string;
    scopes: Record<string, boolean>;
    actorRole?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<ConsentRecord> {
    try {
      const created = await prisma.consent.create({
        data: {
          userId: data.userId,
          version: data.version,
          scopes: data.scopes as Prisma.InputJsonValue,
          granted: true,
          actorRole: data.actorRole || 'PATIENT',
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
        },
      });
      return created as unknown as ConsentRecord;
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      const record: ConsentRecord = {
        id: `consent-${crypto.randomUUID()}`,
        userId: data.userId,
        version: data.version,
        scopes: data.scopes,
        granted: true,
        grantedAt: new Date(),
        withdrawnAt: null,
        actorRole: data.actorRole || 'PATIENT',
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        createdAt: new Date(),
      };
      inMemoryConsents.unshift(record);
      return record;
    }
  }

  public static async listConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const rows = await prisma.consent.findMany({
        where: { userId },
        orderBy: { grantedAt: 'desc' },
      });
      return rows as unknown as ConsentRecord[];
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      return inMemoryConsents
        .filter(entry => entry.userId === userId)
        .sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime());
    }
  }

  public static async withdrawConsent(userId: string, reason: string): Promise<ConsentRecord | null> {
    try {
      const latest = await prisma.consent.findFirst({
        where: { userId, granted: true },
        orderBy: { grantedAt: 'desc' },
      });
      if (!latest) return null;
      const rows = await prisma.consent.findMany({ where: { userId, granted: true } });
      for (const row of rows) {
        await prisma.consent.update({
          where: { id: row.id },
          data: { granted: false, withdrawnAt: new Date() },
        });
      }
      return { ...(latest as unknown as ConsentRecord), granted: false, withdrawnAt: new Date() } as ConsentRecord;
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      const active = inMemoryConsents.filter(entry => entry.userId === userId && entry.granted);
      active.forEach(entry => {
        entry.granted = false;
        entry.withdrawnAt = new Date();
      });
      return active[0] || null;
    }
  }

  // --------------------------------------------------------------------------
  // METHODS — Appointments
  // --------------------------------------------------------------------------

  public static async createAppointment(data: {
    patientId: string;
    assessmentId?: string | null;
    title: string;
    type?: string;
    date: string;
    time: string;
    location?: string;
    communication?: string;
    clinician?: string;
    createdBy?: string | null;
  }): Promise<AppointmentRecord> {
    try {
      const created = await prisma.appointment.create({
        data: {
          patientId: data.patientId,
          assessmentId: data.assessmentId ?? null,
          title: data.title,
          type: data.type || 'FOLLOW_UP',
          date: data.date,
          time: data.time,
          location: data.location || '',
          communication: data.communication || '',
          clinician: data.clinician || '',
          createdBy: data.createdBy ?? null,
        },
      });
      return created as unknown as AppointmentRecord;
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      const record: AppointmentRecord = {
        id: `apt-${crypto.randomUUID()}`,
        patientId: data.patientId,
        assessmentId: data.assessmentId ?? null,
        title: data.title,
        type: data.type || 'FOLLOW_UP',
        date: data.date,
        time: data.time,
        location: data.location || '',
        status: 'UPCOMING',
        communication: data.communication || '',
        clinician: data.clinician || '',
        createdBy: data.createdBy ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryAppointments.unshift(record);
      return record;
    }
  }

  public static async listAppointments(
    options: { patientId?: string } = {}
  ): Promise<Array<AppointmentRecord & { patientPublicId?: string | null }>> {
    try {
      const rows = await prisma.appointment.findMany({
        where: options.patientId ? { patientId: options.patientId } : {},
        orderBy: [{ date: 'desc' }, { time: 'desc' }],
        include: { patient: { select: { patientId: true } } },
      });
      return rows.map(({ patient, ...row }) => ({
        ...(row as unknown as AppointmentRecord),
        patientPublicId: patient?.patientId ?? null,
      }));
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      return inMemoryAppointments
        .filter(row => !options.patientId || row.patientId === options.patientId)
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(row => ({
          ...row,
          patientPublicId: inMemoryUsers.find(user => user.id === row.patientId)?.patientId ?? null,
        }));
    }
  }

  public static async updateAppointment(
    id: string,
    updates: { status?: string; date?: string; time?: string }
  ): Promise<AppointmentRecord | null> {
    try {
      const updated = await prisma.appointment.update({
        where: { id },
        data: updates,
      });
      return updated as unknown as AppointmentRecord;
    } catch (error) {
      const existing = inMemoryAppointments.find(row => row.id === id);
      if (!existing) {
        if (!memoryFallbackAllowed()) throw error;
        return null;
      }
      Object.assign(existing, updates, { updatedAt: new Date() });
      return existing;
    }
  }

  /**
   * Persists a screening submission.
   *
   * The caller never supplies a risk tier. A session with no interpretable score
   * is stored as NOT_INTERPRETABLE; a recorded score is NOT_REVIEWED until a
   * deterministic rule fires or a clinician reviews it.
   */
  public static async submitAssessment(userId: string, data: {
    overallScore: number | null;
    reactionTime: number | null;
    blinkRate: number | null;
    fixationScore: number | null;
    speechRate: number | null;
    pauseScore: number | null;
    jitter: number | null;
    shimmer: number | null;
    symmetry: number | null;
    tremorScore: number | null;
    taskResponses?: any;
    recommendation?: string;
  }): Promise<AssessmentRecord> {
    const overallScore = isInterpretableScore(data.overallScore) ? data.overallScore : null;
    const reviewState: ReviewState = overallScore === null ? 'NOT_INTERPRETABLE' : 'NOT_REVIEWED';
    // A session with no interpretable score must not carry a caller-supplied
    // "completed" recommendation: that is how a skipped battery reads as a
    // normal result downstream.
    const storedRecommendation = overallScore === null
      ? 'Session recorded without an interpretable score. No interpretation is available; clinician review required.'
      : (data.recommendation || 'Standard cognitive screening battery completed.');
    const hasEye = data.reactionTime != null && data.blinkRate != null && data.fixationScore != null;
    const hasVoice = data.speechRate != null && data.pauseScore != null && data.jitter != null && data.shimmer != null;
    const hasFace = data.symmetry != null && data.tremorScore != null;

    const newRecord: AssessmentRecord = {
      id: `assess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      date: new Date(),
      overallScore,
      reviewState,
      status: 'COMPLETED',
      reviewStatus: 'PENDING_REVIEW',
      taskResponses: data.taskResponses || {},
      eyeMetrics: hasEye ? {
        reactionTime: data.reactionTime as number,
        blinkRate: data.blinkRate as number,
        fixationScore: data.fixationScore as number
      } : null,
      voiceMetrics: hasVoice ? {
        speechRate: data.speechRate as number,
        pauseScore: data.pauseScore as number,
        jitter: data.jitter as number,
        shimmer: data.shimmer as number
      } : null,
      faceMetrics: hasFace ? {
        symmetry: data.symmetry as number,
        tremorScore: data.tremorScore as number
      } : null,
      report: {
        id: `rep-${Date.now()}`,
        recommendation: storedRecommendation,
        doctorNotes: ''
      }
    };

    try {
      const created = await prisma.assessment.create({
        data: {
          userId,
          overallScore,
          reviewState,
          status: 'COMPLETED',
          reviewStatus: 'PENDING_REVIEW',
          taskResponses: data.taskResponses || {},
          ...(hasEye ? {
            eyeMetrics: {
              create: {
                reactionTime: data.reactionTime as number,
                blinkRate: data.blinkRate as number,
                fixationScore: data.fixationScore as number
              }
            }
          } : {}),
          ...(hasVoice ? {
            voiceMetrics: {
              create: {
                speechRate: data.speechRate as number,
                pauseScore: data.pauseScore as number,
                jitter: data.jitter as number,
                shimmer: data.shimmer as number
              }
            }
          } : {}),
          ...(hasFace ? {
            faceMetrics: {
              create: {
                symmetry: data.symmetry as number,
                tremorScore: data.tremorScore as number
              }
            }
          } : {}),
          report: {
            create: {
              recommendation: storedRecommendation,
              doctorNotes: ''
            }
          }
        },
        include: {
          eyeMetrics: true,
          voiceMetrics: true,
          faceMetrics: true,
          report: true
        }
      });
      inMemoryAssessments.unshift(created as unknown as AssessmentRecord);
      return created as unknown as AssessmentRecord;
    } catch (e) {
      console.error('[HospitalDataStore]: Database write failed on submitAssessment:', e instanceof Error ? e.message : e);
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true') {
        throw new Error('Database storage failure: Unable to persist assessment results to PostgreSQL. Operation aborted for clinical safety.');
      }
      inMemoryAssessments.unshift(newRecord);
      return newRecord;
    }
  }

  /**
   * Persists a cognitive assessment session as an Assessment record.
   *
   * `overallScore` is the deterministic descriptive task accuracy (0–100), not a
   * clinical score. A session the scoring engine could not interpret is stored
   * with a null score and NOT_INTERPRETABLE; nothing is imputed.
   */
  public static async createCognitiveAssessment(
    userId: string,
    data: { overallScore: number | null; taskResponses: Record<string, unknown>; recommendation?: string }
  ): Promise<AssessmentRecord> {
    const overallScore = isInterpretableScore(data.overallScore) ? data.overallScore : null;
    const newRecord: AssessmentRecord = {
      id: `assess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      date: new Date(),
      overallScore,
      reviewState: overallScore === null ? 'NOT_INTERPRETABLE' : 'NOT_REVIEWED',
      status: 'COMPLETED',
      reviewStatus: 'PENDING_REVIEW',
      taskResponses: data.taskResponses,
      eyeMetrics: null,
      voiceMetrics: null,
      faceMetrics: null,
      report: {
        id: `rep-${Date.now()}`,
        recommendation:
          data.recommendation ||
          'Cognitive assessment session recorded. Descriptive task results only; clinician review required.',
        doctorNotes: ''
      }
    };

    try {
      const created = await prisma.assessment.create({
        data: {
          userId,
          overallScore,
          reviewState: overallScore === null ? 'NOT_INTERPRETABLE' : 'NOT_REVIEWED',
          status: 'COMPLETED',
          reviewStatus: 'PENDING_REVIEW',
          taskResponses: data.taskResponses as Prisma.InputJsonValue,
          report: {
            create: {
              recommendation:
                data.recommendation ||
                'Cognitive assessment session recorded. Descriptive task results only; clinician review required.',
              doctorNotes: ''
            }
          }
        },
        include: { eyeMetrics: true, voiceMetrics: true, faceMetrics: true, report: true }
      });
      inMemoryAssessments.unshift(created as unknown as AssessmentRecord);
      return created as unknown as AssessmentRecord;
    } catch (e) {
      console.error('[HospitalDataStore]: Database write failed on createCognitiveAssessment:', e instanceof Error ? e.message : e);
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true') {
        throw new Error('Database storage failure: Unable to persist cognitive assessment. Operation aborted for clinical safety.');
      }
      inMemoryAssessments.unshift(newRecord);
      return newRecord;
    }
  }

  // --------------------------------------------------------------------------
  // NEW METHODS — Baseline
  // --------------------------------------------------------------------------

  public static async createBaseline(data: {
    userId: string;
    overallScore: number;
    cognitiveScore: number;
    functionalScore: number;
    eyeScore?: number | null;
    voiceScore?: number | null;
    faceScore?: number | null;
    contextScore?: number | null;
  }): Promise<BaselineRecord> {
    const newRecord: BaselineRecord = {
      id: `baseline-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: data.userId,
      establishedAt: new Date(),
      overallScore: data.overallScore,
      cognitiveScore: data.cognitiveScore,
      functionalScore: data.functionalScore,
      eyeScore: data.eyeScore ?? null,
      voiceScore: data.voiceScore ?? null,
      faceScore: data.faceScore ?? null,
      contextScore: data.contextScore ?? null,
      isActive: true,
    };

    try {
      const created = await prisma.baseline.create({
        data: {
          userId: data.userId,
          overallScore: data.overallScore,
          cognitiveScore: data.cognitiveScore,
          functionalScore: data.functionalScore,
          eyeScore: data.eyeScore ?? null,
          voiceScore: data.voiceScore ?? null,
          faceScore: data.faceScore ?? null,
          contextScore: data.contextScore ?? null,
          isActive: true,
        },
      });
      inMemoryBaselines.unshift(created as unknown as BaselineRecord);
      return created as unknown as BaselineRecord;
    } catch (e) {
      console.error('[HospitalDataStore]: DB write failed on createBaseline:', e instanceof Error ? e.message : e);
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true') {
        throw new Error('Database storage failure: Unable to persist baseline.');
      }
      inMemoryBaselines.unshift(newRecord);
      return newRecord;
    }
  }

  public static async getActiveBaseline(userId: string): Promise<BaselineRecord | null> {
    try {
      const baseline = await prisma.baseline.findFirst({
        where: { userId, isActive: true },
        orderBy: { establishedAt: 'desc' },
      });
      if (baseline) return baseline as unknown as BaselineRecord;
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
      console.warn('Prisma DB error fetching active baseline. Falling back to memory:', e);
    }
    return inMemoryBaselines
      .filter(b => b.userId === userId && b.isActive)
      .sort((a, b) => b.establishedAt.getTime() - a.establishedAt.getTime())[0] ?? null;
  }

  public static async linkAssessmentToBaseline(assessmentId: string, baselineId: string): Promise<AssessmentRecord | null> {
    try {
      const updated = await prisma.assessment.update({
        where: { id: assessmentId },
        data: { baselineId },
        include: { eyeMetrics: true, voiceMetrics: true, faceMetrics: true, report: true },
      });
      const mem = inMemoryAssessments.find(a => a.id === assessmentId);
      if (mem) mem.baselineId = baselineId;
      return updated as unknown as AssessmentRecord;
    } catch (e) {
      const mem = inMemoryAssessments.find(a => a.id === assessmentId);
      if (mem) {
        mem.baselineId = baselineId;
        return mem;
      }
      if (!memoryFallbackAllowed()) throw e;
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // NEW METHODS — Longitudinal Tracking
  // --------------------------------------------------------------------------

  public static async createLongitudinalRecord(data: {
    userId: string;
    assessmentId: string;
    overallScore: number;
    changeFromBaseline?: number | null;
    trendDirection?: string | null;
    assessmentsCount?: number;
  }): Promise<LongitudinalRecordRecord> {
    const newRecord: LongitudinalRecordRecord = {
      id: `longitudinal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: data.userId,
      assessmentId: data.assessmentId,
      recordedAt: new Date(),
      overallScore: data.overallScore,
      changeFromBaseline: data.changeFromBaseline ?? null,
      trendDirection: data.trendDirection ?? null,
      assessmentsCount: data.assessmentsCount ?? 1,
    };

    try {
      const created = await prisma.longitudinalRecord.create({
        data: {
          userId: data.userId,
          assessmentId: data.assessmentId,
          overallScore: data.overallScore,
          changeFromBaseline: data.changeFromBaseline ?? null,
          trendDirection: data.trendDirection ?? null,
          assessmentsCount: data.assessmentsCount ?? 1,
        },
      });
      inMemoryLongitudinalRecords.unshift(created as unknown as LongitudinalRecordRecord);
      return created as unknown as LongitudinalRecordRecord;
    } catch (e) {
      console.error('[HospitalDataStore]: DB write failed on createLongitudinalRecord:', e instanceof Error ? e.message : e);
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true') {
        throw new Error('Database storage failure: Unable to persist longitudinal record.');
      }
      inMemoryLongitudinalRecords.unshift(newRecord);
      return newRecord;
    }
  }

  public static async getLongitudinalRecords(userId: string): Promise<LongitudinalRecordRecord[]> {
    try {
      const records = await prisma.longitudinalRecord.findMany({
        where: { userId },
        orderBy: { recordedAt: 'asc' },
      });
      return records as unknown as LongitudinalRecordRecord[];
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
      console.warn('Prisma DB error fetching longitudinal records. Falling back to memory:', e);
      return inMemoryLongitudinalRecords
        .filter(r => r.userId === userId)
        .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
    }
  }
  // --------------------------------------------------------------------------
  // NEW METHODS — Change Detection
  // --------------------------------------------------------------------------

  public static async createChangeDetection(data: {
    userId: string;
    baselineId: string | null;
    status: string;
    cognitiveChange?: number | null;
    outsideBaseline?: boolean;
    reviewReasons?: string[] | null;
  }): Promise<ChangeDetectionRecord> {
    const newRecord: ChangeDetectionRecord = {
      id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: data.userId,
      baselineId: data.baselineId,
      detectedAt: new Date(),
      status: data.status,
      cognitiveChange: data.cognitiveChange ?? null,
      outsideBaseline: data.outsideBaseline ?? false,
      reviewReasons: data.reviewReasons ?? null,
    };

    try {
      const created = await prisma.changeDetection.create({
        data: {
          userId: data.userId,
          // Absent baseline is an absent relation, never an empty-string id.
          baselineId: data.baselineId,
          status: data.status,
          cognitiveChange: data.cognitiveChange ?? null,
          outsideBaseline: data.outsideBaseline ?? false,
          reviewReasons: data.reviewReasons ?? undefined,
        },
      });
      inMemoryChangeDetections.unshift(created as unknown as ChangeDetectionRecord);
      return created as unknown as ChangeDetectionRecord;
    } catch (e) {
      console.error('[HospitalDataStore]: DB write failed on createChangeDetection:', e instanceof Error ? e.message : e);
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true') {
        throw new Error('Database storage failure: Unable to persist change detection.');
      }
      inMemoryChangeDetections.unshift(newRecord);
      return newRecord;
    }
  }

  public static async getChangeDetections(userId: string): Promise<ChangeDetectionRecord[]> {
    try {
      const records = await prisma.changeDetection.findMany({
        where: { userId },
        orderBy: { detectedAt: 'desc' },
      });
      return records as unknown as ChangeDetectionRecord[];
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
      console.warn('Prisma DB error fetching change detections. Falling back to memory:', e);
      return inMemoryChangeDetections
        .filter(r => r.userId === userId)
        .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
    }
  }
  // --------------------------------------------------------------------------
  // NEW METHODS — Context Inputs
  // --------------------------------------------------------------------------

  public static async createContextInput(data: {
    userId: string;
    assessmentId?: string | null;
    source: string;
    values: any;
    consentGranted?: boolean;
    consentAt?: Date | null;
  }): Promise<ContextInputRecord> {
    const newRecord: ContextInputRecord = {
      id: `context-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: data.userId,
      assessmentId: data.assessmentId ?? null,
      source: data.source,
      recordedAt: new Date(),
      values: data.values,
      consentGranted: data.consentGranted ?? false,
      consentAt: data.consentAt ?? null,
    };

    try {
      const created = await prisma.contextInput.create({
        data: {
          userId: data.userId,
          assessmentId: data.assessmentId ?? null,
          source: data.source,
          values: data.values,
          consentGranted: data.consentGranted ?? false,
          consentAt: data.consentAt ?? null,
        },
      });
      inMemoryContextInputs.unshift(created as unknown as ContextInputRecord);
      return created as unknown as ContextInputRecord;
    } catch (e) {
      console.error('[HospitalDataStore]: DB write failed on createContextInput:', e instanceof Error ? e.message : e);
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true') {
        throw new Error('Database storage failure: Unable to persist context input.');
      }
      inMemoryContextInputs.unshift(newRecord);
      return newRecord;
    }
  }

  public static async getContextInputs(userId: string, source?: string): Promise<ContextInputRecord[]> {
    try {
      const records = await prisma.contextInput.findMany({
        where: { userId, ...(source ? { source } : {}) },
        orderBy: { recordedAt: 'desc' },
      });
      return records as unknown as ContextInputRecord[];
    } catch (e) {
      return inMemoryContextInputs
        .filter(r => r.userId === userId && (!source || r.source === source))
        .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    }
  }

  // --------------------------------------------------------------------------
  // NEW METHODS — Brain Health Profile
  // --------------------------------------------------------------------------

  /**
   * Stores the clinician-facing profile draft.
   * `reviewSignal` is an administrative review flag; this record never carries a
   * clinical risk tier, because no validated classification exists.
   */
  public static async createBrainHealthProfile(data: {
    userId: string;
    changeDetectionId: string;
    profileScore: number | null;
    reviewSignal?: ReviewState;
    interpretation: string;
    nextSteps: any[];
  }): Promise<BrainHealthProfileRecord> {
    const profileScore = isInterpretableScore(data.profileScore) ? data.profileScore : null;
    const reviewSignal: ReviewState = data.reviewSignal
      ?? (profileScore === null ? 'NOT_INTERPRETABLE' : 'NOT_REVIEWED');
    const newRecord: BrainHealthProfileRecord = {
      id: `bhprofile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: data.userId,
      changeDetectionId: data.changeDetectionId,
      profileScore,
      reviewSignal,
      interpretation: data.interpretation,
      nextSteps: data.nextSteps,
      generatedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
    };

    try {
      const created = await prisma.brainHealthProfile.create({
        data: {
          userId: data.userId,
          changeDetectionId: data.changeDetectionId,
          profileScore,
          reviewSignal,
          interpretation: data.interpretation,
          nextSteps: data.nextSteps,
        },
      });
      inMemoryBrainHealthProfiles.unshift(created as unknown as BrainHealthProfileRecord);
      return created as unknown as BrainHealthProfileRecord;
    } catch (e) {
      console.error('[HospitalDataStore]: DB write failed on createBrainHealthProfile:', e instanceof Error ? e.message : e);
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true') {
        throw new Error('Database storage failure: Unable to persist brain health profile.');
      }
      inMemoryBrainHealthProfiles.unshift(newRecord);
      return newRecord;
    }
  }

  public static async getBrainHealthProfile(userId: string): Promise<BrainHealthProfileRecord | null> {
    try {
      const profile = await prisma.brainHealthProfile.findFirst({
        where: { userId },
        orderBy: { generatedAt: 'desc' },
      });
      if (profile) return profile as unknown as BrainHealthProfileRecord;
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
      console.warn('Prisma DB error fetching brain health profile. Falling back to memory:', e);
    }
    return inMemoryBrainHealthProfiles
      .filter(p => p.userId === userId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())[0] ?? null;
  }

  // --------------------------------------------------------------------------
  // NEW METHODS — Ensure Baseline & Link
  // --------------------------------------------------------------------------

  public static async ensureBaselineAndLink(userId: string, assessment: AssessmentRecord): Promise<{ baseline: BaselineRecord | null; created: boolean }> {
    const existing = await this.getActiveBaseline(userId);
    if (existing) {
      await this.linkAssessmentToBaseline(assessment.id, existing.id);
      return { baseline: existing, created: false };
    }

    // A baseline can only be formed from a session that produced an interpretable
    // score and a recorded functional check-in. Absent data never becomes a
    // placeholder score (the old behaviour imputed 50 for functional function).
    const recordedActivities = assessment.taskResponses?.functionalCheckIn?.activities as
      | Record<string, number>
      | undefined;
    if (!isInterpretableScore(assessment.overallScore) || !recordedActivities) {
      return { baseline: null, created: false };
    }

    const cognitiveScore = assessment.overallScore;
    const functionalScore = Object.values(recordedActivities).reduce(
      (total, value) => total + Number(value || 0),
      0
    ) / Object.keys(recordedActivities).length;
    const eyeScore = assessment.eyeMetrics ? (100 - Math.min(100, (assessment.eyeMetrics.reactionTime / 5))) : null;
    const voiceScore = assessment.voiceMetrics ? (100 - Math.min(100, assessment.voiceMetrics.jitter * 200)) : null;
    const faceScore = assessment.faceMetrics ? assessment.faceMetrics.symmetry : null;

    const baseline = await this.createBaseline({
      userId,
      overallScore: assessment.overallScore,
      cognitiveScore,
      functionalScore,
      eyeScore,
      voiceScore,
      faceScore,
    });
    await this.linkAssessmentToBaseline(assessment.id, baseline.id);
    return { baseline, created: true };
  }

  // --------------------------------------------------------------------------
  // METHODS — Referrals and closed-loop outcomes
  // --------------------------------------------------------------------------

  public static async createReferral(data: {
    patientId: string;
    assessmentId?: string | null;
    type: ReferralType;
    reason: string;
    destination?: string;
    urgency?: 'ROUTINE' | 'PRIORITY' | 'URGENT';
    status?: ReferralWorkflowStatus;
    outcomeStatus?: ReferralOutcomeStatus;
    followUpDate?: string | null;
    createdBy?: string | null;
  }): Promise<ReferralOutcomeRecord> {
    const now = new Date();
    const record: ReferralOutcomeRecord = {
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      patientId: data.patientId,
      assessmentId: data.assessmentId ?? null,
      type: data.type,
      reason: data.reason,
      destination: data.destination || '',
      urgency: data.urgency || 'ROUTINE',
      status: data.status || 'DRAFT',
      outcomeStatus: data.outcomeStatus || 'PENDING',
      outcomeNotes: null,
      outcomeAt: null,
      followUpDate: data.followUpDate ?? null,
      closedLoop: false,
      createdBy: data.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const created = await prisma.referralOutcome.create({
        data: {
          patientId: record.patientId,
          assessmentId: record.assessmentId,
          type: record.type,
          reason: record.reason,
          destination: record.destination,
          urgency: record.urgency,
          status: record.status,
          outcomeStatus: record.outcomeStatus,
          followUpDate: record.followUpDate,
          createdBy: record.createdBy,
        },
      });
      const mapped = { ...record, ...created } as unknown as ReferralOutcomeRecord;
      return mapped;
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
    }
    inMemoryReferrals.unshift(record);
    return record;
  }

  public static async listAllReferrals(): Promise<
    Array<ReferralOutcomeRecord & { patientPublicId?: string | null }>
  > {
    try {
      const rows = await prisma.referralOutcome.findMany({
        orderBy: { createdAt: 'desc' },
        include: { patient: { select: { patientId: true } } },
      });
      return rows.map(({ patient, ...row }) => ({
        ...(row as unknown as ReferralOutcomeRecord),
        patientPublicId: patient?.patientId ?? null,
      }));
    } catch (error) {
      if (!memoryFallbackAllowed()) throw error;
      return inMemoryReferrals
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(row => ({
          ...row,
          patientPublicId: inMemoryUsers.find(user => user.id === row.patientId)?.patientId ?? null,
        }));
    }
  }

  // --------------------------------------------------------------------------
  // METHODS — External validated instruments (clinician-entered scores)
  // --------------------------------------------------------------------------

  public static async createExternalInstrument(data: {
    patientId: string;
    instrumentKey: string;
    instrumentVersion?: string | null;
    language: string;
    administeredOn: Date;
    administeredBy: string;
    score: number;
    maxScore: number;
    licenceConfirmed: boolean;
    licenceReference?: string | null;
    notes?: string | null;
    recordedBy?: string | null;
  }): Promise<ExternalInstrumentRecord> {
    const record: ExternalInstrumentRecord = {
      id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      patientId: data.patientId,
      instrumentKey: data.instrumentKey,
      instrumentVersion: data.instrumentVersion ?? null,
      language: data.language,
      administeredOn: data.administeredOn,
      administeredBy: data.administeredBy,
      score: data.score,
      maxScore: data.maxScore,
      licenceConfirmed: data.licenceConfirmed,
      licenceReference: data.licenceReference ?? null,
      notes: data.notes ?? null,
      recordedBy: data.recordedBy ?? null,
      createdAt: new Date(),
    };
    try {
      const created = await prisma.externalInstrumentRecord.create({
        data: {
          patientId: record.patientId,
          instrumentKey: record.instrumentKey,
          instrumentVersion: record.instrumentVersion,
          language: record.language,
          administeredOn: record.administeredOn,
          administeredBy: record.administeredBy,
          score: record.score,
          maxScore: record.maxScore,
          licenceConfirmed: record.licenceConfirmed,
          licenceReference: record.licenceReference,
          notes: record.notes,
          recordedBy: record.recordedBy,
        },
      });
      return { ...record, ...(created as unknown as ExternalInstrumentRecord) };
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
    }
    inMemoryExternalInstruments.push(record);
    return record;
  }

  public static async listExternalInstruments(patientId: string): Promise<ExternalInstrumentRecord[]> {
    try {
      const rows = await prisma.externalInstrumentRecord.findMany({
        where: { patientId },
        orderBy: { administeredOn: 'asc' },
      });
      return rows as unknown as ExternalInstrumentRecord[];
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
    }
    return inMemoryExternalInstruments
      .filter(row => row.patientId === patientId)
      .sort((a, b) => a.administeredOn.getTime() - b.administeredOn.getTime());
  }

  public static async listReferrals(patientId: string): Promise<ReferralOutcomeRecord[]> {
    try {
      const rows = await prisma.referralOutcome.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      });
      return rows as unknown as ReferralOutcomeRecord[];
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
    }
    return inMemoryReferrals
      .filter(r => r.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public static async updateReferralOutcome(
    referralId: string,
    updates: Partial<Pick<ReferralOutcomeRecord, 'status' | 'outcomeStatus' | 'outcomeNotes' | 'outcomeAt' | 'followUpDate' | 'destination' | 'urgency' | 'reason'>>
  ): Promise<ReferralOutcomeRecord | null> {
    const closedLoop = updates.outcomeStatus === 'COMPLETED' || updates.outcomeStatus === 'CANCELLED' || updates.outcomeStatus === 'DECLINED';
    const apply = (r: ReferralOutcomeRecord): ReferralOutcomeRecord => ({
      ...r,
      ...updates,
      closedLoop: typeof updates.outcomeStatus === 'string' ? closedLoop : r.closedLoop,
      outcomeAt: updates.outcomeAt ? new Date(updates.outcomeAt) : (updates.outcomeStatus ? new Date() : r.outcomeAt),
      updatedAt: new Date(),
    });

    try {
      const updated = await prisma.referralOutcome.update({
        where: { id: referralId },
        data: {
          ...updates,
          closedLoop: typeof updates.outcomeStatus === 'string' ? closedLoop : undefined,
          outcomeAt: updates.outcomeStatus ? new Date() : undefined,
        },
      });
      return updated as unknown as ReferralOutcomeRecord;
    } catch (e) {
      if (!memoryFallbackAllowed()) throw e;
    }
    const idx = inMemoryReferrals.findIndex(r => r.id === referralId);
    if (idx < 0) return null;
    inMemoryReferrals[idx] = apply(inMemoryReferrals[idx]);
    return inMemoryReferrals[idx];
  }
}
