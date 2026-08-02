import React from "react";
import { Outlet, Navigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import {
  POProvider, BulkOrderProvider, DesignLibraryProvider,
  BatchProvider, MaterialIssueProvider, FirmsProvider,
  WeaverPaymentsProvider, SalesProvider,
} from "../../contexts";

// FinishingProvider / FinishingStaffProvider are mounted once in App.tsx so
// finishing data is shared across worker, admin, superadmin and accountant.
function AccountantContexts({ children }: { children: React.ReactNode }) {
  return (
    <SalesProvider>
        <WeaverPaymentsProvider>
          <FirmsProvider>
            <POProvider>
              <BulkOrderProvider>
                <DesignLibraryProvider>
                  <BatchProvider>
                    <MaterialIssueProvider>
                      {children}
                    </MaterialIssueProvider>
                  </BatchProvider>
                </DesignLibraryProvider>
              </BulkOrderProvider>
            </POProvider>
          </FirmsProvider>
        </WeaverPaymentsProvider>
    </SalesProvider>
  );
}

export function AccountantLayout() {
  const { isAuthenticated, role } = useAuth();

  // Auth guard
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && role !== "accountant") return <Navigate to="/select-role" replace />;

  return (
    <AccountantContexts>
      <Outlet />
    </AccountantContexts>
  );
}
