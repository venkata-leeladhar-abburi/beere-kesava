import React from "react";
import { useNavigate, Navigate } from "react-router";
import { LoginPage as LoginPageComponent } from "../components/LoginPage";
import { useAuth } from "../../contexts/AuthContext";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  // Already logged in — skip to role select
  if (isAuthenticated) return <Navigate to="/select-role" replace />;

  return (
    <LoginPageComponent
      onLogin={() => {
        login("");
        navigate("/select-role");
      }}
    />
  );
}
