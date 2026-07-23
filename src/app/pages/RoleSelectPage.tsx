import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import { motion } from "motion/react";
import {
  LayoutDashboard, Shield, Package, Layers, ShoppingCart, ArrowRight, Calculator,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import type { Role } from "../../contexts/AuthContext";
import { useResponsive } from "../../hooks/useResponsive";
import { T, F, ROLE_COLORS } from "../../lib/tokens";
import logo from "../../imports/logo.png";

// ── Portal card definitions ────────────────────────────────────────────────────
const PORTALS: {
  role: Role; label: string; sub: string; desc: string;
  icon: React.ReactNode;
}[] = [
  {
    role:  "admin",
    label: "Admin Portal",
    sub:   "Day-to-day Operations",
    desc:  "Manage production, materials, weavers, dispatch, and shop operations.",
    icon:  <LayoutDashboard size={26} />,
  },
  {
    role:  "superadmin",
    label: "Superadmin Portal",
    sub:   "Full System Access",
    desc:  "Rates, approvals, audit logs, pricing, and complete oversight.",
    icon:  <Shield size={26} />,
  },
  {
    role:  "worker",
    label: "Worker Staff Portal",
    sub:   "Floor Operations",
    desc:  "GRN, weaver management, quality check, and warp requests.",
    icon:  <Package size={26} />,
  },
  {
    role:  "weaver",
    label: "Weaver Portal",
    sub:   "My Batches & Earnings",
    desc:  "View batches, color slips, raise warp requests, and track payments.",
    icon:  <Layers size={26} />,
  },
  {
    role:  "shop",
    label: "Shop Staff Portal",
    sub:   "Sales & Inventory",
    desc:  "Record sales, manage inventory, process returns, and view reports.",
    icon:  <ShoppingCart size={26} />,
  },
  {
    role:  "accountant",
    label: "Accountant Portal",
    sub:   "Finance & Payments",
    desc:  "Track payments, firms, rates & pricing, and financial reports.",
    icon:  <Calculator size={26} />,
  },
];

// Role → route
const ROLE_ROUTES: Record<Role, string> = {
  admin:      "/admin",
  superadmin: "/superadmin",
  worker:     "/worker",
  weaver:     "/weaver",
  shop:       "/shop",
  accountant: "/accountant",
};

// ── Portal Card ────────────────────────────────────────────────────────────────
function PortalCard({
  portal, isMobile, isHovered,
  onHover, onLeave, onClick,
}: {
  portal: typeof PORTALS[number];
  isMobile: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const colors = ROLE_COLORS[portal.role];

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={onHover}
      onHoverEnd={onLeave}
      whileTap={{ scale: 0.98 }}
      style={{
        background:  "#FFFFFF",
        borderTop:   `1.5px solid ${isHovered ? colors.accent : T.borderDef}`,
        borderRight: `1.5px solid ${isHovered ? colors.accent : T.borderDef}`,
        borderBottom:`1.5px solid ${isHovered ? colors.accent : T.borderDef}`,
        borderLeft:  `5px solid ${colors.accent}`,
        borderRadius: 18,
        padding:     isMobile ? "18px 18px" : "26px 26px",
        cursor:      "pointer",
        textAlign:   "left" as const,
        display:     "flex",
        flexDirection: isMobile ? "row" as const : "column" as const,
        alignItems:  isMobile ? "center" as const : undefined,
        gap:         isMobile ? 14 : 0,
        boxShadow:   isHovered
          ? "0 12px 40px rgba(0,0,0,0.10)"
          : "0 2px 14px rgba(44,24,16,0.06)",
        transition:  "all 0.18s ease",
        width:       "100%",
      }}
    >
      {/* Icon + arrow row */}
      <div style={{
        display: "flex",
        alignItems: isMobile ? "center" : "flex-start",
        justifyContent: isMobile ? undefined : "space-between",
        marginBottom: isMobile ? 0 : 18,
        flexShrink: 0,
      }}>
        <div style={{
          width: isMobile ? 46 : 54, height: isMobile ? 46 : 54,
          borderRadius: 14, background: colors.lightBg,
          border: `1px solid ${colors.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {React.cloneElement(portal.icon as React.ReactElement<any>, {
            color: colors.accent, size: isMobile ? 22 : 26,
          })}
        </div>
        {!isMobile && (
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: isHovered ? colors.lightBg : "rgba(0,0,0,0.03)",
            border: `1px solid ${isHovered ? colors.border : "rgba(0,0,0,0.06)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.18s",
          }}>
            <ArrowRight size={15} color={isHovered ? colors.accent : T.taupe} />
          </div>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: isMobile ? 1 : undefined, minWidth: 0 }}>
        <div style={{
          fontFamily: F.mono, fontSize: 10, fontWeight: 600,
          letterSpacing: "1.5px", color: colors.accent,
          textTransform: "uppercase" as const, marginBottom: 6,
        }}>
          {portal.sub}
        </div>
        <div style={{
          fontFamily: F.display, fontWeight: 700,
          fontSize: isMobile ? 17 : 22, color: T.luxuryBrown,
          lineHeight: 1.15, marginBottom: isMobile ? 0 : 10,
        }}>
          {portal.label}
        </div>
        {!isMobile && (
          <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.taupe, lineHeight: 1.65 }}>
            {portal.desc}
          </div>
        )}
      </div>

      {isMobile && <ArrowRight size={18} color={T.taupe} style={{ flexShrink: 0 }} />}
    </motion.button>
  );
}

// ── RoleSelectPage ─────────────────────────────────────────────────────────────
export function RoleSelectPage() {
  const { isAuthenticated, role: currentRole, selectRole, logout } = useAuth();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [hovered, setHovered] = useState<Role | null>(null);

  // Not logged in at all
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Already has a role selected → go directly to their portal
  if (currentRole) return <Navigate to={ROLE_ROUTES[currentRole]} replace />;

  const stacked = isMobile || isTablet;

  function handleRoleSelect(role: Role) {
    selectRole(role);
    navigate(ROLE_ROUTES[role]);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAFAF8",
      display: "flex",
      flexDirection: stacked ? "column" : "row",
      fontFamily: F.ui,
    }}>
      {/* Left dark brand panel */}
      <div style={{
        width: stacked ? "100%" : 340,
        minHeight: stacked ? undefined : "100vh",
        background: T.darkBg,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        padding: isMobile ? "28px 22px" : isTablet ? "36px 40px" : "56px 48px",
      }}>
        {/* Texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `repeating-linear-gradient(45deg, rgba(196,146,58,0.025) 0px, rgba(196,146,58,0.025) 1px, transparent 1px, transparent 28px)`,
          pointerEvents: "none",
        }} />
        {/* Decorative rings */}
        <div style={{ position: "absolute", right: -80, bottom: -80, width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(196,146,58,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: -40, bottom: -40, width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(196,146,58,0.04)", pointerEvents: "none" }} />

        {/* Brand */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: isMobile ? 22 : 52 }}>
            <div style={{
              width: isMobile ? 44 : 54, height: isMobile ? 44 : 54,
              borderRadius: 13, background: "#FFFFFF",
              border: "1px solid rgba(196,146,58,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden",
              boxShadow: "0 2px 10px rgba(0,0,0,0.10)",
            }}>
              <img src={logo} alt="Beere Kesava Logo" style={{ width: isMobile ? 30 : 38, height: isMobile ? 30 : 38, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: isMobile ? 16 : 18, color: "#F5EDD0", lineHeight: 1.1 }}>
                Beere Kesava
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: isMobile ? 12 : 14, color: "rgba(245,237,208,0.55)" }}>
                & Brothers Silks
              </div>
              {!isMobile && (
                <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 600, letterSpacing: "2.5px", color: T.antiqueGold, marginTop: 5, textTransform: "uppercase" }}>
                  Since 1999
                </div>
              )}
            </div>
          </div>

          {!isMobile && (
            <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", color: "rgba(245,237,208,0.40)", textTransform: "uppercase", marginBottom: 14 }}>
              Select Your
            </div>
          )}
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: isMobile ? 28 : 40, color: "#FFFDF9", lineHeight: 1.05, marginBottom: isMobile ? 4 : 6 }}>
            Access
          </div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: isMobile ? 28 : 40, fontStyle: "italic", color: T.antiqueGold, lineHeight: 1.05, marginBottom: isMobile ? 0 : 24 }}>
            Portal
          </div>
          {!isMobile && (
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,237,208,0.55)", lineHeight: 1.75, maxWidth: 240 }}>
              Choose the dashboard that matches your role. Each portal is tailored to your specific responsibilities.
            </div>
          )}
        </div>

        {/* Bottom badge — desktop only */}
        {!stacked && (
          <div style={{ position: "relative", zIndex: 1, marginTop: "auto", paddingTop: 32 }}>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 600, letterSpacing: "2px", color: "rgba(245,237,208,0.35)", textTransform: "uppercase", marginBottom: 10 }}>
                6 portals available
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 7px" }}>
                {PORTALS.map(p => (
                  <span key={p.role} style={{
                    fontFamily: F.ui, fontSize: 11, fontWeight: 500, color: T.antiqueGold,
                    background: "rgba(196,146,58,0.12)", border: "1px solid rgba(196,146,58,0.22)",
                    borderRadius: 999, padding: "4px 12px",
                  }}>
                    {p.sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: portal grid */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        padding: isMobile ? "24px 18px" : isTablet ? "32px 32px" : "52px 56px",
        overflowY: "auto",
        position: "relative",
      }}>
        {/* Top Right Logout Button */}
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          style={{
            position: "absolute",
            top: isMobile ? 18 : 28,
            right: isMobile ? 18 : 56,
            background: "none",
            border: `1px solid ${T.borderDef}`,
            borderRadius: 999,
            padding: "8px 16px",
            color: T.royalBurgundy,
            fontFamily: F.ui,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s",
            zIndex: 10,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(110,15,45,0.05)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none" }}
        >
          Log Out
        </button>

        {!isMobile && (
          <div style={{ marginBottom: isTablet ? 24 : 40 }}>
            <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", color: T.taupe, textTransform: "uppercase", marginBottom: 12 }}>
              Beere Kesava & Brothers Silks ERP
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: isTablet ? 30 : 42, color: T.luxuryBrown, lineHeight: 1.05, marginBottom: 8 }}>
              Select Your Portal
            </div>
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 16, color: T.taupe }}>
              Choose the dashboard that matches your role to get started.
            </div>
          </div>
        )}

        {/* Portal grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 14 : 20,
          flex: 1,
        }}>
          {PORTALS.map(portal => (
            <PortalCard
              key={portal.role}
              portal={portal}
              isMobile={isMobile}
              isHovered={hovered === portal.role}
              onHover={() => setHovered(portal.role)}
              onLeave={() => setHovered(null)}
              onClick={() => handleRoleSelect(portal.role)}
            />
          ))}
        </div>

        {!isMobile && (
          <div style={{ marginTop: 36, textAlign: "center" }}>
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, marginBottom: 2 }}>
              © 2026 Beere Kesava & Brothers Silks. All rights reserved.
            </div>
            <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 10, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase" }}>
              Since 1999 · Tradition. Trust. Timeless Quality.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
