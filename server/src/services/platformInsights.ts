import type { AssessmentRecord, UserRecord } from '../models/dataStore';
import { HospitalDataStore } from '../models/dataStore';
import { icc21, MIN_REPEAT_PAIRS_FOR_ICC, type RepeatPair } from './reliability';
import { isDemoAssessment, isDemoUserId } from './demoRecords';

type GroupMetric = {
  group: string;
  assessments: number;
  comparableRate: number | null;
  averageQualityScore: number | null;
  averageOverallScore: number | null;
  reviewRate: number | null;
};

function safeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getQuality(assessment: AssessmentRecord) {
  const tr = (assessment.taskResponses || {}) as any;
  const q = tr.quality || {};
  return {
    comparable: q.comparable === true,
    completion: typeof q.completion === 'string' ? q.completion : 'UNKNOWN',
    interruptions: Number.isFinite(Number(q.interruptions)) ? Number(q.interruptions) : null,
    score: safeNumber(q.score),
  };
}

function ageBand(age: number | null | undefined): string {
  if (!Number.isFinite(Number(age))) return 'unknown';
  const a = Number(age);
  if (a < 60) return '<60';
  if (a < 70) return '60-69';
  if (a < 80) return '70-79';
  return '80+';
}

/**
 * Education is a strong confounder for paper-and-pencil cognitive tasks, so
 * performance is monitored in bands rather than treated as one population.
 */
function educationBand(years: number | null | undefined): string {
  if (!Number.isFinite(Number(years))) return 'unknown';
  const y = Number(years);
  if (y <= 8) return '0-8 years';
  if (y <= 12) return '9-12 years';
  return '13+ years';
}

const mean = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const standardDeviation = (values: number[]) => {
  if (values.length < 2) return null;
  const avg = mean(values) as number;
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

function groupMetrics<T extends string>(items: AssessmentRecord[], keyFn: (a: AssessmentRecord) => T): GroupMetric[] {
  const by = new Map<string, AssessmentRecord[]>();
  for (const a of items) {
    const k = keyFn(a) || 'unknown';
    by.set(k, [...(by.get(k) || []), a]);
  }
  return Array.from(by.entries()).map(([group, arr]) => {
    const qualities = arr.map(getQuality);
    const comparable = qualities.filter(q => q.comparable).length;
    const qScores = qualities.map(q => q.score).filter((v): v is number => v != null);
    const scores = arr.map(a => safeNumber(a.overallScore)).filter((v): v is number => v != null);
    const reviews = arr.filter(a => a.reviewStatus === 'PENDING_REVIEW' || a.reviewStatus === 'FOLLOWUP_REQUIRED').length;
    return {
      group,
      assessments: arr.length,
      comparableRate: arr.length ? Number((comparable / arr.length).toFixed(3)) : null,
      averageQualityScore: qScores.length ? Number((qScores.reduce((s, v) => s + v, 0) / qScores.length).toFixed(2)) : null,
      averageOverallScore: scores.length ? Number((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2)) : null,
      reviewRate: arr.length ? Number((reviews / arr.length).toFixed(3)) : null,
    };
  }).sort((a, b) => b.assessments - a.assessments);
}

export async function computePlatformInsights() {
  // Platform insights are claims about real recorded data. A seeded fictional
  // patient would move every rate on this page, so demo records are excluded here
  // regardless of who is looking.
  const patients = (await HospitalDataStore.listPatients('', 'ALL')).filter(p => !isDemoUserId(p.id));
  const details = (await Promise.all(patients.map(p => HospitalDataStore.getPatientDetail(p.id))))
    .map(d => d && {
      ...d,
      assessments: (d.assessments || []).filter(a => !isDemoAssessment(a))
    });
  const allReferrals = await HospitalDataStore.listAllReferrals();
  const patientById = new Map<string, UserRecord>();
  const allAssessments: AssessmentRecord[] = [];

  for (const d of details) {
    if (!d) continue;
    patientById.set(d.patient.id, d.patient);
    for (const a of d.assessments) allAssessments.push(a);
  }

  const completed = allAssessments.filter(a => a.status === 'COMPLETED');
  const qualities = completed.map(getQuality);
  const comparableCount = qualities.filter(q => q.comparable).length;
  const pendingReview = completed.filter(a => a.reviewStatus === 'PENDING_REVIEW').length;
  const followupRequired = completed.filter(a => a.reviewStatus === 'FOLLOWUP_REQUIRED').length;
  const withBaseline = patients.filter(p => p.assessmentCount >= 1).length; // proxy: has at least one session
  const withEstablishedBaseline = (await Promise.all(details.map(d => d ? HospitalDataStore.getActiveBaseline(d.patient.id) : null))).filter(Boolean).length;

  // Longitudinal follow-up: patients with >=2 completed assessments and days since last
  const followUp = details.filter(Boolean).map(d => {
    const list = (d!.assessments || []).filter(a => a.status === 'COMPLETED').sort((a,b)=> new Date(b.date).getTime()-new Date(a.date).getTime());
    const last = list[0]?.date ? new Date(list[0].date) : null;
    const daysSinceLast = last ? Math.floor((Date.now() - last.getTime()) / (24*3600*1000)) : null;
    const due = daysSinceLast == null ? 'NOT_STARTED' : daysSinceLast > 90 ? 'OVERDUE' : daysSinceLast > 30 ? 'DUE_SOON' : 'ON_TRACK';
    return {
      patientId: d!.patient.patientId,
      patientName: d!.patient.name,
      completedAssessments: list.length,
      lastAssessmentDate: last ? last.toISOString() : null,
      daysSinceLast,
      followUpStatus: due,
      reviewStatus: list[0]?.reviewStatus || 'NOT_SCREENED',
    };
  }).sort((a,b) => (b.daysSinceLast ?? -1) - (a.daysSinceLast ?? -1));

  const assessmentWithPatient = (a: AssessmentRecord) => patientById.get(a.userId);
  const byLanguage = groupMetrics(completed, a => (assessmentWithPatient(a)?.language || 'unknown'));
  const byGender = groupMetrics(completed, a => (assessmentWithPatient(a)?.gender || 'unknown'));
  const byAgeBand = groupMetrics(completed, a => ageBand(assessmentWithPatient(a)?.age));
  const byEducationBand = groupMetrics(completed, a => educationBand(assessmentWithPatient(a)?.educationYears));
  const byQuality = groupMetrics(completed, a => getQuality(a).comparable ? 'comparable' : 'not_comparable');

  const qualityScores = qualities.map(q => q.score).filter((v): v is number => v != null);

  // Completion: a session counts as complete only when quality says FULL. A
  // missing completion label is not counted as complete.
  const fullyCompleted = qualities.filter(q => q.completion === 'FULL').length;

  // Time to clinical assessment: recorded assessment date to recorded review
  // timestamp. Only assessments that were actually reviewed contribute.
  const hoursToReview = completed
    .filter(a => a.reviewedAt)
    .map(a => (new Date(a.reviewedAt as unknown as string).getTime() - new Date(a.date).getTime()) / 3_600_000)
    .filter(value => Number.isFinite(value) && value >= 0);

  // Repeat-session variability within a person: absolute change in the recorded
  // score between consecutive comparable sessions. This is a descriptive
  // stability measure, NOT a test-retest reliability coefficient, and it is not
  // a validated reliable-change threshold.
  const repeatDeltas: number[] = [];
  const repeatPairs: RepeatPair[] = [];
  for (const detail of details) {
    if (!detail) continue;
    const comparableSessions = (detail.assessments || [])
      .filter(a => a.status === 'COMPLETED' && getQuality(a).comparable)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (let i = 1; i < comparableSessions.length; i += 1) {
      const previous = safeNumber(comparableSessions[i - 1].overallScore);
      const current = safeNumber(comparableSessions[i].overallScore);
      if (previous != null && current != null) {
        repeatDeltas.push(Math.abs(current - previous));
        repeatPairs.push({ first: previous, second: current });
      }
    }
  }

  // Test–retest reliability is computed only from real repeat pairs, and stays
  // null until there are enough of them to support an estimate.
  const reliability = icc21(repeatPairs);

  return {
    generatedAt: new Date().toISOString(),
    scope: 'CLINICIAN_PLATFORM_OVERVIEW',
    notes: [
      'Descriptive quality and fairness measurements computed from available recorded data only; no imputed or synthetic values.',
      'Differences across groups do not establish bias or causality; investigate measurement conditions, access, and sample size.',
      'Poor-quality/non-comparable sessions are safety-gated from change interpretation.',
    ],
    population: {
      patients: patients.length,
      patientsWithActiveBaseline: withEstablishedBaseline,
      completedAssessments: completed.length,
    },
    safetyGates: {
      comparableAssessments: comparableCount,
      nonComparableAssessments: completed.length - comparableCount,
      comparabilityRate: completed.length ? Number((comparableCount / completed.length).toFixed(3)) : null,
      completionRate: completed.length ? Number((fullyCompleted / completed.length).toFixed(3)) : null,
      medianHoursToClinicalReview: median(hoursToReview) == null ? null : Number((median(hoursToReview) as number).toFixed(1)),
      reviewedAssessments: hoursToReview.length,
      referralOutcomesRecorded: allReferrals.length,
      referralCompletionRate: allReferrals.length
        ? Number((allReferrals.filter(r => r.outcomeStatus === 'COMPLETED').length / allReferrals.length).toFixed(3))
        : null,
      referralNonCompletionRate: allReferrals.length
        ? Number((allReferrals.filter(r => r.outcomeStatus === 'CANCELLED' || r.outcomeStatus === 'DECLINED' || r.outcomeStatus === 'NO_SHOW').length / allReferrals.length).toFixed(3))
        : null,
      pendingClinicalReview: pendingReview,
      followUpRequired: followupRequired,
      averageSessionQualityScore: qualityScores.length ? Number((qualityScores.reduce((s,v)=>s+v,0)/qualityScores.length).toFixed(2)) : null,
    },
    longitudinalFollowUp: {
      onTrack: followUp.filter(f => f.followUpStatus === 'ON_TRACK').length,
      dueSoon: followUp.filter(f => f.followUpStatus === 'DUE_SOON').length,
      overdue: followUp.filter(f => f.followUpStatus === 'OVERDUE').length,
      notStarted: followUp.filter(f => f.followUpStatus === 'NOT_STARTED').length,
      patients: followUp.slice(0, 50),
    },
    qualityMeasurement: {
      byComparability: byQuality,
    },
    fairnessMeasurement: {
      byLanguage,
      byGender,
      byAgeBand,
      byEducationBand,
      caveat: 'Group metrics are reported only where data exists and may reflect small samples or confounding context; use for monitoring quality/fairness, not for clinical conclusions.',
    },
    measurementProperties: {
      repeatSessionPairs: repeatDeltas.length,
      meanAbsoluteScoreChange: mean(repeatDeltas) == null ? null : Number((mean(repeatDeltas) as number).toFixed(2)),
      standardDeviationOfChange: standardDeviation(repeatDeltas) == null ? null : Number((standardDeviation(repeatDeltas) as number).toFixed(2)),
      icc21: reliability ? reliability.value : null,
      icc21Pairs: reliability ? reliability.pairs : 0,
      icc21RequiresPairs: MIN_REPEAT_PAIRS_FOR_ICC,
      note: reliability
        ? `Provisional ICC(2,1) = ${reliability.value} from ${reliability.pairs} repeat pairs of consecutive comparable sessions. Descriptive only: not a validation result, and no reliable-change threshold is derived from it.`
        : `Descriptive within-person stability between consecutive comparable sessions. No reliability coefficient is reported until at least ${MIN_REPEAT_PAIRS_FOR_ICC} repeat pairs exist; none is estimated from a smaller sample. No validated reliable-change threshold is claimed.`,
    },
  };
}
