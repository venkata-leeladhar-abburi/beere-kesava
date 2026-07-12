import React, { useState, useEffect, useRef } from "react";
import { imgHero, imgWarp as _imgWarpLocal, imgResham as _imgReshamLocal, imgJari as _imgJariLocal } from "../constants/imageData";
import { useResponsive } from "./useResponsive";
import { MaterialsPage }  from "./MaterialsPage";
import { WeaversPage }    from "./WeaversPage";
import { ProductionPage } from "./ProductionPage";
import { PaymentsPage }   from "./PaymentsPage";
import { ReportsPage }    from "./ReportsPage";
import { CustomersPage }  from "./CustomersPage";
import { ProductionHistoryPage } from "./ProductionHistoryPage";
import { NotificationsPage } from "./NotificationsPage";
import { AllWeaversPage }   from "./AllWeaversPage";
import { AllStockPage }    from "./AllStockPage";
import { AllOrdersPage } from "./AllOrdersPage";
import { QcHistoryPage } from "./QcHistoryPage";
import { ExternalPurchasesPage } from "./ExternalPurchasesPage";
import { AddUserPage } from "./AddUserPage";
import { FirmsPage } from "./FirmsPage";
import { RatesPricingPage } from "./RatesPricingPage";
import { DesignLibraryPage } from "./DesignLibraryPage";
import { BatchCreationPage } from "./BatchCreationPage";
import { IssueMaterialPage } from "./IssueMaterialPage";
import { InventoryPage } from "./InventoryPage";
import { WorkerGRN } from "./worker/WorkerGRN";
import {
  SectionNavigator, PAGE_SECTIONS, SECTION_NAV_GLOBAL_STYLE,
  MAIN_NAV_H, SUB_NAV_H, MOBILE_NAV_H, SectionNavItem,
} from "./SectionNavigator";
import { motion, useInView, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  ChevronLeft, ChevronRight, ChevronDown, ArrowRight,
  Bell, Search, TrendingUp, SlidersHorizontal, Moon,
  Facebook, Instagram, Youtube, Linkedin, Menu,
  LogOut, UserRound, AlertTriangle, CheckCircle2, AlertCircle,
  Package, LayoutDashboard, Factory, IndianRupee, Users, Settings2,
} from "lucide-react";
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../constants/weaverImages";

const imgSaree       = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgShowroom    = "https://images.unsplash.com/photo-1756267318202-afebdffc107a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgWarp        = _imgWarpLocal;
const imgResham      = _imgReshamLocal;
const imgJari        = _imgJariLocal;
import { imgBKLogo } from "../constants/weaverImages";
import { imgSareeFooter } from "../constants/weaverImages";

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const T = {
  silkCream:      "#F7F2EA",
  warmIvory:      "#FFFDF9",
  royalBurgundy:  "#6E0F2D",
  darkBurgundy:   "#3D0E1A",
  deepWine:       "#4A061B",
  antiqueGold:    "#C89B47",
  goldLight:      "#E7C983",
  luxuryBrown:    "#3B2314",
  ivoryCream:     "#F7F2EA",
  pureWhite:      "#FFFDF9",
  crimson:        "#6E0F2D",
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
};

const DARK_MAROON = "#3D1020";

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function FadeUp({
  children, delay = 0, style,
}: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay, opacity: { duration: 0.45 } }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function FadeIn({
  children, delay = 0, style,
}: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : undefined}
      transition={{ duration: 0.65, delay }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function AnimatedBar({
  pct, color, height = 5, trackBg = "rgba(110,15,45,0.07)",
}: { pct: number; color: string; height?: number; trackBg?: string }) {
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
// CUSTOM ICONS
// ═══════════════════════════════════════════════════════════════════════════════
function IcoRawMaterial({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="7.5" cy="16" rx="5" ry="3.2" stroke={col} strokeWidth="1.4" />
      <ellipse cx="16.5" cy="16" rx="5" ry="3.2" stroke={col} strokeWidth="1.4" />
      <ellipse cx="12" cy="12" rx="4" ry="2.8" stroke={col} strokeWidth="1.4" />
      <path d="M12 9.2 C13 5 18.5 3.5 17.5 8" stroke={col} strokeWidth="1.4" />
      <path d="M14.5 5.5 C14 7 12.5 8.5 12 9.2" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}
function IcoYarnInventory({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20.5 L5.2 3 L8.8 3 L11 20.5Z" stroke={col} strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="3.4" y1="17"   x2="10.6" y2="17"   stroke={col} strokeWidth="1.1" />
      <line x1="4"   y1="13.5" x2="10"   y2="13.5" stroke={col} strokeWidth="1.1" />
      <line x1="4.6" y1="10"   x2="9.4"  y2="10"   stroke={col} strokeWidth="1.1" />
      <line x1="5.2" y1="6.5"  x2="8.8"  y2="6.5"  stroke={col} strokeWidth="1.1" />
      <path d="M13 20.5 L15.2 3 L18.8 3 L21 20.5Z" stroke={col} strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="13.4" y1="17"   x2="20.6" y2="17"   stroke={col} strokeWidth="1.1" />
      <line x1="14"   y1="13.5" x2="20"   y2="13.5" stroke={col} strokeWidth="1.1" />
      <line x1="14.6" y1="10"   x2="19.4" y2="10"   stroke={col} strokeWidth="1.1" />
      <line x1="15.2" y1="6.5"  x2="18.8" y2="6.5"  stroke={col} strokeWidth="1.1" />
    </svg>
  );
}
function IcoFabricRoll({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="7" cy="12" rx="4" ry="7" stroke={col} strokeWidth="1.4" />
      <line x1="7" y1="5"  x2="21" y2="4"  stroke={col} strokeWidth="1.4" />
      <line x1="7" y1="19" x2="21" y2="20" stroke={col} strokeWidth="1.4" />
      <line x1="21" y1="4" x2="21" y2="20" stroke={col} strokeWidth="1.4" />
      <line x1="11"   y1="4.4"  x2="11"   y2="19.6" stroke={col} strokeWidth="0.9" />
      <line x1="15"   y1="4.2"  x2="15"   y2="19.8" stroke={col} strokeWidth="0.9" />
      <line x1="18.5" y1="4.1"  x2="18.5" y2="19.9" stroke={col} strokeWidth="0.9" />
    </svg>
  );
}
function IcoQualityCheck({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 27 27" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3" width="15" height="19" rx="1.5" stroke={col} strokeWidth="1.4" />
      <path d="M8 3 L8 1 L13 1 L13 3" stroke={col} strokeWidth="1.3" />
      <line x1="6.5" y1="9"    x2="8.5"  y2="9"    stroke={col} strokeWidth="1.2" />
      <line x1="10"  y1="9"    x2="14.5" y2="9"    stroke={col} strokeWidth="1.2" />
      <line x1="6.5" y1="12.5" x2="8.5"  y2="12.5" stroke={col} strokeWidth="1.2" />
      <line x1="10"  y1="12.5" x2="14.5" y2="12.5" stroke={col} strokeWidth="1.2" />
      <line x1="6.5" y1="16"   x2="8.5"  y2="16"   stroke={col} strokeWidth="1.2" />
      <line x1="10"  y1="16"   x2="12.5" y2="16"   stroke={col} strokeWidth="1.2" />
      <circle cx="21" cy="21" r="5.5" stroke={col} strokeWidth="1.4" />
      <path d="M18 21 L20 23 L24.5 17.5" stroke={col} strokeWidth="1.7" />
    </svg>
  );
}
function IcoTruck({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="7" width="13" height="9" rx="1" stroke={col} strokeWidth="1.4" />
      <path d="M14 10.5 L14 16 L22.5 16 L22.5 11.5 L19.5 7.5 L14 7.5Z" stroke={col} strokeWidth="1.4" />
      <circle cx="5.5"  cy="17.5" r="1.7" stroke={col} strokeWidth="1.4" />
      <circle cx="18.5" cy="17.5" r="1.7" stroke={col} strokeWidth="1.4" />
    </svg>
  );
}
function IcoInvoice({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2 L15.5 2 L19 5.5 L19 22 L5 22 Z" stroke={col} strokeWidth="1.4" />
      <path d="M15.5 2 L15.5 5.5 L19 5.5" stroke={col} strokeWidth="1.3" />
      <line x1="8" y1="9"  x2="16" y2="9"  stroke={col} strokeWidth="1.2" />
      <line x1="8" y1="12" x2="16" y2="12" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}
function IcoResourceMgmt({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3.2" stroke={col} strokeWidth="1.4" />
      <path d="M2 21 C2 16.5 5 14 9 14 C10.2 14 11.3 14.3 12.3 14.9" stroke={col} strokeWidth="1.4" />
      <circle cx="18" cy="18" r="2.8" stroke={col} strokeWidth="1.3" />
      {[0,60,120,180,240,300].map((deg, i) => {
        const r = (deg * Math.PI) / 180;
        return <line key={i} x1={18+2.8*Math.cos(r)} y1={18+2.8*Math.sin(r)} x2={18+4.2*Math.cos(r)} y2={18+4.2*Math.sin(r)} stroke={col} strokeWidth="1.8" />;
      })}
    </svg>
  );
}
function IcoWarehouse({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 10 L12 3 L23 10" stroke={col} strokeWidth="1.4" />
      <rect x="3" y="10" width="18" height="12" stroke={col} strokeWidth="1.4" />
      <rect x="9.5" y="15" width="5" height="7" rx="0.5" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}
function IcoHandshake({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 17 L7 12 L10 12 L13.5 8.5" stroke={col} strokeWidth="1.4" />
      <path d="M2 17 C2 17 5 20 8 19.5 L13.5 19.5 C15.5 19.5 17 18 17 16 L13.5 12.5" stroke={col} strokeWidth="1.4" />
      <path d="M22 17 L17 12 L13.5 12" stroke={col} strokeWidth="1.4" />
      <path d="M22 17 C22 17 19 20 16 19.5" stroke={col} strokeWidth="1.4" />
    </svg>
  );
}
function IcoProductionPlan({ sz = 20, col = T.gold }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="1.5" stroke={col} strokeWidth="1.4" />
      <path d="M9 4 L9 2 L15 2 L15 4" stroke={col} strokeWidth="1.3" />
      <line x1="7"  y1="19" x2="7"  y2="13" stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="9"  stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17" y1="19" x2="17" y2="15" stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="5"  y1="19" x2="19" y2="19" stroke={col} strokeWidth="1.2" />
    </svg>
  );
}

function Lotus({ sz = 28, col = T.crimson }: { sz?: number; col?: string }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 32 32" fill="none">
      <path d="M16 3C16 3 10 9 10 15C10 18.31 12.69 21 16 21C19.31 21 22 18.31 22 15C22 9 16 3 16 3Z" fill={col} opacity=".9" />
      <path d="M16 21C16 21 7 15 3 18C3 18 6 26 16 28C26 26 29 18 29 18C25 15 16 21 16 21Z" fill={col} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHARTS — with entrance animations
// ═══════════════════════════════════════════════════════════════════════════════
function Donut({ pct = 72, size = 160 }: { pct?: number; size?: number }) {
  const r = 62, cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true });
  return (
    <div ref={wrapRef}>
      <svg width={size} height={size} viewBox="0 0 160 160">
        <defs>
          <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={T.royalBurgundy} />
            <stop offset="100%" stopColor={T.antiqueGold} />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(110,15,45,0.08)" strokeWidth="16" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(200,155,71,0.12)" strokeWidth="15" />
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="url(#donutGrad)"
          strokeWidth={15}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={inView ? { strokeDasharray: `${filled} ${circ - filled}` } : undefined}
          transition={{ duration: 1.8, delay: 0.35, ease: EASE }}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy - 4} textAnchor="middle"
          fontFamily={F.display} fontWeight="400" fontSize="42" fill={T.luxuryBrown}
          style={{ fontVariantNumeric: "tabular-nums" }}>{pct}%</text>
        <text x={cx} y={cy + 18} textAnchor="middle"
          fontFamily={F.ui} fontWeight="400" fontSize="10.5" fill={T.taupe} letterSpacing="0.5">
          Total Production
        </text>
      </svg>
    </div>
  );
}

const BARS = [
  { w: "W1", p: 155, d: 90  },
  { w: "W2", p: 225, d: 185 },
  { w: "W3", p: 265, d: 200 },
  { w: "W4", p: 210, d: 160 },
];

function BarChart() {
  const W = 380, H = 148, PB = 26, PT = 10, PL = 30;
  const iW = W - PL, iH = H - PB - PT;
  const maxV = 300;
  const yTicks = [0, 100, 200, 300];
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, margin: "-40px 0px" });
  return (
    <div ref={wrapRef}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={T.royalBurgundy} />
            <stop offset="100%" stopColor={DARK_MAROON} />
          </linearGradient>
          <linearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={T.goldLight} />
            <stop offset="100%" stopColor={T.antiqueGold} />
          </linearGradient>
        </defs>
        {yTicks.map(v => {
          const y = PT + iH * (1 - v / maxV);
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={W} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
              <text x={PL - 5} y={y + 3.5} textAnchor="end"
                fontFamily={F.ui} fontSize={8.5} fontWeight="500" fill={T.taupe}
                style={{ fontVariantNumeric: "tabular-nums" }}>{v}</text>
            </g>
          );
        })}
        {BARS.map((d, i) => {
          const gW = iW / BARS.length;
          const gx = PL + i * gW + gW / 2;
          const bW = 14, gap = 5;
          const baseY = PT + iH;
          const h1 = (d.p / maxV) * iH;
          const h2 = (d.d / maxV) * iH;
          return (
            <g key={`g${i}`}>
              <motion.rect
                x={gx - bW - gap / 2} width={bW} rx={5} fill="url(#barGrad1)"
                initial={{ y: baseY, height: 0 }}
                animate={inView ? { y: baseY - h1, height: h1 } : undefined}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.1, ease: EASE }}
              />
              <motion.rect
                x={gx + gap / 2} width={bW} rx={5} fill="url(#barGrad2)"
                initial={{ y: baseY, height: 0 }}
                animate={inView ? { y: baseY - h2, height: h2 } : undefined}
                transition={{ duration: 0.9, delay: 0.4 + i * 0.1, ease: EASE }}
              />
              <text x={gx} y={H - 6} textAnchor="middle"
                fontFamily={F.ui} fontSize={9} fontWeight="500" fill={T.taupe}>{d.w}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSIVE HOOK
// ═══════════════════════════════════════════════════════════════════════════════
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
// SHARED DATA
// ═══════════════════════════════════════════════════════════════════════════════
const METRICS = [
  { ico: <IcoResourceMgmt sz={22} col={T.warmCream} />, label: "Active Weavers",   val: "9",     sub: "↑ 12% vs last month", hi: false },
  { ico: <IcoFabricRoll   sz={22} col={T.warmCream} />, label: "Sarees Produced",  val: "248",   sub: "↑ 14% vs last month", hi: false },
  { ico: <IcoInvoice      sz={22} col={T.warmCream} />, label: "Pending Payments", val: "₹2.4L", sub: "2 overdue",           hi: true  },
  { ico: <IcoQualityCheck sz={22} col={T.warmCream} />, label: "Ready for Sale",   val: "84",    sub: "Sarees",              hi: false },
  { ico: <IcoTruck        sz={22} col={T.warmCream} />, label: "Dispatched",       val: "32",    sub: "Sarees this week",    hi: false },
];

const WEAVERS = [
  { name: "Padma Veni",   id: "WV-002", batch: "BATCH-086", sarees: 18, pct: 85, status: "In Progress" as const, ac: T.royalBurgundy, img: imgPadmaVeni   },
  { name: "Ravi Kumar",   id: "WV-001", batch: "BATCH-079", sarees: 12, pct: 68, status: "In Progress" as const, ac: "#1E6640",        img: imgRaviKumar   },
  { name: "Suresh Murti", id: "WV-007", batch: "BATCH-081", sarees: 7,  pct: 35, status: "Pending QC"  as const, ac: "#374151",        img: imgSureshMurti },
  { name: "Anand K.",     id: "WV-005", batch: "BATCH-083", sarees: 9,  pct: 72, status: "In Progress" as const, ac: T.antiqueGold,    img: imgAnandK      },
];

const MATS = [
  {
    name: "Warp", desc: "Base Thread used for weaving · Cotton and Silk types",
    stock: "142 kg in stock", note: "You can make approximately 284 sarees with this",
    pct: 72, barColor: T.royalBurgundy, stockColor: T.antiqueGold,
    badge: "✓ Stock is Healthy", green: true, img: imgWarp,
    extra: null as React.ReactNode,
  },
  {
    name: "Resham", desc: "Silk Thread used for design and colour · Multiple colours",
    stock: "180 kg in stock", note: "6 different colours currently available",
    pct: 85, barColor: T.antiqueGold, stockColor: T.antiqueGold,
    badge: "✓ Stock is Healthy", green: true, img: imgResham,
    extra: (
      <div style={{ display: "flex", gap: 6, margin: "10px 0 6px" }}>
        {["#B22222","#C89B47","#1E5C8A","#2D6B3A","#8B008B","#E8DCCB"].map((c, i) => (
          <div key={i} style={{ width: 17, height: 17, borderRadius: "50%", background: c, border: "1.5px solid rgba(0,0,0,0.10)" }} />
        ))}
      </div>
    ) as React.ReactNode,
  },
  {
    name: "Jari", desc: "Metallic Thread for borders and designs · Polyester and Silk Fast types",
    stock: "36 Buns (144 Reels)", note: "Polyester and Silk Fast · 5 Grades · 6 Colors",
    pct: 30, barColor: T.crimson, stockColor: T.crimson,
    badge: "⚠ Some Types Are Low — Check Alerts", green: false, img: imgJari,
    extra: (
      <div style={{ display: "flex", gap: 6, margin: "10px 0 6px" }}>
        {["Polyester","Silk Fast"].map(p => (
          <span key={p} style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase" as const, background: "rgba(139,112,96,0.10)", border: "1px solid rgba(139,112,96,0.18)", borderRadius: 6, padding: "4px 10px" }}>{p}</span>
        ))}
      </div>
    ) as React.ReactNode,
  },
];

type ActItem = { icon: React.ReactNode; bg: string; text: string; time: string; glow: string };
const ACT: ActItem[] = [
  { icon: <IcoWarehouse     sz={18} col={T.warmCream} />, bg: "#C0392B",       glow: "rgba(192,57,43,0.6)", text: "Shop Staff reported low stock — only 12 sarees remaining in shop. Review and arrange restocking.", time: "Just now" },
  { icon: <IcoResourceMgmt  sz={18} col={T.warmCream} />, bg: "#1E6640",       glow: "rgba(30,102,64,0.6)",  text: "Ravi Kumar completed 3 sarees — Batch 089",  time: "2h ago"         },
  { icon: <IcoYarnInventory sz={18} col={T.warmCream} />, bg: T.royalBurgundy, glow: "rgba(110,15,45,0.6)", text: "Jari stock below minimum threshold",          time: "4h ago"         },
  { icon: <IcoWarehouse     sz={18} col={T.warmCream} />, bg: "#1A5E4A",       glow: "rgba(26,94,74,0.6)",  text: "Worker issued 4kg warp to Padma Veni",        time: "Today, 9:30 AM" },
  { icon: <IcoQualityCheck  sz={18} col={T.warmCream} />, bg: "#1E6640",       glow: "rgba(30,102,64,0.6)", text: "12 sarees cleared QC — Batch 086",            time: "Yesterday"      },
  { icon: <IcoHandshake     sz={18} col={T.warmCream} />, bg: T.antiqueGold,   glow: "rgba(200,155,71,0.6)", text: "Customer Lakshmi Silks confirmed order",     time: "Yesterday"      },
  { icon: <IcoInvoice       sz={18} col={T.warmCream} />, bg: T.royalBurgundy, glow: "rgba(110,15,45,0.6)", text: "2 invoices overdue — ₹2.4L pending",          time: "2 days ago"     },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
function Label({ col, children, sz = 10, spacing = "2.5px" }: { col?: string; children: React.ReactNode; sz?: number; spacing?: string }) {
  return (
    <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: sz, color: col ?? T.taupe, letterSpacing: spacing, textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function Body({ col, children, s = 14 }: { col?: string; children: React.ReactNode; s?: number }) {
  return (
    <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: s, color: col ?? T.burgundy, lineHeight: 1.75 }}>
      {children}
    </span>
  );
}

function SectionHeader({ title, actionText = "View All →", small, onAction }: {
  title: string; action?: string; actionText?: string; small?: boolean; onAction?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, ease: EASE }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: small ? 18 : 32 }}
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
      <motion.button
        onClick={onAction}
        whileHover={{ scale: 1.04, backgroundColor: "rgba(110,15,45,0.06)", x: onAction ? 0 : 3 }}
        whileTap={onAction ? { scale: 0.97 } : undefined}
        transition={{ duration: 0.18 }}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: T.royalBurgundy,
          cursor: onAction ? "pointer" : "default",
          padding: "7px 16px", borderRadius: 10,
          border: `1px solid ${onAction ? "rgba(110,15,45,0.16)" : "transparent"}`,
          background: onAction ? "rgba(110,15,45,0.04)" : "rgba(0,0,0,0)",
          letterSpacing: "0.1px",
        }}
      >
        {actionText}
      </motion.button>
    </motion.div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48, scale: 0.92, filter: "blur(8px)", boxShadow: "0px 10px 40px rgba(74,6,27,0.07)" }}
      animate={inView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", boxShadow: "0px 10px 40px rgba(74,6,27,0.07)" } : undefined}
      whileHover={{ y: -7, scale: 1.008, boxShadow: "0px 32px 80px rgba(74,6,27,0.16)" }}
      transition={{
        type: "spring", stiffness: 240, damping: 22,
        opacity: { duration: 0.5 },
        filter: { duration: 0.55 },
      }}
      style={{
        background: T.warmIvory, borderRadius: 28, border: `1px solid ${T.borderDef}`,
        boxShadow: "0px 10px 40px rgba(74,6,27,0.07)", ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — TOP NAV (grouped)
// ═══════════════════════════════════════════════════════════════════════════════
type NavPage  = { key: string; label: string };
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
  ]},
];

// Drill-down pages reachable from within a page but not shown as their own nav pill —
// mapped to the group whose bar should stay highlighted while viewing them.
const NAV_GROUP_FALLBACK: Record<string, string> = {
  AllWeavers: "people",
  AllStock:   "materials",
  AllOrders:  "production",
};

function findNavGroup(pageKey: string): NavGroup {
  const direct = NAV_GROUPS.find(g => g.pages.some(p => p.key === pageKey));
  if (direct) return direct;
  const fallback = NAV_GROUP_FALLBACK[pageKey];
  return NAV_GROUPS.find(g => g.key === fallback) ?? NAV_GROUPS[0];
}


function TopNav({ active, set, onBack, sections }: { active: string; set: (v: string) => void; onBack?: () => void; sections?: SectionNavItem[] }) {
  const { w } = useResponsive();
  const compact = w < 1320;
  const [showNotif, setShowNotif] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unreadCount = 3;

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
          background: T.darkBurgundy,
          borderBottom: `1px solid rgba(200,155,71,0.14)`,
          boxShadow: "0 4px 40px rgba(0,0,0,0.28)",
        }}
      >
        {/* Logo + Brand */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 14, flexShrink: 0, cursor: "pointer" }}
        >
          <div style={{ width: compact ? 40 : 52, height: compact ? 40 : 52, borderRadius: 14, overflow: "hidden", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.30)", border: `1.5px solid rgba(200,155,71,0.30)` }}>
            <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          {!compact && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: T.warmCream, letterSpacing: "0.3px", lineHeight: 1 }}>
                Beere Kesava
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: "rgba(245,232,208,0.75)", letterSpacing: "0.2px" }}>
                &amp; Brothers Silks
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 8.5, color: T.antiqueGold, letterSpacing: "3px", textTransform: "uppercase" }}>
                Est. 1999
              </div>
            </div>
          )}
        </motion.div>

        {/* Group nav — scrolls internally if the viewport is too narrow to fit every group, so it
            can never force the page itself to overflow horizontally. */}
        <div className="admin-topnav-groups" style={{ display: "flex", height: "100%", alignItems: "stretch", gap: 0, overflowX: "auto", overflowY: "visible", minWidth: 0, scrollbarWidth: "none" } as React.CSSProperties}>
          <style>{`.admin-topnav-groups::-webkit-scrollbar { display: none; }`}</style>
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
                  whileHover={{ backgroundColor: "rgba(245,232,208,0.06)" }}
                  style={{
                    height: "100%", padding: compact ? "0 12px" : "0 20px", flexShrink: 0,
                    border: "none", backgroundColor: "rgba(0,0,0,0)", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Icon size={15} color={isActive ? T.warmCream : "rgba(245,232,208,0.55)"} />
                    <span style={{
                      fontFamily: F.ui, fontWeight: isActive ? 600 : 400, fontSize: 13.5,
                      color: isActive ? T.warmCream : "rgba(245,232,208,0.72)",
                      whiteSpace: "nowrap", letterSpacing: "0.1px",
                      transition: "color 0.2s",
                    }}>{g.label}</span>
                    {hasDropdown && (
                      <ChevronDown
                        size={12}
                        color={isActive ? "rgba(245,232,208,0.85)" : "rgba(245,232,208,0.45)"}
                        style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                      />
                    )}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="group-nav-underline"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      style={{ height: 2, width: "100%", background: T.royalBurgundy }}
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
                  background: "#FFFDF9", borderRadius: 16,
                  border: `1px solid rgba(110,15,45,0.10)`,
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
                      {p.label}
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
          <motion.button
            initial={{ backgroundColor: "rgba(245,232,208,0.06)" }}
            whileHover={{ scale: 1.08, backgroundColor: "rgba(245,232,208,0.12)" }}
            whileTap={{ scale: 0.94 }}
            style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid rgba(245,232,208,0.14)`, backgroundColor: "rgba(245,232,208,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Search size={15} color="rgba(245,232,208,0.75)" />
          </motion.button>
          )}
          <div style={{ position: "relative" }}>
            <motion.button
              onClick={() => setShowNotif(p => !p)}
              initial={{ backgroundColor: "rgba(245,232,208,0.06)" }}
              whileHover={{ scale: 1.08, backgroundColor: "rgba(245,232,208,0.12)" }}
              whileTap={{ scale: 0.94 }}
              style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid rgba(245,232,208,0.14)`, backgroundColor: "rgba(245,232,208,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
            >
              <Bell size={15} color={active === "Notifications" ? T.antiqueGold : "rgba(245,232,208,0.75)"} />
              {unreadCount > 0 && (
                <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: T.antiqueGold, border: `1.5px solid ${T.darkBurgundy}` }} />
              )}
            </motion.button>
            {showNotif && (
              <div style={{ position: "absolute", top: 48, right: 0, width: 360, background: "#FFFDF9", borderRadius: 16, border: `1px solid rgba(110,15,45,0.12)`, boxShadow: "0 16px 48px rgba(44,24,16,0.18)", zIndex: 200, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>Notifications</span>
                    <span style={{ background: T.royalBurgundy, color: "#FFFDF9", fontFamily: F.mono, fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 7px" }}>{unreadCount}</span>
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, cursor: "pointer" }}>Mark all read</span>
                </div>
                {/* Quick preview items */}
                {[
                  { Icon: AlertTriangle, iconColor: "#B91C1C", iconBg: "rgba(185,28,28,0.10)", title: "Low Stock Alert", body: "Only 12 sarees remaining in shop", time: "Just now", urgent: true },
                  { Icon: CheckCircle2,  iconColor: "#1E6640",  iconBg: "rgba(30,102,64,0.10)",  title: "Batch 089 Completed", body: "Ravi Kumar completed 3 sarees", time: "2h ago", urgent: false },
                  { Icon: AlertCircle,  iconColor: "#B45309",  iconBg: "rgba(180,83,9,0.10)",   title: "Jari Stock Low", body: "Below minimum threshold — 8 kg remaining", time: "4h ago", urgent: true },
                ].map((n, i) => (
                  <div key={i} onClick={() => { setShowNotif(false); set("Notifications"); }} style={{ padding: "12px 20px", background: n.urgent ? "rgba(192,57,43,0.03)" : "rgba(0,0,0,0)", borderBottom: `1px solid rgba(110,15,45,0.06)`, display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = n.urgent ? "rgba(192,57,43,0.03)" : "rgba(0,0,0,0)")}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: n.iconBg, border: `1px solid ${n.iconColor}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <n.Icon size={15} color={n.iconColor} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: n.urgent ? "#C0392B" : T.luxuryBrown, marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{n.body}</div>
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, flexShrink: 0, marginTop: 2 }}>{n.time}</span>
                  </div>
                ))}
                <div style={{ padding: "12px 20px", textAlign: "center" as const }}>
                  <span onClick={() => { setShowNotif(false); set("Notifications"); }} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
                    View all {unreadCount} notifications →
                  </span>
                </div>
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <motion.div
              onClick={() => { setShowProfile(p => !p); setShowNotif(false); }}
              initial={{ backgroundColor: "rgba(245,232,208,0.04)" }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.10)" }}
              whileTap={{ scale: 0.98 }}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 12px 6px 6px", borderRadius: 12, border: `1px solid ${showProfile ? T.antiqueGold : "rgba(245,232,208,0.14)"}`, backgroundColor: showProfile ? "rgba(245,232,208,0.10)" : "rgba(245,232,208,0.04)" }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 9, background: G.button, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px rgba(0,0,0,0.35)` }}>
                <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 13, color: T.warmCream }}>BK</span>
              </div>
              {!compact && <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: T.warmCream, letterSpacing: "0.1px" }}>Admin</span>}
              <ChevronDown size={13} color="rgba(245,232,208,0.75)" style={{ transform: showProfile ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </motion.div>
            {showProfile && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300, background: "#FFFDF9", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 240, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: G.button, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 3px 10px rgba(110,15,45,0.25)` }}>
                    <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 15, color: T.warmCream }}>BK</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>Admin User</div>
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 2 }}>Admin · Beere Kesava Silks</div>
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
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
            padding: compact ? "0 20px" : "0 56px",
            background: T.warmIvory,
            borderBottom: `1px solid ${T.borderDef}`,
          }}
        >
          <div className="admin-topnav-groups" style={{ display: "flex", alignItems: "center", gap: 4, background: "#F3EEE8", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 6, overflowX: "auto", flexShrink: 0 } as React.CSSProperties}>
            {activeGroup.pages.map(p => {
              const isActive = active === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => set(p.key)}
                  style={{
                    position: "relative",
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
                      layoutId="subnav-active-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      style={{ position: "absolute", inset: 0, background: T.royalBurgundy, borderRadius: 10, boxShadow: "0 4px 14px rgba(110,15,45,0.28)", zIndex: 0 }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1 }}>{p.label}</span>
                </button>
              );
            })}
          </div>

          {sections && (
            <>
              <div style={{ width: 1, height: 28, background: T.borderDef, flexShrink: 0 }} />
              <SectionNavigator inline sections={sections} />
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — HERO
// ═══════════════════════════════════════════════════════════════════════════════
function Hero() {
  return (
    <section style={{ position: "relative", height: "calc(100vh - 90px - 160px)", minHeight: 380, overflow: "hidden", background: "#0D0207" }}>
      {/* Ken Burns hero image — actual Beere Kesava showroom */}
      <motion.img
        src={imgHero}
        alt="Beere Kesava & Brothers Silks Showroom"
        initial={{ scale: 1.18, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 1 }}
        transition={{ duration: 10, ease: "linear", opacity: { duration: 1.4, ease: [0.22, 1, 0.36, 1] } }}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "62%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />

      {/* ── Gold sweep reveal line ── */}
      <motion.div
        initial={{ scaleX: 0, x: "-100%" }}
        animate={{ scaleX: 1, x: "200vw" }}
        transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute", top: 0, left: 0, width: "60%", height: "100%",
          background: "linear-gradient(to right, transparent 0%, rgba(200,155,71,0.06) 40%, rgba(200,155,71,0.12) 50%, rgba(200,155,71,0.06) 60%, transparent 100%)",
          pointerEvents: "none", zIndex: 8, transformOrigin: "left center",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #0D0207 0%, #0D0207 32%, rgba(13,2,7,0.97) 40%, rgba(13,2,7,0.88) 48%, rgba(13,2,7,0.55) 58%, rgba(13,2,7,0.18) 72%, rgba(13,2,7,0) 80%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to top, rgba(13,2,7,0.7) 0%, rgba(13,2,7,0) 100%)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.022) 60px, rgba(200,155,71,0.022) 61px)` }} />

      <div style={{ position: "relative", zIndex: 5, width: "50%", height: "100%", padding: "0 56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ width: 24, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9.5, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
            Since 1999 · Heritage Craftsmanship
          </span>
        </motion.div>

        {/* Headline lines — staggered clip reveal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { text: "Weaving",          italic: false, color: T.warmCream,   delay: 0.5  },
            { text: "Heritage",         italic: true,  color: T.antiqueGold, delay: 0.68 },
            { text: "Into Every Thread", italic: false, color: T.warmCream,   delay: 0.86 },
          ].map(({ text, italic, color, delay }) => (
            <div key={text} style={{ overflow: "hidden", lineHeight: "1.12" }}>
              <motion.div
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: F.display, fontWeight: 400, fontStyle: italic ? "italic" : "normal", fontSize: "clamp(36px, 3.8vw, 60px)", letterSpacing: "-0.5px", color }}
              >
                {text}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.90)", lineHeight: 1.85, margin: 0, maxWidth: 360, letterSpacing: "0.05px" }}
        >
          From the finest raw silk to masterful craftsmanship,<br />we deliver excellence at every step — for four generations.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.15, ease: EASE }}
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          <motion.button
            initial={{ boxShadow: "0px 8px 32px rgba(110,15,45,0.40)" }}
            whileHover={{ scale: 1.04, boxShadow: "0px 16px 48px rgba(110,15,45,0.55)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 28px", borderRadius: 16, border: "none", cursor: "pointer", background: G.button, fontFamily: F.ui, fontWeight: 600, fontSize: 13.5, color: T.warmCream, letterSpacing: "0.2px", boxShadow: `0 8px 32px rgba(110,15,45,0.40)` }}
          >
            Explore Production
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(245,232,208,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={13} color={T.warmCream} />
            </div>
          </motion.button>
          <motion.button
            initial={{ backgroundColor: "rgba(245,232,208,0.10)" }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.16)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "13px 22px", borderRadius: 16, cursor: "pointer", backgroundColor: "rgba(245,232,208,0.10)", border: "1px solid rgba(245,232,208,0.30)", fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: "rgba(245,232,208,0.92)", letterSpacing: "0.1px" }}
          >
            View Reports
          </motion.button>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}
        >
          <motion.svg
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            width="14" height="24" viewBox="0 0 14 24" fill="none"
          >
            <rect x="1" y="1" width="12" height="22" rx="6" stroke="rgba(245,232,208,0.22)" strokeWidth="1.5" />
            <rect x="5.5" y="5" width="3" height="6" rx="1.5" fill="rgba(200,155,71,0.50)" />
          </motion.svg>
          <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 9, color: "rgba(245,232,208,0.28)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Scroll to Explore</span>
        </motion.div>
      </div>

      <div style={{ position: "absolute", right: 24, top: "40%", transform: "translateY(-50%)", zIndex: 6, display: "flex", flexDirection: "column", gap: 10 }}>
        {[SlidersHorizontal, Moon].map((Icon, i) => (
          <motion.button
            key={i}
            initial={{ backgroundColor: "rgba(245,232,208,0.07)" }}
            whileHover={{ scale: 1.1, backgroundColor: "rgba(245,232,208,0.12)" }}
            whileTap={{ scale: 0.93 }}
            style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(245,232,208,0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(245,232,208,0.10)", boxShadow: "0 4px 16px rgba(0,0,0,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon size={15} color="rgba(245,232,208,0.55)" />
          </motion.button>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — METRICS BAR
// ═══════════════════════════════════════════════════════════════════════════════
function MetricsBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
      style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: G.card, borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {METRICS.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 22px",
              backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              backgroundColor: "rgba(0,0,0,0)",
              borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative",
              cursor: "pointer",
            }}
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ duration: 0.25 }}
              style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {m.ico}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.hi ? T.goldLight : T.warmCream, lineHeight: 1.0, marginBottom: 8, ...NUM }}>
                <AnimatedNumber raw={m.val} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                  {m.sub}
                </span>
                {m.hi && (
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    style={{ width: 20, height: 20, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.38)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(200,155,71,0.10)" }}
                  >
                    <ChevronRight size={10} color={T.goldLight} />
                  </motion.div>
                )}
              </div>
            </div>
            {m.hi && <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — THREE-COLUMN SECTION
// ═══════════════════════════════════════════════════════════════════════════════
const PROG_BARS = [
  { label: "Production", pct: 72, color: "#6B1A2A" },
  { label: "Inventory",  pct: 84, color: "#C4923A" },
  { label: "Payments",   pct: 46, color: "#A0506A" },
];

function ProductionProgress() {
  return (
    <Card style={{ flex: "0 0 26%", display: "flex", flexDirection: "column", padding: "32px" }}>
      <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: T.luxuryBrown, marginBottom: 26, letterSpacing: "-0.1px", lineHeight: 1.15 }}>
        Production Progress
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}><Donut /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: "auto" }}>
        {PROG_BARS.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12.5, color: T.taupe, letterSpacing: "0.1px" }}>{b.label}</span>
              <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown, ...NUM }}>{b.pct}%</span>
            </div>
            <AnimatedBar pct={b.pct} color={b.color} />
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function SareesProduced({ compact }: { compact?: boolean }) {
  const [period, setPeriod] = useState("Month");
  return (
    <Card style={{ flex: compact ? undefined : "0 0 44%", display: "flex", flexDirection: "column", padding: compact ? "24px 24px 0" : "32px 32px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 18 : 20, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>
          Sarees Produced
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {["Week","Month","Quarter"].map(p => (
            <motion.button
              key={p}
              onClick={() => setPeriod(p)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{ padding: "5px 11px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: F.ui, fontWeight: 500, fontSize: 11, letterSpacing: "0.1px", background: period === p ? G.button : "rgba(110,15,45,0.06)", color: period === p ? T.warmCream : T.taupe, transition: "all 0.18s" }}
            >
              {p}
            </motion.button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 48 : 60, color: T.luxuryBrown, lineHeight: 1.0, ...NUM }}>
          <AnimatedNumber raw="248" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <TrendingUp size={12} color={T.green} />
          <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11.5, color: T.green, letterSpacing: "0.1px" }}>14% from last month</span>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 130 }}><BarChart /></div>
      <div style={{ display: "flex", gap: 22, paddingBottom: 14 }}>
        {[{ dot: T.royalBurgundy, label: "Produced" }, { dot: T.antiqueGold, label: "Dispatched" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.dot, flexShrink: 0 }} />
            <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11.5, color: T.taupe }}>{l.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", borderTop: `1px solid ${T.borderDef}`, paddingTop: 20, paddingBottom: 28 }}>
        {[{ num: "7", label: "Active Batches" }, { num: "6", label: "Weavers Working" }, { num: "84", label: "In Stock" }].map((s, i) => (
          <div key={s.label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none" }}>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 34, color: T.luxuryBrown, lineHeight: 1.1, ...NUM }}>
              <AnimatedNumber raw={s.num} />
            </div>
            <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: T.taupe, marginTop: 3, letterSpacing: "0.1px" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FeaturedProduct({ compact }: { compact?: boolean }) {
  return (
    <Card style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
      <div style={{ padding: compact ? "20px 20px 0" : "32px 32px 0" }}>
        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 18 : 20, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Featured Product</span>
      </div>
      <div style={{ position: "relative", margin: "16px 0 0", flexShrink: 0, overflow: "hidden" }}>
        <motion.img
          src={imgSaree}
          alt="Silk Saree"
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.5 }}
          style={{ width: "100%", height: compact ? 180 : 200, objectFit: "cover", display: "block" }}
        />
        {[{ side: "left", Icon: ChevronLeft }, { side: "right", Icon: ChevronRight }].map(({ side, Icon }) => (
          <motion.div
            key={side}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
            style={{ position: "absolute", [side]: 14, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(255,253,249,0.92)", backdropFilter: "blur(8px)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon size={14} color={T.luxuryBrown} />
          </motion.div>
        ))}
      </div>
      <div style={{ padding: compact ? "12px 20px 10px" : "14px 32px 12px" }}>
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 16 : 18, color: T.luxuryBrown, lineHeight: 1.2 }}>
          Silk Saree – Design BKB-045
        </div>
        <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11.5, color: T.taupe, marginTop: 3, letterSpacing: "0.1px" }}>
          Cream · Gold Zari Border
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
          <div style={{ width: 22, height: 5, borderRadius: 3, background: T.royalBurgundy }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(0,0,0,0.12)" }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(0,0,0,0.12)" }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: `1px solid ${T.borderDef}`, marginTop: "auto" }}>
        {[
          { label: "Weavers",  val: "6 active",   vc: T.luxuryBrown,  rb: true,  bb: true  },
          { label: "Designs",  val: "24 codes",   vc: T.luxuryBrown,  rb: false, bb: true  },
          { label: "QC Pass",  val: "96%",        vc: T.green,        rb: true,  bb: false },
          { label: "Overdue",  val: "2 invoices", vc: "#C0392B", rb: false, bb: false, alert: true },
        ].map(s => (
          <div key={s.label} style={{ padding: compact ? "12px 16px" : "16px 24px", borderRight: s.rb ? `1px solid ${T.borderDef}` : "none", borderBottom: s.bb ? `1px solid ${T.borderDef}` : "none" }}>
            <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9.5, color: T.taupe, marginBottom: 5, textTransform: "uppercase", letterSpacing: "1.5px" }}>{s.label}</div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: compact ? 17 : 19, color: s.vc, lineHeight: 1.1, ...NUM, display: "flex", alignItems: "center", gap: 5 }}>
              {(s as any).alert && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C0392B", flexShrink: 0, display: "inline-block" }} />}
              {s.val}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ThreeCol({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <section style={{ padding: "56px 48px 36px", background: T.silkCream }}>
      <SectionHeader title="Performance Overview" actionText="Full Analytics →" onAction={() => onNavigate("Reports")} />
      <div style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
        <ProductionProgress />
        <SareesProduced />
        <FeaturedProduct />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — ACTIVITY STRIP
// ═══════════════════════════════════════════════════════════════════════════════
function ActivityStrip({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  return (
    <section style={{ padding: "0 48px 60px", background: T.silkCream }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.75, ease: EASE }}
        style={{ background: G.card, borderRadius: 28, padding: "34px 32px 38px", boxShadow: "0 20px 60px rgba(74,6,27,0.18)", border: "1px solid rgba(200,155,71,0.10)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: G.gold }} />
              <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 26, color: T.warmCream, letterSpacing: "-0.2px" }}>Recent Activity</span>
            </div>
            <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(245,232,208,0.75)", paddingLeft: 13, letterSpacing: "0.1px" }}>Live operational feed</span>
          </div>
          <motion.button
            onClick={() => onNavigate("Notifications")}
            whileHover={{ scale: 1.04, backgroundColor: "rgba(200,155,71,0.14)" }}
            whileTap={{ scale: 0.97 }}
            style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.antiqueGold, cursor: "pointer", padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(200,155,71,0.28)", backgroundColor: "rgba(200,155,71,0.07)", letterSpacing: "0.2px" }}
          >
            View All Activity →
          </motion.button>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {ACT.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 36, scale: 0.88, filter: "blur(7px)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", backgroundColor: "rgba(255,255,255,0.04)" }}
              animate={inView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", backgroundColor: "rgba(255,255,255,0.04)" } : undefined}
              whileHover={{ y: -7, scale: 1.025, boxShadow: `0px 22px 56px ${a.glow}`, backgroundColor: "rgba(255,255,255,0.08)" }}
              transition={{
                type: "spring", stiffness: 260, damping: 22,
                delay: 0.1 + i * 0.1,
                opacity: { duration: 0.4 }, filter: { duration: 0.5 },
              }}
              style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.04)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", border: "1px solid rgba(245,232,208,0.09)", borderRadius: 20, padding: "22px 20px 20px", display: "flex", flexDirection: "column", gap: 14, minHeight: 175, position: "relative", overflow: "hidden", cursor: "pointer" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: a.bg, opacity: 0.70 }} />
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.25 }}
                style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: a.bg, boxShadow: `0 4px 18px ${a.glow}`, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {a.icon}
              </motion.div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: "rgba(245,232,208,0.97)", lineHeight: 1.65, flex: 1, letterSpacing: "0.05px" }}>{a.text}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.bg, boxShadow: `0 0 8px ${a.glow}` }} />
                <span style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(245,232,208,0.70)", letterSpacing: "0.3px" }}>{a.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — WEAVERS
// ═══════════════════════════════════════════════════════════════════════════════
function WeaverSection({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <section style={{ padding: "0 48px 64px", background: T.silkCream }}>
      <SectionHeader title="Active Weavers" actionText="View All Weavers →" onAction={() => onNavigate("AllWeavers")} />
      <div style={{ display: "flex", gap: 18, alignItems: "stretch", position: "relative" }}>
        {WEAVERS.map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 44, scale: 0.90, filter: "blur(7px)", boxShadow: "0px 10px 40px rgba(74,6,27,0.06)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", boxShadow: "0px 10px 40px rgba(74,6,27,0.06)" }}
            viewport={{ once: true, margin: "-60px" }}
            whileHover={{ y: -9, scale: 1.012, boxShadow: "0px 32px 80px rgba(74,6,27,0.18)" }}
            transition={{
              type: "spring", stiffness: 240, damping: 22,
              delay: i * 0.12,
              opacity: { duration: 0.45 }, filter: { duration: 0.5 },
            }}
            style={{ flex: 1, background: T.warmIvory, borderRadius: 28, border: `1px solid ${T.borderDef}`, boxShadow: "0px 10px 40px rgba(74,6,27,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }}
          >
            <div style={{ height: 160, flexShrink: 0, overflow: "hidden", position: "relative" }}>
              <motion.div
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.5 }}
                style={{ width: "100%", height: "100%" }}
              >
                <ImageWithFallback
                  key={w.img}
                  src={w.img}
                  alt={w.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
                />
              </motion.div>
              <div style={{ position: "absolute", top: 12, right: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(255,253,249,0.92)", backdropFilter: "blur(8px)", border: `1px solid ${T.borderDef}` }}>
                <div className={w.status === "In Progress" ? "pulse-dot" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: w.status === "In Progress" ? w.ac : T.taupe, boxShadow: w.status === "In Progress" ? `0 0 6px ${w.ac}` : "none" }} />
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 10.5, color: T.luxuryBrown, letterSpacing: "0.1px" }}>{w.status}</span>
              </div>
            </div>
            <div style={{ padding: "14px 20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: w.ac, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${w.ac}44` }}>
                  <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 13, color: T.warmCream }}>
                    {w.name.split(" ").map(x => x[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: T.luxuryBrown, lineHeight: 1.2, letterSpacing: "0.1px" }}>{w.name}</div>
                  <div style={{ fontFamily: F.mono, fontWeight: 400, fontSize: 10, color: T.taupe, letterSpacing: "0.8px" }}>{w.id}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 14 }}>
                {[
                  { k: "Sarees this month", v: String(w.sarees), isMono: false },
                  { k: "Batch",             v: w.batch,          isMono: true  },
                  { k: "Completion",        v: `${w.pct}%`,      isMono: false },
                ].map(r => (
                  <div key={r.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11.5, color: T.taupe, letterSpacing: "0.05px" }}>{r.k}</span>
                    <span style={{ fontFamily: r.isMono ? F.mono : F.ui, fontWeight: r.isMono ? 500 : 600, fontSize: 11.5, color: r.isMono ? T.royalBurgundy : T.luxuryBrown, letterSpacing: r.isMono ? "0.8px" : "0.05px", ...NUM }}>
                      {r.v}
                    </span>
                  </div>
                ))}
              </div>
              <AnimatedBar pct={w.pct} color={`linear-gradient(to right, ${w.ac}, ${w.ac}BB)`} height={4} />
            </div>
          </motion.div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <motion.div
            whileHover={{ scale: 1.12, boxShadow: "0px 10px 30px rgba(74,6,27,0.16)" }}
            whileTap={{ scale: 0.93 }}
            style={{ width: 44, height: 44, borderRadius: "50%", background: T.warmIvory, border: `1.5px solid ${T.borderGold}`, boxShadow: "0px 6px 20px rgba(74,6,27,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ChevronRight size={18} color={T.royalBurgundy} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — RAW MATERIAL
// ═══════════════════════════════════════════════════════════════════════════════
function RawMaterial({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <section style={{ padding: "0 48px 72px", background: T.silkCream }}>
      <SectionHeader title="Raw Material Overview" actionText="View All Materials →" onAction={() => onNavigate("Materials")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
        {MATS.map((m, i) => (
          <FadeUp key={m.name} delay={i * 0.1} style={{ height: "100%" }}>
            <motion.div
              onClick={() => onNavigate("Materials")}
              initial={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              animate={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              whileHover={{ y: -6, boxShadow: "0px 28px 72px rgba(74,6,27,0.15)" }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              style={{ background: T.warmIvory, borderRadius: 22, border: `1px solid ${T.borderDef}`, overflow: "hidden", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <div style={{ height: 180, flexShrink: 0, overflow: "hidden" }}>
                <motion.img
                  src={m.img}
                  alt={m.name}
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div style={{ padding: "26px 28px 28px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 24, color: T.luxuryBrown, marginBottom: 6 }}>{m.name}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 4 }}>{m.desc}</div>
                <div style={{ minHeight: 38 }}>{m.extra}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: m.stockColor, lineHeight: 1, margin: "18px 0 8px" }}>{m.stock}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: m.green ? T.taupe : T.crimson, lineHeight: 1.55, marginBottom: 18 }}>{m.note}</div>
                <div style={{ marginBottom: 10 }}>
                  <AnimatedBar pct={m.pct} color={m.barColor} height={6} />
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.taupe, marginBottom: 18 }}>{m.pct}% of your storage capacity</div>
                <div style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", gap: 8, background: m.green ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.08)", border: `1px solid ${m.green ? "rgba(30,102,64,0.20)" : "rgba(192,57,43,0.20)"}`, borderRadius: 10, padding: "6px 14px" }}>
                  <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: m.green ? T.green : T.crimson }}>{m.badge}</span>
                </div>
              </div>
            </motion.div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP — FOOTER
// ═══════════════════════════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer style={{ background: T.silkCream }}>
      <FadeUp style={{ padding: "0 48px" }}>
        <div style={{ background: G.card, borderRadius: 28, overflow: "hidden", display: "flex", alignItems: "stretch", position: "relative", height: 180, boxShadow: "0 20px 60px rgba(74,6,27,0.20)", border: "1px solid rgba(200,155,71,0.12)" }}>
          <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />
          <div style={{ flex: "0 0 40%", display: "flex", alignItems: "center", gap: 20, padding: "0 36px", zIndex: 2 }}>
            <motion.div
              whileHover={{ scale: 1.06, boxShadow: "0px 0px 32px rgba(200,155,71,0.32)" }}
              style={{ width: 54, height: 54, borderRadius: 16, overflow: "hidden", flexShrink: 0, border: "1.5px solid rgba(200,155,71,0.32)", boxShadow: "0px 0px 24px rgba(200,155,71,0.18)" }}
            >
              <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "sepia(1) saturate(3) hue-rotate(340deg) brightness(1.2)" }} />
            </motion.div>
            <div>
              <div style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 400, fontSize: 27, color: T.warmCream, lineHeight: 1.2, marginBottom: 2 }}>Crafted with Pride.</div>
              <div style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 400, fontSize: 27, color: T.antiqueGold, lineHeight: 1.2 }}>Delivered with Trust.</div>
            </div>
          </div>
          <div style={{ flex: "0 0 28%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px 0 0", zIndex: 2 }}>
            <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(245,232,208,0.88)", lineHeight: 1.85, margin: "0 0 18px", letterSpacing: "0.05px" }}>
              Four generations of passion,<br />woven into every creation.
            </p>
            <motion.button
              initial={{ backgroundColor: "rgba(200,155,71,0.09)" }}
              whileHover={{ scale: 1.04, backgroundColor: "rgba(200,155,71,0.16)" }}
              whileTap={{ scale: 0.97 }}
              style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 16, border: "1px solid rgba(200,155,71,0.32)", backgroundColor: "rgba(200,155,71,0.09)", cursor: "pointer", fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: T.goldLight, letterSpacing: "0.1px" }}
            >
              Know Our Story <ArrowRight size={12} color={T.goldLight} />
            </motion.button>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "60%", background: `linear-gradient(to right, #2C0913 0%, rgba(44,9,19,0.7) 35%, rgba(44,9,19,0) 100%)`, zIndex: 1 }} />
            <motion.img
              src={imgSareeFooter}
              alt="Luxury Silk Saree"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.6 }}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
            />
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={0.1} style={{ padding: "36px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.borderGold}` }}>
              <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 15, color: T.luxuryBrown, letterSpacing: "0.2px" }}>Beere Kesava</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: T.taupe, letterSpacing: "0.1px" }}>&amp; Brothers Silks</div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 8.5, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase" }}>Est. 1999</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {["About Us","Our Legacy","Sustainability","Careers","Contact Us"].map(l => (
              <motion.span
                key={l}
                whileHover={{ opacity: 1 }}
                style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.luxuryBrown, cursor: "pointer", opacity: 0.70, letterSpacing: "0.1px" }}
              >
                {l}
              </motion.span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {([Facebook, Instagram, Youtube, Linkedin] as const).map((Icon, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.14, y: -3, boxShadow: "0px 6px 20px rgba(74,6,27,0.14)" }}
                whileTap={{ scale: 0.93 }}
                style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${T.borderDef}`, background: T.warmIvory, boxShadow: "0px 0px 0px rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Icon size={14} color={T.luxuryBrown} />
              </motion.div>
            ))}
          </div>
        </div>
      </FadeUp>
      <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "28px 48px 0", padding: "18px 0 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, opacity: 0.75, letterSpacing: "0.1px" }}>© 1999 Beere Kesava &amp; Brothers Silks. All rights reserved.</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Lotus sz={14} col={T.antiqueGold} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 11, color: T.antiqueGold, letterSpacing: "2px", opacity: 0.75, textTransform: "uppercase" }}>Tradition · Trust · Timeless Quality</span>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — MENU DRAWER
// ═══════════════════════════════════════════════════════════════════════════════
function MobileMenuDrawer({ open, onClose, activeTab, setTab }: {
  open: boolean; onClose: () => void; activeTab: string; setTab: (v: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(58,18,28,0.55)", backdropFilter: "blur(3px)" }}
          />
          {/* Drawer panel */}
          <motion.div
            key="drawer"
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
            {/* Drawer header */}
            <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: G.button, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", border: "1.5px solid rgba(200,155,71,0.40)" }}>
                  <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 15, color: T.warmCream, lineHeight: 1.1 }}>Beere Kesava</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9, color: "rgba(231,201,131,0.85)", letterSpacing: "2px", textTransform: "uppercase" }}>Est. 1999</div>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid rgba(245,232,208,0.20)", background: "rgba(245,232,208,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="rgba(245,232,208,0.85)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </motion.button>
            </div>

            {/* Gold accent bar */}
            <div className="gold-bar-shimmer" style={{ height: 2, flexShrink: 0 }} />

            {/* Nav items — grouped */}
            <div style={{ flex: 1, padding: "10px 12px" }}>
              {NAV_GROUPS.map((group, gi) => {
                const GroupIcon = group.icon;
                const isGroupActive = findNavGroup(activeTab).key === group.key;
                return (
                  <div key={group.key} style={{ marginBottom: 10 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 10px 8px",
                    }}>
                      <GroupIcon size={16} color={isGroupActive ? T.royalBurgundy : T.taupe} />
                      <span style={{
                        fontFamily: F.ui, fontWeight: 700, fontSize: 13,
                        color: isGroupActive ? T.royalBurgundy : T.luxuryBrown,
                        letterSpacing: "0.3px", textTransform: "uppercase" as const,
                      }}>
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
                            width: "100%", display: "flex", alignItems: "center", gap: 12,
                            padding: "11px 14px 11px 30px", borderRadius: 12, marginBottom: 3,
                            border: isActive ? `1px solid ${T.borderMed}` : "1px solid transparent",
                            background: isActive ? `linear-gradient(135deg, rgba(110,15,45,0.08) 0%, rgba(200,155,71,0.06) 100%)` : "transparent",
                            cursor: "pointer", textAlign: "left",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: F.ui, fontWeight: isActive ? 600 : 400, fontSize: 14, color: isActive ? T.royalBurgundy : T.luxuryBrown, letterSpacing: "0.05px" }}>
                              {page.label}
                            </div>
                          </div>
                          {isActive && <ChevronRight size={13} color={T.royalBurgundy} />}
                        </motion.button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Drawer footer */}
            <div style={{ padding: "16px 20px 28px", borderTop: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: G.button, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px rgba(110,15,45,0.28)` }}>
                  <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 12, color: T.warmCream }}>BK</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.luxuryBrown }}>Admin</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 10.5, color: T.taupe }}>Administrator</div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — TOP NAV
// ═══════════════════════════════════════════════════════════════════════════════
function MobileTopNav({ onMenuOpen, onBack }: { onMenuOpen: () => void; onBack?: () => void }) {
  const [showProfile, setShowProfile] = React.useState(false);
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{ position: "sticky", top: 0, zIndex: 100, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: "rgba(255,253,249,0.96)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" as any, borderBottom: `1px solid rgba(110,15,45,0.08)`, boxShadow: "0 2px 20px rgba(74,6,27,0.05)" }}
    >
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onMenuOpen}
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
          <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 9, color: T.taupe, letterSpacing: "0.2px" }}>&amp; Brothers Silks · Est. 1999</div>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <motion.button
          onClick={() => setShowProfile(p => !p)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${showProfile ? T.royalBurgundy : T.borderDef}`, background: G.button, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px rgba(110,15,45,0.28)` }}
        >
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 12, color: T.warmCream }}>BK</span>
        </motion.button>
        {showProfile && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300, background: "#FFFDF9", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 8px 32px rgba(44,24,16,0.14)", minWidth: 210, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${T.borderDef}` }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Admin User</div>
              <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, marginTop: 2 }}>Admin · Beere Kesava Silks</div>
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
// MOBILE — HERO
// ═══════════════════════════════════════════════════════════════════════════════
function MobileHero() {
  return (
    <section style={{ position: "relative", height: 320, overflow: "hidden", background: "#0D0207" }}>
      <motion.img
        src={imgShowroom}
        alt="Showroom"
        initial={{ scale: 1.18, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 1 }}
        transition={{ duration: 10, ease: "linear", opacity: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "55%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />
      {/* ── Gold sweep reveal ── */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "200vw" }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, transparent 0%, rgba(200,155,71,0.08) 45%, rgba(200,155,71,0.14) 50%, rgba(200,155,71,0.08) 55%, transparent 100%)",
          pointerEvents: "none", zIndex: 8,
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #0D0207 0%, #0D0207 38%, rgba(13,2,7,0.92) 50%, rgba(13,2,7,0.5) 65%, rgba(13,2,7,0.1) 80%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(200,155,71,0.022) 50px, rgba(200,155,71,0.022) 51px)`, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "relative", zIndex: 5, height: "100%", padding: "28px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.3, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <div style={{ width: 18, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 8.5, color: "rgba(200,155,71,0.78)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Tradition. Trust. Timeless Quality.</span>
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { text: "Weaving",           italic: false, color: T.warmCream   },
            { text: "Heritage",          italic: true,  color: T.antiqueGold },
            { text: "Into Every Thread", italic: false, color: T.warmCream   },
          ].map(({ text, italic, color }, i) => (
            <div key={text} style={{ overflow: "hidden", lineHeight: "1.12" }}>
              <motion.div
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.85, delay: 0.45 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: F.display, fontWeight: 400,
                  fontStyle: italic ? "italic" : "normal",
                  fontSize: "clamp(28px, 7vw, 38px)", letterSpacing: "-0.2px", color,
                }}
              >
                {text}
              </motion.div>
            </div>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.95 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12.5, color: "rgba(245,232,208,0.90)", lineHeight: 1.8, margin: 0, maxWidth: 240, letterSpacing: "0.05px" }}
        >
          From the finest raw silk to masterful craftsmanship — four generations of excellence.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1, ease: EASE }}
          style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 14, border: "none", cursor: "pointer", background: G.button, fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.warmCream, letterSpacing: "0.1px", boxShadow: `0 6px 20px rgba(110,15,45,0.38)` }}
          >
            Explore Production <ChevronRight size={12} color={T.warmCream} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "inline-flex", alignItems: "center", padding: "10px 16px", borderRadius: 14, cursor: "pointer", background: "rgba(245,232,208,0.12)", border: "1px solid rgba(245,232,208,0.30)", fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: "rgba(245,232,208,0.92)", letterSpacing: "0.1px" }}
          >
            View Reports
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — METRICS
// ═══════════════════════════════════════════════════════════════════════════════
function MobileMetrics() {
  const normal = METRICS.filter(m => !m.hi);
  const highlighted = METRICS.find(m => m.hi)!;
  const top2 = normal.slice(0, 2);
  const bot2 = normal.slice(2, 4);

  const SmallCard = ({ m, delay = 0 }: { m: typeof METRICS[0]; delay?: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true });
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 18 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.55, delay, ease: EASE }}
        style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 8 }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(245,232,208,0.10)", border: "1px solid rgba(245,232,208,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {m.ico}
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 36, color: T.warmCream, lineHeight: 1.0, ...NUM }}>
          <AnimatedNumber raw={m.val} />
        </div>
        <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10, color: "rgba(245,232,208,0.92)", letterSpacing: "1.6px", textTransform: "uppercase" }}>{m.label}</div>
        <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: "rgba(245,232,208,0.85)", letterSpacing: "0.05px" }}>{m.sub}</div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
      style={{ padding: "0 16px 16px", marginTop: -20, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: G.card, borderRadius: 22, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.13)" }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(245,232,208,0.12)" }}>
          <SmallCard m={top2[0]} delay={0.5} />
          <div style={{ width: 1, background: "rgba(245,232,208,0.12)" }} />
          <SmallCard m={top2[1]} delay={0.6} />
        </div>
        {/* Highlighted Payments */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          style={{ padding: "20px 18px 18px", background: "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.08) 100%)", borderBottom: "1px solid rgba(245,232,208,0.10)", position: "relative" }}
        >
          <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(200,155,71,0.18)", border: "1px solid rgba(200,155,71,0.42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {highlighted.ico}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 10, color: "rgba(200,155,71,1)", letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 4 }}>{highlighted.label}</div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 38, color: T.goldLight, lineHeight: 1.0, ...NUM }}>
                <AnimatedNumber raw={highlighted.val} />
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: "rgba(231,201,131,0.95)", marginBottom: 8, letterSpacing: "0.05px" }}>{highlighted.sub}</div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.38)", background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginLeft: "auto" }}
              >
                <ChevronRight size={13} color={T.goldLight} />
              </motion.div>
            </div>
          </div>
        </motion.div>
        <div style={{ display: "flex", borderTop: "1px solid rgba(245,232,208,0.12)" }}>
          <SmallCard m={bot2[0]} delay={0.8} />
          <div style={{ width: 1, background: "rgba(245,232,208,0.12)" }} />
          <SmallCard m={bot2[1]} delay={0.9} />
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════
function MobilePerformance() {
  return (
    <FadeUp style={{ padding: "24px 16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${T.borderDef}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Performance Overview</span>
        </div>
        <ChevronRight size={16} color={T.taupe} />
      </div>
      <div style={{ background: T.warmIvory, borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 24px rgba(74,6,27,0.06)", padding: "20px", marginBottom: 14 }}>
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 18, color: T.luxuryBrown, marginBottom: 16, letterSpacing: "-0.1px" }}>Production Progress</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Donut size={140} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[{ label: "Production", pct: 72, color: T.antiqueGold }, { label: "Inventory", pct: 84, color: T.royalBurgundy }, { label: "Payments", pct: 46, color: DARK_MAROON }].map(b => (
            <div key={b.label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12.5, color: T.taupe, letterSpacing: "0.05px" }}>{b.label}</span>
                <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.luxuryBrown, ...NUM }}>{b.pct}%</span>
              </div>
              <AnimatedBar pct={b.pct} color={b.color} height={4} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.warmIvory, borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 24px rgba(74,6,27,0.06)", marginBottom: 14, overflow: "hidden" }}>
        <SareesProduced compact />
      </div>
    </FadeUp>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — FEATURED PRODUCT
// ═══════════════════════════════════════════════════════════════════════════════
function MobileFeaturedProduct() {
  return (
    <FadeUp style={{ padding: "14px 16px 0" }}>
      <div style={{ background: T.warmIvory, borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 24px rgba(74,6,27,0.06)", overflow: "hidden" }}>
        <FeaturedProduct compact />
      </div>
    </FadeUp>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — ACTIVITY
// ═══════════════════════════════════════════════════════════════════════════════
function MobileActivity({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.65, ease: EASE }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Recent Activity</span>
        </div>
        <button onClick={() => onNavigate("Notifications")} style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.royalBurgundy, cursor: "pointer", letterSpacing: "0.1px", background: "none", border: "none", padding: 0 }}>View All →</button>
      </motion.div>
      <div style={{ background: G.card, borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 32px rgba(74,6,27,0.16)", border: "1px solid rgba(200,155,71,0.12)" }}>
        {ACT.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: EASE }}
            style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 18px", backgroundColor: "rgba(0,0,0,0)", borderBottom: i < ACT.length - 1 ? "1px solid rgba(245,232,208,0.10)" : "none" }}
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: a.bg, boxShadow: `0 4px 14px ${a.glow}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {a.icon}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14.5, color: "rgba(245,232,208,0.97)", lineHeight: 1.6, marginBottom: 6, letterSpacing: "0.05px" }}>{a.text}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: a.bg, boxShadow: `0 0 6px ${a.glow}` }} />
                <span style={{ fontFamily: F.mono, fontSize: 11.5, color: "rgba(245,232,208,0.78)", letterSpacing: "0.3px" }}>{a.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — WEAVERS
// ═══════════════════════════════════════════════════════════════════════════════
function MobileWeavers({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div ref={ref} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Active Weavers</span>
        </div>
        <button onClick={() => onNavigate("AllWeavers")} style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.royalBurgundy, cursor: "pointer", letterSpacing: "0.1px", background: "none", border: "none", padding: 0 }}>View All →</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {WEAVERS.map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 22 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            whileHover={{ y: -4, boxShadow: "0px 14px 40px rgba(74,6,27,0.12)" }}
            transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
            style={{ background: T.warmIvory, borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0px 6px 24px rgba(74,6,27,0.06)", overflow: "hidden", display: "flex", alignItems: "stretch" }}
          >
            <div style={{ width: 88, flexShrink: 0, position: "relative", overflow: "hidden" }}>
              <motion.div
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.4 }}
                style={{ width: "100%", height: "100%" }}
              >
                <ImageWithFallback
                  key={w.img}
                  src={w.img}
                  alt={w.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
                />
              </motion.div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0) 70%, rgba(255,253,249,0.45) 100%)" }} />
            </div>
            <div style={{ flex: 1, padding: "14px 16px 14px 14px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: w.ac, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 8px ${w.ac}44` }}>
                  <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 11, color: T.warmCream }}>
                    {w.name.split(" ").map(x => x[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 15, color: T.luxuryBrown, lineHeight: 1.2, letterSpacing: "0.1px" }}>{w.name}</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 10.5, color: T.taupe, letterSpacing: "0.1px" }}>Weaver</div>
                </div>
                <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 999, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}` }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: w.status === "In Progress" ? w.ac : T.taupe }} />
                  <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9, color: w.status === "In Progress" ? w.ac : T.taupe, letterSpacing: "0.2px" }}>{w.status}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
                {[
                  { k: "Sarees this month", v: String(w.sarees), isMono: false },
                  { k: "Batch", v: w.batch, isMono: true },
                  { k: "Completion", v: `${w.pct}%`, isMono: false },
                ].map(r => (
                  <div key={r.k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: T.taupe, letterSpacing: "0.05px" }}>{r.k}</span>
                    <span style={{ fontFamily: r.isMono ? F.mono : F.ui, fontWeight: r.isMono ? 500 : 600, fontSize: 11, color: r.isMono ? T.royalBurgundy : T.luxuryBrown, letterSpacing: r.isMono ? "0.8px" : "0.05px", ...NUM }}>
                      {r.v}
                    </span>
                  </div>
                ))}
              </div>
              <AnimatedBar pct={w.pct} color={`linear-gradient(to right, ${w.ac}, ${w.ac}BB)`} height={3} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — RAW MATERIAL
// ═══════════════════════════════════════════════════════════════════════════════
function MobileRawMaterial({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div ref={ref} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Raw Material Overview</span>
        </div>
        <button onClick={() => onNavigate("Materials")} style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.royalBurgundy, cursor: "pointer", letterSpacing: "0.1px", background: "none", border: "none", padding: 0 }}>View All →</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {MATS.map((m, i) => (
          <motion.div
            key={m.name}
            onClick={() => onNavigate("Materials")}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={inView ? { opacity: 1, scale: 1, y: 0 } : undefined}
            whileHover={{ y: -4, boxShadow: "0px 14px 40px rgba(74,6,27,0.10)" }}
            transition={{ duration: 0.55, delay: i * 0.12, ease: EASE }}
            style={{ background: T.warmIvory, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.borderDef}`, boxShadow: "0px 6px 24px rgba(74,6,27,0.06)", cursor: "pointer" }}
          >
            <div style={{ height: 150, overflow: "hidden" }}>
              <motion.img
                src={m.img}
                alt={m.name}
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.45 }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
            <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.taupe, lineHeight: 1.5, marginBottom: 4 }}>{m.desc}</div>
              {m.extra && <div style={{ marginBottom: 4 }}>{m.extra}</div>}
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 28, color: m.stockColor, lineHeight: 1, margin: "12px 0 6px" }}>{m.stock}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: m.green ? T.taupe : T.crimson, lineHeight: 1.5, marginBottom: 12 }}>{m.note}</div>
              <AnimatedBar pct={m.pct} color={m.barColor} height={5} />
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, margin: "8px 0 12px" }}>{m.pct}% of storage capacity</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: m.green ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.08)", border: `1px solid ${m.green ? "rgba(30,102,64,0.20)" : "rgba(192,57,43,0.20)"}`, borderRadius: 8, padding: "5px 12px" }}>
                <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: m.green ? T.green : T.crimson }}>{m.badge}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — FOOTER
// ═══════════════════════════════════════════════════════════════════════════════
function MobileFooter() {
  return (
    <footer style={{ padding: "24px 16px 0" }}>
      <FadeUp>
        <div style={{ background: G.card, borderRadius: 20, overflow: "hidden", position: "relative", boxShadow: "0 12px 40px rgba(74,6,27,0.18)", border: "1px solid rgba(200,155,71,0.10)" }}>
          <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />
          <div style={{ position: "relative", height: 140 }}>
            <motion.img
              src={imgSareeFooter}
              alt="Saree"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.5 }}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(44,9,19,0.94) 0%, rgba(44,9,19,0.60) 50%, rgba(44,9,19,0.20) 100%)" }} />
            <div style={{ position: "absolute", inset: 0, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(200,155,71,0.32)", flexShrink: 0 }}>
                  <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "sepia(1) saturate(3) hue-rotate(340deg) brightness(1.2)" }} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 400, fontSize: 18, color: T.warmCream, lineHeight: 1.2 }}>Crafted with Pride.</div>
                  <div style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 400, fontSize: 18, color: T.antiqueGold, lineHeight: 1.2 }}>Delivered with Trust.</div>
                </div>
              </div>
              <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11.5, color: "rgba(245,232,208,0.88)", lineHeight: 1.75, margin: "8px 0 10px", letterSpacing: "0.05px" }}>
                Four generations of passion, woven into every creation.
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 12, border: "1px solid rgba(200,155,71,0.28)", background: "rgba(200,155,71,0.09)", cursor: "pointer", fontFamily: F.ui, fontWeight: 500, fontSize: 11.5, color: T.goldLight, letterSpacing: "0.1px" }}
              >
                Know Our Story <ArrowRight size={11} color={T.goldLight} />
              </motion.button>
            </div>
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={0.1} style={{ padding: "24px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.borderGold}` }}>
            <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }} />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 14, color: T.luxuryBrown, letterSpacing: "0.1px" }}>Beere Kesava &amp; Brothers Silks</div>
            <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 8.5, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase" }}>Est. 1999</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: `1px solid ${T.borderDef}` }}>
          {["About Us","Our Legacy","Sustainability","Careers","Contact Us"].map((l, i, arr) => (
            <motion.div
              key={l}
              whileHover={{ x: 4 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.borderDef}` : "none", cursor: "pointer" }}
            >
              <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13.5, color: T.luxuryBrown, letterSpacing: "0.1px" }}>{l}</span>
              <ChevronRight size={13} color={T.taupe} />
            </motion.div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, paddingTop: 20, paddingBottom: 16 }}>
          {([Facebook, Instagram, Youtube, Linkedin] as const).map((Icon, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.14, y: -3 }}
              whileTap={{ scale: 0.92 }}
              style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${T.borderDef}`, background: T.warmIvory, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Icon size={15} color={T.luxuryBrown} />
            </motion.div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 16, paddingBottom: 24, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Lotus sz={13} col={T.antiqueGold} />
            <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 9.5, color: T.antiqueGold, letterSpacing: "1.8px", textTransform: "uppercase", opacity: 0.80 }}>
              Tradition · Trust · Timeless Quality
            </span>
          </div>
          <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: T.taupe, opacity: 0.70, letterSpacing: "0.05px" }}>
            © 1999 Beere Kesava &amp; Brothers Silks. All rights reserved.
          </span>
        </div>
      </FadeUp>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPLASH SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
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
const GLOBAL_STYLE = `
  /* Safety net: no element on this dashboard should ever be able to force a
     horizontal scrollbar / blank gap on the page itself. Internal rows that
     need more space than the viewport (e.g. the top nav's group tabs) scroll
     within themselves instead. */
  html, body { overflow-x: hidden; max-width: 100%; }

  /* Override ALL Tailwind v4 oklch CSS variables with hex/rgb equivalents
     so Motion never reads oklch when sampling computed styles for animation */
  :root {
    --foreground: #1F1209;
    --card: #ffffff;
    --card-foreground: #1F1209;
    --popover: #ffffff;
    --popover-foreground: #1F1209;
    --primary-foreground: #ffffff;
    --secondary: #f1f1f5;
    --ring: rgb(139,112,96);
    --sidebar: #fafafa;
    --sidebar-foreground: #1F1209;
    --sidebar-primary-foreground: #fafafa;
    --sidebar-accent: #f5f5f5;
    --sidebar-accent-foreground: #2a2a2a;
    --sidebar-border: #e8e8e8;
    --sidebar-ring: rgb(139,112,96);
    --chart-1: rgb(200,120,60);
    --chart-2: rgb(60,160,140);
    --chart-3: rgb(50,90,140);
    --chart-4: rgb(200,180,60);
    --chart-5: rgb(200,160,50);
    --tw-shadow: 0 0 rgba(0,0,0,0);
    --tw-shadow-colored: 0 0 rgba(0,0,0,0);
    --tw-ring-shadow: 0 0 rgba(0,0,0,0);
    --tw-ring-color: rgba(139,112,96,0.5);
  }
  body {
    color: #3B2314;
  }

  /* Prevent motion.button from inheriting any oklch background */
  button { background-color: rgba(0,0,0,0); }

  * { box-sizing: border-box; }
  button:focus { outline: none; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #F7F2EA; }
  ::-webkit-scrollbar-thumb { background: rgba(110,15,45,0.16); border-radius: 3px; }

  body, input, textarea, select {
    font-family: 'Manrope', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  .dms { font-family: 'DM Serif Display', serif; }

  @keyframes pulse-ring {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.55); opacity: 0.55; }
  }
  .pulse-dot { animation: pulse-ring 2.2s ease-in-out infinite; }

  @keyframes gold-shimmer {
    0% { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  .gold-bar-shimmer {
    background: linear-gradient(90deg, #C89B47 0%, #E7C983 30%, #FFFDF9 50%, #E7C983 70%, #C89B47 100%);
    background-size: 300%;
    animation: gold-shimmer 3s linear infinite;
    opacity: 0.72;
  }

`;

export function BeereDashboard({ onBack }: { onBack?: () => void } = {}) {
  const [splashVisible, setSplashVisible] = useState(false);
  const [nav, setNav]         = useState("Materials");
  const [mobileTab, setMobileTab] = useState("Materials");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Always scroll to top when navigating between pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    document.body.scrollTop = 0;
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
  }, [nav, mobileTab]);

  const navigate = (tab: string) => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setNav(tab);
  };
  const navigateMobile = (tab: string) => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setMobileTab(tab);
  };

  const dashboardContent = isMobile ? (
    <div style={{ width: "100%", minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} activeTab={mobileTab} setTab={navigateMobile} />
      <MobileTopNav onMenuOpen={() => setMenuOpen(true)} onBack={onBack} />
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
        <AllWeaversPage />
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
      ) : mobileTab === "Rates" ? (
        <RatesPricingPage />
      ) : mobileTab === "IssueMaterial" ? (
        <IssueMaterialPage />
      ) : mobileTab === "Firms" ? (
        <FirmsPage />
      ) : null}
    </div>
  ) : (
    <div style={{ width: "100%", minHeight: "100vh", background: T.silkCream, fontFamily: F.ui }}>
      <TopNav active={nav} set={navigate} onBack={onBack} sections={PAGE_SECTIONS[nav]} />
      {nav === "Materials" ? (
        <MaterialsPage onNavigate={navigate} />
      ) : nav === "Weavers" ? (
        <WeaversPage onNavigate={navigate} />
      ) : nav === "AllWeavers" ? (
        <AllWeaversPage />
      ) : nav === "AllStock" ? (
        <AllStockPage onBack={() => navigate("Production")} />
      ) : nav === "Production" ? (
        <ProductionPage onNavigate={navigate} />
      ) : nav === "AllOrders" ? (
        <AllOrdersPage onBack={() => navigate("Production")} />
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
          <div style={{ padding: "40px 56px 80px", maxWidth: 1400, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 24, alignItems: "start" }}>
              <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(44,24,16,0.07)" }}>
                <WorkerGRN />
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
    </>
  );
}
