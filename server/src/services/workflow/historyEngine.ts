import { HospitalDataStore } from '../../models/dataStore';
import type { HistoryResult } from './types';

export async function loadHistory(userId: string, savedAssessment: any): Promise<HistoryResult> {
  const { baseline, created } = await HospitalDataStore.ensureBaselineAndLink(userId, savedAssessment);
  const detail = await HospitalDataStore.getPatientDetail(userId);
  const assessments = detail?.assessments || [savedAssessment];
  const contextInputs = await HospitalDataStore.getContextInputs(userId);
  const assessmentsCount = assessments.filter((a: any) => a.status === 'COMPLETED').length;
  return {
    baseline: baseline || null,
    baselineCreated: created,
    assessments,
    assessmentsCount,
    contextInputs: contextInputs || [],
  };
}
