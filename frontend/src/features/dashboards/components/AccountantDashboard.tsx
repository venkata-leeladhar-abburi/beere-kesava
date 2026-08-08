import React, { useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { IndianRupee, Building2, FileBarChart2, Tags, LogOut, UserRound, Users, UserRound as UserIcon, Truck, Store, Factory, Package } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useResponsive } from "../../../hooks/useResponsive";
import { PaymentsPage } from "../../payments/components/PaymentsPage";
import { DownloadAccessProvider } from "../../../shared/ui/DownloadAccess";
import { Button, IconButton } from "../../../shared/ui/primitives";

// Lazily loaded so the initial dashboard bundle doesn't pay for every tab's
// page — only the active tab's chunk is fetched, on first navigation to it.
// PaymentsPage stays a static import since it's the default landing tab.
const FirmsPage = lazy(() => import("../../firms/components/FirmsPage").then(m => ({ default: m.FirmsPage })));
const ReportsPage = lazy(() => import("../../reports/components/ReportsPage").then(m => ({ default: m.ReportsPage })));
const RatesPricingPage = lazy(() => import("../../pricing/components/RatesPricingPage").then(m => ({ default: m.RatesPricingPage })));
const WeaversPage = lazy(() => import("../../weavers/components/WeaversPage").then(m => ({ default: m.WeaversPage })));
const CustomersPage = lazy(() => import("../../customers/components/CustomersPage").then(m => ({ default: m.CustomersPage })));
const VendorsPage = lazy(() => import("../../vendors/components/VendorsPage").then(m => ({ default: m.VendorsPage })));
const SuppliersPage = lazy(() => import("../../suppliers/components/SuppliersPage").then(m => ({ default: m.SuppliersPage })));
const FactoryLoomPage = lazy(() => import("../../production/components/FactoryLoomPage").then(m => ({ default: m.FactoryLoomPage })));
const InventoryPage = lazy(() => import("../../inventory/components/InventoryPage").then(m => ({ default: m.InventoryPage })));

function TabLoadingFallback() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(139,26,46,0.15)", borderTopColor: "#6B1A2A", animation: "bk-spin 0.8s linear infinite" }} />
      <style>{"@keyframes bk-spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
import { UserProfileModal } from "../../../shared/ui/UserProfileModal";
import { imgBKLogo } from "../../../shared/constants/weaverImages";
import type { IconComponent } from "../../../lib/icon";
import { layout } from "../../../design-system/tokens";

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
const MAIN_NAV_H = layout.navHeightTop; // shell token — was a local literal (68), off from the shared 72

// ── Nav definition ──────────────────────────────────────────────────────────────
type NavItem = { key: string; label: string; slug: string; icon: IconComponent };

const NAV: NavItem[] = [
  { key: "Payments",  label: "Payments",        slug: "payments",  icon: IndianRupee },
  { key: "Firms",     label: "Firms",           slug: "firms",     icon: Building2 },
  { key: "Reports",   label: "Reports",         slug: "reports",   icon: FileBarChart2 },
  { key: "Rates",     label: "Rates & Pricing", slug: "rates",     icon: Tags },
  { key: "Weavers",   label: "Weavers",         slug: "weavers",   icon: Users },
  { key: "Customers", label: "Customers",       slug: "customers", icon: UserIcon },
  { key: "Vendors",   label: "Vendors",         slug: "vendors",   icon: Truck },
  { key: "Suppliers", label: "Suppliers",       slug: "suppliers", icon: Store },
  { key: "Looms",     label: "Factory Looms",   slug: "looms",     icon: Factory },
  { key: "Inventory", label: "Inventory",       slug: "inventory", icon: Package },
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
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 14, color: T.warmCream, letterSpacing: "0.5px", lineHeight: 1, textTransform: "uppercase" }}>
                Beere Kesava
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase" }}>
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
                <Button
                  key={item.key}
                  variant="tertiary"
                  onClick={() => set(item.slug)}
                  className={`!h-full ${compact ? "!px-3" : "!px-[18px]"} !shrink-0 !border-none !bg-transparent !flex-col !gap-1.5 !rounded-none hover:!bg-transparent`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Icon size={15} color={isActive ? T.warmCream : "rgba(245,232,208,0.55)"} />
                    <span style={{
                      fontFamily: F.ui, fontWeight: isActive ? 600 : 400, fontSize: 13,
                      color: isActive ? T.warmCream : "rgba(245,232,208,0.72)", whiteSpace: "nowrap",
                    }}>{item.label}</span>
                  </div>
                  <div style={{ height: 2, width: "100%", background: isActive ? T.antiqueGold : "transparent", borderRadius: 2 }} />
                </Button>
              );
            })}
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <IconButton
            icon={UserRound}
            label="Profile"
            title="Profile"
            onClick={onProfile}
            variant="ghost"
            shape="circle"
            className="border border-[rgba(200,155,71,0.30)] bg-white/6 text-[#F5E8D0] hover:bg-white/12 hover:text-[#F5E8D0]"
          />
          {!compact && (
            <Button
              onClick={onBack}
              title="Switch portal"
              variant="tertiary"
              className="!rounded-full !border !border-[rgba(200,155,71,0.30)] !bg-white/6 !text-[#F5E8D0] !gap-1.5 hover:!bg-white/12 hover:!text-[#F5E8D0]"
            >
              Switch Portal
            </Button>
          )}
          <IconButton
            icon={LogOut}
            label="Log out"
            title="Log out"
            onClick={onLogout}
            variant="ghost"
            shape="circle"
            className="border border-[rgba(200,155,71,0.30)] bg-white/6 text-[#F5E8D0] hover:bg-white/12 hover:text-[#F5E8D0]"
          />
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
    <div style={{ width: "100%", minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>
      <TopNav
        active={active}
        set={setTab}
        onBack={onBack}
        onLogout={handleLogout}
        onProfile={() => setShowProfileModal(true)}
      />
      {/* Accountants read everything but export nothing — every download and
          export control inside these pages is hidden by this provider. */}
      <DownloadAccessProvider allowed={false}>
        <Suspense fallback={<TabLoadingFallback />}>
        {active === "Payments" ? (
          <PaymentsPage />
        ) : active === "Firms" ? (
          <FirmsPage />
        ) : active === "Reports" ? (
          <ReportsPage />
        ) : active === "Rates" ? (
          <RatesPricingPage />
        ) : active === "Weavers" ? (
          <WeaversPage />
        ) : active === "Customers" ? (
          <CustomersPage />
        ) : active === "Vendors" ? (
          <VendorsPage />
        ) : active === "Suppliers" ? (
          <SuppliersPage />
        ) : active === "Looms" ? (
          <FactoryLoomPage />
        ) : active === "Inventory" ? (
          <InventoryPage canRaiseQuotation={false} />
        ) : (
          <PaymentsPage />
        )}
        </Suspense>
      </DownloadAccessProvider>

      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}
