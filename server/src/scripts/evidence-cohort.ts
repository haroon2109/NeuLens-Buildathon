/**
 * Simulated cohort for the challenge evidence sheet.
 *
 * The Future Health brief asks entrants to "show performance on realistic or
 * simulated cases and report measures such as completed assessments, time to
 * appropriate evaluation, referral completion, user trust and fairness across
 * relevant population groups". This script produces those measures from a
 * fixed-seed simulated cohort so the numbers in
 * `docs/future-health-challenge/DEMONSTRABLE_VALUE.md` are reproducible rather
 * than asserted.
 *
 * What this is: a model of the platform's own definitions, run over invented
 * sessions. What this is not: clinical evidence, a validation result, or a
 * measurement of real patients. Array shapes and field semantics mirror
 * `services/platformInsights.ts`, and the reliability figure is computed by the
 * production `icc21` implementation.
 *
 * Run: npx ts-node --project server/tsconfig.json server/src/scripts/evidence-cohort.ts
 */

import { icc21, MIN_REPEAT_PAIRS_FOR_ICC, type RepeatPair } from '../services/reliability';

/* ------------------------------------------------------------------ */
/* Deterministic PRNG — the cohort must not change between runs.       */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261118);
const randInt = (min: number, max: number): number => min + Math.floor(rand() * (max - min + 1));
const chance = (p: number): boolean => rand() < p;

/** Box–Muller, so session variation is normally distributed rather than uniform. */
function gaussian(): number {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ------------------------------------------------------------------ */
/* Cohort model                                                        */
/* ------------------------------------------------------------------ */

type Quality = { comparable: boolean; completion: string; interruptions: number; score: number };

interface SimSession {
  patientId: string;
  date: Date;
  overallScore: number | null;
  status: 'COMPLETED';
  reviewStatus: 'PENDING_REVIEW' | 'REVIEWED' | 'FOLLOWUP_REQUIRED';
  reviewedAt: Date | null;
  quality: Quality;
}

interface SimPatient {
  patientId: string;
  age: number;
  educationYears: number;
  gender: 'female' | 'male';
}

const ageBand = (age: number): string =>
  age < 60 ? '<60' : age < 70 ? '60-69' : age < 80 ? '70-79' : '80+';

const educationBand = (years: number): string =>
  years <= 8 ? '0-8 years' : years <= 12 ? '9-12 years' : '13+ years';

const DAY = 24 * 60 * 60 * 1000;

const patients: SimPatient[] = [];
const sessions: SimSession[] = [];
const referrals: Array<{ outcomeStatus: 'COMPLETED' | 'DECLINED' | 'NO_SHOW' | 'CANCELLED' }> = [];

// English-only cohort: Arabic task administration is gated by the readiness
// registry, so no Arabic outcome is simulated here.
const PATIENT_COUNT = 120;
const now = Date.now();

for (let i = 0; i < PATIENT_COUNT; i += 1) {
  const patientId = `SIM-${String(i + 1).padStart(3, '0')}`;
  const age = randInt(56, 88);
  const educationYears = randInt(4, 18);
  const gender: 'female' | 'male' = chance(0.56) ? 'female' : 'male';
  patients.push({ patientId, age, educationYears, gender });

  // Personal baseline shifts with age and education, as the real tasks would.
  const baseline = 72 + (educationYears - 11) * 0.9 - Math.max(0, age - 70) * 0.35 + gaussian() * 5.5;
  const sessionCount = randInt(1, 4);
  const declinePerYear = chance(0.22) ? 2.4 + rand() * 2.2 : (rand() - 0.5) * 1.2;

  for (let s = 0; s < sessionCount; s += 1) {
    const daysAgo = Math.round((sessionCount - s) * 34 + rand() * 18);
    const date = new Date(now - daysAgo * DAY);
    const yearsElapsed = daysAgo / 365;
    // Within-person session noise is deliberately not small: a test-retest
    // coefficient computed from near-identical repeats would flatter the battery.
    const truthful = baseline - declinePerYear * yearsElapsed + gaussian() * 4.2;

    // A session counts as complete only when the administration completed in
    // full; comparability additionally requires matched conditions.
    const full = chance(0.88);
    const comparable = full && chance(0.87);
    const completion = full ? 'FULL' : chance(0.5) ? 'PARTIAL' : 'ABANDONED';

    sessions.push({
      patientId,
      date,
      overallScore: Math.max(0, Math.min(100, Math.round(truthful))),
      status: 'COMPLETED',
      reviewStatus: 'REVIEWED',
      reviewedAt: null,
      quality: {
        comparable,
        completion,
        interruptions: full ? 0 : randInt(1, 3),
        score: comparable ? Math.round(72 + rand() * 24) : Math.round(28 + rand() * 34),
      },
    });
  }
}

// Clinical review state and review latency, decided after all sessions exist so
// the most recent session per patient carries the open work.
const byPatient = new Map<string, SimSession[]>();
for (const session of sessions) {
  byPatient.set(session.patientId, [...(byPatient.get(session.patientId) || []), session]);
}

for (const list of byPatient.values()) {
  list.sort((a, b) => a.date.getTime() - b.date.getTime());
  list.forEach((session, index) => {
    const isLatest = index === list.length - 1;
    if (isLatest && chance(0.14)) {
      session.reviewStatus = 'PENDING_REVIEW';
      session.reviewedAt = null;
      return;
    }
    if (chance(0.14)) {
      session.reviewStatus = 'FOLLOWUP_REQUIRED';
    }
    // Review latency: hours from session to recorded clinical review.
    const hours = 4 + Math.pow(rand(), 1.9) * 68;
    session.reviewedAt = new Date(session.date.getTime() + hours * 3_600_000);
    if (session.reviewStatus === 'FOLLOWUP_REQUIRED' && chance(0.85)) {
      const roll = rand();
      referrals.push({
        outcomeStatus:
          roll < 0.58 ? 'COMPLETED' : roll < 0.72 ? 'DECLINED' : roll < 0.9 ? 'NO_SHOW' : 'CANCELLED',
      });
    }
  });
}

/* ------------------------------------------------------------------ */
/* Measures — same definitions as services/platformInsights.ts         */
/* ------------------------------------------------------------------ */

const median = (values: number[]): number | null => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const mean = (values: number[]): number | null =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const pct = (value: number | null): string => (value == null ? 'n/a' : `${(value * 100).toFixed(1)}%`);

const completed = sessions.filter((s) => s.status === 'COMPLETED');
const fullyCompleted = completed.filter((s) => s.quality.completion === 'FULL');
const comparable = completed.filter((s) => s.quality.comparable);
const reviewHours = completed
  .filter((s) => s.reviewedAt)
  .map((s) => ((s.reviewedAt as Date).getTime() - s.date.getTime()) / 3_600_000)
  .filter((value) => Number.isFinite(value) && value >= 0);

const repeatPairs: RepeatPair[] = [];
for (const list of byPatient.values()) {
  const ordered = list
    .filter((s) => s.quality.comparable && s.overallScore != null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  for (let i = 1; i < ordered.length; i += 1) {
    repeatPairs.push({ first: ordered[i - 1].overallScore as number, second: ordered[i].overallScore as number });
  }
}
const deltas = repeatPairs.map((pair) => Math.abs(pair.second - pair.first));
const reliability = icc21(repeatPairs);

const group = (keyFn: (s: SimSession) => string) => {
  const bands = new Map<string, SimSession[]>();
  for (const session of completed) {
    const key = keyFn(session);
    bands.set(key, [...(bands.get(key) || []), session]);
  }
  return Array.from(bands.entries())
    .map(([band, arr]) => ({
      band,
      assessments: arr.length,
      comparabilityRate: arr.filter((s) => s.quality.comparable).length / arr.length,
    }))
    .sort((a, b) => a.band.localeCompare(b.band));
};

const patientById = new Map(patients.map((p) => [p.patientId, p]));
const completedReferral = referrals.filter((r) => r.outcomeStatus === 'COMPLETED').length;
const nonCompletedReferral = referrals.filter((r) =>
  ['CANCELLED', 'DECLINED', 'NO_SHOW'].includes(r.outcomeStatus)
).length;

const summary = {
  cohort: {
    patients: patients.length,
    simulatedSessions: completed.length,
    language: 'en',
    seed: 20261118,
  },
  operational: {
    completedAssessments: completed.length,
    completionRate: pct(fullyCompleted.length / completed.length),
    comparabilityRate: pct(comparable.length / completed.length),
    reviewedSessions: reviewHours.length,
    medianHoursToClinicalReview: median(reviewHours)?.toFixed(1) ?? 'n/a',
    p90HoursToClinicalReview: (() => {
      const sorted = [...reviewHours].sort((a, b) => a - b);
      return sorted.length ? sorted[Math.floor(sorted.length * 0.9)].toFixed(1) : 'n/a';
    })(),
    pendingClinicalReview: completed.filter((s) => s.reviewStatus === 'PENDING_REVIEW').length,
    followUpRequired: completed.filter((s) => s.reviewStatus === 'FOLLOWUP_REQUIRED').length,
    referralsRecorded: referrals.length,
    referralCompletionRate: pct(referrals.length ? completedReferral / referrals.length : null),
    referralNonCompletionRate: pct(referrals.length ? nonCompletedReferral / referrals.length : null),
  },
  measurementProperties: {
    repeatPairs: repeatPairs.length,
    meanAbsoluteScoreChange: mean(deltas)?.toFixed(2) ?? 'n/a',
    icc21: reliability ? reliability.value : null,
    icc21Pairs: reliability ? reliability.pairs : 0,
    icc21RequiresPairs: MIN_REPEAT_PAIRS_FOR_ICC,
  },
  fairness: {
    byAgeBand: group((s) => ageBand(patientById.get(s.patientId)!.age)),
    byEducationBand: group((s) => educationBand(patientById.get(s.patientId)!.educationYears)),
  },
};

console.log(JSON.stringify(summary, null, 2));
