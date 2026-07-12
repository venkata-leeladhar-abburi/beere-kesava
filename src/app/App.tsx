import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "../contexts/AuthContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";

// Layouts (for Context scope and Auth guards)
import { AdminLayout }      from "./layouts/AdminLayout";
import { SuperadminLayout } from "./layouts/SuperadminLayout";
import { WorkerLayout }     from "./layouts/WorkerLayout";
import { WeaverLayout }     from "./layouts/WeaverLayout";
import { ShopLayout }       from "./layouts/ShopLayout";

// Auth / Role pages
import { LoginPage }      from "./pages/LoginPage";
import { RoleSelectPage } from "./pages/RoleSelectPage";

// Dashboards / Portals wrappers
import { AdminDashboardPage }      from "./pages/admin/DashboardPage";
import { SuperadminDashboardPage } from "./pages/superadmin/DashboardPage";
import { WorkerHomePage }          from "./pages/worker/HomePage";
import { WeaverHomePage }          from "./pages/weaver/HomePage";
import { ShopHomePage }            from "./pages/shop/HomePage";

// Other views
import { MobileScanView } from "./components/MobileScanView";

import "../styles/mobile.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public Auth Routes */}
            <Route path="/login"       element={<LoginPage />} />
            <Route path="/select-role" element={<RoleSelectPage />} />

            {/* Admin Portal */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="materials" replace />} />
              <Route path=":tab" element={<AdminDashboardPage />} />
            </Route>

            {/* Superadmin Portal */}
            <Route path="/superadmin" element={<SuperadminLayout />}>
              <Route index element={<Navigate to="materials" replace />} />
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

            {/* Mobile Scanner */}
            <Route path="/scan" element={<MobileScanView />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
