import React from "react";
import { useNavigate } from "react-router";
import { AccountantDashboard } from "../../../features/dashboards/components/AccountantDashboard";
import { useAuth } from "../../../contexts/AuthContext";

export function AccountantHomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    logout();
    navigate("/login");
  };

  return <AccountantDashboard onBack={handleBack} />;
}
