import React from "react";
import { useNavigate } from "react-router";
import { SuperadminDashboard } from "../../../features/dashboards/components/SuperadminDashboard";
import { useAuth } from "../../../contexts/AuthContext";

export function SuperadminDashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    logout();
    navigate("/login");
  };

  return <SuperadminDashboard onBack={handleBack} />;
}
