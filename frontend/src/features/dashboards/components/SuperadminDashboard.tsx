import React, { useState, Suspense, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { AnimatePresence, motion } from "motion/react";
import { useIsMobile } from "../../../hooks/useResponsive";
import {
  SectionNavigator, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE, MOBILE_NAV_H,
} from "../../../shared/ui/SectionNavigator";

import { PackageCheck, History } from "lucide-react";
import { T, F, EASE } from "./superadmin-dashboard/theme";
import { TabLoadingFallback } from "./superadmin-dashboard/atoms";
import { BG_IMAGE } from "@/shared/ui/heroBackgrounds";
import { SectionCard } from "./beere-dashboard/primitives";
import { SATopNav } from "./superadmin-dashboard/SATopNav";
import { SAMobileMenuDrawer, SAMobileTopNav } from "./superadmin-dashboard/SAMobileNav";
import { SAOverviewPage } from "./superadmin-dashboard/SAOverviewPage";
import { UserProfileModal } from "../../../shared/ui/UserProfileModal";
import { SHOP_SCOPE, WORKER_SCOPE } from "@/features/users";
import {
  RatesPricingPage, DesignLibraryPage, BatchCreationPage, ApprovalsPage, AuditLogPage,
  LabelSettingsPage, ExternalPurchasesPage, SupplierReturnsPage, AddUserPage, IssueMaterialPage, ReturnMaterialPage, MaterialsPage,
  WeaversPage, ProductionPage, PaymentsPage, ReportsPage, CustomersPage, VendorsPage,
  SuppliersPage, FactoryLoomPage, FirmsPage, InventoryPage, QcHistoryPage, NotificationsPage,
  WorkerGRN, AllWeaversPage, AllStockPage, AllOrdersPage, ProductionHistoryPage,
  FinishingTrackingPage, StaffDirectoryPage,
} from "./superadmin-dashboard/lazyPages";

export { UserProfileModal };

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// SUPERADMIN DASHBOARD (main export)
// ═══════════════════════════════════════════════════════════════════════════════
export function SuperadminDashboard({ onBack }: { onBack?: () => void } = {}) {
  const { tab } = useParams();
  const routerNavigate = useNavigate();
  const { enterStaffView } = useAuth();

  // Map path to active tab
  let nav = "Overview";
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
  else if (tab === "worker-staff") nav = "WorkerStaff";
  else if (tab === "shop-staff") nav = "ShopStaff";
  else if (tab === "external-purchases") nav = "ExternalPurchases";
  else if (tab === "supplier-returns") nav = "SupplierReturns";
  else if (tab === "batches") nav = "Batches";
  else if (tab === "designs") nav = "Designs";
  else if (tab === "finishing") nav = "Finishing";
  else if (tab === "rates") nav = "Rates";
  else if (tab === "issue-material") nav = "IssueMaterial";
  else if (tab === "return-material") nav = "ReturnMaterial";
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

  // Open a staff portal as this admin. Not impersonation — the session and
  // identity are unchanged, so anything recorded in there is attributed to
  // the admin, and the portal shows a banner plus a way back.
  const viewAsStaff = (target: "worker" | "shop") => {
    enterStaffView(target);
    routerNavigate(target === "worker" ? "/worker" : "/shop");
  };

  const navigate = (tab: string, ctx?: unknown) => {
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
      WorkerStaff: "/superadmin/worker-staff",
      ShopStaff: "/superadmin/shop-staff",
      ExternalPurchases: "/superadmin/external-purchases",
      SupplierReturns: "/superadmin/supplier-returns",
      Batches: "/superadmin/batches",
      Designs: "/superadmin/designs",
      Finishing: "/superadmin/finishing",
      Rates: "/superadmin/rates",
      IssueMaterial: "/superadmin/issue-material",
      ReturnMaterial: "/superadmin/return-material",
      ProductionHistory: "/superadmin/production-history",
      Approvals: "/superadmin/approvals",
      AuditLog: "/superadmin/audit-log",
      LabelSettings: "/superadmin/label-settings",
    };
    const path = routeMap[tab] || "/superadmin/materials";
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    routerNavigate(path, { state: ctx });
  };

  function renderPage(navigate: (v: string, ctx?: unknown) => void) {
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
      case "WorkerStaff": return <StaffDirectoryPage scope={WORKER_SCOPE} />;
      case "ShopStaff": return <StaffDirectoryPage scope={SHOP_SCOPE} />;
      case "LabelSettings": return <LabelSettingsPage />;
      case "ExternalPurchases": return <ExternalPurchasesPage />;
      case "SupplierReturns": return <SupplierReturnsPage />;
      case "IssueMaterial": return <IssueMaterialPage />;
      case "ReturnMaterial": return <ReturnMaterialPage />;
      case "ReceiveStock": return (
        <div style={{ background: T.silkCream, minHeight: "100dvh" }}>
          {/* Admin-style page header — matches luxury hero design system */}
          <div style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 220, display: "flex", alignItems: "stretch" }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${BG_IMAGE})`,
              backgroundSize: "cover", backgroundPosition: "center",
              opacity: 0.22, pointerEvents: "none"
            }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,2,7,0.75) 0%, #0D0207 100%)", pointerEvents: "none" }} />

            <div className="px-4 md:px-7 xl:px-14" style={{ flex: 1, paddingTop: 36, paddingBottom: 40, zIndex: 10, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: `${T.antiqueGold}80`, letterSpacing: "1.5px", textTransform: "uppercase" as const }}>
                  SINCE 1999 · SUPERADMIN · MATERIALS
                </span>
              </div>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: "clamp(30px, 4.5vw, 44px)", color: "#fff", margin: "0 0 4px", lineHeight: 1.1 }}>
                Receive Stock
              </h1>
              <div style={{ fontFamily: F.display, fontWeight: 500, fontStyle: "italic", fontSize: "clamp(20px, 3.5vw, 28px)", color: T.antiqueGold, marginBottom: 14, lineHeight: 1.2 }}>
                &amp; Goods Receipt Note
              </div>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.75)", maxWidth: "min(560px, 100%)", margin: "0 0 16px", lineHeight: 1.65 }}>
                Record incoming raw materials from vendors against purchase orders and generate GRN numbers.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { text: "SINCE 1999 · SUPERADMIN PORTAL", color: T.antiqueGold },
                  { text: "RAW MATERIALS & GRN" },
                  { text: "VENDOR DELIVERIES" },
                ].map(p => (
                  <div key={p.text} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "5px 14px" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: p.color || "#FFF" }}>{p.text}</span>
                  </div>
                ))}
              </div>
            </div>
            {[300, 440].map((sz, i) => (
              <div key={sz} style={{ position: "absolute", right: -sz * 0.3, bottom: -sz * 0.4, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(200,155,71,${0.10 - i * 0.025})`, pointerEvents: "none" }} />
            ))}
          </div>

          {/* Content */}
          <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32, paddingBottom: 80, display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Section 1: Receive Stock Form SectionCard */}
            <SectionCard icon={PackageCheck} title="Receive Stock" subtitle="Record incoming raw materials from vendors and generate a GRN number.">
              <WorkerGRN mode="form" />
            </SectionCard>

            {/* Section 2: Goods Receipt History SectionCard */}
            <SectionCard icon={History} title="Goods Receipt History" subtitle="Every GRN recorded so far, with vendor, materials, and quantities.">
              <WorkerGRN mode="history" />
            </SectionCard>
          </div>
        </div>
      );
      case "QcHistory": return <QcHistoryPage onBack={() => navigate("Production")} />;
      case "Notifications": return <NotificationsPage />;
      default: return <SAOverviewPage setNav={navigate} />;
    }
  }

  const sections = PAGE_SECTIONS[nav];

  return (
    <div id="main-content" style={{ minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>
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
      `}</style>
      <style>{SECTION_NAV_GLOBAL_STYLE}</style>
      {isMobile ? (
        <>
          <SAMobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} activeTab={nav} setTab={navigate} />
          <SAMobileTopNav onMenuOpen={() => setMenuOpen(true)} onBack={onBack} onProfile={() => setShowProfileModal(true)} onNotifications={() => navigate("Notifications")} />
          {sections && <SectionNavigator sections={sections} stickyTop={MOBILE_NAV_H} padding="0 18px" />}
          <Suspense fallback={<TabLoadingFallback />}>{renderPage(navigate)}</Suspense>
        </>
      ) : (
        <>
          <SATopNav active={nav} set={navigate} onBack={onBack} sections={sections} onProfile={() => setShowProfileModal(true)} onViewAs={viewAsStaff} />
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
          <UserProfileModal onClose={() => setShowProfileModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
