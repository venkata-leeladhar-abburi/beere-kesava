import React from "react";
import { Outlet } from "react-router";
import { RequireRole } from "../guards/RequireRole";
import { composeProviders } from "../../lib/composeProviders";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import {
  POProvider,
  BulkOrderProvider,
  DesignLibraryProvider,
  BatchProvider,
  MaterialIssueProvider,
  FirmsProvider,
  WeaverPaymentsProvider,
  SalesProvider,
  CustomersProvider,
} from "../../contexts";

// FinishingProvider / FinishingStaffProvider are mounted once in App.tsx so
// finishing data is shared across worker, admin, superadmin and accountant.
const AccountantContexts = composeProviders([
  SalesProvider,
  CustomersProvider,
  WeaverPaymentsProvider,
  FirmsProvider,
  POProvider,
  BulkOrderProvider,
  DesignLibraryProvider,
  BatchProvider,
  MaterialIssueProvider,
]);

export function AccountantLayout() {
  return (
    <RequireRole allow="accountant">
      <AccountantContexts>
        <ErrorBoundary resetTo="/accountant">
          <Outlet />
        </ErrorBoundary>
      </AccountantContexts>
    </RequireRole>
  );
}
