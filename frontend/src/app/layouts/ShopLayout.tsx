import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import {
  FirmsProvider, DesignLibraryProvider, BulkOrderProvider, BatchProvider, SalesProvider,
} from "../../contexts";

// FinishingProvider / QcProvider are mounted once in App.tsx so finishing and QC
// data is shared across every portal. The rest are needed here because the shop
// portal's Inventory tab is the same InventoryPage component the admin portal
// uses (see ShopStaffPortal's "inventory" tab), which pulls from all of these.
function ShopContexts({ children }: { children: React.ReactNode }) {
  return (
    <SalesProvider>
      <FirmsProvider>
        <BulkOrderProvider>
          <DesignLibraryProvider>
            <BatchProvider>
              {children}
            </BatchProvider>
          </DesignLibraryProvider>
        </BulkOrderProvider>
      </FirmsProvider>
    </SalesProvider>
  );
}

export function ShopLayout() {
  const { isAuthenticated, role } = useAuth();

  // Auth guard
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && role !== "shop") return <Navigate to="/select-role" replace />;

  return (
    <ShopContexts>
      <Outlet />
    </ShopContexts>
  );
}
