import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { Home, ShoppingBag, Package, Users, BarChart2 } from "lucide-react";
import { SECTION_NAV_GLOBAL_STYLE } from "../../../shared/ui/SectionNavigator";
import { useResponsive } from "../../../hooks/useResponsive";
import { Button } from "../../../shared/ui/primitives";

// ─── Price Visibility Context ────────────────────────────────────────────────
// Shop staff (role="shop") cannot see monetary values.
// Admins and superadmins who access the shop portal CAN see prices.
import { DataAccessProvider } from "@/shared/ui/domain";
import { ShopPriceContext, F } from "./shop-staff/theme";
import { ShopHome } from "./shop-staff/ShopHome";
import { ShopInventory } from "./shop-staff/ShopInventory";
import { NewSaleFlow } from "./shop-staff/NewSaleFlow";
import { ProcessReturn } from "./shop-staff/ProcessReturn";
import { CustomerProfiles } from "./shop-staff/CustomerProfiles";
import { CustomerProfilePage } from "./shop-staff/CustomerProfilePage";
import { SalesReport } from "./shop-staff/SalesReport";
import { UserProfileModal } from "../../../shared/ui/UserProfileModal";
import { MobileHeader } from "./shop-staff/MobileHeader";
import { MobileTabBar } from "./shop-staff/MobileTabBar";
import { DesktopTopNav } from "./shop-staff/desktop/DesktopTopNav";
import { AdminViewingBanner } from "@/shared/ui/portal/AdminStaffView";
import { HomeSection } from "./shop-staff/desktop/HomeSection";
import { SaleSection } from "./shop-staff/desktop/SaleSection";
import { CustomersSection } from "./shop-staff/desktop/CustomersSection";
import { ReportsSection } from "./shop-staff/desktop/ReportsSection";
import { ReturnSection } from "./shop-staff/desktop/ReturnSection";
import { LowStockDialog } from "./shop-staff/desktop/LowStockDialog";
import { NotificationsSection } from "./shop-staff/desktop/NotificationsSection";

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
  // Reports are admin/superadmin only — real shop staff never see this tab.
  const canSeeReports = role === "admin" || role === "superadmin";

  const handleLogout = () => {
    logout();
    routerNavigate("/login");
  };

  let active: TabId = "home";
  if (pathname.includes("/sale")) active = "sale";
  else if (pathname.includes("/inventory")) active = "inventory";
  else if (pathname.includes("/customers")) active = "customers";
  else if (pathname.includes("/reports")) active = canSeeReports ? "reports" : "home";

  // /shop/customers/:id — one customer's full record, rendered as a page in
  // place of the old cramped modal so it is linkable and has room for detail.
  const customerDetailId = /^\/shop\/customers\/([^/]+)/.exec(pathname)?.[1] ?? null;

  const showReturn = pathname.includes("/return");
  const showNotifications = pathname.includes("/notifications");

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
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Dialog states
  const [showInvLowStockDialog, setShowInvLowStockDialog] = useState(false);
  const [invLowStockMsg, setInvLowStockMsg] = useState("");
  const [invLowStockPriority, setInvLowStockPriority] = useState<"urgent" | "normal">("urgent");
  const [invLowStockSent, setInvLowStockSent] = useState(false);

  const openCustomer = (id: string) => routerNavigate(`/shop/customers/${id}`);
  const closeCustomer = () => routerNavigate("/shop/customers");
  // Carries the customer through so the sale flow opens with them already
  // picked instead of dropping the operator back on the customer search.
  const recordSaleFor = (id: string) => routerNavigate("/shop/sale", { state: { customerId: id } });

  useEffect(() => {
    if (pathname.includes("/reports") && !canSeeReports) {
      routerNavigate("/shop/home");
    }
  }, [pathname, canSeeReports, routerNavigate]);

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "Home", icon: <Home size={20} /> },
    { id: "sale", label: "New Sale", icon: <ShoppingBag size={20} /> },
    { id: "inventory", label: "Inventory", icon: <Package size={20} /> },
    { id: "customers", label: "Customers", icon: <Users size={20} /> },
    ...(canSeeReports ? [{ id: "reports" as TabId, label: "Reports", icon: <BarChart2 size={20} /> }] : []),
  ];

  const PAGE_TITLES: Record<TabId, string> = {
    home: "Shop Home", sale: "New Sale", inventory: "Shop Inventory",
    customers: "Customers", reports: "Sales Report",
  };

  const renderPage = () => {
    if (showNotifications) return <NotificationsSection isTablet={false} compact />;
    if (showReturn) return <ProcessReturn onBack={() => setShowReturn(false)} />;
    switch (active) {
      case "home": return <ShopHome onNavigate={(t) => { if (t === "return") setShowReturn(true); else setActive(t as TabId); }} />;
      case "sale": return <NewSaleFlow />;
      // Shop stock only — the sarees an admin actually dispatched here. This
      // used to render the admin's whole Finished Goods table, which showed the
      // shop every saree in the factory, including ones still on the loom.
      case "inventory": return <ShopInventory />;
      case "customers":
        return customerDetailId
          ? <CustomerProfilePage customerId={customerDetailId} onBack={closeCustomer} onRecordSale={recordSaleFor} />
          : <CustomerProfiles onOpenCustomer={openCustomer} />;
      case "reports": return canSeeReports ? <SalesReport /> : null;
    }
  };

  // ── Desktop / Tablet Layout ──────────────────────────────────────────────
  if (!isMobile) {
    return (
      <DataAccessProvider scopes={{ cost: canSeePrices, sell: canSeePrices, margin: canSeePrices, payroll: canSeePrices, "customer-pii": true }}>
      <ShopPriceContext.Provider value={canSeePrices}>
      <div style={{ minHeight: "100dvh", background: "#F8F4F0", fontFamily: F.u }}>
        <style>{SECTION_NAV_GLOBAL_STYLE}</style>

        <DesktopTopNav
          isTablet={isTablet} TABS={TABS} active={active} showReturn={showReturn} showNotifications={showNotifications}
          setActive={setActive} setShowReturn={setShowReturn}
          showProfile={showProfile} setShowProfile={setShowProfile} setShowProfileModal={setShowProfileModal}
          onBack={onBack} handleLogout={handleLogout} selectRole={selectRole} routerNavigate={routerNavigate}
        />
        <AdminViewingBanner portalLabel="Shop Staff" />

        {/* ── Page Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={showNotifications ? "notifications" : showReturn ? "return" : customerDetailId ? `customer-${customerDetailId}` : active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

            {showNotifications && (
              <NotificationsSection bp={bp} isTablet={isTablet} />
            )}

            {!showNotifications && !showReturn && active === "home" && (
              <HomeSection bp={bp} isTablet={isTablet} canSeePrices={canSeePrices} setActive={setActive} setShowReturn={setShowReturn}
                invLowStockSent={invLowStockSent} setShowInvLowStockDialog={setShowInvLowStockDialog} />
            )}

            {!showNotifications && !showReturn && active === "sale" && (
              <SaleSection bp={bp} isTablet={isTablet} />
            )}

            {/* Shop stock only — see the mobile-layout "inventory" case above. */}
            {!showNotifications && !showReturn && active === "inventory" && (
              <ShopInventory />
            )}

            {!showNotifications && !showReturn && active === "customers" && (
              customerDetailId
                ? <CustomerProfilePage customerId={customerDetailId} onBack={closeCustomer} onRecordSale={recordSaleFor} />
                : <CustomersSection bp={bp} isTablet={isTablet} canSeePrices={canSeePrices} onOpenCustomer={openCustomer} />
            )}

            {!showNotifications && !showReturn && active === "reports" && canSeeReports && (
              <ReportsSection bp={bp} isTablet={isTablet} canSeePrices={canSeePrices} />
            )}

            {!showNotifications && showReturn && (
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


        <AnimatePresence>
          {showProfileModal && (
            <UserProfileModal onClose={() => setShowProfileModal(false)} />
          )}
        </AnimatePresence>

      </div>
      </ShopPriceContext.Provider>
      </DataAccessProvider>
    );
  }

  // ── Mobile / Tablet Layout ──────────────────────────────────────────────
  return (
    <DataAccessProvider scopes={{ cost: canSeePrices, sell: canSeePrices, margin: canSeePrices, payroll: canSeePrices, "customer-pii": true }}>
    <ShopPriceContext.Provider value={canSeePrices}>
    <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto", minHeight: "100dvh", background: "#FAFAFA", display: "flex", flexDirection: "column" as const, position: "relative" as const }}>
      <MobileHeader
        title={showNotifications ? "Notifications" : showReturn ? "Process Return" : customerDetailId ? "Customer Record" : PAGE_TITLES[active]}
        onBack={showNotifications ? () => routerNavigate("/shop/home") : showReturn ? () => setShowReturn(false) : customerDetailId ? closeCustomer : onBack}
        activeTab={active}
        setActive={(tab) => { setShowReturn(false); setActive(tab); }}
        setShowReturn={setShowReturn}
        showProfile={showProfile} setShowProfile={setShowProfile}
        setShowProfileModal={setShowProfileModal}
        handleLogout={handleLogout} selectRole={selectRole} routerNavigate={routerNavigate}
      />
      <AdminViewingBanner portalLabel="Shop Staff" />

      {/* Content — extra bottom padding on Home/Inventory so the floating "New Sale"
          button never covers the last row of a list */}
      <div id="main-content" style={{ flex: 1, overflowY: "auto" as const, paddingBottom: (showReturn || active === "home" || active === "inventory") ? "calc(140px + env(safe-area-inset-bottom, 0px))" : "calc(110px + env(safe-area-inset-bottom, 0px))" }}>
        <AnimatePresence mode="wait">
          <motion.div key={showNotifications ? "notifications" : showReturn ? "return" : customerDetailId ? `customer-${customerDetailId}` : active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating quick-action — New Sale (Home + Inventory only) */}
      <div style={{ position: "fixed" as const, bottom: "calc(76px + env(safe-area-inset-bottom, 0px))", left: 0, width: "100%", zIndex: 110, pointerEvents: "none" as const }}>
        <AnimatePresence>
          {!showNotifications && !showReturn && (active === "home" || active === "inventory") && (
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
      <MobileTabBar active={showNotifications ? "" : active} showReturn={showReturn} setActive={setActive} setShowReturn={setShowReturn} />

      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal onClose={() => setShowProfileModal(false)} />
        )}
      </AnimatePresence>
    </div>
    </ShopPriceContext.Provider>
    </DataAccessProvider>
  );
}
