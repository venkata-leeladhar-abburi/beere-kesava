import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Search, Bell, ChevronDown, ChevronRight, ChevronLeft, TrendingUp,
  Settings, ClipboardList, Menu,
  Edit2, Trash2, Plus, Eye, Shield, AlertTriangle,
  Facebook, Instagram, Youtube, Linkedin, ArrowRight,
  Users, Layers, IndianRupee, CheckCircle2, Truck, Clock, Building2,
  LogOut, UserRound, Package, LayoutDashboard, Factory, Settings2,
} from "lucide-react";
import { useResponsive } from "./useResponsive";
import { RatesPricingPage } from "./RatesPricingPage";
import { DesignLibraryPage } from "./DesignLibraryPage";
import { BatchCreationPage } from "./BatchCreationPage";
import { ApprovalsPage } from "./ApprovalsPage";
import { AuditLogPage } from "./AuditLogPage";
import { LabelSettingsPage } from "./LabelSettingsPage";
import { ExternalPurchasesPage } from "./ExternalPurchasesPage";
import { AddUserPage } from "./AddUserPage";
import { IssueMaterialPage } from "./IssueMaterialPage";
import { MaterialsPage } from "./MaterialsPage";
import { WeaversPage } from "./WeaversPage";
import { ProductionPage } from "./ProductionPage";
import { PaymentsPage } from "./PaymentsPage";
import { ReportsPage } from "./ReportsPage";
import { CustomersPage } from "./CustomersPage";
import { FirmsPage } from "./FirmsPage";
import { InventoryPage } from "./InventoryPage";
import { QcHistoryPage } from "./QcHistoryPage";
import { NotificationsPage } from "./NotificationsPage";
import { WorkerGRN } from "./worker/WorkerGRN";
import {
  SectionNavigator, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE,
  MAIN_NAV_H, SUB_NAV_H, MOBILE_NAV_H,
} from "./SectionNavigator";
import { imgBKLogo, imgSareeFooter, imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../constants/weaverImages";
import { imgHero, imgWarp, imgResham, imgJari } from "../constants/imageData";
import { ImageWithFallback } from "./figma/ImageWithFallback";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS (mirroring BeereDashboard)
// ═══════════════════════════════════════════════════════════════════════════════
const T = {
  silkCream:      "#F7F2EA",
  warmIvory:      "#FFFDF9",
  royalBurgundy:  "#6E0F2D",
  deepWine:       "#4A061B",
  antiqueGold:    "#C89B47",
  goldLight:      "#E7C983",
  luxuryBrown:    "#3B2314",
  ivoryCream:     "#F7F2EA",
  pureWhite:      "#FFFDF9",
  crimson:        "#C0392B",
  mahogany:       "#4A061B",
  gold:           "#C89B47",
  deepBlack:      "#3B2314",
  burgundy:       "#3D2030",
  taupe:          "#8B7060",
  warmCream:      "#F5E8D0",
  green:          "#1E6640",
  borderDef:      "rgba(110,15,45,0.10)",
  borderMed:      "rgba(110,15,45,0.20)",
  borderGold:     "rgba(200,155,71,0.22)",
  bgSuccess:      "rgba(30,102,64,0.10)",
  bgWarning:      "rgba(110,15,45,0.10)",
  bgAlert:        "rgba(110,15,45,0.18)",
  bgGold:         "rgba(200,155,71,0.15)",
  saGold:         "#C4923A",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

const NUM: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
};

const G = {
  hero   : "linear-gradient(135deg, #4A061B 0%, #6E0F2D 45%, #C89B47 100%)",
  card   : "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
  gold   : "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
  button : "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  saGold : "linear-gradient(135deg, #C4923A 0%, #E8A84A 100%)",
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DARK_MAROON = "#3D1020";

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay, opacity: { duration: 0.45 } }}
      style={style}
    >{children}</motion.div>
  );
}

function AnimatedBar({ pct, color, height = 5, trackBg = "rgba(110,15,45,0.07)" }: { pct: number; color: string; height?: number; trackBg?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <div ref={ref} style={{ height, borderRadius: 999, background: trackBg }}>
      <motion.div
        initial={{ width: "0%" }}
        animate={inView ? { width: `${pct}%` } : undefined}
        transition={{ duration: 1.4, delay: 0.18, ease: EASE }}
        style={{ height: "100%", borderRadius: 999, background: color }}
      />
    </div>
  );
}

function AnimatedNumber({ raw }: { raw: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(() => {
    const m = raw.match(/(\d+(?:\.\d+)?)/);
    if (!m) return raw;
    const isFloat = m[1].includes(".");
    return raw.replace(m[1], isFloat ? "0.0" : "0");
  });
  useEffect(() => {
    if (!inView) return;
    const match = raw.match(/(\d+(?:\.\d+)?)/);
    if (!match) { setDisplayed(raw); return; }
    const numStr = match[1];
    const target = parseFloat(numStr);
    const isFloat = numStr.includes(".");
    const idx = raw.indexOf(numStr);
    const pre = raw.slice(0, idx);
    const suf = raw.slice(idx + numStr.length);
    const dur = 1600;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setDisplayed(`${pre}${isFloat ? (e * target).toFixed(1) : Math.round(e * target)}${suf}`);
      if (p < 1) requestAnimationFrame(step);
      else setDisplayed(raw);
    };
    requestAnimationFrame(step);
  }, [inView, raw]);
  return <span ref={ref}>{displayed}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA METRICS DATA
// ═══════════════════════════════════════════════════════════════════════════════
const SA_METRICS = [
  { ico: <Users size={22} color={T.warmCream} />,        label: "Active Weavers",   val: "84",    sub: "↑ 12% vs last month", hi: false },
  { ico: <Layers size={22} color={T.warmCream} />,       label: "Sarees Produced",  val: "248",   sub: "↑ 14% vs last month", hi: false },
  { ico: <IndianRupee size={22} color={T.warmCream} />,  label: "Pending Payments", val: "₹2.4L", sub: "2 overdue",           hi: true  },
  { ico: <CheckCircle2 size={22} color={T.warmCream} />, label: "Ready for Sale",   val: "84",    sub: "Sarees",              hi: false },
  { ico: <Truck size={22} color={T.warmCream} />,        label: "Dispatched",       val: "32",    sub: "Sarees this week",    hi: false },
  { ico: <Clock size={22} color={T.warmCream} />,        label: "Pending Approvals",val: "3",     sub: "Require review",      hi: false, crimsonHi: true },
];

const WEAVERS = [
  { name: "Padma Veni",   id: "WV002", batch: "BATCH-086", sarees: 18, pct: 85, status: "In Progress" as const, ac: T.royalBurgundy, img: imgPadmaVeni   },
  { name: "Ravi Kumar",   id: "WV001", batch: "BATCH-089", sarees: 12, pct: 68, status: "In Progress" as const, ac: "#1E6640",        img: imgRaviKumar   },
  { name: "Suresh Murti", id: "WV003", batch: "BATCH-081", sarees: 7,  pct: 35, status: "Pending QC"  as const, ac: "#374151",        img: imgSureshMurti },
  { name: "Anand K.",     id: "WV005", batch: "BATCH-083", sarees: 9,  pct: 72, status: "In Progress" as const, ac: T.antiqueGold,    img: imgAnandK      },
];

const MATS = [
  { name: "Warp",   sub: "Base Thread · Cotton/Silk",       stock: "142 kg", pct: 72, note: "248 sarees possible", alert: false, img: imgWarp,
    cardBg: "#FFFDF5", accent: T.antiqueGold, accentLight: "rgba(200,155,71,0.10)", borderColor: "rgba(200,155,71,0.20)", tagBg: "rgba(200,155,71,0.10)", tagCol: "#8A6B1F" },
  { name: "Resham", sub: "Silk Thread · Multiple Colors",   stock: "180 kg", pct: 85, note: "6 colors in stock",   alert: false, img: imgResham,
    cardBg: "#F8F6F4", accent: "#9E9189", accentLight: "rgba(158,145,137,0.10)", borderColor: "rgba(158,145,137,0.22)", tagBg: "rgba(158,145,137,0.10)", tagCol: "#6B5F58" },
  { name: "Jari",   sub: "Metallic Thread · Gold & Silver", stock: "90 kg",  pct: 30, note: "3 types available",   alert: true,  img: imgJari,
    cardBg: "#FFFDF9", accent: T.royalBurgundy, accentLight: "rgba(110,15,45,0.06)", borderColor: "rgba(110,15,45,0.16)", tagBg: "rgba(110,15,45,0.07)", tagCol: T.royalBurgundy },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
function SectionHeader({ title, actionText = "View All →", small }: { title: string; actionText?: string; small?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, ease: EASE }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: small ? 18 : 32 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          style={{ width: 3, height: small ? 18 : 22, borderRadius: 2, background: G.gold, flexShrink: 0, transformOrigin: "top" }}
        />
        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: small ? 22 : 30, color: T.luxuryBrown, lineHeight: 1.1, letterSpacing: "-0.3px" }}>
          {title}
        </span>
      </div>
      <motion.span whileHover={{ x: 3, opacity: 1 }} transition={{ duration: 0.2 }}
        style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: "#C4923A", cursor: "pointer", letterSpacing: "0.1px" }}
      >{actionText}</motion.span>
    </motion.div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 48, scale: 0.92, filter: "blur(8px)" }}
      animate={inView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : undefined}
      whileHover={{ y: -7, scale: 1.008, boxShadow: "0px 32px 80px rgba(74,6,27,0.16)" }}
      transition={{ type: "spring", stiffness: 240, damping: 22, opacity: { duration: 0.5 }, filter: { duration: 0.55 } }}
      style={{ background: T.warmIvory, borderRadius: 28, border: `1px solid ${T.borderDef}`, boxShadow: "0px 10px 40px rgba(74,6,27,0.07)", ...style }}
    >{children}</motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA TOP NAV — grouped (mirrors BeereDashboard's Admin TopNav, + gold accent)
// ═══════════════════════════════════════════════════════════════════════════════
type NavPage  = { key: string; label: string; sa?: boolean };
type NavGroup = { key: string; label: string; icon: React.ComponentType<{ size?: number; color?: string }>; pages: NavPage[] };

const NAV_GROUPS: NavGroup[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, pages: [
      { key: "Overview", label: "Overview" },
  ]},
  { key: "production", label: "Production", icon: Factory, pages: [
      { key: "Production", label: "Production" },
      { key: "Batches",    label: "Batches" },
      { key: "Designs",    label: "Designs" },
      { key: "QcHistory",  label: "QC History" },
  ]},
  { key: "materials", label: "Materials", icon: Package, pages: [
      { key: "Materials",         label: "Materials" },
      { key: "ReceiveStock",      label: "Receive Stock" },
      { key: "IssueMaterial",     label: "Issue Material" },
      { key: "ExternalPurchases", label: "External Purchases" },
  ]},
  { key: "finance", label: "Finance", icon: IndianRupee, pages: [
      { key: "Payments", label: "Payments" },
      { key: "Firms",    label: "Firms" },
      { key: "Reports",  label: "Reports" },
  ]},
  { key: "people", label: "People", icon: Users, pages: [
      { key: "Weavers",   label: "Weavers" },
      { key: "Customers", label: "Customers" },
      { key: "AddUser",   label: "Add New User" },
  ]},
  { key: "operations", label: "Operations", icon: Settings2, pages: [
      { key: "Inventory",     label: "Inventory" },
      { key: "Rates",         label: "Rates & Pricing" },
      { key: "Notifications", label: "Notifications" },
      { key: "Approvals",     label: "Approvals",      sa: true },
      { key: "AuditLog",      label: "Audit Log",      sa: true },
      { key: "LabelSettings", label: "Label Settings",  sa: true },
  ]},
];

function findNavGroup(pageKey: string): NavGroup {
  const direct = NAV_GROUPS.find(g => g.pages.some(p => p.key === pageKey));
  return direct ?? NAV_GROUPS[0];
}

function SATopNav({ active, set, onBack }: { active: string; set: (v: string) => void; onBack?: () => void }) {
  const { w } = useResponsive();
  const compact = w < 1320;
  const [showProfile, setShowProfile] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeGroup = findNavGroup(active);
  const showSubNav = activeGroup.pages.length > 1;

  const groupBtnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const openGroupNow = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenGroup(key);
  };
  const closeGroupSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenGroup(null), 140);
  };

  return (
    <motion.div
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      style={{ position: "sticky", top: 0, zIndex: 100 }}
    >
      <nav
        style={{
          height: MAIN_NAV_H,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: compact ? "0 20px" : "0 56px",
          gap: compact ? 12 : 0,
          background: "rgba(255,253,249,0.94)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)" as any,
          borderBottom: `2px solid ${T.antiqueGold}`,
          boxShadow: "0 4px 40px rgba(74,6,27,0.06)",
        }}
      >
        {/* Logo + Brand */}
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}
          style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 14, flexShrink: 0, cursor: "pointer" }}
        >
          <div style={{ width: compact ? 40 : 52, height: compact ? 40 : 52, borderRadius: 14, overflow: "hidden", flexShrink: 0, boxShadow: "0 4px 16px rgba(110,15,45,0.18)", border: "1.5px solid rgba(200,155,71,0.30)" }}>
            <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          {!compact && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: T.luxuryBrown, letterSpacing: "0.3px", lineHeight: 1 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: T.taupe, letterSpacing: "0.2px" }}>&amp; Brothers Silks</div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 8.5, color: T.antiqueGold, letterSpacing: "3px", textTransform: "uppercase" }}>Est. 1999</div>
            </div>
          )}
        </motion.div>

        {/* Group nav — scrolls internally if the viewport is too narrow to fit every group */}
        <div className="sa-topnav-groups" style={{ display: "flex", height: "100%", alignItems: "stretch", gap: 0, overflowX: "auto", overflowY: "visible", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
          <style>{`.sa-topnav-groups::-webkit-scrollbar { display: none; }`}</style>
          {NAV_GROUPS.map((g, i) => {
            const isActive = activeGroup.key === g.key;
            const isOpen = openGroup === g.key;
            const hasDropdown = g.pages.length > 1;
            const alignRight = i >= NAV_GROUPS.length - 2;
            const Icon = g.icon;
            return (
              <div
                key={g.key}
                ref={el => { groupBtnRefs.current[g.key] = el; }}
                style={{ position: "relative", height: "100%" }}
                onMouseEnter={() => hasDropdown && openGroupNow(g.key)}
                onMouseLeave={closeGroupSoon}
              >
                <motion.button
                  onClick={() => { set(g.pages[0].key); setOpenGroup(null); }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: EASE }}
                  whileHover={{ backgroundColor: "rgba(110,15,45,0.03)" }}
                  style={{
                    height: "100%", padding: compact ? "0 12px" : "0 20px", flexShrink: 0,
                    border: "none", backgroundColor: "rgba(0,0,0,0)", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Icon size={15} color={isActive ? T.royalBurgundy : T.taupe} />
                    <span style={{
                      fontFamily: F.ui, fontWeight: isActive ? 600 : 400, fontSize: 13.5,
                      color: isActive ? T.royalBurgundy : T.taupe,
                      whiteSpace: "nowrap", letterSpacing: "0.1px",
                      transition: "color 0.2s",
                    }}>{g.label}</span>
                    {hasDropdown && (
                      <ChevronDown
                        size={12}
                        color={isActive ? T.royalBurgundy : T.taupe}
                        style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                      />
                    )}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="sa-group-nav-underline"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      style={{ height: 2, width: "100%", background: "#6B1A2A" }}
                    />
                  )}
                  {!isActive && <div style={{ height: 2, width: "100%", background: "transparent" }} />}
                </motion.button>

                {/* Dropdown is rendered in the fixed overlay below — NOT here */}
              </div>
            );
          })}
        </div>

        {/* ── Dropdown overlay — rendered OUTSIDE the overflow scroll container
            so it is never clipped by overflow-x: auto on the groups div.
            Uses position:fixed measured from the group wrapper's bounding rect. */}
        <AnimatePresence>
          {openGroup && (() => {
            const g = NAV_GROUPS.find(x => x.key === openGroup);
            if (!g || g.pages.length <= 1) return null;
            const wrapperEl = groupBtnRefs.current[g.key];
            const rect = wrapperEl?.getBoundingClientRect();
            const alignRight = NAV_GROUPS.indexOf(g) >= NAV_GROUPS.length - 2;
            const left = rect ? (alignRight ? undefined : rect.left) : 0;
            const right = rect && alignRight ? window.innerWidth - rect.right : undefined;
            const top  = rect ? rect.bottom - 8 : MAIN_NAV_H - 8;
            return (
              <motion.div
                key={`dd-${g.key}`}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.16, ease: EASE }}
                onMouseEnter={() => openGroupNow(g.key)}
                onMouseLeave={closeGroupSoon}
                style={{
                  position: "fixed",
                  top, left, right,
                  minWidth: 250, zIndex: 300,
                  background: "#FFFFFF", borderRadius: 16,
                  border: "1px solid rgba(110,15,45,0.10)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
                  overflow: "hidden", padding: 10,
                }}
              >
                <div style={{ padding: "10px 14px 8px", fontFamily: F.ui, fontWeight: 700, fontSize: 10.5, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase" as const }}>
                  {g.label}
                </div>
                {g.pages.map(p => {
                  const pActive = active === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => { set(p.key); setOpenGroup(null); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "13px 14px", marginBottom: 2, border: "none", borderRadius: 10,
                        background: pActive ? "rgba(110,15,45,0.07)" : "transparent",
                        cursor: "pointer", textAlign: "left" as const,
                        fontFamily: F.ui, fontSize: 14, fontWeight: pActive ? 600 : 400,
                        color: pActive ? T.royalBurgundy : T.luxuryBrown,
                      }}
                      onMouseEnter={e => { if (!pActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(110,15,45,0.04)"; }}
                      onMouseLeave={e => { if (!pActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {p.label}
                        {p.sa && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.antiqueGold, flexShrink: 0 }} />}
                      </span>
                      {pActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.royalBurgundy }} />}
                    </button>
                  );
                })}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Right actions */}

        <div style={{ display: "flex", alignItems: "center", gap: compact ? 6 : 10, flexShrink: 0 }}>
          {!compact && (
          <motion.button whileHover={{ scale: 1.08, backgroundColor: "rgba(110,15,45,0.05)" }} whileTap={{ scale: 0.94 }}
            style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${T.borderDef}`, backgroundColor: "rgba(0,0,0,0)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          ><Search size={15} color={T.taupe} /></motion.button>
          )}
          <div style={{ position: "relative" }}>
            <motion.button whileHover={{ scale: 1.08, backgroundColor: "rgba(110,15,45,0.05)" }} whileTap={{ scale: 0.94 }}
              onClick={() => set("Notifications")}
              style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${T.borderDef}`, backgroundColor: "rgba(0,0,0,0)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            ><Bell size={15} color={active === "Notifications" ? T.royalBurgundy : T.taupe} /></motion.button>
            <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: T.royalBurgundy, border: `1.5px solid ${T.warmIvory}` }} />
          </div>
          {/* Gold SA avatar + profile dropdown */}
          <div style={{ position: "relative" }}>
            <motion.div onClick={() => { setShowProfile(p => !p); setOpenGroup(null); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 12px 6px 6px", borderRadius: 12, border: `1px solid ${showProfile ? T.antiqueGold : T.borderDef}`, backgroundColor: showProfile ? "rgba(196,146,58,0.08)" : "rgba(196,146,58,0.04)" }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "#C4923A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(196,146,58,0.35)" }}>
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>SA</span>
              </div>
              {!compact && <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: T.luxuryBrown }}>Superadmin</span>}
              <ChevronDown size={13} color={T.taupe} style={{ transform: showProfile ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </motion.div>
            {showProfile && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300, background: T.warmIvory, borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 250, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", background: "rgba(196,146,58,0.06)", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#C4923A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 12px rgba(196,146,58,0.35)" }}>
                    <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: "#FFF" }}>SA</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>Superadmin</div>
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 2 }}>Full Access · All Portals</div>
                  </div>
                </div>
                <div style={{ padding: "6px 0" }}>
                  <button onClick={() => setShowProfile(false)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.04)") as any}
                    onMouseLeave={e => (e.currentTarget.style.background = "none") as any}>
                    <UserRound size={15} color={T.taupe} /> View Profile
                  </button>
                  <div style={{ height: 1, background: T.borderDef, margin: "4px 0" }} />
                  <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.04)") as any}
                    onMouseLeave={e => (e.currentTarget.style.background = "none") as any}>
                    <ChevronLeft size={15} color={T.taupe} /> Switch Portal
                  </button>
                  <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 18px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 14, color: "#C0392B", textAlign: "left" as const }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(192,57,43,0.05)") as any}
                    onMouseLeave={e => (e.currentTarget.style.background = "none") as any}>
                    <LogOut size={15} color="#C0392B" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sub-nav bar — pages within the active group */}
      {showSubNav && (
        <div
          style={{
            height: SUB_NAV_H,
            display: "flex", alignItems: "center",
            padding: compact ? "0 20px" : "0 56px",
            background: T.warmIvory,
            borderBottom: `1px solid ${T.borderDef}`,
          }}
        >
          <div className="sa-topnav-groups" style={{ display: "flex", alignItems: "center", gap: 4, background: "#F3EEE8", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 6, overflowX: "auto", maxWidth: "100%" } as React.CSSProperties}>
            {activeGroup.pages.map(p => {
              const isActive = active === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => set(p.key)}
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center", gap: 7,
                    fontFamily: F.ui, fontWeight: isActive ? 600 : 500, fontSize: 14,
                    color: isActive ? "#FFFFFF" : T.luxuryBrown,
                    background: "transparent",
                    border: "none", borderRadius: 10,
                    padding: "12px 26px", cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(110,15,45,0.06)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sa-subnav-active-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      style={{ position: "absolute", inset: 0, background: T.royalBurgundy, borderRadius: 10, boxShadow: "0 4px 14px rgba(110,15,45,0.28)", zIndex: 0 }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 7 }}>
                    {p.label}
                    {p.sa && (
                      <span
                        title="Superadmin-only"
                        style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? T.goldLight : T.antiqueGold, flexShrink: 0 }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA MOBILE — MENU DRAWER + TOP NAV
// ═══════════════════════════════════════════════════════════════════════════════
function SAMobileMenuDrawer({ open, onClose, activeTab, setTab }: {
  open: boolean; onClose: () => void; activeTab: string; setTab: (v: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sa-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(58,18,28,0.55)", backdropFilter: "blur(3px)" }}
          />
          <motion.div
            key="sa-drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            style={{
              position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 200,
              width: "78vw", maxWidth: 320,
              background: T.warmIvory,
              boxShadow: "8px 0 48px rgba(74,6,27,0.22)",
              display: "flex", flexDirection: "column",
              overflowY: "auto",
            }}
          >
            <div style={{ padding: "20px 20px 16px", borderBottom: `2px solid ${T.antiqueGold}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: G.button, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.40)" }}>
                  <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 15, color: T.warmCream, lineHeight: 1.1 }}>Beere Kesava</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9, color: "rgba(231,201,131,0.85)", letterSpacing: "2px", textTransform: "uppercase" }}>Superadmin</div>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid rgba(245,232,208,0.20)", background: "rgba(245,232,208,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="rgba(245,232,208,0.85)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </motion.button>
            </div>

            <div style={{ flex: 1, padding: "10px 12px" }}>
              {NAV_GROUPS.map((group, gi) => {
                const GroupIcon = group.icon;
                const isGroupActive = findNavGroup(activeTab).key === group.key;
                return (
                  <div key={group.key} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px 8px" }}>
                      <GroupIcon size={16} color={isGroupActive ? T.royalBurgundy : T.taupe} />
                      <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: isGroupActive ? T.royalBurgundy : T.luxuryBrown, letterSpacing: "0.3px", textTransform: "uppercase" as const }}>
                        {group.label}
                      </span>
                    </div>
                    {group.pages.map((page, i) => {
                      const isActive = activeTab === page.key;
                      return (
                        <motion.button
                          key={page.key}
                          initial={{ opacity: 0, x: -18 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.32, delay: 0.04 + (gi * 3 + i) * 0.03, ease: EASE }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => { setTab(page.key); onClose(); }}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                            padding: "11px 14px 11px 30px", borderRadius: 12, marginBottom: 3,
                            border: isActive ? `1px solid ${T.borderMed}` : "1px solid transparent",
                            background: isActive ? `linear-gradient(135deg, rgba(110,15,45,0.08) 0%, rgba(200,155,71,0.06) 100%)` : "transparent",
                            cursor: "pointer", textAlign: "left",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontWeight: isActive ? 600 : 400, fontSize: 14, color: isActive ? T.royalBurgundy : T.luxuryBrown, letterSpacing: "0.05px" }}>
                            {page.label}
                            {page.sa && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.antiqueGold, flexShrink: 0 }} />}
                          </span>
                          {isActive && <ChevronRight size={13} color={T.royalBurgundy} />}
                        </motion.button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "16px 20px 28px", borderTop: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "#C4923A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(196,146,58,0.35)" }}>
                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 12, color: "#FFFFFF" }}>SA</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.luxuryBrown }}>Superadmin</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 10.5, color: T.taupe }}>Full Access · All Portals</div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SAMobileTopNav({ onMenuOpen, onBack }: { onMenuOpen: () => void; onBack?: () => void }) {
  const [showProfile, setShowProfile] = useState(false);
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{ position: "sticky", top: 0, zIndex: 100, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: "rgba(255,253,249,0.96)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" as any, borderBottom: `2px solid ${T.antiqueGold}`, boxShadow: "0 2px 20px rgba(74,6,27,0.05)" }}
    >
      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={onMenuOpen}
        style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.borderDef}`, background: "rgba(0,0,0,0)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Menu size={17} color={T.luxuryBrown} />
      </motion.button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, overflow: "hidden", flexShrink: 0, border: `1px solid rgba(200,155,71,0.25)` }}>
          <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.1, letterSpacing: "0.1px" }}>Beere Kesava</div>
          <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 9, color: T.taupe, letterSpacing: "0.2px" }}>Superadmin · Est. 1999</div>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <motion.button onClick={() => setShowProfile(p => !p)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${showProfile ? T.antiqueGold : T.borderDef}`, background: "#C4923A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(196,146,58,0.35)" }}
        >
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 11, color: "#FFFFFF" }}>SA</span>
        </motion.button>
        {showProfile && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300, background: "#FFFDF9", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 210, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", background: "rgba(196,146,58,0.06)", borderBottom: `1px solid ${T.borderDef}` }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Superadmin</div>
              <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, marginTop: 2 }}>Full Access · All Portals</div>
            </div>
            <div style={{ padding: "6px 0" }}>
              <button onClick={() => setShowProfile(false)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, textAlign: "left" as const }}>
                <UserRound size={14} color={T.taupe} /> View Profile
              </button>
              <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, textAlign: "left" as const }}>
                <ChevronLeft size={14} color={T.taupe} /> Switch Portal
              </button>
              <button onClick={() => { setShowProfile(false); onBack?.(); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: "#C0392B", textAlign: "left" as const }}>
                <LogOut size={14} color="#C0392B" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA HERO
// ═══════════════════════════════════════════════════════════════════════════════
function SAHero() {
  return (
    <section style={{ position: "relative", height: "calc(100vh - 90px - 160px)", minHeight: 380, overflow: "hidden", background: "#0D0207" }}>
      <motion.img src={imgHero} alt="Beere Kesava Showroom"
        initial={{ scale: 1.18, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 1 }}
        transition={{ duration: 10, ease: "linear", opacity: { duration: 1.4, ease: [0.22, 1, 0.36, 1] } }}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "62%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #0D0207 0%, #0D0207 32%, rgba(13,2,7,0.97) 40%, rgba(13,2,7,0.88) 48%, rgba(13,2,7,0.55) 58%, rgba(13,2,7,0.18) 72%, rgba(13,2,7,0) 80%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to top, rgba(13,2,7,0.7) 0%, rgba(13,2,7,0) 100%)", pointerEvents: "none", zIndex: 2 }} />

      {/* SA Badge top-right */}
      <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.6, ease: EASE }}
        style={{ position: "absolute", top: 28, right: 28, zIndex: 10, display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: "rgba(196,146,58,0.18)", border: "1px solid rgba(196,146,58,0.42)", backdropFilter: "blur(12px)" }}
      >
        <Shield size={13} color="#C4923A" />
        <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 11.5, color: "#E8A84A", letterSpacing: "1.5px", textTransform: "uppercase" }}>Superadmin Access</span>
      </motion.div>

      <div style={{ position: "relative", zIndex: 5, width: "50%", height: "100%", padding: "0 56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ width: 24, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9.5, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
            Since 1999 · Superadmin Overview
          </span>
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { text: "Superadmin", italic: false, color: T.warmCream, delay: 0.5 },
            { text: "Dashboard", italic: true, color: T.antiqueGold, delay: 0.68 },
            { text: "& Command Center", italic: false, color: T.warmCream, delay: 0.86 },
          ].map(({ text, italic, color, delay }) => (
            <div key={text} style={{ overflow: "hidden", lineHeight: "1.12" }}>
              <motion.div initial={{ y: "110%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: F.display, fontWeight: 400, fontStyle: italic ? "italic" : "normal", fontSize: "clamp(32px, 3.4vw, 54px)", letterSpacing: "-0.5px", color }}
              >{text}</motion.div>
            </div>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.0 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.90)", lineHeight: 1.85, margin: 0, maxWidth: 360, letterSpacing: "0.05px" }}
        >
          Full visibility and control over all operations — rates, approvals, audit logs, and more.
        </motion.p>
      </div>

      {/* Decorative rings */}
      {[180, 280, 380].map((sz, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.8 + i * 0.18, ease: EASE }}
          style={{ position: "absolute", right: "25%", top: "50%", transform: "translate(50%, -50%)", width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(196,146,58,${0.07 - i * 0.015})`, pointerEvents: "none", zIndex: 3 }}
        />
      ))}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA METRICS BAR
// ═══════════════════════════════════════════════════════════════════════════════
function SAMetricsBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
      style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: G.card, borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {SA_METRICS.map((m: any, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : m.crimsonHi ? "rgba(192,57,43,0.12)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 18px",
              backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : m.crimsonHi ? "linear-gradient(135deg, rgba(192,57,43,0.16) 0%, rgba(192,57,43,0.05) 100%)" : "none",
              backgroundColor: "rgba(0,0,0,0)",
              borderRight: i < SA_METRICS.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "pointer",
            }}
          >
            <motion.div whileHover={{ scale: 1.08, rotate: 3 }} transition={{ duration: 0.25 }}
              style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : m.crimsonHi ? "rgba(192,57,43,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : m.crimsonHi ? "rgba(192,57,43,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >{m.ico}</motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : m.crimsonHi ? "rgba(232,120,110,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.hi ? T.goldLight : m.crimsonHi ? "#F08080" : T.warmCream, lineHeight: 1.0, marginBottom: 8, ...NUM }}>
                <AnimatedNumber raw={m.val} />
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.hi ? "rgba(231,201,131,0.95)" : m.crimsonHi ? "rgba(240,128,128,0.90)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                {m.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA OVERVIEW — ALERT STRIP
// ═══════════════════════════════════════════════════════════════════════════════
function SAAlertStrip() {
  return (
    <div style={{ margin: "36px 48px 0", padding: "14px 22px", borderRadius: 14, background: "rgba(196,146,58,0.10)", border: "none", borderLeft: "3px solid #C4923A", display: "flex", alignItems: "center", gap: 12 }}>
      <Shield size={16} color="#C4923A" />
      <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: T.luxuryBrown, letterSpacing: "0.1px" }}>
        You are in <strong style={{ color: "#C4923A" }}>Superadmin mode</strong>. All data is visible and editable. Actions here affect the entire system.
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function SAQuickActions({ setNav }: { setNav: (v: string) => void }) {
  const actions = [
    { icon: <Settings size={22} color={T.antiqueGold} />, label: "Edit Rates & Pricing", sub: "Update making charge rates", nav: "Rates", color: T.antiqueGold, bg: "rgba(200,155,71,0.08)", border: "rgba(200,155,71,0.22)" },
    { icon: <CheckCircle2 size={22} color={T.royalBurgundy} />, label: "Review Approvals", sub: "3 pending require action", nav: "Approvals", color: T.royalBurgundy, bg: "rgba(110,15,45,0.06)", border: T.borderDef, badge: "3" },
    { icon: <ClipboardList size={22} color={T.luxuryBrown} />, label: "View Audit Log", sub: "Full system activity trail", nav: "AuditLog", color: T.luxuryBrown, bg: "rgba(59,35,20,0.06)", border: "rgba(59,35,20,0.12)" },
    { icon: <Building2 size={22} color={T.green} />, label: "Manage Firms", sub: "Payments & vendor records", nav: "Payments", color: T.green, bg: "rgba(30,102,64,0.06)", border: "rgba(30,102,64,0.14)" },
  ];
  return (
    <section style={{ padding: "36px 48px 0" }}>
      <SectionHeader title="Quick Actions" actionText="" small />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {actions.map((a, i) => (
          <motion.button key={a.nav}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.09 }}
            whileHover={{ y: -5, boxShadow: "0 16px 48px rgba(74,6,27,0.12)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setNav(a.nav)}
            style={{ padding: "22px 20px", borderRadius: 20, border: `1px solid ${a.border}`, background: a.bg, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 10, position: "relative" }}
          >
            {a.badge && (
              <div style={{ position: "absolute", top: 14, right: 14, width: 22, height: 22, borderRadius: "50%", background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 11, color: "#fff" }}>{a.badge}</span>
              </div>
            )}
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.60)", border: `1px solid ${a.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {a.icon}
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: T.luxuryBrown, letterSpacing: "-0.1px", marginBottom: 3 }}>{a.label}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe }}>{a.sub}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: a.color, fontFamily: F.ui, fontWeight: 500, fontSize: 12 }}>
              Open <ChevronRight size={12} />
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA OVERVIEW — WEAVERS SECTION (simplified)
// ═══════════════════════════════════════════════════════════════════════════════
function SAWeaverSection() {
  return (
    <section style={{ padding: "48px 48px 40px", background: T.silkCream }}>
      <SectionHeader title="Active Weavers" actionText="View All Weavers →" />
      <div style={{ display: "flex", gap: 18, alignItems: "stretch" }}>
        {WEAVERS.map((w, i) => (
          <motion.div key={w.id}
            initial={{ opacity: 0, y: 44, scale: 0.90, filter: "blur(7px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            whileHover={{ y: -9, scale: 1.012, boxShadow: "0px 32px 80px rgba(74,6,27,0.18)" }}
            transition={{ type: "spring", stiffness: 240, damping: 22, delay: i * 0.12, opacity: { duration: 0.45 }, filter: { duration: 0.5 } }}
            style={{ flex: 1, background: T.warmIvory, borderRadius: 28, border: `1px solid ${T.borderDef}`, boxShadow: "0px 10px 40px rgba(74,6,27,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}
          >
            <div style={{ height: 160, flexShrink: 0, overflow: "hidden", position: "relative" }}>
              <motion.div whileHover={{ scale: 1.06 }} transition={{ duration: 0.5 }} style={{ width: "100%", height: "100%" }}>
                <ImageWithFallback src={w.img} alt={w.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} />
              </motion.div>
              <div style={{ position: "absolute", top: 12, right: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(255,253,249,0.92)", backdropFilter: "blur(8px)", border: `1px solid ${T.borderDef}` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: w.status === "In Progress" ? w.ac : T.taupe }} />
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 10.5, color: T.luxuryBrown, letterSpacing: "0.1px" }}>{w.status}</span>
              </div>
            </div>
            <div style={{ padding: "14px 20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: w.ac, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${w.ac}44` }}>
                  <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 13, color: T.warmCream }}>{w.name.split(" ").map((x: string) => x[0]).join("").slice(0, 2)}</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: T.luxuryBrown, lineHeight: 1.2, letterSpacing: "0.1px" }}>{w.name}</div>
                  <div style={{ fontFamily: F.mono, fontWeight: 400, fontSize: 10, color: T.taupe, letterSpacing: "0.8px" }}>{w.id}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 14 }}>
                {[
                  { k: "Sarees this month", v: String(w.sarees), mono: false },
                  { k: "Batch",             v: w.batch,          mono: true  },
                  { k: "Completion",        v: `${w.pct}%`,      mono: false },
                ].map(r => (
                  <div key={r.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11.5, color: T.taupe }}>{r.k}</span>
                    <span style={{ fontFamily: r.mono ? F.mono : F.ui, fontWeight: r.mono ? 500 : 600, fontSize: 11.5, color: r.mono ? T.royalBurgundy : T.luxuryBrown, letterSpacing: r.mono ? "0.8px" : "0.05px", ...NUM }}>{r.v}</span>
                  </div>
                ))}
              </div>
              <AnimatedBar pct={w.pct} color={`linear-gradient(to right, ${w.ac}, ${w.ac}BB)`} height={4} />
            </div>
          </motion.div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <motion.div whileHover={{ scale: 1.12, boxShadow: "0px 10px 30px rgba(74,6,27,0.16)" }} whileTap={{ scale: 0.93 }}
            style={{ width: 44, height: 44, borderRadius: "50%", background: T.warmIvory, border: `1.5px solid ${T.borderGold}`, boxShadow: "0px 6px 20px rgba(74,6,27,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          ><ChevronRight size={18} color={T.royalBurgundy} /></motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA OVERVIEW — RAW MATERIAL SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function SARawMaterial() {
  return (
    <section style={{ padding: "0 48px 72px", background: T.silkCream }}>
      <SectionHeader title="Raw Material Overview" actionText="View All Materials →" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {MATS.map((m, i) => (
          <motion.div key={m.name}
            initial={{ opacity: 0, scale: 0.88, y: 36, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            whileHover={{ y: -9, scale: 1.015, boxShadow: "0px 36px 88px rgba(74,6,27,0.17)" }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: i * 0.14, opacity: { duration: 0.45 }, filter: { duration: 0.55 } }}
            style={{ background: m.cardBg, borderRadius: 28, overflow: "hidden", border: `1px solid ${m.borderColor}`, boxShadow: "0px 10px 40px rgba(74,6,27,0.06)", cursor: "pointer" }}
          >
            <div style={{ height: 170, overflow: "hidden", position: "relative" }}>
              <motion.img src={m.img} alt={m.name} whileHover={{ scale: 1.06 }} transition={{ duration: 0.5 }}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: m.accent, opacity: 0.7 }} />
            </div>
            <div style={{ padding: "22px 24px 26px" }}>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 26, color: T.luxuryBrown, letterSpacing: "-0.2px", lineHeight: 1.1, marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, marginBottom: 20, letterSpacing: "0.1px" }}>{m.sub}</div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 38, color: m.accent, lineHeight: 1.0, marginBottom: 4, ...NUM }}>
                <AnimatedNumber raw={m.stock.replace(" kg", "")} />{m.stock.includes("kg") ? " kg" : ""}
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, marginBottom: 18, letterSpacing: "0.1px" }}>{m.note}</div>
              <AnimatedBar pct={m.pct}
                color={m.alert ? `linear-gradient(to right, ${T.royalBurgundy}, ${DARK_MAROON})` : `linear-gradient(to right, ${m.accent}CC, ${m.accent})`}
                trackBg={m.accentLight} height={5}
              />
              <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 999, background: m.tagBg, border: `1px solid ${m.borderColor}` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.tagCol }} />
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.tagCol, letterSpacing: "0.1px" }}>
                  {m.alert ? "⚠ Low Stock Alert" : "Stock Healthy"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SA OVERVIEW PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function SAOverviewPage({ setNav }: { setNav: (v: string) => void }) {
  return (
    <div style={{ background: T.silkCream }}>
      <SAHero />
      <SAMetricsBar />
      <SAAlertStrip />
      <div style={{ background: T.silkCream, paddingTop: 36 }}>
        <SAQuickActions setNav={setNav} />
      </div>
      <SAWeaverSection />
      <SARawMaterial />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// SUPERADMIN DASHBOARD (main export)
// ═══════════════════════════════════════════════════════════════════════════════
export function SuperadminDashboard({ onBack }: { onBack?: () => void } = {}) {
  const [nav, setNav] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  function renderPage(navigate: (v: string) => void) {
    switch (nav) {
      case "Materials":  return <MaterialsPage onNavigate={navigate} />;
      case "Weavers":    return <WeaversPage />;
      case "Production": return <ProductionPage superadmin />;
      case "Payments":   return <PaymentsPage />;
      case "Reports":    return <ReportsPage />;
      case "Customers":  return <CustomersPage />;
      case "Firms":      return <FirmsPage />;
      case "Inventory":  return <InventoryPage />;
      case "Batches":    return <BatchCreationPage />;
      case "Designs":    return <DesignLibraryPage />;
      case "Rates":      return <RatesPricingPage />;
      case "Approvals":  return <ApprovalsPage />;
      case "AuditLog":          return <AuditLogPage />;
      case "AddUser":           return <AddUserPage />;
      case "LabelSettings":     return <LabelSettingsPage />;
      case "ExternalPurchases": return <ExternalPurchasesPage />;
      case "IssueMaterial":     return <IssueMaterialPage />;
      case "ReceiveStock":      return <WorkerGRN />;
      case "QcHistory":         return <QcHistoryPage onBack={() => navigate("Production")} />;
      case "Notifications":     return <NotificationsPage />;
      default:                  return <SAOverviewPage setNav={navigate} />;
    }
  }

  const sections = PAGE_SECTIONS[nav];

  return (
    <div style={{ minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>
      <style>{`html, body { overflow-x: hidden; max-width: 100%; }`}</style>
      <style>{SECTION_NAV_GLOBAL_STYLE}</style>
      {isMobile ? (
        <>
          <SAMobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} activeTab={nav} setTab={setNav} />
          <SAMobileTopNav onMenuOpen={() => setMenuOpen(true)} onBack={onBack} />
          {sections && <SectionNavigator sections={sections} stickyTop={MOBILE_NAV_H} padding="0 18px" />}
          {renderPage(setNav)}
        </>
      ) : (
        <>
          <SATopNav active={nav} set={setNav} onBack={onBack} />
          {sections && <SectionNavigator sections={sections} stickyTop={MAIN_NAV_H + SUB_NAV_H} />}
          <AnimatePresence mode="wait">
            <motion.div key={nav}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              {renderPage(setNav)}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
