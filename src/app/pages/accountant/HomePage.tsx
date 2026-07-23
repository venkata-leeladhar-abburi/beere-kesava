import React from "react";
import { useNavigate } from "react-router";
import { AccountantDashboard } from "../../components/AccountantDashboard";
import { useAuth } from "../../../contexts/AuthContext";

export function AccountantHomePage() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    selectRole(null);
    navigate("/select-role");
  };

  return <AccountantDashboard onBack={handleBack} />;
}
