import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import {
  BatchProvider,
  MaterialIssueProvider,
  FinishingProvider,
  FinishingStaffProvider,
  DesignLibraryProvider,
} from "../../contexts";

function WorkerContexts({ children }: { children: React.ReactNode }) {
  return (
    <DesignLibraryProvider>
      <BatchProvider>
        <MaterialIssueProvider>
          <FinishingProvider>
            <FinishingStaffProvider>
              {children}
            </FinishingStaffProvider>
          </FinishingProvider>
        </MaterialIssueProvider>
      </BatchProvider>
    </DesignLibraryProvider>
  );
}

export function WorkerLayout() {
  const { isAuthenticated, role } = useAuth();

  // Auth guard
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && role !== "worker") return <Navigate to="/select-role" replace />;

  return (
    <WorkerContexts>
      <Outlet />
    </WorkerContexts>
  );
}
