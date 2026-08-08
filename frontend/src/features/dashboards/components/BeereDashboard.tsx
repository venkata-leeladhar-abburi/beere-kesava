
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useLocation, useNavigate, useParams, Outlet } from "react-router";
import { imgHero, imgWarp as _imgWarpLocal, imgResham as _imgReshamLocal, imgJari as _imgJariLocal } from "../../../shared/constants/imageData";
import { useAuth } from "../../../contexts/AuthContext";
import { useResponsive } from "../../../hooks/useResponsive";
import { WorkerGRN, INITIAL_HISTORY as GRN_INITIAL_HISTORY } from "../../portals/components/worker/WorkerGRN";

// Lazily loaded so the initial dashboard bundle doesn't pay for every tab's
// page — only the active tab's chunk is fetched, on first navigation to it.
const MaterialsPage = lazy(() => import("../../materials/components/MaterialsPage").then(m => ({ default: m.MaterialsPage })));
const WeaversPage = lazy(() => import("../../weavers/components/WeaversPage").then(m => ({ default: m.WeaversPage })));
const ProductionPage = lazy(() => import("../../production/components/ProductionPage").then(m => ({ default: m.ProductionPage })));
const PaymentsPage = lazy(() => import("../../payments/components/PaymentsPage").then(m => ({ default: m.PaymentsPage })));
const ReportsPage = lazy(() => import("../../reports/components/ReportsPage").then(m => ({ default: m.ReportsPage })));
const CustomersPage = lazy(() => import("../../customers/components/CustomersPage").then(m => ({ default: m.CustomersPage })));
const ProductionHistoryPage = lazy(() => import("../../production/components/ProductionHistoryPage").then(m => ({ default: m.ProductionHistoryPage })));
const FinishingTrackingPage = lazy(() => import("../../finishing/components/FinishingTrackingPage").then(m => ({ default: m.FinishingTrackingPage })));
const NotificationsPage = lazy(() => import("../../notifications/components/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
const AuditLogPage = lazy(() => import("../../audit/components/AuditLogPage").then(m => ({ default: m.AuditLogPage })));
const AllWeaversPage = lazy(() => import("../../weavers/components/AllWeaversPage").then(m => ({ default: m.AllWeaversPage })));
const AllStockPage = lazy(() => import("../../inventory/components/AllStockPage").then(m => ({ default: m.AllStockPage })));
const AllOrdersPage = lazy(() => import("../../bulk-orders/components/AllOrdersPage").then(m => ({ default: m.AllOrdersPage })));
const QcHistoryPage = lazy(() => import("../../qc/components/QcHistoryPage").then(m => ({ default: m.QcHistoryPage })));
const ExternalPurchasesPage = lazy(() => import("../../inventory/components/ExternalPurchasesPage").then(m => ({ default: m.ExternalPurchasesPage })));
const AddUserPage = lazy(() => import("../../users/components/AddUserPage").then(m => ({ default: m.AddUserPage })));
const FirmsPage = lazy(() => import("../../firms/components/FirmsPage").then(m => ({ default: m.FirmsPage })));
const RatesPricingPage = lazy(() => import("../../pricing/components/RatesPricingPage").then(m => ({ default: m.RatesPricingPage })));
const DesignLibraryPage = lazy(() => import("../../design-library/components/DesignLibraryPage").then(m => ({ default: m.DesignLibraryPage })));
const BatchCreationPage = lazy(() => import("../../production/components/BatchCreationPage").then(m => ({ default: m.BatchCreationPage })));
const IssueMaterialPage = lazy(() => import("../../materials/components/IssueMaterialPage").then(m => ({ default: m.IssueMaterialPage })));
const InventoryPage = lazy(() => import("../../inventory/components/InventoryPage").then(m => ({ default: m.InventoryPage })));
const VendorsPage = lazy(() => import("../../vendors/components/VendorsPage").then(m => ({ default: m.VendorsPage })));
const SuppliersPage = lazy(() => import("../../suppliers/components/SuppliersPage").then(m => ({ default: m.SuppliersPage })));
const FactoryLoomPage = lazy(() => import("../../production/components/FactoryLoomPage").then(m => ({ default: m.FactoryLoomPage })));

import { TabLoadingFallback } from './TabLoadingFallback';
import {
  SectionNavigator, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE,
  MAIN_NAV_H, SUB_NAV_H, MOBILE_NAV_H, SectionNavItem,
} from "../../../shared/ui/SectionNavigator";
import { AnimatePresence } from "motion/react";
import { UserProfileModal } from "../../../shared/ui/UserProfileModal";

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
import { T, F, G, GLOBAL_STYLE, EASE } from './beere-dashboard/theme';
import { FadeUp, FadeIn, Lotus } from './beere-dashboard/ui';
import { TopNav, Hero, MetricsBar, ProductionProgress, SareesProduced, FeaturedProduct, ThreeCol, ActivityStrip, WeaverSection, RawMaterial, Footer } from './beere-dashboard/desktop';
import { MobileMenuDrawer, MobileTopNav, MobileHero, MobileMetrics, MobilePerformance, MobileFeaturedProduct, MobileActivity, MobileWeavers, MobileRawMaterial, MobileFooter } from './beere-dashboard/mobile';

import { SplashScreen } from './SplashScreen';

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export function BeereDashboard({ onBack }: { onBack?: () => void } = {}) {
  const [splashVisible, setSplashVisible] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [grnHistory, setGrnHistory] = useState<any[]>(() => GRN_INITIAL_HISTORY);
  const { pathname, state } = useLocation();
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
  else if (tab === "batches") nav = "Batches";
  else if (tab === "designs") nav = "Designs";
  else if (tab === "finishing") nav = "Finishing";
  else if (tab === "rates") nav = "Rates";
  else if (tab === "issue-material") nav = "IssueMaterial";
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

  const navigate = (tab: string, ctx?: any) => {
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
      Batches: "/admin/batches",
      Designs: "/admin/designs",
      Finishing: "/admin/finishing",
      Rates: "/admin/rates",
      IssueMaterial: "/admin/issue-material",
      ProductionHistory: "/admin/production-history",
    };
    const path = routeMap[tab] || "/admin/materials";
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    routerNavigate(path, { state: ctx });
  };
  const navigateMobile = navigate;

  const dashboardContent = isMobile ? (
    <div style={{ width: "100%", minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} activeTab={mobileTab} setTab={navigateMobile} />
      <MobileTopNav onMenuOpen={() => setMenuOpen(true)} onBack={onBack} onLogout={handleLogout} onProfile={() => setShowProfileModal(true)} />
      {PAGE_SECTIONS[mobileTab] && (
        <SectionNavigator sections={PAGE_SECTIONS[mobileTab]} stickyTop={MOBILE_NAV_H} padding="0 18px" />
      )}
      <Suspense fallback={<TabLoadingFallback />}>
      {mobileTab === "Overview" ? (
        <>
          <MobileHero />
          <MobileMetrics />
          <MobilePerformance />
          <MobileFeaturedProduct />
          <MobileActivity onNavigate={navigateMobile} />
          <MobileWeavers onNavigate={navigateMobile} />
          <MobileRawMaterial onNavigate={navigateMobile} />
          <MobileFooter />
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
      ) : mobileTab === "ReceiveStock" ? (
        <WorkerGRN />
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
      ) : mobileTab === "FactoryLooms" ? (
        <FactoryLoomPage />
      ) : mobileTab === "Firms" ? (
        <FirmsPage />
      ) : null}
      </Suspense>
    </div>
  ) : (
    <div style={{ width: "100%", minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>
      <TopNav active={nav} set={navigate} onBack={onBack} onLogout={handleLogout} sections={PAGE_SECTIONS[nav]} onProfile={() => setShowProfileModal(true)} />
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
      ) : nav === "Payments" ? (
        <PaymentsPage />
      ) : nav === "Reports" ? (
        <ReportsPage />
      ) : nav === "Inventory" ? (
        <InventoryPage />
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
      ) : nav === "Notifications" ? (
        <NotificationsPage />
      ) : nav === "AuditLog" ? (
        <AuditLogPage />
      ) : nav === "ReceiveStock" ? (
        <div style={{ background: T.silkCream, minHeight: "100dvh" }}>
          {/* Admin-style page header — matches AuditLogPage / AddUserPage pattern exactly */}
          <div style={{ background: "#3D0E1A", position: "relative", overflow: "hidden", minHeight: 200, display: "flex", alignItems: "stretch" }}>
            <div style={{ flex: 1, padding: "44px 56px 48px", zIndex: 10, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
                <span style={{ fontFamily: F.mono, fontSize: 12, color: `${T.antiqueGold}80`, letterSpacing: "1.5px", textTransform: "uppercase" as const }}>
                  SINCE 1999 · ADMIN · MATERIALS
                </span>
              </div>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 48, color: "#fff", margin: "0 0 4px", lineHeight: 1.1 }}>
                Receive Stock
              </h1>
              <div style={{ fontFamily: F.display, fontWeight: 500, fontStyle: "italic", fontSize: 30, color: T.antiqueGold, marginBottom: 16, lineHeight: 1.2 }}>
                &amp; Goods Receipt Note
              </div>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 520, margin: 0, lineHeight: 1.65 }}>
                Record incoming raw materials from vendors against purchase orders and generate GRN numbers.
              </p>
            </div>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, marginRight: 56, alignItems: "flex-end", justifyContent: "center", zIndex: 10, position: "relative" }}>
              {[
                { label: "Warp · 142 kg in stock" },
                { label: "Resham · 18 kg in stock" },
                { label: "Jari · 24 Reels in stock" },
              ].map((chip, i) => (
                <div key={i} style={{ padding: "10px 18px", backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, fontFamily: F.ui, fontSize: 13, color: "#fff", whiteSpace: "nowrap" as const }}>
                  {chip.label}
                </div>
              ))}
            </div>
            {[300, 440].map((sz, i) => (
              <div key={i} style={{ position: "absolute", right: -sz * 0.3, bottom: -sz * 0.4, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(200,155,71,${0.10 - i * 0.025})`, pointerEvents: "none" }} />
            ))}
          </div>
          {/* Content */}
          <div style={{ padding: "40px 56px 80px", maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 24, alignItems: "start" }}>
              <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${T.borderDef}`, overflow: "visible", boxShadow: "0 2px 12px rgba(44,24,16,0.07)" }}>
                <WorkerGRN mode="form" history={grnHistory} setHistory={setGrnHistory} initialPOId={(state as any)?.poId} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "20px 22px", boxShadow: "0 2px 12px rgba(44,24,16,0.07)" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Recent GRNs</div>
                  {[
                    { grn: "GRN-2026-141", vendor: "Sri Venkateswara Textiles", item: "Warp 48 kg",      date: "12 Jun" },
                    { grn: "GRN-2026-138", vendor: "Lakshmi Silk Traders",      item: "Resham Red 24 kg", date: "10 Jun" },
                    { grn: "GRN-2026-135", vendor: "AK Traders",                item: "Jari 60 Reels",    date: "08 Jun" },
                  ].map((g, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${T.borderDef}` : "none" }}>
                      <div>
                        <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{g.grn}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{g.vendor} · {g.item}</div>
                      </div>
                      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{g.date}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid rgba(200,155,71,0.25)`, borderRadius: 16, padding: "18px 22px" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.antiqueGold, marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Current Stock</div>
                  {[
                    { label: "Warp",              qty: "142 kg" },
                    { label: "Resham Red",         qty: "18 kg"  },
                    { label: "Jari (Poly 2G Gold)",qty: "24 Reels" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottom: i < 2 ? `1px solid rgba(200,155,71,0.15)` : "none" }}>
                      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.label}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{s.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Separate Full-Width GRN History Section */}
            <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${T.borderDef}`, padding: "28px 32px", boxShadow: "0 4px 20px rgba(74,6,27,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 4, height: 18, background: T.royalBurgundy, borderRadius: 2 }} />
                <h2 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, margin: 0, fontWeight: 700 }}>Goods Receipt History</h2>
              </div>
              <WorkerGRN mode="history" history={grnHistory} setHistory={setGrnHistory} />
            </div>
          </div>
        </div>
      ) : nav === "AddUser" ? (
        <AddUserPage />
      ) : nav === "ExternalPurchases" ? (
        <ExternalPurchasesPage />
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
      ) : (
        <>
          <Hero />
          <MetricsBar />
          <ThreeCol onNavigate={navigate} />
          <ActivityStrip onNavigate={navigate} />
          <WeaverSection onNavigate={navigate} />
          <RawMaterial onNavigate={navigate} />
          <Footer />
        </>
      )}
      </Suspense>
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
