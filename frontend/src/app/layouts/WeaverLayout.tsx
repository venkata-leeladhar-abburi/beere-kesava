import React from "react";
import { Outlet } from "react-router";
import { RequireRole } from "../guards/RequireRole";
import { composeProviders } from "../../lib/composeProviders";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import {
  DesignLibraryProvider,
  BatchProvider,
  MaterialIssueProvider,
  WeaverPaymentsProvider,
} from "../../contexts";

const WeaverContexts = composeProviders([
  DesignLibraryProvider,
  BatchProvider,
  MaterialIssueProvider,
  WeaverPaymentsProvider,
]);

export function WeaverLayout() {
  return (
    <RequireRole allow="weaver">
      <WeaverContexts>
        <ErrorBoundary resetTo="/weaver">
          <Outlet />
        </ErrorBoundary>
      </WeaverContexts>
    </RequireRole>
  );
}
