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
 * hero, stats, and quick-action cards. The onBack prop is wired to
 * navigate to /select-role.
 */
import React from "react";
import { useNavigate } from "react-router";
import { BeereDashboard } from "../../components/BeereDashboard";
import { useAuth } from "../../../contexts/AuthContext";

export function AdminDashboardPage() {
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    selectRole(null);
    navigate("/select-role");
  };

  return <BeereDashboard onBack={handleBack} />;
}
