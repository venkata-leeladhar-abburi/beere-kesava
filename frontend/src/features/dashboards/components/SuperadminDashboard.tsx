import React, { useState, Suspense, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useIsMobile } from "../../../hooks/useResponsive";
import {
  SectionNavigator, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE, MOBILE_NAV_H,
} from "../../../shared/ui/SectionNavigator";

import { T, F, EASE } from "./superadmin-dashboard/theme";
import { TabLoadingFallback } from "./superadmin-dashboard/atoms";
import { SATopNav } from "./superadmin-dashboard/SATopNav";
import { SAMobileMenuDrawer, SAMobileTopNav } from "./superadmin-dashboard/SAMobileNav";
import { SAOverviewPage } from "./superadmin-dashboard/SAOverviewPage";
import { UserProfileModal } from "./superadmin-dashboard/UserProfileModal";
import {
  RatesPricingPage, DesignLibraryPage, BatchCreationPage, ApprovalsPage, AuditLogPage,
  LabelSettingsPage, ExternalPurchasesPage, AddUserPage, IssueMaterialPage, MaterialsPage,
  WeaversPage, ProductionPage, PaymentsPage, ReportsPage, CustomersPage, VendorsPage,
  SuppliersPage, FactoryLoomPage, FirmsPage, InventoryPage, QcHistoryPage, NotificationsPage,
  WorkerGRN, AllWeaversPage, AllStockPage, AllOrdersPage, ProductionHistoryPage,
  FinishingTrackingPage,
} from "./superadmin-dashboard/lazyPages";

export { UserProfileModal };

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// SUPERADMIN DASHBOARD (main export)
// ═══════════════════════════════════════════════════════════════════════════════
export function SuperadminDashboard({ onBack }: { onBack?: () => void } = {}) {
  const { pathname } = useLocation();
  const { tab } = useParams();
  const routerNavigate = useNavigate();

  // Map path to active tab
  let nav = "Materials";
  if (tab === "materials") nav = "Materials";
  else if (tab === "weavers") nav = "Weavers";
  else if (tab === "all-weavers") nav = "AllWeavers";
  else if (tab === "all-stock") nav = "AllStock";
  else if (tab === "production-history") nav = "ProductionHistory";
  else if (tab === "production") nav = "Production";
  else if (tab === "all-orders") nav = "AllOrders";
  else if (tab === "qc-history") nav = "QcHistory";
  else if (tab === "payments") nav = "Payments";
  else if (tab === "reports") nav = "Reports";
  else if (tab === "inventory") nav = "Inventory";
  else if (tab === "customers") nav = "Customers";
  else if (tab === "vendors") nav = "Vendors";
  else if (tab === "suppliers") nav = "Suppliers";
  else if (tab === "factory-looms") nav = "FactoryLooms";
  else if (tab === "firms") nav = "Firms";
  else if (tab === "notifications") nav = "Notifications";
  else if (tab === "receive-stock") nav = "ReceiveStock";
  else if (tab === "add-user") nav = "AddUser";
  else if (tab === "external-purchases") nav = "ExternalPurchases";
  else if (tab === "batches") nav = "Batches";
  else if (tab === "designs") nav = "Designs";
  else if (tab === "finishing") nav = "Finishing";
  else if (tab === "rates") nav = "Rates";
  else if (tab === "issue-material") nav = "IssueMaterial";
  else if (tab === "approvals") nav = "Approvals";
  else if (tab === "audit-log") nav = "AuditLog";
  else if (tab === "label-settings") nav = "LabelSettings";
  else if (tab === "overview") nav = "Overview";

  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const isMobile = useIsMobile();

  // Always scroll to top when navigating between pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    document.body.scrollTop = 0;
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
  }, [nav]);

  const navigate = (tab: string, ctx?: any) => {
    const routeMap: Record<string, string> = {
      Overview: "/superadmin/overview",
      Materials: "/superadmin/materials",
      Weavers: "/superadmin/weavers",
      AllWeavers: "/superadmin/all-weavers",
      AllStock: "/superadmin/all-stock",
      Production: "/superadmin/production",
      AllOrders: "/superadmin/all-orders",
      QcHistory: "/superadmin/qc-history",
      Payments: "/superadmin/payments",
      Reports: "/superadmin/reports",
      Inventory: "/superadmin/inventory",
      Customers: "/superadmin/customers",
      Vendors: "/superadmin/vendors",
      Suppliers: "/superadmin/suppliers",
      FactoryLooms: "/superadmin/factory-looms",
      Firms: "/superadmin/firms",
      Notifications: "/superadmin/notifications",
      ReceiveStock: "/superadmin/receive-stock",
      AddUser: "/superadmin/add-user",
      ExternalPurchases: "/superadmin/external-purchases",
      Batches: "/superadmin/batches",
      Designs: "/superadmin/designs",
      Finishing: "/superadmin/finishing",
      Rates: "/superadmin/rates",
      IssueMaterial: "/superadmin/issue-material",
      ProductionHistory: "/superadmin/production-history",
      Approvals: "/superadmin/approvals",
      AuditLog: "/superadmin/audit-log",
      LabelSettings: "/superadmin/label-settings",
    };
    const path = routeMap[tab] || "/superadmin/materials";
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    routerNavigate(path, { state: ctx });
  };

  function renderPage(navigate: (v: string, ctx?: any) => void) {
    switch (nav) {
      case "Materials": return <MaterialsPage onNavigate={navigate} />;
      case "Weavers": return <WeaversPage onNavigate={navigate} />;
      case "AllWeavers": return <AllWeaversPage onNavigate={navigate} />;
      case "AllStock": return <AllStockPage onBack={() => navigate("Production")} />;
      case "Production": return <ProductionPage superadmin onNavigate={navigate} />;
      case "AllOrders": return <AllOrdersPage superadmin={true} onBack={() => navigate("Production")} />;
      case "ProductionHistory": return <ProductionHistoryPage />;
      case "Payments": return <PaymentsPage />;
      case "Reports": return <ReportsPage />;
      case "Customers": return <CustomersPage />;
      case "Vendors": return <VendorsPage />;
      case "Suppliers": return <SuppliersPage />;
      case "FactoryLooms": return <FactoryLoomPage />;
      case "Firms": return <FirmsPage />;
      case "Inventory": return <InventoryPage />;
      case "Batches": return <BatchCreationPage />;
      case "Designs": return <DesignLibraryPage />;
      case "Finishing": return <FinishingTrackingPage />;
      case "Rates": return <RatesPricingPage />;
      case "Approvals": return <ApprovalsPage />;
      case "AuditLog": return <AuditLogPage />;
      case "AddUser": return <AddUserPage />;
      case "LabelSettings": return <LabelSettingsPage />;
      case "ExternalPurchases": return <ExternalPurchasesPage />;
      case "IssueMaterial": return <IssueMaterialPage />;
      case "ReceiveStock": return <WorkerGRN />;
      case "QcHistory": return <QcHistoryPage onBack={() => navigate("Production")} />;
      case "Notifications": return <NotificationsPage />;
      default: return <SAOverviewPage setNav={navigate} />;
    }
  }

  const sections = PAGE_SECTIONS[nav];

  return (
    <div style={{ minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>
      <style>{`
        :root {
          --foreground: #1F1209;
          --card: #ffffff;
          --card-foreground: #1F1209;
          --popover: #ffffff;
          --popover-foreground: #1F1209;
          --primary-foreground: #ffffff;
          --secondary: #f1f1f5;
          --ring: rgb(139,112,96);
          --tw-shadow: 0 0 rgba(0,0,0,0);
          --tw-shadow-colored: 0 0 rgba(0,0,0,0);
          --tw-ring-shadow: 0 0 rgba(0,0,0,0);
          --tw-ring-color: rgba(139,112,96,0.5);
        }
        button { background-color: rgba(0,0,0,0); }
        html, body { overflow-x: hidden; max-width: 100%; }
      `}</style>
      <style>{SECTION_NAV_GLOBAL_STYLE}</style>
      {isMobile ? (
        <>
          <SAMobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} activeTab={nav} setTab={navigate} />
          <SAMobileTopNav onMenuOpen={() => setMenuOpen(true)} onBack={onBack} onProfile={() => setShowProfileModal(true)} />
          {sections && <SectionNavigator sections={sections} stickyTop={MOBILE_NAV_H} padding="0 18px" />}
          <Suspense fallback={<TabLoadingFallback />}>{renderPage(navigate)}</Suspense>
        </>
      ) : (
        <>
          <SATopNav active={nav} set={navigate} onBack={onBack} sections={sections} onProfile={() => setShowProfileModal(true)} />
          <AnimatePresence mode="wait">
            <motion.div key={nav}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              <Suspense fallback={<TabLoadingFallback />}>{renderPage(navigate)}</Suspense>
            </motion.div>
          </AnimatePresence>
        </>
      )}
      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal onClose={() => setShowProfileModal(false)} role="superadmin" />
        )}
      </AnimatePresence>
    </div>
  );
}
