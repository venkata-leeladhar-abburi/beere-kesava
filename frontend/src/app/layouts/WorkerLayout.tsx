import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { composeProviders } from "../../lib/composeProviders";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import {
  BatchProvider,
  MaterialIssueProvider,
  DesignLibraryProvider,
  FirmsProvider,
} from "../../contexts";

// FinishingProvider / FinishingStaffProvider are mounted once in App.tsx so
// finishing data is shared across worker, admin, superadmin and accountant.
// FirmsProvider is needed here too — the Dispatch Details page names the firm
// each dispatch was raised under.
const WorkerContexts = composeProviders([
  DesignLibraryProvider,
  BatchProvider,
  MaterialIssueProvider,
  FirmsProvider,
]);

export function WorkerLayout() {
  const { isAuthenticated, role } = useAuth();

  // Auth guard
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== "worker") return <Navigate to="/select-role" replace />;

  return (
    <WorkerContexts>
      <ErrorBoundary resetTo="/worker">
        <Outlet />
      </ErrorBoundary>
    </WorkerContexts>
  );
}
