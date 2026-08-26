import React from "react";
import { Outlet } from "react-router";
import { RequireRole } from "../guards/RequireRole";
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
  return (
    <RequireRole allow="worker">
      <WorkerContexts>
        <ErrorBoundary resetTo="/worker">
          <Outlet />
        </ErrorBoundary>
      </WorkerContexts>
    </RequireRole>
  );
}
