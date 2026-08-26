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
  MaterialReturnProvider,
  FirmsProvider,
  WeaverPaymentsProvider,
  SalesProvider,
  CustomersProvider,
} from "../../contexts";

// FinishingProvider / FinishingStaffProvider are mounted once in App.tsx so
// finishing data is shared across worker, admin, superadmin and accountant.
const SuperadminContexts = composeProviders([
  SalesProvider,
  CustomersProvider,
  WeaverPaymentsProvider,
  FirmsProvider,
  POProvider,
  BulkOrderProvider,
  DesignLibraryProvider,
  BatchProvider,
  MaterialIssueProvider,
  MaterialReturnProvider,
]);

export function SuperadminLayout() {
  return (
    <RequireRole allow="superadmin">
      <SuperadminContexts>
        <ErrorBoundary resetTo="/superadmin">
          <Outlet />
        </ErrorBoundary>
      </SuperadminContexts>
    </RequireRole>
  );
}
