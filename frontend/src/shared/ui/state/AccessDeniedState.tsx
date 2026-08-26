/**
 * The 403 screen. Distinct from a login bounce on purpose: the user IS
 * signed in, they just can't see this particular thing. Sending them to
 * /login instead (what every layout did before this component existed) is
 * confusing — the credentials that got rejected are the wrong permission,
 * not a bad session, and a login form implies the latter.
 */
import { useNavigate } from "react-router";
import { StateView } from "./StateView";
import { useAuth } from "../../../contexts/AuthContext";
import { ROLE_ROUTES } from "../../../app/roleRoutes";

export interface AccessDeniedStateProps {
  /** Override the default copy for a scope failure vs. a role failure. */
  title?: string;
  description?: string;
  compact?: boolean;
}

export function AccessDeniedState({
  title = "You don't have access to this",
  description = "This part of the app isn't available for your role.",
  compact,
}: AccessDeniedStateProps) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const home = role ? ROLE_ROUTES[role] : "/login";

  return (
    <StateView
      role="alert"
      icon="accessDenied"
      title={title}
      description={description}
      compact={compact}
      action={{ label: "Back to your home", onClick: () => navigate(home, { replace: true }) }}
    />
  );
}
