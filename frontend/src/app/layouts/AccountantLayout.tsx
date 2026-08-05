import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { composeProviders } from "../../lib/composeProviders";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import {
  POProvider, BulkOrderProvider, DesignLibraryProvider,
  BatchProvider, MaterialIssueProvider, FirmsProvider,
  WeaverPaymentsProvider, SalesProvider, CustomersProvider,
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
  const { isAuthenticated, role } = useAuth();

  // Auth guard
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && role !== "accountant") return <Navigate to="/select-role" replace />;

  return (
    <AccountantContexts>
      <ErrorBoundary resetTo="/accountant">
        <Outlet />
      </ErrorBoundary>
    </AccountantContexts>
  );
}
