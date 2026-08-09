import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Home, ShoppingBag, Package, Users, BarChart2 } from "lucide-react";
import { SECTION_NAV_GLOBAL_STYLE } from "../../../shared/ui/SectionNavigator";
import { useResponsive } from "../../../hooks/useResponsive";
import { Button } from "../../../shared/ui/primitives";
import { InventoryPage as AdminInventoryPage } from "../../inventory/components/InventoryPage";

// ─── Price Visibility Context ────────────────────────────────────────────────
// Shop staff (role="shop") cannot see monetary values.
// Admins and superadmins who access the shop portal CAN see prices.
import { ShopPriceContext, F, TEAL } from "./shop-staff/theme";
import { ShopHome } from "./shop-staff/ShopHome";
import { NewSaleFlow } from "./shop-staff/NewSaleFlow";
import { ProcessReturn } from "./shop-staff/ProcessReturn";
import { CustomerProfiles } from "./shop-staff/CustomerProfiles";
import { SalesReport } from "./shop-staff/SalesReport";
import { UserProfileModal } from "../../../shared/ui/UserProfileModal";
import { MobileHeader } from "./shop-staff/MobileHeader";
import { MobileTabBar } from "./shop-staff/MobileTabBar";
import { DesktopTopNav } from "./shop-staff/desktop/DesktopTopNav";
import { HomeSection } from "./shop-staff/desktop/HomeSection";
import { SaleSection } from "./shop-staff/desktop/SaleSection";
import { CustomersSection } from "./shop-staff/desktop/CustomersSection";
import type { ShopCustomer } from "./shop-staff/desktop/CustomersSection";
import { ReportsSection } from "./shop-staff/desktop/ReportsSection";
import { ReturnSection } from "./shop-staff/desktop/ReturnSection";
import { LowStockDialog } from "./shop-staff/desktop/LowStockDialog";
import { CustomerProfileDialog } from "./shop-staff/desktop/CustomerProfileDialog";
import { ExportReportDialog } from "./shop-staff/desktop/ExportReportDialog";

export { UserProfileModal };

type TabId = "home" | "sale" | "inventory" | "customers" | "reports";
type ShopStaffPortalProps = { onBack?: () => void };

export function ShopStaffPortal({ onBack }: ShopStaffPortalProps) {
  const { isMobile, w } = useResponsive();
  const bp: "tablet" | "desktop" = w >= 1280 ? "desktop" : "tablet";
  const isTablet = bp === "tablet";
  const { pathname } = useLocation();
  const routerNavigate = useNavigate();
  const { logout, selectRole, role, adminViewingAs } = useAuth();
  // Money is owner-only. A real shop-staff login never sees it.
  // The route guard forces role === "shop" inside this portal, so an owner
  // looking in from their dashboard is identified by `adminViewingAs`, which is
  // set when they enter from the Staff Portals menu — not by `role`.
  const canSeePrices = role === "admin" || role === "superadmin" || adminViewingAs !== null;

  const handleLogout = () => {
    logout();
    routerNavigate("/login");
  };

  let active: TabId = "home";
  if (pathname.includes("/sale")) active = "sale";
  else if (pathname.includes("/inventory")) active = "inventory";
  else if (pathname.includes("/customers")) active = "customers";
  else if (pathname.includes("/reports")) active = "reports";

  const showReturn = pathname.includes("/return");

  const setActive = (tab: TabId) => {
    const routeMap: Record<TabId, string> = {
      home: "/shop/home",
      sale: "/shop/sale",
      inventory: "/shop/inventory",
      customers: "/shop/customers",
      reports: "/shop/reports",
    };
    const path = routeMap[tab] || "/shop/home";
    routerNavigate(path);
  };
  const setShowReturn = (val: boolean) => {
    if (val) {
      routerNavigate("/shop/return");
    } else {
      routerNavigate("/shop/home");
    }
  };
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Dialog states
  const [showInvLowStockDialog, setShowInvLowStockDialog] = useState(false);
  const [invLowStockMsg, setInvLowStockMsg] = useState("");
  const [invLowStockPriority, setInvLowStockPriority] = useState<"urgent" | "normal">("urgent");
  const [invLowStockSent, setInvLowStockSent] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<ShopCustomer | null>(null);

  const [exportDialog, setExportDialog] = useState<{ label: string } | null>(null);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "excel">("pdf");
  const [exportDone, setExportDone] = useState(false);

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <Home size={20} /> },
    { id: "sale", label: "New Sale", icon: <ShoppingBag size={20} /> },
    { id: "inventory", label: "Inventory", icon: <Package size={20} /> },
    { id: "customers", label: "Customers", icon: <Users size={20} /> },
    { id: "reports", label: "Reports", icon: <BarChart2 size={20} /> },
  ];

  const PAGE_TITLES: Record<TabId, string> = {
    home: "Shop Home", sale: "New Sale", inventory: "Shop Inventory",
    customers: "Customers", reports: "Sales Report",
  };

  const renderPage = () => {
    if (showReturn) return <ProcessReturn onBack={() => setShowReturn(false)} />;
    switch (active) {
      case "home": return <ShopHome onNavigate={(t) => { if (t === "return") setShowReturn(true); else setActive(t as TabId); }} />;
      case "sale": return <NewSaleFlow />;
      case "inventory": return (
        // Same Inventory page the admin portal uses — quotations and wholesale
        // dispatch (both inherently about pricing) stay off the shop floor, and
        // every money figure follows the same canSeePrices rule as the rest of
        // this portal, so an admin/superadmin previewing the shop portal still
        // sees real figures while genuine shop staff never do.
        <AdminInventoryPage canRaiseQuotation={false} canDispatchWholesale={false} canDispatchShop={false} canSeeMoney={canSeePrices} showQuickDispatch={false} showCategorySplit={false} showQuotationsSection={false} showDispatchHistory={false} />
      );
      case "customers": return <CustomerProfiles />;
      case "reports": return <SalesReport />;
    }
  };

  // ── Desktop / Tablet Layout ──────────────────────────────────────────────
  if (!isMobile) {
    return (
      <ShopPriceContext.Provider value={canSeePrices}>
      <div style={{ minHeight: "100dvh", background: "#F8F4F0", fontFamily: F.u }}>
        <style>{SECTION_NAV_GLOBAL_STYLE}</style>

        <DesktopTopNav
          isTablet={isTablet} TABS={TABS} active={active} showReturn={showReturn}
          setActive={setActive} setShowReturn={setShowReturn}
          search={search} setSearch={setSearch}
          showProfile={showProfile} setShowProfile={setShowProfile} setShowProfileModal={setShowProfileModal}
          onBack={onBack} handleLogout={handleLogout} selectRole={selectRole} routerNavigate={routerNavigate}
        />

        {/* ── Page Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={showReturn ? "return" : active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

            {!showReturn && active === "home" && (
              <HomeSection bp={bp} isTablet={isTablet} canSeePrices={canSeePrices} setActive={setActive} setShowReturn={setShowReturn}
                invLowStockSent={invLowStockSent} setShowInvLowStockDialog={setShowInvLowStockDialog} />
            )}

            {!showReturn && active === "sale" && (
              <SaleSection bp={bp} isTablet={isTablet} />
            )}

            {/* Same InventoryPage component the admin portal uses — see the
                mobile-layout "inventory" case above for the reasoning on the
                props (no quotations/wholesale dispatch on the shop floor, money
                follows the same canSeePrices rule as the rest of this portal). */}
            {!showReturn && active === "inventory" && (
              <AdminInventoryPage canRaiseQuotation={false} canDispatchWholesale={false} canDispatchShop={false} canSeeMoney={canSeePrices} showQuickDispatch={false} showCategorySplit={false} showQuotationsSection={false} showDispatchHistory={false} />
            )}

            {!showReturn && active === "customers" && (
              <CustomersSection bp={bp} isTablet={isTablet} canSeePrices={canSeePrices} setSelectedCustomer={setSelectedCustomer} />
            )}

            {!showReturn && active === "reports" && (
              <ReportsSection bp={bp} isTablet={isTablet} canSeePrices={canSeePrices} setExportDone={setExportDone} setExportDialog={setExportDialog} />
            )}

            {showReturn && (
              <ReturnSection bp={bp} isTablet={isTablet} canSeePrices={canSeePrices} setShowReturn={setShowReturn} />
            )}

          </motion.div>
        </AnimatePresence>

        <LowStockDialog
          open={showInvLowStockDialog}
          onClose={() => setShowInvLowStockDialog(false)}
          priority={invLowStockPriority}
          setPriority={setInvLowStockPriority}
          message={invLowStockMsg}
          setMessage={setInvLowStockMsg}
          onSend={() => { setShowInvLowStockDialog(false); setInvLowStockSent(true); }}
        />

        <CustomerProfileDialog
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          canSeePrices={canSeePrices}
          isTablet={isTablet}
        />

        <ExportReportDialog
          dialog={exportDialog}
          onClose={() => { setExportDialog(null); setExportDone(false); }}
          format={exportFormat}
          setFormat={setExportFormat}
          done={exportDone}
          setDone={setExportDone}
        />

      </div>
      </ShopPriceContext.Provider>
    );
  }

  // ── Mobile / Tablet Layout ──────────────────────────────────────────────
  return (
    <ShopPriceContext.Provider value={canSeePrices}>
    <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto", minHeight: "100dvh", background: "#FAFAFA", display: "flex", flexDirection: "column" as const, position: "relative" as const }}>
      <style>{SECTION_NAV_GLOBAL_STYLE}</style>
      {!showReturn && (
        <MobileHeader
          title={PAGE_TITLES[active]}
          onBack={onBack}
          showProfile={showProfile} setShowProfile={setShowProfile}
          setShowProfileModal={setShowProfileModal}
          handleLogout={handleLogout} selectRole={selectRole} routerNavigate={routerNavigate}
        />
      )}

      {/* Content — extra bottom padding on Home/Inventory so the floating "New Sale"
          button never covers the last row of a list */}
      <div style={{ flex: 1, overflowY: "auto" as const, paddingBottom: showReturn ? 0 : (active === "home" || active === "inventory") ? "calc(140px + env(safe-area-inset-bottom, 0px))" : "calc(66px + env(safe-area-inset-bottom, 0px))" }}>
        <AnimatePresence mode="wait">
          <motion.div key={showReturn ? "return" : active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating quick-action — New Sale (Home + Inventory only) */}
      <div style={{ position: "fixed" as const, bottom: "calc(76px + env(safe-area-inset-bottom, 0px))", left: 0, width: "100%", zIndex: 110, pointerEvents: "none" as const }}>
        <AnimatePresence>
          {!showReturn && (active === "home" || active === "inventory") && (
            <motion.div
              key={active}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              style={{
                position: "absolute" as const, right: 16, bottom: 0, pointerEvents: "auto" as const,
              }}
            >
              <Button
                variant="primary"
                size="lg"
                iconLeft={ShoppingBag}
                onClick={() => setActive("sale")}
                className="h-14 rounded-full px-[18px] shadow-[0_4px_16px_rgba(15,118,110,0.30)] bg-[#0F766E] hover:bg-[#0F766E]"
              >
                <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" as const }}>New Sale</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar — full-width */}
      {!showReturn && <MobileTabBar TABS={TABS} active={active} setActive={setActive} />}

      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal onClose={() => setShowProfileModal(false)} />
        )}
      </AnimatePresence>
    </div>
    </ShopPriceContext.Provider>
  );
}
