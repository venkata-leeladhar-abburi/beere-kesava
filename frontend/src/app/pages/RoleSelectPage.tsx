import React from "react";
import { useNavigate, Navigate } from "react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useResponsive } from "../../hooks/useResponsive";
import { T, F } from "../../lib/tokens";
import { ROLE_ROUTES } from "../roleRoutes";
// @ts-ignore
import logo from "../../assets/logo.webp";

/**
 * No longer a portal picker. A phone number's OTP-verified role decides its
 * one and only portal (see LoginPage.tsx) — there is no free choice, not
 * even for admin/superadmin. This page only ever appears for the edge case
 * where a session is authenticated but has no role the app recognizes
 * (backend returned something unexpected, or a legacy/corrupted local
 * session) — it explains that plainly and sends the user back to a fresh
 * login rather than letting them pick a portal to self-assign.
 */
export function RoleSelectPage() {
  const { isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // A resolved role never lands here — straight to its one portal.
  if (role) return <Navigate to={ROLE_ROUTES[role]} replace />;

  return (
    <div style={{
      minHeight: "100dvh", background: "#FAFAF8", display: "flex",
      alignItems: "center", justifyContent: "center", padding: isMobile ? 24 : 40,
      fontFamily: F.ui,
    }}>
      <div style={{
        maxWidth: 440, width: "100%", background: "#FFFFFF", borderRadius: 20,
        border: `1px solid ${T.borderDef}`, padding: isMobile ? "32px 24px" : "44px 40px",
        textAlign: "center" as const, boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
      }}>
        <img src={logo} alt="Beere Kesava Logo" style={{ width: 44, height: 44, objectFit: "contain", margin: "0 auto 20px" }} />
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "rgba(171,56,50,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
        }}>
          <ShieldAlert size={28} color="#AB3832" />
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: T.luxuryBrown, marginBottom: 10 }}>
          No Portal Assigned
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.65, marginBottom: 28 }}>
          This phone number isn't set up with access to any portal. Contact an administrator to get your account assigned a role, then log in again.
        </div>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          style={{
            width: "100%", height: 48, borderRadius: 999, border: "none",
            background: T.royalBurgundy, color: "#FFFFFF", fontFamily: F.ui,
            fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
