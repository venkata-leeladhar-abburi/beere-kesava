import React from "react";
import { useNavigate } from "react-router";
import { ShopStaffPortal } from "../../components/ShopStaffPortal";
import { useAuth } from "../../../contexts/AuthContext";

export function ShopHomePage() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    selectRole(null);
    navigate("/select-role");
  };

  return <ShopStaffPortal onBack={handleBack} />;
}
