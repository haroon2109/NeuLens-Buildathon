import { z } from 'zod';

// Upper bounds on free-text fields keep oversized payloads out of logs,
// database columns and downstream model prompts.
export const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(128),
  name: z.string().min(1, 'Name is required').max(120),
  age: z.number().int().min(0, 'Age must be positive').max(120),
  gender: z.string().min(1, 'Gender is required').max(40),
  language: z.string().min(1, 'Language is required').max(16),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(1, 'Password is required').max(128),
});

export const profileSetupSchema = z.object({
  age: z.number().int().min(0).max(120),
  gender: z.string().max(40),
  language: z.string().max(16),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
});

// A submission may carry no interpretable score (a skipped or partial battery).
// The client is never authoritative for a score or a risk tier: the score is
// computed on the server from `taskResponses`, absent numbers stay null, and a
// session without a complete battery is recorded as NOT_INTERPRETABLE.
// `.strict()` makes a smuggled `overallScore` or `riskLevel` a 400 rather than a
// quietly accepted field.
export const screeningSubmitSchema = z.object({
  taskResponses: z.record(z.string(), z.any()).optional(),
  reactionTime: z.number().nullable().optional(),
  blinkRate: z.number().nullable().optional(),
  fixationScore: z.number().nullable().optional(),
  speechRate: z.number().nullable().optional(),
  pauseScore: z.number().nullable().optional(),
  jitter: z.number().nullable().optional(),
  shimmer: z.number().nullable().optional(),
  symmetry: z.number().nullable().optional(),
  tremorScore: z.number().nullable().optional(),
  recommendation: z.string(),
  doctorNotes: z.string().optional(),
}).strict();

export const patientRegisterSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').max(120),
  age: z.number().int().min(1).max(120, 'Please enter a valid age'),
  dob: z.string().max(40).optional(),
  gender: z.string().max(40).default('PREFER_NOT_TO_SAY'),
  language: z.string().max(16).default('en'),
  educationYears: z.number().int().min(0).max(30).optional().default(12),
  handedness: z.string().optional().default('RIGHT'),
  pin: z.string().regex(/^\d{4,8}$/, 'PIN must be 4 to 8 digits'),
});

export const patientLoginSchema = z.object({
  patientId: z.string().trim().min(4, 'Patient ID is required'),
  // Only the PIN authenticates a patient. DOB, age and birth year are public
  // identifiers and are deliberately not accepted here.
  verification: z.string().trim().regex(/^\d{4,8}$/, 'Enter the PIN on your Patient ID card'),
});

const functionalCheckInSchema = z.union([
  z.object({
    skipped: z.literal(true),
    completedAt: z.string().datetime()
  }).strict(),
  z.object({
    completedAt: z.string().datetime(),
    activities: z.object({
      appointments: z.number().int().min(0).max(2),
      medication: z.number().int().min(0).max(2),
      finances: z.number().int().min(0).max(2),
      household: z.number().int().min(0).max(2)
    }).strict()
  }).strict(),
  z.object({
    completedAt: z.string().datetime(),
    contextFactors: z.object({
      sleep: z.number().int().min(0).max(2),
      activity: z.number().int().min(0).max(2),
      moodStress: z.number().int().min(0).max(2)
    }).strict(),
    assessmentContext: z.object({
      language: z.enum(['en', 'ar', 'ta', 'hi', 'te', 'ml', 'kn']),
      ageYears: z.number().int().min(0).max(120).nullable(),
      educationYears: z.number().int().min(0).max(30).nullable(),
      taskVersion: z.string().min(1).max(50),
      accessibility: z.object({
        vision: z.number().int().min(0).max(2),
        hearing: z.number().int().min(0).max(2),
        motor: z.number().int().min(0).max(2),
        digitalFamiliarity: z.number().int().min(0).max(2)
      }).strict()
    }).strict(),
    activities: z.object({
      appointments: z.number().int().min(0).max(2),
      medication: z.number().int().min(0).max(2),
      finances: z.number().int().min(0).max(2),
      household: z.number().int().min(0).max(2)
    }).strict()
  }).strict()
]);

const externalContextConsentSchema = z.object({
  granted: z.boolean(),
  recordedAt: z.string().datetime()
}).strict();

/**
 * A union reports "Invalid input" at its own root and hides which branch failed.
 * Walk into the branch that matched most closely, so the caller is told the field
 * that is actually wrong (e.g. `activities.medication`) instead of the wrapper.
 */
const mostRelevantIssue = (issues: z.ZodIssue[]): z.ZodIssue => {
  const first = issues[0];
  if (!first) return { code: 'custom', path: [], message: 'Invalid input' } as z.ZodIssue;
  if (first.code !== 'invalid_union') return first;

  // Zod reports union branch failures as `unionErrors` (v3: ZodError[]) or
  // `errors` (v4: ZodIssue[][]) on a single opaque "Invalid input" issue.
  const unionIssue = first as unknown as {
    unionErrors?: Array<{ issues: z.ZodIssue[] }>;
    errors?: z.ZodIssue[][];
  };
  const branches: z.ZodIssue[][] = unionIssue.unionErrors
    ? unionIssue.unionErrors.map((entry) => entry.issues)
    : (unionIssue.errors ?? []);
  if (branches.length === 0) return first;

  // The closest branch has the fewest complaints; among equals, the fewest keys
  // rejected as unexpected (a lone stray key points at the real mistake better
  // than a branch that would also reject fields the caller legitimately sent).
  const score = (branch: z.ZodIssue[]): number =>
    branch.length * 10 +
    branch.reduce((sum, issue) => {
      const keys = (issue as unknown as { keys?: string[] }).keys;
      return issue.code === 'unrecognized_keys' ? sum + (keys?.length ?? 1) : sum;
    }, 0);
  const closest = [...branches].sort((a, b) => score(a) - score(b))[0];
  return mostRelevantIssue(closest);
};

/** Path plus the offending key for `unrecognized_keys`, which reports no path. */
const issuePath = (issue: z.ZodIssue): string[] => {
  const path = issue.path.map(String);
  const keys = (issue as unknown as { keys?: string[] }).keys;
  return issue.code === 'unrecognized_keys' && keys?.[0] ? [...path, keys[0]] : path;
};

const taskResponsesSchema = z.record(z.string(), z.any()).superRefine((responses, context) => {
  const checkIn = responses.functionalCheckIn === undefined
    ? null
    : functionalCheckInSchema.safeParse(responses.functionalCheckIn);
  if (checkIn && !checkIn.success) {
    // Surface the actual nested problem (which key is missing or unexpected)
    // instead of a blanket "invalid": the caller needs to know what to fix.
    const issue = mostRelevantIssue(checkIn.error.issues);
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['functionalCheckIn', ...issuePath(issue)],
      message: issue.message
    });
  }
  if (responses.externalContextConsent !== undefined) {
    const consent = externalContextConsentSchema.safeParse(responses.externalContextConsent);
    if (!consent.success) {
      const issue = mostRelevantIssue(consent.error.issues);
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['externalContextConsent', ...issuePath(issue)],
        message: issue.message
      });
    }
  }
});

// No metric here has a `.default()`. A missing measurement is absent, not a
// comfortable placeholder: the old defaults (fixation 85, symmetry 94, …) made a
// skipped battery look like a normal one.
//
// There is deliberately no `overallScore` field. The score is derived on the
// server from `taskResponses` (see services/sessionScoring.ts), so a client
// cannot label a session — `.strict()` rejects the attempt with a 400.
export const patientSubmitAssessmentSchema = z.object({
  patientId: z.string().optional(),
  // Language the battery was administered in. The server resolves its readiness
  // itself; the client only reports what was chosen and whether the participant
  // was told what is unverified in that language.
  language: z.string().max(16).optional(),
  languageAcknowledged: z.boolean().optional(),
  reactionTime: z.number().nullable().optional(),
  blinkRate: z.number().nullable().optional(),
  fixationScore: z.number().nullable().optional(),
  speechRate: z.number().nullable().optional(),
  pauseScore: z.number().nullable().optional(),
  jitter: z.number().nullable().optional(),
  shimmer: z.number().nullable().optional(),
  symmetry: z.number().nullable().optional(),
  tremorScore: z.number().nullable().optional(),
  taskResponses: taskResponsesSchema.optional(),
  recommendation: z.string().optional(),
}).strict();

export const consentRecordSchema = z.object({
  version: z.string().min(1).max(64),
  scopes: z.record(z.string(), z.boolean()),
});

export const consentWithdrawSchema = z.object({
  reason: z.string().max(500).optional().default(''),
});

export const appointmentCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.enum(['FOLLOW_UP', 'REPEAT_ASSESSMENT', 'RESULTS_REVIEW', 'TELEHEALTH']).default('FOLLOW_UP'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Appointment date must be YYYY-MM-DD'),
  time: z.string().trim().min(1).max(20),
  location: z.string().max(200).optional().default(''),
  communication: z.string().max(200).optional().default(''),
  assessmentId: z.string().optional().nullable(),
});

export const appointmentUpdateSchema = z.object({
  status: z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().trim().min(1).max(20).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one appointment field to update',
});

export const doctorReviewSchema = z.object({
  reviewStatus: z.enum(['PENDING_REVIEW', 'REVIEWED', 'FOLLOWUP_REQUIRED']),
  doctorNotes: z.string().max(3000).optional(),
});

export const doctorCarePlanSchema = z.object({
  action: z.enum(['REPEAT_SCREENING', 'CLINICAL_REVIEW', 'REVIEW_CONTEXT', 'SUPPORT_FUNCTION']),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  notes: z.string().max(2000).default(''),
  // Full clinician-approved plan, stored as entered for audit and display.
  plan: z.record(z.string(), z.any()).optional()
});

/**
 * A clinician-entered score from a validated instrument administered outside
 * the product. `.strict()` because this record is quoted in clinical output:
 * an unexpected field must fail loudly rather than be ignored, and there is no
 * field here for a platform-computed score.
 */
export const externalInstrumentSchema = z.object({
  instrumentKey: z.string().trim().min(1).max(40),
  instrumentVersion: z.string().trim().max(64).optional(),
  language: z.string().trim().min(2).max(12),
  administeredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  administeredBy: z.string().trim().min(2).max(120),
  score: z.number().finite(),
  // Required as an explicit true for licensed instruments; the service refuses
  // the record if the licence is not confirmed rather than defaulting it.
  licenceConfirmed: z.boolean(),
  licenceReference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
}).strict();

export type PatientRegisterInput = z.infer<typeof patientRegisterSchema>;
export type ExternalInstrumentInput = z.infer<typeof externalInstrumentSchema>;
export type PatientLoginInput = z.infer<typeof patientLoginSchema>;
export type PatientSubmitAssessmentInput = z.infer<typeof patientSubmitAssessmentSchema>;
export type DoctorReviewInput = z.infer<typeof doctorReviewSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ScreeningSubmitInput = z.infer<typeof screeningSubmitSchema>;
