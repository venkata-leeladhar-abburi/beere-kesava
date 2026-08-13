import React from "react";
import { useNavigate, Navigate } from "react-router";
import { LoginPage as LoginPageComponent } from "../../features/auth/components/LoginPage";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE_ROUTES } from "../roleRoutes";

export function LoginPage() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  // Already logged in — go straight to that phone number's one portal.
  // A role that doesn't map to a known portal (backend returned something
  // unexpected, or genuinely has none) falls through to /select-role, which
  // now only ever shows an access-denied message — never a picker.
  if (isAuthenticated) return <Navigate to={role ? ROLE_ROUTES[role] : "/select-role"} replace />;

  return (
    <LoginPageComponent
      onLogin={() => {
        // login() (called by the OTP step before this fires) has already set
        // the real, backend-verified role — this component re-renders with
        // it, so by the time this callback runs `role` below is current.
        navigate(role ? ROLE_ROUTES[role] : "/select-role");
      }}
    />
  );
}
