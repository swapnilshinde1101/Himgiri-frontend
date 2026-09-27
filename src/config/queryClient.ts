import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
      // Only retry transient network / server errors; never retry unrecoverable 401, 403, or 404
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 1;
      },
      staleTime: 5 * 60 * 1000,   // Cache data for 5 minutes
    },
  },
});
