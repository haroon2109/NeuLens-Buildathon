import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client.
 *
 * Portal data is clinician-reviewed rather than high-frequency, so the
 * defaults favour keeping a screen stable instead of refetching under the
 * user's eyes: a short stale window, one retry for transient failures, and
 * no refetch on window focus (which would interrupt an in-progress form).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
