import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import {
  DesignLibraryProvider,
  BatchProvider,
  MaterialIssueProvider,
  WeaverPaymentsProvider,
} from "../../contexts";

function WeaverContexts({ children }: { children: React.ReactNode }) {
  return (
    <DesignLibraryProvider>
      <BatchProvider>
        <MaterialIssueProvider>
          <WeaverPaymentsProvider>
            {children}
          </WeaverPaymentsProvider>
        </MaterialIssueProvider>
      </BatchProvider>
    </DesignLibraryProvider>
  );
}

export function WeaverLayout() {
  const { isAuthenticated, role } = useAuth();

  // Auth guard
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && role !== "weaver") return <Navigate to="/select-role" replace />;

  return (
    <WeaverContexts>
      <Outlet />
    </WeaverContexts>
  );
}
