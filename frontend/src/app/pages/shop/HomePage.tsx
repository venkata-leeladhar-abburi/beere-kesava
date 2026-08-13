import React from "react";
import { useNavigate } from "react-router";
import { ShopStaffPortal } from "../../../features/portals/components/ShopStaffPortal";
import { useAuth } from "../../../contexts/AuthContext";

export function ShopHomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    logout();
    navigate("/login");
  };

  return <ShopStaffPortal onBack={handleBack} />;
}
