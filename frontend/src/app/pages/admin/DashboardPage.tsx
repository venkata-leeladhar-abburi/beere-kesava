/**
 * Admin Dashboard Page — /admin
 *
 * This is a thin wrapper that renders the existing BeereDashboard content.
 * The old BeereDashboard.tsx managed its own navigation internally (setState).
 * In the new architecture, navigation is handled by react-router, so we
 * render just the "home" view here. The page-specific sub-pages are
 * now separate routes under /admin/*.
 *
 * Note: BeereDashboard.tsx still contains the full dashboard logic including
 * hero, stats, and quick-action cards. Logging out and — for anyone assigned
 * more than one portal — switching portals both live in its own profile menu.
 */
import React from "react";
import { BeereDashboard } from "../../../features/dashboards/components/BeereDashboard";

export function AdminDashboardPage() {
  return <BeereDashboard />;
}
