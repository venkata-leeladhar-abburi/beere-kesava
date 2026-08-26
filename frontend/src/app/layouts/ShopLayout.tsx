import React from "react";
import { Outlet } from "react-router";
import { RequireRole } from "../guards/RequireRole";
import { composeProviders } from "../../lib/composeProviders";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import {
  FirmsProvider,
  DesignLibraryProvider,
  BulkOrderProvider,
  BatchProvider,
  SalesProvider,
  CustomersProvider,
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
  return (
    <RequireRole allow="shop">
      <ShopContexts>
        <ErrorBoundary resetTo="/shop">
          <Outlet />
        </ErrorBoundary>
      </ShopContexts>
    </RequireRole>
  );
}
