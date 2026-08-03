import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
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
  const { isAuthenticated, role } = useAuth();

  // Auth guard
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && role !== "weaver") return <Navigate to="/select-role" replace />;

  return (
    <WeaverContexts>
      <ErrorBoundary resetTo="/weaver">
        <Outlet />
      </ErrorBoundary>
    </WeaverContexts>
  );
}
