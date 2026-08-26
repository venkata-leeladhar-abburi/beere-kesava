/**
 * Replaces the inline `if (!isAuthenticated) ... if (role !== X) ...` that
 * was duplicated in all 6 files under app/layouts/. The two failures are
 * NOT the same UI state and must not share a redirect:
 *
 *   - not authenticated at all  → /login (nothing to show, nothing to lose)
 *   - authenticated, wrong role → AccessDeniedState, in place. Every layout
 *     used to send this to /login too, which is indistinguishable from being
 *     logged out — the actual signed-in session was thrown away by the
 *     redirect for no reason.
 */
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth, type Role } from "../../contexts/AuthContext";
import { AccessDeniedState } from "../../shared/ui/state";

/** The prop is `allow` rather than `role` because jsx-a11y reads any JSX
 *  attribute named `role` as the ARIA one and rejects "admin"/"weaver"/… as
 *  invalid ARIA roles — a false positive on all six layouts. */
export function RequireRole({ allow, children }: { allow: Role; children: ReactNode }) {
  const { isAuthenticated, role: currentRole } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (currentRole !== allow) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AccessDeniedState />
      </div>
    );
  }

  return <>{children}</>;
}
