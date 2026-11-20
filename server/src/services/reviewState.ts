/**
 * Administrative review state.
 *
 * This replaces the former `riskLevel` tier (LOW / MODERATE / HIGH). That tier
 * was derived from invented cut-offs on an unvalidated score and was displayed
 * to clinicians as a clinical classification. It is deliberately removed: no
 * NeuLens output is a risk classification.
 *
 * A review state answers one administrative question only — "does a qualified
 * clinician need to look at this session?" — and never states whether a patient
 * is well or unwell.
 *
 *   NOT_REVIEWED        Recorded. Nothing is flagged. No interpretation claimed.
 *   NOT_INTERPRETABLE   Recorded, but no interpretable score exists (skipped or
 *                       partially completed battery). Nothing may be read from it.
 *   REVIEW_PROMPT       A deterministic rule fired (out-of-baseline change,
 *                       worsened function, context change). Clinician review prompted.
 *   CLINICIAN_REVIEWED  A qualified clinician has completed review.
 */
export type ReviewState =
  | 'NOT_REVIEWED'
  | 'NOT_INTERPRETABLE'
  | 'REVIEW_PROMPT'
  | 'CLINICIAN_REVIEWED';

/** Legacy tiers carried no clinical meaning and are collapsed, not preserved. */
const LEGACY_REVIEW_ALIASES: Record<string, ReviewState> = {
  REVIEW_PROMPT: 'REVIEW_PROMPT',
  NOT_INTERPRETABLE: 'NOT_INTERPRETABLE',
  CLINICIAN_REVIEWED: 'CLINICIAN_REVIEWED',
  REVIEWED: 'CLINICIAN_REVIEWED',
  NOT_REVIEWED: 'NOT_REVIEWED'
};

/**
 * Normalises any stored value to a review state.
 * LOW / MODERATE / HIGH / UNRATED / PENDING were never evidence-based and map
 * to NOT_REVIEWED rather than being silently reinterpreted as a clinical signal.
 */
export function toReviewState(value: string | null | undefined): ReviewState {
  return LEGACY_REVIEW_ALIASES[(value || '').toUpperCase()] ?? 'NOT_REVIEWED';
}

/** A score is interpretable only when it is an actual recorded finite number. */
export function isInterpretableScore(score: number | null | undefined): score is number {
  return typeof score === 'number' && Number.isFinite(score);
}

/**
 * Derives the stored review state from what the session actually produced.
 * There is no default "normal" value anywhere in this path: an absent score is
 * NOT_INTERPRETABLE, never a comfortable number.
 */
export function reviewStateForAssessment(
  overallScore: number | null,
  changeStatus?: 'INSUFFICIENT_DATA' | 'NO_CHANGE' | 'REVIEW' | null
): ReviewState {
  if (!isInterpretableScore(overallScore)) return 'NOT_INTERPRETABLE';
  return changeStatus === 'REVIEW' ? 'REVIEW_PROMPT' : 'NOT_REVIEWED';
}
