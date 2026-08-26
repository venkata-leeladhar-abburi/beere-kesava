/**
 * Full-page state for a token the backend has confirmed is expired
 * (AUTH_SESSION_EXPIRED — see shared/api/client.ts handleUnauthorized).
 * Preserves `returnTo` so re-login lands the user back where they were
 * instead of always at the portal root.
 */
import { useNavigate, useSearchParams } from "react-router";
import { StateView } from "./StateView";

export function SessionExpiredState() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get("returnTo");

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <StateView
        role="alert"
        icon="sessionExpired"
        title="Your session has expired"
        description="Sign in again to pick up where you left off."
        action={{
          label: "Sign in again",
          onClick: () =>
            navigate(returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login", {
              replace: true,
            }),
        }}
      />
    </div>
  );
}
