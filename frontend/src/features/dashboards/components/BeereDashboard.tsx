
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { imgWarp as _imgWarpLocal, imgResham as _imgReshamLocal, imgJari as _imgJariLocal } from "../../../shared/constants/imageData";
import { useAuth } from "../../../contexts/AuthContext";
import { useResponsive } from "../../../hooks/useResponsive";
// Direct paths, not the @/features/portals barrel — that barrel also
// re-exports ShopStaffPortal/WeaverPortal/WorkerPortal (each its own large
// subtree), which pulled all three into BeereDashboard.tsx's chunk even
// though only WorkerGRN is used here.
// eslint-disable-next-line import/no-restricted-paths -- see comment above; this bypasses the barrel deliberately.
import { WorkerGRN, INITIAL_HISTORY as GRN_INITIAL_HISTORY } from "../../portals/components/worker/WorkerGRN";
// eslint-disable-next-line import/no-restricted-paths -- see comment above; this bypasses the barrel deliberately.
import type { ReceiptRecord } from "../../portals/components/worker/ReceiptHistoryTable";
import { useQuery } from "@tanstack/react-query";
import { rawMaterialsApi } from "../../../shared/api/rawMaterials";
import { BG_IMAGE } from "@/shared/ui/heroBackgrounds";

// Lazily loaded so the initial dashboard bundle doesn't pay for every tab's
// page — only the active tab's chunk is fetched, on first navigation to it.
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const MaterialsPage = lazy(() => import("../../materials/components/MaterialsPage").then(m => ({ default: m.MaterialsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const WeaversPage = lazy(() => import("../../weavers/components/WeaversPage").then(m => ({ default: m.WeaversPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const ProductionPage = lazy(() => import("../../production/components/ProductionPage").then(m => ({ default: m.ProductionPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const PaymentsPage = lazy(() => import("../../payments/components/PaymentsPage").then(m => ({ default: m.PaymentsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const ReportsPage = lazy(() => import("../../reports/components/ReportsPage").then(m => ({ default: m.ReportsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const CustomersPage = lazy(() => import("../../customers/components/CustomersPage").then(m => ({ default: m.CustomersPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const ProductionHistoryPage = lazy(() => import("../../production/components/ProductionHistoryPage").then(m => ({ default: m.ProductionHistoryPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const FinishingTrackingPage = lazy(() => import("../../finishing/components/FinishingTrackingPage").then(m => ({ default: m.FinishingTrackingPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const NotificationsPage = lazy(() => import("../../notifications/components/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const AuditLogPage = lazy(() => import("../../audit/components/AuditLogPage").then(m => ({ default: m.AuditLogPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const AllWeaversPage = lazy(() => import("../../weavers/components/AllWeaversPage").then(m => ({ default: m.AllWeaversPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const AllStockPage = lazy(() => import("../../inventory/components/AllStockPage").then(m => ({ default: m.AllStockPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const AllOrdersPage = lazy(() => import("../../bulk-orders/components/AllOrdersPage").then(m => ({ default: m.AllOrdersPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const QcHistoryPage = lazy(() => import("../../qc/components/QcHistoryPage").then(m => ({ default: m.QcHistoryPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const ExternalPurchasesPage = lazy(() => import("../../inventory/components/ExternalPurchasesPage").then(m => ({ default: m.ExternalPurchasesPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const SupplierReturnsPage = lazy(() => import("../../inventory/components/SupplierReturnsPage").then(m => ({ default: m.SupplierReturnsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const AddUserPage = lazy(() => import("../../users/components/AddUserPage").then(m => ({ default: m.AddUserPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const FirmsPage = lazy(() => import("../../firms/components/FirmsPage").then(m => ({ default: m.FirmsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const RatesPricingPage = lazy(() => import("../../pricing/components/RatesPricingPage").then(m => ({ default: m.RatesPricingPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const DesignLibraryPage = lazy(() => import("../../design-library/components/DesignLibraryPage").then(m => ({ default: m.DesignLibraryPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const BatchCreationPage = lazy(() => import("../../production/components/BatchCreationPage").then(m => ({ default: m.BatchCreationPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const IssueMaterialPage = lazy(() => import("../../materials/components/IssueMaterialPage").then(m => ({ default: m.IssueMaterialPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const ReturnMaterialPage = lazy(() => import("../../materials/components/ReturnMaterialPage").then(m => ({ default: m.ReturnMaterialPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const InventoryPage = lazy(() => import("../../inventory/components/InventoryPage").then(m => ({ default: m.InventoryPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const VendorsPage = lazy(() => import("../../vendors/components/VendorsPage").then(m => ({ default: m.VendorsPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const SuppliersPage = lazy(() => import("../../suppliers/components/SuppliersPage").then(m => ({ default: m.SuppliersPage })));
// eslint-disable-next-line import/no-restricted-paths -- React.lazy() code-splitting needs the page module imported directly; routing through the feature barrel (index.ts) would pull every export of that feature into this chunk and defeat per-route code splitting.
const FactoryLoomPage = lazy(() => import("../../production/components/FactoryLoomPage").then(m => ({ default: m.FactoryLoomPage })));

import { TabLoadingFallback } from './TabLoadingFallback';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import {
  SectionNavigator, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE,
  MOBILE_NAV_H,
} from "../../../shared/ui/SectionNavigator";
import { PackageCheck, History } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { UserProfileModal } from "../../../shared/ui/UserProfileModal";

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
import { T, F, GLOBAL_STYLE } from './beere-dashboard/theme';
import { SectionCard } from './beere-dashboard/primitives';
import { TopNav } from './beere-dashboard/components/TopNav';
import { MobileMenuDrawer, MobileTopNav } from './beere-dashboard/MobileNavDrawer';
// Lazily loaded, same reasoning as the tab pages above: only one of these two
// ever renders in a given session (desktop vs mobile), so neither should be
// in the bundle every visitor pays for on first load.
const DesktopOverview = lazy(() => import('./beere-dashboard/DesktopOverview').then(m => ({ default: m.DesktopOverview })));
const MobileOverview = lazy(() => import('./beere-dashboard/mobile').then(m => ({ default: m.MobileOverview })));

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export function BeereDashboard({ onBack }: { onBack?: () => void } = {}) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [grnHistory, setGrnHistory] = useState<ReceiptRecord[]>(() => GRN_INITIAL_HISTORY);
  const { data: rawMaterialStock } = useQuery({
    queryKey: ["raw-material-stock"],
    queryFn: () => rawMaterialsApi.listStock(),
  });
  const { state } = useLocation();
  const { tab } = useParams();
  const routerNavigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    routerNavigate("/login");
  };

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
  else if (tab === "audit-log") nav = "AuditLog";
  else if (tab === "receive-stock") nav = "ReceiveStock";
  else if (tab === "add-user") nav = "AddUser";
  else if (tab === "external-purchases") nav = "ExternalPurchases";
  else if (tab === "supplier-returns") nav = "SupplierReturns";
  else if (tab === "batches") nav = "Batches";
  else if (tab === "designs") nav = "Designs";
  else if (tab === "finishing") nav = "Finishing";
  else if (tab === "rates") nav = "Rates";
  else if (tab === "issue-material") nav = "IssueMaterial";
  else if (tab === "return-material") nav = "ReturnMaterial";
  else if (tab === "overview") nav = "Overview";

  const mobileTab = nav;
  const [menuOpen, setMenuOpen] = useState(false);
  const { isMobile } = useResponsive();

  // Always scroll to top when navigating between pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    document.body.scrollTop = 0;
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
  }, [nav, mobileTab]);

  const navigate = (tab: string, ctx?: unknown) => {
    const routeMap: Record<string, string> = {
      Overview: "/admin/overview",
      Materials: "/admin/materials",
      Weavers: "/admin/weavers",
      AllWeavers: "/admin/all-weavers",
      AllStock: "/admin/all-stock",
      Production: "/admin/production",
      AllOrders: "/admin/all-orders",
      QcHistory: "/admin/qc-history",
      Payments: "/admin/payments",
      Reports: "/admin/reports",
      Inventory: "/admin/inventory",
      Customers: "/admin/customers",
      Vendors: "/admin/vendors",
      Suppliers: "/admin/suppliers",
      FactoryLooms: "/admin/factory-looms",
      Firms: "/admin/firms",
      Notifications: "/admin/notifications",
      AuditLog: "/admin/audit-log",
      ReceiveStock: "/admin/receive-stock",
      AddUser: "/admin/add-user",
      ExternalPurchases: "/admin/external-purchases",
      SupplierReturns: "/admin/supplier-returns",
      Batches: "/admin/batches",
      Designs: "/admin/designs",
      Finishing: "/admin/finishing",
      Rates: "/admin/rates",
      IssueMaterial: "/admin/issue-material",
      ReturnMaterial: "/admin/return-material",
      ProductionHistory: "/admin/production-history",
    };
    const path = routeMap[tab] || "/admin/materials";
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    routerNavigate(path, { state: ctx });
  };
  const navigateMobile = navigate;

  const dashboardContent = isMobile ? (
    <div id="main-content" style={{ width: "100%", minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} activeTab={mobileTab} setTab={navigateMobile} />
      <MobileTopNav onMenuOpen={() => setMenuOpen(true)} onBack={onBack} onLogout={handleLogout} onProfile={() => setShowProfileModal(true)} onNotifications={() => navigateMobile("Notifications")} />
      {PAGE_SECTIONS[mobileTab] && (
        <SectionNavigator sections={PAGE_SECTIONS[mobileTab]} stickyTop={MOBILE_NAV_H} padding="0 18px" />
      )}
      <ErrorBoundary variant="inline" resetKeys={[mobileTab]}>
      <Suspense fallback={<TabLoadingFallback />}>
      {mobileTab === "Overview" ? (
        <>
          <MobileOverview onNavigate={navigateMobile} />
        </>
      ) : mobileTab === "Materials" ? (
        <MaterialsPage onNavigate={navigateMobile} />
      ) : mobileTab === "Weavers" ? (
        <WeaversPage onNavigate={navigateMobile} />
      ) : mobileTab === "AllWeavers" ? (
        <AllWeaversPage onNavigate={navigateMobile} />
      ) : mobileTab === "AllStock" ? (
        <AllStockPage onBack={() => navigateMobile("Production")} />
      ) : mobileTab === "Production" ? (
        <ProductionPage onNavigate={navigateMobile} />
      ) : mobileTab === "AllOrders" ? (
        <AllOrdersPage onBack={() => navigateMobile("Production")} />
      ) : mobileTab === "QcHistory" ? (
        <QcHistoryPage onBack={() => navigateMobile("Production")} />
      ) : mobileTab === "Payments" ? (
        <PaymentsPage />
      ) : mobileTab === "Reports" ? (
        <ReportsPage />
      ) : mobileTab === "Inventory" ? (
        <InventoryPage />
      ) : mobileTab === "Customers" ? (
        <CustomersPage />
      ) : mobileTab === "Vendors" ? (
        <VendorsPage />
      ) : mobileTab === "Suppliers" ? (
        <SuppliersPage />
      ) : mobileTab === "ProductionHistory" ? (
        <ProductionHistoryPage />
      ) : mobileTab === "Notifications" ? (
        <NotificationsPage />
      ) : mobileTab === "AuditLog" ? (
        <AuditLogPage />
      ) : mobileTab === "AddUser" ? (
        <AddUserPage />
      ) : mobileTab === "ExternalPurchases" ? (
        <ExternalPurchasesPage />
      ) : mobileTab === "SupplierReturns" ? (
        <SupplierReturnsPage />
      ) : mobileTab === "ReceiveStock" ? (
        <div style={{ background: T.silkCream, minHeight: "100dvh" }}>
          {/* Mobile Admin Luxury Hero Banner */}
          <section style={{ position: "relative", overflow: "hidden", background: "#0D0207", padding: "28px 16px 36px" }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${BG_IMAGE})`,
              backgroundSize: "cover", backgroundPosition: "center",
              opacity: 0.22, pointerEvents: "none"
            }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,2,7,0.75) 0%, #0D0207 100%)", pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, height: 1, background: T.antiqueGold }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: `${T.antiqueGold}80`, letterSpacing: "1.8px", textTransform: "uppercase" }}>
                  SINCE 1999 · ADMIN · MATERIALS
                </span>
              </div>

              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 26, color: "#FFFDF9", lineHeight: 1.15 }}>
                Receive Stock <span style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 400, fontSize: 20, color: T.antiqueGold }}>&amp; Goods Receipt Note</span>
              </div>

              <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.75)", lineHeight: 1.55 }}>
                Record incoming raw materials from vendors against purchase orders and generate GRN numbers.
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { text: "SINCE 1999 · ADMIN PORTAL", color: T.antiqueGold },
                  { text: "RAW MATERIALS & GRN" },
                  { text: "VENDOR DELIVERIES" },
                ].map(p => (
                  <div key={p.text} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "4px 12px" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, color: p.color || "#FFF" }}>{p.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div style={{ padding: "20px 16px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Section 1: Receive Stock Form SectionCard */}
            <SectionCard icon={PackageCheck} title="Receive Stock" subtitle="Record incoming raw materials from vendors and generate a GRN number.">
              <WorkerGRN mode="form" history={grnHistory} setHistory={setGrnHistory} initialPOId={(state as { poId?: string } | null)?.poId} />
            </SectionCard>

            {/* Current Stock Card */}
            <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid rgba(200,155,71,0.25)`, borderRadius: 16, padding: "18px 22px" }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.antiqueGold, marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Current Stock</div>
              {!rawMaterialStock ? (
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center", padding: "10px 0" }}>
                  Loading stock levels...
                </div>
              ) : rawMaterialStock.items.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center", padding: "10px 0" }}>
                  No stock recorded yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {rawMaterialStock.items.map(item => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>
                        {item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari"} · {item.name}
                      </span>
                      <span style={{ fontFamily: F.ui, fontSize: 13, color: item.currentStock <= item.reorderLevel ? "#B03A2E" : T.taupe, fontWeight: 700, whiteSpace: "nowrap" as const }}>
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Goods Receipt History SectionCard */}
            <SectionCard icon={History} title="Goods Receipt History" subtitle="Every GRN recorded so far, with vendor, materials, and quantities.">
              <WorkerGRN mode="history" history={grnHistory} setHistory={setGrnHistory} />
            </SectionCard>
          </div>
        </div>
      ) : mobileTab === "Batches" ? (
        <BatchCreationPage />
      ) : mobileTab === "Designs" ? (
        <DesignLibraryPage />
      ) : mobileTab === "Finishing" ? (
        <FinishingTrackingPage />
      ) : mobileTab === "Rates" ? (
        <RatesPricingPage />
      ) : mobileTab === "IssueMaterial" ? (
        <IssueMaterialPage />
      ) : mobileTab === "ReturnMaterial" ? (
        <ReturnMaterialPage />
      ) : mobileTab === "FactoryLooms" ? (
        <FactoryLoomPage />
      ) : mobileTab === "Firms" ? (
        <FirmsPage />
      ) : null}
      </Suspense>
      </ErrorBoundary>
    </div>
  ) : (
    <div id="main-content" style={{ width: "100%", minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>
      <TopNav active={nav} set={navigate} onBack={onBack} onLogout={handleLogout} sections={PAGE_SECTIONS[nav]} onProfile={() => setShowProfileModal(true)} />
      <ErrorBoundary variant="inline" resetKeys={[nav]}>
      <Suspense fallback={<TabLoadingFallback />}>
      {nav === "Materials" ? (
        <MaterialsPage onNavigate={navigate} />
      ) : nav === "Weavers" ? (
        <WeaversPage onNavigate={navigate} />
      ) : nav === "AllWeavers" ? (
        <AllWeaversPage onNavigate={navigate} />
      ) : nav === "AllStock" ? (
        <AllStockPage onBack={() => navigate("Production")} />
      ) : nav === "Production" ? (
        <ProductionPage onNavigate={navigate} />
      ) : nav === "AllOrders" ? (
        <AllOrdersPage onBack={() => navigate("Production")} />
      ) : nav === "ProductionHistory" ? (
        <ProductionHistoryPage />
      ) : nav === "QcHistory" ? (
        <QcHistoryPage onBack={() => navigate("Production")} />
      ) : nav === "ReceiveStock" ? (
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
                  SINCE 1999 · ADMIN · MATERIALS
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
                  { text: "SINCE 1999 · ADMIN PORTAL", color: T.antiqueGold },
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
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 items-start">
              {/* Section 1: Receive Stock Form SectionCard */}
              <SectionCard icon={PackageCheck} title="Receive Stock" subtitle="Record incoming raw materials from vendors and generate a GRN number.">
                <WorkerGRN mode="form" history={grnHistory} setHistory={setGrnHistory} initialPOId={(state as { poId?: string } | null)?.poId} />
              </SectionCard>

              {/* Current Stock Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid rgba(200,155,71,0.25)`, borderRadius: 16, padding: "18px 22px" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.antiqueGold, marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Current Stock</div>
                  {!rawMaterialStock ? (
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center", padding: "10px 0" }}>
                      Loading stock levels...
                    </div>
                  ) : rawMaterialStock.items.length === 0 ? (
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center", padding: "10px 0" }}>
                      No stock recorded yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {rawMaterialStock.items.map(item => (
                        <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>
                            {item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari"} · {item.name}
                          </span>
                          <span style={{ fontFamily: F.ui, fontSize: 13, color: item.currentStock <= item.reorderLevel ? "#B03A2E" : T.taupe, fontWeight: 700, whiteSpace: "nowrap" as const }}>
                            {item.currentStock} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Goods Receipt History SectionCard (Full Width) */}
            <SectionCard icon={History} title="Goods Receipt History" subtitle="Every GRN recorded so far, with vendor, materials, and quantities.">
              <WorkerGRN mode="history" history={grnHistory} setHistory={setGrnHistory} />
            </SectionCard>
          </div>
        </div>
      ) : nav === "Customers" ? (
        <CustomersPage />
      ) : nav === "Vendors" ? (
        <VendorsPage />
      ) : nav === "Suppliers" ? (
        <SuppliersPage />
      ) : nav === "FactoryLooms" ? (
        <FactoryLoomPage />
      ) : nav === "Firms" ? (
        <FirmsPage />
      ) : nav === "Inventory" ? (
        <InventoryPage />
      ) : nav === "Payments" ? (
        <PaymentsPage />
      ) : nav === "Reports" ? (
        <ReportsPage />
      ) : nav === "Notifications" ? (
        <NotificationsPage />
      ) : nav === "AuditLog" ? (
        <AuditLogPage />
      ) : nav === "AddUser" ? (
        <AddUserPage />
      ) : nav === "ExternalPurchases" ? (
        <ExternalPurchasesPage />
      ) : nav === "SupplierReturns" ? (
        <SupplierReturnsPage />
      ) : nav === "Batches" ? (
        <BatchCreationPage />
      ) : nav === "Designs" ? (
        <DesignLibraryPage />
      ) : nav === "Finishing" ? (
        <FinishingTrackingPage />
      ) : nav === "Rates" ? (
        <RatesPricingPage />
      ) : nav === "IssueMaterial" ? (
        <IssueMaterialPage />
      ) : nav === "ReturnMaterial" ? (
        <ReturnMaterialPage />
      ) : (
        <>
          <DesktopOverview onNavigate={navigate} />
        </>
      )}
      </Suspense>
      </ErrorBoundary>
    </div>
  );

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <style>{SECTION_NAV_GLOBAL_STYLE}</style>
      {dashboardContent}
      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal onClose={() => setShowProfileModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
