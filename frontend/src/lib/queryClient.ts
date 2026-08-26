import { QueryCache, QueryClient, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { isForbidden, isRetryable, isSessionExpired } from "../shared/api/client";
import { toastMessageForError } from "../shared/ui/state/errorMessages";

/**
 * Single QueryClient for the app. Queries now hit a real backend, so the
 * old `staleTime: Infinity` default is wrong: it cached every list for the
 * lifetime of the tab, meaning a batch created (or materials issued) in
 * one place never appeared in another until a hard reload.
 *
 * 30s keeps navigation cheap while letting cross-page writes surface on
 * their own; refetching on window focus picks up changes made in another
 * tab or by another user.
 *
 * retry: the old blanket `false` meant one transient blip (a cold-starting
 * backend, a dropped packet) turned into a permanent error screen with
 * nothing to do but reload the page. Network failures and 5xx are retried
 * up to twice with backoff; a 4xx never is — retrying a 403 or a validation
 * error just repeats the same rejection.
 *
 * onError here is a backstop, not the primary path — screens still render
 * their own ErrorState from the query's `error`. It exists for the two
 * cases that need to happen exactly once regardless of which screen
 * triggered them: routing a session-expired response to /session-expired
 * (handled in shared/api/client.ts's handleUnauthorized, called from every
 * request) and toasting FORBIDDEN so a background refetch failure isn't
 * silent.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => isRetryable(error) && !isSessionExpired(error) && failureCount < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8_000),
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Session-expiry navigation already happened inside the client (it
      // needs to fire once per response, not once per query observer).
      // A background refetch (query already has cached data) failing with
      // FORBIDDEN is still worth a toast — the screen showing stale data
      // won't otherwise know the retry silently failed.
      if (isForbidden(error) && query.state.data !== undefined) {
        toast.error(toastMessageForError(error));
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      // A mutation that supplies its own onError (per-field mapping, a
      // custom message) opts out of the default toast — see useAppForm.
      if (mutation.options.onError) return;
      toast.error(toastMessageForError(error));
    },
  }),
});
