import { QueryClient } from "@tanstack/react-query";

/**
 * Single QueryClient for the app. Queries now hit a real backend, so the
 * old `staleTime: Infinity` default is wrong: it cached every list for the
 * lifetime of the tab, meaning a batch created (or materials issued) in
 * one place never appeared in another until a hard reload.
 *
 * 30s keeps navigation cheap while letting cross-page writes surface on
 * their own; refetching on window focus picks up changes made in another
 * tab or by another user.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: false,
    },
  },
});
