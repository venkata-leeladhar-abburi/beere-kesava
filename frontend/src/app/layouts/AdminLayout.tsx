import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { composeProviders } from "../../lib/composeProviders";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import {
  POProvider, BulkOrderProvider, DesignLibraryProvider,
  BatchProvider, MaterialIssueProvider, MaterialReturnProvider, FirmsProvider,
  WeaverPaymentsProvider, SalesProvider, CustomersProvider,
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
  const { isAuthenticated, role } = useAuth();

  // Auth guard — a session whose role isn't exactly "admin" (including
  // admin/superadmin trying to view "as" another portal, which no longer
  // exists) never renders this portal. /login's own authenticated-redirect
  // sends a still-logged-in user straight back to their real one portal
  // rather than any picker.
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/login" replace />;

  return (
    <AdminContexts>
      <ErrorBoundary resetTo="/admin">
        <Outlet />
      </ErrorBoundary>
    </AdminContexts>
  );
}
