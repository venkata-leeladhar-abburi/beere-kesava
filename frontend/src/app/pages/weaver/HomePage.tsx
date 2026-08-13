import React from "react";
import { useNavigate } from "react-router";
import { WeaverPortal } from "../../../features/portals/components/WeaverPortal";
import { useAuth } from "../../../contexts/AuthContext";

export function WeaverHomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    logout();
    navigate("/login");
  };

  return <WeaverPortal onBack={handleBack} />;
}
