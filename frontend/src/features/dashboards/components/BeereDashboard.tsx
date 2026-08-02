
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams, Outlet } from "react-router";
import { imgHero, imgWarp as _imgWarpLocal, imgResham as _imgReshamLocal, imgJari as _imgJariLocal } from "../../../shared/constants/imageData";
import { useAuth } from "../../../contexts/AuthContext";
import { useResponsive } from "../../../hooks/useResponsive";
import { MaterialsPage }  from "../../materials/components/MaterialsPage";
import { WeaversPage }    from "../../weavers/components/WeaversPage";
import { ProductionPage } from "../../production/components/ProductionPage";
import { PaymentsPage }   from "../../payments/components/PaymentsPage";
import { ReportsPage }    from "../../reports/components/ReportsPage";
import { CustomersPage }  from "../../customers/components/CustomersPage";
import { ProductionHistoryPage } from "../../production/components/ProductionHistoryPage";
import { FinishingTrackingPage } from "../../finishing/components/FinishingTrackingPage";
import { NotificationsPage } from "../../notifications/components/NotificationsPage";
import { AllWeaversPage }   from "../../weavers/components/AllWeaversPage";
import { AllStockPage }    from "../../inventory/components/AllStockPage";
import { AllOrdersPage } from "../../bulk-orders/components/AllOrdersPage";
import { QcHistoryPage } from "../../qc/components/QcHistoryPage";
import { ExternalPurchasesPage } from "../../inventory/components/ExternalPurchasesPage";
import { AddUserPage } from "../../users/components/AddUserPage";
import { FirmsPage } from "../../firms/components/FirmsPage";
import { RatesPricingPage } from "../../pricing/components/RatesPricingPage";
import { DesignLibraryPage } from "../../design-library/components/DesignLibraryPage";
import { BatchCreationPage } from "../../production/components/BatchCreationPage";
import { IssueMaterialPage } from "../../materials/components/IssueMaterialPage";
import { InventoryPage } from "../../inventory/components/InventoryPage";
import { VendorsPage } from "../../vendors/components/VendorsPage";
import { SuppliersPage } from "../../suppliers/components/SuppliersPage";
import { FactoryLoomPage } from "../../production/components/FactoryLoomPage";
import { WorkerGRN, INITIAL_HISTORY as GRN_INITIAL_HISTORY } from "../../portals/components/worker/WorkerGRN";
import {
  SectionNavigator, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE,
  MAIN_NAV_H, SUB_NAV_H, MOBILE_NAV_H, SectionNavItem,
} from "../../../shared/ui/SectionNavigator";
import { motion, useInView, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "../../../shared/ui/ImageWithFallback";
import {
  ChevronLeft, ChevronRight, ChevronDown, ArrowRight,
  Bell, Search, TrendingUp, SlidersHorizontal, Moon,
  Facebook, Instagram, Youtube, Linkedin, Menu,
  LogOut, UserRound, AlertTriangle, CheckCircle2, AlertCircle,
  Package, LayoutDashboard, Factory, IndianRupee, Users, Settings2,
  Activity, MapPin, Phone, Eye, Edit3, Layers3, ShoppingCart, Layers, X,
} from "lucide-react";
import { Rows, Clock as PhClock } from "@phosphor-icons/react";
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../../../shared/constants/weaverImages";

const imgSaree       = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgShowroom    = "https://images.unsplash.com/photo-1756267318202-afebdffc107a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgWarp        = _imgWarpLocal;
const imgResham      = _imgReshamLocal;
const imgJari        = _imgJariLocal;
import { imgBKLogo } from "../../../shared/constants/weaverImages";
import { imgSareeFooter } from "../../../shared/constants/weaverImages";

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
import { T, F, G, GLOBAL_STYLE, EASE } from './beere-dashboard/theme';
import { FadeUp, FadeIn, Lotus } from './beere-dashboard/ui';
import { TopNav, Hero, MetricsBar, ProductionProgress, SareesProduced, FeaturedProduct, ThreeCol, ActivityStrip, WeaverSection, RawMaterial, Footer } from './beere-dashboard/desktop';
import { MobileMenuDrawer, MobileTopNav, MobileHero, MobileMetrics, MobilePerformance, MobileFeaturedProduct, MobileActivity, MobileWeavers, MobileRawMaterial, MobileFooter } from './beere-dashboard/mobile';

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 3200);
    return () => clearTimeout(t);
  }, [onComplete]);

  // Animated silk thread lines across background
  const THREADS = Array.from({ length: 14 }, (_, i) => ({
    x1: `${i * 8 - 4}%`, y1: "0%",
    x2: `${i * 8 + 18}%`, y2: "100%",
    delay: 0.4 + i * 0.12,
    opacity: 0.04 + (i % 3) * 0.025,
  }));

  // Floating gold particle dots
  const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
    cx: `${8 + i * 6}%`,
    cy: `${15 + (i % 5) * 17}%`,
    r: 1 + (i % 3) * 0.8,
    delay: i * 0.18,
    dur: 2.5 + (i % 4) * 0.8,
  }));

  return (
    <motion.div
      key="splash"
      exit={{
        opacity: 0,
        scale: 1.06,
        filter: "blur(22px)",
        transition: { duration: 1.1, ease: [0.4, 0, 0.2, 1] },
      }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "linear-gradient(160deg, #050107 0%, #140408 18%, #2C0913 45%, #4A061B 72%, #6E0F2D 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* ── Silk threads SVG background ── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {THREADS.map((l, i) => (
          <motion.line
            key={`t${i}`}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={`rgba(200,155,71,${l.opacity})`}
            strokeWidth={1}
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 1.6, delay: l.delay, ease: EASE }}
          />
        ))}
        {/* Floating gold particles */}
        {PARTICLES.map((p, i) => (
          <motion.circle
            key={`p${i}`}
            cx={p.cx} cy={p.cy} r={p.r}
            fill="rgba(200,155,71,0.35)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0, 1, 0], y: [0, -30, -60] }}
            transition={{ duration: p.dur, delay: 1.2 + p.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* ── Central ambient glow ── */}
      <div style={{
        position: "absolute", width: 480, height: 480, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,155,71,0.14) 0%, rgba(110,15,45,0.10) 40%, transparent 70%)",
        filter: "blur(50px)", pointerEvents: "none",
      }} />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,155,71,0.22) 0%, transparent 70%)",
          filter: "blur(28px)", pointerEvents: "none",
        }}
      />

      {/* ── Logo with pulse rings ── */}
      <motion.div
        initial={{ scale: 0.25, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.15 }}
        style={{ position: "relative", marginBottom: 34 }}
      >
        {/* Outer pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.7, 1], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          style={{ position: "absolute", inset: -28, borderRadius: 52, border: "1px solid rgba(200,155,71,0.30)", pointerEvents: "none" }}
        />
        {/* Inner pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.85 }}
          style={{ position: "absolute", inset: -14, borderRadius: 40, border: "1px solid rgba(200,155,71,0.45)", pointerEvents: "none" }}
        />
        {/* Logo box */}
        <div style={{
          width: 118, height: 118, borderRadius: 30, overflow: "hidden",
          border: "2px solid rgba(200,155,71,0.48)",
          boxShadow: "0 0 56px rgba(200,155,71,0.40), 0 0 112px rgba(200,155,71,0.15), 0 24px 60px rgba(0,0,0,0.55), inset 0 1px 1px rgba(200,155,71,0.20)",
        }}>
          <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>

      </motion.div>

      {/* ── Brand name ── */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.6 }}
        style={{ textAlign: "center", marginBottom: 28 }}
      >
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(32px, 5vw, 48px)", color: T.warmCream, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
          Beere Kesava
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          style={{ fontFamily: F.ui, fontWeight: 300, fontSize: 18, color: "rgba(245,232,208,0.68)", letterSpacing: "1.5px", marginTop: 6 }}
        >
          &amp; Brothers Silks
        </motion.div>
        <motion.div
          initial={{ opacity: 0, letterSpacing: "10px" }}
          animate={{ opacity: 1, letterSpacing: "6px" }}
          transition={{ duration: 1.1, delay: 1.0, ease: EASE }}
          style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10, color: T.antiqueGold, textTransform: "uppercase", marginTop: 10 }}
        >
          Est. 1999
        </motion.div>
      </motion.div>

      {/* ── Ornamental divider ── */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
        style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}
      >
        <div style={{ width: 90, height: 1, background: "linear-gradient(to left, rgba(200,155,71,0.55), transparent)" }} />
        <motion.div
          animate={{ rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >
          <Lotus sz={24} col={T.antiqueGold} />
        </motion.div>
        <div style={{ width: 90, height: 1, background: "linear-gradient(to right, rgba(200,155,71,0.55), transparent)" }} />
      </motion.div>

      {/* ── Tagline ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.28 }}
        style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 10, color: "rgba(200,155,71,0.60)", letterSpacing: "3.8px", textTransform: "uppercase", margin: 0 }}
      >
        Weaving Heritage Into Every Thread
      </motion.p>

      {/* ── Version / sub-info ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.38 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        style={{ position: "absolute", bottom: 18, fontFamily: F.mono, fontSize: 9.5, color: T.antiqueGold, letterSpacing: "1.5px" }}
      >
        Admin Dashboard v2.0 · Est. 1999
      </motion.div>
    </motion.div>
  );
}

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
    <div style={{ width: "100%", minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} activeTab={mobileTab} setTab={navigateMobile} />
      <MobileTopNav onMenuOpen={() => setMenuOpen(true)} onBack={onBack} onLogout={handleLogout} onProfile={() => setShowProfileModal(true)} />
      {PAGE_SECTIONS[mobileTab] && (
        <SectionNavigator sections={PAGE_SECTIONS[mobileTab]} stickyTop={MOBILE_NAV_H} padding="0 18px" />
      )}
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
    </div>
  ) : (
    <div style={{ width: "100%", minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>
      <TopNav active={nav} set={navigate} onBack={onBack} onLogout={handleLogout} sections={PAGE_SECTIONS[nav]} onProfile={() => setShowProfileModal(true)} />
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
      ) : nav === "ReceiveStock" ? (
        <div style={{ background: T.silkCream, minHeight: "100vh" }}>
          {/* Admin-style page header — matches AuditLogPage / AddUserPage pattern exactly */}
          <div style={{ background: "#3D0E1A", position: "relative", overflow: "hidden", minHeight: 200, display: "flex", alignItems: "stretch" }}>
            <div style={{ flex: 1, padding: "44px 56px 48px", zIndex: 10, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
                <span style={{ fontFamily: F.mono, fontSize: 9, color: `${T.antiqueGold}80`, letterSpacing: "1.5px", textTransform: "uppercase" as const }}>
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
                      <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{g.date}</div>
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
    </div>
  );

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <style>{SECTION_NAV_GLOBAL_STYLE}</style>
      {dashboardContent}
      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal onClose={() => setShowProfileModal(false)} role="admin" />
        )}
      </AnimatePresence>
    </>
  );
}

export function UserProfileModal({ onClose, role }: { onClose: () => void; role: "admin" | "superadmin" | "shop" | "weaver" }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 20 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: "100%", maxWidth: 440, background: "#FFFDF9", borderRadius: 24, overflow: "hidden", border: `1px solid rgba(139,26,46,0.12)`, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #4A061B 0%, #6B1A2A 100%)", padding: "32px 24px 28px", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" as const }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "rgba(255,255,255,0.12)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#FFF" />
          </button>
          
          <div style={{ width: 85, height: 85, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 30, fontWeight: 700, color: "#FFF" }}>
              {role === "admin" ? "AD" : role === "superadmin" ? "SA" : role === "shop" ? "SR" : "RK"}
            </span>
          </div>

          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: "#FFF", lineHeight: 1.2 }}>
            {role === "admin" ? "Ravi Shankar" : role === "superadmin" ? "Venkata Leeladhar Abburi" : role === "shop" ? "K. S. Rama Rao" : "Ravi Kumar"}
          </div>
          
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            {role === "admin" ? "ADM-001" : role === "superadmin" ? "SADM-001" : role === "shop" ? "SHP-012" : "WV-001 / WVR-014"}
          </div>

          <div style={{ marginTop: 8, display: "inline-block", background: "rgba(196,146,58,0.22)", border: "1px solid rgba(196,146,58,0.40)", borderRadius: 999, padding: "4px 14px" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: "#C4923A" }}>
              {role === "admin" ? "Store Administrator" : role === "superadmin" ? "Super Administrator" : role === "shop" ? "Shop Showroom Manager" : "Master Handloom Weaver"}
            </span>
          </div>
        </div>

        {/* Details List */}
        <div style={{ padding: "24px 24px" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, color: "#8B7060", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Contact & Work Details</div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Email Address", value: role === "admin" ? "admin@beerekesava.com" : role === "superadmin" ? "leeladhar@beerekesava.com" : role === "shop" ? "ramarao.k@beerekesava.com" : "ravikumar.wvr@gmail.com" },
              { label: "Phone Number", value: role === "admin" ? "+91 94405 88991" : role === "superadmin" ? "+91 98480 22338" : role === "shop" ? "+91 80081 23456" : "+91 99088 77665" },
              { label: "Factory/Office", value: role === "shop" ? "Bangalore Silk Showroom" : "Dharmavaram Factory Outlet, AP" },
              { label: "Joined Date", value: role === "admin" ? "January 2019" : role === "superadmin" ? "June 2012" : role === "shop" ? "August 2021" : "March 2018" },
              ...(role === "weaver" ? [{ label: "Loom Assignment", value: "Loom 2 & Loom 5 (Active)" }] : [])
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(139,26,46,0.06)", paddingBottom: 10 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#8B7060" }}>{item.label}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: 600, color: "#1A0A0F", textAlign: "right" as const }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: "center" as const }}>
            <button onClick={onClose} style={{ background: "#6B1A2A", color: "#FFF", border: "none", borderRadius: 999, padding: "10px 24px", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(107,26,42,0.2)" }}>
              Close Profile
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

