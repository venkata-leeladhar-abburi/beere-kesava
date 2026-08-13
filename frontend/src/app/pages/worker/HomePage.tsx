import React from "react";
import { useNavigate } from "react-router";
import { WorkerPortal } from "../../../features/portals/components/WorkerPortal";
import { useAuth } from "../../../contexts/AuthContext";

export function WorkerHomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    logout();
    navigate("/login");
  };

  return <WorkerPortal onBack={handleBack} />;
}
