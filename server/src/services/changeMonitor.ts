import type { AssessmentRecord } from '../models/dataStore';
import { isInterpretableScore } from './reviewState';

export const FUNCTIONAL_ACTIVITY_IDS = [
  'appointments',
  'medication',
  'finances',
  'household'
] as const;

export type FunctionalActivityId = typeof FUNCTIONAL_ACTIVITY_IDS[number];
export type ContextFactorId = 'sleep' | 'activity' | 'moodStress';

/**
 * What the within-person data can support about a decline.
 *
 * A difference between two scores cannot be interpreted without an estimate of
 * how much that score moves when nothing has changed. Until enough repeat pairs
 * exist to measure that, no score-based decline is reported at all — the previous
 * rule ("below the lowest of three earlier scores") had no way to separate a real
 * change from ordinary session-to-session variation, so it is gone.
 */
export interface ChangeReliability {
  state: 'NOT_ESTABLISHED' | 'PROVISIONAL';
  /** Consecutive comparable repeat pairs available for this patient. */
  pairs: number;
  /** Standard deviation of within-person session-to-session differences. */
  standardDeviationOfChange: number | null;
  /** 1.96 × SD of change (the reliable change index for a single measurement). */
  reliableChangeThreshold: number | null;
}

/** Fewer repeat pairs than this cannot describe this patient's own variability. */
export const MIN_PAIRS_FOR_RELIABLE_CHANGE = 3;

export interface PatientChangeSummary {
  status: 'INSUFFICIENT_DATA' | 'NO_CHANGE' | 'REVIEW';
  cognitive: {
    latestScore: number | null;
    previousScore: number | null;
    change: number | null;
    /** Mean of up to three prior comparable scores — the comparison point. */
    referenceScore: number | null;
    baselineRange: { minimum: number; maximum: number } | null;
    comparableAssessments: number;
    /** True only when a decline exceeds the reliability threshold below. */
    declineBeyondReliableChange: boolean;
    reliability: ChangeReliability;
  };
  function: {
    currentActivityLevels: Partial<Record<FunctionalActivityId, number>>;
    worsenedActivityIds: FunctionalActivityId[];
    currentCheckInDate: string | null;
    previousCheckInDate: string | null;
  };
  context: {
    currentFactors: Partial<Record<ContextFactorId, number>>;
    changedFactors: ContextFactorId[];
  };
  reviewReasons: Array<'OUTSIDE_RELIABLE_CHANGE' | 'FUNCTIONAL_CHANGE' | 'CONTEXT_CHANGE'>;
}

interface AssessmentContext {
  language: string;
  ageYears: number | null;
  educationYears: number | null;
  taskVersion: string;
  accessibility: {
    vision: number;
    hearing: number;
    motor: number;
    digitalFamiliarity: number;
  };
}

interface FunctionalCheckIn {
  completedAt: string;
  activities: Partial<Record<FunctionalActivityId, number>>;
  contextFactors?: Record<ContextFactorId, number>;
  assessmentContext?: AssessmentContext;
}

function getFunctionalCheckIn(assessment: AssessmentRecord): FunctionalCheckIn | null {
  const checkIn = assessment.taskResponses?.functionalCheckIn;
  if (!checkIn || checkIn.skipped || !checkIn.activities || typeof checkIn.activities !== 'object') {
    return null;
  }

  const activities: Partial<Record<FunctionalActivityId, number>> = {};
  for (const id of FUNCTIONAL_ACTIVITY_IDS) {
    const value = checkIn.activities[id];
    if (Number.isInteger(value) && value >= 0 && value <= 2) {
      activities[id] = value;
    }
  }

  if (Object.keys(activities).length === 0) return null;
  const suppliedDate = typeof checkIn.completedAt === 'string' ? new Date(checkIn.completedAt) : null;
  const completedAt = suppliedDate && Number.isFinite(suppliedDate.getTime())
    ? suppliedDate.toISOString()
    : new Date(assessment.date).toISOString();
  const context = checkIn.assessmentContext;
  const assessmentContext = context &&
    typeof context.language === 'string' &&
    (context.ageYears === null || Number.isInteger(context.ageYears)) &&
    typeof context.taskVersion === 'string' &&
    (context.educationYears === null || Number.isInteger(context.educationYears)) &&
    context.accessibility &&
    ['vision', 'hearing', 'motor', 'digitalFamiliarity'].every(key =>
      Number.isInteger(context.accessibility[key as keyof AssessmentContext['accessibility']]) &&
      context.accessibility[key as keyof AssessmentContext['accessibility']] >= 0 &&
      context.accessibility[key as keyof AssessmentContext['accessibility']] <= 2
    )
    ? context as AssessmentContext
    : undefined;
  const contextFactors = checkIn.contextFactors &&
    ['sleep', 'activity', 'moodStress'].every(key =>
      Number.isInteger(checkIn.contextFactors[key]) &&
      checkIn.contextFactors[key] >= 0 &&
      checkIn.contextFactors[key] <= 2
    )
    ? checkIn.contextFactors as Record<ContextFactorId, number>
    : undefined;
  return { completedAt, activities, contextFactors, assessmentContext };
}

function areComparable(current: FunctionalCheckIn, previous: FunctionalCheckIn): boolean {
  const a = current.assessmentContext;
  const b = previous.assessmentContext;
  return Boolean(a && b &&
    a.language === b.language &&
    a.educationYears === b.educationYears &&
    a.taskVersion === b.taskVersion &&
    a.accessibility.vision === b.accessibility.vision &&
    a.accessibility.hearing === b.accessibility.hearing &&
    a.accessibility.motor === b.accessibility.motor &&
    a.accessibility.digitalFamiliarity === b.accessibility.digitalFamiliarity);
}

/**
 * Describe how much a score moves for this patient when nothing has changed.
 *
 * SD of consecutive within-person differences → reliable change index
 * (1.96 × SD). That is the smallest decline this data can distinguish from
 * noise, and it is the only threshold the product uses for a score-based flag.
 * With fewer than `MIN_PAIRS_FOR_RELIABLE_CHANGE` pairs, or with a degenerate
 * zero spread (every repeat identical), no threshold is returned and no decline
 * is reported.
 */
function describeReliability(differences: number[]): ChangeReliability {
  const usable = differences.filter((value) => Number.isFinite(value));
  if (usable.length < MIN_PAIRS_FOR_RELIABLE_CHANGE) {
    return {
      state: 'NOT_ESTABLISHED',
      pairs: usable.length,
      standardDeviationOfChange: null,
      reliableChangeThreshold: null
    };
  }

  const mean = usable.reduce((sum, value) => sum + value, 0) / usable.length;
  const variance = usable.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (usable.length - 1);
  const standardDeviation = Math.sqrt(variance);
  if (!Number.isFinite(standardDeviation) || standardDeviation === 0) {
    return {
      state: 'NOT_ESTABLISHED',
      pairs: usable.length,
      standardDeviationOfChange: null,
      reliableChangeThreshold: null
    };
  }

  return {
    state: 'PROVISIONAL',
    pairs: usable.length,
    standardDeviationOfChange: Number(standardDeviation.toFixed(1)),
    reliableChangeThreshold: Number((1.96 * standardDeviation).toFixed(1))
  };
}

export function summarizePatientChanges(assessments: AssessmentRecord[]): PatientChangeSummary {
  const completed = assessments
    .filter(assessment => assessment.status === 'COMPLETED')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = completed[0];
  // Sessions without an interpretable score never enter a cognitive comparison:
  // there is nothing to compare, and treating a missing score as a value would
  // fabricate both a baseline and a change.
  const scored = completed.filter(assessment => isInterpretableScore(assessment.overallScore));
  const latestScored = scored[0] ?? null;
  const checkIns = completed
    .map(assessment => ({
      assessment,
      checkIn: getFunctionalCheckIn(assessment)
    }))
    .filter((entry): entry is { assessment: AssessmentRecord; checkIn: FunctionalCheckIn } => Boolean(entry.checkIn));
  const currentCheckIn = checkIns[0];
  const previousCheckIn = checkIns[1];
  const currentCheckInIsLatest = currentCheckIn && currentCheckIn.assessment.id === latest?.id;
  const comparableHistory = currentCheckInIsLatest
    ? checkIns.slice(1).filter(
        entry => areComparable(currentCheckIn.checkIn, entry.checkIn)
          && isInterpretableScore(entry.assessment.overallScore)
      )
    : [];
  const baselineAssessments = comparableHistory.slice(0, 3);
  const baselineValues = baselineAssessments
    .map(entry => entry.assessment.overallScore)
    .filter(isInterpretableScore);
  const baselineRange = baselineValues.length === 3
    ? {
        minimum: Math.min(...baselineValues),
        maximum: Math.max(...baselineValues)
      }
    : null;
  const previousComparable = comparableHistory[0]?.assessment;
  const latestScoredScore = latestScored && isInterpretableScore(latestScored.overallScore)
    ? latestScored.overallScore
    : null;
  const previousComparableScore = previousComparable && isInterpretableScore(previousComparable.overallScore)
    ? previousComparable.overallScore
    : null;
  const cognitiveChange = latestScoredScore !== null && previousComparableScore !== null
    ? Number((latestScoredScore - previousComparableScore).toFixed(1))
    : null;

  // The comparison point: the mean of up to three prior comparable scores. The
  // range remains for display, but a decline is judged against measured
  // variability, not against the lowest value ever seen.
  const referenceScore = baselineValues.length > 0
    ? Number((baselineValues.reduce((sum, value) => sum + value, 0) / baselineValues.length).toFixed(1))
    : null;

  // This patient's own session-to-session variability. Only consecutive
  // comparable scores contribute, because a pair spanning a year of genuine
  // change would inflate the error estimate as much as a pair spanning a week.
  const seriesScores: number[] = [];
  if (currentCheckInIsLatest && latestScoredScore !== null) seriesScores.push(latestScoredScore);
  for (const entry of comparableHistory) {
    if (isInterpretableScore(entry.assessment.overallScore)) {
      seriesScores.push(entry.assessment.overallScore);
    }
  }
  const differences = seriesScores
    .slice(1)
    .map((score, index) => score - seriesScores[index]);
  const reliability = describeReliability(differences);

  const declineBeyondReliableChange = Boolean(
    reliability.reliableChangeThreshold !== null &&
    referenceScore !== null &&
    latestScoredScore !== null &&
    currentCheckInIsLatest &&
    referenceScore - latestScoredScore >= reliability.reliableChangeThreshold
  );
  const worsenedActivityIds: FunctionalActivityId[] = [];
  const changedFactors: ContextFactorId[] = [];

  if (currentCheckInIsLatest && previousCheckIn) {
    for (const id of FUNCTIONAL_ACTIVITY_IDS) {
      const currentValue = currentCheckIn.checkIn.activities[id];
      const previousValue = previousCheckIn.checkIn.activities[id];
      if (currentValue !== undefined && previousValue !== undefined && currentValue > previousValue) {
        worsenedActivityIds.push(id);
      }
    }
    for (const id of ['sleep', 'activity', 'moodStress'] as const) {
      const currentValue = currentCheckIn.checkIn.contextFactors?.[id];
      const previousValue = previousCheckIn.checkIn.contextFactors?.[id];
      if (currentValue !== undefined && previousValue !== undefined && currentValue > previousValue) {
        changedFactors.push(id);
      }
    }
  }

  const reviewReasons: PatientChangeSummary['reviewReasons'] = [];
  if (declineBeyondReliableChange) reviewReasons.push('OUTSIDE_RELIABLE_CHANGE');
  if (worsenedActivityIds.length > 0) reviewReasons.push('FUNCTIONAL_CHANGE');
  if (changedFactors.length > 0) reviewReasons.push('CONTEXT_CHANGE');

  // "NO_CHANGE" is a claim of stability. It therefore requires an actual scored
  // comparison *and* a measured variability to compare it against; matching
  // check-ins alone are not evidence of stability, and neither is a difference
  // whose noise has never been estimated.
  const hasComparableData = Boolean(
    baselineRange ||
    (currentCheckInIsLatest && latestScoredScore !== null && previousComparableScore !== null)
  );
  const hasScoredComparison = hasComparableData && reliability.state === 'PROVISIONAL';
  return {
    status: reviewReasons.length > 0 ? 'REVIEW' : hasScoredComparison ? 'NO_CHANGE' : 'INSUFFICIENT_DATA',
    cognitive: {
      latestScore: latestScoredScore,
      previousScore: previousComparableScore,
      change: cognitiveChange,
      referenceScore,
      baselineRange,
      // Only scored sessions count as comparable assessments.
      comparableAssessments: comparableHistory.length + (currentCheckInIsLatest && latestScoredScore !== null ? 1 : 0),
      declineBeyondReliableChange,
      reliability
    },
    function: {
      currentActivityLevels: currentCheckInIsLatest ? currentCheckIn.checkIn.activities : {},
      worsenedActivityIds,
      currentCheckInDate: currentCheckInIsLatest ? currentCheckIn.checkIn.completedAt : null,
      previousCheckInDate: currentCheckInIsLatest ? previousCheckIn?.checkIn.completedAt ?? null : null
    },
    context: {
      currentFactors: currentCheckInIsLatest ? currentCheckIn.checkIn.contextFactors ?? {} : {},
      changedFactors
    },
    reviewReasons
  };
}
