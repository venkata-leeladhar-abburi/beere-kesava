import React from "react";
import { useNavigate } from "react-router";
import { WorkerPortal } from "../../components/WorkerPortal";
import { useAuth } from "../../../contexts/AuthContext";

export function WorkerHomePage() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    selectRole(null);
    navigate("/select-role");
  };

  return <WorkerPortal onBack={handleBack} />;
}
