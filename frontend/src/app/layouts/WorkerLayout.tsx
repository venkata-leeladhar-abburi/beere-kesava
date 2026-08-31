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
  FinishingProvider,
  FinishingStaffProvider,
  QcProvider,
} from "../../contexts";

const WorkerContexts = composeProviders([
  DesignLibraryProvider,
  BatchProvider,
  MaterialIssueProvider,
  FirmsProvider,
  FinishingStaffProvider,
  FinishingProvider,
  QcProvider,
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
