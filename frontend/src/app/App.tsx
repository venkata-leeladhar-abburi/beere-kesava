import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { composeProviders } from "../lib/composeProviders";
import { AuthProvider } from "../contexts/AuthContext";
import { FinishingProvider, FinishingStaffProvider, QcProvider, SupplierProvider } from "../contexts";

// Shared across every portal (worker, admin, superadmin, accountant) so finishing
// assignments/returns/quotations raised in one show up identically in the others.
const SharedContexts = composeProviders([
  FinishingStaffProvider,
  FinishingProvider,
  QcProvider,
  SupplierProvider,
]);
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Toaster } from "../shared/ui/sonner";
import { SkipLink } from "../shared/ui/SkipLink";
import { ConfirmProvider } from "../shared/ui/overlay";
import { RouteLoadingFallback } from "./RouteLoadingFallback";

// Layouts (for Context scope and Auth guards) — each is its own portal bundle so
// a user only ever downloads the code for the role they're logged in as.
const AdminLayout      = lazy(() => import("./layouts/AdminLayout").then(m => ({ default: m.AdminLayout })));
const SuperadminLayout = lazy(() => import("./layouts/SuperadminLayout").then(m => ({ default: m.SuperadminLayout })));
const WorkerLayout     = lazy(() => import("./layouts/WorkerLayout").then(m => ({ default: m.WorkerLayout })));
const WeaverLayout     = lazy(() => import("./layouts/WeaverLayout").then(m => ({ default: m.WeaverLayout })));
const ShopLayout       = lazy(() => import("./layouts/ShopLayout").then(m => ({ default: m.ShopLayout })));
const AccountantLayout = lazy(() => import("./layouts/AccountantLayout").then(m => ({ default: m.AccountantLayout })));

// Auth / Role pages — needed on first paint, kept eager.
import { LoginPage }      from "./pages/LoginPage";
import { RoleSelectPage } from "./pages/RoleSelectPage";

// Dashboards / Portals wrappers
const AdminDashboardPage      = lazy(() => import("./pages/admin/DashboardPage").then(m => ({ default: m.AdminDashboardPage })));
const SuperadminDashboardPage = lazy(() => import("./pages/superadmin/DashboardPage").then(m => ({ default: m.SuperadminDashboardPage })));
const WorkerHomePage          = lazy(() => import("./pages/worker/HomePage").then(m => ({ default: m.WorkerHomePage })));
const WeaverHomePage          = lazy(() => import("./pages/weaver/HomePage").then(m => ({ default: m.WeaverHomePage })));
const ShopHomePage            = lazy(() => import("./pages/shop/HomePage").then(m => ({ default: m.ShopHomePage })));
const AccountantHomePage      = lazy(() => import("./pages/accountant/HomePage").then(m => ({ default: m.AccountantHomePage })));

// Other views
const MobileScanView = lazy(() => import("../features/scanning/components/MobileScanView").then(m => ({ default: m.MobileScanView })));

// @ts-ignore
import "../styles/mobile.css";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SharedContexts>
      <ConfirmProvider>
      <BrowserRouter>
        <SkipLink />
        <ErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public Auth Routes */}
            <Route path="/login"       element={<LoginPage />} />
            <Route path="/select-role" element={<RoleSelectPage />} />

            {/* Admin Portal */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path=":tab" element={<AdminDashboardPage />} />
            </Route>

            {/* Superadmin Portal */}
            <Route path="/superadmin" element={<SuperadminLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path=":tab" element={<SuperadminDashboardPage />} />
            </Route>

            {/* Worker Portal */}
            <Route path="/worker" element={<WorkerLayout />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path=":tab" element={<WorkerHomePage />} />
            </Route>

            {/* Weaver Portal */}
            <Route path="/weaver" element={<WeaverLayout />}>
              <Route index element={<Navigate to="batches" replace />} />
              <Route path=":tab" element={<WeaverHomePage />} />
            </Route>

            {/* Shop Staff Portal */}
            <Route path="/shop" element={<ShopLayout />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path=":tab" element={<ShopHomePage />} />
            </Route>

            {/* Accountant Portal */}
            <Route path="/accountant" element={<AccountantLayout />}>
              <Route index element={<Navigate to="payments" replace />} />
              <Route path=":tab" element={<AccountantHomePage />} />
            </Route>

            {/* Mobile Scanner */}
            <Route path="/scan" element={<MobileScanView />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      </ConfirmProvider>
      </SharedContexts>
      <Toaster position="bottom-right" richColors closeButton expand={false} visibleToasts={3} gap={8} duration={4000} />
    </AuthProvider>
    </QueryClientProvider>
  );
}
