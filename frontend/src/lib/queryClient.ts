import { QueryClient } from "@tanstack/react-query";

/**
 * Single QueryClient for the app. Defaults are tuned for the current
 * reality — every queryFn resolves from an in-memory seed array, not a
 * real API — so aggressive refetching would just re-run the same
 * synchronous data for no benefit. When a real backend lands, these
 * defaults (not the call sites) are what should change first.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});
