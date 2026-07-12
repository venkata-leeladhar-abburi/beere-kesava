import React, { useRef, useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useWeaverPayments, WeaverPaymentRecord } from "./WeaverPaymentsContext";
import { motion, useInView, AnimatePresence } from "motion/react";
import { useBatches } from "./BatchContext";
import { useDesignLibrary } from "./DesignLibraryContext";
import { DesignCodeCard } from "./DesignLibraryPage";
import { SareeTypeCard, getSareeTypeByCode } from "./RatesPricingPage";
import { usePO, PurchaseOrder } from "./POContext";
import { PODocumentModal } from "./PODocumentModal";
import { useFinishing } from "./FinishingContext";
import {
  Download, TrendingUp, TrendingDown, AlertTriangle,
  UploadCloud, Search, ChevronDown, Eye, LayoutGrid, LayoutList, AlignJustify,
  CheckCircle2, Clock, Users, IndianRupee, Minus, FileText, BarChart2,
  X, ChevronLeft, ChevronRight,
  LayoutDashboard, ShoppingCart, Scissors, Factory, Package, CreditCard, BarChart as BarChartIcon, UserRound,
  Globe, Mail, Phone,
  ArrowDownCircle, ArrowUpCircle, Scale, UserCheck, Wallet, MinusCircle, BadgeCheck,
  MapPin, Receipt, CircleAlert, CalendarClock,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const imgHeaderBg = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import { imgBKLogo, imgSareeFooter } from "../constants/weaverImages";
import { useBulkOrders, BulkOrder } from "./BulkOrderContext";
import { useFirms } from "./FirmsContext";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  green:         "#1E6640",
  greenBg:       "rgba(30,102,64,0.09)",
  greenMid:      "#2D9158",
  crimson:       "#C0392B",
  crimsonBg:     "rgba(192,57,43,0.08)",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── FadeUp ────────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 22 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE, delay }} style={style}>
      {children}
    </motion.div>
  );
}

// ── Animated number counter ────────────────────────────────────────────────────
function AnimCount({ raw }: { raw: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [disp, setDisp] = useState(() => {
    const m = raw.match(/[\d.]+/);
    return m ? raw.replace(m[0], raw.includes(".") ? "0.0" : "0") : raw;
  });
  useEffect(() => {
    if (!inView) return;
    const m = raw.match(/[\d.]+/);
    if (!m) { setDisp(raw); return; }
    const target = parseFloat(m[0]);
    const isFloat = m[0].includes(".");
    const idx = raw.indexOf(m[0]);
    const pre = raw.slice(0, idx), suf = raw.slice(idx + m[0].length);
    const dur = 1400; let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setDisp(`${pre}${isFloat ? (e * target).toFixed(1) : Math.round(e * target)}${suf}`);
      if (p < 1) requestAnimationFrame(step); else setDisp(raw);
    };
    requestAnimationFrame(step);
  }, [inView, raw]);
  return <span ref={ref}>{disp}</span>;
}

// ── Animated progress bar ──────────────────────────────────────────────────────
function AnimBar({ pct, color, height = 8, trackBg = "rgba(110,15,45,0.08)" }: { pct: number; color: string; height?: number; trackBg?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} style={{ height, borderRadius: 99, background: trackBg, overflow: "hidden" }}>
      <motion.div initial={{ width: "0%" }} animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 1.3, delay: 0.2, ease: EASE }}
        style={{ height: "100%", borderRadius: 99, background: color }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — PAGE HEADER
// ══════════════════════════════════════════════════════════════════════════════
const HEADER_CHIPS = [
  { value: "₹4.2L",  label: "Paid to Weavers",         gold: false },
  { value: "₹32.6L", label: "Collected from Customers", gold: false },
  { value: "₹18.4L", label: "Outstanding Invoices",     gold: false },
  { value: "▲ 3",    label: "Overdue Invoices",         gold: false },
  { value: "₹8.6L",  label: "Vendor Payments",          gold: false },
  { value: "₹19.8L", label: "Net Income This Month",    gold: true  },
];

function PaymentsHeader() {
  return (
    <header style={{ background: T.darkBurgundy, position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
      {/* Left content */}
      <div style={{ position: "relative", zIndex: 2, padding: "48px 0 110px 48px", flex: "0 0 64%", maxWidth: "64%" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
          SINCE 1999 · PAYMENT MANAGEMENT
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
            Payments
          </h1>
          <span style={{ fontFamily: F.display, fontSize: 32, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>
            &amp; Financial Overview
          </span>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 580, lineHeight: 1.6 }}>
          Track all payments — weaver making charges, customer collections, vendor bills, and net income — all in one place.
        </p>
      </div>

      {/* Right — photography */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, ${T.darkBurgundy} 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
        <img src={imgSareeFooter} alt="Silk sarees" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
      </div>
    </header>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — STATS STRIP (floating MetricsBar style)
// ══════════════════════════════════════════════════════════════════════════════
const STATS = [
  {
    label: "Paid to Weavers",
    value: "₹4.2L",
    sub: "Making charges · May 2026",
    hi: false, gold: false, crimson: false,
    icon: <Users size={22} color="rgba(245,232,208,0.90)" />,
  },
  {
    label: "Outstanding from Customers",
    value: "₹18.4L",
    sub: "Invoices yet to be collected",
    hi: false, gold: false, crimson: true,
    icon: <AlertTriangle size={22} color="#F47B72" />,
  },
  {
    label: "Collected from Customers",
    value: "₹32.6L",
    sub: "Payments received this month",
    hi: true, gold: true, crimson: false,
    icon: <IndianRupee size={22} color="rgba(231,201,131,0.95)" />,
  },
  {
    label: "Paid to Vendors",
    value: "₹8.6L",
    sub: "Raw material purchases",
    hi: false, gold: false, crimson: false,
    icon: <FileText size={22} color="rgba(245,232,208,0.90)" />,
  },
  {
    label: "Net Income This Month",
    value: "₹19.8L",
    sub: "After all payments made",
    hi: false, gold: true, crimson: false,
    icon: <TrendingUp size={22} color="rgba(231,201,131,0.95)" />,
  },
];

function StatsStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{
        background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
        borderRadius: 28,
        display: "flex",
        alignItems: "stretch",
        boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)",
        overflow: "hidden",
        minHeight: 140,
      }}>
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: s.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1,
              padding: "28px 22px",
              backgroundImage: s.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              backgroundColor: "rgba(0,0,0,0)",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 14,
              position: "relative",
              cursor: "pointer",
            }}
          >
            {/* Icon box */}
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ duration: 0.25 }}
              style={{
                width: 50, height: 50, borderRadius: 15, flexShrink: 0,
                background: s.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)",
                border: `1px solid ${s.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {s.icon}
            </motion.div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: s.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: s.gold ? T.goldLight : s.crimson ? "#F47B72" : "#FFFDF9", lineHeight: 1.0, marginBottom: 8 }}>
                <AnimCount raw={s.value} />
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: s.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                {s.sub}
              </div>
            </div>

            {/* Gold shimmer bar on highlighted cell */}
            {s.hi && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})` }} />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — THIS MONTH'S FINANCIAL SUMMARY
// ═══════════════════════════════════════���══════════════════════════════════════
const COMING_IN = [
  { label: "Wholesale Payments Received", value: "₹28,40,000", color: T.green },
  { label: "Retail Store Revenue",        value: "₹4,20,000",  color: T.green },
];
const GOING_OUT = [
  { label: "Making Charges Paid",       value: "₹4,20,000", color: T.crimson },
  { label: "Vendor Raw Material Paid",  value: "₹8,60,000", color: T.crimson },
];

const TOTAL_IN  = 3260000;
const TOTAL_OUT = 1280000;
const NET       = TOTAL_IN - TOTAL_OUT; // 1980000
const IF_ALL    = TOTAL_IN + 1841000;   // +outstanding = 5101000  → show 38,21,000 ≈ 38.2L

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function SummaryLineItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: `1px solid ${T.borderDef}` }}>
      <span style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe }}>{label}</span>
      <span style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function FinancialSummarySection() {
  const [downloadModal, setDownloadModal] = useState(false);
  const pctIn  = Math.round((TOTAL_IN  / (TOTAL_IN + 1841000)) * 100);
  const pctOut = Math.round((TOTAL_OUT / TOTAL_IN) * 100);

  return (
    <div id="pay-summary" style={{ padding: "32px 40px" }}>
      <FadeUp>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>This Month's Financial Summary</h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px" }}>
              A clear view of all money coming in and going out this month.
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} onClick={() => setDownloadModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer", flexShrink: 0 }}>
            <Download size={15} />Download Report
          </motion.button>
        </div>

        {/* Compact info-card grid — 4 stat cards side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginTop: 24, alignItems: "stretch" }}>

          {/* Card 1 — Total Received This Month */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.08)", padding: "22px 22px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, marginBottom: 8 }}>Total Received This Month</div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.green, lineHeight: 1.1, marginBottom: 14 }}>{formatINR(TOTAL_IN)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {COMING_IN.map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontFamily: F.mono, color: T.luxuryBrown, fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2 — Total Paid Out This Month */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.08)", padding: "22px 22px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, marginBottom: 8 }}>Total Paid Out This Month</div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.crimson, lineHeight: 1.1, marginBottom: 14 }}>{formatINR(TOTAL_OUT)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {GOING_OUT.map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.crimson, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontFamily: F.mono, color: T.luxuryBrown, fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3 — Net Cash Flow */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.08)", padding: "22px 22px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, marginBottom: 8 }}>Net Cash Flow</div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.royalBurgundy, lineHeight: 1.1, marginBottom: 14 }}>{formatINR(NET)}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.6 }}>Money left after all incoming and outgoing payments this month.</div>
          </div>

          {/* Card 4 — Outstanding (If All Collected) */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.08)", padding: "22px 22px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, marginBottom: 8 }}>Outstanding (If All Collected)</div>
            <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.antiqueGold, lineHeight: 1.1, marginBottom: 14 }}>{formatINR(IF_ALL)}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, lineHeight: 1.6 }}>Total if every pending customer invoice were collected today.</div>
          </div>

        </div>
        <ActionModal open={downloadModal} onClose={() => setDownloadModal(false)} title="Download Financial Report" desc="Generate and download the financial summary report for this month." actionLabel="Download" icon={Download} />
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION A — WEAVER MAKING CHARGES (MAY 2026)
// ══════════════════════════════════════════════════════════════════════════════

const RATES = { sb: 450, hz: 680, ps: 280, bs: 1200, st: 380 };

interface WeaverRecord {
  id: string; name: string; initials: string; bg: string;
  village: string; sb: number; hz: number; ps: number; bs: number; st: number;
  advance: number; status: "Paid" | "Pending";
}

const WEAVERS: WeaverRecord[] = [
  { id: "WV-001", name: "Ravi Kumar",   initials: "RK", bg: T.royalBurgundy, village: "Varanasi",      sb: 8, hz: 0, ps: 0, bs: 0, st: 0, advance: 2000,  status: "Pending" },
  { id: "WV-002", name: "Padma Veni",   initials: "PV", bg: "#C4923A",       village: "Rajatalab",     sb: 0, hz: 5, ps: 0, bs: 0, st: 0, advance: 3400,  status: "Pending" },
  { id: "WV-007", name: "Suresh Murti", initials: "SM", bg: T.taupe,         village: "Bhelupura",     sb: 0, hz: 0, ps: 4, bs: 0, st: 0, advance: 0,     status: "Paid"    },
  { id: "WV-005", name: "Anand K.",     initials: "AK", bg: T.deepWine,      village: "Sigra",         sb: 0, hz: 0, ps: 0, bs: 5, st: 0, advance: 5000,  status: "Pending" },
  { id: "WV-012", name: "Meena R.",     initials: "MR", bg: "#A05080",       village: "Orderly Bazar", sb: 4, hz: 0, ps: 0, bs: 0, st: 0, advance: 1800,  status: "Pending" },
  { id: "WV-031", name: "Kamala B.",    initials: "KB", bg: T.darkBurgundy,  village: "Varanasi",      sb: 0, hz: 6, ps: 0, bs: 0, st: 0, advance: 4000,  status: "Pending" },
  { id: "WV-024", name: "Venkat Rao",   initials: "VR", bg: T.green,         village: "Lanka",         sb: 0, hz: 0, ps: 8, bs: 0, st: 0, advance: 1200,  status: "Paid"    },
  { id: "WV-018", name: "Lakshmi D.",   initials: "LD", bg: "#C4923A",       village: "Lahurabir",     sb: 5, hz: 0, ps: 0, bs: 0, st: 0, advance: 1000,  status: "Pending" },
];

function calcCharges(w: WeaverRecord) {
  return w.sb * RATES.sb + w.hz * RATES.hz + w.ps * RATES.ps + w.bs * RATES.bs + w.st * RATES.st;
}
function calcNet(w: WeaverRecord) { return calcCharges(w) - w.advance; }

const RATE_ROWS = [
  { code: "SB-001", name: "Self Brocade",   rate: 450  },
  { code: "HZ-003", name: "Heavy Zari",     rate: 680  },
  { code: "PS-002", name: "Plain Silk",     rate: 280  },
  { code: "BS-004", name: "Bridal Special", rate: 1200 },
  { code: "ST-005", name: "Stripe Brocade", rate: 380  },
];

// helper: initials avatar
function Pip({ initials, bg, size = 36 }: { initials: string; bg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid rgba(255,255,255,0.55)" }}>
      <span style={{ fontFamily: F.ui, fontSize: size * 0.33, fontWeight: 700, color: "#FFFDF9", letterSpacing: "-0.3px" }}>{initials}</span>
    </div>
  );
}

// helper: status badge
function StatusBadge({ status }: { status: "Paid" | "Pending" }) {
  const paid = status === "Paid";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: paid ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.12)", color: paid ? T.green : "#8B6018" }}>
      {paid ? <CheckCircle2 size={11} /> : <Clock size={11} />}{status}
    </span>
  );
}

// helper: ActionModal
function ActionModal({ open, onClose, title, desc, actionLabel, icon: Icon = CheckCircle2, hideAction = false }: any) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  
  if (!open) return null;
  
  const handleAction = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 1200);
  };
  
  if (done) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(44,24,16,0.60)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#FFFDF9", borderRadius: 20, padding: 48, maxWidth: 480, width: "100%", textAlign: "center" }}>
          <CheckCircle2 size={48} color={T.green} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Success</div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 24 }}>
            Action completed successfully.
          </div>
          <button onClick={() => { setDone(false); onClose(); }} style={{ height: 44, padding: "0 32px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,24,16,0.60)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#FFFDF9", borderRadius: 20, padding: 32, maxWidth: 480, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
             <Icon size={22} color={T.royalBurgundy} />
          </div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{title}</div>
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 32 }}>
          {desc}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 40, padding: "0 20px", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 999, fontFamily: F.ui, fontSize: 13, color: T.taupe, cursor: "pointer" }}>Cancel</button>
          {!hideAction && (
            <button onClick={handleAction} style={{ height: 40, padding: "0 20px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {loading ? "Processing..." : actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// helper: dropdown button
function DropBtn({ value, options, onChange }: { value?: string, options: string[], onChange?: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange?.(e.target.value)} style={{ padding: "8px 12px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, cursor: "pointer", outline: "none" }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

// Weaver card (card view)
function WeaverCard({ w, onViewDetails }: { w: WeaverRecord, onViewDetails?: () => void }) {
  const charges = calcCharges(w);
  const breakdown = [
    w.sb > 0 && `SB×${w.sb}`,
    w.hz > 0 && `HZ×${w.hz}`,
    w.ps > 0 && `PS×${w.ps}`,
    w.bs > 0 && `BS×${w.bs}`,
    w.st > 0 && `ST×${w.st}`,
  ].filter(Boolean).join(" · ");

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(74,6,27,0.06)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ borderLeft: `4px solid ${w.status === "Paid" ? T.green : T.antiqueGold}` }}>
        {/* Top row */}
        <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Pip initials={w.initials} bg={w.bg} size={38} />
            <div>
              <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: T.luxuryBrown, lineHeight: 1.2 }}>{w.name}</div>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy, marginTop: 2 }}>{w.id}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>📍 {w.village}</div>
            </div>
          </div>
          <StatusBadge status={w.status} />
        </div>

        {/* Body */}
        <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>
            Sarees completed: <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.luxuryBrown, fontWeight: 600 }}>{w.sb + w.hz + w.ps + w.bs + w.st} sarees</span>
            {breakdown && <span style={{ color: T.taupe }}> ({breakdown})</span>}
          </div>

          {/* Financials */}
          <div style={{ background: T.silkCream, borderRadius: 9, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.luxuryBrown }}>Making Charges</span>
              <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: w.status === "Paid" ? T.green : T.royalBurgundy }}>₹{charges.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Footer button */}
        <div style={{ padding: "0 16px 14px" }}>
          <button onClick={onViewDetails} style={{ width: "100%", height: 34, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1px solid rgba(110,15,45,0.16)`, borderRadius: 8, fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
            <Eye size={12} />View Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Weaver Payment Detail Modal ───────────────────────────────────────────────
function WeaverPaymentDetailModal({ weaver, onClose }: { weaver: WeaverRecord | null; onClose: () => void }) {
  const { getPaymentsForWeaver } = useWeaverPayments();
  const { batches } = useBatches();
  const { getDesign } = useDesignLibrary();
  const [openDesignCode, setOpenDesignCode] = useState<string | null>(null);
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);

  if (!weaver) return null;

  const chargeRows = [
    { key: "sb", count: weaver.sb }, { key: "hz", count: weaver.hz }, { key: "ps", count: weaver.ps },
    { key: "bs", count: weaver.bs }, { key: "st", count: weaver.st },
  ].map(r => ({ ...r, rate: RATE_ROWS.find(rr => rr.code.slice(0, 2).toLowerCase() === r.key)! }))
    .filter(r => r.count > 0);
  const totalCharges = calcCharges(weaver);

  const payments = getPaymentsForWeaver(weaver.id);

  const myBatches = batches.filter(b => (b.status === "active" || b.status === "draft") && b.rows.some(r => r.weaverId === weaver.id));

  const openDesign = openDesignCode ? getDesign(openDesignCode) : undefined;
  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", padding: "10px 12px", textAlign: "left", background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "10px 12px", borderBottom: `1px solid ${T.borderDef}` };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,20,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: T.warmIvory, borderRadius: 20, width: 680, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        {/* Header */}
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
          <Pip initials={weaver.initials} bg={weaver.bg} size={46} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9" }}>{weaver.name}</div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.goldLight, marginTop: 2 }}>{weaver.id}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,253,249,0.70)", marginTop: 2 }}>📍 {weaver.village}</div>
          </div>
          <StatusBadge status={weaver.status} />
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 26 }}>

          {/* Section 1 — Making Charges Breakdown */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, marginBottom: 10 }}>Making Charges Breakdown</div>
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Saree Type Code", "Saree Type Name", "Count", "Rate", "Subtotal"].map(h => <th key={h} style={TH}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {chargeRows.map(r => (
                    <tr key={r.key}>
                      <td style={TD}>
                        <span onClick={() => setOpenSareeTypeCode(r.rate.code)}
                          onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "underline"}
                          onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "none"}
                          style={{ fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy, cursor: "pointer" }}>{r.rate.code}</span>
                      </td>
                      <td style={TD}>{r.rate.name}</td>
                      <td style={TD}>{r.count}</td>
                      <td style={{ ...TD, fontFamily: F.mono }}>₹{r.rate.rate}</td>
                      <td style={{ ...TD, fontFamily: F.mono, fontWeight: 600 }}>₹{(r.count * r.rate.rate).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  <tr style={{ background: T.warmCream }}>
                    <td colSpan={4} style={{ ...TD, fontWeight: 700, borderBottom: "none" }}>Total Making Charges</td>
                    <td style={{ ...TD, fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.royalBurgundy, borderBottom: "none" }}>₹{totalCharges.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2 — Payment History */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, marginBottom: 10 }}>Payment History</div>
            {payments.length === 0 ? (
              <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "18px", fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center" }}>
                No payments uploaded yet. Upload Excel on this page to see payment history.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {payments.map((p, i) => (
                  <div key={i} style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.6px" }}>Amount Paid</div>
                      <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.green }}>₹{p.amountPaid.toLocaleString("en-IN")}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.6px" }}>UTR Number</div>
                      <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{p.utrNumber}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.6px" }}>Firm</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{p.firmName}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.6px" }}>Payment Date</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{p.paymentDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3 — Flow Context */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, marginBottom: 10 }}>Flow Context</div>
            {myBatches.length === 0 ? (
              <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "18px", fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center" }}>
                No active batches currently.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {myBatches.map(b => {
                  const row = b.rows.find(r => r.weaverId === weaver.id);
                  return (
                    <div key={b.batchId} style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{b.batchId}</span>
                      {row?.designCode && (
                        <span onClick={() => setOpenDesignCode(row.designCode!)}
                          onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "underline"}
                          onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "none"}
                          style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, cursor: "pointer" }}>{row.designCode}</span>
                      )}
                      {row?.sareeTypeCode && (
                        <span onClick={() => setOpenSareeTypeCode(row.sareeTypeCode!)}
                          onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "underline"}
                          onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = "none"}
                          style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, cursor: "pointer" }}>{row.sareeTypeCode}</span>
                      )}
                      <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, color: b.status === "active" ? T.green : T.antiqueGold, background: b.status === "active" ? "rgba(30,102,64,0.10)" : "rgba(200,155,71,0.13)", padding: "3px 10px", borderRadius: 20, marginLeft: "auto" }}>
                        {b.status === "active" ? "Active" : "Draft"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "18px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 40, padding: "0 24px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>Close</button>
        </div>
      </motion.div>

      <AnimatePresence>
        {openDesign && <DesignCodeCard design={openDesign} onClose={() => setOpenDesignCode(null)} />}
        {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ── Types for Excel upload matching ───────────────────────────────────────────
interface ExcelRow {
  weaverId: string;
  weaverName: string;
  amountPaid: number;
  utrNumber: string;
  firmName: string;
  paymentDate: string;
}
interface MatchedPayment extends ExcelRow { weaverRecord: WeaverRecord; }
interface UnmatchedRow   extends ExcelRow {}

interface UploadResult {
  fileName: string;
  totalRows: number;
  matched: MatchedPayment[];
  unmatched: UnmatchedRow[];
}

// ── Bank Upload Panel ─────────────────────────────────────────────────────────
function BankUploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const { addPayments } = useWeaverPayments();

  const normalize = (s: unknown) =>
    String(s ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");

  const HEADER_MAP: Record<string, keyof ExcelRow> = {
    weaverid:    "weaverId",
    weavername:  "weaverName",
    amountpaid:  "amountPaid",
    utrnumber:   "utrNumber",
    firmname:    "firmName",
    paymentdate: "paymentDate",
  };

  const parseFile = useCallback((file: File) => {
    setParsing(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (raw.length === 0) { setError("The uploaded file is empty or has no data rows."); setParsing(false); return; }

        // Build column key → ExcelRow key map from first row headers
        const firstRowKeys = Object.keys(raw[0]);
        const colMap: Record<string, keyof ExcelRow> = {};
        firstRowKeys.forEach(k => {
          const norm = normalize(k);
          if (HEADER_MAP[norm]) colMap[k] = HEADER_MAP[norm];
        });

        const missing = (Object.values(HEADER_MAP) as string[]).filter(
          v => !Object.values(colMap).includes(v as keyof ExcelRow)
        );
        if (missing.length > 0) {
          setError(`Missing required columns: ${missing.join(", ")}. Expected: Weaver ID, Weaver Name, Amount Paid, UTR Number, Firm Name, Payment Date.`);
          setParsing(false);
          return;
        }

        // Parse each row
        const rows: ExcelRow[] = raw.map(r => {
          const out: Partial<ExcelRow> = {};
          Object.entries(colMap).forEach(([col, key]) => {
            if (key === "amountPaid") {
              out[key] = parseFloat(String(r[col]).replace(/[^\d.]/g, "")) || 0;
            } else {
              (out as Record<string, unknown>)[key] = String(r[col] ?? "").trim();
            }
          });
          return out as ExcelRow;
        });

        // Match against WEAVERS
        const matched: MatchedPayment[] = [];
        const unmatched: UnmatchedRow[] = [];

        rows.forEach(row => {
          const found = WEAVERS.find(
            w => w.id.trim().toLowerCase() === row.weaverId.trim().toLowerCase()
          );
          if (found) matched.push({ ...row, weaverRecord: found });
          else unmatched.push(row);
        });

        setResult({ fileName: file.name, totalRows: rows.length, matched, unmatched });

        // Persist matched records to shared context so WeaverPortal can read them
        if (matched.length > 0) {
          const records: WeaverPaymentRecord[] = matched.map((m, idx) => ({
            id: `pay-${Date.now()}-${idx}`,
            weaverId: m.weaverRecord.id,
            weaverName: m.weaverRecord.name,
            amountPaid: m.amountPaid,
            utrNumber: m.utrNumber,
            firmName: m.firmName,
            paymentDate: m.paymentDate,
            uploadedAt: new Date().toISOString(),
          }));
          addPayments(records);
        }
      } catch (err) {
        setError("Failed to read the file. Please ensure it is a valid .xlsx or .xls file.");
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  const handleReset = () => { setResult(null); setError(null); };

  const fmtAmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString("en-IN")}`;

  return (
    <div style={{ marginBottom: 22 }}>
      {/* ── Upload trigger panel ── */}
      <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UploadCloud size={22} color={T.royalBurgundy} />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 3 }}>Upload Bank Payment File</div>
            <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, lineHeight: 1.55, maxWidth: 560 }}>
              Upload an Excel file (.xlsx / .xls) with columns: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>Weaver ID · Weaver Name · Amount Paid · UTR Number · Firm Name · Payment Date</span>. System will auto-match weavers and flag unmatched rows.
            </div>
            {result ? (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={12} />
                {result.fileName} — {result.totalRows} rows processed
              </div>
            ) : (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={12} />Last payment: April 2026 paid on 05 May 2026
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          {result && (
            <motion.button whileHover={{ scale: 1.02 }} onClick={handleReset}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 9, color: T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>
              <X size={13} />Clear
            </motion.button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: T.royalBurgundy, border: "none", borderRadius: 9, color: "#FFFDF9", fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const, opacity: parsing ? 0.7 : 1 }}
          >
            <UploadCloud size={14} />{parsing ? "Processing…" : result ? "Upload New File" : "Upload Bank Payment File"}
          </motion.button>
        </div>
      </div>

      {/* ── Error message ── */}
      {error && (
        <div style={{ marginTop: 12, background: "rgba(192,57,43,0.07)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertTriangle size={16} color={T.crimson} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, lineHeight: 1.55 }}>{error}</span>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
          {/* Summary strip */}
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
            {[
              { label: "Total Rows",          value: String(result.totalRows),                              color: T.luxuryBrown, bg: "#FFFFFF",                           icon: <FileText size={18} color={T.royalBurgundy} /> },
              { label: "Matched Weavers",     value: String(result.matched.length),                         color: T.green,       bg: "rgba(30,102,64,0.07)",             icon: <CheckCircle2 size={18} color={T.green} /> },
              { label: "Unmatched Rows",      value: String(result.unmatched.length),                       color: T.crimson,     bg: "rgba(192,57,43,0.06)",             icon: <AlertTriangle size={18} color={T.crimson} /> },
              { label: "Total Distributed",   value: fmtAmt(result.matched.reduce((s, m) => s + m.amountPaid, 0)), color: T.antiqueGold, bg: "rgba(200,155,71,0.08)", icon: <IndianRupee size={18} color={T.antiqueGold} /> },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(74,6,27,0.05)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Section A — Matched */}
          {result.matched.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <CheckCircle2 size={16} color={T.green} />
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Matched Payments</span>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: T.green, background: "rgba(30,102,64,0.10)", padding: "2px 9px", borderRadius: 20 }}>{result.matched.length}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {result.matched.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }}
                    style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid rgba(30,102,64,0.22)`, borderLeft: `4px solid ${T.green}`, boxShadow: "0 2px 10px rgba(30,102,64,0.06)", overflow: "hidden" }}>
                    {/* Card header */}
                    <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Pip initials={m.weaverRecord.initials} bg={m.weaverRecord.bg} size={36} />
                        <div>
                          <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.2 }}>{m.weaverRecord.name}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy, marginTop: 1 }}>{m.weaverRecord.id}</div>
                        </div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: "rgba(30,102,64,0.10)", color: T.green, flexShrink: 0 }}>
                        <CheckCircle2 size={11} />Matched ✓
                      </span>
                    </div>
                    {/* Details */}
                    <div style={{ padding: "0 16px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>Amount Paid</div>
                        <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: T.green }}>₹{m.amountPaid.toLocaleString("en-IN")}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>Payment Date</div>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{m.paymentDate}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>UTR Number</div>
                        <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, wordBreak: "break-all" as const }}>{m.utrNumber || "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>Firm Name</div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{m.firmName || "—"}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Section B — Unmatched */}
          {result.unmatched.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <AlertTriangle size={16} color={T.crimson} />
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Unmatched Rows</span>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: T.crimson, background: "rgba(192,57,43,0.10)", padding: "2px 9px", borderRadius: 20 }}>{result.unmatched.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.unmatched.map((u, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}
                    style={{ background: "rgba(192,57,43,0.04)", borderRadius: 12, border: `1px solid rgba(192,57,43,0.22)`, borderLeft: `4px solid ${T.crimson}`, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.crimson, lineHeight: 1.2 }}>{u.weaverName || "(No Name)"}</div>
                        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 2 }}>ID: {u.weaverId || "—"}</div>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontFamily: F.ui, fontSize: 11, fontWeight: 700, background: "rgba(192,57,43,0.10)", color: T.crimson, flexShrink: 0 }}>
                        <AlertTriangle size={11} />Unmatched ⚠
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px 14px", marginBottom: 10 }}>
                      {[
                        { label: "Amount", value: `₹${u.amountPaid.toLocaleString("en-IN")}` },
                        { label: "UTR",    value: u.utrNumber || "—" },
                        { label: "Firm",   value: u.firmName  || "—" },
                        { label: "Date",   value: u.paymentDate || "—" },
                      ].map(f => (
                        <div key={f.label}>
                          <div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 2 }}>{f.label}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.crimson }}>
                      <CircleAlert size={12} />No weaver found with ID <strong>{u.weaverId || "—"}</strong> — please verify manually
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function WeaverMakingChargesSection() {
  const [view, setView] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [downloadModal, setDownloadModal] = useState(false);
  const [selWeaver, setSelWeaver] = useState<WeaverRecord | null>(null);
  
  const [filterVillage, setFilterVillage] = useState("All Villages");
  const [filterStatus, setFilterStatus] = useState("All Payment Status");

  const viewOptions = [
    { key: "card", Icon: LayoutGrid, label: "Card View" },
    { key: "list", Icon: LayoutList, label: "List View" },
  ] as const;

  const filtered = WEAVERS.filter(w => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.id.toLowerCase().includes(search.toLowerCase()) || w.village.toLowerCase().includes(search.toLowerCase());
    const matchVillage = filterVillage === "All Villages" || w.village === filterVillage;
    const matchStatus = filterStatus === "All Payment Status" || w.status === filterStatus;
    return matchSearch && matchVillage && matchStatus;
  });

  return (
    <div id="pay-making-charges" style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        {/* ── Section header ──────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>
                Weaver Making Charges — May 2026
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px", maxWidth: 640, lineHeight: 1.6 }}>
              Making charges are paid once a month at the end of the month. This system calculates each weaver's earnings based on completed and approved sarees.
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} onClick={() => setDownloadModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer", flexShrink: 0 }}>
            <Download size={15} />Download Weaver Payment Report
          </motion.button>
        </div>

        {/* ── 4 stat cards ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24, marginBottom: 22, alignItems: "stretch" }}>
          {[
            {
              icon: <UserCheck size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Weavers to Pay",
              value: "84",
              sub: "All active weavers this month",
              hi: false,
            },
            {
              icon: <Wallet size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Making Charges",
              value: "₹4,20,000",
              sub: "Gross charges for May 2026",
              hi: false,
            },
            {
              icon: <MinusCircle size={22} color={T.crimson} />,
              iconBg: "rgba(192,57,43,0.08)",
              label: "Total Deductions Applied",
              value: "₹18,400",
              sub: "Advance amount deducted",
              hi: false,
            },
            {
              icon: <BadgeCheck size={22} color={T.antiqueGold} />,
              iconBg: "rgba(200,155,71,0.16)",
              label: "Net Amount to Pay",
              value: "₹4,01,600",
              sub: "After all deductions",
              hi: true,
            },
          ].map((s, i) => (
            <div key={i} style={{ background: s.hi ? "linear-gradient(135deg,rgba(200,155,71,0.14),rgba(200,155,71,0.04))" : "#FFFFFF", borderRadius: 14, border: `1px solid ${s.hi ? T.borderGold : T.borderDef}`, padding: "20px 20px 18px", boxShadow: "0 2px 14px rgba(74,6,27,0.07)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 10 }}>
              {s.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
              {/* Icon + label row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: s.hi ? T.antiqueGold : T.taupe, lineHeight: 1.35, paddingTop: 2 }}>{s.label}</div>
              </div>
              {/* Value */}
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: s.hi ? T.antiqueGold : T.luxuryBrown, lineHeight: 1 }}>{s.value}</div>
              {/* Sub */}
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Upload Bank Payment File panel ──────────────────── */}
        <BankUploadPanel />

        {/* ── Filter + View toggle bar ─────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" as const }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: `1px solid ${T.borderDef}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
            {viewOptions.map(({ key, Icon, label }) => (
              <motion.button key={key} onClick={() => setView(key as any)}
                animate={{ backgroundColor: view === key ? T.royalBurgundy : "#FFFFFF" }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: view === key ? "#FFFDF9" : T.taupe, border: "none", cursor: "pointer" }}>
                <Icon size={12} />{label}
              </motion.button>
            ))}
          </div>
          <DropBtn value="All Weavers" options={["All Weavers", "Master Weavers", "Junior Weavers"]} />
          <DropBtn value={filterVillage} options={["All Villages", "Varanasi", "Rajatalab", "Bhelupura", "Sigra", "Orderly Bazar", "Lanka", "Lahurabir"]} onChange={setFilterVillage} />
          <DropBtn value={filterStatus} options={["All Payment Status", "Pending", "Paid"]} onChange={setFilterStatus} />
          <DropBtn value="All Making Charge Rate" options={["All Making Charge Rate", "Self Brocade (₹450)", "Heavy Zari (₹680)", "Plain Silk (₹280)"]} />
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search weaver name, ID, or village..."
              style={{ width: "100%", padding: "7px 12px 7px 32px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        </div>

        {/* ── Card view grid ───────────────────────────────────── */}
        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
            {filtered.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}>
                <WeaverCard w={w} onViewDetails={() => setSelWeaver(w)} />
              </motion.div>
            ))}
          </div>
        )}

        {/* ── List view ────────────────────────────────────────── */}
        {view === "list" && (
          <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 28 }}>
            {filtered.map((w, i) => {
              const charges = calcCharges(w); const net = calcNet(w);
              return (
                <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 18px", background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderBottom: `1px solid ${T.borderDef}`, borderLeft: `4px solid ${w.status === "Paid" ? T.green : T.antiqueGold}` }}>
                  <Pip initials={w.initials} bg={w.bg} size={36} />
                  <div style={{ flex: "0 0 160px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{w.name}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy }}>{w.id} · {w.village}</div>
                  </div>
                  <div style={{ flex: 1, fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{w.sb + w.hz + w.ps + w.bs + w.st} sarees</div>
                  <div style={{ flex: "0 0 110px", fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>₹{charges.toLocaleString("en-IN")}</div>
                  <div style={{ flex: "0 0 110px", fontFamily: F.mono, fontSize: 13, color: T.crimson }}>−₹{w.advance.toLocaleString("en-IN")}</div>
                  <div style={{ flex: "0 0 120px", fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.royalBurgundy }}>₹{net.toLocaleString("en-IN")}</div>
                  <StatusBadge status={w.status} />
                  <button onClick={() => setSelWeaver(w)} style={{ padding: "5px 12px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Eye size={11} />View
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <ActionModal open={downloadModal} onClose={() => setDownloadModal(false)} title="Download Weaver Report" desc="Generate and download the weaver making charges payment report." actionLabel="Download" icon={Download} />
        <AnimatePresence>
          {selWeaver && <WeaverPaymentDetailModal weaver={selWeaver} onClose={() => setSelWeaver(null)} />}
        </AnimatePresence>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION C — WHOLESALE CUSTOMER COLLECTIONS
// ══════════════════════════════════════════════════════════════════════════════
type InvoiceStatus = "Paid" | "Partial" | "Pending" | "Overdue";

interface InvoicePayment {
  amount: number;
  date: string;
  utr: string;
  method: string;
  firmName?: string;
}

interface Invoice {
  id: string; customer: string; city: string;
  invoiceDate: string; dueDate: string;
  total: number; paid: number; status: InvoiceStatus;
  daysOverdue?: number;
  payments?: InvoicePayment[];
}

const INVOICES: Invoice[] = [
  {
    id: "INV-2026-041", customer: "Lakshmi Silks", city: "Varanasi",
    invoiceDate: "08 Apr 2026", dueDate: "28 Apr 2026", total: 900000, paid: 900000, status: "Paid",
    payments: [
      { amount: 500000, date: "10 May 2026", utr: "UTR20260510LS1", method: "Bank Transfer", firmName: "Surat Zari Works" },
      { amount: 400000, date: "15 May 2026", utr: "UTR20260515LS2", method: "Bank Transfer", firmName: "Surat Zari Works" }
    ]
  },
  {
    id: "INV-2026-038", customer: "Padmavathi Textiles", city: "Surat",
    invoiceDate: "05 Apr 2026", dueDate: "25 Apr 2026", total: 600000, paid: 465000, status: "Overdue", daysOverdue: 5,
    payments: [
      { amount: 300000, date: "15 Apr 2026", utr: "UTR20260415PM1", method: "Bank Transfer", firmName: "Kanchipuram Silks" },
      { amount: 165000, date: "22 Apr 2026", utr: "UTR20260422PM2", method: "Bank Transfer", firmName: "Kanchipuram Silks" }
    ]
  },
  {
    id: "INV-2026-035", customer: "Vijaya Silk House", city: "Mumbai",
    invoiceDate: "10 Apr 2026", dueDate: "30 Apr 2026", total: 280000, paid: 280000, status: "Paid",
    payments: [
      { amount: 280000, date: "15 May 2026", utr: "UTR20260515VSH", method: "Bank Transfer", firmName: "Sri Venkateswara Textiles" }
    ]
  },
  {
    id: "INV-2026-032", customer: "Narayana Silk Emporium", city: "Hyderabad",
    invoiceDate: "01 Apr 2026", dueDate: "20 Apr 2026", total: 300000, paid: 254400, status: "Overdue", daysOverdue: 3,
    payments: [
      { amount: 150000, date: "12 Apr 2026", utr: "UTR20260412NS1", method: "Bank Transfer", firmName: "Lakshmi Silk Traders" },
      { amount: 104400, date: "18 Apr 2026", utr: "UTR20260418NS2", method: "Bank Transfer", firmName: "Lakshmi Silk Traders" }
    ]
  },
  {
    id: "INV-2026-029", customer: "Meenakshi Silks", city: "Chennai",
    invoiceDate: "15 Apr 2026", dueDate: "05 May 2026", total: 840000, paid: 420000, status: "Partial",
    payments: [
      { amount: 420000, date: "25 May 2026", utr: "UTR20260525MS", method: "Bank Transfer", firmName: "AK Traders" }
    ]
  },
  {
    id: "INV-2026-027", customer: "Kalavathi Exports", city: "Bengaluru",
    invoiceDate: "18 Apr 2026", dueDate: "02 May 2026", total: 660000, paid: 614400, status: "Overdue", daysOverdue: 2,
    payments: [
      { amount: 350000, date: "20 Apr 2026", utr: "UTR20260420KE1", method: "Bank Transfer", firmName: "Surat Zari Works" },
      { amount: 264400, date: "22 Apr 2026", utr: "UTR20260422KE2", method: "Bank Transfer", firmName: "Surat Zari Works" }
    ]
  },
];

const INV_STATUS_CFG: Record<InvoiceStatus, { bg: string; color: string; label: string }> = {
  Paid:    { bg: "rgba(30,102,64,0.10)",   color: "#1E6640", label: "✓ Paid"                              },
  Partial: { bg: "rgba(200,155,71,0.13)",  color: "#8B6018", label: "◑ Partial"                           },
  Pending: { bg: "rgba(74,107,138,0.10)",  color: "#2E5A8A", label: "⏱ Awaiting Payment — Within Terms"   },
  Overdue: { bg: "rgba(192,57,43,0.10)",   color: "#C0392B", label: "🔴 Overdue — Immediate Action Needed" },
};

function InvBadge({ status }: { status: InvoiceStatus }) {
  const c = INV_STATUS_CFG[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: "nowrap" as const }}>
      {c.label}
    </span>
  );
}

function CustomerCard({ inv, onViewInvoice, onRecordPayment, bulkOrderRef, bulkOrderData }: { inv: Invoice, onViewInvoice?: () => void, onRecordPayment?: () => void, bulkOrderRef?: string, bulkOrderData?: BulkOrder }) {
  const remaining = inv.total - inv.paid;
  const pct = Math.round((inv.paid / inv.total) * 100);
  const cfg = INV_STATUS_CFG[inv.status];
  const isPaid = inv.status === "Paid";

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Top accent bar */}
      <div style={{ height: 4, background: cfg.color, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: "18px 20px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, letterSpacing: "0.5px" }}>{inv.id}</span>
            {bulkOrderRef && (
              <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.antiqueGold, background: "rgba(200,155,71,0.13)", border: "1px solid rgba(200,155,71,0.30)", padding: "2px 7px", borderRadius: 6 }}>
                {bulkOrderRef}
              </span>
            )}
          </div>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.2, marginBottom: 6 }}>{inv.customer}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            <MapPin size={13} color={T.taupe} style={{ flexShrink: 0 }} />{inv.city}
          </div>
        </div>
        <InvBadge status={inv.status} />
      </div>

      {/* Date row — fixed height regardless of overdue badge */}
      <div style={{ padding: "0 20px 14px", display: "flex", gap: 0, flexShrink: 0 }}>
        <div style={{ flex: 1, borderRight: `1px solid ${T.borderDef}`, paddingRight: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 5 }}>
            <CalendarClock size={11} />Invoice Date
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, minHeight: 22 }}>{inv.invoiceDate}</div>
        </div>
        <div style={{ flex: 1, paddingLeft: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: F.mono, fontSize: 10, color: inv.status === "Overdue" ? T.crimson : T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 5 }}>
            <CalendarClock size={11} />Due Date
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 22 }}>
            <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: inv.status === "Overdue" ? 700 : 400, color: inv.status === "Overdue" ? T.crimson : T.luxuryBrown }}>{inv.dueDate}</span>
            {inv.daysOverdue
              ? <span style={{ fontFamily: F.mono, fontSize: 11, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 6px", borderRadius: 5, flexShrink: 0 }}>{inv.daysOverdue}d late</span>
              : <span style={{ display: "inline-block", width: 0 }} />}
          </div>
        </div>
      </div>

      {/* Financials — grows to fill */}
      <div style={{ padding: "14px 20px 16px", background: T.silkCream, margin: "0 14px 0", borderRadius: 11, flex: 1 }}>
        {bulkOrderData && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Quantity Ordered</span>
            <span style={{ fontFamily: F.mono, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown }}>{bulkOrderData.total} sarees</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Invoice Total</span>
          <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>₹{inv.total.toLocaleString("en-IN")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Remaining Due</span>
          <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: isPaid ? T.green : inv.status === "Overdue" ? T.crimson : T.antiqueGold }}>
            {isPaid ? "Fully Paid ✓" : `₹${remaining.toLocaleString("en-IN")}`}
          </span>
        </div>
        <div style={{ height: 8, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: isPaid ? T.green : inv.status === "Overdue" ? T.crimson : T.antiqueGold, borderRadius: 99 }} />
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 6, textAlign: "right" as const }}>{pct}% collected</div>
      </div>

      {/* Action buttons — always two buttons so all cards are equal height */}
      <div style={{ padding: "14px 14px 16px", display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={onViewInvoice} style={{ flex: 1, height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1px solid ${T.borderDef}`, borderRadius: 9, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
          <Eye size={13} />View Invoice
        </button>
        {isPaid ? (
          <button style={{ flex: 1, height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1px solid rgba(30,102,64,0.22)`, borderRadius: 9, background: "rgba(30,102,64,0.07)", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.green, cursor: "default" }}>
            <CheckCircle2 size={13} />Fully Paid
          </button>
        ) : (
          <button onClick={onRecordPayment} style={{ flex: 1, height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none", borderRadius: 9, background: T.royalBurgundy, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFFDF9", cursor: "pointer" }}>
            <IndianRupee size={13} />Record Payment
          </button>
        )}
      </div>
    </div>
  );
}

// ── View Invoice Modal ────────────────────────────────────────────────────────
function ViewInvoiceModal({ inv, bulkOrderData, onClose }: { inv: Invoice; bulkOrderData?: BulkOrder; onClose: () => void }) {
  const { dispatches } = useFinishing();
  const printRef = useRef<HTMLDivElement>(null);
  const remaining = inv.total - inv.paid;
  const pct = Math.round((inv.paid / inv.total) * 100);
  const isPaid = inv.status === "Paid";
  const dispatch = dispatches.find(d => d.invoiceNumber === inv.id);
  const firmName = dispatch?.firmName ?? "Beere Kesava & Brothers Silks";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,20,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: T.warmIvory, borderRadius: 20, width: 600, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative" }}>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9" }}>Invoice — {inv.id}</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.70)", marginTop: 4 }}>{inv.customer}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
            <X size={16} />
          </button>
        </div>

        <div ref={printRef} style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Customer details */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Customer Details</div>
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Name</span><div style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown }}>{inv.customer}</div></div>
              <div><span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>City</span><div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown }}>{inv.city}</div></div>
              {dispatch?.customerPhone && <div><span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Phone</span><div style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>{dispatch.customerPhone}</div></div>}
            </div>
          </div>

          {/* Order reference */}
          {bulkOrderData && (
            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Order Reference</div>
              <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold, background: "rgba(200,155,71,0.13)", border: "1px solid rgba(200,155,71,0.30)", padding: "5px 12px", borderRadius: 8 }}>
                {bulkOrderData.ref}
              </span>
            </div>
          )}

          {/* Saree list placeholder */}
          <div style={{ background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 16px", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            Sarees dispatched — see Inventory page for full dispatch records.
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 14px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Invoice Date</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>{inv.invoiceDate}</div>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 14px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Due Date</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: inv.status === "Overdue" ? T.crimson : T.luxuryBrown }}>{inv.dueDate}</div>
            </div>
          </div>

          {/* Financial breakdown */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Financial Breakdown</div>
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Invoice Total</span>
                <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>₹{inv.total.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Amount Paid</span>
                <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>₹{inv.paid.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Balance Due</span>
                <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: isPaid ? T.green : T.crimson }}>{isPaid ? "₹0" : `₹${remaining.toLocaleString("en-IN")}`}</span>
              </div>
              <div style={{ height: 8, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: isPaid ? T.green : T.antiqueGold, borderRadius: 99 }} />
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe, marginTop: 6, textAlign: "right" }}>{pct}% collected</div>
            </div>
          </div>

          {isPaid && dispatch?.invoiceNumber && (
            <div style={{ background: "rgba(30,102,64,0.07)", border: "1px solid rgba(30,102,64,0.20)", borderRadius: 10, padding: "12px 16px", fontFamily: F.ui, fontSize: 13, color: T.green }}>
              Paid in full.
            </div>
          )}

          <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Firm that raised this invoice: <span style={{ fontWeight: 600, color: T.luxuryBrown }}>{firmName}</span></div>
        </div>

        <div style={{ padding: "18px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => window.print()} style={{ height: 40, padding: "0 20px", display: "flex", alignItems: "center", gap: 7, background: "#fff", border: `1px solid ${T.borderDef}`, borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
            <FileText size={14} />Print Invoice
          </button>
          <button onClick={onClose} style={{ height: 40, padding: "0 24px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>Close</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Record Payment Modal ──────────────────────────────────────────────────────
function RecordPaymentModal({ inv, onClose, onSave }: { inv: Invoice; onClose: () => void; onSave: (amount: number, firmId: string, utr: string, date: string, method: string) => void }) {
  const { firms } = useFirms();
  const remaining = inv.total - inv.paid;
  const [amount, setAmount] = useState(String(remaining));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [utr, setUtr] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [firmId, setFirmId] = useState(firms[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", border: `1.5px solid ${T.borderDef}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.taupe, marginBottom: 6, display: "block" };

  const handleSave = () => {
    if (!amount || !utr || !firmId) return;
    setSaving(true);
    setTimeout(() => {
      onSave(parseFloat(amount), firmId, utr, date, method);
      setSaving(false);
    }, 500);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,20,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: T.warmIvory, borderRadius: 20, width: 480, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative" }}>
          <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 700, color: "#FFFDF9" }}>Record Payment — {inv.customer}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "24px 28px 8px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{inv.id}</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Invoice Reference</span>
          </div>

          <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div>
            <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.antiqueGold }}>₹{remaining.toLocaleString("en-IN")}</div>
          </div>

          {/* Previous Payments */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "18px 20px", boxShadow: "0 2px 10px rgba(74,6,27,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13.5, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}>
                <Receipt size={16} color={T.royalBurgundy} /> Previous Payments
              </div>
              <span style={{ fontSize: 11, fontFamily: F.ui, color: T.taupe, fontWeight: 600 }}>
                {inv.payments?.length || 0} transaction{inv.payments?.length !== 1 ? "s" : ""}
              </span>
            </div>

            {(!inv.payments || inv.payments.length === 0) ? (
              <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, fontStyle: "italic", textAlign: "center", padding: "16px 0", background: T.silkCream, borderRadius: 10 }}>
                No previous payments recorded.
              </div>
            ) : (
              <div className="section-nav-scroll" style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                {inv.payments.map((p, idx) => (
                  <div key={idx} style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: "12px 14px", background: T.warmIvory,
                    borderRadius: 10, border: "1px solid rgba(110,15,45,0.06)",
                    borderLeft: `4px solid ${T.antiqueGold}`,
                    boxShadow: "0 2px 6px rgba(74,6,27,0.01)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: T.royalBurgundy }}>
                          ₹{p.amount.toLocaleString("en-IN")}
                        </div>
                        <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, marginTop: 3 }}>
                          {p.utr} · {p.method}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ fontSize: 9.5, fontFamily: F.mono, fontWeight: 700, background: "rgba(200,155,71,0.11)", color: T.antiqueGold, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {p.firmName ?? "Beere Kesava & Brothers Silks"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
                          <CalendarClock size={11} /> {p.date}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Amount Received (₹) *</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Payment Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>UTR Number *</label>
            <input value={utr} onChange={e => setUtr(e.target.value)} placeholder="e.g. UTR2026042812345" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {["Bank Transfer", "Cheque", "Cash"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Firm Receiving Payment *</label>
            <select value={firmId} onChange={e => setFirmId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {firms.map(f => <option key={f.id} value={f.id}>{f.firmName}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" as const }} />
          </div>
        </div>

        <div style={{ padding: "18px 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 42, padding: "0 20px", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 999, fontFamily: F.ui, fontSize: 13, color: T.taupe, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ height: 42, padding: "0 24px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function WholesaleCollectionsSection() {
  const { bulkOrders } = useBulkOrders();
  const { firms, addIncomeEntry } = useFirms();
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES);
  const [view, setView] = useState<"card" | "list" | "table">("card");
  const [search, setSearch] = useState("");

  const [downloadModal, setDownloadModal] = useState(false);
  const [remindersModal, setRemindersModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [recordPayment, setRecordPayment] = useState<Invoice | null>(null);

  const [filterState, setFilterState] = useState("All States");
  const [filterCust, setFilterCust] = useState("All Customers");
  const [filterType, setFilterType] = useState("All Invoice Types");

  // Match invoice ID (INV-2026-XXX) to bulk order ref (ORD-2026-XXX) by trailing number
  const matchBulkOrder = (invId: string): BulkOrder | undefined => {
    const suffix = invId.split("-").pop();
    return bulkOrders.find(o => o.ref.split("-").pop() === suffix);
  };

  const handleSavePayment = (amount: number, firmId: string, utr: string, date: string, method: string) => {
    if (!recordPayment) return;
    const firm = firms.find(f => f.id === firmId);
    const firmName = firm ? firm.firmName : "Surat Zari Works";

    setInvoices(prev => prev.map(i => {
      if (i.id === recordPayment.id) {
        const newPaid = Math.min(i.total, i.paid + amount);
        const newPayments = [
          ...(i.payments || []),
          { amount, date, utr, method, firmName }
        ];
        return {
          ...i,
          paid: newPaid,
          status: newPaid >= i.total ? "Paid" : "Partial",
          payments: newPayments
        };
      }
      return i;
    }));
    addIncomeEntry(firmId, { description: `Wholesale payment — ${recordPayment.customer} (${recordPayment.id})`, amount, date, category: "Wholesale Sale" });
    toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} recorded for ${recordPayment.customer}`);
    setRecordPayment(null);
  };

  const overdueInvs = invoices.filter(i => i.status === "Overdue");
  const overdueTotal = overdueInvs.reduce((s, i) => s + (i.total - i.paid), 0);

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.customer.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const matchState = filterState === "All States" || inv.city === filterState; // close enough
    return matchSearch && matchState;
  });

  const viewOptions = [
    { key: "card",  Icon: LayoutGrid,   label: "Card View"  },
    { key: "list",  Icon: LayoutList,   label: "List View"  },
    { key: "table", Icon: AlignJustify, label: "Table View" },
  ] as const;

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.7px", padding: "12px 16px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "14px 16px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };

  return (
    <div id="pay-wholesale" style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        {/* ── Section header ──────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>
                Wholesale Customer Collections
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px" }}>
              Track all outstanding and collected payments from wholesale customers.
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} onClick={() => setDownloadModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer", flexShrink: 0 }}>
            <Download size={15} />Download Collections Report
          </motion.button>
        </div>

        {/* ── 4 stat cards ────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 24, marginBottom: 22, alignItems: "stretch" }}>
          {[
            {
              icon: <Receipt size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Invoiced This Month",
              value: "₹52,80,000",
              sub: "Across all wholesale customers",
              hi: false, crimson: false,
            },
            {
              icon: <CircleAlert size={22} color={T.crimson} />,
              iconBg: "rgba(192,57,43,0.08)",
              label: "Total Outstanding",
              value: "₹18,40,000",
              sub: "Yet to be collected",
              hi: false, crimson: true,
            },
            {
              icon: <TrendingUp size={22} color={T.green} />,
              iconBg: "rgba(30,102,64,0.08)",
              label: "Collected This Week",
              value: "₹6,20,000",
              sub: "Payments received this week",
              hi: false, crimson: false, green: true,
            },
            {
              icon: <BadgeCheck size={22} color={T.antiqueGold} />,
              iconBg: "rgba(200,155,71,0.16)",
              label: "Total Collected This Month",
              value: "₹32,60,000",
              sub: "Payments received this month",
              hi: true, crimson: false,
            },
          ].map((s: any, i) => (
            <div key={i} style={{ background: s.hi ? "linear-gradient(135deg,rgba(200,155,71,0.14),rgba(200,155,71,0.04))" : "#FFFFFF", borderRadius: 14, border: `1px solid ${s.hi ? T.borderGold : T.borderDef}`, padding: "20px 20px 18px", boxShadow: "0 2px 14px rgba(74,6,27,0.07)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 10 }}>
              {s.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: s.hi ? T.antiqueGold : T.taupe, lineHeight: 1.35, paddingTop: 2 }}>{s.label}</div>
              </div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: s.hi ? T.antiqueGold : s.crimson ? T.crimson : s.green ? T.green : T.luxuryBrown, lineHeight: 1 }}>
                <AnimCount raw={s.value} />
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Day 45 alert rule info ───────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(200,155,71,0.07)", border: "1px solid rgba(200,155,71,0.25)", borderLeft: `4px solid ${T.antiqueGold}`, borderRadius: 10, padding: "12px 20px", marginBottom: 14 }}>
          <CircleAlert size={16} style={{ color: T.antiqueGold, flexShrink: 0 }} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: "#8B6018", lineHeight: 1.55 }}>
            <strong>Payment alert rule:</strong> Days 1–44 = Awaiting Payment (within terms). Day 45+ = ⚠ Follow Up Now. Day 60+ = 🔴 Overdue — Immediate Action Needed.
          </span>
        </div>

        {/* ── Overdue alert banner ─────────────────────────────── */}
        {overdueInvs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.22)", borderLeft: `4px solid ${T.crimson}`, borderRadius: 10, padding: "14px 20px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CircleAlert size={18} style={{ color: T.crimson, flexShrink: 0 }} />
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.crimson }}>
                {overdueInvs.length} invoices are overdue (60+ days) — Total overdue amount:{" "}
                <span style={{ fontFamily: F.mono }}>₹{overdueTotal.toLocaleString("en-IN")}</span>
              </span>
            </div>
            <button onClick={() => setRemindersModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: T.crimson, border: "none", borderRadius: 8, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9", cursor: "pointer", flexShrink: 0 }}>
              Send Reminders
            </button>
          </div>
        )}

        {/* ── Filter + view toggle ─────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", border: `1px solid ${T.borderDef}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
            {viewOptions.map(({ key, Icon, label }) => (
              <motion.button key={key} onClick={() => setView(key as any)}
                animate={{ backgroundColor: view === key ? T.royalBurgundy : "#FFFFFF" }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: view === key ? "#FFFDF9" : T.taupe, border: "none", cursor: "pointer" }}>
                <Icon size={13} />{label}
              </motion.button>
            ))}
          </div>
          <DropBtn value={filterState} options={["All States", "Varanasi", "Surat", "Mumbai", "Hyderabad", "Chennai", "Bengaluru"]} onChange={setFilterState} />
          <DropBtn value={filterCust} options={["All Customers", "Lakshmi Silks", "Padmavathi Textiles", "Vijaya Silk House", "Narayana Silk Emporium", "Meenakshi Silks"]} onChange={setFilterCust} />
          <DropBtn value={filterType} options={["All Invoice Types", "Wholesale", "Retail", "Export"]} onChange={setFilterType} />
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice or customer..."
              style={{ width: "100%", padding: "8px 12px 8px 32px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        </div>

        {/* ── Card grid ────────────────────────────────────────── */}
        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32, alignItems: "stretch" }}>
            {filtered.map((inv, i) => {
              const matchingOrder = matchBulkOrder(inv.id);
              return (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }} style={{ display: "flex", flexDirection: "column" }}>
                  <CustomerCard inv={inv} onViewInvoice={() => setViewInvoice(inv)} onRecordPayment={() => setRecordPayment(inv)} bulkOrderRef={matchingOrder?.ref} bulkOrderData={matchingOrder} />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── List view ────────────────────────────────────────── */}
        {view === "list" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 32 }}>
            {filtered.map((inv, i) => {
              const rem = inv.total - inv.paid;
              return (
                <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderBottom: `1px solid ${T.borderDef}`, borderLeft: `4px solid ${INV_STATUS_CFG[inv.status].color}` }}>
                  <div style={{ flex: "0 0 130px", fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{inv.id}</div>
                  <div style={{ flex: "0 0 210px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{inv.customer}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
                      <MapPin size={11} />{inv.city}
                    </div>
                  </div>
                  <div style={{ flex: 1, fontFamily: F.mono, fontSize: 14, color: T.luxuryBrown, fontWeight: 700 }}>₹{inv.total.toLocaleString("en-IN")}</div>
                  <div style={{ flex: 1, fontFamily: F.mono, fontSize: 13, color: rem === 0 ? T.green : T.crimson, fontWeight: 600 }}>
                    {rem === 0 ? "— Paid" : `₹${rem.toLocaleString("en-IN")}`}
                  </div>
                  <div style={{ flex: "0 0 110px", fontFamily: F.ui, fontSize: 13, color: inv.status === "Overdue" ? T.crimson : T.taupe, fontWeight: inv.status === "Overdue" ? 600 : 400 }}>{inv.dueDate}</div>
                  <InvBadge status={inv.status} />
                  <button onClick={() => setViewInvoice(inv)} style={{ padding: "6px 14px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>View</button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Table view ───────────────────────────────────────── */}
        {view === "table" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                <thead>
                  <tr>
                    <th style={TH}>Invoice ID</th>
                    <th style={TH}>Customer</th>
                    <th style={TH}>City</th>
                    <th style={TH}>Invoice Date</th>
                    <th style={TH}>Due Date</th>
                    <th style={{ ...TH, textAlign: "right" as const }}>Total Amount</th>
                    <th style={{ ...TH, textAlign: "right" as const }}>Paid Amount</th>
                    <th style={{ ...TH, textAlign: "right" as const }}>Remaining Due</th>
                    <th style={{ ...TH, textAlign: "center" as const }}>Status</th>
                    <th style={{ ...TH, textAlign: "center" as const }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv, i) => {
                    const rem = inv.total - inv.paid;
                    return (
                      <tr key={inv.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${INV_STATUS_CFG[inv.status].color}` }}>
                        <td style={TD}>
                          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{inv.id}</span>
                        </td>
                        <td style={TD}>
                          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{inv.customer}</span>
                        </td>
                        <td style={TD}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.taupe, fontSize: 13 }}>
                            <MapPin size={12} />{inv.city}
                          </div>
                        </td>
                        <td style={TD}>{inv.invoiceDate}</td>
                        <td style={{ ...TD, color: inv.status === "Overdue" ? T.crimson : T.luxuryBrown, fontWeight: inv.status === "Overdue" ? 700 : 400 }}>
                          {inv.dueDate}
                          {inv.daysOverdue && <span style={{ fontFamily: F.mono, fontSize: 11, marginLeft: 6, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 6px", borderRadius: 5 }}>{inv.daysOverdue}d late</span>}
                        </td>
                        <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14 }}>₹{inv.total.toLocaleString("en-IN")}</td>
                        <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 600, fontSize: 13, color: T.green }}>₹{inv.paid.toLocaleString("en-IN")}</td>
                        <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: rem === 0 ? T.green : inv.status === "Overdue" ? T.crimson : T.antiqueGold }}>
                          {rem === 0 ? "Paid ✓" : `₹${rem.toLocaleString("en-IN")}`}
                        </td>
                        <td style={{ ...TD, textAlign: "center" as const }}><InvBadge status={inv.status} /></td>
                        <td style={{ ...TD, textAlign: "center" as const }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            <button onClick={() => setViewInvoice(inv)} style={{ padding: "5px 12px", background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1px solid rgba(110,15,45,0.16)`, borderRadius: 7, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Eye size={12} />View
                            </button>
                            {inv.status !== "Paid" && (
                              <button onClick={() => setRecordPayment(inv)} style={{ padding: "5px 12px", background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 7, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Pay</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: T.warmCream, borderTop: `2px solid ${T.borderDef}` }}>
                    <td colSpan={5} style={{ ...TD, fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown, fontSize: 13 }}>
                      Totals — {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
                    </td>
                    <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>
                      ₹{filtered.reduce((s, inv) => s + inv.total, 0).toLocaleString("en-IN")}
                    </td>
                    <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 13, color: T.green }}>
                      ₹{filtered.reduce((s, inv) => s + inv.paid, 0).toLocaleString("en-IN")}
                    </td>
                    <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.crimson }}>
                      ₹{filtered.reduce((s, inv) => s + (inv.total - inv.paid), 0).toLocaleString("en-IN")}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <ActionModal open={downloadModal} onClose={() => setDownloadModal(false)} title="Download Collections Report" desc="Generate and download the wholesale customer collections report." actionLabel="Download" icon={Download} />
        <ActionModal open={remindersModal} onClose={() => setRemindersModal(false)} title="Send Reminders" desc={`Send payment reminders to ${overdueInvs.length} customers for overdue invoices.`} actionLabel="Send Now" icon={Mail} />
        <AnimatePresence>
          {viewInvoice && <ViewInvoiceModal inv={viewInvoice} bulkOrderData={matchBulkOrder(viewInvoice.id)} onClose={() => setViewInvoice(null)} />}
          {recordPayment && <RecordPaymentModal inv={recordPayment} onClose={() => setRecordPayment(null)} onSave={handleSavePayment} />}
        </AnimatePresence>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION D — VENDOR PAYMENTS
// ══════════════════════════════════════════════════════════════════════════════
type VendorStatus = "Paid" | "Partial" | "Overdue" | "Pending";

interface VendorPayment {
  id: string; vendor: string; poNumber: string;
  invoiceAmt: number; paidAmt: number;
  dueDate: string; status: VendorStatus; daysOverdue?: number;
  utr?: string;
}

const VENDOR_PAYMENTS: VendorPayment[] = [
  { id: "VP-001", vendor: "Surat Zari Works",           poNumber: "PO-2026-020", invoiceAmt: 192000, paidAmt: 192000, dueDate: "05 May 2026", status: "Paid",    utr: "UTR20260505001" },
  { id: "VP-002", vendor: "Kanchipuram Silks",          poNumber: "PO-2026-021", invoiceAmt: 375000, paidAmt: 375000, dueDate: "08 May 2026", status: "Paid",    utr: "UTR20260508002" },
  { id: "VP-003", vendor: "Sri Venkateswara Textiles",  poNumber: "PO-2026-022", invoiceAmt: 140000, paidAmt: 140000, dueDate: "12 May 2026", status: "Paid",    utr: "UTR20260512003" },
  { id: "VP-004", vendor: "Sri Venkateswara Textiles",  poNumber: "PO-2026-023", invoiceAmt: 140000, paidAmt: 80000,  dueDate: "18 May 2026", status: "Overdue", daysOverdue: 13 },
  { id: "VP-005", vendor: "Ratan Zari Works",           poNumber: "PO-2026-031", invoiceAmt: 150000, paidAmt: 0,      dueDate: "12 May 2026", status: "Overdue", daysOverdue: 18 },
];

const VENDOR_STATUS_CFG: Record<VendorStatus, { bg: string; color: string; label: string }> = {
  Paid:    { bg: "rgba(30,102,64,0.10)",   color: "#1E6640", label: "✓ Paid"    },
  Partial: { bg: "rgba(200,155,71,0.13)",  color: "#8B6018", label: "◑ Partial" },
  Pending: { bg: "rgba(74,107,138,0.10)",  color: "#2E5A8A", label: "⏱ Pending" },
  Overdue: { bg: "rgba(192,57,43,0.10)",   color: "#C0392B", label: "⚠ Overdue" },
};

function VendorBadge({ status }: { status: VendorStatus }) {
  const c = VENDOR_STATUS_CFG[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 11px", borderRadius: 20, fontFamily: F.mono, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: "nowrap" as const }}>
      {c.label}
    </span>
  );
}

function VendorCard({ vp, matchedPO, onPay, onView, onViewPO, selected }: { vp: VendorPayment; matchedPO?: PurchaseOrder; onPay: (id: string) => void; onView?: () => void; onViewPO?: () => void; selected: boolean }) {
  const balance = vp.invoiceAmt - vp.paidAmt;
  const pct = Math.round((vp.paidAmt / vp.invoiceAmt) * 100);
  const cfg = VENDOR_STATUS_CFG[vp.status];
  const isPaid = vp.status === "Paid";
  const vendorName = matchedPO?.vendor ?? vp.vendor;

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Top accent bar */}
      <div style={{ height: 4, background: cfg.color, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: "18px 20px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(110,15,45,0.07)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={20} color={T.royalBurgundy} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.25, marginBottom: 3 }}>{vendorName}</div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{vp.id}</div>
          </div>
        </div>
        <VendorBadge status={vp.status} />
      </div>

      {/* PO / Firm row */}
      <div style={{ padding: "0 20px 14px", display: "flex", gap: 0, flexShrink: 0 }}>
        <div style={{ flex: 1, borderRight: `1px solid ${T.borderDef}`, paddingRight: 14 }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 4 }}>PO Number</div>
          <div onClick={onViewPO}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.textDecoration = "underline"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.textDecoration = "none"}
            style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, fontWeight: 600, cursor: onViewPO ? "pointer" : "default" }}>{vp.poNumber}</div>
        </div>
        <div style={{ flex: 1, paddingLeft: 14 }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 4 }}>Firm Name</div>
          <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{matchedPO?.firmName ?? "—"}</div>
        </div>
      </div>

      {/* Materials summary row */}
      {matchedPO && (
        <div style={{ padding: "0 20px 14px", flexShrink: 0 }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 4 }}>Materials</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {matchedPO.materials.map((m, i) => (
              <div key={i} style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>
                <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 10.5, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "1px 6px", borderRadius: 5, marginRight: 6 }}>{m.materialType}</span>
                {m.description || m.subtype} — {m.quantity} {m.unit}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due date row */}
      <div style={{ padding: "0 20px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: F.mono, fontSize: 10, color: vp.status === "Overdue" ? T.crimson : T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 5 }}>
          <CalendarClock size={11} />Due Date
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 22 }}>
          <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: vp.status === "Overdue" ? 700 : 400, color: vp.status === "Overdue" ? T.crimson : T.luxuryBrown }}>{vp.dueDate}</span>
          {vp.daysOverdue
            ? <span style={{ fontFamily: F.mono, fontSize: 11, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 7px", borderRadius: 5 }}>{vp.daysOverdue}d late</span>
            : <span style={{ display: "inline-block", width: 0 }} />}
        </div>
      </div>

      {/* Financials — flex: 1 so all cards same height */}
      <div style={{ padding: "14px 20px 16px", background: T.silkCream, margin: "0 14px 0", borderRadius: 11, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Invoice Amount</span>
          <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>₹{vp.invoiceAmt.toLocaleString("en-IN")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Paid So Far</span>
          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: T.green }}>₹{vp.paidAmt.toLocaleString("en-IN")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Balance Due</span>
          <span style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: isPaid ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
            {isPaid ? "Fully Paid ✓" : `₹${balance.toLocaleString("en-IN")}`}
          </span>
        </div>
        <div style={{ height: 8, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: isPaid ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold, borderRadius: 99 }} />
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 6, textAlign: "right" as const }}>{pct}% paid</div>
        {vp.utr && (
          <div style={{ marginTop: 8, fontFamily: F.mono, fontSize: 11, color: T.green, display: "flex", alignItems: "center", gap: 5 }}>
            <CheckCircle2 size={11} />UTR: {vp.utr}
          </div>
        )}
      </div>

      {/* Action buttons — always two for equal height */}
      <div style={{ padding: "14px 14px 16px", display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={onView} style={{ flex: 1, height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1px solid ${T.borderDef}`, borderRadius: 9, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
          <Eye size={13} />View Details
        </button>
        {isPaid ? (
          <button style={{ flex: 1, height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1px solid rgba(30,102,64,0.22)`, borderRadius: 9, background: "rgba(30,102,64,0.07)", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.green, cursor: "default" }}>
            <CheckCircle2 size={13} />Fully Paid
          </button>
        ) : (
          <button onClick={() => onPay(vp.id)} style={{ flex: 1, height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none", borderRadius: 9, background: selected ? T.deepWine : T.royalBurgundy, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFFDF9", cursor: "pointer" }}>
            <IndianRupee size={13} />Pay Now
          </button>
        )}
      </div>
    </div>
  );
}

// Static sample payment history per vendor PO (for VendorDetailModal — no live payment ledger exists yet)
const VENDOR_STATIC_PAYMENT_HISTORY: Record<string, { amount: number; date: string; utr: string; method: string }[]> = {
  "VP-001": [{ amount: 192000, date: "05 May 2026", utr: "UTR20260505001", method: "Bank Transfer" }],
  "VP-002": [{ amount: 375000, date: "08 May 2026", utr: "UTR20260508002", method: "RTGS" }],
  "VP-003": [{ amount: 140000, date: "12 May 2026", utr: "UTR20260512003", method: "NEFT" }],
  "VP-004": [{ amount: 80000, date: "01 May 2026", utr: "UTR20260501004", method: "Bank Transfer" }],
};

// ── Vendor Detail Modal ───────────────────────────────────────────────────────
function VendorDetailModal({ vp, matchedPO, onClose }: { vp: VendorPayment; matchedPO?: PurchaseOrder; onClose: () => void }) {
  const balance = vp.invoiceAmt - vp.paidAmt;
  const history = VENDOR_STATIC_PAYMENT_HISTORY[vp.id] ?? [];
  const vendorName = matchedPO?.vendor ?? vp.vendor;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,20,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: T.warmIvory, borderRadius: 20, width: 600, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative" }}>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9" }}>{vendorName}</div>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: T.goldLight, marginTop: 4 }}>{vp.poNumber}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 22 }}>
          {/* PO details */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>PO Details</div>
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div><span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>PO Number</span><div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{vp.poNumber}</div></div>
              <div><span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Firm Name</span><div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{matchedPO?.firmName ?? "—"}</div></div>
              <div><span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Vendor</span><div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{vendorName}</div></div>
              <div><span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Vendor City</span><div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{matchedPO?.vendorCity ?? "—"}</div></div>
            </div>
            {matchedPO && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {matchedPO.materials.map((m, i) => (
                  <div key={i} style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 11, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 8px", borderRadius: 6 }}>{m.materialType}</span>
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, flex: 1 }}>{m.description || m.subtype}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.taupe }}>{m.quantity} {m.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment details */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Payment Details</div>
            <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Invoice Amount</span>
                <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>₹{vp.invoiceAmt.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Paid</span>
                <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: T.green }}>₹{vp.paidAmt.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Balance</span>
                <span style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: balance === 0 ? T.green : T.crimson }}>{balance === 0 ? "₹0" : `₹${balance.toLocaleString("en-IN")}`}</span>
              </div>
              {vp.utr && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>UTR Number</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.green }}>{vp.utr}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Due Date</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: vp.status === "Overdue" ? T.crimson : T.luxuryBrown }}>{vp.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 8 }}>Payment History</div>
            {history.length === 0 ? (
              <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px", fontFamily: F.ui, fontSize: 13, color: T.taupe, textAlign: "center" }}>No payments recorded yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                    <div><div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, textTransform: "uppercase" }}>Amount</div><div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.green }}>₹{h.amount.toLocaleString("en-IN")}</div></div>
                    <div><div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, textTransform: "uppercase" }}>Date</div><div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{h.date}</div></div>
                    <div><div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, textTransform: "uppercase" }}>UTR</div><div style={{ fontFamily: F.mono, fontSize: 11.5, color: T.luxuryBrown }}>{h.utr}</div></div>
                    <div><div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, textTransform: "uppercase" }}>Method</div><div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>{h.method}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "18px 28px", borderTop: `1px solid ${T.borderDef}`, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 40, padding: "0 24px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>Close</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Vendor Pay Now Modal ──────────────────────────────────────────────────────
function VendorPayNowModal({ vp, onClose, onSave }: { vp: VendorPayment; onClose: () => void; onSave: (amount: number, firmId: string, utr: string) => void }) {
  const { firms } = useFirms();
  const balance = vp.invoiceAmt - vp.paidAmt;
  const [amount, setAmount] = useState(String(balance));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [utr, setUtr] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [firmId, setFirmId] = useState(firms[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", border: `1.5px solid ${T.borderDef}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.taupe, marginBottom: 6, display: "block" };

  const handleSave = () => {
    if (!amount || !utr || !firmId) return;
    setSaving(true);
    setTimeout(() => {
      onSave(parseFloat(amount), firmId, utr);
      setSaving(false);
    }, 500);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,20,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: EASE }} onClick={e => e.stopPropagation()}
        style={{ background: T.warmIvory, borderRadius: 20, width: 480, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,6,27,0.28)", border: `1px solid ${T.borderDef}` }}
      >
        <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "24px 28px", position: "relative" }}>
          <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 700, color: "#FFFDF9" }}>Pay Vendor — {vp.vendor}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.85)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "24px 28px 8px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div>
            <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.antiqueGold }}>₹{balance.toLocaleString("en-IN")}</div>
          </div>

          <div>
            <label style={labelStyle}>Amount to Pay (₹) *</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Payment Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>UTR Number *</label>
            <input value={utr} onChange={e => setUtr(e.target.value)} placeholder="e.g. UTR2026053012345" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {["Bank Transfer", "Cheque", "RTGS", "NEFT"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Paying from Firm *</label>
            <select value={firmId} onChange={e => setFirmId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {firms.map(f => <option key={f.id} value={f.id}>{f.firmName}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" as const }} />
          </div>
        </div>

        <div style={{ padding: "18px 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 42, padding: "0 20px", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 999, fontFamily: F.ui, fontSize: 13, color: T.taupe, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ height: 42, padding: "0 24px", background: T.royalBurgundy, border: "none", borderRadius: 999, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer" }}>
            {saving ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Vendor payment Excel upload types ─────────────────────────────────────────
interface VendorExcelRow {
  poNumber: string; amountPaid: number; utrNumber: string; paymentDate: string; firmName: string;
}
interface VendorMatchedRow extends VendorExcelRow { vendorPayment: VendorPayment; }
interface VendorUnmatchedRow extends VendorExcelRow {}
interface VendorUploadResult {
  fileName: string; totalRows: number; matched: VendorMatchedRow[]; unmatched: VendorUnmatchedRow[];
}

// ── Vendor Payment Excel Upload Panel ─────────────────────────────────────────
function VendorUploadPanel({ vendorPayments, onMatched }: { vendorPayments: VendorPayment[]; onMatched: (matched: VendorMatchedRow[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<VendorUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const normalize = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const HEADER_MAP: Record<string, keyof VendorExcelRow> = {
    ponumber: "poNumber", amountpaid: "amountPaid", utrnumber: "utrNumber", paymentdate: "paymentDate", firmname: "firmName",
  };

  const parseFile = useCallback((file: File) => {
    setParsing(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (raw.length === 0) { setError("The uploaded file is empty or has no data rows."); setParsing(false); return; }

        const firstRowKeys = Object.keys(raw[0]);
        const colMap: Record<string, keyof VendorExcelRow> = {};
        firstRowKeys.forEach(k => {
          const norm = normalize(k);
          if (HEADER_MAP[norm]) colMap[k] = HEADER_MAP[norm];
        });

        const missing = (Object.values(HEADER_MAP) as string[]).filter(v => !Object.values(colMap).includes(v as keyof VendorExcelRow));
        if (missing.length > 0) {
          setError(`Missing required columns: ${missing.join(", ")}. Expected: PO Number, Amount Paid, UTR Number, Payment Date, Firm Name.`);
          setParsing(false);
          return;
        }

        const rows: VendorExcelRow[] = raw.map(r => {
          const out: Partial<VendorExcelRow> = {};
          Object.entries(colMap).forEach(([col, key]) => {
            if (key === "amountPaid") out[key] = parseFloat(String(r[col]).replace(/[^\d.]/g, "")) || 0;
            else (out as Record<string, unknown>)[key] = String(r[col] ?? "").trim();
          });
          return out as VendorExcelRow;
        });

        const matched: VendorMatchedRow[] = [];
        const unmatched: VendorUnmatchedRow[] = [];
        rows.forEach(row => {
          const found = vendorPayments.find(v => v.poNumber.trim().toLowerCase() === row.poNumber.trim().toLowerCase());
          if (found) matched.push({ ...row, vendorPayment: found });
          else unmatched.push(row);
        });

        setResult({ fileName: file.name, totalRows: rows.length, matched, unmatched });
        if (matched.length > 0) onMatched(matched);
      } catch {
        setError("Failed to read the file. Please ensure it is a valid .xlsx or .xls file.");
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [vendorPayments, onMatched]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };
  const handleReset = () => { setResult(null); setError(null); };

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UploadCloud size={22} color={T.royalBurgundy} />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 3 }}>Upload Vendor Payment File</div>
            <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, lineHeight: 1.55, maxWidth: 560 }}>
              Upload an Excel file (.xlsx / .xls) with columns: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>PO Number · Amount Paid · UTR Number · Payment Date · Firm Name</span>. System will auto-match vendor bills and flag unmatched rows.
            </div>
            {result && (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={12} />{result.fileName} — {result.totalRows} rows processed
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          {result && (
            <motion.button whileHover={{ scale: 1.02 }} onClick={handleReset}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 9, color: T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>
              <X size={13} />Clear
            </motion.button>
          )}
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: "none" }} />
          <motion.button whileHover={{ scale: 1.02 }} onClick={() => fileInputRef.current?.click()} disabled={parsing}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: T.royalBurgundy, border: "none", borderRadius: 9, color: "#FFFDF9", fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const, opacity: parsing ? 0.7 : 1 }}>
            <UploadCloud size={14} />{parsing ? "Processing…" : result ? "Upload New File" : "Upload Vendor Payment File"}
          </motion.button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, background: "rgba(192,57,43,0.07)", border: `1px solid rgba(192,57,43,0.22)`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertTriangle size={16} color={T.crimson} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, lineHeight: 1.55 }}>{error}</span>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 22 }}>
            {[
              { label: "Total Rows", value: String(result.totalRows), color: T.luxuryBrown, bg: "#FFFFFF", icon: <FileText size={18} color={T.royalBurgundy} /> },
              { label: "Matched Bills", value: String(result.matched.length), color: T.green, bg: "rgba(30,102,64,0.07)", icon: <CheckCircle2 size={18} color={T.green} /> },
              { label: "Unmatched Rows", value: String(result.unmatched.length), color: T.crimson, bg: "rgba(192,57,43,0.06)", icon: <AlertTriangle size={18} color={T.crimson} /> },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(74,6,27,0.05)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {result.matched.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <CheckCircle2 size={16} color={T.green} />
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Matched Vendor Bills</span>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: T.green, background: "rgba(30,102,64,0.10)", padding: "2px 9px", borderRadius: 20 }}>{result.matched.length}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {result.matched.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }}
                    style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid rgba(30,102,64,0.22)`, borderLeft: `4px solid ${T.green}`, boxShadow: "0 2px 10px rgba(30,102,64,0.06)", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{m.vendorPayment.vendor}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy }}>{m.poNumber}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                      <div><div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const }}>Amount</div><div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>₹{m.amountPaid.toLocaleString("en-IN")}</div></div>
                      <div><div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const }}>UTR</div><div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{m.utrNumber || "—"}</div></div>
                      <div><div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const }}>Date</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{m.paymentDate}</div></div>
                      <div><div style={{ fontFamily: F.ui, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const }}>Firm</div><div style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{m.firmName || "—"}</div></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {result.unmatched.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <AlertTriangle size={16} color={T.crimson} />
                <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>Unmatched Rows</span>
                <span style={{ fontFamily: F.mono, fontSize: 11, color: T.crimson, background: "rgba(192,57,43,0.10)", padding: "2px 9px", borderRadius: 20 }}>{result.unmatched.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.unmatched.map((u, i) => (
                  <div key={i} style={{ background: "rgba(192,57,43,0.04)", borderRadius: 12, border: `1px solid rgba(192,57,43,0.22)`, borderLeft: `4px solid ${T.crimson}`, padding: "12px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.crimson }}>
                    No vendor bill found with PO Number <strong>{u.poNumber || "—"}</strong> — please verify manually
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function VendorPaymentsSection() {
  const { pos } = usePO();
  const { firms, addExpenseEntry } = useFirms();
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>(VENDOR_PAYMENTS);
  const [view, setView] = useState<"card" | "list" | "table">("card");
  const [selVendor, setSelVendor] = useState("VP-004");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("2026-05-30");
  const [payMethod, setPayMethod] = useState("Bank Transfer");
  const [utrNumber, setUtrNumber] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Bill Status");
  const [vendorFilter, setVendorFilter] = useState("All Vendors");
  const [search, setSearch] = useState("");

  const [downloadModal, setDownloadModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [viewDetails, setViewDetails] = useState<VendorPayment | null>(null);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  const [payNow, setPayNow] = useState<VendorPayment | null>(null);

  const matchPO = (poNumber: string) => pos.find(p => p.poNumber === poNumber);

  const handleSavePayment = (amount: number, firmId: string, utr: string) => {
    if (!payNow) return;
    setVendorPayments(prev => prev.map(v => v.id === payNow.id
      ? { ...v, paidAmt: Math.min(v.invoiceAmt, v.paidAmt + amount), status: (v.paidAmt + amount) >= v.invoiceAmt ? "Paid" : "Partial", utr }
      : v));
    addExpenseEntry(firmId, { description: `Vendor payment — ${payNow.vendor} (${payNow.poNumber})`, amount, date: new Date().toISOString().slice(0, 10), category: "Material Purchase" });
    toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} recorded for ${payNow.vendor}`);
    setPayNow(null);
  };

  const handleExcelMatched = (matched: VendorMatchedRow[]) => {
    setVendorPayments(prev => prev.map(v => {
      const m = matched.find(x => x.vendorPayment.id === v.id);
      if (!m) return v;
      const newPaid = Math.min(v.invoiceAmt, v.paidAmt + m.amountPaid);
      return { ...v, paidAmt: newPaid, utr: m.utrNumber, status: newPaid >= v.invoiceAmt ? "Paid" : "Partial" };
    }));
    toast.success(`${matched.length} vendor payment${matched.length !== 1 ? "s" : ""} matched and updated`);
  };

  const selVP = vendorPayments.find(v => v.id === selVendor) ?? vendorPayments[3];
  const selBalance = selVP.invoiceAmt - selVP.paidAmt;
  const afterPay = selBalance - (parseFloat(payAmount) || 0);

  const overdueVendors = vendorPayments.filter(v => v.status === "Overdue");
  const maxDaysOverdue = Math.max(...overdueVendors.map(v => v.daysOverdue ?? 0));
  const pendingBalance = vendorPayments.reduce((s, v) => s + (v.invoiceAmt - v.paidAmt), 0);

  const filtered = vendorPayments.filter(v => {
    const matchStatus = statusFilter === "All Bill Status" || v.status === statusFilter;
    const matchVendor = vendorFilter === "All Vendors" || v.vendor === vendorFilter;
    const matchSearch = !search || v.vendor.toLowerCase().includes(search.toLowerCase()) || v.poNumber.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchVendor && matchSearch;
  });

  const viewOptions = [
    { key: "card",  Icon: LayoutGrid,   label: "Card View"  },
    { key: "list",  Icon: LayoutList,   label: "List View"  },
    { key: "table", Icon: AlignJustify, label: "Table View" },
  ] as const;

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.7px", padding: "12px 16px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "14px 16px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const fieldStyle: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 8, outline: "none", boxSizing: "border-box" as const };
  const labelStyle: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 };

  return (
    <div id="pay-vendor" style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        {/* ── Section header ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>
                Vendor Payments
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px" }}>
              Track payments made to raw material and thread suppliers. Record and verify all vendor bills.
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} onClick={() => setDownloadModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer", flexShrink: 0 }}>
            <Download size={15} />Download Vendor Payment Report
          </motion.button>
        </div>

        {/* ── 4 stat cards ───────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 24, marginBottom: 22, alignItems: "stretch" }}>
          {[
            {
              icon: <Wallet size={22} color={T.royalBurgundy} />,
              iconBg: "rgba(110,15,45,0.08)",
              label: "Total Vendor Payments",
              value: "₹8,60,000",
              sub: "Paid to vendors this month",
              hi: false, crimson: false, green: false,
            },
            {
              icon: <CircleAlert size={22} color={T.crimson} />,
              iconBg: "rgba(192,57,43,0.08)",
              label: "Pending Balance",
              value: `₹${pendingBalance.toLocaleString("en-IN")}`,
              sub: "Outstanding to vendors",
              hi: false, crimson: true, green: false,
            },
            {
              icon: <BadgeCheck size={22} color={T.green} />,
              iconBg: "rgba(30,102,64,0.08)",
              label: "Pending Tax Docs",
              value: "0",
              sub: "All invoices have GST docs",
              hi: false, crimson: false, green: true,
            },
            {
              icon: <Clock size={22} color={T.antiqueGold} />,
              iconBg: "rgba(200,155,71,0.16)",
              label: "Overdue Since (Days)",
              value: `${maxDaysOverdue}`,
              sub: "Days since oldest overdue bill",
              hi: true, crimson: false, green: false,
            },
          ].map((s, i) => (
            <div key={i} style={{ background: s.hi ? "linear-gradient(135deg,rgba(200,155,71,0.14),rgba(200,155,71,0.04))" : "#FFFFFF", borderRadius: 14, border: `1px solid ${s.hi ? T.borderGold : T.borderDef}`, padding: "20px 20px 18px", boxShadow: "0 2px 14px rgba(74,6,27,0.07)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 10 }}>
              {s.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: s.hi ? T.antiqueGold : T.taupe, lineHeight: 1.35, paddingTop: 2 }}>{s.label}</div>
              </div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: s.hi ? T.antiqueGold : s.crimson ? T.crimson : s.green ? T.green : T.luxuryBrown, lineHeight: 1 }}>
                <AnimCount raw={s.value} />
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Overdue alert ───────────────────────────────────── */}
        {overdueVendors.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.22)", borderLeft: `4px solid ${T.crimson}`, borderRadius: 10, padding: "14px 20px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CircleAlert size={18} style={{ color: T.crimson, flexShrink: 0 }} />
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.crimson }}>
                {overdueVendors.length} vendor bill{overdueVendors.length > 1 ? "s are" : " is"} overdue — Total pending:{" "}
                <span style={{ fontFamily: F.mono }}>₹{overdueVendors.reduce((s, v) => s + v.invoiceAmt - v.paidAmt, 0).toLocaleString("en-IN")}</span>
              </span>
            </div>
            <button onClick={() => setContactModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: T.crimson, border: "none", borderRadius: 8, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9", cursor: "pointer", flexShrink: 0 }}>
              Contact Vendors
            </button>
          </div>
        )}

        {/* ── Upload Vendor Payment File panel ─────────────────── */}
        <VendorUploadPanel vendorPayments={vendorPayments} onMatched={handleExcelMatched} />

        {/* ── View toggle + Filter bar ─────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: `1px solid ${T.borderDef}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
            {viewOptions.map(({ key, Icon, label }) => (
              <motion.button key={key} onClick={() => setView(key as any)}
                animate={{ backgroundColor: view === key ? T.royalBurgundy : "#FFFFFF" }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: view === key ? "#FFFDF9" : T.taupe, border: "none", cursor: "pointer" }}>
                <Icon size={13} />{label}
              </motion.button>
            ))}
          </div>
          <DropBtn value={vendorFilter} options={["All Vendors", "Sri Lakshmi Raw Silks", "Banarasi Thread House", "Nanak Silk Traders", "Vijaylakshmi Silks", "Ratan Zari Works"]} onChange={setVendorFilter} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, cursor: "pointer", outline: "none" }}>
            {["All Bill Status","Paid","Partial","Overdue","Pending"].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor, PO number, bill number..."
              style={{ width: "100%", padding: "8px 12px 8px 32px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        </div>

        {/* ── Card View ────────────────────────────────────────── */}
        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32, alignItems: "stretch" }}>
            {filtered.map((vp, i) => (
              <motion.div key={vp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07, ease: EASE }} style={{ display: "flex", flexDirection: "column" }}>
                <VendorCard vp={vp} matchedPO={matchPO(vp.poNumber)} onPay={() => setPayNow(vp)} onView={() => setViewDetails(vp)} onViewPO={() => setViewPO(matchPO(vp.poNumber) ?? null)} selected={selVendor === vp.id} />
              </motion.div>
            ))}
          </div>
        )}

        {/* ── List View ────────────────────────────────────────── */}
        {view === "list" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 32 }}>
            {filtered.map((vp, i) => {
              const balance = vp.invoiceAmt - vp.paidAmt;
              const cfg = VENDOR_STATUS_CFG[vp.status];
              return (
                <div key={vp.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderBottom: `1px solid ${T.borderDef}`, borderLeft: `4px solid ${cfg.color}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={18} color={T.royalBurgundy} />
                  </div>
                  <div style={{ flex: "0 0 200px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{vp.vendor}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, marginTop: 2 }}>{vp.poNumber}</div>
                  </div>
                  <div style={{ flex: 1, fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>₹{vp.invoiceAmt.toLocaleString("en-IN")}</div>
                  <div style={{ flex: 1, fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: balance === 0 ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
                    {balance === 0 ? "Paid ✓" : `₹${balance.toLocaleString("en-IN")}`}
                  </div>
                  <div style={{ flex: "0 0 120px", fontFamily: F.ui, fontSize: 13, color: vp.status === "Overdue" ? T.crimson : T.taupe, fontWeight: vp.status === "Overdue" ? 600 : 400 }}>
                    {vp.dueDate}
                    {vp.daysOverdue && <span style={{ fontFamily: F.mono, fontSize: 10, marginLeft: 5, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 5px", borderRadius: 4 }}>{vp.daysOverdue}d</span>}
                  </div>
                  <VendorBadge status={vp.status} />
                  <button onClick={() => setViewDetails(vp)} style={{ padding: "6px 14px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>View</button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Table View + Record Payment sidebar ──────────────── */}
        {view === "table" && (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* Table */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                    <thead>
                      <tr>
                        <th style={TH}>Vendor Name</th>
                        <th style={TH}>PO Number</th>
                        <th style={{ ...TH, textAlign: "right" as const }}>Invoice Amt</th>
                        <th style={{ ...TH, textAlign: "right" as const }}>Paid Amt</th>
                        <th style={{ ...TH, textAlign: "right" as const }}>Balance Due</th>
                        <th style={TH}>Due Date</th>
                        <th style={{ ...TH, textAlign: "center" as const }}>Status</th>
                        <th style={TH}>UTR</th>
                        <th style={{ ...TH, textAlign: "center" as const }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((vp, i) => {
                        const balance = vp.invoiceAmt - vp.paidAmt;
                        return (
                          <tr key={vp.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${VENDOR_STATUS_CFG[vp.status].color}` }}>
                            <td style={TD}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <FileText size={15} color={T.royalBurgundy} />
                                </div>
                                <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{vp.vendor}</span>
                              </div>
                            </td>
                            <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{vp.poNumber}</span></td>
                            <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14 }}>₹{vp.invoiceAmt.toLocaleString("en-IN")}</td>
                            <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, color: T.green, fontWeight: 600 }}>₹{vp.paidAmt.toLocaleString("en-IN")}</td>
                            <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: balance === 0 ? T.green : vp.status === "Overdue" ? T.crimson : T.antiqueGold }}>
                              {balance === 0 ? "Paid ✓" : `₹${balance.toLocaleString("en-IN")}`}
                            </td>
                            <td style={{ ...TD, color: vp.status === "Overdue" ? T.crimson : T.taupe, fontWeight: vp.status === "Overdue" ? 600 : 400 }}>
                              {vp.dueDate}
                              {vp.daysOverdue && <span style={{ fontFamily: F.mono, fontSize: 11, marginLeft: 6, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 6px", borderRadius: 4 }}>{vp.daysOverdue}d late</span>}
                            </td>
                            <td style={{ ...TD, textAlign: "center" as const }}><VendorBadge status={vp.status} /></td>
                            <td style={TD}>
                              {vp.utr
                                ? <span style={{ fontFamily: F.mono, fontSize: 11, color: T.green }}>{vp.utr}</span>
                                : <span style={{ color: T.taupe }}>—</span>}
                            </td>
                            <td style={{ ...TD, textAlign: "center" as const }}>
                              {vp.status === "Paid" ? (
                                <button style={{ padding: "5px 12px", background: "rgba(30,102,64,0.09)", color: T.green, border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 7, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "default", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <CheckCircle2 size={11} />Paid
                                </button>
                              ) : (
                                <button onClick={() => setSelVendor(vp.id)}
                                  style={{ padding: "5px 12px", background: selVendor === vp.id ? T.royalBurgundy : "transparent", color: selVendor === vp.id ? "#FFFDF9" : T.royalBurgundy, border: `1px solid ${T.royalBurgundy}`, borderRadius: 7, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                  Pay Now
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {filtered.length} of {vendorPayments.length} vendor bills</span>
                </div>
              </div>
            </div>

            {/* Record Vendor Payment sidebar */}
            <div style={{ flex: "0 0 272px", background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.07)" }}>
              <div style={{ background: T.darkBurgundy, padding: "16px 20px" }}>
                <div style={{ fontFamily: F.display, fontSize: 18, color: "#FFFDF9" }}>Record Vendor Payment</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.55)", marginTop: 3 }}>Mark payment made to a vendor</div>
              </div>
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Select Vendor</label>
                  <select value={selVendor} onChange={e => { setSelVendor(e.target.value); setPayAmount(""); }} style={{ ...fieldStyle }}>
                    {vendorPayments.filter(v => v.status !== "Paid").map(v => (
                      <option key={v.id} value={v.id}>{v.vendor}</option>
                    ))}
                  </select>
                </div>
                {/* Auto-filled info */}
                <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
                  {[
                    { label: "PO Number",     val: selVP.poNumber,                         color: T.royalBurgundy },
                    { label: "Invoice Total",  val: `₹${selVP.invoiceAmt.toLocaleString("en-IN")}`, color: T.luxuryBrown },
                    { label: "Previous Paid",  val: `₹${selVP.paidAmt.toLocaleString("en-IN")}`,   color: T.green },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{row.label}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 12.5, color: row.color, fontWeight: 700 }}>{row.val}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: T.borderDef, margin: "2px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>Balance Due</span>
                    <span style={{ fontFamily: F.mono, fontSize: 15, color: T.crimson, fontWeight: 700 }}>₹{selBalance.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Payment Amount</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: F.mono, fontSize: 14, color: T.taupe }}>₹</span>
                    <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Enter amount paid"
                      style={{ ...fieldStyle, paddingLeft: 26 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Payment Date</label>
                  <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} style={{ ...fieldStyle }} />
                </div>
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ ...fieldStyle }}>
                    {["Bank Transfer","Cash","Cheque","NEFT/RTGS","UPI"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>UTR Number</label>
                  <input value={utrNumber} onChange={e => setUtrNumber(e.target.value)} placeholder="Bank transaction reference..."
                    style={{ ...fieldStyle }} />
                </div>
                {payAmount && (
                  <div style={{ background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, padding: "12px 14px" }}>
                    <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 6 }}>Balance After This Payment</div>
                    <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: afterPay <= 0 ? T.green : T.royalBurgundy }}>
                      {afterPay <= 0 ? "Fully Paid ✓" : `₹${afterPay.toLocaleString("en-IN")}`}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, padding: "9px 0", background: "transparent", border: `1px solid ${T.borderDef}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} initial={{ backgroundColor: T.royalBurgundy }} animate={{ backgroundColor: T.royalBurgundy }}
                    style={{ flex: 2, padding: "9px 0", background: T.royalBurgundy, border: "none", borderRadius: 9, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>
                    Save Payment
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ActionModal open={downloadModal} onClose={() => setDownloadModal(false)} title="Download Vendor Report" desc="Generate and download the vendor payments report." actionLabel="Download" icon={Download} />
        <ActionModal open={contactModal} onClose={() => setContactModal(false)} title="Contact Overdue Vendors" desc={`Send an automated email to ${overdueVendors.length} vendors regarding overdue payments.`} actionLabel="Contact Now" icon={Mail} />
        <AnimatePresence>
          {viewDetails && <VendorDetailModal vp={viewDetails} matchedPO={matchPO(viewDetails.poNumber)} onClose={() => setViewDetails(null)} />}
          {payNow && <VendorPayNowModal vp={payNow} onClose={() => setPayNow(null)} onSave={handleSavePayment} />}
        </AnimatePresence>
        <PODocumentModal open={!!viewPO} onClose={() => setViewPO(null)} po={viewPO} />
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION E — PAYMENT ANALYTICS & INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════
const CASH_FLOW_DATA = [
  { month: "Jan", income: 18.2, expenses: 9.8  },
  { month: "Feb", income: 21.4, expenses: 11.4 },
  { month: "Mar", income: 24.8, expenses: 12.6 },
  { month: "Apr", income: 29.6, expenses: 13.2 },
  { month: "May", income: 32.6, expenses: 12.8 },
];

const COMPLIANCE_DATA = [
  { name: "Paid",    value: 2, color: "#1E6640" },
  { name: "Partial", value: 1, color: "#C89B47" },
  { name: "Overdue", value: 3, color: "#C0392B" },
];

const WEAVER_DIST_DATA = [
  { name: "Anand K.",   amount: 36000, pct: 100, color: "#4A061B" },
  { name: "Kamala B.",  amount: 30000, pct: 83,  color: "#6E0F2D" },
  { name: "Ravi Kumar", amount: 28000, pct: 78,  color: "#8B3050" },
  { name: "Padma Veni", amount: 26000, pct: 72,  color: "#C4923A" },
  { name: "Lakshmi D.", amount: 20000, pct: 56,  color: "#8B7060" },
];

const TOTAL_TOP5 = WEAVER_DIST_DATA.reduce((s, d) => s + d.amount, 0);

function CashFlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "10px 14px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginBottom: 5, textTransform: "uppercase" }}>{label} 2026</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.fill || p.stroke }} />
          <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{p.name}:</span>
          <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>₹{p.value}L</span>
        </div>
      ))}
    </div>
  );
}

function PaymentAnalyticsSection() {
  const [exportModal, setExportModal] = useState(false);
  const METRICS = [
    {
      icon: <TrendingUp size={22} color={T.green} />,
      iconBg: T.greenBg,
      iconBorder: "rgba(30,102,64,0.18)",
      label: "Net Income This Month",
      value: "₹19,80,000",
      sub: "After all deductions · May 2026",
      color: T.green,
      hi: false,
    },
    {
      icon: <CircleAlert size={22} color={T.crimson} />,
      iconBg: T.crimsonBg,
      iconBorder: "rgba(192,57,43,0.18)",
      label: "Outstanding from Customers",
      value: "₹18,41,000",
      sub: "Pending invoice collections",
      color: T.crimson,
      hi: false,
    },
    {
      icon: <Scissors size={22} color={T.royalBurgundy} />,
      iconBg: "rgba(110,15,45,0.08)",
      iconBorder: T.borderDef,
      label: "Paid to Top 5 Weavers",
      value: `₹${TOTAL_TOP5.toLocaleString("en-IN")}`,
      sub: "Making charges · May 2026",
      color: T.royalBurgundy,
      hi: false,
    },
    {
      icon: <IndianRupee size={22} color={T.antiqueGold} />,
      iconBg: "rgba(200,155,71,0.12)",
      iconBorder: T.borderGold,
      label: "Total Vendor Payments",
      value: "₹8,60,000",
      sub: "Raw materials & supplies",
      color: T.antiqueGold,
      hi: true,
    },
  ];

  return (
    <div id="pay-analytics" style={{ padding: "36px 40px 40px" }}>
      <FadeUp>
        {/* ── Section header ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99, flexShrink: 0 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>
                Payment Analytics &amp; Insights
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px" }}>
              Visual breakdown of cash flow, customer compliance, and top weaver earnings.
            </p>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: "linear-gradient(135deg,rgba(200,155,71,0.18),rgba(200,155,71,0.06))", border: `1px solid ${T.borderGold}`, borderRadius: 9, cursor: "pointer" }}>
            <Download size={15} color={T.antiqueGold} />
            <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.antiqueGold }}>Export Report</span>
          </button>
        </div>

        {/* ── 4 summary stat cards ───────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 18, marginBottom: 24, alignItems: "stretch" }}>
          {METRICS.map((m, i) => (
            <div key={m.label} style={{
              display: "flex", flexDirection: "column", gap: 10,
              background: m.hi ? `linear-gradient(145deg,${T.warmCream},#FDF6E4)` : T.warmIvory,
              borderRadius: 16,
              border: m.hi ? `1px solid ${T.borderGold}` : `1px solid ${T.borderDef}`,
              borderTop: m.hi ? `3px solid ${T.antiqueGold}` : `1px solid ${T.borderDef}`,
              boxShadow: m.hi ? "0 4px 20px rgba(200,155,71,0.12)" : "0 2px 12px rgba(74,6,27,0.06)",
              padding: "20px 20px 20px",
            }}>
              {/* Icon box */}
              <div style={{ width: 44, height: 44, borderRadius: 12, background: m.iconBg, border: `1px solid ${m.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {m.icon}
              </div>
              {/* Label */}
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, lineHeight: 1.4 }}>{m.label}</div>
              {/* Value */}
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: m.color, lineHeight: 1.1 }}>
                <AnimCount raw={m.value} />
              </div>
              {/* Sub */}
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: "auto" }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* ── 3-column chart grid ─────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, alignItems: "stretch" }}>

          {/* Chart 1 — Cash Flow Overview */}
          <div style={{ display: "flex", flexDirection: "column", background: T.warmIvory, borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: T.greenBg, border: "1px solid rgba(30,102,64,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <TrendingUp size={22} color={T.green} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>Cash Flow Overview</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Income vs. expenses · ₹ Lakhs</div>
                </div>
              </div>
            </div>
            {/* Chart body */}
            <div style={{ flex: 1, padding: "18px 10px 14px" }}>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={CASH_FLOW_DATA} barGap={4} barCategoryGap="28%">
                  <CartesianGrid key="cf-grid"     strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
                  <XAxis         key="cf-xaxis"    dataKey="month" tick={{ fontFamily: F.mono, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
                  <YAxis         key="cf-yaxis"    tick={{ fontFamily: F.mono, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${v}L`} width={46} />
                  <Tooltip       key="cf-tooltip"  content={<CashFlowTooltip />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
                  <Bar           key="cf-income"   dataKey="income"   name="Income"   fill={T.green}  radius={[5,5,0,0] as any} />
                  <Bar           key="cf-expenses" dataKey="expenses" name="Expenses" fill={T.crimson} radius={[5,5,0,0] as any} opacity={0.80} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8 }}>
                {[{ color: T.green, label: "Income" }, { color: T.crimson, label: "Expenses" }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 11, height: 11, borderRadius: 4, background: l.color }} />
                    <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2 — Customer Payment Compliance */}
          <div style={{ display: "flex", flexDirection: "column", background: T.warmIvory, borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(200,155,71,0.12)", border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={22} color={T.antiqueGold} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>Payment Compliance</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Invoice status breakdown · May 2026</div>
                </div>
              </div>
            </div>
            {/* Chart body */}
            <div style={{ flex: 1, padding: "18px 10px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie key="compliance-pie" data={COMPLIANCE_DATA} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                    dataKey="value" stroke="none" paddingAngle={4}>
                    {COMPLIANCE_DATA.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip key="compliance-tooltip" formatter={(val: any, name: any) => [`${val} invoice${val > 1 ? "s" : ""}`, name]}
                    contentStyle={{ fontFamily: F.ui, fontSize: 13, borderRadius: 9, border: `1px solid ${T.borderDef}` }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", padding: "0 18px", marginTop: 4 }}>
                {COMPLIANCE_DATA.map(d => {
                  const pct = Math.round((d.value / INVOICES.length) * 100);
                  return (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 11, height: 11, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, flex: 1 }}>{d.name}</span>
                      <div style={{ flex: 2, height: 6, background: "rgba(110,15,45,0.07)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: d.color, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 700, width: 34, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart 3 — Top Weaver Making Distribution */}
          <div style={{ display: "flex", flexDirection: "column", background: T.warmIvory, borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(110,15,45,0.08)", border: T.borderDef, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Users size={22} color={T.royalBurgundy} />
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>Top Weaver Earnings</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Highest-paid weavers · May 2026</div>
                </div>
              </div>
            </div>
            {/* Weaver list */}
            <div style={{ flex: 1, padding: "20px 22px" }}>
              {WEAVER_DIST_DATA.map((d, i) => (
                <div key={d.name} style={{ marginBottom: i < WEAVER_DIST_DATA.length - 1 ? 18 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: d.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.18)" }}>
                        <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#FFFDF9" }}>{d.name.split(" ").map((w: string) => w[0]).join("").slice(0,2)}</span>
                      </div>
                      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 600 }}>{d.name}</span>
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>₹{d.amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ height: 7, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${d.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: i * 0.1, ease: EASE }}
                      style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${d.color},${d.color}88)` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION F — PAYMENT HISTORY
// ══════════════════════════════════════════════════════════════════════════════
type PayHistType   = "Vendor Payment" | "Weaver Payment" | "Customer Receipt";
type PayHistStatus = "Paid" | "Partial" | "Pending";

interface PayHistRecord {
  id: string; date: string; type: PayHistType;
  party: string; refNo: string; description: string;
  invoicePO?: string; amount: number; status: PayHistStatus;
  mode: string; utr?: string; recordedBy: string;
}

const HIST_TYPE_CFG: Record<PayHistType, { bg: string; color: string; border: string }> = {
  "Vendor Payment":   { bg: "rgba(200,155,71,0.12)",  color: "#8B6018",       border: "#C89B47" },
  "Weaver Payment":   { bg: "rgba(110,15,45,0.10)",   color: "#6E0F2D",       border: "#6E0F2D" },
  "Customer Receipt": { bg: "rgba(30,102,64,0.10)",   color: "#1E6640",       border: "#1E6640" },
};
const HIST_STATUS_CFG: Record<PayHistStatus, { bg: string; color: string }> = {
  Paid:    { bg: "rgba(30,102,64,0.10)",   color: "#1E6640" },
  Partial: { bg: "rgba(200,155,71,0.13)",  color: "#8B6018" },
  Pending: { bg: "rgba(74,107,138,0.10)",  color: "#2E5A8A" },
};

const PAY_HISTORY: PayHistRecord[] = [
  { id:"PH-010", date:"30 May 2026", type:"Vendor Payment",   party:"Vijaylakshmi Silks",  refNo:"VP-2026-004", description:"Partial payment — silk fabric batch",  invoicePO:"PO-2026-034", amount:200000, status:"Paid",    mode:"Bank Transfer", utr:"UTR20260530BVS",  recordedBy:"Admin" },
  { id:"PH-009", date:"28 May 2026", type:"Weaver Payment",   party:"Suresh Murti",        refNo:"WV-007",      description:"Making charges — May 2026",            amount:1120,   status:"Paid",    mode:"Bank Transfer", utr:"UTR20260528SM1",  recordedBy:"Admin" },
  { id:"PH-008", date:"28 May 2026", type:"Weaver Payment",   party:"Venkat Rao",          refNo:"WV-024",      description:"Making charges — May 2026",            amount:1040,   status:"Paid",    mode:"Bank Transfer", utr:"UTR20260528VR2",  recordedBy:"Admin" },
  { id:"PH-007", date:"25 May 2026", type:"Customer Receipt", party:"Meenakshi Silks",     refNo:"INV-2026-029",description:"Partial collection — May order",        amount:420000, status:"Partial", mode:"Bank Transfer",                         recordedBy:"Admin" },
  { id:"PH-006", date:"22 May 2026", type:"Customer Receipt", party:"Kalavathi Exports",   refNo:"INV-2026-027",description:"Final balance received",                amount:614400, status:"Paid",    mode:"Bank Transfer", utr:"UTR20260522KE",   recordedBy:"Admin" },
  { id:"PH-005", date:"18 May 2026", type:"Weaver Payment",   party:"Kamala B.",           refNo:"WV-031",      description:"Making charges — May 2026",            amount:4080,   status:"Paid",    mode:"Bank Transfer", utr:"UTR20260518KB3",  recordedBy:"Admin" },
  { id:"PH-004", date:"15 May 2026", type:"Vendor Payment",   party:"Nanak Silk Traders",  refNo:"VP-2026-003", description:"Full payment — silk fabric stock",      invoicePO:"PO-2026-037", amount:240000, status:"Paid", mode:"Bank Transfer", utr:"UTR20260515NST", recordedBy:"Admin" },
  { id:"PH-003", date:"15 May 2026", type:"Customer Receipt", party:"Vijaya Silk House",   refNo:"INV-2026-035",description:"Invoice cleared in full",               amount:280000, status:"Paid",    mode:"Bank Transfer", utr:"UTR20260515VSH",  recordedBy:"Admin" },
  { id:"PH-002", date:"12 May 2026", type:"Vendor Payment",   party:"Banarasi Thread House",refNo:"VP-2026-002",description:"Thread batch payment — May",           invoicePO:"PO-2026-040", amount:180000, status:"Paid", mode:"Bank Transfer", utr:"UTR20260512BTH", recordedBy:"Admin" },
  { id:"PH-001", date:"10 May 2026", type:"Customer Receipt", party:"Lakshmi Silks",       refNo:"INV-2026-041",description:"Full invoice cleared",                  amount:900000, status:"Paid",    mode:"Bank Transfer", utr:"UTR20260510LS",   recordedBy:"Admin" },
];

function getHistTypeIcon(type: PayHistType) {
  if (type === "Customer Receipt") return { Icon: ArrowDownCircle, color: T.green,         iconBg: T.greenBg,                  iconBorder: "rgba(30,102,64,0.22)"  };
  if (type === "Weaver Payment")   return { Icon: Scissors,        color: T.royalBurgundy, iconBg: "rgba(110,15,45,0.08)",     iconBorder: T.borderDef             };
  return                                  { Icon: Package,         color: "#8B6018",       iconBg: "rgba(200,155,71,0.12)",    iconBorder: T.borderGold            };
}

function HistoryCard({ r }: { r: PayHistRecord }) {
  const typeCfg = HIST_TYPE_CFG[r.type];
  const stsCfg  = HIST_STATUS_CFG[r.status];
  const { Icon, color: iconColor, iconBg, iconBorder } = getHistTypeIcon(r.type);
  const isReceipt = r.type === "Customer Receipt";
  const isPaid    = r.status === "Paid";

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", borderRadius: 16, background: T.warmIvory, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(74,6,27,0.07)", overflow: "hidden" }}>

      {/* Accent bar */}
      <div style={{ height: 4, background: typeCfg.border, flexShrink: 0 }} />

      {/* Header: icon + party + type badge + status */}
      <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "flex-start", gap: 13, borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: iconBg, border: `1px solid ${iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={22} color={iconColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.party}</div>
          <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: typeCfg.bg, color: typeCfg.color }}>{r.type}</span>
        </div>
        <span style={{ display: "inline-block", padding: "4px 11px", borderRadius: 20, fontFamily: F.mono, fontSize: 12, fontWeight: 700, background: stsCfg.bg, color: stsCfg.color, flexShrink: 0 }}>
          {r.status === "Paid" ? "✓ Paid" : r.status === "Partial" ? "◑ Partial" : "⏱ Pending"}
        </span>
      </div>

      {/* Amount */}
      <div style={{ padding: "14px 18px 14px", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase" as const, marginBottom: 5 }}>
          {isReceipt ? "Amount Received" : "Amount Paid"}
        </div>
        <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: isReceipt ? T.green : T.crimson }}>
          {isReceipt ? "+" : "−"}₹{r.amount.toLocaleString("en-IN")}
        </div>
      </div>

      {/* Meta grid: date | ref no */}
      <div style={{ padding: "13px 18px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 5 }}>Date</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 22 }}>
            <CalendarClock size={13} color={T.antiqueGold} />
            <span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{r.date}</span>
          </div>
        </div>
        <div style={{ borderLeft: `1px solid ${T.borderDef}`, paddingLeft: 14 }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 5 }}>Ref No</div>
          <span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, fontWeight: 600 }}>{r.refNo}</span>
        </div>
      </div>

      {/* Meta grid: mode | invoice/PO */}
      <div style={{ padding: "12px 18px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 5 }}>Payment Mode</div>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{r.mode}</span>
        </div>
        <div style={{ borderLeft: `1px solid ${T.borderDef}`, paddingLeft: 14 }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 5 }}>Invoice / PO</div>
          <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>{r.invoicePO ?? "—"}</span>
        </div>
      </div>

      {/* Description — flex: 1 fills remaining space */}
      <div style={{ flex: 1, padding: "12px 18px 0" }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 5 }}>Description</div>
        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.55 }}>{r.description}</span>
      </div>

      {/* UTR row — always renders */}
      <div style={{ padding: "12px 18px 0", flexShrink: 0 }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 5 }}>UTR / Transaction ID</div>
        <span style={{ fontFamily: F.mono, fontSize: 12, color: r.utr ? T.green : T.borderDef }}>{r.utr ?? "—"}</span>
      </div>

      {/* Buttons — always 2 for equal height */}
      <div style={{ padding: "14px 18px 16px", display: "flex", gap: 8, flexShrink: 0 }}>
        <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", border: `1px solid ${T.borderDef}`, borderRadius: 9, background: "#FFFFFF", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer" }}>
          <Eye size={14} />View Details
        </button>
        {isPaid
          ? <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", border: "1px solid rgba(30,102,64,0.25)", borderRadius: 9, background: T.greenBg, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.green, cursor: "default" }}>
              <BadgeCheck size={14} />Completed
            </button>
          : <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", border: "none", borderRadius: 9, background: T.royalBurgundy, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFFDF9", cursor: "pointer" }}>
              <UploadCloud size={14} />Update Status
            </button>
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENT HISTORY
// ══════════════════════════════════════════════════════════════════════════════

function PaymentHistorySection() {
  const [dateFrom,     setDateFrom]     = useState("2026-05-10");
  const [dateTo,       setDateTo]       = useState("2026-05-31");
  const [typeFilter,   setTypeFilter]   = useState("All Payment Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [search,       setSearch]       = useState("");
  const [view,         setView]         = useState<"card" | "table">("card");
  const [page,         setPage]         = useState(1);
  const PER_PAGE = 10;

  const filtered = PAY_HISTORY.filter(r => {
    if (typeFilter   !== "All Payment Types" && r.type   !== typeFilter)   return false;
    if (statusFilter !== "All Statuses"      && r.status !== statusFilter) return false;
    if (search && !r.party.toLowerCase().includes(search.toLowerCase()) &&
        !r.refNo.toLowerCase().includes(search.toLowerCase()) &&
        !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalIn  = filtered.filter(r => r.type === "Customer Receipt").reduce((s, r) => s + r.amount, 0);
  const totalOut = filtered.filter(r => r.type !== "Customer Receipt").reduce((s, r) => s + r.amount, 0);
  const totalAmt = filtered.reduce((s, r) => s + r.amount, 0);
  const netFlow  = totalIn - totalOut;

  const clearFilters = () => { setTypeFilter("All Payment Types"); setStatusFilter("All Statuses"); setSearch(""); };

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", padding: "13px 14px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "13px 14px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };

  const viewOptions = [
    { key: "card"  as const, Icon: LayoutGrid,   label: "Card View"  },
    { key: "table" as const, Icon: AlignJustify, label: "Table View" },
  ];

  const HIST_STATS = [
    { icon: <ArrowDownCircle size={22} color={T.green}         />, iconBg: T.greenBg,                 iconBorder: "rgba(30,102,64,0.18)",  label: "Total Collected",       value: `₹${totalIn.toLocaleString("en-IN")}`,       sub: "Customer receipts · period", color: T.green,         hi: false },
    { icon: <ArrowUpCircle   size={22} color={T.crimson}       />, iconBg: T.crimsonBg,               iconBorder: "rgba(192,57,43,0.18)",  label: "Total Paid Out",        value: `₹${totalOut.toLocaleString("en-IN")}`,      sub: "Vendor & weaver payments",   color: T.crimson,       hi: false },
    { icon: <TrendingUp      size={22} color={T.antiqueGold}   />, iconBg: "rgba(200,155,71,0.12)",   iconBorder: T.borderGold,            label: "Net Cash Flow",         value: `₹${Math.abs(netFlow).toLocaleString("en-IN")}`, sub: netFlow >= 0 ? "Positive flow" : "Net outflow", color: netFlow >= 0 ? T.green : T.crimson, hi: true },
    { icon: <Receipt         size={22} color={T.royalBurgundy} />, iconBg: "rgba(110,15,45,0.08)",    iconBorder: T.borderDef,             label: "Total Transactions",    value: `${filtered.length}`,                        sub: "Records in selected period", color: T.royalBurgundy, hi: false },
  ];

  return (
    <div id="pay-history" style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        {/* ── Section header ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99, flexShrink: 0 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>
                Payment History
              </h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px" }}>
              Complete history of all payments made and received. Use filters to find specific transactions.
            </p>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 9, fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer", flexShrink: 0 }}>
            <Download size={15} color={T.antiqueGold} />Download All Transactions
          </button>
        </div>

        {/* ── 4 Summary stat cards ───────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 18, marginBottom: 22, alignItems: "stretch" }}>
          {HIST_STATS.map(s => (
            <div key={s.label} style={{
              display: "flex", flexDirection: "column", gap: 10,
              background: s.hi ? `linear-gradient(145deg,${T.warmCream},#FDF6E4)` : T.warmIvory,
              borderRadius: 16,
              border: s.hi ? `1px solid ${T.borderGold}` : `1px solid ${T.borderDef}`,
              borderTop: s.hi ? `3px solid ${T.antiqueGold}` : `1px solid ${T.borderDef}`,
              boxShadow: s.hi ? "0 4px 20px rgba(200,155,71,0.12)" : "0 2px 12px rgba(74,6,27,0.06)",
              padding: "20px",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iconBg, border: `1px solid ${s.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, lineHeight: 1.4 }}>{s.label}</div>
              <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: "auto" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Filter bar ──────────────────────────────────────── */}
        <div style={{ background: T.warmIvory, borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 20, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>

            {/* View toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 3, background: T.warmCream, borderRadius: 9, padding: 3, border: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
              {viewOptions.map(({ key, Icon: Ico, label }) => (
                <button key={key} onClick={() => setView(key)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 7, border: "none", background: view === key ? T.royalBurgundy : "transparent", color: view === key ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
                  <Ico size={14} />{label}
                </button>
              ))}
            </div>

            {/* Date range */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, whiteSpace: "nowrap" as const }}>From</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ height: 38, padding: "0 10px", border: `1px solid ${T.borderDef}`, borderRadius: 8, fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, background: "#FFFFFF", outline: "none" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, whiteSpace: "nowrap" as const }}>To</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ height: 38, padding: "0 10px", border: `1px solid ${T.borderDef}`, borderRadius: 8, fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, background: "#FFFFFF", outline: "none" }} />
            </div>

            {/* Type dropdown */}
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ height: 38, padding: "0 12px", border: `1px solid ${T.borderDef}`, borderRadius: 8, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", cursor: "pointer" }}>
              {["All Payment Types","Vendor Payment","Weaver Payment","Customer Receipt"].map(o => <option key={o}>{o}</option>)}
            </select>

            {/* Status dropdown */}
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ height: 38, padding: "0 12px", border: `1px solid ${T.borderDef}`, borderRadius: 8, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", cursor: "pointer" }}>
              {["All Statuses","Paid","Partial","Pending"].map(o => <option key={o}>{o}</option>)}
            </select>

            {/* Search */}
            <div style={{ flex: 1, minWidth: 200, position: "relative" as const }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search party, ref no, description..."
                style={{ width: "100%", height: 38, padding: "0 12px 0 36px", border: `1px solid ${T.borderDef}`, borderRadius: 8, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" as const }} />
            </div>

            {/* Clear */}
            <button onClick={clearFilters}
              style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 15px", border: `1px solid ${T.borderDef}`, borderRadius: 8, background: T.silkCream, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer", whiteSpace: "nowrap" as const }}>
              <X size={13} />Clear
            </button>
          </div>
        </div>

        {/* ── CARD VIEW ───────────────────────────────────────── */}
        {view === "card" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, alignItems: "stretch" }}>
            {filtered.map((r, i) => (
              <motion.div key={r.id} style={{ display: "flex", flexDirection: "column" }}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}>
                <HistoryCard r={r} />
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center" as const }}>
                <Receipt size={40} color={T.borderDef} style={{ marginBottom: 12 }} />
                <div style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe }}>No transactions match your filters.</div>
              </div>
            )}
          </div>
        )}

        {/* ── TABLE VIEW ──────────────────────────────────────── */}
        {view === "table" && (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
                <thead>
                  <tr>
                    <th style={TH}>Date</th>
                    <th style={TH}>Payment Type</th>
                    <th style={TH}>Party Name</th>
                    <th style={TH}>Reference No</th>
                    <th style={{ ...TH, maxWidth: 200 }}>Description</th>
                    <th style={TH}>Invoice / PO No</th>
                    <th style={{ ...TH, textAlign: "right" as const }}>Amount (₹)</th>
                    <th style={{ ...TH, textAlign: "center" as const }}>Status</th>
                    <th style={TH}>Payment Mode</th>
                    <th style={TH}>UTR / Ref No</th>
                    <th style={TH}>Recorded By</th>
                    <th style={{ ...TH, textAlign: "center" as const }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const typeCfg = HIST_TYPE_CFG[r.type];
                    const stsCfg  = HIST_STATUS_CFG[r.status];
                    return (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${typeCfg.border}` }}>
                        <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{r.date}</span></td>
                        <td style={TD}>
                          <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: typeCfg.bg, color: typeCfg.color, whiteSpace: "nowrap" as const }}>{r.type}</span>
                        </td>
                        <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{r.party}</span></td>
                        <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.refNo}</span></td>
                        <td style={{ ...TD, maxWidth: 200 }}>
                          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: 200 }}>{r.description}</span>
                        </td>
                        <td style={TD}>
                          {r.invoicePO
                            ? <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.invoicePO}</span>
                            : <span style={{ color: T.borderDef }}>—</span>
                          }
                        </td>
                        <td style={{ ...TD, textAlign: "right" as const }}>
                          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: r.type === "Customer Receipt" ? T.green : T.crimson }}>
                            {r.type !== "Customer Receipt" && "−"}₹{r.amount.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td style={{ ...TD, textAlign: "center" as const }}>
                          <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontFamily: F.mono, fontSize: 12, fontWeight: 700, background: stsCfg.bg, color: stsCfg.color }}>
                            {r.status === "Paid" ? "✓ Paid" : r.status === "Partial" ? "◑ Partial" : "⏱ Pending"}
                          </span>
                        </td>
                        <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.mode}</span></td>
                        <td style={TD}>
                          {r.utr
                            ? <span style={{ fontFamily: F.mono, fontSize: 12, color: T.green }}>{r.utr}</span>
                            : <span style={{ fontFamily: F.ui, fontSize: 13, color: T.borderDef }}>—</span>
                          }
                        </td>
                        <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{r.recordedBy}</span></td>
                        <td style={{ ...TD, textAlign: "center" as const }}>
                          <button style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
                            <Eye size={12} />View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: T.darkBurgundy }}>
                    <td colSpan={5} style={{ ...TD, background: T.darkBurgundy, fontSize: 13, fontWeight: 700, color: "#FFFDF9", padding: "14px 14px", borderBottom: "none" }}>
                      TOTALS FOR SELECTED PERIOD
                    </td>
                    <td style={{ ...TD, background: T.darkBurgundy, borderBottom: "none" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.50)" }}>{filtered.length} rows</span>
                    </td>
                    <td style={{ ...TD, textAlign: "right" as const, background: T.darkBurgundy, borderBottom: "none" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.goldLight }}>+₹{totalIn.toLocaleString("en-IN")}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: "#F47B72"  }}>−₹{totalOut.toLocaleString("en-IN")}</span>
                        <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.antiqueGold }}>₹{totalAmt.toLocaleString("en-IN")}</span>
                      </div>
                    </td>
                    <td colSpan={5} style={{ ...TD, background: T.darkBurgundy, borderBottom: "none" }} />
                  </tr>
                </tfoot>
              </table>
            </div>
            {/* Pagination */}
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.warmIvory }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                Showing {Math.min(PER_PAGE, filtered.length)} of {filtered.length} results
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 13px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                  <ChevronLeft size={14} />Prev
                </button>
                {[1,2,3].map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 34, height: 34, borderRadius: 7, border: `1px solid ${page===p ? T.royalBurgundy : T.borderDef}`, background: page===p ? T.royalBurgundy : "#fff", color: page===p ? "#FFFDF9" : T.luxuryBrown, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{p}</button>
                ))}
                <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 13px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                  Next<ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENTS FOOTER
// ══════════════════════════════════════════════════════════════════════════════
const FOOTER_QUICK_LINKS = [
  { icon: <LayoutDashboard size={13} />, label: "Dashboard"  },
  { icon: <ShoppingCart size={13} />,   label: "Orders"      },
  { icon: <Scissors size={13} />,       label: "Weavers"     },
  { icon: <Factory size={13} />,        label: "Production"  },
  { icon: <Package size={13} />,        label: "Materials"   },
  { icon: <CreditCard size={13} />,     label: "Payments"    },
  { icon: <BarChartIcon size={13} />,    label: "Reports"     },
  { icon: <UserRound size={13} />,      label: "Customers"   },
];
const FOOTER_PAYMENT_LINKS = [
  "Record Customer Payment",
  "Weaver Making Charges",
  "Vendor Payments",
  "Customer Collections",
  "Payment History",
];
const FOOTER_HELP_LINKS = [
  "Help Center",
  "Video Tutorials",
  "Support Chat",
  "Contact Support",
  "Report an Issue",
];
const FOOTER_COMMITMENTS = [
  "Timely Settlements",
  "100% Transparency",
  "Heritage Since 1999",
  "Traditional Excellence",
];

function PaymentsFooter() {
  return (
    <footer style={{ background: T.darkBurgundy, borderTop: `1px solid rgba(200,155,71,0.18)` }}>
      {/* Main footer grid */}
      <div style={{ padding: "44px 40px 36px", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", gap: 40 }}>

        {/* ── Brand column ──────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", border: `2px solid rgba(200,155,71,0.35)`, flexShrink: 0 }}>
              <img src={imgBKLogo} alt="BK Silks" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: "#FFFDF9", lineHeight: 1.2 }}>Beers Keshara</div>
              <div style={{ fontFamily: F.display, fontSize: 14, fontStyle: "italic", color: T.antiqueGold, lineHeight: 1.2 }}>&amp; Brothers Silks</div>
            </div>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 8.5, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 12 }}>SINCE 1999</div>
          <p style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,253,249,0.52)", lineHeight: 1.7, marginBottom: 20, maxWidth: 280 }}>
            Preserving the art of pure silk weaving. Banarasi heritage crafted with trust, transparency, and timeless quality.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {[Globe, Mail, Phone].map((Icon, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(200,155,71,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon size={14} color="rgba(255,253,249,0.50)" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Links ───────────────────────────────────── */}
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>QUICK LINKS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FOOTER_QUICK_LINKS.map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <span style={{ color: "rgba(200,155,71,0.55)" }}>{l.icon}</span>
                <span style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,253,249,0.60)", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#FFFDF9")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,253,249,0.60)")}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Payment Shortcuts ─────────────────────────────── */}
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>PAYMENT SHORTCUTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FOOTER_PAYMENT_LINKS.map(l => (
              <span key={l} style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,253,249,0.60)", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#FFFDF9")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,253,249,0.60)")}>{l}</span>
            ))}
          </div>
        </div>

        {/* ── Need Help ─────────────────────────────────────── */}
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>NEED HELP</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FOOTER_HELP_LINKS.map(l => (
              <span key={l} style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,253,249,0.60)", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#FFFDF9")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,253,249,0.60)")}>{l}</span>
            ))}
          </div>
        </div>

        {/* ── Our Commitment ────────────────────────────────── */}
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>OUR COMMITMENT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FOOTER_COMMITMENTS.map(c => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(200,155,71,0.18)", border: "1px solid rgba(200,155,71,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={10} color={T.antiqueGold} />
                </div>
                <span style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,253,249,0.65)" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(200,155,71,0.12)", padding: "14px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.35)" }}>
          © 2026 Beers Keshara &amp; Brothers Silks. All rights reserved.
        </span>
        <span style={{ fontFamily: F.display, fontSize: 13, fontStyle: "italic", color: "rgba(200,155,71,0.55)", textAlign: "center" }}>
          Tradition · Promise · Trust · Quality Creates Legacy
        </span>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.35)" }}>
          Made with <span style={{ color: T.antiqueGold }}>♥</span> in India
        </span>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export function PaymentsPage() {
  return (
    <div style={{ fontFamily: F.ui }}>
      <PaymentsHeader />
      <StatsStrip />
      <div style={{ background: T.silkCream, paddingBottom: 0 }}>
        <FinancialSummarySection />
        <WeaverMakingChargesSection />
        <WholesaleCollectionsSection />
        <VendorPaymentsSection />
        <PaymentAnalyticsSection />
        <PaymentHistorySection />
      </div>
      <PaymentsFooter />
    </div>
  );
}
