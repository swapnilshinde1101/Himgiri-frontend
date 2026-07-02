import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
      retry: 1,                   // Retry failed requests once
      staleTime: 5 * 60 * 1000,   // Cache data for 5 minutes
    },
  },
});
