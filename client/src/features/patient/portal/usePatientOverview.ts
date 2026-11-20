import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  patientPortalApi,
  type PatientOverview
} from '../../../services/patientPortalApi';

const emptyOverview: PatientOverview = {
  assessments: [],
  baseline: null,
  longitudinal: [],
  changes: [],
  context: [],
  brainHealth: null
};

export const patientOverviewQueryKey = ['patient', 'overview'] as const;

export const usePatientOverview = () => {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: patientOverviewQueryKey,
    queryFn: () => patientPortalApi.getOverview()
  });

  const overview = data ?? emptyOverview;
  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    ...overview,
    latestAssessment: overview.assessments[0] || null,
    isLoading: isPending,
    error: error ? (error instanceof Error ? error.message : 'Unable to load your portal data.') : null,
    refresh
  };
};
