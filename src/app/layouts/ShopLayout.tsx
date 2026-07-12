import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { FirmsProvider } from "../../contexts";

export function ShopLayout() {
  const { isAuthenticated, role } = useAuth();

  // Auth guard
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && role !== "shop") return <Navigate to="/select-role" replace />;

  return (
    <FirmsProvider>
      <Outlet />
    </FirmsProvider>
  );
}
