import React from "react";
import { useNavigate, Navigate } from "react-router";
import { ShieldAlert, ChevronRight, LayoutDashboard, Crown, Hammer, Scissors, Store, Calculator, type LucideIcon } from "lucide-react";
import { useAuth, type Role } from "../../contexts/AuthContext";
import { useResponsive } from "../../hooks/useResponsive";
import { T, F } from "../../lib/tokens";
import { ROLE_ROUTES } from "../roleRoutes";
import { roleLabel } from "../../shared/ui/portal/AdminStaffView";
import { useSwitchPortal } from "../../shared/ui/portal/PortalSwitcher";
import logo from "../../assets/logo.webp";

const ROLE_ICONS: Record<Role, LucideIcon> = {
  superadmin: Crown,
  admin: LayoutDashboard,
  worker: Hammer,
  weaver: Scissors,
  shop: Store,
  accountant: Calculator,
};

/**
 * Portal picker. A person assigned more than one portal (User.additionalRoles)
 * lands here after OTP login and chooses which to open; the choice is
 * re-verified server-side (POST /auth/switch-role). Only assigned portals are
 * offered — there is no self-assignment. A session with no recognizable role
 * at all gets the "No Portal Assigned" message instead.
 */
export function RoleSelectPage() {
  const { isAuthenticated, role, availableRoles, logout, user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { go, switching } = useSwitchPortal();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const hasChoice = availableRoles.length > 1;
  // A single resolved portal never needs a picker.
  if (role && !hasChoice) return <Navigate to={ROLE_ROUTES[role]} replace />;

  const card: React.CSSProperties = {
    maxWidth: hasChoice ? 520 : 440, width: "100%", background: "#FFFFFF", borderRadius: 20,
    border: `1px solid ${T.borderDef}`, padding: isMobile ? "32px 24px" : "44px 40px",
    textAlign: "center", boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "#FAFAF8", display: "flex",
      alignItems: "center", justifyContent: "center", padding: isMobile ? 24 : 40,
      fontFamily: F.ui,
    }}>
      <div style={card}>
        <img src={logo} alt="Beere Kesava Logo" style={{ width: 44, height: 44, objectFit: "contain", margin: "0 auto 20px" }} />
        {hasChoice ? (
          <>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: T.luxuryBrown, marginBottom: 8 }}>
              Choose a Portal
            </div>
            <div style={{ fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 24 }}>
              {user?.name ? `Welcome, ${user.name}. ` : ""}Your account has access to {availableRoles.length} portals. You can switch anytime from inside a portal.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
              {availableRoles.map(r => {
                const Icon = ROLE_ICONS[r];
                const busy = switching === r;
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={switching !== null}
                    onClick={() => void go(r)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, width: "100%",
                      padding: "14px 16px", borderRadius: 14, border: `1px solid ${T.borderDef}`,
                      background: busy ? "rgba(110,15,45,0.06)" : "#FFFFFF",
                      cursor: switching ? "wait" : "pointer", fontFamily: F.ui,
                      opacity: switching && !busy ? 0.6 : 1,
                    }}
                  >
                    <span style={{
                      width: 40, height: 40, borderRadius: 12, background: "rgba(110,15,45,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon size={20} color={T.royalBurgundy} />
                    </span>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: T.luxuryBrown }}>
                      {roleLabel(r)} Portal
                    </span>
                    <span style={{ fontSize: 12, color: T.taupe }}>{busy ? "Opening…" : ""}</span>
                    <ChevronRight size={18} color={T.taupe} />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => { logout(); navigate("/login"); }}
              style={{
                marginTop: 22, background: "none", border: "none", color: T.taupe,
                fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "rgba(171,56,50,0.10)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px",
            }}>
              <ShieldAlert size={28} color="#AB3832" />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: T.luxuryBrown, marginBottom: 10 }}>
              No Portal Assigned
            </div>
            <div style={{ fontSize: 14, color: T.taupe, lineHeight: 1.65, marginBottom: 28 }}>
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
          </>
        )}
      </div>
    </div>
  );
}
