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
const AdminContexts = composeProviders([
  SalesProvider,
  CustomersProvider,
  POProvider,
  BulkOrderProvider,
  DesignLibraryProvider,
  BatchProvider,
  MaterialIssueProvider,
  MaterialReturnProvider,
  FirmsProvider,
  WeaverPaymentsProvider,
]);

export function AdminLayout() {
  return (
    <RequireRole allow="admin">
      <AdminContexts>
        <ErrorBoundary resetTo="/admin">
          <Outlet />
        </ErrorBoundary>
      </AdminContexts>
    </RequireRole>
  );
}
