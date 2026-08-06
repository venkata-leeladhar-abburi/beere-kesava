import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../../contexts/AuthContext";
import { weaversApi, BackendWeaver } from "../../../../shared/api/weavers";

/**
 * Resolves the Weaver record that belongs to the currently logged-in user.
 *
 * There is no userId/weaverId FK linking the `User` and `Weaver` Prisma
 * models (Weaver is a separate master, not a login account) — but the
 * backend's OTP login (auth.service.ts verifyOtp) already resolves this at
 * sign-in time: when a login phone matches a Weaver row (not a User row),
 * it sets the JWT `sub`/response `user.id` directly to that Weaver's real
 * id. So for a WEAVER-role session, `AuthContext`'s `user.id` already IS
 * the real Weaver UUID — no client-side matching needed, just fetch it.
 *
 * This is the single source of truth for "which weaverId is this portal
 * session for" — every weaver-portal page that needs to scope data to the
 * logged-in weaver should use this hook instead of a hardcoded id.
 */
export function useCurrentWeaver() {
  const { user } = useAuth();
  const weaverId = user?.role === "WEAVER" ? user.id ?? null : null;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["weavers", "me", weaverId],
    queryFn: () => weaversApi.findOne(weaverId!),
    enabled: !!weaverId,
  });

  const weaver: BackendWeaver | null = data ?? null;
  const notFound = !weaverId && !isLoading;

  return {
    weaver,
    weaverId,
    isLoading,
    isError: isError || notFound,
    error: error ?? (notFound ? new Error("This login is not associated with a weaver record.") : null),
  };
}
