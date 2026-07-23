import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { IndianRupee, Building2, FileBarChart2, Tags, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useResponsive } from "./useResponsive";
import { PaymentsPage } from "./PaymentsPage";
import { FirmsPage } from "./FirmsPage";
import { ReportsPage } from "./ReportsPage";
import { RatesPricingPage } from "./RatesPricingPage";
import { UserProfileModal } from "./BeereDashboard";
import { imgBKLogo } from "../constants/weaverImages";

// ── Design tokens (aligned with the rest of the app) ────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  darkBurgundy:  "#3D0E1A",
  royalBurgundy: "#6E0F2D",
  antiqueGold:   "#C89B47",
  warmCream:     "#F5E8D0",
  luxuryBrown:   "#3B2314",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const MAIN_NAV_H = 68;

// ── Nav definition ──────────────────────────────────────────────────────────────
type NavItem = { key: string; label: string; slug: string; icon: React.ComponentType<{ size?: number; color?: string }> };

const NAV: NavItem[] = [
  { key: "Payments", label: "Payments",        slug: "payments", icon: IndianRupee },
  { key: "Firms",    label: "Firms",           slug: "firms",    icon: Building2 },
  { key: "Reports",  label: "Reports",         slug: "reports",  icon: FileBarChart2 },
  { key: "Rates",    label: "Rates & Pricing", slug: "rates",    icon: Tags },
];

const SLUG_TO_KEY: Record<string, string> = NAV.reduce((acc, n) => { acc[n.slug] = n.key; return acc; }, {} as Record<string, string>);
const KEY_TO_SLUG: Record<string, string> = NAV.reduce((acc, n) => { acc[n.key] = n.slug; return acc; }, {} as Record<string, string>);

// ── Top navigation bar ──────────────────────────────────────────────────────────
function TopNav({ active, set, onBack, onLogout, onProfile }: {
  active: string; set: (slug: string) => void; onBack?: () => void; onLogout?: () => void; onProfile?: () => void;
}) {
  const { w } = useResponsive();
  const compact = w < 900;

  return (
    <motion.div
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "sticky", top: 0, zIndex: 100 }}
    >
      <nav
        style={{
          minHeight: MAIN_NAV_H,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: compact ? "0 16px" : "0 48px", gap: 12, flexWrap: "nowrap",
          background: T.darkBurgundy,
          borderBottom: "1px solid rgba(200,155,71,0.14)",
          boxShadow: "0 4px 40px rgba(0,0,0,0.28)",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 14, flexShrink: 0 }}>
          <div style={{ width: compact ? 40 : 48, height: compact ? 40 : 48, borderRadius: 13, overflow: "hidden", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.30)", border: "1.5px solid rgba(200,155,71,0.30)" }}>
            <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {!compact && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 15, color: T.warmCream, letterSpacing: "0.5px", lineHeight: 1, textTransform: "uppercase" }}>
                Beere Kesava
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase" }}>
                Accountant Portal
              </div>
            </div>
          )}
        </div>

        {/* Nav tabs */}
        <div style={{ display: "flex", height: MAIN_NAV_H, alignItems: "stretch", overflowX: "auto", scrollbarWidth: "none", minWidth: 0 } as React.CSSProperties}>
          <style>{`.acct-nav-tabs::-webkit-scrollbar{display:none;}`}</style>
          <div className="acct-nav-tabs" style={{ display: "flex", height: "100%" }}>
            {NAV.map(item => {
              const isActive = active === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => set(item.slug)}
                  style={{
                    height: "100%", padding: compact ? "0 12px" : "0 18px", flexShrink: 0,
                    border: "none", background: "transparent", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Icon size={15} color={isActive ? T.warmCream : "rgba(245,232,208,0.55)"} />
                    <span style={{
                      fontFamily: F.ui, fontWeight: isActive ? 600 : 400, fontSize: 13.5,
                      color: isActive ? T.warmCream : "rgba(245,232,208,0.72)", whiteSpace: "nowrap",
                    }}>{item.label}</span>
                  </div>
                  <div style={{ height: 2, width: "100%", background: isActive ? T.antiqueGold : "transparent", borderRadius: 2 }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button onClick={onProfile} title="Profile"
            style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.30)", background: "rgba(255,255,255,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserRound size={17} color={T.warmCream} />
          </button>
          <button onClick={onBack} title="Switch portal"
            style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid rgba(200,155,71,0.30)", background: "rgba(255,255,255,0.06)", cursor: "pointer", color: T.warmCream, fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, display: compact ? "none" : "flex", alignItems: "center", gap: 6 }}>
            Switch Portal
          </button>
          <button onClick={onLogout} title="Log out"
            style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.30)", background: "rgba(255,255,255,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogOut size={17} color={T.warmCream} />
          </button>
        </div>
      </nav>
    </motion.div>
  );
}

// ── Accountant Dashboard ────────────────────────────────────────────────────────
export function AccountantDashboard({ onBack }: { onBack?: () => void } = {}) {
  const { tab } = useParams();
  const routerNavigate = useNavigate();
  const { logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = React.useState(false);

  const active = SLUG_TO_KEY[tab ?? ""] ?? "Payments";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [active]);

  const handleLogout = () => { logout(); routerNavigate("/login"); };
  const setTab = (slug: string) => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    routerNavigate(`/accountant/${slug}`);
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>
      <TopNav
        active={active}
        set={setTab}
        onBack={onBack}
        onLogout={handleLogout}
        onProfile={() => setShowProfileModal(true)}
      />
      {active === "Payments" ? (
        <PaymentsPage />
      ) : active === "Firms" ? (
        <FirmsPage />
      ) : active === "Reports" ? (
        <ReportsPage />
      ) : active === "Rates" ? (
        <RatesPricingPage />
      ) : (
        <PaymentsPage />
      )}

      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} role="admin" />
      )}
    </div>
  );
}
