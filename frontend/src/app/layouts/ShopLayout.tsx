import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { composeProviders } from "../../lib/composeProviders";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import {
  FirmsProvider, DesignLibraryProvider, BulkOrderProvider, BatchProvider, SalesProvider, CustomersProvider,
} from "../../contexts";

// FinishingProvider / QcProvider are mounted once in App.tsx so finishing and QC
// data is shared across every portal. The rest are needed here because the shop
// portal's Inventory tab is the same InventoryPage component the admin portal
// uses (see ShopStaffPortal's "inventory" tab), which pulls from all of these.
const ShopContexts = composeProviders([
  SalesProvider,
  CustomersProvider,
  FirmsProvider,
  BulkOrderProvider,
  DesignLibraryProvider,
  BatchProvider,
]);

export function ShopLayout() {
  const { isAuthenticated, role } = useAuth();

  // Auth guard
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== "shop") return <Navigate to="/login" replace />;

  return (
    <ShopContexts>
      <ErrorBoundary resetTo="/shop">
        <Outlet />
      </ErrorBoundary>
    </ShopContexts>
  );
}
