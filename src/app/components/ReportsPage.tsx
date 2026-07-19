import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "motion/react";
import {
  Download, Search, ChevronDown, Eye, CheckCircle2, Clock, AlertTriangle,
  FileText, BarChart2, Package, TrendingUp, TrendingDown, IndianRupee,
  Calendar, Users, Truck, MessageSquare, Bell, Plus, Pencil,
  Pause, Play, ChevronLeft, ChevronRight, X, Send, Filter,
  Globe, Mail, Phone, LayoutDashboard, ShoppingCart, Scissors,
  Factory, CreditCard, UserRound,
  Store, Boxes, BarChart3, UsersRound, BellRing, BadgeCheck, Tag, Banknote, RefreshCcw, ShieldAlert, TrendingUpDown, ReceiptText, CircleDollarSign, Percent,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const imgHeaderBg = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import { imgBKLogo, imgSaree } from "../constants/weaverImages";
import { useWeaverPayments } from "./WeaverPaymentsContext";
import { useBulkOrders } from "./BulkOrderContext";
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

function AnimBar({ pct, color, height = 6, delay = 0 }: { pct: number; color: string; height?: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} style={{ height, borderRadius: 99, background: "rgba(110,15,45,0.08)", overflow: "hidden" }}>
      <motion.div initial={{ width: "0%" }} animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 1.2, delay: 0.2 + delay, ease: EASE }}
        style={{ height: "100%", borderRadius: 99, background: color }} />
    </div>
  );
}

// ── Shared Table Styles ───────────────────────────────────────────────────────
const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", padding: "13px 14px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "13px 14px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };

// ── ChartCard ─────────────────────────────────────────────────────────────────
function ChartCard({ title, sub, icon, children }: { title: string; sub?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", background: T.warmIvory, borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden" }}>
      <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${T.borderDef}`, flexShrink: 0 }}>
        {icon ? (
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(110,15,45,0.07)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>{title}</div>
              {sub && <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 3 }}>{sub}</div>}
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>{title}</div>
            {sub && <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 3 }}>{sub}</div>}
          </>
        )}
      </div>
      <div style={{ flex: 1, padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

// ── SumCard ───────────────────────────────────────────────────────────────────
function SumCard({ icon, label, value, sub, hi = false, crimsonHi = false, greenHi = false }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  hi?: boolean; crimsonHi?: boolean; greenHi?: boolean;
}) {
  const valColor = hi ? T.antiqueGold : crimsonHi ? T.crimson : greenHi ? T.green : T.luxuryBrown;
  const iconBg   = hi ? "rgba(200,155,71,0.12)" : crimsonHi ? T.crimsonBg : greenHi ? T.greenBg : "rgba(110,15,45,0.07)";
  const iconBdr  = hi ? T.borderGold : crimsonHi ? "rgba(192,57,43,0.18)" : greenHi ? "rgba(30,102,64,0.18)" : T.borderDef;
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      background: hi ? `linear-gradient(145deg,${T.warmCream},#FDF6E4)` : T.warmIvory,
      borderRadius: 16,
      border: `1px solid ${hi ? T.borderGold : crimsonHi ? "rgba(192,57,43,0.18)" : greenHi ? "rgba(30,102,64,0.18)" : T.borderDef}`,
      borderTop: hi ? `3px solid ${T.antiqueGold}` : crimsonHi ? `3px solid ${T.crimson}` : greenHi ? `3px solid ${T.green}` : `1px solid ${T.borderDef}`,
      boxShadow: hi ? "0 4px 20px rgba(200,155,71,0.12)" : "0 2px 10px rgba(74,6,27,0.05)",
      padding: "22px 22px 20px",
      minHeight: 175,
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: iconBg, border: `1px solid ${iconBdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, lineHeight: 1.4 }}>{label}</div>
      <div style={{ fontFamily: F.display, fontSize: 34, fontWeight: 700, color: valColor, lineHeight: 1.1 }}>
        <AnimCount raw={value} />
      </div>
      {sub && <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginTop: "auto" }}>{sub}</div>}
    </div>
  );
}

// ── Report Download Bar ───────────────────────────────────────────────────────
function ReportDLBar({ period = "May 2026", compared = "April 2026" }: { period?: string; compared?: string }) {
  return (
    <div style={{ background: T.warmIvory, borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(74,6,27,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(200,155,71,0.12)", border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Calendar size={17} color={T.antiqueGold} />
        </div>
        <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
          Showing: <span style={{ fontFamily: F.display, fontWeight: 700, color: T.luxuryBrown }}>{period}</span>
          {compared && <> · Compared with: <span style={{ fontFamily: F.display, fontWeight: 700, color: T.antiqueGold }}>{compared}</span></>}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", border: `1.5px solid ${T.borderDef}`, borderRadius: 9, background: "#FFFFFF", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
          <FileText size={14} />Download PDF
        </button>
        <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", border: "none", borderRadius: 9, background: T.royalBurgundy, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "#FFFDF9", cursor: "pointer" }}>
          <Download size={14} />Download Excel
        </button>
      </div>
    </div>
  );
}

// ── Tab Section Title ─────────────────────────────────────────────────────────
function TabTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99, flexShrink: 0 }} />
        <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>{title}</h2>
      </div>
      <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px", maxWidth: 760, lineHeight: 1.65 }}>{sub}</p>
    </div>
  );
}

// ── Shared Chart Tooltip ──────────────────────────────────────────────────────
function ChartTip({ active, payload, label, prefix = "", suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "10px 14px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      {label && <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.fill || p.stroke }} />
          <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{p.name}:</span>
          <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{prefix}{typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

// ── Mini SVG Donut ────────────────────────────────────────────────────────────
function MiniDonut({ value, max, color, label, unit = "kg", badge, badgeType = "ok", footNote }: {
  value: number; max: number; color: string; label: string;
  unit?: string; badge?: string; badgeType?: "ok" | "low" | "out"; footNote?: string;
}) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = 30; const circ = 2 * Math.PI * r;
  const dash = pct * circ; const gap = circ - dash;
  const badgeBg = badgeType === "out" ? T.crimsonBg : badgeType === "low" ? "rgba(200,155,71,0.12)" : T.greenBg;
  const badgeColor = badgeType === "out" ? T.crimson : badgeType === "low" ? "#8B6018" : T.green;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(110,15,45,0.08)" strokeWidth="10" />
          {pct > 0 && (
            <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
              transform="rotate(-90 40 40)" />
          )}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{value}</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{unit}</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, marginBottom: 3 }}>{label}</div>
        {footNote && <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginBottom: 3 }}>{footNote}</div>}
        {badge && <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, background: badgeBg, color: badgeColor, fontFamily: F.mono, fontSize: 11, fontWeight: 700 }}>{badge}</span>}
      </div>
    </div>
  );
}

// ── Table pagination footer ───────────────────────────────────────────────────
function TablePager({ total, showing }: { total: number; showing: number }) {
  return (
    <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.warmIvory }}>
      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {showing} of {total} records</span>
      <div style={{ display: "flex", gap: 5 }}>
        {["Prev", "1", "2", "3", "Next"].map(p => (
          <button key={p} style={{ padding: "7px 13px", borderRadius: 7, border: `1px solid ${p === "1" ? T.royalBurgundy : T.borderDef}`, background: p === "1" ? T.royalBurgundy : "#fff", color: p === "1" ? "#FFFDF9" : T.luxuryBrown, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{p}</button>
        ))}
      </div>
    </div>
  );
}

// ── StatusPill ────────────────────────────────────────────────────────────────
function StatusPill({ label, type = "neutral" }: { label: string; type?: "ok" | "warn" | "bad" | "neutral" | "gold" }) {
  const map = {
    ok:      { bg: "rgba(30,102,64,0.10)",  color: T.green },
    warn:    { bg: "rgba(200,155,71,0.13)", color: "#8B6018" },
    bad:     { bg: "rgba(192,57,43,0.10)",  color: T.crimson },
    neutral: { bg: "rgba(110,15,45,0.06)",  color: T.taupe },
    gold:    { bg: "rgba(200,155,71,0.13)", color: T.antiqueGold },
  };
  const c = map[type];
  return (
    <span style={{ display: "inline-block", padding: "4px 11px", borderRadius: 20, fontFamily: F.mono, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: "nowrap" as const }}>{label}</span>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 3, height: 22, background: T.antiqueGold, borderRadius: 99 }} />
          <h2 style={{ fontFamily: F.display, fontSize: 21, color: T.luxuryBrown, margin: 0 }}>{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — PAGE HEADER (HERO)
// ══════════════════════════════════════════════════════════════════════════════
const REPORTS_CHIPS = [
  { value: "8",        label: "Report Categories"      },
  { value: "All Periods", label: "Date Range Support"  },
  { value: "PDF & Excel", label: "Export Formats"      },
  { value: "5 Active", label: "Scheduled Reports"      },
];

function ReportsHeader() {
  return (
    <header style={{ background: "linear-gradient(135deg, #2C0913 0%, #4A061B 50%, #3D0E1A 100%)", position: "relative", overflow: "hidden", minHeight: 480, display: "flex", alignItems: "center" }}>
      {/* Decorative gold rings */}
      <div style={{ position: "absolute", right: -80, top: -100, width: 560, height: 560, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.10)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", right: -20, top: -30, width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.07)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", right: 60, bottom: -80, width: 280, height: 280, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.05)", pointerEvents: "none", zIndex: 1 }} />

      {/* Right — photography */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "55%", zIndex: 1 }}>
        {/* Primary left-to-right fade — eased multi-stop */}
        <div style={{ position: "absolute", inset: 0, zIndex: 3, background: `linear-gradient(to right, #2C0913 0%, #2C0913 4%, rgba(44,9,19,0.97) 10%, rgba(44,9,19,0.88) 20%, rgba(44,9,19,0.70) 32%, rgba(44,9,19,0.45) 48%, rgba(44,9,19,0.20) 65%, rgba(44,9,19,0.06) 82%, transparent 100%)` }} />
        {/* Bottom vignette for depth */}
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to top, rgba(44,9,19,0.55) 0%, transparent 45%)` }} />
        {/* Top vignette */}
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to bottom, rgba(44,9,19,0.35) 0%, transparent 30%)` }} />
        <img src={imgSaree} alt="Banarasi silk saree" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.78) saturate(0.88)" }} />
      </div>

      {/* Cross-hatch grid overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 56px, rgba(200,155,71,0.022) 56px, rgba(200,155,71,0.022) 57px), repeating-linear-gradient(90deg, transparent, transparent 56px, rgba(200,155,71,0.014) 56px, rgba(200,155,71,0.014) 57px)` }} />

      {/* Left content */}
      <div style={{ position: "relative", zIndex: 3, padding: "64px 0 148px 56px", flex: "0 0 62%", maxWidth: "62%" }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 2, background: `linear-gradient(90deg, ${T.antiqueGold}, rgba(200,155,71,0))` }} />
          <span style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(200,155,71,0.85)", letterSpacing: "3px", textTransform: "uppercase" as const, fontWeight: 600 }}>
            Beere Kanchi Silks · Reports &amp; Analytics
          </span>
        </div>
        {/* Headline */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: F.display, fontSize: 72, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.0, letterSpacing: "-1px" }}>
            Reports
          </h1>
          <div style={{ fontFamily: F.display, fontSize: 40, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400, letterSpacing: "-0.4px", marginTop: 6, lineHeight: 1.1 }}>
            &amp; Business Analytics
          </div>
        </div>
        {/* Body */}
        <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.65)", margin: "0", maxWidth: 520, lineHeight: 1.70 }}>
          View detailed reports for every part of the business — production, payments, weavers, sales, and customers. Compare periods, download as PDF or Excel, and schedule automatic delivery.
        </p>
      </div>
    </header>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — STATS STRIP (MetricsBar style — floats over hero)
// ══════════════════════════════════════════════════════════════════════════════
const REPORT_METRICS = [
  {
    ico: <BarChart2    size={22} color="rgba(245,232,208,0.90)" />,
    label: "Reports Generated",
    val: "34",
    sub: "All admin users · May 2026",
    hi: false,
  },
  {
    ico: <Clock        size={22} color="rgba(245,232,208,0.90)" />,
    label: "Last Generated",
    val: "2 hrs ago",
    sub: "Weaver Payment Report",
    hi: false,
  },
  {
    ico: <Calendar     size={22} color="rgba(231,201,131,0.95)" />,
    label: "Scheduled Reports",
    val: "5",
    sub: "Auto-sent every month",
    hi: true,
  },
  {
    ico: <Download     size={22} color="rgba(245,232,208,0.90)" />,
    label: "Downloads This Month",
    val: "18",
    sub: "PDF: 12 · Excel: 6",
    hi: false,
  },
  {
    ico: <FileText     size={22} color="rgba(245,232,208,0.90)" />,
    label: "Report Categories",
    val: "8",
    sub: "Full business coverage",
    hi: false,
  },
];

function ReportsStatsStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      style={{ padding: "0 48px", marginTop: -80, position: "relative", zIndex: 20 }}
    >
      <div style={{
        background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
        borderRadius: 28,
        display: "flex",
        alignItems: "stretch",
        boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)",
        overflow: "hidden",
        minHeight: 148,
      }}>
        {REPORT_METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09, ease: EASE }}
            style={{
              flex: 1,
              padding: "28px 24px",
              backgroundImage: m.hi ? "linear-gradient(135deg,rgba(200,155,71,0.22) 0%,rgba(200,155,71,0.07) 100%)" : "none",
              borderRight: i < REPORT_METRICS.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 16,
              position: "relative" as const,
              cursor: "pointer",
            }}
          >
            {/* Gold top shimmer on highlighted */}
            {m.hi && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />
            )}
            {/* Icon box */}
            <div style={{
              width: 50, height: 50, borderRadius: 15, flexShrink: 0,
              background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)",
              border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {m.ico}
            </div>
            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.70)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 40, color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 8 }}>
                <AnimCount raw={m.val} />
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.hi ? "rgba(231,201,131,0.90)" : "rgba(245,232,208,0.55)", letterSpacing: "0.1px" }}>
                {m.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — REPORT TAB NAVIGATION
// ══════════════════════════════════════════════════════════════════════════════
type ReportTabKey = "raw-material" | "production" | "weaver-payment" | "retail" | "wholesale" | "pnl" | "customers" | "overdue";

interface ReportTab {
  key: ReportTabKey;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  desc: string;
  iconColor: string;
  iconBg: string;
}

const REPORT_TABS: ReportTab[] = [
  { key: "raw-material",   Icon: Package,       label: "Raw Material",     desc: "Stock & flow",      iconColor: "#8B6018",        iconBg: "rgba(200,155,71,0.22)"  },
  { key: "production",     Icon: Scissors,      label: "Saree Production", desc: "Output & batches",  iconColor: "#FFFDF9",        iconBg: "rgba(245,232,208,0.16)" },
  { key: "weaver-payment", Icon: Users,         label: "Weaver Payments",  desc: "Making charges",    iconColor: "#2D9158",        iconBg: "rgba(45,145,88,0.20)"   },
  { key: "retail",         Icon: Store,         label: "Retail Sales",     desc: "Walk-in & direct",  iconColor: "#4A7FB5",        iconBg: "rgba(74,127,181,0.20)"  },
  { key: "wholesale",      Icon: Boxes,         label: "Wholesale Sales",  desc: "Bulk & exports",    iconColor: "#9B4DCA",        iconBg: "rgba(155,77,202,0.20)"  },
  { key: "pnl",            Icon: BarChart3,     label: "Profit & Loss",    desc: "Net income",        iconColor: "#2D9158",        iconBg: "rgba(45,145,88,0.20)"   },
  { key: "customers",      Icon: UsersRound,    label: "Customers",        desc: "Collections & dues",iconColor: T.antiqueGold,    iconBg: "rgba(200,155,71,0.22)"  },
  { key: "overdue",        Icon: BellRing,      label: "Overdue & Alerts", desc: "Pending actions",   iconColor: "#E05252",        iconBg: "rgba(224,82,82,0.20)"   },
];

const PERIODS = ["Today", "This Week", "This Month", "This Quarter", "This Year", "Custom Dates"];

function ReportTabNav({ activeTab, setActiveTab, activePeriod, setActivePeriod, compareOn, setCompareOn }: {
  activeTab: ReportTabKey; setActiveTab: (k: ReportTabKey) => void;
  activePeriod: string; setActivePeriod: (p: string) => void;
  compareOn: boolean; setCompareOn: (v: boolean) => void;
}) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, boxShadow: "0 6px 28px rgba(0,0,0,0.22)" }}>

      {/* ── Tab strip — dark gradient ──────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #2C0913 0%, #5D1027 60%, #3D0E1A 100%)",
        padding: "0 48px",
        display: "flex",
        alignItems: "stretch",
        borderBottom: "1px solid rgba(200,155,71,0.16)",
      }}>
        {REPORT_TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column" as const,
                alignItems: "center",
                justifyContent: "center",
                gap: 11,
                height: 126,
                border: "none",
                borderBottom: `3px solid ${active ? T.antiqueGold : "transparent"}`,
                background: active ? "rgba(200,155,71,0.10)" : "transparent",
                cursor: "pointer",
                padding: "0 8px",
                position: "relative" as const,
                transition: "background 0.2s",
              }}
            >
              {/* Icon box */}
              <div style={{
                width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                background: active ? tab.iconBg : "rgba(245,232,208,0.07)",
                border: `1px solid ${active ? "rgba(200,155,71,0.30)" : "rgba(245,232,208,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                <tab.Icon
                  size={26}
                  color={active ? tab.iconColor : "rgba(245,232,208,0.40)"}
                />
              </div>
              {/* Label */}
              <div style={{ textAlign: "center" as const, lineHeight: 1.3 }}>
                <div style={{
                  fontFamily: F.ui,
                  fontSize: 16,
                  fontWeight: active ? 700 : 600,
                  color: active ? "#FFFDF9" : "rgba(245,232,208,0.52)",
                  whiteSpace: "nowrap" as const,
                  letterSpacing: "0.1px",
                  transition: "color 0.2s",
                }}>
                  {tab.label}
                </div>
                <div style={{
                  fontFamily: F.mono,
                  fontSize: 12.5,
                  color: active ? "rgba(200,155,71,0.82)" : "rgba(245,232,208,0.28)",
                  letterSpacing: "0.3px",
                  marginTop: 3,
                  transition: "color 0.2s",
                }}>
                  {tab.desc}
                </div>
              </div>
              {/* Active gold underline pill */}
              {active && (
                <div style={{
                  position: "absolute", bottom: 0, left: "50%",
                  transform: "translateX(-50%)",
                  width: 48, height: 3,
                  background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`,
                  borderRadius: "3px 3px 0 0",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filter bar — ivory ─────────────────────────────────── */}
      <div style={{
        background: T.warmIvory,
        borderBottom: `1px solid ${T.borderDef}`,
        padding: "16px 48px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap" as const,
      }}>

        {/* Period label */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(200,155,71,0.12)", border: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={18} color={T.antiqueGold} />
          </div>
          <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap" as const }}>Period:</span>
        </div>

        {/* Period pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          {PERIODS.map(p => {
            const active = activePeriod === p;
            const disabled = activeTab === "overdue";
            return (
              <button key={p} onClick={() => !disabled && setActivePeriod(p)}
                style={{
                  padding: "10px 22px", borderRadius: 99,
                  border: `1.5px solid ${active ? T.royalBurgundy : T.borderDef}`,
                  background: active ? T.royalBurgundy : "#FFFFFF",
                  color: active ? "#FFFDF9" : disabled ? "rgba(139,112,96,0.30)" : T.taupe,
                  fontFamily: F.ui, fontSize: 15, fontWeight: active ? 700 : 500,
                  cursor: disabled ? "default" : "pointer",
                  transition: "all 0.18s",
                  whiteSpace: "nowrap" as const,
                  boxShadow: active ? "0 2px 8px rgba(110,15,45,0.22)" : "none",
                }}>
                {p}
              </button>
            );
          })}
        </div>

        {activeTab === "overdue" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={15} color={T.antiqueGold} />
            <span style={{ fontFamily: F.ui, fontSize: 15, color: T.antiqueGold, fontStyle: "italic" }}>Live status — no period filter applies.</span>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Compare period toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 500, color: T.taupe, whiteSpace: "nowrap" as const }}>Compare period</span>
          <div
            onClick={() => setCompareOn(!compareOn)}
            style={{ width: 50, height: 28, borderRadius: 14, background: compareOn ? T.royalBurgundy : "rgba(110,15,45,0.12)", cursor: "pointer", position: "relative" as const, transition: "background 0.22s", flexShrink: 0 }}
          >
            <div style={{ position: "absolute", top: 4, left: compareOn ? 26 : 4, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.22s", boxShadow: "0 1px 5px rgba(0,0,0,0.25)" }} />
          </div>
          {compareOn && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: F.mono, fontSize: 14, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, padding: "6px 14px", borderRadius: 99, fontWeight: 600 }}>May 2026</span>
              <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>vs</span>
              <span style={{ fontFamily: F.mono, fontSize: 14, background: "rgba(200,155,71,0.13)", color: "#8B6018", padding: "6px 14px", borderRadius: 99, fontWeight: 600 }}>April 2026</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: T.borderDef, flexShrink: 0 }} />

        {/* Download buttons */}
        <div style={{ display: "flex", gap: 9, flexShrink: 0 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", border: `1.5px solid ${T.borderDef}`, borderRadius: 10, background: "#FFFFFF", fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
            <FileText size={16} />Download PDF
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", border: "none", borderRadius: 10, background: T.royalBurgundy, fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: "#FFFDF9", cursor: "pointer", boxShadow: "0 2px 10px rgba(110,15,45,0.30)" }}>
            <Download size={16} />Download Excel
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — RAW MATERIAL REPORT
// ══════════════════════════════════════════════════════════════════════════════
const rawReceivedData = [
  { material: "Warp",   may: 50, apr: 40 },
  { material: "Resham", may: 75, apr: 58 },
  { material: "Jari",   may: 47, apr: 36 },
];
const rawGivenData = [
  { material: "Warp",   may: 22, apr: 18 },
  { material: "Resham", may: 51, apr: 40 },
  { material: "Jari",   may: 31, apr: 25 },
];
const REELS_PER_BUN = 4;
const bunsAndReels = (reels: number) => {
  const buns = Math.floor(reels / REELS_PER_BUN);
  const rem = reels % REELS_PER_BUN;
  return rem > 0 ? `${buns} Buns ${rem} Reel${rem > 1 ? "s" : ""}` : `${buns} Buns`;
};
const rawMaterialRows = [
  { type: "WARP",   sub: "Cotton / Silk",         open: 92,  recv: 50,  given: 22, close: 120, change: "↑ 30%",  oos: false, unit: "kg" },
  { type: "RESHAM", sub: "Red",                   open: 18,  recv: 30,  given: 8,  close: 40,  change: "↑ 122%", oos: false, unit: "kg" },
  { type: "RESHAM", sub: "Gold",                  open: 12,  recv: 25,  given: 10, close: 27,  change: "↑ 125%", oos: false, unit: "kg" },
  { type: "RESHAM", sub: "Green",                 open: 8,   recv: 20,  given: 18, close: 10,  change: "↑ 25%",  oos: false, unit: "kg" },
  { type: "RESHAM", sub: "Blue",                  open: 5,   recv: 0,   given: 5,  close: 0,   change: "— Out of Stock", oos: true, unit: "kg" },
  { type: "RESHAM", sub: "Maroon",                open: 6,   recv: 0,   given: 6,  close: 0,   change: "— Out of Stock", oos: true, unit: "kg" },
  { type: "RESHAM", sub: "Cream",                 open: 4,   recv: 0,   given: 4,  close: 0,   change: "— Out of Stock", oos: true, unit: "kg" },
  { type: "JARI",   sub: "Polyester 2G Gold",     open: 8,   recv: 15,  given: 6,  close: 17,  change: "↑ 112%", oos: false, unit: "reels" },
  { type: "JARI",   sub: "Polyester 1G Silver",   open: 3,   recv: 12,  given: 11, close: 4,   change: "↑ 33%",  oos: false, unit: "reels" },
  { type: "JARI",   sub: "Silk Fast 3G Gold",     open: 10,  recv: 20,  given: 14, close: 16,  change: "↑ 60%",  oos: false, unit: "reels" },
];

// Receipt-log rows — one row per GRN batch received against a PO (matches WorkerGRN + MaterialsPage "Recently Received")
interface RawMaterialReceiptRow {
  batchId: string;
  dateReceived: string;
  vendor: string;
  firmName: string;
  materialType: "Warp" | "Resham" | "Jari";
  description: string;
  quantity: string;
  unit: string;
  poReference: string;
  notes: string;
}
const rawReceiptRows: RawMaterialReceiptRow[] = [
  { batchId: "GRN-2026-MAY-014", dateReceived: "20 May 2026", vendor: "Surat Zari Works",          firmName: "Beere Kesava Silks (Head Firm)", materialType: "Jari",   description: "Polyester 2G Gold",  quantity: "6 Buns (24 Reels)", unit: "Buns", poReference: "PO-2026-020", notes: "" },
  { batchId: "GRN-2026-MAY-011", dateReceived: "17 May 2026", vendor: "Kanchipuram Silks",         firmName: "Beere Kesava Silks (Head Firm)", materialType: "Resham", description: "Red",                quantity: "30",                unit: "kg",   poReference: "PO-2026-021", notes: "Delivered in 2 lots" },
  { batchId: "GRN-2026-MAY-011", dateReceived: "17 May 2026", vendor: "Kanchipuram Silks",         firmName: "Beere Kesava Silks (Head Firm)", materialType: "Resham", description: "Gold",               quantity: "25",                unit: "kg",   poReference: "PO-2026-021", notes: "" },
  { batchId: "GRN-2026-MAY-006", dateReceived: "12 May 2026", vendor: "Sri Venkateswara Textiles", firmName: "Beere Kesava Silks (Head Firm)", materialType: "Warp",   description: "Cotton/Silk",        quantity: "50",                unit: "kg",   poReference: "PO-2026-022", notes: "" },
  { batchId: "GRN-2026-APR-028", dateReceived: "28 Apr 2026", vendor: "Ratan Zari Works",          firmName: "Beere Kesava Silks (Head Firm)", materialType: "Jari",   description: "Silk Fast 3G Gold",  quantity: "5 Buns (20 Reels)", unit: "Buns", poReference: "PO-2026-031", notes: "Short by 1 bun vs PO" },
];

function RawMaterialReport() {
  return (
    <div id="rep-raw-materials" style={{ padding: "32px 40px" }}>
      <TabTitle title="Raw Material Report"
        sub="Track everything about raw material — how much was received from vendors, how much was given to weavers, and how much is still in the factory. Warp, Resham, and Jari tracked separately." />
      <ReportDLBar />

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, marginBottom: 28, alignItems: "stretch" }}>
        <ChartCard title="Raw Material Received from Vendors" sub="May 2026 vs April 2026" icon={<Package size={22} color={T.royalBurgundy} />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rawReceivedData} barGap={4}>
              <CartesianGrid key="rm-recv-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="rm-recv-x" dataKey="material" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="rm-recv-y" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} unit=" kg" width={44} />
              <Tooltip key="rm-recv-tip" content={<ChartTip suffix=" kg" />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="rm-recv-may" dataKey="may" name="May 2026" fill={T.royalBurgundy} radius={[4,4,0,0] as any} />
              <Bar key="rm-recv-apr" dataKey="apr" name="April 2026" fill={T.antiqueGold} radius={[4,4,0,0] as any} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
            {[{ c: T.royalBurgundy, l: "May 2026" }, { c: T.antiqueGold, l: "April 2026" }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: 2, background: x.c }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{x.l}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Material Given to Weavers" sub="May 2026 vs April 2026" icon={<Scissors size={22} color={T.green} />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rawGivenData} barGap={4}>
              <CartesianGrid key="rm-gvn-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="rm-gvn-x" dataKey="material" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="rm-gvn-y" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} unit=" kg" width={44} />
              <Tooltip key="rm-gvn-tip" content={<ChartTip suffix=" kg" />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="rm-gvn-may" dataKey="may" name="May 2026" fill={T.green} radius={[4,4,0,0] as any} />
              <Bar key="rm-gvn-apr" dataKey="apr" name="April 2026" fill={T.green} radius={[4,4,0,0] as any} opacity={0.4} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
            {[{ c: T.green, l: "May 2026" }, { c: "rgba(30,102,64,0.4)", l: "April 2026" }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: 2, background: x.c }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{x.l}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="What Is In Stock Right Now" sub="Current closing stock levels" icon={<BarChart2 size={22} color={T.antiqueGold} />}>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start", padding: "12px 0 8px" }}>
            <MiniDonut value={120} max={200} color={T.royalBurgundy} label="Warp" badge="Healthy" badgeType="ok" />
            <MiniDonut value={77}  max={150} color={T.antiqueGold}    label="Resham" badge="3 Out of Stock" badgeType="low" />
            <MiniDonut value={37}  max={80}  color={T.green}          label="Jari" unit="reels" footNote="9 Buns · 1 Reel" badge="Healthy" badgeType="ok" />
          </div>
        </ChartCard>
      </div>

      {/* Comparison table */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr>
                  <th style={TH}>Material Type</th>
                  <th style={TH}>Sub-type / Color / Grade</th>
                  <th style={{ ...TH, textAlign: "right" }}>Opening Stock</th>
                  <th style={{ ...TH, textAlign: "right" }}>Received This Period</th>
                  <th style={{ ...TH, textAlign: "right" }}>Given to Weavers</th>
                  <th style={{ ...TH, textAlign: "right" }}>Closing Stock</th>
                  <th style={{ ...TH, textAlign: "center" }}>Change vs Last Period</th>
                </tr>
              </thead>
              <tbody>
                {rawMaterialRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${r.type === "WARP" ? T.royalBurgundy : r.type === "RESHAM" ? T.antiqueGold : T.green}` }}>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{r.type}</span></td>
                    <td style={TD}>{r.sub}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 600 }}>{r.open} {r.unit}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.green, fontWeight: 600 }}>{r.recv > 0 ? `${r.recv} ${r.unit}` : "—"}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.crimson }}>{r.given > 0 ? `${r.given} ${r.unit}` : "—"}</td>
                    <td style={{ ...TD, textAlign: "right" }}>
                      <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: r.close === 0 ? T.crimson : T.luxuryBrown }}>{r.close} {r.unit}</div>
                      {r.unit === "reels" && <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>{bunsAndReels(r.close)}</div>}
                    </td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: r.oos ? T.crimson : T.green }}>{r.change}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: T.warmCream, borderTop: `2px solid ${T.borderDef}` }}>
                  <td colSpan={2} style={{ ...TD, fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown, background: T.warmCream }}>Total across all materials</td>
                  <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, background: T.warmCream }}>166 kg</td>
                  <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.green, background: T.warmCream }}>172 kg</td>
                  <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson, background: T.warmCream }}>104 kg</td>
                  <td style={{ ...TD, textAlign: "right", fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream }}>234 kg</td>
                  <td style={{ ...TD, background: T.warmCream }} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </FadeUp>

      {/* Materials Received — Batch Log (per-GRN receipt log, matches WorkerGRN / MaterialsPage) */}
      <FadeUp>
        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 4 }}>Materials Received — Batch Log</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14 }}>Every material batch received from a vendor against a purchase order, with its GRN batch ID.</div>
          <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th style={TH}>Batch ID</th>
                    <th style={TH}>Date Received</th>
                    <th style={TH}>Vendor</th>
                    <th style={TH}>Firm Name</th>
                    <th style={TH}>Material Type</th>
                    <th style={TH}>Description</th>
                    <th style={{ ...TH, textAlign: "right" }}>Quantity</th>
                    <th style={TH}>Unit</th>
                    <th style={TH}>PO Reference</th>
                    <th style={TH}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rawReceiptRows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${r.materialType === "Warp" ? T.royalBurgundy : r.materialType === "Resham" ? T.antiqueGold : T.green}` }}>
                      <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy }}>{r.batchId}</span></td>
                      <td style={{ ...TD, fontFamily: F.mono, fontSize: 12 }}>{r.dateReceived}</td>
                      <td style={TD}>{r.vendor}</td>
                      <td style={TD}>{r.firmName}</td>
                      <td style={TD}>
                        <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 8px", borderRadius: 5 }}>{r.materialType}</span>
                      </td>
                      <td style={TD}>{r.description}</td>
                      <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 600 }}>{r.quantity}</td>
                      <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.unit}</td>
                      <td style={{ ...TD, fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{r.poReference}</td>
                      <td style={{ ...TD, fontSize: 12, color: T.taupe }}>{r.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — SAREE PRODUCTION REPORT (DEFAULT)
// ══════════════════════════════════════════════════════════════════════════════
const PRODUCTION_SOURCE_DATA = [
  { name: "Own Factory",          value: 142, fill: "#6E0F2D" },
  { name: "Outsourced (Weavers)", value: 106, fill: "#C89B47" },
];

const prodWeeklyData = [
  { week: "W1", may: 58, apr: 50 },
  { week: "W2", may: 64, apr: 55 },
  { week: "W3", may: 72, apr: 62 },
  { week: "W4", may: 54, apr: 48 },
];
const prodStageData = [
  { stage: "Dispatched",          count: 186, color: "#8B7060" },
  { stage: "Finished",            count: 186, color: "#3B5F4E" },
  { stage: "Assigned to Finishing",count: 24, color: T.darkBurgundy },
  { stage: "Quality Check Passed", count: 238, color: T.green },
  { stage: "Waiting Quality Check",count: 14,  color: T.royalBurgundy },
  { stage: "Weaving in Progress",  count: 48,  color: T.antiqueGold },
];
const qcDonutData = [
  { name: "Passed",      value: 238, color: T.green },
  { name: "Minor Issues",value: 0,   color: T.antiqueGold },
  { name: "Rejected",    value: 10,  color: T.crimson },
];
// External purchases summary — mirrors ExternalPurchasesPage data shape (local sample data; that page has no shared context)
const externalPurchaseRows = [
  { supplier: "Ravi Silks",                location: "Dharmavaram, AP", gstNumber: "37ABCRS1234F1Z5", invoiceNumber: "INV-RS-2026-118", billAmount: 34000,  sareeCount: 4,  date: "01 Jun 2026", sareeIds: ["EXT-2026-0001-001", "EXT-2026-0001-002", "EXT-2026-0001-003", "EXT-2026-0001-004"] },
  { supplier: "Mysore Sarees",             location: "Mysore, KA",      gstNumber: "29MYSRS5678K1Z2", invoiceNumber: "INV-MS-2026-552", billAmount: 74400,  sareeCount: 12, date: "05 Jun 2026", sareeIds: ["EXT-2026-0002-001", "EXT-2026-0002-002", "EXT-2026-0002-003"] },
  { supplier: "Chennai Silks",             location: "Chennai, TN",     gstNumber: "33CHNSK9012L1Z8", invoiceNumber: "INV-CS-2026-073", billAmount: 66000,  sareeCount: 6,  date: "08 Jun 2026", sareeIds: ["EXT-2026-0003-001", "EXT-2026-0003-002"] },
  { supplier: "Kanchipuram House",         location: "Kanchipuram, TN", gstNumber: "33KNCH3456M1Z1", invoiceNumber: "INV-KH-2026-209", billAmount: 88000,  sareeCount: 8,  date: "10 Jun 2026", sareeIds: ["EXT-2026-0004-001", "EXT-2026-0004-002"] },
  { supplier: "Venkateshwara Handlooms",   location: "Ongole, AP",      gstNumber: "37VENK7890N1Z6", invoiceNumber: "INV-VH-2026-014", billAmount: 22500,  sareeCount: 3,  date: "11 Jun 2026", sareeIds: ["EXT-2026-0005-001"] },
];

function ExternalPurchasesSection() {
  const totalSarees = externalPurchaseRows.reduce((s, r) => s + r.sareeCount, 0);
  const totalBill = externalPurchaseRows.reduce((s, r) => s + r.billAmount, 0);
  return (
    <FadeUp>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 4 }}>External Purchases</div>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 14 }}>Sarees purchased ready-made from external suppliers — separate from factory production.</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <SumCard icon={<Package size={22} color={T.royalBurgundy} />} label="Total External Sarees Purchased" value={`${totalSarees} sarees`} sub="This period" />
          <SumCard icon={<IndianRupee size={22} color={T.antiqueGold} />} label="Total Bill Amount" value={`₹${totalBill.toLocaleString("en-IN")}`} sub="Across all suppliers" hi />
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={TH}>Vendor / Supplier</th>
                  <th style={TH}>GST Number</th>
                  <th style={TH}>Invoice Number</th>
                  <th style={{ ...TH, textAlign: "right" }}>Bill Amount</th>
                  <th style={{ ...TH, textAlign: "center" }}>Sarees</th>
                  <th style={TH}>Date</th>
                  <th style={TH}>Saree IDs</th>
                </tr>
              </thead>
              <tbody>
                {externalPurchaseRows.map((r, i) => (
                  <tr key={r.invoiceNumber} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.antiqueGold}` }}>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.supplier}</span></td>
                    <td style={{ ...TD, fontFamily: F.mono, fontSize: 11 }}>{r.gstNumber}</td>
                    <td style={{ ...TD, fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{r.invoiceNumber}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700 }}>₹{r.billAmount.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{r.sareeCount}</td>
                    <td style={{ ...TD, fontFamily: F.mono, fontSize: 11.5 }}>{r.date}</td>
                    <td style={{ ...TD, fontFamily: F.mono, fontSize: 10.5, color: T.taupe }}>{r.sareeIds.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}

const prodTableRows = [
  { code: "WV-001", name: "Ravi Kumar",   batches: 1, produced: 8,  passed: 8,  rejected: 0, passRate: 100, designs: "BKB-032",  charges: 3600  },
  { code: "WV-002", name: "Padma Veni",   batches: 1, produced: 5,  passed: 5,  rejected: 0, passRate: 100, designs: "BKB-045",  charges: 3400  },
  { code: "WV-005", name: "Anand K.",     batches: 1, produced: 5,  passed: 4,  rejected: 1, passRate: 80,  designs: "BKB-038",  charges: 4800  },
  { code: "WV-007", name: "Suresh Murti", batches: 1, produced: 4,  passed: 4,  rejected: 0, passRate: 100, designs: "BKB-019",  charges: 1120  },
  { code: "WV-012", name: "Meena R.",     batches: 1, produced: 4,  passed: 4,  rejected: 0, passRate: 100, designs: "BKB-022",  charges: 1800  },
  { code: "WV-018", name: "Lakshmi D.",   batches: 1, produced: 5,  passed: 4,  rejected: 1, passRate: 80,  designs: "BKB-031",  charges: 1800  },
  { code: "WV-024", name: "Venkat Rao",   batches: 2, produced: 8,  passed: 8,  rejected: 0, passRate: 100, designs: "BKB-019",  charges: 2240  },
  { code: "WV-031", name: "Kamala B.",    batches: 1, produced: 6,  passed: 6,  rejected: 0, passRate: 100, designs: "BKB-045",  charges: 4080  },
  { code: "WV-041", name: "Sundar Rao",   batches: 2, produced: 12, passed: 12, rejected: 0, passRate: 100, designs: "BKB-032",  charges: 5400  },
  { code: "WV-055", name: "Deepa M.",     batches: 2, produced: 10, passed: 9,  rejected: 1, passRate: 90,  designs: "BKB-038",  charges: 9600  },
];

function SareeProductionReport() {
  return (
    <div id="rep-production" style={{ padding: "32px 40px" }}>
      <TabTitle title="Saree Production Report"
        sub="Track how many sarees were produced, which weavers produced them, which designs were made, and how many passed or failed quality check." />
      <ReportDLBar />

      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {["All Sources", "Own Factory Only", "Outsourced Only"].map((f, i) => (
          <div key={i} style={{ padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontFamily: F.ui, fontSize: 12, fontWeight: 500, background: i === 0 ? T.royalBurgundy : "transparent", color: i === 0 ? "#FFF" : T.taupe, border: `1px solid ${i === 0 ? T.royalBurgundy : T.borderDef}` }}>{f}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20, marginBottom: 24, alignItems: "stretch" }}>
        <ChartCard title="Sarees Produced Each Week" sub="May 2026 vs April 2026" icon={<TrendingUp size={22} color={T.royalBurgundy} />}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={prodWeeklyData}>
              <CartesianGrid key="prod-wk-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="prod-wk-x" dataKey="week" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="prod-wk-y" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} width={30} />
              <Tooltip key="prod-wk-tip" content={<ChartTip suffix=" sarees" />} />
              <Line key="prod-wk-may" type="monotone" dataKey="may" name="May 2026" stroke={T.royalBurgundy} strokeWidth={2.5} dot={{ fill: T.royalBurgundy, r: 4 }} />
              <Line key="prod-wk-apr" type="monotone" dataKey="apr" name="April 2026" stroke={T.antiqueGold} strokeWidth={2} strokeDasharray="5 4" dot={{ fill: T.antiqueGold, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
            {[{ c: T.royalBurgundy, l: "May 2026", dash: false }, { c: T.antiqueGold, l: "April 2026", dash: true }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 18, height: 3, borderRadius: 2, background: x.c, borderTop: x.dash ? `2px dashed ${x.c}` : "none" }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{x.l}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Where Sarees Are Right Now" sub="Production pipeline by stage" icon={<Factory size={22} color={T.antiqueGold} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "6px 0" }}>
            {prodStageData.map(s => (
              <div key={s.stage}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>{s.stage}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
                <AnimBar pct={Math.round((s.count / 248) * 100)} color={s.color} height={7} delay={prodStageData.indexOf(s) * 0.06} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Quality Check This Period" sub="Pass / reject breakdown — May 2026" icon={<CheckCircle2 size={22} color={T.green} />}>
          <div style={{ position: "relative" }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie key="qc-pie" data={qcDonutData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={48} outerRadius={70}
                  dataKey="value" stroke="none" paddingAngle={3}>
                  {qcDonutData.filter(d => d.value > 0).map(e => <Cell key={`qc-cell-${e.name}`} fill={e.color} />)}
                </Pie>
                <Tooltip key="qc-tip" formatter={(v: any, n: any) => [`${v} sarees`, n]}
                  contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.green }}>96%</div>
              <div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe }}>Pass Rate</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 8px" }}>
            {qcDonutData.filter(d => d.value > 0).map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Own Factory vs Outsourced donut */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Boxes size={24} color={T.royalBurgundy} />
            </div>
            <div>
              <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0" }}>Own Factory vs Outsourced</h3>
              <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>Production source split this period</p>
            </div>
          </div>
          <div style={{ flex: 1, position: "relative", minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PRODUCTION_SOURCE_DATA} innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                  {PRODUCTION_SOURCE_DATA.map((entry, index) => (
                    <Cell key={`src-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown }}>248</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Sarees</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            {PRODUCTION_SOURCE_DATA.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.fill, flexShrink: 0 }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, flex: 1 }}>{s.name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{s.value}</span>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>({Math.round(s.value/248*100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4 summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<Package size={22} color={T.royalBurgundy} />} label="Total Sarees Produced" value="248" sub="↑ 14% vs April 2026" />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Total Passed Quality Check" value="238" sub="96% pass rate" greenHi />
        <SumCard icon={<AlertTriangle size={22} color={T.crimson} />} label="Total Rejected" value="10" sub="4% rejection rate" crimsonHi />
        <SumCard icon={<Truck size={22} color={T.antiqueGold} />} label="Total Dispatched" value="186" sub="To wholesale customers" hi />
      </div>

      {/* Production table */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
              <thead>
                <tr>
                  <th style={TH}>Weaver Code</th>
                  <th style={TH}>Weaver Name</th>
                  <th style={{ ...TH, textAlign: "center" }}>Batches</th>
                  <th style={{ ...TH, textAlign: "center" }}>Sarees Produced</th>
                  <th style={{ ...TH, textAlign: "center" }}>QC Passed</th>
                  <th style={{ ...TH, textAlign: "center" }}>QC Rejected</th>
                  <th style={{ ...TH, textAlign: "center" }}>Pass Rate</th>
                  <th style={TH}>Designs Worked On</th>
                  <th style={{ ...TH, textAlign: "right" }}>Making Charges</th>
                </tr>
              </thead>
              <tbody>
                {prodTableRows.map((r, i) => (
                  <tr key={r.code} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream }}>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy }}>{r.code}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{r.name}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>{r.batches}</td>
                    <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{r.produced}</td>
                    <td style={{ ...TD, textAlign: "center", color: T.green, fontFamily: F.mono, fontWeight: 700 }}>{r.passed}</td>
                    <td style={{ ...TD, textAlign: "center", color: r.rejected > 0 ? T.crimson : T.taupe, fontFamily: F.mono, fontWeight: 700 }}>{r.rejected > 0 ? r.rejected : "—"}</td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <StatusPill label={`${r.passRate}%`} type={r.passRate >= 95 ? "ok" : r.passRate >= 85 ? "warn" : "bad"} />
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{r.designs}</span></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy }}>₹{r.charges.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: T.warmCream, borderTop: `2px solid ${T.borderDef}` }}>
                  <td colSpan={3} style={{ ...TD, fontFamily: F.ui, fontWeight: 700, background: T.warmCream }}>Totals (showing 10 of 84 weavers)</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, background: T.warmCream }}>67</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.green, background: T.warmCream }}>64</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.crimson, background: T.warmCream }}>3</td>
                  <td style={{ ...TD, textAlign: "center", background: T.warmCream }}><StatusPill label="96%" type="ok" /></td>
                  <td style={{ ...TD, background: T.warmCream }} />
                  <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream }}>₹{prodTableRows.reduce((s, r) => s + r.charges, 0).toLocaleString("en-IN")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <TablePager total={84} showing={10} />
        </div>
      </FadeUp>

      <ExternalPurchasesSection />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — WEAVER PAYMENT REPORT
// ══════════════════════════════════════════════════════════════════════════════
const weaverPayMonthly = [
  { month: "Dec", amt: 380000 },
  { month: "Jan", amt: 395000 },
  { month: "Feb", amt: 410000 },
  { month: "Mar", amt: 400000 },
  { month: "Apr", amt: 405000 },
  { month: "May", amt: 420000 },
];
const deductionDonut = [
  { name: "No Deductions",         value: 65, color: T.green },
  { name: "Advance Deductions",    value: 17, color: T.antiqueGold },
  { name: "Defective Sarees",      value: 2,  color: T.crimson },
];
// Saree-type breakdown per weaver (sb/hz/ps/bs/st counts — matches PaymentsPage WEAVERS pattern)
const weaverPayRows = [
  { code: "WV-001", name: "Ravi Kumar",   village: "Varanasi",      sb: 8, hz: 0, ps: 0, bs: 0, st: 0 },
  { code: "WV-002", name: "Padma Veni",   village: "Rajatalab",     sb: 0, hz: 5, ps: 0, bs: 0, st: 0 },
  { code: "WV-007", name: "Suresh Murti", village: "Bhelupura",     sb: 0, hz: 0, ps: 4, bs: 0, st: 0 },
  { code: "WV-005", name: "Anand K.",     village: "Sigra",         sb: 0, hz: 0, ps: 0, bs: 5, st: 0 },
  { code: "WV-012", name: "Meena R.",     village: "Orderly Bazar", sb: 4, hz: 0, ps: 0, bs: 0, st: 0 },
  { code: "WV-031", name: "Kamala B.",    village: "Varanasi",      sb: 0, hz: 6, ps: 0, bs: 0, st: 0 },
  { code: "WV-024", name: "Venkat Rao",   village: "Lanka",         sb: 0, hz: 0, ps: 8, bs: 0, st: 0 },
  { code: "WV-018", name: "Lakshmi D.",   village: "Lahurabir",     sb: 5, hz: 0, ps: 0, bs: 0, st: 0 },
];
function sareeBreakdown(r: typeof weaverPayRows[0]): string {
  return [
    r.sb > 0 && `SB×${r.sb}`,
    r.hz > 0 && `HZ×${r.hz}`,
    r.ps > 0 && `PS×${r.ps}`,
    r.bs > 0 && `BS×${r.bs}`,
    r.st > 0 && `ST×${r.st}`,
  ].filter(Boolean).join(", ") || "—";
}

function WeaverPaymentReport() {
  const { getPaymentsForWeaver } = useWeaverPayments();
  return (
    <div id="rep-weaver-payments" style={{ padding: "32px 40px" }}>
      <TabTitle title="Weaver Payment Report"
        sub="Complete breakdown of making charges earned, deductions applied, and net amounts paid to every weaver. Download the monthly payment sheet for your records." />
      <ReportDLBar />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24, alignItems: "stretch" }}>
        <ChartCard title="Total Making Charges Paid Each Month" sub="Last 6 months — gold bars" icon={<IndianRupee size={22} color={T.antiqueGold} />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weaverPayMonthly}>
              <CartesianGrid key="wp-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="wp-x" dataKey="month" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="wp-y" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`} width={44} />
              <Tooltip key="wp-tip" content={<ChartTip prefix="₹" />} />
              <Bar key="wp-amt" dataKey="amt" name="Making Charges">
                {weaverPayMonthly.map((e, i) => (
                  <Cell key={`wp-cell-${e.month}`} fill={e.month === "May" ? T.antiqueGold : "rgba(200,155,71,0.40)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="What Caused Deductions This Period" sub="May 2026 deduction breakdown" icon={<TrendingDown size={22} color={T.crimson} />}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <PieChart width={160} height={160}>
                <Pie key="ded-pie" data={deductionDonut} cx="50%" cy="50%" innerRadius={48} outerRadius={68} dataKey="value" stroke="none" paddingAngle={3}>
                  {deductionDonut.map(e => <Cell key={`ded-cell-${e.name}`} fill={e.color} />)}
                </Pie>
                <Tooltip key="ded-tip" formatter={(v: any, n: any) => [`${v} weavers`, n]}
                  contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
              </PieChart>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: T.crimson }}>₹18,400</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>TOTAL DEDUCTIONS</div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {deductionDonut.map(d => (
                <div key={d.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{d.name}</span>
                    </div>
                    <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: d.color }}>{d.value}</span>
                  </div>
                  <AnimBar pct={Math.round((d.value / 84) * 100)} color={d.color} height={5} />
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<Users size={22} color={T.royalBurgundy} />} label="Total Weavers Paid" value="72 of 84" sub="12 payments pending" />
        <SumCard icon={<IndianRupee size={22} color={T.antiqueGold} />} label="Total Making Charges" value="₹4,20,000" sub="For May 2026" hi />
        <SumCard icon={<TrendingDown size={22} color={T.crimson} />} label="Total Deductions" value="₹18,400" sub="Advance amounts deducted" crimsonHi />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Total Net Paid" value="₹4,01,600" sub="After all deductions" greenHi />
      </div>

      <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
        <BarChart2 size={18} color={T.antiqueGold} />
        <span style={{ fontFamily: F.ui, fontSize: 14, color: "#7B5C18" }}>This report is commonly used for payment reconciliation and record keeping. Download as Excel for full weaver payment sheet.</span>
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={TH}>Weaver ID</th>
                  <th style={TH}>Weaver Name</th>
                  <th style={TH}>Sarees Produced</th>
                  <th style={{ ...TH, textAlign: "right" }}>Amount Paid</th>
                  <th style={TH}>UTR Number</th>
                  <th style={TH}>Firm Name</th>
                  <th style={TH}>Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {weaverPayRows.map((r, i) => {
                  const payments = getPaymentsForWeaver(r.code);
                  const latest = payments[payments.length - 1];
                  const amountPaid = latest?.amountPaid;
                  const utr = latest?.utrNumber ?? "—";
                  const firmName = latest?.firmName ?? "—";
                  const paymentDate = latest?.paymentDate ?? "—";
                  return (
                    <tr key={r.code} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${latest ? T.green : T.antiqueGold}` }}>
                      <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy }}>{r.code}</span></td>
                      <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600 }}>{r.name}</span></td>
                      <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{sareeBreakdown(r)}</span></td>
                      <td style={{ ...TD, textAlign: "right", fontFamily: F.display, fontSize: 16, fontWeight: 700, color: latest ? T.green : T.taupe }}>{amountPaid !== undefined ? `₹${amountPaid.toLocaleString("en-IN")}` : "—"}</td>
                      <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: latest ? T.green : T.taupe }}>{utr}</span></td>
                      <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{firmName}</span></td>
                      <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{paymentDate}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePager total={84} showing={8} />
        </div>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — RETAIL SALES REPORT
// ══════════════════════════════════════════════════════════════════════════════
const retailDailySales = [
  { week: "W1 (1–7)", may: 11, apr: 9  },
  { week: "W2 (8–15)",may: 14, apr: 11 },
  { week: "W3 (16–22)",may: 13, apr: 10 },
  { week: "W4 (23–31)",may: 10, apr: 9  },
];
const retailWeeklyData = [
  { week: "Week 1", sarees: 11, revenue: 96500  },
  { week: "Week 2", sarees: 14, revenue: 122000 },
  { week: "Week 3", sarees: 13, revenue: 114500 },
  { week: "Week 4", sarees: 10, revenue: 87000  },
];
function RetailWeeklyTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, fontWeight: 600 }}>
        {label} — {d.sarees} sarees sold — ₹{d.revenue.toLocaleString("en-IN")} revenue
      </span>
    </div>
  );
}
const retailDesignSales = [
  { design: "BKB-045", count: 14 },
  { design: "BKB-031", count: 11 },
  { design: "BKB-022", count: 9  },
  { design: "BKB-038", count: 8  },
  { design: "BKB-019", count: 6  },
];
const retailRevenueDonut = [
  { name: "Bridal Special",  value: 180000, color: T.royalBurgundy },
  { name: "Heavy Zari",      value: 112000, color: T.antiqueGold },
  { name: "Self Brocade",    value: 85000,  color: T.green },
  { name: "Plain Silk",      value: 43000,  color: T.taupe },
];
const retailRows = [
  { id: "SR-001", date: "28 May 2026", customer: "Walk-in Customer", phone: "—",          sarId: "BKS-0421", design: "BKB-045", type: "Bridal Special",  price: 12500, barcode: "Yes", bill: "Yes" },
  { id: "SR-002", date: "27 May 2026", customer: "Priya Sharma",     phone: "9845678901", sarId: "BKS-0419", design: "BKB-031", type: "Heavy Zari",       price: 9800,  barcode: "Yes", bill: "Yes" },
  { id: "SR-003", date: "26 May 2026", customer: "Walk-in Customer", phone: "—",          sarId: "BKS-0418", design: "BKB-022", type: "Self Brocade",     price: 8200,  barcode: "Yes", bill: "Yes" },
  { id: "SR-004", date: "25 May 2026", customer: "Rekha Patel",      phone: "9712345678", sarId: "BKS-0415", design: "BKB-038", type: "Bridal Special",  price: 14000, barcode: "Yes", bill: "Yes" },
  { id: "SR-005", date: "24 May 2026", customer: "Walk-in Customer", phone: "—",          sarId: "BKS-0412", design: "BKB-019", type: "Plain Silk",       price: 5500,  barcode: "Yes", bill: "Yes" },
  { id: "SR-006", date: "23 May 2026", customer: "Anita Verma",      phone: "9823456789", sarId: "BKS-0410", design: "BKB-045", type: "Bridal Special",  price: 13500, barcode: "Yes", bill: "Yes" },
  { id: "SR-007", date: "22 May 2026", customer: "Walk-in Customer", phone: "—",          sarId: "BKS-0408", design: "BKB-031", type: "Heavy Zari",       price: 8800,  barcode: "Yes", bill: "Yes" },
  { id: "SR-008", date: "20 May 2026", customer: "RETURN",           phone: "—",          sarId: "BKS-0402", design: "BKB-022", type: "Self Brocade",     price: -7200, barcode: "Yes", bill: "Yes" },
];

function RetailSalesReport() {
  return (
    <div id="rep-retail" style={{ padding: "32px 40px" }}>
      <TabTitle title="Retail Sales Report"
        sub="Track all sales at the retail shop — how many sarees were sold, to which customers, at what prices, and what the total revenue was." />
      <ReportDLBar />

      {/* Weekly saree sales — summary strip + bar chart */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 17, color: T.luxuryBrown }}>Sarees Sold Each Week This Month</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>May 2026 — weekly breakdown</div>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Sarees This Month</div>
                <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.royalBurgundy }}>{retailWeeklyData.reduce((s, w) => s + w.sarees, 0)}</div>
              </div>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Revenue This Month</div>
                <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.green }}>₹{retailWeeklyData.reduce((s, w) => s + w.revenue, 0).toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={retailWeeklyData}>
              <CartesianGrid key="retw-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="retw-x" dataKey="week" tick={{ fontFamily: F.mono, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="retw-y" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} width={30} />
              <Tooltip key="retw-tip" content={<RetailWeeklyTooltip />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="retw-bar" dataKey="sarees" name="Sarees Sold" fill={T.royalBurgundy} radius={[6, 6, 0, 0] as any} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <ChartCard title="Which Designs Sold Most at Retail" sub="Top 5 designs by saree count">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "10px 0" }}>
            {retailDesignSales.map((d, i) => (
              <div key={d.design}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: T.royalBurgundy }}>{d.design}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{d.count} sarees</span>
                </div>
                <AnimBar pct={Math.round((d.count / retailDesignSales[0].count) * 100)} color={T.royalBurgundy} height={7} delay={i * 0.07} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Revenue by Saree Type" sub="Retail revenue split — May 2026">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie key="ret-rev-pie" data={retailRevenueDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none" paddingAngle={3}>
                {retailRevenueDonut.map(e => <Cell key={`ret-rev-cell-${e.name}`} fill={e.color} />)}
              </Pie>
              <Tooltip key="ret-rev-tip" formatter={(v: any, n: any) => [`₹${Number(v).toLocaleString("en-IN")}`, n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "0 4px" }}>
            {retailRevenueDonut.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: d.color }}>₹{(d.value / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<Tag size={22} color={T.royalBurgundy} />} label="Total Sarees Sold at Shop" value="48 sarees" sub="This month" />
        <SumCard icon={<Banknote size={22} color={T.green} />} label="Total Retail Revenue" value="₹4,20,000" sub="May 2026" greenHi />
        <SumCard icon={<Percent size={22} color={T.antiqueGold} />} label="Average Sale Value" value="₹8,750" sub="Per saree" hi />
        <SumCard icon={<RefreshCcw size={22} color={T.crimson} />} label="Total Returns at Shop" value="2 sarees" sub="This month" crimsonHi />
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={TH}>Sale ID</th><th style={TH}>Sale Date</th><th style={TH}>Customer Name</th>
                  <th style={TH}>Phone</th><th style={TH}>Saree ID</th><th style={TH}>Design Code</th>
                  <th style={TH}>Saree Type</th><th style={{ ...TH, textAlign: "right" }}>Retail Price</th>
                  <th style={{ ...TH, textAlign: "center" }}>Barcode Scanned</th><th style={{ ...TH, textAlign: "center" }}>Bill Generated</th>
                </tr>
              </thead>
              <tbody>
                {retailRows.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${r.price < 0 ? T.crimson : T.green}` }}>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{r.id}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11.5 }}>{r.date}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span></td>
                    <td style={TD}><span style={{ color: T.taupe }}>{r.phone}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{r.sarId}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{r.design}</span></td>
                    <td style={TD}>{r.type}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: r.price < 0 ? T.crimson : T.green }}>{r.price < 0 ? `−₹${Math.abs(r.price).toLocaleString("en-IN")}` : `₹${r.price.toLocaleString("en-IN")}`}</td>
                    <td style={{ ...TD, textAlign: "center" }}><StatusPill label={r.barcode} type="ok" /></td>
                    <td style={{ ...TD, textAlign: "center" }}><StatusPill label={r.bill} type="ok" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePager total={48} showing={8} />
        </div>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 5 — WHOLESALE SALES REPORT
// ══════════════════════════════════════════════════════════════════════════════
const wsMonthlyRev = [
  { month: "Dec", rev: 2100000 },
  { month: "Jan", rev: 2350000 },
  { month: "Feb", rev: 2600000 },
  { month: "Mar", rev: 2450000 },
  { month: "Apr", rev: 2680000 },
  { month: "May", rev: 2840000 },
];
const wsOutstanding = [
  { customer: "Padmavathi Textiles", amt: 135000,  color: T.crimson },
  { customer: "Narayana Emporium",   amt: 45600,   color: T.crimson },
  { customer: "Meenakshi Silks",     amt: 420000,  color: T.antiqueGold },
  { customer: "Kalavathi Exports",   amt: 45600,   color: T.crimson },
  { customer: "Vijaya Silk House",   amt: 0,       color: T.green },
];
const wsInvStatus = [
  { name: "Paid",          value: 2, color: T.green },
  { name: "Partially Paid",value: 1, color: T.antiqueGold },
  { name: "Overdue",       value: 3, color: T.crimson },
];
const wsTableRows = [
  { inv: "INV-2026-041", customer: "Lakshmi Silks",          date: "08 Apr 2026", sarees: 18, type: "Mixed",          total: 900000,  recv: 900000,  due: 0,      dueDate: "28 Apr 2026", status: "Paid",    daysLeft: 0   },
  { inv: "INV-2026-038", customer: "Padmavathi Textiles",    date: "05 Apr 2026", sarees: 12, type: "Bridal Special", total: 600000,  recv: 465000,  due: 135000, dueDate: "25 Apr 2026", status: "Overdue", daysLeft: -5  },
  { inv: "INV-2026-035", customer: "Vijaya Silk House",      date: "10 Apr 2026", sarees: 8,  type: "Heavy Zari",     total: 280000,  recv: 280000,  due: 0,      dueDate: "30 Apr 2026", status: "Paid",    daysLeft: 0   },
  { inv: "INV-2026-032", customer: "Narayana Silk Emporium", date: "01 Apr 2026", sarees: 10, type: "Mixed",          total: 300000,  recv: 254400,  due: 45600,  dueDate: "20 Apr 2026", status: "Overdue", daysLeft: -3  },
  { inv: "INV-2026-029", customer: "Meenakshi Silks",        date: "15 Apr 2026", sarees: 20, type: "Bridal Special", total: 840000,  recv: 420000,  due: 420000, dueDate: "05 May 2026", status: "Partial", daysLeft: 0   },
  { inv: "INV-2026-027", customer: "Kalavathi Exports",      date: "18 Apr 2026", sarees: 15, type: "Self Brocade",   total: 660000,  recv: 614400,  due: 45600,  dueDate: "02 May 2026", status: "Overdue", daysLeft: -2  },
];
const wholesaleWeeklyData = [
  { week: "Week 1", sarees: 20, revenue: 900000 },
  { week: "Week 2", sarees: 12, revenue: 600000 },
  { week: "Week 3", sarees: 8,  revenue: 280000 },
  { week: "Week 4", sarees: 18, revenue: 1060000 },
];
function WholesaleWeeklyTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, fontWeight: 600 }}>
        {label} — {d.sarees} sarees dispatched — ₹{d.revenue.toLocaleString("en-IN")} revenue
      </span>
    </div>
  );
}

function WholesaleSalesReport() {
  const { bulkOrders } = useBulkOrders();
  return (
    <div id="rep-wholesale" style={{ padding: "32px 40px" }}>
      <TabTitle title="Wholesale Sales Report"
        sub="Track all wholesale dispatches, invoices raised, payments received, and outstanding dues from every wholesale customer." />
      <ReportDLBar />

      {/* Weekly sarees dispatched — summary strip + bar chart (same pattern as Retail) */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 17, color: T.luxuryBrown }}>Wholesale Sarees Dispatched Each Week</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>May 2026 — weekly breakdown</div>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Sarees This Month</div>
                <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.royalBurgundy }}>{wholesaleWeeklyData.reduce((s, w) => s + w.sarees, 0)}</div>
              </div>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Revenue This Month</div>
                <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.green }}>₹{wholesaleWeeklyData.reduce((s, w) => s + w.revenue, 0).toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={wholesaleWeeklyData}>
              <CartesianGrid key="wsw-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="wsw-x" dataKey="week" tick={{ fontFamily: F.mono, fontSize: 11, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="wsw-y" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} width={30} />
              <Tooltip key="wsw-tip" content={<WholesaleWeeklyTooltip />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="wsw-bar" dataKey="sarees" name="Sarees Dispatched" fill={T.royalBurgundy} radius={[6, 6, 0, 0] as any} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
        <ChartCard title="Wholesale Revenue — Last 6 Months" sub="Monthly invoiced amount">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wsMonthlyRev}>
              <CartesianGrid key="ws-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="ws-x" dataKey="month" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="ws-y" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`} width={42} />
              <Tooltip key="ws-tip" content={<ChartTip prefix="₹" />} />
              <Bar key="ws-rev" dataKey="rev" name="Revenue">
                {wsMonthlyRev.map(e => <Cell key={`ws-cell-${e.month}`} fill={e.month === "May" ? T.antiqueGold : "rgba(200,155,71,0.38)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="How Much Each Customer Still Owes" sub="Outstanding balance per customer">
          <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "8px 0" }}>
            {wsOutstanding.map((d, i) => (
              <div key={d.customer}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.luxuryBrown }}>{d.customer}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: d.color }}>{d.amt === 0 ? "Paid ✓" : `₹${d.amt.toLocaleString("en-IN")}`}</span>
                </div>
                <AnimBar pct={d.amt === 0 ? 100 : Math.round((d.amt / 500000) * 100)} color={d.color} height={6} delay={i * 0.06} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Invoice Status This Period" sub="May 2026 invoices">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie key="ws-inv-pie" data={wsInvStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none" paddingAngle={3}>
                {wsInvStatus.map(e => <Cell key={`ws-inv-cell-${e.name}`} fill={e.color} />)}
              </Pie>
              <Tooltip key="ws-inv-tip" formatter={(v: any, n: any) => [`${v} invoices`, n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 8px" }}>
            {wsInvStatus.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<ReceiptText size={22} color={T.royalBurgundy} />} label="Total Invoices Raised" value="12 invoices" sub="May 2026" />
        <SumCard icon={<Banknote size={22} color={T.royalBurgundy} />} label="Total Invoiced Amount" value="₹28,40,000" sub="Across all customers" />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Total Collected" value="₹18,60,000" sub="Payments received" greenHi />
        <SumCard icon={<BellRing size={22} color={T.crimson} />} label="Total Outstanding" value="₹9,80,000" sub="Yet to be collected" crimsonHi />
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={TH}>Bulk Order Ref</th><th style={TH}>Customer Name</th>
                  <th style={{ ...TH, textAlign: "center" }}>Sarees</th>
                  <th style={{ ...TH, textAlign: "right" }}>Invoice Amount</th><th style={{ ...TH, textAlign: "right" }}>Collected</th>
                  <th style={{ ...TH, textAlign: "right" }}>Balance Due</th><th style={TH}>Dispatch Date</th>
                  <th style={{ ...TH, textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bulkOrders.map((o, i) => {
                  const invoiceAmt = o.amountDue ?? 0;
                  const collected = o.amountPaid ?? 0;
                  const balance = invoiceAmt - collected;
                  const statusColor = o.paymentStatus === "paid" ? T.green : o.paymentStatus === "partial" ? T.antiqueGold : T.crimson;
                  return (
                    <tr key={o.ref} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${statusColor}` }}>
                      <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{o.ref}</span></td>
                      <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{o.customer}</span></td>
                      <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{o.total}</td>
                      <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700 }}>{invoiceAmt > 0 ? `₹${invoiceAmt.toLocaleString("en-IN")}` : "—"}</td>
                      <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.green, fontWeight: 600 }}>{collected > 0 ? `₹${collected.toLocaleString("en-IN")}` : "—"}</td>
                      <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: balance <= 0 ? T.green : T.crimson }}>{balance > 0 ? `₹${balance.toLocaleString("en-IN")}` : "— Paid"}</td>
                      <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11.5 }}>{o.dispatchDate || "—"}</span></td>
                      <td style={{ ...TD, textAlign: "center" }}>
                        <StatusPill label={o.paymentStatus === "paid" ? "✓ Paid" : o.paymentStatus === "partial" ? "◑ Partial" : "⚠ Pending"} type={o.paymentStatus === "paid" ? "ok" : o.paymentStatus === "partial" ? "warn" : "bad"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePager total={bulkOrders.length} showing={bulkOrders.length} />
        </div>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 6 — PROFIT & LOSS REPORT
// ══════════════════════════════════════════════════════════════════════════════
const pnlMonthlyData = [
  { month: "Dec", income: 1820000, expenses: 980000 },
  { month: "Jan", income: 2140000, expenses: 1060000 },
  { month: "Feb", income: 2380000, expenses: 1140000 },
  { month: "Mar", income: 2450000, expenses: 1200000 },
  { month: "Apr", income: 2680000, expenses: 1240000 },
  { month: "May", income: 3260000, expenses: 1280000 },
];
const expenseDonut = [
  { name: "Weaver Making Charges", value: 420000, color: T.royalBurgundy },
  { name: "Vendor Raw Material",   value: 860000, color: T.antiqueGold },
];

function ProfitLossReport() {
  const { firms, financials } = useFirms();
  const ledgerLabelStyle: React.CSSProperties = { fontFamily: F.ui, fontSize: 14, color: T.taupe, padding: "11px 20px" };
  const ledgerAmtStyle: React.CSSProperties = { fontFamily: F.mono, fontSize: 14, fontWeight: 700, padding: "11px 20px", textAlign: "right" as const };

  const hasData = financials.some(f => f.income.length > 0 || f.expenses.length > 0 || f.misc.length > 0);

  const sumIncomeByCategory = (cat: string) =>
    financials.reduce((s, f) => s + f.income.filter(e => e.category === cat).reduce((a, e) => a + e.amount, 0), 0);
  const sumExpenseByCategory = (cat: string) =>
    financials.reduce((s, f) => s + f.expenses.filter(e => e.category === cat).reduce((a, e) => a + e.amount, 0), 0);
  const sumMiscByType = (type: "income" | "expense") =>
    financials.reduce((s, f) => s + f.misc.filter(m => m.type === type).reduce((a, m) => a + m.amount, 0), 0);

  const wholesaleSales = sumIncomeByCategory("Wholesale Sale");
  const retailSales = sumIncomeByCategory("Retail Sale");
  const otherIncome = sumIncomeByCategory("Other") + sumMiscByType("income");
  const totalIncome = wholesaleSales + retailSales + otherIncome;

  const weaverPayments = sumExpenseByCategory("Weaver Payments");
  const materialPurchases = sumExpenseByCategory("Material Purchase");
  const shopMaintenance = sumExpenseByCategory("Shop Maintenance");
  const factoryMaintenance = sumExpenseByCategory("Factory Maintenance");
  const salaries = sumExpenseByCategory("Salaries");
  const otherExpenses = sumExpenseByCategory("Other") + sumMiscByType("expense");
  const totalExpenses = weaverPayments + materialPurchases + shopMaintenance + factoryMaintenance + salaries + otherExpenses;

  const netProfit = totalIncome - totalExpenses;

  const perFirm = firms.map(firm => {
    const fin = financials.find(f => f.firmId === firm.id) ?? { income: [], expenses: [], misc: [] };
    const income = fin.income.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "income").reduce((s, m) => s + m.amount, 0);
    const expenses = fin.expenses.reduce((s, e) => s + e.amount, 0) + fin.misc.filter(m => m.type === "expense").reduce((s, m) => s + m.amount, 0);
    return { name: firm.firmName, income, expenses, net: income - expenses };
  });

  return (
    <div id="rep-pnl" style={{ padding: "32px 40px" }}>
      <TabTitle title="Profit & Loss Report"
        sub="A complete picture of the firm's income and expenses. See how much money came in from sales, how much went out to weavers and vendors, and what was left as profit." />
      <ReportDLBar />

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 28 }}>
        <ChartCard title="Income vs Expenses — Last 6 Months" sub="Green = income · Crimson = expenses">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pnlMonthlyData} barGap={6}>
              <CartesianGrid key="pnl-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="pnl-x" dataKey="month" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="pnl-y" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`} width={42} />
              <Tooltip key="pnl-tip" content={<ChartTip prefix="₹" />} />
              <Bar key="pnl-income"   dataKey="income"   name="Income"   fill={T.green}  radius={[4,4,0,0] as any} />
              <Bar key="pnl-expenses" dataKey="expenses" name="Expenses" fill={T.crimson} radius={[4,4,0,0] as any} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Where Did the Money Go" sub="Expense breakdown — May 2026">
          <div style={{ position: "relative" }}>
            <PieChart width={200} height={160}>
              <Pie key="exp-pie" data={expenseDonut} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" stroke="none" paddingAngle={3}>
                {expenseDonut.map(e => <Cell key={`exp-cell-${e.name}`} fill={e.color} />)}
              </Pie>
              <Tooltip key="exp-tip" formatter={(v: any, n: any) => [`₹${Number(v).toLocaleString("en-IN")}`, n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px" }}>
            {expenseDonut.map(d => (
              <div key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                    <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{d.name}</span>
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: d.color }}>₹{(d.value / 100000).toFixed(1)}L</span>
                </div>
                <AnimBar pct={Math.round((d.value / 1280000) * 100)} color={d.color} height={5} />
              </div>
            ))}
            <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.crimson, textAlign: "right", marginTop: 4 }}>Total: ₹12,80,000</div>
          </div>
        </ChartCard>
      </div>

      {/* P&L Ledger — live from FirmsContext */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
            <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600, color: T.luxuryBrown }}>Profit & Loss Summary — All Firms</div>
          </div>

          {!hasData && (
            <div style={{ padding: "14px 24px", background: "rgba(200,155,71,0.08)", borderBottom: `1px solid ${T.borderGold}`, fontFamily: F.ui, fontSize: 13, color: "#7B5C18" }}>
              No income or expense entries yet. Add entries in the Firms page to see data here.
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            {/* INCOME */}
            <tbody>
              <tr style={{ background: T.greenBg }}>
                <td colSpan={2} style={{ padding: "10px 20px", fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "1.5px" }}>▼ INCOME</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(30,102,64,0.10)` }}>
                <td style={ledgerLabelStyle}>Wholesale Sales</td>
                <td style={{ ...ledgerAmtStyle, color: T.green }}>₹{wholesaleSales.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(30,102,64,0.10)` }}>
                <td style={ledgerLabelStyle}>Retail Sales</td>
                <td style={{ ...ledgerAmtStyle, color: T.green }}>₹{retailSales.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(30,102,64,0.10)` }}>
                <td style={ledgerLabelStyle}>Other Income</td>
                <td style={{ ...ledgerAmtStyle, color: T.green }}>₹{otherIncome.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ background: T.greenBg, borderBottom: `2px solid rgba(30,102,64,0.20)` }}>
                <td style={{ ...ledgerLabelStyle, fontFamily: F.ui, fontWeight: 700, color: T.green }}>Total Income</td>
                <td style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.green, padding: "12px 20px", textAlign: "right" }}>₹{totalIncome.toLocaleString("en-IN")}</td>
              </tr>

              {/* EXPENSES */}
              <tr style={{ background: T.crimsonBg }}>
                <td colSpan={2} style={{ padding: "10px 20px", fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.crimson, textTransform: "uppercase", letterSpacing: "1.5px" }}>▼ EXPENSES</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Weaver Payments</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{weaverPayments.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Material Purchases</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{materialPurchases.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Shop Maintenance</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{shopMaintenance.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Factory Maintenance</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{factoryMaintenance.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Salaries</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{salaries.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ borderBottom: `1px solid rgba(192,57,43,0.10)` }}>
                <td style={ledgerLabelStyle}>Other Expenses</td>
                <td style={{ ...ledgerAmtStyle, color: T.crimson }}>₹{otherExpenses.toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ background: T.crimsonBg, borderBottom: `2px solid rgba(192,57,43,0.20)` }}>
                <td style={{ ...ledgerLabelStyle, fontFamily: F.ui, fontWeight: 700, color: T.crimson }}>Total Expenses</td>
                <td style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.crimson, padding: "12px 20px", textAlign: "right" }}>₹{totalExpenses.toLocaleString("en-IN")}</td>
              </tr>

              {/* NET PROFIT / LOSS */}
              <tr style={{ background: "rgba(200,155,71,0.12)", borderBottom: `2px solid rgba(200,155,71,0.30)` }}>
                <td style={{ ...ledgerLabelStyle, fontFamily: F.display, fontSize: 20, fontWeight: 700, color: netProfit >= 0 ? T.antiqueGold : T.crimson }}>{netProfit >= 0 ? "Net Profit" : "Net Loss"}</td>
                <td style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, color: netProfit >= 0 ? T.antiqueGold : T.crimson, padding: "16px 20px", textAlign: "right" }}>₹{Math.abs(netProfit).toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ padding: "12px 20px", background: "rgba(200,155,71,0.06)", borderTop: `1px solid ${T.borderGold}`, display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={13} color={T.antiqueGold} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Download this report as PDF for your monthly records and year-end accounting.</span>
            <button style={{ marginLeft: "auto", padding: "6px 14px", background: T.royalBurgundy, border: "none", borderRadius: 7, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>Download PDF</button>
          </div>
        </div>
      </FadeUp>

      {/* Per-firm breakdown */}
      <FadeUp>
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 12 }}>Per-Firm Breakdown</div>
          <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Firm Name</th>
                  <th style={{ ...TH, textAlign: "right" }}>Total Income</th>
                  <th style={{ ...TH, textAlign: "right" }}>Total Expenses</th>
                  <th style={{ ...TH, textAlign: "right" }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {perFirm.map((f, i) => (
                  <tr key={f.name} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${f.net >= 0 ? T.green : T.crimson}` }}>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{f.name}</span></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.green, fontWeight: 600 }}>₹{f.income.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.crimson, fontWeight: 600 }}>₹{f.expenses.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.display, fontSize: 15, fontWeight: 700, color: f.net >= 0 ? T.green : T.crimson }}>{f.net >= 0 ? "₹" : "−₹"}{Math.abs(f.net).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 7 — CUSTOMER REPORT
// ══════════════════════════════════════════════════════════════════════════════
const topCustomers = [
  { name: "Meenakshi Silks",        total: 840000 },
  { name: "Kalavathi Exports",      total: 660000 },
  { name: "Lakshmi Silks",          total: 900000 },
  { name: "Padmavathi Textiles",    total: 600000 },
  { name: "Vijaya Silk House",      total: 280000 },
];
const custMonthly = [
  { month: "Jan", newC: 8,  ret: 22 },
  { month: "Feb", newC: 11, ret: 24 },
  { month: "Mar", newC: 9,  ret: 26 },
  { month: "Apr", newC: 14, ret: 28 },
  { month: "May", newC: 12, ret: 26 },
];
const custSplitDonut = [
  { name: "Wholesale",  value: 2840000, color: T.royalBurgundy },
  { name: "Retail",     value: 420000,  color: T.antiqueGold },
];
const custRows = [
  { name: "Lakshmi Silks",          type: "Wholesale", phone: "9412345678", purchases: 8,   spend: 9000000,  due: 0,      lastPurchase: "08 Apr 2026", status: "Active" },
  { name: "Padmavathi Textiles",    type: "Wholesale", phone: "9823456789", purchases: 5,   spend: 3000000,  due: 135000, lastPurchase: "05 Apr 2026", status: "Overdue" },
  { name: "Vijaya Silk House",      type: "Wholesale", phone: "9712345678", purchases: 3,   spend: 840000,   due: 0,      lastPurchase: "10 Apr 2026", status: "Active" },
  { name: "Meenakshi Silks",        type: "Wholesale", phone: "9534567890", purchases: 12,  spend: 5040000,  due: 420000, lastPurchase: "15 Apr 2026", status: "Active" },
  { name: "Kalavathi Exports",      type: "Wholesale", phone: "9645678901", purchases: 6,   spend: 3960000,  due: 45600,  lastPurchase: "18 Apr 2026", status: "Overdue" },
  { name: "Priya Sharma",           type: "Retail",    phone: "9845678901", purchases: 3,   spend: 28500,    due: 0,      lastPurchase: "27 May 2026", status: "Active" },
  { name: "Rekha Patel",            type: "Retail",    phone: "9712345678", purchases: 2,   spend: 26500,    due: 0,      lastPurchase: "25 May 2026", status: "Active" },
  { name: "Anita Verma",            type: "Retail",    phone: "9823456789", purchases: 4,   spend: 41000,    due: 0,      lastPurchase: "22 May 2026", status: "Active" },
];

function downloadCustomerData(r: typeof custRows[0]) {
  const rows: string[][] = [
    ["Field", "Value"],
    ["Name", r.name],
    ["Type", r.type],
    ["Phone", r.phone],
    ["Total Purchases", String(r.purchases)],
    ["Total Spend (₹)", String(r.spend)],
    ["Outstanding Due (₹)", String(r.due)],
    ["Last Purchase Date", r.lastPurchase],
    ["Status", r.status],
  ];
  const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${r.name.replace(/\s+/g, "_")}_customer_data.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function CustomerReport() {
  const [filter, setFilter] = useState("All Customers");
  const filters = ["All Customers", "Retail Only", "Wholesale Only", "Has Outstanding Dues", "No Purchases This Month"];
  return (
    <div id="rep-customers" style={{ padding: "32px 40px" }}>
      <TabTitle title="Customer Report"
        sub="See all retail and wholesale customers — their purchase history, total spend, frequency of buying, and any outstanding dues. Find your best customers and track who owes money." />
      <ReportDLBar />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
        <ChartCard title="Top Customers by Total Purchase Value" sub="All-time wholesale + retail combined">
          <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "8px 0" }}>
            {[...topCustomers].sort((a, b) => b.total - a.total).map((c, i) => (
              <div key={c.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.luxuryBrown }}>{c.name}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.antiqueGold }}>₹{(c.total / 100000).toFixed(1)}L</span>
                </div>
                <AnimBar pct={Math.round((c.total / 900000) * 100)} color={T.antiqueGold} height={7} delay={i * 0.07} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="New vs Returning Customers Each Month" sub="Last 5 months">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={custMonthly} barGap={4}>
              <CartesianGrid key="cust-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="cust-x" dataKey="month" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="cust-y" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} width={28} />
              <Tooltip key="cust-tip" content={<ChartTip suffix=" customers" />} />
              <Bar key="cust-new" dataKey="newC" name="New"      fill={T.royalBurgundy} radius={[4,4,0,0] as any} />
              <Bar key="cust-ret" dataKey="ret"  name="Returning" fill={T.antiqueGold}   radius={[4,4,0,0] as any} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Retail vs Wholesale Revenue Split" sub="Revenue contribution — May 2026">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie key="cust-split-pie" data={custSplitDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none" paddingAngle={3}>
                {custSplitDonut.map(e => <Cell key={`cust-cell-${e.name}`} fill={e.color} />)}
              </Pie>
              <Tooltip key="cust-split-tip" formatter={(v: any, n: any) => [`₹${Number(v).toLocaleString("en-IN")}`, n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "0 8px" }}>
            {custSplitDonut.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: d.color }}>₹{(d.value / 100000).toFixed(1)}L</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 22, alignItems: "stretch" }}>
        <SumCard icon={<UsersRound size={22} color={T.royalBurgundy} />} label="Total Customers (All Time)" value="284 customers" sub="Retail + wholesale" />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Active This Month" value="38 customers" sub="Made a purchase" greenHi />
        <SumCard icon={<TrendingUp size={22} color={T.antiqueGold} />} label="New This Month" value="12 customers" sub="First time buyers" hi />
        <SumCard icon={<ShieldAlert size={22} color={T.crimson} />} label="Customers with Dues" value="14 customers" sub="Outstanding balance" crimsonHi />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "6px 13px", borderRadius: 20, border: `1.5px solid ${filter === f ? T.royalBurgundy : T.borderDef}`, background: filter === f ? T.royalBurgundy : "#fff", color: filter === f ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: "pointer" }}>
            {f}
          </button>
        ))}
        <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
          <input placeholder="Search by customer name or phone number..." style={{ width: "100%", height: 36, padding: "0 10px 0 30px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" as const }} />
        </div>
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={TH}>Customer Name</th>
                  <th style={{ ...TH, textAlign: "center" }}>Type</th>
                  <th style={TH}>Phone</th>
                  <th style={{ ...TH, textAlign: "center" }}>Total Purchases</th>
                  <th style={{ ...TH, textAlign: "right" }}>Total Spend</th>
                  <th style={{ ...TH, textAlign: "right" }}>Outstanding Due</th>
                  <th style={TH}>Last Purchase</th>
                  <th style={{ ...TH, textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {custRows.map((r, i) => (
                  <tr key={r.name} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream }}>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.name}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <StatusPill label={r.type} type={r.type === "Wholesale" ? "neutral" : "gold"} />
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>{r.phone}</span></td>
                    <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{r.purchases}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700 }}>₹{r.spend.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: r.due > 0 ? T.crimson : T.green }}>
                      {r.due > 0 ? `₹${r.due.toLocaleString("en-IN")}` : "— Nil"}
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>{r.lastPurchase}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <StatusPill label={r.status} type={r.status === "Active" ? "ok" : "bad"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePager total={284} showing={8} />
        </div>
      </FadeUp>

      {/* Individual customer cards — with per-customer download */}
      <FadeUp>
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 12 }}>Customer Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {custRows.map(r => (
              <div key={r.name} style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(74,6,27,0.06)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{r.name}</div>
                  <StatusPill label={r.type} type={r.type === "Wholesale" ? "neutral" : "gold"} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {r.type === "Wholesale" ? (
                    <>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>City: <span style={{ color: T.luxuryBrown }}>—</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Address: <span style={{ color: T.luxuryBrown }}>—</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Phone: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>{r.phone}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>GST Code: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>—</span></div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Phone: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>{r.phone}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Total Purchases: <span style={{ fontFamily: F.mono, color: T.luxuryBrown, fontWeight: 700 }}>{r.purchases}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Last Purchase: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>{r.lastPurchase}</span></div>
                    </>
                  )}
                </div>
                <button onClick={() => downloadCustomerData(r)}
                  style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "rgba(110,15,45,0.05)", border: `1px solid ${T.borderDef}`, borderRadius: 8, fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.royalBurgundy, cursor: "pointer" }}>
                  ↓ Download Data
                </button>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 8 — OVERDUE & ALERTS REPORT
// ══════════════════════════════════════════════════════════════════════════════
const overdueCustomers = [
  { customer: "Padmavathi Textiles",    inv: "INV-2026-038", total: 600000,  paid: 465000, overdue: 135000, dueDate: "25 Apr 2026", days: 5,  lastReminder: "20 May 2026" },
  { customer: "Narayana Silk Emporium", inv: "INV-2026-032", total: 300000,  paid: 254400, overdue: 45600,  dueDate: "20 Apr 2026", days: 3,  lastReminder: "19 May 2026" },
  { customer: "Kalavathi Exports",      inv: "INV-2026-027", total: 660000,  paid: 614400, overdue: 45600,  dueDate: "02 May 2026", days: 2,  lastReminder: "21 May 2026" },
];
const lowStockMaterials = [
  { type: "Resham", sub: "Blue",   batch: "RSH-B-022", current: 0, minimum: 5, shortage: 5, lastOrder: "Natraj Traders" },
  { type: "Resham", sub: "Maroon", batch: "RSH-M-018", current: 0, minimum: 5, shortage: 5, lastOrder: "Natraj Traders" },
  { type: "Resham", sub: "Cream",  batch: "RSH-C-019", current: 0, minimum: 4, shortage: 4, lastOrder: "Kumar Silks"    },
];
const lateWeavers = [
  { name: "Anand K.",  code: "WV-005", batch: "BK-2026-03", expected: "20 May 2026", days: 11, done: 5, remaining: 2 },
  { name: "Meena R.",  code: "WV-012", batch: "BK-2026-05", expected: "22 May 2026", days: 9,  done: 4, remaining: 1 },
];
const bulkOrders = [
  { customer: "Meenakshi Silks",  order: "BO-2026-01", ordered: 20, produced: 12, shortage: 8, deadline: "15 Jun 2026", daysLeft: 14, status: "At Risk"  },
  { customer: "Lakshmi Silks",    order: "BO-2026-02", ordered: 15, produced: 8,  shortage: 7, deadline: "10 Jun 2026", daysLeft: 9,  status: "At Risk"  },
];

function SubAlert({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <AlertTriangle size={16} style={{ color, flexShrink: 0 }} />
      <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

function OverdueAlertsReport() {
  return (
    <div id="rep-overdue" style={{ padding: "32px 40px" }}>
      <TabTitle title="Overdue & Alerts Report"
        sub="Everything that needs urgent attention — overdue customer payments, low raw material stock, weavers running late, and bulk orders at risk. This report is generated fresh every day." />

      <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "10px 16px", marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
        <Clock size={14} color={T.antiqueGold} />
        <span style={{ fontFamily: F.ui, fontSize: 12.5, color: "#7B5C18" }}>This report always shows today's live status. Period filter does not apply.</span>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: T.antiqueGold, marginLeft: "auto" }}>Live as of 01 Jun 2026 · 9:00 AM</span>
      </div>

      {/* 4 alert cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32, alignItems: "stretch" }}>
        <SumCard icon={<BellRing size={22} color={T.crimson} />} label="Customer Invoices Overdue" value="3 invoices" sub="Immediate follow-up needed" crimsonHi />
        <SumCard icon={<Boxes size={22} color={T.antiqueGold} />} label="Raw Material Running Low" value="3 items" sub="Place purchase orders now" hi />
        <SumCard icon={<Clock size={22} color={T.crimson} />} label="Weavers Running Behind Schedule" value="2 weavers" sub="Batches delayed" crimsonHi />
        <SumCard icon={<ShieldAlert size={22} color={T.antiqueGold} />} label="Bulk Orders at Risk" value="2 orders" sub="May miss deadline" hi />
      </div>

      {/* Overdue customers */}
      <FadeUp>
        <SubAlert label="Overdue Customer Payments — Act Now" color={T.crimson} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={TH}>Customer Name</th><th style={TH}>Invoice No.</th>
                  <th style={{ ...TH, textAlign: "right" }}>Invoice Amount</th><th style={{ ...TH, textAlign: "right" }}>Amount Paid</th>
                  <th style={{ ...TH, textAlign: "right" }}>Amount Overdue</th><th style={TH}>Due Date</th>
                  <th style={{ ...TH, textAlign: "center" }}>Days Overdue</th><th style={TH}>Last Reminder Sent</th>
                  <th style={{ ...TH, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {overdueCustomers.map((r, i) => (
                  <tr key={r.inv} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.crimson}` }}>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{r.inv}</span></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700 }}>₹{r.total.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.green }}>₹{r.paid.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>₹{r.overdue.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, color: T.crimson, fontWeight: 600 }}>{r.dueDate}</td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.crimson }}>{r.days}d overdue</span>
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{r.lastReminder}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <button style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: T.royalBurgundy, border: "none", borderRadius: 7, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>
                        <MessageSquare size={11} />Send WhatsApp Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>

      {/* Low stock */}
      <FadeUp>
        <SubAlert label="Materials Running Low — Order Soon" color={T.antiqueGold} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={TH}>Material Type</th><th style={TH}>Sub-type / Color / Grade</th>
                  <th style={TH}>Batch No.</th><th style={{ ...TH, textAlign: "right" }}>Current Stock</th>
                  <th style={{ ...TH, textAlign: "right" }}>Minimum Required</th><th style={{ ...TH, textAlign: "right" }}>Shortage</th>
                  <th style={TH}>Last Ordered From</th><th style={{ ...TH, textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockMaterials.map((r, i) => (
                  <tr key={r.batch} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.crimson}` }}>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{r.type}</span></td>
                    <td style={TD}>{r.sub}</td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{r.batch}</span></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.current} kg</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono }}>{r.minimum} kg</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.shortage} kg</td>
                    <td style={TD}><span style={{ color: T.taupe }}>{r.lastOrder}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <button style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: T.royalBurgundy, border: "none", borderRadius: 7, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>
                        <Package size={11} />Create Purchase Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>

      {/* Late weavers */}
      <FadeUp>
        <SubAlert label="Weavers Behind Schedule — Follow Up" color={T.crimson} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TH}>Weaver Name</th><th style={TH}>Code</th><th style={TH}>Batch No.</th>
                <th style={TH}>Expected End Date</th><th style={{ ...TH, textAlign: "center" }}>Days Overdue</th>
                <th style={{ ...TH, textAlign: "center" }}>Sarees Done</th><th style={{ ...TH, textAlign: "center" }}>Sarees Remaining</th>
                <th style={{ ...TH, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {lateWeavers.map((r, i) => (
                <tr key={r.code} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.crimson}` }}>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.name}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{r.code}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{r.batch}</span></td>
                  <td style={{ ...TD, color: T.crimson, fontWeight: 600 }}>{r.expected}</td>
                  <td style={{ ...TD, textAlign: "center" }}><span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.crimson }}>{r.days}d late</span></td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.green }}>{r.done}</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.remaining}</td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <button style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: T.royalBurgundy, border: "none", borderRadius: 7, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>
                      <MessageSquare size={11} />Send Message
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeUp>

      {/* Bulk orders at risk */}
      <FadeUp>
        <SubAlert label="Bulk Orders That May Miss Deadline" color={T.antiqueGold} />
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={TH}>Customer Name</th><th style={TH}>Order No.</th>
                <th style={{ ...TH, textAlign: "center" }}>Sarees Ordered</th><th style={{ ...TH, textAlign: "center" }}>Sarees Produced</th>
                <th style={{ ...TH, textAlign: "center" }}>Shortage</th><th style={TH}>Deadline</th>
                <th style={{ ...TH, textAlign: "center" }}>Days Remaining</th>
                <th style={{ ...TH, textAlign: "center" }}>Status</th><th style={{ ...TH, textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bulkOrders.map((r, i) => (
                <tr key={r.order} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.antiqueGold}` }}>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{r.order}</span></td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{r.ordered}</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.green }}>{r.produced}</td>
                  <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>{r.shortage}</td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11.5 }}>{r.deadline}</span></td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: r.daysLeft < 10 ? T.crimson : T.antiqueGold }}>{r.daysLeft} days</span>
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}><StatusPill label={r.status} type="bad" /></td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <button style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
                      <Eye size={11} />View Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — SCHEDULED REPORTS
// ══════════════════════════════════════════════════════════════════════════════
const SCHEDULES = [
  { title: "Monthly Weaver Payment Report", freq: "Every Month",  sendOn: "1st of every month · 9:00 AM",  to: "All Admin WhatsApp", format: ["PDF", "Excel"], lastSent: "01 May 2026 · 9:02 AM", active: true  },
  { title: "Weekly Production Summary",     freq: "Every Monday", sendOn: "Every Monday · 8:00 AM",       to: "All Admin WhatsApp", format: ["PDF"],          lastSent: "19 May 2026 · 8:01 AM", active: true  },
  { title: "Monthly Profit & Loss Report",  freq: "Every Month",  sendOn: "1st of every month · 10:00 AM", to: "All Admin WhatsApp", format: ["PDF"],          lastSent: "01 May 2026 · 10:02 AM",active: true  },
  { title: "Daily Overdue Alerts",          freq: "Every Day",    sendOn: "Every day · 8:30 AM",          to: "All Admin WhatsApp", format: ["PDF"],          lastSent: "Today · 8:30 AM",       active: true  },
  { title: "Monthly Customer Dues Report",  freq: "Every Month",  sendOn: "2nd of every month · 9:00 AM", to: "All Admin WhatsApp", format: ["PDF", "Excel"], lastSent: "02 May 2026 · 9:03 AM", active: true  },
];

function ScheduledReportsSection() {
  const [showForm, setShowForm] = useState(false);
  const [scheduleStates, setScheduleStates] = useState(SCHEDULES.map(s => s.active));

  const scheduleIcons: React.ReactNode[] = [
    <Users size={26} color={T.antiqueGold} />,
    <Scissors size={26} color={T.antiqueGold} />,
    <BarChart3 size={26} color={T.antiqueGold} />,
    <BellRing size={26} color={T.antiqueGold} />,
    <UsersRound size={26} color={T.antiqueGold} />,
  ];

  return (
    <div style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        <SectionHeader
          title="Scheduled Reports — Automatic Delivery"
          action={
            <button onClick={() => setShowForm(!showForm)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "transparent", border: `1px solid ${T.borderGold}`, borderRadius: 8, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.antiqueGold, cursor: "pointer" }}>
              <Plus size={14} />Add New Schedule →
            </button>
          }
        />
        <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "4px 0 22px 13px" }}>
          These reports are automatically generated and sent to admin on WhatsApp at the scheduled time. No manual action needed.
        </p>

        {/* Schedule cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 20, alignItems: "stretch" }}>
          {SCHEDULES.map((s, i) => (
            <div key={s.title} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Top color bar */}
              <div style={{ height: 5, background: scheduleStates[i] ? T.green : T.taupe }} />

              {/* Card content */}
              <div style={{ padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Header: icon + title */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                    {scheduleIcons[i]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.3, marginBottom: 7 }}>{s.title}</div>
                    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 99, background: "rgba(200,155,71,0.13)", color: T.antiqueGold, fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.4px" }}>{s.freq}</span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                    <span style={{ fontWeight: 700, color: T.luxuryBrown }}>Send on: </span>{s.sendOn}
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                    <span style={{ fontWeight: 700, color: T.luxuryBrown }}>Send to: </span>{s.to}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                    {s.format.map(f => (
                      <span key={f} style={{ padding: "3px 11px", borderRadius: 6, background: "rgba(110,15,45,0.07)", color: T.royalBurgundy, fontFamily: F.mono, fontSize: 12, fontWeight: 700 }}>{f}</span>
                    ))}
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                    <span style={{ fontWeight: 700, color: T.luxuryBrown }}>Last sent: </span>{s.lastSent}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: scheduleStates[i] ? T.green : T.taupe }} />
                    <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: scheduleStates[i] ? T.green : T.taupe }}>{scheduleStates[i] ? "Active" : "Paused"}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ padding: "0 22px 20px", display: "flex", gap: 8 }}>
                <button style={{ flex: 1, height: 42, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1px solid ${T.borderDef}`, borderRadius: 9, background: "#fff", fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                  <Pencil size={14} />Edit
                </button>
                <button onClick={() => setScheduleStates(prev => prev.map((v, j) => j === i ? !v : v))}
                  style={{ flex: 1, height: 42, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1px solid ${scheduleStates[i] ? "rgba(200,155,71,0.35)" : T.borderDef}`, borderRadius: 9, background: scheduleStates[i] ? "rgba(200,155,71,0.08)" : "#fff", fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: scheduleStates[i] ? T.antiqueGold : T.taupe, cursor: "pointer" }}>
                  {scheduleStates[i] ? <><Pause size={14} />Pause</> : <><Play size={14} />Resume</>}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Schedule form (collapsible) */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "24px 28px", marginBottom: 20, boxShadow: "0 4px 16px rgba(74,6,27,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown }}>Add New Schedule</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={T.taupe} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
              {[
                { label: "Select Report Type", type: "select", opts: ["Raw Material Report","Saree Production Report","Weaver Payment Report","Retail Sales Report","Wholesale Sales Report","Profit & Loss Report","Customer Report","Overdue & Alerts Report"] },
                { label: "Frequency",          type: "select", opts: ["Daily","Weekly","Monthly","Quarterly"] },
                { label: "Send On",            type: "select", opts: ["1st of month","2nd of month","Every Monday","Every week-start","Every day"] },
                { label: "Send Time",          type: "time" },
                { label: "Format",             type: "checks" },
                { label: "Period to Include",  type: "select", opts: ["Last 7 days","Last 30 days","This month","This quarter"] },
              ].map((f: any) => (
                <div key={f.label}>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>{f.label}</label>
                  {f.type === "select" ? (
                    <select style={{ width: "100%", height: 36, padding: "0 10px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: T.warmIvory, outline: "none" }}>
                      {f.opts.map((o: string) => <option key={o}>{o}</option>)}
                    </select>
                  ) : f.type === "time" ? (
                    <input type="time" defaultValue="09:00" style={{ width: "100%", height: 36, padding: "0 10px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.mono, fontSize: 12.5, color: T.luxuryBrown, background: T.warmIvory, outline: "none" }} />
                  ) : (
                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      {["PDF","Excel"].map(fmt => (
                        <label key={fmt} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, cursor: "pointer" }}>
                          <input type="checkbox" defaultChecked style={{ accentColor: T.royalBurgundy }} />{fmt}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, borderTop: `1px solid ${T.borderDef}`, paddingTop: 16 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 18px", border: `1px solid ${T.borderDef}`, borderRadius: 8, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
              <button style={{ padding: "8px 20px", background: T.royalBurgundy, border: "none", borderRadius: 8, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>💾 Save Schedule</button>
            </div>
          </motion.div>
        )}
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — DOWNLOAD HISTORY
// ══════════════════════════════════════════════════════════════════════════════
const DL_HISTORY = [
  { name: "Weaver Payment Report",   period: "May 2026",   generated: "22 May 2026", by: "Admin (RA)", format: "PDF + Excel" },
  { name: "Production Report",       period: "May 2026",   generated: "21 May 2026", by: "Admin (BK)", format: "PDF"        },
  { name: "Profit & Loss Report",    period: "April 2026", generated: "01 May 2026", by: "Admin (RA)", format: "PDF"        },
  { name: "Customer Dues Report",    period: "May 2026",   generated: "20 May 2026", by: "Admin (MK)", format: "Excel"      },
  { name: "Overdue Alerts",          period: "Today",      generated: "22 May 2026", by: "System Auto",format: "PDF"        },
  { name: "Raw Material Report",     period: "May 2026",   generated: "18 May 2026", by: "Admin (BK)", format: "PDF + Excel" },
  { name: "Wholesale Sales Report",  period: "Q1 2026",    generated: "01 Apr 2026", by: "Admin (RA)", format: "PDF"        },
  { name: "Weaver Payment Report",   period: "April 2026", generated: "01 May 2026", by: "System Auto",format: "PDF + Excel" },
  { name: "Production Report",       period: "April 2026", generated: "30 Apr 2026", by: "Admin (MK)", format: "PDF"        },
  { name: "Retail Sales Report",     period: "April 2026", generated: "30 Apr 2026", by: "Admin (BK)", format: "Excel"      },
];

function DownloadHistorySection() {
  const dlIconMap: Record<string, React.ReactNode> = {
    "Weaver Payment Report":  <Users size={24} color={T.antiqueGold} />,
    "Production Report":      <Scissors size={24} color={T.antiqueGold} />,
    "Profit & Loss Report":   <BarChart3 size={24} color={T.antiqueGold} />,
    "Customer Dues Report":   <UsersRound size={24} color={T.antiqueGold} />,
    "Overdue Alerts":         <BellRing size={24} color={T.antiqueGold} />,
    "Raw Material Report":    <Boxes size={24} color={T.antiqueGold} />,
    "Wholesale Sales Report": <Store size={24} color={T.antiqueGold} />,
    "Retail Sales Report":    <Tag size={24} color={T.antiqueGold} />,
  };

  return (
    <div style={{ padding: "36px 40px 40px" }}>
      <FadeUp>
        <SectionHeader
          title="Previously Downloaded Reports"
          action={
            <button style={{ background: "none", border: "none", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer", textDecoration: "underline" }}>
              Clear History →
            </button>
          }
        />
        <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "4px 0 22px 13px" }}>
          All reports that were generated and downloaded. Click Download Again to get any previous report without regenerating it.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, alignItems: "stretch" }}>
          {DL_HISTORY.map((r, i) => (
            <div key={i} style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 10px rgba(74,6,27,0.06)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Header: icon + report name */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 50, height: 50, minWidth: 50, borderRadius: 13, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.10)" }}>
                  {dlIconMap[r.name] ?? <FileText size={24} color={T.antiqueGold} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.3 }}>{r.name}</div>
                  <span style={{ display: "inline-block", marginTop: 4, fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{r.period}</span>
                </div>
              </div>

              {/* Details */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 32 }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, marginBottom: 2 }}>Generated On</div>
                    <div style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>{r.generated}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe, marginBottom: 2 }}>Generated By</div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{r.by}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                  {r.format.split(" + ").map(f => (
                    <span key={f} style={{ padding: "3px 11px", borderRadius: 6, background: "rgba(110,15,45,0.07)", color: T.royalBurgundy, fontFamily: F.mono, fontSize: 12, fontWeight: 700 }}>{f}</span>
                  ))}
                </div>
              </div>

              {/* Download button */}
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, height: 42, background: T.royalBurgundy, border: "none", borderRadius: 9, fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: "#FFFDF9", cursor: "pointer", width: "100%" }}>
                <Download size={15} />Download Again
              </button>
            </div>
          ))}
        </div>
      </FadeUp>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════════════════
const FOOTER_QL = [
  { icon: <LayoutDashboard size={13} />, label: "Dashboard" },
  { icon: <ShoppingCart size={13} />,   label: "Orders"     },
  { icon: <Scissors size={13} />,       label: "Weavers"    },
  { icon: <Factory size={13} />,        label: "Production" },
  { icon: <Package size={13} />,        label: "Materials"  },
  { icon: <CreditCard size={13} />,     label: "Payments"   },
  { icon: <BarChart2 size={13} />,      label: "Reports"    },
  { icon: <UserRound size={13} />,      label: "Customers"  },
];
const FOOTER_RPTS = ["Raw Material Report","Saree Production Report","Weaver Payments","Profit & Loss","Download History"];
const FOOTER_HELP = ["Help Center","Video Tutorials","Support Chat","Contact Support","Report an Issue"];
const FOOTER_COMM = ["Timely Settlements","100% Transparency","Heritage Since 1999","Traditional Excellence"];

function ReportsFooter() {
  return (
    <footer style={{ background: T.darkBurgundy, borderTop: "1px solid rgba(200,155,71,0.18)" }}>
      <div style={{ padding: "44px 40px 36px", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", gap: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", border: "2px solid rgba(200,155,71,0.35)", flexShrink: 0 }}>
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

        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>QUICK LINKS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FOOTER_QL.map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <span style={{ color: "rgba(200,155,71,0.55)" }}>{l.icon}</span>
                <span style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,253,249,0.60)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#FFFDF9")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,253,249,0.60)")}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>REPORT SHORTCUTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FOOTER_RPTS.map(l => (
              <span key={l} style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,253,249,0.60)", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#FFFDF9")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,253,249,0.60)")}>{l}</span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>NEED HELP</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FOOTER_HELP.map(l => (
              <span key={l} style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,253,249,0.60)", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#FFFDF9")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,253,249,0.60)")}>{l}</span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>OUR COMMITMENT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FOOTER_COMM.map(c => (
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

      <div style={{ borderTop: "1px solid rgba(200,155,71,0.12)", padding: "14px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.35)" }}>© 2026 Beers Keshara &amp; Brothers Silks. All rights reserved.</span>
        <span style={{ fontFamily: F.display, fontSize: 13, fontStyle: "italic", color: "rgba(200,155,71,0.55)" }}>Tradition · Promise · Trust · Quality Creates Legacy</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.35)" }}>Made with <span style={{ color: T.antiqueGold }}>♥</span> in India</span>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTabKey>("production");
  const [activePeriod, setActivePeriod] = useState("This Month");
  const [compareOn, setCompareOn] = useState(false);

  const TAB_CONTENT: Record<ReportTabKey, React.ReactNode> = {
    "raw-material":   <RawMaterialReport />,
    "production":     <SareeProductionReport />,
    "weaver-payment": <WeaverPaymentReport />,
    "retail":         <RetailSalesReport />,
    "wholesale":      <WholesaleSalesReport />,
    "pnl":            <ProfitLossReport />,
    "customers":      <CustomerReport />,
    "overdue":        <OverdueAlertsReport />,
  };

  return (
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100vh" }}>
      <ReportsHeader />
      <div style={{ paddingBottom: 36, background: T.silkCream }}>
        <ReportsStatsStrip />
      </div>
      <ReportTabNav
        activeTab={activeTab} setActiveTab={setActiveTab}
        activePeriod={activePeriod} setActivePeriod={setActivePeriod}
        compareOn={compareOn} setCompareOn={setCompareOn}
      />
      <div style={{ background: T.silkCream }}>
        {TAB_CONTENT[activeTab]}
        <ScheduledReportsSection />
        <DownloadHistorySection />
      </div>
      <ReportsFooter />
    </div>
  );
}
