import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../../contexts/AuthContext";
import { weaversApi, BackendWeaver } from "../../../../shared/api/weavers";

/**
 * Resolves the Weaver record that belongs to the currently logged-in user.
 *
 * A WEAVER-role User row now always has a linked Weaver (see
 * users.service.ts's auto-link on create), so `user.id` is the *User's*
 * UUID, not the Weaver's — the backend's OTP login (auth.service.ts
 * verifyOtp) resolves the real Weaver.id separately into `user.weaverId`
 * (falling back to the Weaver's own id in the legacy weaver-phone-only
 * match path, where there's no User row at all). Always read `weaverId`,
 * never `id`, for anything that needs to scope data to this weaver.
 *
 * This is the single source of truth for "which weaverId is this portal
 * session for" — every weaver-portal page that needs to scope data to the
 * logged-in weaver should use this hook instead of a hardcoded id.
 */
export function useCurrentWeaver() {
  const { user } = useAuth();
  const weaverId = user?.role === "WEAVER" ? user.weaverId ?? null : null;

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
