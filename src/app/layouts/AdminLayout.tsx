import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import {
  POProvider, BulkOrderProvider, DesignLibraryProvider,
  BatchProvider, MaterialIssueProvider, FirmsProvider,
  WeaverPaymentsProvider, FinishingStaffProvider, FinishingProvider,
} from "../../contexts";

function AdminContexts({ children }: { children: React.ReactNode }) {
  return (
    <FinishingStaffProvider>
      <FinishingProvider>
        <POProvider>
          <BulkOrderProvider>
            <DesignLibraryProvider>
              <BatchProvider>
                <MaterialIssueProvider>
                  <FirmsProvider>
                    <WeaverPaymentsProvider>
                      {children}
                    </WeaverPaymentsProvider>
                  </FirmsProvider>
                </MaterialIssueProvider>
              </BatchProvider>
            </DesignLibraryProvider>
          </BulkOrderProvider>
        </POProvider>
      </FinishingProvider>
    </FinishingStaffProvider>
  );
}

export function AdminLayout() {
  const { isAuthenticated, role } = useAuth();

  // Auth guard
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && role !== "admin") return <Navigate to="/select-role" replace />;

  return (
    <AdminContexts>
      <Outlet />
    </AdminContexts>
  );
}
