import React from "react";
import { useNavigate } from "react-router";
import { SuperadminDashboard } from "../../components/SuperadminDashboard";
import { useAuth } from "../../../contexts/AuthContext";

export function SuperadminDashboardPage() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    selectRole(null);
    navigate("/select-role");
  };

  return <SuperadminDashboard onBack={handleBack} />;
}
