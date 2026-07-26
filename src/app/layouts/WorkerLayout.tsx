import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import {
  BatchProvider,
  MaterialIssueProvider,
  DesignLibraryProvider,
} from "../../contexts";

// FinishingProvider / FinishingStaffProvider are mounted once in App.tsx so
// finishing data is shared across worker, admin, superadmin and accountant.
function WorkerContexts({ children }: { children: React.ReactNode }) {
  return (
    <DesignLibraryProvider>
      <BatchProvider>
        <MaterialIssueProvider>
          {children}
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
