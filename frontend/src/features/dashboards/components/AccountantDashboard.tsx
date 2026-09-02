import React, { useEffect, useState, Suspense } from "react";
import { lazyWithRetry as lazy } from "@/app/lazyWithRetry";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { IndianRupee, Building2, LogOut, UserRound, Users, UserRound as UserIcon, Truck, Store, Factory, Package, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { ErrorBoundary } from "../../../components/ErrorBoundary";
import { useResponsive } from "../../../hooks/useResponsive";
import { PaymentsPage } from "@/features/payments";
import { DownloadAccessProvider } from "../../../shared/ui/DownloadAccess";
import { Button, IconButton } from "../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Drawer } from "../../../shared/ui/overlay";

// Lazily loaded so the initial dashboard bundle doesn't pay for every tab's
// page — only the active tab's chunk is fetched, on first navigation to it.
// PaymentsPage stays a static import since it's the default landing tab.
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const FirmsPage = lazy(() => import("../../firms/components/FirmsPage").then(m => ({ default: m.FirmsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const WeaversPage = lazy(() => import("../../weavers/components/WeaversPage").then(m => ({ default: m.WeaversPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const CustomersPage = lazy(() => import("../../customers/components/CustomersPage").then(m => ({ default: m.CustomersPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const VendorsPage = lazy(() => import("../../vendors/components/VendorsPage").then(m => ({ default: m.VendorsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const SuppliersPage = lazy(() => import("../../suppliers/components/SuppliersPage").then(m => ({ default: m.SuppliersPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const FactoryLoomPage = lazy(() => import("../../production/components/FactoryLoomPage").then(m => ({ default: m.FactoryLoomPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
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
import { toInitials } from "@/shared/lib/initials";

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
  { key: "Weavers",   label: "Weavers",         slug: "weavers",   icon: Users },
  { key: "Customers", label: "Customers",       slug: "customers", icon: UserIcon },
  { key: "Vendors",   label: "Vendors",         slug: "vendors",   icon: Truck },
  { key: "Suppliers", label: "Suppliers",       slug: "suppliers", icon: Store },
  { key: "Looms",     label: "Factory Looms",   slug: "looms",     icon: Factory },
  { key: "Inventory", label: "Inventory",       slug: "inventory", icon: Package },
];

const SLUG_TO_KEY: Record<string, string> = NAV.reduce((acc, n) => { acc[n.slug] = n.key; return acc; }, {} as Record<string, string>);

// ── Top navigation bar ──────────────────────────────────────────────────────────
function TopNav({ active, set, onLogout, onProfile }: {
  active: string; set: (slug: string) => void; onBack?: () => void; onLogout?: () => void; onProfile?: () => void;
}) {
  const { user } = useAuth();
  const { w } = useResponsive();
  const compact = w < 900;
  const [showProfile, setShowProfile] = useState(false);

  const userName = user?.name || "Accountant";
  const initials = userName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "AC";

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

        {/* Right actions — Gold avatar + profile dropdown matching Admin & Superadmin */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <DropdownMenu open={showProfile} onOpenChange={setShowProfile}>
            <DropdownMenuTrigger asChild>
              <motion.div
                initial={{ backgroundColor: "rgba(245,232,208,0.04)" }}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.10)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                  padding: "6px 12px 6px 6px", borderRadius: 12,
                  border: `1px solid ${showProfile ? T.antiqueGold : "rgba(245,232,208,0.14)"}`,
                  backgroundColor: showProfile ? "rgba(245,232,208,0.10)" : "rgba(245,232,208,0.04)",
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "#C4923A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(196,146,58,0.35)" }}>
                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>{toInitials(initials)}</span>
                </div>
                {!compact && <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: T.warmCream, letterSpacing: "0.1px" }}>{userName}</span>}
                <ChevronDown size={13} color="rgba(245,232,208,0.75)" style={{ transform: showProfile ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!min-w-[240px] !p-0 !rounded-[14px] !overflow-hidden" style={{ background: "#FFFDF9", border: "1px solid rgba(110,15,45,0.14)", zIndex: "var(--z-tooltip)" }}>
              <div style={{ padding: "16px 18px", background: "rgba(196,146,58,0.06)", borderBottom: "1px solid rgba(110,15,45,0.10)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#C4923A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(196,146,58,0.35)" }}>
                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: "#FFF" }}>{toInitials(initials)}</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{userName}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: "#7A6B63", marginTop: 2 }}>Accountant · Finance &amp; Ledger</div>
                </div>
              </div>
              <div style={{ padding: "6px 0" }}>
                {onProfile && (
                  <DropdownMenuItem onClick={() => { setShowProfile(false); onProfile(); }} className="!h-auto !py-[11px] !px-[18px] !text-[#3B2314]">
                    <UserRound size={15} color="#7A6B63" /> View Profile
                  </DropdownMenuItem>
                )}
                <div style={{ height: 1, background: "rgba(110,15,45,0.08)", margin: "4px 0" }} />
                {onLogout && (
                  <DropdownMenuItem onClick={() => { setShowProfile(false); onLogout(); }} className="!h-auto !py-[11px] !px-[18px] !text-[#C0392B] hover:!text-[#C0392B] focus:!text-[#C0392B]">
                    <LogOut size={15} color="#C0392B" /> Logout
                  </DropdownMenuItem>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </motion.div>
  );
}

// ── Mobile Menu Drawer & Mobile Top Nav (matching Superadmin) ───────────────────
export function AcctMobileMenuDrawer({ open, onClose, active, setTab }: {
  open: boolean; onClose: () => void; active: string; setTab: (v: string) => void;
}) {
  const { user } = useAuth();
  const userName = user?.name || "Accountant";

  return (
    <Drawer open={open} onOpenChange={next => { if (!next) onClose(); }} side="left" size="sm">
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", background: T.darkBurgundy }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `2px solid ${T.antiqueGold}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${T.darkBurgundy} 0%, #6E0F2D 100%)`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.40)", flexShrink: 0 }}>
              <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <Dialog.Title asChild>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.warmCream, lineHeight: 1.1 }}>Beere Kesava</div>
              </Dialog.Title>
              <Dialog.Description className="sr-only">Accountant portal navigation menu</Dialog.Description>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 11, color: "rgba(231,201,131,0.85)", letterSpacing: "2px", textTransform: "uppercase" }}>ACCOUNTANT</div>
            </div>
          </div>
          <Dialog.Close asChild>
            <IconButton
              icon={X}
              label="Close menu"
              onClick={onClose}
              variant="ghost"
              className="!size-8 !rounded-[9px] border border-[rgba(245,232,208,0.20)] bg-[rgba(245,232,208,0.10)] text-[rgba(245,232,208,0.85)] hover:bg-[rgba(245,232,208,0.16)]"
            />
          </Dialog.Close>
        </div>

        {/* Menu Navigation Items */}
        <div style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {NAV.map(item => {
            const isActive = active === item.key;
            const ItemIcon = item.icon;
            return (
              <Button
                key={item.key}
                variant="tertiary"
                fullWidth
                onClick={() => {
                  setTab(item.slug);
                  onClose();
                }}
                className={`justify-between gap-3 rounded-[12px] border-none mb-1.5 px-3.5 py-3 text-left transition-all ${
                  isActive
                    ? "bg-[linear-gradient(135deg,rgba(200,155,71,0.20)_0%,rgba(110,15,45,0.25)_100%)] text-white font-semibold border border-[rgba(200,155,71,0.30)]"
                    : "bg-transparent text-[rgba(255,255,255,0.75)] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: F.ui, fontSize: 14 }}>
                  <ItemIcon size={18} color={isActive ? T.antiqueGold : "rgba(255,255,255,0.65)"} />
                  {item.label}
                </span>
                {isActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.antiqueGold }} />}
              </Button>
            );
          })}
        </div>

        {/* Footer Identity */}
        <div style={{ padding: "16px 20px 28px", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#C4923A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(196,146,58,0.35)" }}>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>AC</span>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.warmCream }}>{userName}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: "rgba(245,232,208,0.60)" }}>Accountant Portal</div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export function AcctMobileTopNav({ onMenuOpen, onProfile, onLogout }: {
  onMenuOpen: () => void; onProfile?: () => void; onLogout?: () => void;
}) {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const userName = user?.name || "Accountant";
  const initials = userName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "AC";

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "rgba(255,253,249,0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: `2px solid ${T.antiqueGold}`,
        boxShadow: "0 2px 20px rgba(74,6,27,0.05)",
      }}
    >
      <IconButton
        icon={Menu}
        label="Open menu"
        onClick={onMenuOpen}
        variant="ghost"
        className="!size-9 !rounded-[10px] border border-[rgba(110,15,45,0.10)] bg-transparent hover:bg-[rgba(0,0,0,0.04)]"
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, overflow: "hidden", flexShrink: 0, border: `1px solid rgba(200,155,71,0.30)` }}>
          <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.1 }}>Beere Kesava</div>
          <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 11, color: "#7A6B63" }}>Accountant Portal</div>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <div style={{ borderRadius: 10, border: `1px solid ${showProfile ? T.antiqueGold : "rgba(200,155,71,0.40)"}`, boxShadow: "0 3px 10px rgba(196,146,58,0.35)", display: "inline-block" }}>
          <Button
            onClick={() => setShowProfile(p => !p)}
            variant="tertiary"
            className="!size-9 !rounded-[10px] !p-0 !border-none !bg-[#C4923A] hover:!bg-[#C4923A]"
          >
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>{toInitials(initials)}</span>
          </Button>
        </div>
        {showProfile && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: "var(--z-tooltip)", background: "#FFFDF9", borderRadius: 14, border: `1px solid rgba(110,15,45,0.14)`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 210, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", background: "rgba(196,146,58,0.06)", borderBottom: "1px solid rgba(110,15,45,0.10)" }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{userName}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: "#7A6B63", marginTop: 2 }}>Accountant · Finance &amp; Ledger</div>
            </div>
            <div style={{ padding: "6px 0" }}>
              <Button onClick={() => { setShowProfile(false); onProfile?.(); }} variant="tertiary" fullWidth
                className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#3B2314]">
                <UserRound size={14} color="#7A6B63" /> View Profile
              </Button>
              <div style={{ height: 1, background: "rgba(110,15,45,0.08)", margin: "4px 0" }} />
              <Button onClick={() => { setShowProfile(false); onLogout?.(); }} variant="tertiary" fullWidth
                className="!justify-start !gap-[9px] !rounded-none !border-none !bg-transparent !py-2.5 !px-4 !text-[13px] !font-normal !text-[#C0392B] hover:!text-[#C0392B]">
                <LogOut size={14} color="#C0392B" /> Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  );
}

// ── Accountant Dashboard ────────────────────────────────────────────────────────
export function AccountantDashboard({ onBack }: { onBack?: () => void } = {}) {
  const { tab } = useParams();
  const routerNavigate = useNavigate();
  const { logout } = useAuth();
  const { isMobile } = useResponsive();
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

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
      {isMobile ? (
        <>
          <AcctMobileMenuDrawer
            open={showMobileDrawer}
            onClose={() => setShowMobileDrawer(false)}
            active={active}
            setTab={setTab}
          />
          <AcctMobileTopNav
            onMenuOpen={() => setShowMobileDrawer(true)}
            onLogout={handleLogout}
            onProfile={() => setShowProfileModal(true)}
          />
        </>
      ) : (
        <TopNav
          active={active}
          set={setTab}
          onBack={onBack}
          onLogout={handleLogout}
          onProfile={() => setShowProfileModal(true)}
        />
      )}
      {/* Accountants read everything but export nothing — every download and
          export control inside these pages is hidden by this provider. */}
      <DownloadAccessProvider allowed={false}>
        <ErrorBoundary variant="inline" resetKeys={[active]}>
        <Suspense fallback={<TabLoadingFallback />}>
        {active === "Payments" ? (
          <PaymentsPage />
        ) : active === "Firms" ? (
          <FirmsPage />
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
        </ErrorBoundary>
      </DownloadAccessProvider>

      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}
