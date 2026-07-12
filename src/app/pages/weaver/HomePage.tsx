import React from "react";
import { useNavigate } from "react-router";
import { WeaverPortal } from "../../components/WeaverPortal";
import { useAuth } from "../../../contexts/AuthContext";

export function WeaverHomePage() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    selectRole(null);
    navigate("/select-role");
  };

  return <WeaverPortal onBack={handleBack} />;
}
