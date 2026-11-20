import { summarizePatientChanges } from '../changeMonitor';
import type { LongitudinalIntelligenceResult, SafetyAccessibilityResult } from './types';

export function runLongitudinalIntelligence(
  assessments: any[],
  safety: SafetyAccessibilityResult
): LongitudinalIntelligenceResult {
  const changeSummary = summarizePatientChanges(assessments);

  let status: 'INSUFFICIENT_DATA' | 'NO_CHANGE' | 'REVIEW' = changeSummary.status;
  if (!safety.sessionQuality.comparable) {
    status = 'INSUFFICIENT_DATA';
  }

  const cognitiveChange = changeSummary.cognitive.change;
  const outsideBaseline = changeSummary.cognitive.declineBeyondReliableChange;
  const reviewReasons = Array.from(new Set([
    ...changeSummary.reviewReasons,
    ...(safety.sessionQuality.comparable ? [] : ['INSUFFICIENT_QUALITY']),
    ...safety.sessionQuality.reasons,
  ]));

  return {
    status,
    cognitiveChange: cognitiveChange == null ? null : cognitiveChange,
    outsideBaseline: status === 'REVIEW' ? outsideBaseline : false,
    reviewReasons,
    comparableAssessments: changeSummary.cognitive.comparableAssessments,
    reliability: changeSummary.cognitive.reliability,
    changeSummary,
  };
}
