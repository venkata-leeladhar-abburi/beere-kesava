import React, { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  Eye, Plus, Search, ChevronDown, LayoutGrid, LayoutList, AlignJustify,
  ChevronRight, Facebook, Instagram, Youtube, Linkedin, Phone, Mail,
  Download, UploadCloud, Calendar, Users, Receipt, CalendarClock,
  Shield,
} from "lucide-react";
import {
  Package, CalendarBlank, WarningCircle, CheckCircle, XCircle,
  Eye as PhEye, Palette, Users as PhUsers, Clock, ArrowRight,
  CurrencyInr, ShoppingBag, Plus as PhPlus, MagnifyingGlass, CaretDown as PhCaretDown,
  SquaresFour, ListDashes, List as PhList, CaretRight as PhCaretRight,
  ClipboardText, Hourglass, CheckFat, SealWarning, FileText,
  FloppyDisk, Printer, Scales, User as PhUser, Tag, Hash,
  ChartBar, FunnelSimple, Trophy, DownloadSimple,
  Swatches, Graph, UploadSimple, ImageSquare, PencilSimple, Stack,
} from "@phosphor-icons/react";
import { PieChart, Pie, Cell } from "recharts";

const imgHeaderBg = "https://images.unsplash.com/photo-1669556289350-0e2480fe190e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import { imgBKLogo as imgBKBLogo, imgSaree as imgSareeHero } from "../constants/weaverImages";
import { useBulkOrders } from "./BulkOrderContext";
import { BulkOrderCreateModal } from "./BulkOrderCreateModal";
import { useBatches, BatchRecord, SareeRow } from "./BatchContext";
import { useDesignLibrary } from "./DesignLibraryContext";
import { INVOICES } from "./PaymentsPage";
import { DesignCodeCard } from "./DesignLibraryPage";
import { SareeTypeCard, getSareeTypeByCode, getSareeTypeByName } from "./RatesPricingPage";
const imgSaree    = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgShowroom = "https://images.unsplash.com/photo-1756267318202-afebdffc107a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgWarp     = "https://images.unsplash.com/photo-1619239635762-8132f6dba51c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgResham   = "https://images.unsplash.com/photo-1542044211-723ee4dada2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const imgJari     = "https://images.unsplash.com/photo-1643766882273-335aae5a9309?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

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
  crimson:       "#C0392B",
  green:         "#1E6640",
  blueGray:      "#4A6B8A",
  darkFinish:    "#2C1810",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const G = {
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  card:   "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
};

// ── FadeUp helper ─────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE, delay }} style={style}>
      {children}
    </motion.div>
  );
}

// ── Weaver initials avatar ────────────────────────────────────────────────────
function Pip({ initials, bg, size = 26 }: { initials: string; bg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.55)" }}>
      <span style={{ fontFamily: F.ui, fontSize: size * 0.35, fontWeight: 700, color: "#FFFDF9", letterSpacing: "-0.3px" }}>{initials}</span>
    </div>
  );
}

// ── Clickable code helper (design code / saree type code) ────────────────────
type CodeCallbacks = { onDesignClick?: (code: string) => void; onSareeTypeClick?: (code: string) => void };
function ClickableCode({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  if (!onClick) return <span style={style}>{children}</span>;
  return (
    <motion.span
      onClick={onClick}
      whileHover={{ opacity: 0.68 }}
      style={{ ...style, cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(110,15,45,0.35)", textUnderlineOffset: 2 }}
    >
      {children}
    </motion.span>
  );
}
// Parses a "Name · CODE" combined saree-type string, returning the code half.
function parseSareeTypeCode(combined: string): string {
  const parts = combined.split("·").map(s => s.trim());
  return parts.length > 1 ? parts[parts.length - 1] : combined.trim();
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — PAGE HEADER
// ══════════════════════════════════════════════════════════════════════════════
const HEADER_CHIPS = [
  { value: "24",  label: "Active Batches",                 gold: false },
  { value: "186", label: "Sarees In Progress",             gold: false },
  { value: "32",  label: "Sarees Ready for Quality Check", gold: false },
  { value: "248", label: "Sarees Completed This Month",    gold: false },
  { value: "18",  label: "Sarees In Stock — Ready for Sale", gold: true  },
];
function PageHeader() {
  return (
    <header style={{ background: T.darkBurgundy, position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
      <div style={{ position: "relative", zIndex: 2, padding: "48px 0 90px 48px", flex: "0 0 65%", maxWidth: "65%" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>SINCE 1999 · PRODUCTION MANAGEMENT</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Production</h1>
          <span style={{ fontFamily: F.display, fontSize: 32, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Batch Overview</span>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.70)", margin: "0 0 20px", maxWidth: 600, lineHeight: 1.6 }}>
          See all active batches, track saree production at every stage, manage quality check, assign finishing work, and monitor bulk order progress — all in one place.
        </p>
      </div>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, ${T.darkBurgundy} 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
        <img src={imgSareeHero} alt="Banarasi silk saree" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
      </div>
    </header>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — STATS STRIP
// ══════════════════════════════════════════════════════════════════════════════
const STATS = [
  { label: "TOTAL BATCHES ACTIVE RIGHT NOW",    value: "24",  sub: "Across all weavers currently",       highlight: false, crimson: false, goldVal: false },
  { label: "SAREES BEING PRODUCED",             value: "186", sub: "In progress across all batches",      highlight: false, crimson: false, goldVal: false },
  { label: "SAREES COMPLETED THIS MONTH",       value: "248", sub: "↑ 14% more than last month",          highlight: true,  crimson: false, goldVal: true  },
  { label: "SAREES WAITING FOR QUALITY CHECK",  value: "32",  sub: "⚠ Need quality check today",          highlight: false, crimson: true,  goldVal: false },
];
function StatsStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      style={{ padding: `0 48px`, marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {STATS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20, backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09 }}
            whileHover={{ backgroundColor: m.highlight ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 22px",
              backgroundImage: m.highlight ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative",
              cursor: "pointer",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.highlight ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.crimson ? "#F47B72" : m.goldVal ? T.goldLight : T.warmIvory, lineHeight: 1.0, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
                {m.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.highlight ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                  {m.sub}
                </span>
              </div>
            </div>
            {m.highlight && <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — BULK ORDER PRODUCTION TRACKER
// ══════════════════════════════════════════════════════════════════════════════
type OrderStatus = "on-track" | "at-risk" | "overdue";
export interface BulkOrder {
  customer: string;
  ref: string;
  due: string;
  status: OrderStatus;
  daysLeft?: number;
  overdueBy?: number;
  sareeType: string;
  design: string;
  done: number;
  total: number;
  shortage?: number;
  instructions?: string;
  linkedBatches?: string[];
  createdDate?: string;
  customerId?: string;
  dispatchStatus?: "pending" | "dispatched" | "invoiced";
  dispatchDate?: string;
  invoiceId?: string;
  paymentStatus?: "pending" | "partial" | "paid";
  amountDue?: number;
  amountPaid?: number;
  photoUrls?: string[];
  talliedBy?: string;
}
export const BULK_ORDERS: BulkOrder[] = [
  { customer: "Lakshmi Silks",          ref: "ORD-2026-041", due: "28 May 2026", status: "on-track",              sareeType: "Self Brocade · SB-001",    design: "BKB-045", done: 76, total: 80,              paymentStatus: "partial", amountDue: 250000, amountPaid: 150000 },
  { customer: "Padmavathi Textiles",    ref: "ORD-2026-038", due: "25 May 2026", status: "at-risk",  daysLeft: 2,  sareeType: "Heavy Zari · HZ-003",      design: "BKB-031", done: 42, total: 60, shortage: 18, paymentStatus: "pending", amountDue: 180000, amountPaid: 0 },
  { customer: "Vijaya Silk House",      ref: "ORD-2026-035", due: "30 May 2026", status: "on-track",              sareeType: "Plain Silk · PS-002",       design: "BKB-022", done: 28, total: 30,              paymentStatus: "paid",    amountDue: 90000,  amountPaid: 90000 },
  { customer: "Narayana Silk Emporium", ref: "ORD-2026-032", due: "20 May 2026", status: "overdue",  overdueBy: 3, sareeType: "Bridal Special · BS-004",   design: "BKB-019", done: 18, total: 25, shortage: 7,  paymentStatus: "partial", amountDue: 350000, amountPaid: 200000 },
  { customer: "Meenakshi Silks",        ref: "ORD-2026-029", due: "05 Jun 2026", status: "on-track",              sareeType: "Self Brocade · SB-001",    design: "BKB-038", done: 15, total: 40,              paymentStatus: "pending", amountDue: 120000, amountPaid: 0 },
  { customer: "Kalavathi Exports",      ref: "ORD-2026-027", due: "02 Jun 2026", status: "on-track",              sareeType: "Heavy Zari · HZ-003",      design: "BKB-045", done: 8,  total: 35,              paymentStatus: "partial", amountDue: 450000, amountPaid: 100000 },
];
const ORDER_CFG: Record<OrderStatus, {
  strip: string; badgeBg: string; badgeColor: string;
  PhIcon: React.ElementType; iconBg: string; iconColor: string;
  barColor: string;
}> = {
  "on-track": { strip: T.green,       badgeBg: "rgba(30,102,64,0.10)",   badgeColor: T.green,       PhIcon: CheckCircle,   iconBg: "rgba(30,102,64,0.12)",   iconColor: T.green,       barColor: T.green       },
  "at-risk":  { strip: T.antiqueGold, badgeBg: "rgba(200,155,71,0.12)", badgeColor: "#8B6018",     PhIcon: WarningCircle, iconBg: "rgba(200,155,71,0.12)",  iconColor: T.antiqueGold, barColor: T.antiqueGold },
  "overdue":  { strip: T.crimson,     badgeBg: "rgba(192,57,43,0.10)",  badgeColor: T.crimson,     PhIcon: XCircle,       iconBg: "rgba(192,57,43,0.10)",   iconColor: T.crimson,     barColor: T.crimson     },
};
const STATUS_LABELS: Record<OrderStatus, (o: BulkOrder) => string> = {
  "on-track": () => "On Track",
  "at-risk":  o => `At Risk — ${o.daysLeft} day${o.daysLeft === 1 ? "" : "s"} left`,
  "overdue":  o => `Past Deadline — ${o.overdueBy} day${o.overdueBy === 1 ? "" : "s"} overdue`,
};

export function BulkOrderCard({ o, onView, onSlip, superadmin = false }: { o: BulkOrder; onView?: (o: BulkOrder) => void; onSlip?: (o: BulkOrder) => void; superadmin?: boolean }) {
  const cfg = ORDER_CFG[o.status];
  const pct = o.total > 0 ? Math.round((o.done / o.total) * 100) : 0;
  const remaining = o.total - o.done;
  const PhStatusIcon = cfg.PhIcon as React.ElementType;
  const [tallied, setTallied] = useState(!!o.talliedBy);
  const [talliedBy, setTalliedBy] = useState(o.talliedBy);

  const handleTally = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTallied(true);
    setTalliedBy("Admin User");
  };

  return (
    <motion.div
      onClick={() => onView?.(o)}
      whileHover={{ y: -6, scale: 1.008, boxShadow: "0 24px 60px rgba(110,15,45,0.12)" }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", cursor: "pointer" }}
    >
      {/* Status colour strip */}
      <div style={{ height: 5, background: cfg.strip, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: "22px 22px 16px", display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Status icon box */}
        <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <PhStatusIcon size={24} color={cfg.iconColor} weight="fill" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.2, marginBottom: 4 }}>{o.customer}</div>
          <div style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, letterSpacing: "0.3px" }}>{o.ref}</div>
        </div>
      </div>

      {/* Status badge */}
      <div style={{ margin: "0 22px 16px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: cfg.badgeBg, borderRadius: 10, padding: "9px 14px", width: "100%", boxSizing: "border-box" }}>
          <PhStatusIcon size={16} color={cfg.badgeColor} weight="fill" />
          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: cfg.badgeColor }}>{STATUS_LABELS[o.status](o)}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(110,15,45,0.07)", margin: "0 22px" }} />

      {/* Info rows */}
      <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 13, flex: 1 }}>

        {/* Due date */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CalendarBlank size={20} color={T.royalBurgundy} weight="regular" />
          </div>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.4px", marginBottom: 3 }}>Delivery Deadline</div>
            <div style={{ fontFamily: F.ui, fontSize: 15.5, fontWeight: 700, color: T.luxuryBrown }}>{o.due}</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(110,15,45,0.07)" }} />

        {/* Progress */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <span style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>{o.done}</span>
              <span style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, marginLeft: 6 }}>of {o.total} sarees done</span>
            </div>
            <span style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: cfg.barColor }}>{pct}%</span>
          </div>
          <div style={{ height: 9, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ height: "100%", background: cfg.barColor, borderRadius: 99 }}
            />
          </div>
          {remaining > 0 && (
            <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>{remaining} more sarees needed to complete</div>
          )}
        </div>

        {/* Alert banners */}
        {o.shortage && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 10, padding: "10px 13px" }}>
            <WarningCircle size={17} color={T.crimson} weight="fill" />
            <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.crimson }}>Shortage: {o.shortage} sarees</span>
          </div>
        )}
        {o.overdueBy && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.20)", borderRadius: 10, padding: "10px 13px" }}>
            <Clock size={17} color={T.crimson} weight="fill" />
            <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.crimson }}>Overdue by {o.overdueBy} day{o.overdueBy === 1 ? "" : "s"}</span>
          </div>
        )}

        {/* Estimated value */}
        {(o.amountDue ?? 0) > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(200,155,71,0.07)", borderRadius: 10, padding: "10px 13px", marginTop: "auto" }}>
            <CurrencyInr size={16} color={T.antiqueGold} weight="bold" />
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px" }}>Est. Order Value</span>
            <span style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.antiqueGold, marginLeft: "auto" }}>₹{(o.amountDue ?? 0).toLocaleString("en-IN")}</span>
          </div>
        )}

        {/* Tally Badge for Super Admin */}
        {superadmin && tallied && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(30,102,64,0.07)", border: "1px solid rgba(30,102,64,0.20)", borderRadius: 10, padding: "10px 13px", marginTop: "auto" }}>
            <CheckCircle size={16} color={T.green} weight="fill" />
            <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.green }}>Tallied by {talliedBy}</span>
          </div>
        )}

      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(110,15,45,0.07)", margin: "0 22px" }} />

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, padding: "16px 22px 22px" }}>
        <motion.button
          onClick={(e) => { e.stopPropagation(); onView?.(o); }}
          whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.10)" }}
          whileTap={{ scale: 0.97 }}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 12, padding: "12px 10px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          <PhEye size={18} weight="regular" /> View Order
        </motion.button>
        <motion.button
          onClick={(e) => { e.stopPropagation(); onSlip?.(o); }}
          whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.10)" }}
          whileTap={{ scale: 0.97 }}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 12, padding: "12px 10px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          <CurrencyInr size={18} weight="regular" /> Payment
        </motion.button>
        {!superadmin && !tallied && (
          <motion.button
            onClick={handleTally}
            whileHover={{ scale: 1.02, background: "rgba(30,102,64,0.10)" }}
            whileTap={{ scale: 0.97 }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(30,102,64,0.05)", color: T.green, border: `1.5px solid rgba(30,102,64,0.18)`, borderRadius: 12, padding: "12px 10px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            <CheckCircle size={18} weight="regular" /> Tally
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function BulkOrdersSection({ onNavigate, superadmin = false }: { onNavigate?: (tab: string) => void; superadmin?: boolean }) {
  const [dialog, setDialog] = useState<{ mode: "view" | "slip"; order: BulkOrder } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const { bulkOrders, addBulkOrder, nextOrderRef } = useBulkOrders();
  const atRiskCount = bulkOrders.filter(o => o.status === "at-risk" || o.status === "overdue").length;
  return (
    <div id="prod-bulk-orders" style={{ padding: "36px 48px 0" }}>
      <FadeUp>
        {/* Section wrapper */}
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>

          {/* Dark header bar */}
          <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShoppingBag size={26} color="#FFFDF9" weight="fill" />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: "#FFFDF9", letterSpacing: "-0.2px" }}>Bulk Orders — Production Progress</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>Track wholesale customer orders and delivery deadlines</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <motion.button onClick={() => setShowCreate(true)} whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, background: T.antiqueGold, color: T.luxuryBrown, border: "none", borderRadius: 10, padding: "9px 18px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                <PhPlus size={15} weight="bold" /> Add Bulk Order
              </motion.button>
              <motion.button onClick={() => onNavigate?.("AllOrders")} whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,253,249,0.12)", color: "#FFFDF9", border: "1px solid rgba(255,253,249,0.22)", borderRadius: 10, padding: "9px 18px", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                View All Orders <ArrowRight size={15} weight="bold" />
              </motion.button>
            </div>
          </div>

          {/* Success strip */}
          <AnimatePresence>
            {successRef && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ margin: "16px 28px 0", display: "flex", alignItems: "center", gap: 12, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.25)", borderLeft: `4px solid ${T.green}`, borderRadius: 12, padding: "13px 18px" }}>
                <CheckCircle size={18} color={T.green} weight="fill" />
                <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.green, flex: 1 }}>
                  Bulk Order {successRef} created. Production teams have been notified.
                </span>
                <button onClick={() => setSuccessRef(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.green, padding: 0 }}>×</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Warning banner */}
          {atRiskCount > 0 && (
            <div style={{ margin: "20px 28px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(200,155,71,0.09)", border: "1px solid rgba(200,155,71,0.28)", borderLeft: `4px solid ${T.antiqueGold}`, borderRadius: 12, padding: "14px 18px" }}>
                <WarningCircle size={20} color={T.antiqueGold} weight="fill" />
                <span style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: "#8B6018" }}>{atRiskCount} bulk order{atRiskCount > 1 ? "s are" : " is"} at risk of missing their deadline. Check the orders below and take action.</span>
              </div>
            </div>
          )}

          {/* Cards grid — 3 columns, equal height */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, padding: "20px 28px 28px", alignItems: "stretch" }}>
            {bulkOrders.map((o, i) => (
              <FadeUp key={o.ref} delay={i * 0.07} style={{ height: "100%" }}>
                <BulkOrderCard o={o} superadmin={superadmin} onView={(order) => setDialog({ mode: "view", order })} onSlip={(order) => setDialog({ mode: "slip", order })} />
              </FadeUp>
            ))}
          </div>

        </div>
      </FadeUp>
      <AnimatePresence>{dialog && <ProductionDialog open={!!dialog} title={dialog.mode === "view" ? "Order Details" : "Payment Details"} onClose={() => setDialog(null)}><OrderDialogContent order={dialog.order} mode={dialog.mode} /></ProductionDialog>}</AnimatePresence>
      <BulkOrderCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        nextRef={nextOrderRef}
        onSubmit={(order) => { addBulkOrder(order); setSuccessRef(order.ref); setShowCreate(false); }}
        onAddCustomerClick={() => onNavigate?.("Customers")}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — ACTIVE BATCHES
// ══════════════════════════════════════════════════════════════════════════════
type BatchStage = "weaving" | "submitted" | "qc-passed" | "finishing";
const STAGE_CFG: Record<BatchStage, { label: string; border: string; badgeBg: string; badgeColor: string }> = {
  "weaving":   { label: "Weaving in Progress",                        border: "#C4923A", badgeBg: "rgba(196,146,58,0.12)", badgeColor: "#8B6018" },
  "submitted": { label: "Sarees Submitted — Waiting Quality Check",   border: T.blueGray, badgeBg: "rgba(74,107,138,0.10)", badgeColor: T.blueGray },
  "qc-passed": { label: "Quality Check Passed — Moved to Stock",      border: T.green,   badgeBg: "rgba(30,102,64,0.10)", badgeColor: T.green   },
  "finishing": { label: "In Stock — Ready for Sale",                  border: T.green,   badgeBg: "rgba(30,102,64,0.10)", badgeColor: T.green   },
};
const FILTER_PILLS: { label: string; stage: BatchStage | null }[] = [
  { label: "All Batches",                             stage: null          },
  { label: "Material Issued — Weaving in Progress",   stage: "weaving"     },
  { label: "Sarees Submitted",                        stage: "submitted"   },
  { label: "Quality Check Passed",                    stage: "qc-passed"   },
  { label: "In Stock — Ready for Sale",               stage: "finishing"   },
];
interface WeaverRef { name: string; id: string; initials: string; bg: string }
interface Batch {
  id: string; stage: BatchStage; sareeCode: string; sareeTypeName: string; rate: number;
  design: string; designName: string; weavers: WeaverRef[];
  materials: string; started: string; expected?: string; submitted?: string;
  done: number; total: number; late?: number; qcPassed?: number; finishingDone?: number;
  isLive?: boolean;
}
const BATCHES: Batch[] = [
  { id: "BATCH-089", stage: "weaving",   sareeCode: "SB-001", sareeTypeName: "Self Brocade",   rate: 450,  design: "BKB-045", designName: "Cream Zari Border",    weavers: [{ name: "Ravi Kumar",   id: "WV-001", initials: "RK", bg: T.royalBurgundy }], materials: "Warp: 6 kg · Resham: Red 800g, Gold 400g · Jari: PLY-2G-Gold 250g",         started: "20 May 2026", expected: "28 May 2026",                       done: 4, total: 8                      },
  { id: "BATCH-086", stage: "weaving",   sareeCode: "HZ-003", sareeTypeName: "Heavy Zari",     rate: 680,  design: "BKB-031", designName: "Maroon Heavy Border",   weavers: [{ name: "Padma Veni",   id: "WV-002", initials: "PV", bg: "#C4923A"       }], materials: "Warp: 4.5 kg · Resham: Maroon 600g, Gold 300g · Jari: SF-3G-Gold 300g",   started: "18 May 2026", expected: "26 May 2026",                       done: 3, total: 5                      },
  { id: "BATCH-081", stage: "submitted", sareeCode: "PS-002", sareeTypeName: "Plain Silk",     rate: 280,  design: "BKB-022", designName: "Cream Plain Silk",      weavers: [{ name: "Suresh Murti", id: "WV-007", initials: "SM", bg: T.taupe         }], materials: "Warp: 3 kg · Resham: Cream 500g · Jari: PLY-1G-Silver 150g",               started: "12 May 2026", submitted: "20 May 2026",                      done: 4, total: 4                      },
  { id: "BATCH-083", stage: "weaving",   sareeCode: "BS-004", sareeTypeName: "Bridal Special", rate: 1200, design: "BKB-019", designName: "Red Bridal Zari",       weavers: [{ name: "Anand K.",     id: "WV-005", initials: "AK", bg: T.deepWine      }, { name: "Meena R.", id: "WV-012", initials: "MR", bg: "#A05080" }], materials: "Warp: 8.5 kg · Resham: Red 1.2 kg, Gold 600g · Jari: SF-5G-Gold 500g", started: "15 May 2026", expected: "30 May 2026",                       done: 5, total: 10                     },
  { id: "BATCH-085", stage: "weaving",   sareeCode: "SB-001", sareeTypeName: "Self Brocade",   rate: 450,  design: "BKB-038", designName: "Blue Zari Checks",      weavers: [{ name: "Meena R.",     id: "WV-012", initials: "MR", bg: "#A05080"       }], materials: "Warp: 3.5 kg · Resham: Blue 400g, Green 300g · Jari: PLY-3G-Gold 180g",  started: "14 May 2026", expected: "22 May 2026", late: 2,               done: 1, total: 4                      },
  { id: "BATCH-079", stage: "qc-passed", sareeCode: "HZ-003", sareeTypeName: "Heavy Zari",     rate: 680,  design: "BKB-045", designName: "Cream Zari Border",    weavers: [{ name: "Kamala B.",    id: "WV-031", initials: "KB", bg: T.darkBurgundy  }], materials: "Warp: 4 kg · Resham: Cream 600g, Gold 300g · Jari: SF-2G-Gold 250g",      started: "05 May 2026", expected: "15 May 2026",                       done: 6, total: 6, qcPassed: 6  },
  { id: "BATCH-077", stage: "qc-passed", sareeCode: "PS-002", sareeTypeName: "Plain Silk",     rate: 280,  design: "BKB-022", designName: "Cream Plain Silk",      weavers: [{ name: "Venkat Rao",   id: "WV-024", initials: "VR", bg: T.green         }], materials: "Warp: 3.5 kg · Resham: Cream 600g · Jari: PLY-1G-Silver 180g",            started: "03 May 2026", expected: "13 May 2026",                       done: 8, total: 8, qcPassed: 7  },
  { id: "BATCH-093", stage: "finishing", sareeCode: "BS-004", sareeTypeName: "Bridal Special", rate: 1200, design: "BKB-019", designName: "Red Bridal Zari",       weavers: [{ name: "Lakshmi D.",   id: "WV-018", initials: "LD", bg: "#C4923A"       }], materials: "Warp: 5 kg · Resham: Red 800g, Gold 400g · Jari: SF-4G-Gold 350g",        started: "08 May 2026", expected: "18 May 2026",                       done: 5, total: 5, qcPassed: 5, finishingDone: 3 },
];

function BatchCard({ b, expandedId, setExpandedId, onView, onSlip, onEdit }: { b: Batch; expandedId: string | null; setExpandedId: (id: string | null) => void; onView?: (b: Batch) => void; onSlip?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const cfg = STAGE_CFG[b.stage];
  const pct = Math.round((b.done / b.total) * 100);
  const est = b.total * b.rate;
  const isExpanded = expandedId === b.id;

  const sarees = Array.from({ length: b.done }, (_, i) => ({
    id: `S-${b.id.split("-")[1]}-${String(i + 1).padStart(2, "0")}`,
    weight: (5.2 + i * 0.1).toFixed(1) + " kg",
    qc: b.stage === "qc-passed" || b.stage === "finishing" ? (i === b.done - 1 && b.qcPassed && b.qcPassed < b.done ? "Rejected" : "Passed") : b.stage === "submitted" ? "Pending" : "—",
    notes: i === 0 && b.stage === "qc-passed" && b.qcPassed && b.qcPassed < b.done ? "Weight variation" : "—",
  }));

  return (
    <motion.div
      onClick={() => onView?.(b)}
      whileHover={{ y: -6, scale: 1.008, boxShadow: "0 24px 60px rgba(110,15,45,0.12)" }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 24px rgba(74,6,27,0.05)", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", position: "relative", cursor: "pointer" }}
    >
      <div style={{ width: 6, height: "100%", background: cfg.border, position: "absolute", left: 0, top: 0, bottom: 0 }} />
      <div style={{ paddingLeft: 6, display: "flex", flexDirection: "column", height: "100%", flex: 1 }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 20px 14px" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: T.royalBurgundy, marginBottom: 8, letterSpacing: "0.2px" }}>{b.id}</div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: cfg.badgeColor, background: cfg.badgeBg, borderRadius: 99, padding: "6px 14px", border: `1px solid ${cfg.border}22`, boxShadow: `0 2px 10px ${cfg.badgeBg}` }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.badgeColor, boxShadow: `0 0 6px ${cfg.badgeColor}` }} />
              {cfg.label}
            </span>
          </div>
          <div style={{ background: "linear-gradient(135deg, #F5E8D0 0%, #FFFDF9 100%)", border: `1.5px solid ${T.borderGold}`, borderRadius: 12, padding: "8px 14px", display: "flex", flexDirection: "column", alignItems: "flex-end", boxShadow: "0 4px 12px rgba(200,155,71,0.06)", flexShrink: 0, marginLeft: 12, textAlign: "right" }}>
            <div style={{ color: T.royalBurgundy, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{b.sareeCode}</div>
            <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 11, color: T.taupe }}>{b.sareeTypeName} · ₹{b.rate}</div>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: "0 20px 18px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          {/* Design block */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(110,15,45,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Palette size={16} color={T.royalBurgundy} weight="fill" />
            </div>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>Design Code</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>
                <span style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{b.design}</span> · {b.designName}
              </div>
            </div>
          </div>

          {/* Assigned Weavers */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
            <div style={{ display: "flex", position: "relative", paddingRight: b.weavers.length > 1 ? 16 : 0 }}>
              {b.weavers.map((w, index) => (
                <div
                  key={w.id}
                  style={{
                    marginLeft: index > 0 ? -12 : 0,
                    zIndex: 10 - index,
                    position: "relative",
                    transition: "transform 0.25s ease",
                  }}
                >
                  <Pip initials={w.initials} bg={w.bg} size={32} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Assigned Weavers</span>
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
                {b.weavers.map(w => w.name).join(" + ")}
              </span>
            </div>
          </div>

          {/* Materials & Dates block */}
          <div style={{ background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Materials */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Package size={17} color={T.royalBurgundy} weight="fill" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown }}>
                <strong style={{ color: T.taupe, fontWeight: 600 }}>Materials: </strong>
                {b.materials}
              </div>
            </div>
            <div style={{ height: 1, background: "rgba(110,15,45,0.05)" }} />
            {/* Dates */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <CalendarBlank size={17} color={T.royalBurgundy} weight="fill" style={{ flexShrink: 0 }} />
              <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown }}>
                {b.submitted ? (
                  <span>Started <strong style={{ fontFamily: F.mono }}>{b.started}</strong> · Submitted <strong style={{ fontFamily: F.mono }}>{b.submitted}</strong></span>
                ) : (
                  <span>Started <strong style={{ fontFamily: F.mono }}>{b.started}</strong> · Expected <strong style={{ fontFamily: F.mono }}>{b.expected}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 800, color: T.luxuryBrown }}>{b.done}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>/ {b.total} Sarees Completed</span>
              </div>
              <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: T.antiqueGold }}>{pct}%</span>
            </div>
            
            {/* Progress track */}
            <div style={{ height: 10, background: "rgba(110,15,45,0.06)", borderRadius: 99, overflow: "hidden", position: "relative", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)" }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: EASE }}
                style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.antiqueGold} 0%, ${T.goldLight} 100%)`, borderRadius: 99, boxShadow: "0 1px 4px rgba(200,155,71,0.25)" }}
              />
            </div>

            {/* Auxiliary progress details */}
            {(b.finishingDone !== undefined || b.qcPassed !== undefined || b.late) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {b.finishingDone !== undefined && (
                  <div style={{ background: "rgba(30,102,64,0.05)", border: `1px solid rgba(30,102,64,0.15)`, borderRadius: 8, padding: "4px 10px", fontFamily: F.ui, fontSize: 11.5, color: T.green, fontWeight: 600 }}>
                    ✨ Finishing: {b.finishingDone} of {b.total}
                  </div>
                )}
                {b.qcPassed !== undefined && (
                  <div style={{ background: "rgba(110,15,45,0.04)", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "4px 10px", fontFamily: F.ui, fontSize: 11.5, color: T.royalBurgundy, fontWeight: 600 }}>
                    ✓ QC Passed: {b.qcPassed} {b.done - b.qcPassed > 0 && `(Rejected: ${b.done - b.qcPassed})`}
                  </div>
                )}
                {b.late && (
                  <div style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 8, padding: "4px 10px", fontFamily: F.ui, fontSize: 11.5, color: T.crimson, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <WarningCircle size={13} weight="fill" /> Running {b.late}d late
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Making charge banner */}
          <div style={{ background: "linear-gradient(135deg, rgba(200,155,71,0.08) 0%, rgba(200,155,71,0.02) 100%)", border: `1px solid rgba(200,155,71,0.16)`, borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Est. Making Charges</span>
            <span style={{ fontFamily: F.display, fontSize: 16.5, fontWeight: 800, color: "#8B6018" }}>₹{est.toLocaleString("en-IN")}</span>
          </div>
          
          {/* Expand sarees */}
          <button onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : b.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, textAlign: "left", padding: "8px 0 4px", display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <PhCaretRight size={14} weight="bold" style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
            {isExpanded ? "Hide Individual Sarees" : "Show Individual Sarees"}
          </button>
          
          {isExpanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {sarees.map((s, index) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 14px" }}>
                  <div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{s.id}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>Weight: {s.weight} {s.notes !== "—" && `· Note: ${s.notes}`}</div>
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", color: s.qc === "Passed" ? T.green : s.qc === "Rejected" ? T.crimson : T.taupe, background: s.qc === "Passed" ? "rgba(30,102,64,0.08)" : s.qc === "Rejected" ? "rgba(192,57,43,0.08)" : "rgba(139,112,96,0.08)", borderRadius: 6, padding: "4px 10px" }}>
                    {s.qc}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Bottom buttons */}
        <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
          <motion.button onClick={(e) => { e.stopPropagation(); onView?.(b); }} whileHover={{ scale: 1.02 }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10, padding: "10px 0", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <PhEye size={16} /> Details
          </motion.button>
          <motion.button onClick={(e) => { e.stopPropagation(); onSlip?.(b); }} whileHover={{ scale: 1.02 }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10, padding: "10px 0", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Palette size={16} /> Slip
          </motion.button>
          {b.isLive && onEdit && (
            <motion.button onClick={(e) => { e.stopPropagation(); onEdit(b); }} whileHover={{ scale: 1.02 }} style={{ flex: 1.2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(110,15,45,0.12)", color: T.royalBurgundy, border: `1.5px solid ${T.royalBurgundy}33`, borderRadius: 10, padding: "10px 0", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <PencilSimple size={16} /> Edit
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Batch Card Grid ───────────────────────────────────────────────────────────
function BatchCardGrid({ batches, onView, onSlip, onEdit }: { batches: Batch[]; onView?: (b: Batch) => void; onSlip?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "stretch" }}>
      {batches.map((b, i) => (
        <FadeUp key={b.id} delay={i * 0.04} style={{ height: "100%" }}>
          <BatchCard b={b} expandedId={expandedId} setExpandedId={setExpandedId} onView={onView} onSlip={onSlip} onEdit={onEdit} />
        </FadeUp>
      ))}
    </div>
  );
}

// ── Batch List View ───────────────────────────────────────────────────────────
function BatchListView({ batches, onView, onEdit }: { batches: Batch[]; onView?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const cols = ["Batch Number", "Stage", "Weavers", "Design", "Saree Type", "Progress", "Started", "Expected End", "Making Charges", "Action"];
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 6px 24px rgba(74,6,27,0.05)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 140px 150px 140px 150px 120px 120px 130px 90px", padding: "12px 20px", background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` }}>
        {cols.map(h => <div key={h} style={{ fontFamily: F.mono, fontSize: 9.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{h}</div>)}
      </div>
      {batches.map((b, i) => {
        const cfg = STAGE_CFG[b.stage];
        const pct = Math.round((b.done / b.total) * 100);
        const est = b.total * b.rate;
        return (
          <div key={b.id} style={{ display: "grid", gridTemplateColumns: "140px 1fr 140px 150px 140px 150px 120px 120px 130px 90px", alignItems: "center", padding: "14px 20px", background: i % 2 === 1 ? "rgba(247,242,234,0.55)" : "#FFFFFF", borderBottom: `1px solid ${T.borderDef}`, borderLeft: `4px solid ${cfg.border}`, minHeight: 64 }}>
            <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{b.id}</div>
            <div><span style={{ display: "inline-block", fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: cfg.badgeColor, background: cfg.badgeBg, borderRadius: 99, padding: "4px 10px", whiteSpace: "nowrap" }}>{cfg.label}</span></div>
            <div style={{ display: "flex", gap: 6 }}>{b.weavers.map(w => <Pip key={w.id} initials={w.initials} bg={w.bg} size={28} />)}</div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{b.design}<div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 400, marginTop: 2 }}>{b.designName}</div></div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>{b.sareeCode}<div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 400, marginTop: 2 }}>{b.sareeTypeName}</div></div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 700, marginBottom: 5 }}>{b.done}/{b.total}</div>
              <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden", width: 110 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: cfg.border, borderRadius: 99 }} />
              </div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{b.started}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12.5, color: b.late ? T.crimson : T.taupe }}>{b.submitted ?? b.expected}{b.late && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}><WarningCircle size={13} weight="fill" /> {b.late}d late</div>}</div>
            <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.antiqueGold, fontWeight: 700 }}>₹{est.toLocaleString("en-IN")}</div>
            <div>
              <div style={{ display: "flex", gap: 6 }}>
                <motion.button onClick={() => onView?.(b)} whileHover={{ scale: 1.04 }} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 8, padding: "6px 12px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <PhEye size={14} weight="bold" /> View
                </motion.button>
                {b.isLive && onEdit && (
                  <motion.button onClick={() => onEdit(b)} whileHover={{ scale: 1.04 }} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(110,15,45,0.12)", color: T.royalBurgundy, border: `1.5px solid ${T.royalBurgundy}33`, borderRadius: 8, padding: "6px 12px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <PencilSimple size={14} /> Edit
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Batch Table View ──────────────────────────────────────────────────────────
function BatchTableView({ batches, onView, onEdit }: { batches: Batch[]; onView?: (b: Batch) => void; onEdit?: (b: Batch) => void }) {
  const headers = ["Batch No.", "Stage", "Weaver(s)", "Design Code", "Saree Type", "Materials Given", "Started", "Expected End", "Target", "Done", "QC Passed", "Rate/Saree", "Est. Charges", "Action"];
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 6px 24px rgba(74,6,27,0.05)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1400 }}>
          <thead>
            <tr style={{ background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` }}>
              {headers.map(h => <th key={h} style={{ fontFamily: F.mono, fontSize: 9.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", textAlign: "left", padding: "12px 16px", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {batches.map((b, i) => {
              const cfg = STAGE_CFG[b.stage];
              const est = b.total * b.rate;
              return (
                <tr key={b.id} style={{ background: i % 2 === 1 ? "rgba(247,242,234,0.50)" : "#FFFFFF", borderBottom: `1px solid ${T.borderDef}`, borderLeft: `4px solid ${cfg.border}` }}>
                  <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, fontWeight: 700, whiteSpace: "nowrap" }}>{b.id}</td>
                  <td style={{ padding: "14px 16px" }}><span style={{ display: "inline-block", fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: cfg.badgeColor, background: cfg.badgeBg, borderRadius: 99, padding: "4px 10px", whiteSpace: "nowrap" }}>{cfg.label}</span></td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {b.weavers.map(w => <div key={w.id} style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, whiteSpace: "nowrap", fontWeight: 500 }}>{w.name} <span style={{ color: T.taupe }}>({w.id})</span></div>)}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, fontWeight: 600 }}>{b.design}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 600 }}>{b.sareeCode}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 12.5, color: T.taupe, maxWidth: 200, lineHeight: 1.5 }}>{b.materials}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 13, color: T.taupe, whiteSpace: "nowrap" }}>{b.started}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 13, color: b.late ? T.crimson : T.taupe, whiteSpace: "nowrap", fontWeight: b.late ? 600 : 400 }}>{b.submitted ?? b.expected}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.display, fontSize: 17, color: T.luxuryBrown, textAlign: "center" }}>{b.total}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.display, fontSize: 17, color: T.antiqueGold, textAlign: "center" }}>{b.done}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.display, fontSize: 17, color: T.green, textAlign: "center" }}>{b.qcPassed ?? "—"}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}>₹{b.rate}</td>
                  <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 14, color: T.antiqueGold, fontWeight: 700 }}>₹{est.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <motion.button onClick={() => onView?.(b)} whileHover={{ scale: 1.04 }} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 8, padding: "6px 12px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        <PhEye size={14} weight="bold" /> View
                      </motion.button>
                      {b.isLive && onEdit && (
                        <motion.button onClick={() => onEdit(b)} whileHover={{ scale: 1.04 }} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(110,15,45,0.12)", color: T.royalBurgundy, border: `1.5px solid ${T.royalBurgundy}33`, borderRadius: 8, padding: "6px 12px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          <PencilSimple size={14} /> Edit
                        </motion.button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Showing {batches.length} of {BATCHES.length} batches</div>
    </div>
  );
}

// ── Active Batches Section ────────────────────────────────────────────────────
const VIEW_OPTIONS = [
  { key: "card",  label: "Card View",  Icon: SquaresFour },
  { key: "list",  label: "List View",  Icon: ListDashes },
  { key: "table", label: "Table View", Icon: PhList },
];
const PERIODS = ["Active Batches", "This Month", "Last 3 Months", "All Time"];

// ── Context batch helpers ─────────────────────────────────────────────────────
function rowComplete(r: SareeRow) {
  return !!(r.weaverId && r.sareeId && r.designCode && r.sareeTypeCode);
}
function weaverBreakdown(rows: SareeRow[]): { name: string; count: number }[] {
  const map: Record<string, number> = {};
  rows.forEach(r => {
    const key = r.weaverName || "Unassigned";
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
}
function bulkOrderBreakdown(rows: SareeRow[]): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  rows.forEach(r => {
    const key = r.bulkOrderLabel || "Not assigned";
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([label, count]) => ({ label, count }));
}

function ContextBatchCard({ b, onNavigateBatches, onClick }: { b: BatchRecord; onNavigateBatches?: (batchId: string) => void; onClick?: () => void }) {
  const completeCount = b.rows.filter(rowComplete).length;
  const pct = b.totalCount > 0 ? Math.round((completeCount / b.totalCount) * 100) : 0;
  const weavers = weaverBreakdown(b.rows);
  const orders = bulkOrderBreakdown(b.rows);
  const hasDueDate = !!b.dueDate;

  const { getDesign } = useDesignLibrary();
  const firstRow = b.rows[0];
  const designObj = firstRow ? getDesign(firstRow.designCode) : undefined;
  const designImage = designObj?.colorSlipPhoto || designObj?.designGraph || imgSaree;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -6, scale: 1.008, boxShadow: "0 24px 60px rgba(110,15,45,0.12)" }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 24px rgba(74,6,27,0.05)", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", position: "relative", cursor: "pointer" }}
    >
      {/* Top stage accent line */}
      <div style={{ width: "100%", height: 5, background: b.status === "active" ? T.green : T.antiqueGold, flexShrink: 0 }} />

      {/* Image Banner */}
      <div style={{ height: 160, position: "relative", overflow: "hidden", background: T.silkCream, flexShrink: 0 }}>
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.5 }}
          src={designImage}
          alt={b.batchId}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Shadow Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />

        {/* Floating ID badge in top left */}
        <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: F.mono, fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}>
          {b.batchId}
        </div>

        {/* Floating status badge in top right */}
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 10, fontWeight: 800, color: b.status === "active" ? "#FFFFFF" : T.luxuryBrown, background: b.status === "active" ? "rgba(30,102,64,0.85)" : "rgba(200,155,71,0.92)", backdropFilter: "blur(4px)", borderRadius: 99, padding: "4px 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: b.status === "active" ? "#2ECC71" : T.royalBurgundy }} />
            {b.status === "active" ? "Active" : "Draft"}
          </span>
        </div>

        {/* Floating Count & Due date overlay at bottom */}
        <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quantity</div>
            <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>{b.totalCount} Sarees</div>
          </div>
          {hasDueDate && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Due Date</div>
              <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.goldLight }}>{b.dueDate}</div>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {/* Design Name Bar */}
        {firstRow && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "8px 12px" }}>
            <Palette size={14} color={T.royalBurgundy} weight="fill" style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {firstRow.sareeTypeName} · <span style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{firstRow.designCode}</span>
            </span>
          </div>
        )}

        {/* Weavers Breakdown */}
        <div>
          <div style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
            Assigned Weavers
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {weavers.map(w => (
              <span key={w.name} style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, background: w.name === "Unassigned" ? "rgba(139,112,96,0.06)" : "rgba(110,15,45,0.05)", color: w.name === "Unassigned" ? T.taupe : T.royalBurgundy, border: `1px solid ${w.name === "Unassigned" ? "rgba(139,112,96,0.15)" : T.borderDef}`, borderRadius: 8, padding: "4px 8px" }}>
                {w.count} × {w.name}
              </span>
            ))}
          </div>
        </div>

        {/* Linked Orders Breakdown */}
        {orders.length > 0 && (
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              Linked Orders
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {orders.map(o => (
                <span key={o.label} style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, background: o.label === "Not assigned" ? "rgba(139,112,96,0.06)" : "rgba(30,102,64,0.05)", color: o.label === "Not assigned" ? T.taupe : T.green, border: `1px solid ${o.label === "Not assigned" ? "rgba(139,112,96,0.15)" : "rgba(30,102,64,0.15)"}`, borderRadius: 8, padding: "4px 8px" }}>
                  {o.count} × {o.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 1, background: "rgba(110,15,45,0.05)", margin: "4px 0" }} />

        {/* Progress */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Rows complete: {completeCount} of {b.totalCount}</span>
            <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 800, color: pct === 100 ? T.green : T.antiqueGold }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(110,15,45,0.06)", borderRadius: 99, overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.0, ease: EASE }}
              style={{ height: "100%", background: pct === 100 ? `linear-gradient(90deg, ${T.green} 0%, #4ade80 100%)` : `linear-gradient(90deg, ${T.antiqueGold} 0%, ${T.goldLight} 100%)`, borderRadius: 99 }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: "auto", paddingTop: 8 }}>
          <motion.button
            onClick={(e) => { e.stopPropagation(); onNavigateBatches?.(b.batchId); }}
            whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
            whileTap={{ scale: 0.98 }}
            style={{ width: "100%", height: 42, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "rgba(110,15,45,0.04)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.16)`, borderRadius: 12, fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            <ArrowRight size={14} weight="bold" /> Open in Batch Creation
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function ContextBatchDetailsDialog({ b, onClose, onOpenCreation }: { b: BatchRecord; onClose: () => void; onOpenCreation: () => void }) {
  const completeCount = b.rows.filter(rowComplete).length;
  const pct = b.totalCount > 0 ? Math.round((completeCount / b.totalCount) * 100) : 0;
  const weavers = weaverBreakdown(b.rows);
  const orders = bulkOrderBreakdown(b.rows);

  const { getDesign } = useDesignLibrary();
  const firstRow = b.rows[0];
  const designObj = firstRow ? getDesign(firstRow.designCode) : undefined;
  const designImage = designObj?.colorSlipPhoto || designObj?.designGraph || imgSaree;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(26,10,15,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ y: 18, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 18, scale: 0.96 }} onClick={e => e.stopPropagation()} style={{ width: 640, maxWidth: "100%", background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, boxShadow: "0 30px 90px rgba(0,0,0,0.25)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        
        {/* Banner with design image */}
        <div style={{ height: 180, position: "relative", overflow: "hidden", background: T.silkCream, flexShrink: 0 }}>
          <img src={designImage} alt="Design image" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)" }} />
          
          {/* Header text floating */}
          <div style={{ position: "absolute", bottom: 16, left: 24, right: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.goldLight, letterSpacing: "0.5px", marginBottom: 4 }}>{b.batchId}</div>
              <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 800, color: "#FFFFFF" }}>
                {firstRow ? firstRow.sareeTypeName : "Batch"} Production
              </div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 11, fontWeight: 800, color: b.status === "active" ? "#FFFFFF" : T.luxuryBrown, background: b.status === "active" ? "#2ECC71" : T.antiqueGold, borderRadius: 99, padding: "4px 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {b.status === "active" ? "Active" : "Draft"}
            </span>
          </div>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(26,10,15,0.45)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600 }}>×</button>
        </div>

        {/* Scrollable details content */}
        <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
          {/* Progress bar info */}
          <div style={{ background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Production progress</span>
              <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 800, color: pct === 100 ? T.green : T.antiqueGold }}>
                {completeCount} / {b.totalCount} ({pct}%) Complete
              </span>
            </div>
            <div style={{ height: 10, background: "rgba(110,15,45,0.06)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? `linear-gradient(90deg, ${T.green} 0%, #4ade80 100%)` : `linear-gradient(90deg, ${T.antiqueGold} 0%, ${T.goldLight} 100%)`, borderRadius: 99 }} />
            </div>
          </div>

          {/* Details metadata grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Design Code</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>
                <span style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{firstRow?.designCode || "N/A"}</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Due Date</div>
              <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>
                {b.dueDate || "Not Set"}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />

          {/* Weavers & Orders summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                Assigned Weavers
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {weavers.map(w => (
                  <span key={w.name} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, background: w.name === "Unassigned" ? "rgba(139,112,96,0.06)" : "rgba(110,15,45,0.05)", color: w.name === "Unassigned" ? T.taupe : T.royalBurgundy, border: `1px solid ${w.name === "Unassigned" ? "rgba(139,112,96,0.15)" : T.borderDef}`, borderRadius: 8, padding: "5px 10px" }}>
                    {w.count} × {w.name}
                  </span>
                ))}
              </div>
            </div>

            {orders.length > 0 && (
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                  Linked Orders
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {orders.map(o => (
                    <span key={o.label} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, background: o.label === "Not assigned" ? "rgba(139,112,96,0.06)" : "rgba(30,102,64,0.05)", color: o.label === "Not assigned" ? T.taupe : T.green, border: `1px solid ${o.label === "Not assigned" ? "rgba(139,112,96,0.15)" : "rgba(30,102,64,0.15)"}`, borderRadius: 8, padding: "5px 10px" }}>
                      {o.count} × {o.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />

          {/* Individual Sarees List */}
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
              Saree Row Allocations ({b.rows.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {b.rows.map(row => (
                <div key={row.serial} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(110,15,45,0.02)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "12px 16px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>
                        Saree {row.serial}
                      </span>
                      {row.sareeId && (
                        <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>
                          ({row.sareeId})
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, marginTop: 4 }}>
                      Loom {row.weaverLoom} · {row.weaverName || "Unassigned"}
                    </div>
                    {row.bulkOrderLabel && (
                      <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.green, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>↳ Order: {row.bulkOrderLabel}</span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: row.qcPassed ? T.green : T.taupe, background: row.qcPassed ? "rgba(30,102,64,0.08)" : "rgba(139,112,96,0.08)", borderRadius: 6, padding: "4px 8px" }}>
                    {row.qcPassed ? "QC Passed" : "In Progress"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: "18px 24px 24px", borderTop: `1px solid ${T.borderDef}`, display: "flex", gap: 12, background: T.warmIvory }}>
          <motion.button onClick={onClose} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} style={{ flex: 1, height: 44, background: "#FFFFFF", color: T.taupe, border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Close Details
          </motion.button>
          <motion.button onClick={onOpenCreation} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} style={{ flex: 1.5, height: 44, background: T.royalBurgundy, color: "#FFFFFF", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <ArrowRight size={16} weight="bold" /> Open in Batch Creation
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActiveBatchesSection({ onNavigate }: { onNavigate?: (tab: string) => void } & CodeCallbacks) {
  const { batches, setPendingOpenBatchId } = useBatches();
  const contextBatches = batches.filter(b => b.status === "active" || b.status === "draft");

  const [view,   setView]   = useState("card");
  const [filter, setFilter] = useState<BatchStage | null>(null);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Active Batches");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Most Recent First");
  const [batchDialog, setBatchDialog] = useState<{ mode: "view" | "slip"; batch?: Batch } | null>(null);

  // Map BatchRecord from context to Batch type
  const mappedContextBatches: Batch[] = contextBatches.map(br => {
    const completeCount = br.rows.filter(rowComplete).length;
    const qcPassedCount = br.rows.filter(r => r.qcPassed).length;
    
    // Determine stage
    let stage: BatchStage = "weaving";
    if (br.status === "completed") {
      stage = "finishing";
    } else if (qcPassedCount > 0 && qcPassedCount === br.totalCount) {
      stage = "qc-passed";
    } else if (completeCount === br.totalCount) {
      stage = "submitted";
    }

    // Aggregate weavers
    const weaversMap: Record<string, WeaverRef> = {};
    br.rows.forEach(r => {
      if (r.weaverId && r.weaverName) {
        weaversMap[r.weaverId] = {
          id: r.weaverId,
          name: r.weaverName,
          initials: r.weaverInitials || r.weaverName.split(" ").map(n => n[0]).join("").toUpperCase(),
          bg: T.royalBurgundy
        };
      }
    });
    let weavers = Object.values(weaversMap);
    if (weavers.length === 0) {
      weavers = [{ id: "WV-UNASSIGNED", name: "Unassigned Loom", initials: "??", bg: T.taupe }];
    }

    // Get saree info from rows
    const firstRowWithSaree = br.rows.find(r => r.sareeTypeCode);
    const sareeCode = firstRowWithSaree?.sareeTypeCode || "SB-001";
    const sareeTypeName = firstRowWithSaree?.sareeTypeName || "Self Brocade";
    const design = firstRowWithSaree?.designCode || "BKB-045";
    
    // Simple date formatting
    const formatDate = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      } catch (e) {
        return "25 May 2026";
      }
    };

    return {
      id: br.batchId,
      stage,
      sareeCode,
      sareeTypeName,
      rate: 450, // default rate
      design,
      designName: "Production Design",
      weavers,
      materials: "Warp: 6 kg · Resham: Red 800g · Jari: Gold 250g",
      started: formatDate(br.createdAt),
      expected: formatDate(br.dueDate),
      submitted: stage === "submitted" || stage === "qc-passed" || stage === "finishing" ? formatDate(br.updatedAt) : undefined,
      done: completeCount,
      total: br.totalCount,
      qcPassed: qcPassedCount > 0 ? qcPassedCount : undefined,
      isLive: true
    };
  });

  // Combine with BATCHES, filtering duplicates by ID
  const combined: Batch[] = [...mappedContextBatches];
  BATCHES.forEach(b => {
    if (!combined.some(c => c.id === b.id)) {
      combined.push(b);
    }
  });

  const visible = combined.filter(b => {
    if (filter && b.stage !== filter) return false;

    // Period filter
    if (period === "Active Batches" && (b.stage === "qc-passed" || b.stage === "finishing") && !filter) return false;

    if (search) {
      const q = search.toLowerCase();
      return b.id.toLowerCase().includes(q) || b.weavers.some(w => w.name.toLowerCase().includes(q)) || b.design.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "Most Complete") {
      return (b.done / b.total) - (a.done / a.total);
    } else if (sortBy === "Least Complete") {
      return (a.done / a.total) - (b.done / b.total);
    }
    return a.id.localeCompare(b.id);
  });

  const handleEditBatch = (b: Batch) => {
    setPendingOpenBatchId(b.id);
    onNavigate?.("Batches");
  };

  return (
    <div id="prod-active-batches" style={{ padding: "40px 48px 0" }}>
      <FadeUp>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
            <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0 }}>All Active Production Batches</h2>
          </div>
          <motion.button onClick={() => onNavigate?.("Batches")} initial={{ backgroundColor: T.green }} animate={{ backgroundColor: T.green }} whileHover={{ scale: 1.03, backgroundColor: "#145230" }} whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 8, color: "#FFFDF9", border: "none", borderRadius: 12, padding: "12px 20px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(30,102,64,0.2)" }}>
            <PhPlus size={16} weight="bold" /> Create New Batch
          </motion.button>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 20px" }}>Every active batch currently being worked on by weavers. Each batch is one set of materials given to one or more weavers for a specific design.</p>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          {FILTER_PILLS.map(f => (
            <motion.button key={f.label} onClick={() => setFilter(f.stage)} whileHover={{ scale: 1.02 }}
              style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 99, cursor: "pointer", background: filter === f.stage ? T.royalBurgundy : "transparent", color: filter === f.stage ? "#FFFDF9" : T.taupe, border: filter === f.stage ? "none" : `1px solid rgba(110,15,45,0.18)`, transition: "all 0.18s" }}>
              {f.label}
            </motion.button>
          ))}
        </div>

        {/* Search + view toggle + sort + period */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
            <MagnifyingGlass size={18} weight="bold" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: T.taupe, pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by batch number, weaver name, or design code..."
              style={{ width: "100%", height: 46, paddingLeft: 44, paddingRight: 16, fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, outline: "none", boxSizing: "border-box" }} />
          </div>
          {/* View toggle */}
          <div style={{ display: "flex", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", background: "#FFFFFF" }}>
            {VIEW_OPTIONS.map(({ key, label, Icon }) => (
              <motion.button key={key} onClick={() => setView(key)} animate={{ backgroundColor: view === key ? T.royalBurgundy : "#FFFFFF" }} transition={{ duration: 0.18 }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: view === key ? "#FFFDF9" : T.taupe, border: "none", cursor: "pointer" }}>
                <Icon size={16} weight={view === key ? "bold" : "regular"} /> {label}
              </motion.button>
            ))}
          </div>
          {/* Sort */}
          <div style={{ position: "relative" }}><motion.button onClick={() => setSortOpen(!sortOpen)} whileHover={{ scale: 1.02 }} style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 16px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.taupe, cursor: "pointer" }}>
            Sort By: {sortBy} <PhCaretDown size={14} weight="bold" />
          </motion.button>{sortOpen && <div style={{ position: "absolute", top: 44, right: 0, zIndex: 20, background: "#fff", border: `1px solid ${T.borderDef}`, borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,0.12)", overflow: "hidden", minWidth: 190 }}>{["Most Recent First", "Most Complete", "Least Complete"].map(v => <button key={v} onClick={() => { setSortBy(v); setSortOpen(false); }} style={{ display: "block", width: "100%", padding: "11px 14px", background: v === sortBy ? T.warmCream : "#fff", border: "none", textAlign: "left", fontFamily: F.ui, color: T.luxuryBrown, cursor: "pointer" }}>{v}</button>)}</div>}</div>
          {/* Period filter */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PERIODS.map(p => (
              <motion.button key={p} onClick={() => setPeriod(p)} whileHover={{ scale: 1.02 }}
                style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 99, cursor: "pointer", background: period === p ? T.royalBurgundy : "transparent", color: period === p ? "#FFFDF9" : T.taupe, border: period === p ? "none" : `1.5px solid rgba(110,15,45,0.18)`, transition: "all 0.18s" }}>
                {p}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Unified batches grid / list / table */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
            Production Batches — {visible.length} batch{visible.length !== 1 ? "es" : ""}
          </div>
          {visible.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", background: "#FFFFFF", borderRadius: 16, border: `1px dashed ${T.borderDef}`, color: T.taupe, fontFamily: F.ui }}>
              No batches found matching the current filters.
            </div>
          ) : (
            view === "card" ? <BatchCardGrid batches={visible} onView={(batch) => setBatchDialog({ mode: "view", batch })} onSlip={(batch) => setBatchDialog({ mode: "slip", batch })} onEdit={handleEditBatch} /> :
            view === "list" ? <BatchListView batches={visible} onView={(batch) => setBatchDialog({ mode: "view", batch })} onEdit={handleEditBatch} /> :
            <BatchTableView batches={visible} onView={(batch) => setBatchDialog({ mode: "view", batch })} onEdit={handleEditBatch} />
          )}
        </div>
      </FadeUp>
      <AnimatePresence>
        {batchDialog && (
          batchDialog.mode === "view" && batchDialog.batch?.isLive ? (
            (() => {
              const liveRecord = batches.find(br => br.batchId === batchDialog.batch?.id);
              if (!liveRecord) return null;
              return (
                <ContextBatchDetailsDialog
                  b={liveRecord}
                  onClose={() => setBatchDialog(null)}
                  onOpenCreation={() => {
                    setPendingOpenBatchId(liveRecord.batchId);
                    onNavigate?.("Batches");
                    setBatchDialog(null);
                  }}
                />
              );
            })()
          ) : (
            <ProductionDialog open={!!batchDialog} title={batchDialog.mode === "view" ? "Batch details" : "Color slip"} onClose={() => setBatchDialog(null)}>
              <div style={{ fontFamily: F.ui, color: T.luxuryBrown, lineHeight: 1.65 }}>
                <b>{batchDialog.batch?.id}</b><br />
                {batchDialog.mode === "view" 
                  ? `Design ${batchDialog.batch?.design} · ${batchDialog.batch?.done} of ${batchDialog.batch?.total} sarees complete.` 
                  : `Color slip for ${batchDialog.batch?.design}: maroon body, antique-gold border, pallu accent recorded for loom handoff.`
                }
              </div>
            </ProductionDialog>
          )
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DEFECTIVE SAREES SECTION
// ══════════════════════════════════════════════════════════════════════════════
const DEFECTIVE_DATA = [
  { id: "PADMA-L1-004",  weaver: "Padma Veni",      batch: "BATCH-086", design: "BKB-045", sareeType: "Self Brocade", defects: ["Thread Break"],              qcDate: "11 Jun 2026", deduction: "₹450" },
  { id: "RAVI-L2-008",   weaver: "Ravi Kumar",       batch: "BATCH-089", design: "BKB-031", sareeType: "Heavy Zari",   defects: ["Design Error"],              qcDate: "10 Jun 2026", deduction: "₹680" },
  { id: "BKB-L3-002",    weaver: "Own Factory L3",   batch: "BATCH-OWN", design: "BKB-022", sareeType: "Plain Silk",   defects: ["Weight Problem"],            qcDate: "10 Jun 2026", deduction: "₹280" },
  { id: "SURESH-L2-003", weaver: "Suresh Murti",     batch: "BATCH-081", design: "BKB-038", sareeType: "Self Brocade", defects: ["Jari Issue"],                qcDate: "09 Jun 2026", deduction: "₹450" },
  { id: "PADMA-L1-003",  weaver: "Padma Veni",       batch: "BATCH-086", design: "BKB-045", sareeType: "Self Brocade", defects: ["Thread Break"],              qcDate: "09 Jun 2026", deduction: "₹450" },
];

function DefectiveSareesSection({ superadmin = false, onNavigate, onDesignClick, onSareeTypeClick }: { superadmin?: boolean; onNavigate?: (tab: string) => void } & CodeCallbacks) {
  const [timeFiler, setTimeFilter] = useState("All Time");
  const [weaverFilter, setWeaverFilter] = useState("All Weavers");
  const [defectFilter, setDefectFilter] = useState("All Defect Types");
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [viewDefect, setViewDefect] = useState<typeof DEFECTIVE_DATA[0] | null>(null);
  const [dlWeaver, setDlWeaver] = useState("All Weavers");
  const [dlDefectType, setDlDefectType] = useState("All Defect Types");
  const [dlPeriod, setDlPeriod] = useState("This Month");
  const [dlWeaverOpen, setDlWeaverOpen] = useState(false);
  const [dlDefectOpen, setDlDefectOpen] = useState(false);

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.8px", padding: "12px 16px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "13px 16px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}` };

  const totalDeduction = DEFECTIVE_DATA.reduce((sum, r) => sum + parseInt(r.deduction.replace(/[₹,]/g, "")), 0);

  return (
    <FadeUp>
      <section id="prod-defective" style={{ padding: "36px 48px 48px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 4, background: T.crimson, borderRadius: 2, alignSelf: "stretch" }} />
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: "0 0 4px 0", fontWeight: 600 }}>Defective Sarees — Failed Quality Check</h2>
              <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0 }}>These sarees failed quality check by worker staff. They are stored separately. View only — no action can be taken from this page.</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowDownloadDialog(true)}
            whileHover={{ scale: 1.03, backgroundColor: "#7A5E1C" }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(200,155,71,0.15)", color: "#8B6018", border: `1.5px solid rgba(200,155,71,0.35)`, borderRadius: 11, padding: "10px 18px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            <DownloadSimple size={16} color={T.antiqueGold} weight="bold" /> Download Defective Report
          </motion.button>
        </div>

        {/* Read-only notice */}
        <div style={{ background: "rgba(192,57,43,0.05)", border: `1px solid rgba(192,57,43,0.18)`, borderRadius: 10, padding: "10px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>🔒</span>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>This is a view-only section. Defective sarees are managed by the system automatically. Deductions have already been applied to the relevant weavers.</span>
        </div>

        {/* Superadmin-only summary card */}
        {superadmin && (
          <div style={{ background: "#FFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(74,6,27,0.07)", padding: "20px 24px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
            {/* Gold top accent */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Shield size={14} color={T.antiqueGold} />
              <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: T.antiqueGold, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Superadmin Only — Not visible to Admin</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6 }}>Total Deductions Applied This Month</div>
                <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: T.crimson, lineHeight: 1.1, marginBottom: 4 }}>
                  ₹{totalDeduction.toLocaleString("en-IN")}
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe }}>🔒 Full deduction details visible to Superadmin only</div>
              </div>
              <div style={{ borderLeft: `1px solid ${T.borderDef}`, paddingLeft: 24 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 6 }}>Total Defective Sarees All Time</div>
                <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.1, marginBottom: 4 }}>
                  48 sarees
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe }}>🔒 Superadmin only — not visible to Admin</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" as const, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["All Time", "This Month", "This Week", "Today"].map(f => (
              <button key={f} onClick={() => setTimeFilter(f)} style={{ padding: "6px 14px", borderRadius: 999, border: `1px solid ${timeFiler === f ? T.royalBurgundy : T.borderDef}`, background: timeFiler === f ? T.royalBurgundy : "#FFF", color: timeFiler === f ? "#FFF" : T.taupe, fontFamily: F.ui, fontSize: 12, fontWeight: timeFiler === f ? 600 : 400, cursor: "pointer" }}>{f}</button>
            ))}
          </div>
          <select value={weaverFilter} onChange={e => setWeaverFilter(e.target.value)} style={{ height: 34, border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "0 12px", fontFamily: F.ui, fontSize: 13, background: "#FFFDF9", color: T.luxuryBrown, cursor: "pointer", outline: "none" }}>
            <option>All Weavers</option>
            <option>Padma Veni</option>
            <option>Ravi Kumar</option>
            <option>Suresh Murti</option>
            <option>Own Factory</option>
          </select>
          <select value={defectFilter} onChange={e => setDefectFilter(e.target.value)} style={{ height: 34, border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "0 12px", fontFamily: F.ui, fontSize: 13, background: "#FFFDF9", color: T.luxuryBrown, cursor: "pointer", outline: "none" }}>
            <option>All Defect Types</option>
            <option>Thread Break</option>
            <option>Design Error</option>
            <option>Jari Issue</option>
            <option>Weight Problem</option>
            <option>Measurement Error</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 24px rgba(74,6,27,0.07)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead>
              <tr>
                {["Saree ID", "Weaver", "Batch", "Design Code", "Saree Type Code", "Saree Type", "Defect Type(s)", "QC Date", "Deduction Applied", "Action"].map(col => (
                  <th key={col} style={TH}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEFECTIVE_DATA.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#FFFDF9" : "#FFF" }}>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{row.id}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{row.weaver}</span></td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{row.batch}</span></td>
                  <td style={TD}>
                    <ClickableCode onClick={onDesignClick ? () => onDesignClick(row.design) : undefined} style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{row.design}</ClickableCode>
                  </td>
                  <td style={TD}>
                    {(() => {
                      const rec = getSareeTypeByName(row.sareeType);
                      if (!rec) return <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>—</span>;
                      return (
                        <ClickableCode onClick={onSareeTypeClick ? () => onSareeTypeClick(rec.code) : undefined} style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600 }}>{rec.code}</ClickableCode>
                      );
                    })()}
                  </td>
                  <td style={TD}>{row.sareeType}</td>
                  <td style={TD}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                      {row.defects.map(d => (
                        <span key={d} style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.crimson, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.20)", padding: "2px 8px", borderRadius: 999 }}>{d}</span>
                      ))}
                    </div>
                  </td>
                  <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{row.qcDate}</span></td>
                  <td style={TD}>
                    <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.crimson, display: "block" }}>{row.deduction}</span>
                    {superadmin && (
                      <span style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, display: "block", marginTop: 3 }}>🔒 Full deduction details visible to Superadmin only</span>
                    )}
                  </td>
                  <td style={TD}>
                    <motion.button onClick={() => setViewDefect(row)} whileHover={{ scale: 1.05, backgroundColor: "rgba(110,15,45,0.08)" }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", border: `1.5px solid rgba(110,15,45,0.22)`, borderRadius: 8, background: "#FFF", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, cursor: "pointer" }}>
                      <Eye size={13} /> View
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {/* Summary footer */}
          <div style={{ background: T.warmCream, borderTop: `1px solid ${T.borderDef}`, padding: "12px 16px" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>
              Total defective this month: <strong>{DEFECTIVE_DATA.length} sarees</strong> · Total deductions applied: <strong style={{ fontFamily: F.mono, color: T.crimson }}>₹{totalDeduction.toLocaleString("en-IN")}</strong>
            </span>
          </div>
        </div>

        {/* ── Download Defective Report Dialog ── */}
        <AnimatePresence>
          {showDownloadDialog && (
            <ProductionDialog open title="Download Defective Report" onClose={() => setShowDownloadDialog(false)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Period */}
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Time Period</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["Today", "This Week", "This Month", "All Time"].map(p => (
                      <motion.button key={p} onClick={() => setDlPeriod(p)} whileHover={{ scale: 1.03 }}
                        style={{ padding: "8px 16px", borderRadius: 99, border: dlPeriod === p ? "none" : `1.5px solid rgba(110,15,45,0.18)`, background: dlPeriod === p ? T.royalBurgundy : "transparent", color: dlPeriod === p ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
                        {p}
                      </motion.button>
                    ))}
                  </div>
                </div>
                {/* Weavers dropdown */}
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 8 }}>Filter by Weaver</div>
                  <div style={{ position: "relative" }}>
                    <motion.button onClick={() => { setDlWeaverOpen(p => !p); setDlDefectOpen(false); }} whileHover={{ backgroundColor: "rgba(110,15,45,0.05)" }}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", border: `1.5px solid ${T.borderDef}`, borderRadius: 11, background: "#FFFDF9", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, cursor: "pointer" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <PhUsers size={16} color={T.taupe} /> {dlWeaver}
                      </span>
                      <PhCaretDown size={14} color={T.taupe} weight="bold" />
                    </motion.button>
                    {dlWeaverOpen && (
                      <div style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 50, background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.13)", overflow: "hidden" }}>
                        {["All Weavers", "Padma Veni", "Ravi Kumar", "Suresh Murti", "Own Factory"].map(w => (
                          <button key={w} onClick={() => { setDlWeaver(w); setDlWeaverOpen(false); }}
                            style={{ display: "block", width: "100%", padding: "11px 16px", background: dlWeaver === w ? T.warmCream : "#FFFDF9", border: "none", textAlign: "left", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, cursor: "pointer", fontWeight: dlWeaver === w ? 700 : 400 }}>
                            {w}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Defect type dropdown */}
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 8 }}>Filter by Defect Type</div>
                  <div style={{ position: "relative" }}>
                    <motion.button onClick={() => { setDlDefectOpen(p => !p); setDlWeaverOpen(false); }} whileHover={{ backgroundColor: "rgba(110,15,45,0.05)" }}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", border: `1.5px solid ${T.borderDef}`, borderRadius: 11, background: "#FFFDF9", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, cursor: "pointer" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <SealWarning size={16} color={T.taupe} weight="duotone" /> {dlDefectType}
                      </span>
                      <PhCaretDown size={14} color={T.taupe} weight="bold" />
                    </motion.button>
                    {dlDefectOpen && (
                      <div style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 50, background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.13)", overflow: "hidden" }}>
                        {["All Defect Types", "Thread Break", "Design Error", "Jari Issue", "Weight Problem", "Measurement Error"].map(d => (
                          <button key={d} onClick={() => { setDlDefectType(d); setDlDefectOpen(false); }}
                            style={{ display: "block", width: "100%", padding: "11px 16px", background: dlDefectType === d ? T.warmCream : "#FFFDF9", border: "none", textAlign: "left", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, cursor: "pointer", fontWeight: dlDefectType === d ? 700 : 400 }}>
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "rgba(192,57,43,0.07)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 11, padding: "14px 16px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.crimson, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Defective Sarees</div>
                    <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: T.crimson }}>{DEFECTIVE_DATA.length}</div>
                  </div>
                  <div style={{ background: "rgba(200,155,71,0.07)", border: "1px solid rgba(200,155,71,0.22)", borderRadius: 11, padding: "14px 16px" }}>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: "#8B6018", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Total Deductions</div>
                    <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: "#8B6018" }}>₹{DEFECTIVE_DATA.reduce((s, r) => s + parseInt(r.deduction.replace(/[₹,]/g, "")), 0).toLocaleString("en-IN")}</div>
                  </div>
                </div>
                {/* Download button */}
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowDownloadDialog(false)}
                    style={{ flex: 2, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${T.antiqueGold} 0%, #B88730 100%)`, color: T.deepWine, border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(200,155,71,0.30)" }}>
                    <DownloadSimple size={18} weight="bold" /> Download PDF Report
                  </motion.button>
                  <motion.button onClick={() => setShowDownloadDialog(false)} whileHover={{ scale: 1.02 }}
                    style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                    Cancel
                  </motion.button>
                </div>
              </div>
            </ProductionDialog>
          )}
        </AnimatePresence>

        {/* ── View Defective Saree Dialog ── */}
        <AnimatePresence>
          {viewDefect && (
            <ProductionDialog open title="Defective Saree — Details" onClose={() => setViewDefect(null)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Defect badge */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {viewDefect.defects.map(d => (
                    <span key={d} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.crimson, background: "rgba(192,57,43,0.09)", border: "1px solid rgba(192,57,43,0.22)", padding: "6px 14px", borderRadius: 99 }}>
                      <SealWarning size={14} color={T.crimson} weight="fill" /> {d}
                    </span>
                  ))}
                </div>
                {/* Details grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Saree ID",    val: viewDefect.id,       mono: true  },
                    { label: "Weaver",      val: viewDefect.weaver,   mono: false },
                    { label: "Batch",       val: viewDefect.batch,    mono: true  },
                    { label: "Design Code", val: viewDefect.design,   mono: true  },
                    { label: "Saree Type",  val: viewDefect.sareeType, mono: false },
                    { label: "QC Date",     val: viewDefect.qcDate,   mono: false },
                  ].map(r => (
                    <div key={r.label} style={{ background: T.warmCream, borderRadius: 10, padding: "11px 14px" }}>
                      <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{r.label}</div>
                      <div style={{ fontFamily: r.mono ? F.mono : F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown }}>{r.val}</div>
                    </div>
                  ))}
                </div>
                {/* Deduction */}
                <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 11, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Deduction Applied to Weaver</div>
                    <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: T.crimson }}>{viewDefect.deduction}</div>
                  </div>
                  <SealWarning size={36} color={T.crimson} weight="duotone" />
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(200,155,71,0.08)", border: `1px solid rgba(200,155,71,0.25)`, borderRadius: 10, padding: "12px 14px" }}>
                  <WarningCircle size={16} color={T.antiqueGold} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: "#8B6018", lineHeight: 1.5 }}>
                    This saree is stored separately in the defective stock area. Deduction has been automatically applied to the weaver's payment record.
                  </div>
                </div>
                <motion.button onClick={() => setViewDefect(null)} whileHover={{ scale: 1.02 }}
                  style={{ height: 46, background: G.button, color: "#FFFDF9", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Close
                </motion.button>
              </div>
            </ProductionDialog>
          )}
        </AnimatePresence>
      </section>
    </FadeUp>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — PRODUCTION ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════
const WEEKLY_DATA = [
  { week: "W1", produced: 58, dispatched: 45 },
  { week: "W2", produced: 64, dispatched: 50 },
  { week: "W3", produced: 72, dispatched: 55 },
  { week: "W4", produced: 54, dispatched: 42 },
];
const STAGE_FUNNEL = [
  { label: "Weaving in Progress",    count: 14, color: "#C4923A",    widthPct: 100 },
  { label: "Submitted — Waiting QC", count: 5,  color: T.blueGray,   widthPct: 62  },
  { label: "Quality Check Passed",   count: 3,  color: T.green,      widthPct: 42  },
  { label: "In Stock — Ready for Sale", count: 2,  color: T.green, widthPct: 26  },
];
const TOP_WEAVERS_CHART = [
  { name: "Padma Veni",   initials: "PV", bg: "#C4923A",       sarees: 18 },
  { name: "Kamala B.",    initials: "KB", bg: T.darkBurgundy,  sarees: 14 },
  { name: "Ravi Kumar",   initials: "RK", bg: T.royalBurgundy, sarees: 12 },
  { name: "Lakshmi D.",   initials: "LD", bg: "#A0506A",       sarees: 11 },
  { name: "Suresh Murti", initials: "SM", bg: T.taupe,         sarees: 7  },
];
const DESIGN_DONUT = [
  { name: "BKB-045", label: "Cream Zari Border",  value: 28, color: T.royalBurgundy },
  { name: "BKB-031", label: "Maroon Heavy Border", value: 22, color: T.antiqueGold  },
  { name: "BKB-022", label: "Cream Plain Silk",    value: 18, color: T.green         },
  { name: "BKB-038", label: "Blue Zari Checks",    value: 16, color: T.blueGray      },
  { name: "Others",  label: "Other Designs",       value: 16, color: T.taupe         },
];
const ORDER_PROGRESS = [
  { name: "Lakshmi Silks",          done: 76, total: 80 },
  { name: "Vijaya Silk House",       done: 28, total: 30 },
  { name: "Padmavathi Textiles",     done: 42, total: 60 },
  { name: "Narayana Silk Emporium",  done: 18, total: 25 },
  { name: "Meenakshi Silks",         done: 15, total: 40 },
  { name: "Kalavathi Exports",       done: 8,  total: 35 },
];
const ANALYTICS_PERIODS = ["This Week", "This Month", "Last 3 Months", "This Year"];

const CARD_STYLE: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 18,
  border: `1.5px solid ${T.borderDef}`,
  padding: "24px 26px",
  boxShadow: "0 4px 18px rgba(74,6,27,0.07)",
  display: "flex",
  flexDirection: "column",
};

function ChartCardHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 22 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.3, marginBottom: 3 }}>{title}</div>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.4 }}>{sub}</div>
      </div>
    </div>
  );
}

function ProductionAnalyticsSection() {
  const [period, setPeriod] = useState("This Month");
  const maxWeekly = Math.max(...WEEKLY_DATA.map(d => d.produced));
  const maxWeaverSarees = TOP_WEAVERS_CHART[0].sarees;
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("PDF");
  const [exportIncludes, setExportIncludes] = useState<Record<string, boolean>>({
    "Weekly Production": true,
    "Stage Pipeline": true,
    "Top Weavers": true,
    "Design-wise Breakdown": true,
    "Bulk Order Progress": false,
  });

  return (
    <div id="prod-analytics" style={{ padding: "32px 40px 0" }}>
      <FadeUp>

        {/* ── Section header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 28, background: T.antiqueGold, borderRadius: 99 }} />
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, letterSpacing: "-0.2px" }}>Production Analytics</h2>
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, margin: "0 0 0 16px", lineHeight: 1.6 }}>
              Charts and numbers showing how production is going this month — weekly output, stage pipeline, top weavers, designs, and bulk orders.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginTop: 4 }}>
            {ANALYTICS_PERIODS.map(p => (
              <motion.button key={p} onClick={() => setPeriod(p)} whileHover={{ scale: 1.02 }}
                style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 99, cursor: "pointer", background: period === p ? T.royalBurgundy : "transparent", color: period === p ? "#FFFDF9" : T.taupe, border: period === p ? "none" : `1px solid rgba(110,15,45,0.18)`, transition: "all 0.18s" }}>
                {p}
              </motion.button>
            ))}
            <motion.button onClick={() => setShowExportDialog(true)} whileHover={{ scale: 1.02, backgroundColor: "rgba(200,155,71,0.20)" }} style={{ display: "flex", alignItems: "center", gap: 7, background: T.warmCream, border: `1.5px solid ${T.borderGold}`, borderRadius: 10, padding: "8px 16px", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, cursor: "pointer" }}>
              <DownloadSimple size={16} color={T.antiqueGold} weight="bold" /> Export Report
            </motion.button>
          </div>
        </div>

        {/* ── Row 1 — 3 equal cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20, alignItems: "stretch" }}>

          {/* Card 1 — Weekly Production Bar Chart */}
          <div style={{ ...CARD_STYLE }}>
            <ChartCardHeader
              icon={<ChartBar size={22} color={T.royalBurgundy} weight="duotone" />}
              title="Sarees Produced Each Week"
              sub="Produced vs dispatched — this month"
            />

            {/* Bars */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flex: 1, minHeight: 180 }}>
              {WEEKLY_DATA.map(d => (
                <div key={d.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  {/* Value labels */}
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, fontWeight: 700 }}>{d.produced}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>/{d.dispatched}</span>
                  </div>
                  {/* Bar group */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130, width: "100%", justifyContent: "center" }}>
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(d.produced / maxWeekly) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ width: 22, background: `linear-gradient(180deg, ${T.royalBurgundy} 0%, #9A1A40 100%)`, borderRadius: "5px 5px 0 0", minHeight: 6 }}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(d.dispatched / maxWeekly) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ width: 22, background: `linear-gradient(180deg, ${T.antiqueGold} 0%, #B88730 100%)`, borderRadius: "5px 5px 0 0", minHeight: 6, opacity: 0.9 }}
                    />
                  </div>
                  {/* Week label */}
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.taupe }}>{d.week}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 20, marginTop: 16, justifyContent: "center" }}>
              {[{ color: T.royalBurgundy, label: "Produced" }, { color: T.antiqueGold, label: "Dispatched" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2 — Stage Pipeline Funnel */}
          <div style={{ ...CARD_STYLE }}>
            <ChartCardHeader
              icon={<FunnelSimple size={22} color={T.royalBurgundy} weight="duotone" />}
              title="Where Are All Batches Right Now"
              sub="All 24 active batches by production stage"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, justifyContent: "center" }}>
              {STAGE_FUNNEL.map((s, i) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{s.label}</span>
                    <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: s.color, minWidth: 32, textAlign: "right" }}>{s.count}</span>
                  </div>
                  <div style={{ height: 14, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.widthPct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ height: "100%", background: s.color, borderRadius: 99 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, background: T.warmCream, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>Total active batches</span>
              <span style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.luxuryBrown }}>24</span>
            </div>
          </div>

          {/* Card 3 — Top Weavers */}
          <div style={{ ...CARD_STYLE }}>
            <ChartCardHeader
              icon={<Trophy size={22} color={T.royalBurgundy} weight="duotone" />}
              title="Top 5 Weavers This Month"
              sub="Ranked by number of sarees produced"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" }}>
              {TOP_WEAVERS_CHART.map((w, i) => (
                <div key={w.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Rank badge */}
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: i === 0 ? "rgba(200,155,71,0.18)" : "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: i === 0 ? T.antiqueGold : T.taupe }}>{i + 1}</span>
                  </div>
                  <Pip initials={w.initials} bg={w.bg} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 700, marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</div>
                    <div style={{ height: 9, background: "rgba(110,15,45,0.08)", borderRadius: 99, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(w.sarees / maxWeaverSarees) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ height: "100%", background: `linear-gradient(90deg,${T.royalBurgundy},#A04060)`, borderRadius: 99 }}
                      />
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown }}>{w.sarees}</span>
                    <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>sarees</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2 — Bulk Order Progress ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, alignItems: "stretch" }}>

          {/* Card 5 — Bulk Order Progress Bars */}
          <div style={{ ...CARD_STYLE }}>
            <ChartCardHeader
              icon={<ShoppingBag size={22} color={T.royalBurgundy} weight="duotone" />}
              title="Bulk Order Production Progress"
              sub="Sarees produced so far for each wholesale order"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" }}>
              {ORDER_PROGRESS.map(o => {
                const pct = Math.round((o.done / o.total) * 100);
                const color = pct > 80 ? T.green : pct >= 50 ? "#C4923A" : T.crimson;
                return (
                  <div key={o.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 700 }}>{o.name}</span>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{o.done}/{o.total}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color, minWidth: 42, textAlign: "right" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 12, background: "rgba(110,15,45,0.07)", borderRadius: 99, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{ height: "100%", background: color, borderRadius: 99 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Export Analytics Report Dialog ── */}
        <AnimatePresence>
          {showExportDialog && (
            <ProductionDialog open title="Export Production Report" onClose={() => setShowExportDialog(false)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Period info */}
                <div style={{ background: T.warmCream, borderRadius: 11, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <ChartBar size={18} color={T.royalBurgundy} weight="duotone" />
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Reporting Period</div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{period}</div>
                  </div>
                </div>
                {/* What to include */}
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Include in Report</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(exportIncludes).map(([key, checked]) => (
                      <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "10px 14px", borderRadius: 10, background: checked ? "rgba(110,15,45,0.05)" : "transparent", border: `1px solid ${checked ? "rgba(110,15,45,0.18)" : T.borderDef}`, transition: "all 0.15s" }}>
                        <input type="checkbox" checked={checked} onChange={() => setExportIncludes(prev => ({ ...prev, [key]: !prev[key] }))}
                          style={{ width: 16, height: 16, accentColor: T.royalBurgundy, cursor: "pointer" }} />
                        <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: checked ? 700 : 400, color: checked ? T.luxuryBrown : T.taupe }}>{key}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Format */}
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Export Format</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["PDF", "Excel (.xlsx)", "CSV"].map(fmt => (
                      <motion.button key={fmt} onClick={() => setExportFormat(fmt)} whileHover={{ scale: 1.03 }}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: exportFormat === fmt ? "none" : `1.5px solid ${T.borderDef}`, background: exportFormat === fmt ? T.royalBurgundy : "transparent", color: exportFormat === fmt ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.18s" }}>
                        {fmt}
                      </motion.button>
                    ))}
                  </div>
                </div>
                {/* Action buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowExportDialog(false)}
                    style={{ flex: 2, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${T.antiqueGold} 0%, #B88730 100%)`, color: T.deepWine, border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(200,155,71,0.28)" }}>
                    <DownloadSimple size={18} weight="bold" /> Generate &amp; Download
                  </motion.button>
                  <motion.button onClick={() => setShowExportDialog(false)} whileHover={{ scale: 1.02 }}
                    style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                    Cancel
                  </motion.button>
                </div>
              </div>
            </ProductionDialog>
          )}
        </AnimatePresence>

      </FadeUp>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// SECTION — PRODUCTION HISTORY
// ══════════════════════════════════════════════════════════════════════════════
type HistoryStatus = "Printing Completed" | "Printing In Process" | "Challenge in Progress";

interface HistoryBatch {
  id: string;
  designCode: string;
  sareeType: string;
  batchSize: number;
  weavers: Array<{ initials: string; bg: string }>;
  completion: number;
  allPieces: number;
  okPieces: number | null;
  found: number | null;
  status: HistoryStatus;
  makingCharges: string;
  completedOn: string;
  bulkOrder?: string;
}

const HISTORY_BATCHES: HistoryBatch[] = [
  { id: "BATCH-448", designCode: "808-048", sareeType: "Self Brocade 336 ORS", batchSize: 4, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "RK", bg: T.royalBurgundy }], completion: 5, allPieces: 5, okPieces: 0,    found: 0,    status: "Printing Completed",    makingCharges: "₹1,25,000", completedOn: "30 May 2025", bulkOrder: "BO-12" },
  { id: "BATCH-476", designCode: "808-048", sareeType: "Self Brocade 282 ORS", batchSize: 4, weavers: [{ initials: "SM", bg: T.taupe },    { initials: "AK", bg: "#B45309"       }], completion: 4, allPieces: 4, okPieces: 0,    found: 0,    status: "Printing Completed",    makingCharges: "₹1,25,000", completedOn: "30 May 2025" },
  { id: "BATCH-074", designCode: "808-048", sareeType: "Stripe Space 082 ORS", batchSize: 4, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "SM", bg: T.taupe          }], completion: 4, allPieces: 4, okPieces: 2,    found: 1,    status: "Printing In Process",   makingCharges: "₹75,000",   completedOn: "02 Apr 2025" },
  { id: "BATCH-081", designCode: "808-088", sareeType: "Heavy Zari 741 ORS",   batchSize: 4, weavers: [{ initials: "RK", bg: T.royalBurgundy }, { initials: "AK", bg: "#B45309"  }], completion: 5, allPieces: 5, okPieces: 0,    found: 1,    status: "Challenge in Progress", makingCharges: "₹1,50,000", completedOn: "04 May 2025" },
  { id: "BATCH-147", designCode: "808-048", sareeType: "Heavy Zari 741 ORS",   batchSize: 2, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "RK", bg: T.royalBurgundy }], completion: 2, allPieces: 2, okPieces: 1,    found: 1,    status: "Challenge in Progress", makingCharges: "₹30,000",   completedOn: "15 May 2025" },
  { id: "BATCH-148", designCode: "808-088", sareeType: "Plane 344 ORS",         batchSize: 4, weavers: [{ initials: "SM", bg: T.taupe },    { initials: "AK", bg: "#B45309"       }], completion: 3, allPieces: 3, okPieces: 0,    found: 1,    status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "25 Apr 2025" },
  { id: "BATCH-167", designCode: "808-048", sareeType: "Heavy Zari 741 ORS",   batchSize: 4, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "SM", bg: T.taupe          }], completion: 3, allPieces: 3, okPieces: 1,    found: 1,    status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "11 May 2025" },
  { id: "BATCH-179", designCode: "808-048", sareeType: "Stripe Space 082 ORS", batchSize: 4, weavers: [{ initials: "RK", bg: T.royalBurgundy }, { initials: "AK", bg: "#B45309"  }], completion: 3, allPieces: 3, okPieces: null, found: null, status: "Printing Completed",    makingCharges: "₹80,000",   completedOn: "25 Apr 2025" },
  { id: "BATCH-354", designCode: "808-048", sareeType: "Happy Zari 741 ORS",   batchSize: 2, weavers: [{ initials: "PV", bg: "#7C3AED" }, { initials: "RK", bg: T.royalBurgundy }], completion: 2, allPieces: 2, okPieces: null, found: null, status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "07 Apr 2025" },
  { id: "BATCH-304", designCode: "808-048", sareeType: "Stripe Space 082 ORS", batchSize: 2, weavers: [{ initials: "SM", bg: T.taupe },    { initials: "AK", bg: "#B45309"       }], completion: 2, allPieces: 2, okPieces: null, found: null, status: "Challenge in Progress", makingCharges: "₹80,000",   completedOn: "07 Apr 2025" },
];

function HistoryBatchSquares({ size }: { size: number }) {
  const colors = ["#7C3AED", T.royalBurgundy, T.taupe, "#B45309"];
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 56 }}>
      {Array.from({ length: Math.min(size, 4) }).map((_, i) => (
        <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length], opacity: 0.85 }} />
      ))}
    </div>
  );
}

function HistoryDropBtn({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", border: `1px solid ${T.borderDef}`, borderRadius: 7, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown, cursor: "pointer", whiteSpace: "nowrap" }}>
      {icon}{label}<ChevronDown size={14} style={{ color: T.taupe }} />
    </button>
  );
}

function ProductionHistorySection({ onDesignClick, onSareeTypeClick }: CodeCallbacks) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [rPeriod, setRPeriod] = useState("This Month");
  const [rFormat, setRFormat] = useState("PDF");
  const [rWeavers, setRWeavers] = useState("All Weavers");
  const [rIncludes, setRIncludes] = useState<Record<string, boolean>>({
    "Batch Summary": true,
    "Making Charges Breakdown": true,
    "Weaver-wise Totals": true,
    "Design-wise Report": false,
    "Defect Analysis": false,
  });

  const TH: React.CSSProperties = { fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.6px", padding: "10px 14px", textAlign: "left" as const, background: "#F3EEE8", borderBottom: `2px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, padding: "11px 14px", verticalAlign: "middle" as const, whiteSpace: "nowrap" as const };

  return (
    <div id="prod-history" style={{ padding: "40px 40px 0" }}>
      <FadeUp>
        {/* Section header bar */}
        <div style={{ background: T.darkBurgundy, borderRadius: "12px 12px 0 0", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="7" fill="rgba(200,155,71,0.18)" />
              <rect x="7" y="9"  width="20" height="3" rx="1.5" fill={T.antiqueGold} />
              <rect x="7" y="22" width="20" height="3" rx="1.5" fill={T.antiqueGold} />
              <rect x="11"  y="12" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
              <rect x="14.5" y="12" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
              <rect x="18"  y="12" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
              <rect x="21.5" y="12" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
            </svg>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,253,249,0.45)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 2 }}>COMPLETED BATCHES · RECORDS</div>
              <h2 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Production History</h2>
            </div>
          </div>
          <motion.button onClick={() => setShowReportDialog(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: `linear-gradient(135deg, ${T.antiqueGold} 0%, ${T.goldLight} 100%)`, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.deepWine, boxShadow: "0 2px 12px rgba(200,155,71,0.30)" }}>
            <Download size={14} />Generate Production Report
          </motion.button>
        </div>

        {/* Filter bar */}
        <div style={{ background: "#fff", padding: "12px 24px", borderLeft: `1px solid ${T.borderDef}`, borderRight: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
          <HistoryDropBtn label="30 Apr 2026 – 30 Apr 2026" icon={<Calendar size={14} style={{ color: T.royalBurgundy }} />} />
          <HistoryDropBtn label="All Saree Types" />
          <HistoryDropBtn label="All Weavers" icon={<Users size={14} style={{ color: T.royalBurgundy }} />} />
          <HistoryDropBtn label="All Orders" />
          <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches..."
              style={{ width: "100%", padding: "7px 12px 7px 32px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "#FAFAFA", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ background: T.silkCream, padding: "10px 24px", borderLeft: `1px solid ${T.borderDef}`, borderRight: `1px solid ${T.borderDef}`, borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>
            Showing <strong style={{ color: T.luxuryBrown }}>1 to 10</strong> of <strong style={{ color: T.luxuryBrown }}>25</strong> completed batches
          </span>
          <div style={{ display: "flex", gap: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Completed:</span>
              <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>25</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Making Charges:</span>
              <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>₹9,24,930</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", border: `1px solid ${T.borderDef}`, borderTop: "none", borderRadius: "0 0 12px 12px", boxShadow: "0 4px 16px rgba(74,6,27,0.07)", background: T.warmIvory }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1060 }}>
            <thead>
              <tr>
                <th style={TH}>Batch Number</th>
                <th style={TH}>Design Code</th>
                <th style={TH}>Saree Type</th>
                <th style={{ ...TH, textAlign: "center" }}>Batch Size</th>
                <th style={TH}>Weavers</th>
                <th style={{ ...TH, textAlign: "center" }}>Completion</th>
                <th style={{ ...TH, textAlign: "center" }}>All Pieces</th>
                <th style={{ ...TH, textAlign: "right" }}>Making Charges</th>
                <th style={TH}>Completed On</th>
                <th style={{ ...TH, textAlign: "center" }}>Bulk Order</th>
                <th style={{ ...TH, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY_BATCHES.filter(b =>
                !search || b.id.toLowerCase().includes(search.toLowerCase()) || b.sareeType.toLowerCase().includes(search.toLowerCase())
              ).map((b, i) => (
                <tr key={b.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : "#F8F4EF", borderBottom: `1px solid ${T.borderDef}` }}>
                  <td style={TD}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{b.id}</span>
                  </td>
                  <td style={TD}>
                    <ClickableCode onClick={onDesignClick ? () => onDesignClick(b.designCode) : undefined} style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>{b.designCode}</ClickableCode>
                  </td>
                  <td style={TD}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <rect x="1" y="3" width="12" height="8" rx="1.5" stroke={T.antiqueGold} strokeWidth="1.2" fill="none" />
                        <line x1="1" y1="5.5" x2="13" y2="5.5" stroke={T.antiqueGold} strokeWidth="0.8" />
                        <line x1="1" y1="8.5" x2="13" y2="8.5" stroke={T.antiqueGold} strokeWidth="0.8" />
                      </svg>
                      {(() => {
                        const rec = getSareeTypeByName(b.sareeType);
                        return (
                          <ClickableCode onClick={rec && onSareeTypeClick ? () => onSareeTypeClick(rec.code) : undefined} style={{ fontSize: 12.5, fontWeight: 500 }}>{b.sareeType}</ClickableCode>
                        );
                      })()}
                    </div>
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <HistoryBatchSquares size={b.batchSize} />
                    </div>
                  </td>
                  <td style={TD}>
                    <div style={{ display: "flex" }}>
                      {b.weavers.map((w, wi) => (
                        <div key={wi} style={{ marginLeft: wi > 0 ? -8 : 0 }}>
                          <Pip initials={w.initials} bg={w.bg} size={26} />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14 }}>{b.completion}</span>
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>{b.allPieces}</span>
                  </td>
                  <td style={{ ...TD, textAlign: "right" }}>
                    <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 13 }}>{b.makingCharges}</span>
                  </td>
                  <td style={TD}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{b.completedOn}</span>
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    {b.bulkOrder
                      ? <span style={{ fontFamily: F.mono, fontSize: 11, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, padding: "2px 7px", borderRadius: 5, fontWeight: 600 }}>{b.bulkOrder}</span>
                      : <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, fontStyle: "italic" }}>General Stock</span>}
                  </td>
                  <td style={{ ...TD, textAlign: "center" }}>
                    <motion.button whileHover={{ scale: 1.08 }} style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${T.borderDef}`, background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.royalBurgundy }}>
                      <Eye size={13} />
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: `1px solid ${T.borderDef}` }}>
            <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Showing 1 to 10 of 25 entries</span>
            <div style={{ display: "flex", gap: 4 }}>
              {["Prev", "1", "2", "3", "Next"].map(p => (
                <button key={p} onClick={() => typeof p === "string" && !isNaN(Number(p)) && setCurrentPage(Number(p))}
                  style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${p === String(currentPage) ? T.royalBurgundy : T.borderDef}`, background: p === String(currentPage) ? T.royalBurgundy : "#fff", color: p === String(currentPage) ? "#FFFDF9" : T.luxuryBrown, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  {p}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Rows per page</span>
              <HistoryDropBtn label="10" />
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ── Generate Production Report Dialog ── */}
      <AnimatePresence>
        {showReportDialog && (
          <ProductionDialog open title="Generate Production Report" onClose={() => setShowReportDialog(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Period */}
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Report Period</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Today", "This Week", "This Month", "Last 3 Months", "This Year"].map(p => (
                    <motion.button key={p} onClick={() => setRPeriod(p)} whileHover={{ scale: 1.03 }}
                      style={{ padding: "8px 14px", borderRadius: 99, border: rPeriod === p ? "none" : `1.5px solid rgba(110,15,45,0.18)`, background: rPeriod === p ? T.royalBurgundy : "transparent", color: rPeriod === p ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>
                      {p}
                    </motion.button>
                  ))}
                </div>
              </div>
              {/* Weavers filter */}
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 8 }}>Filter by Weaver</div>
                <select value={rWeavers} onChange={e => setRWeavers(e.target.value)}
                  style={{ width: "100%", height: 44, padding: "0 14px", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: T.warmIvory, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, outline: "none" }}>
                  <option>All Weavers</option>
                  <option>Padma Veni</option>
                  <option>Ravi Kumar</option>
                  <option>Suresh Murti</option>
                  <option>Anand K.</option>
                  <option>Own Factory</option>
                </select>
              </div>
              {/* What to include */}
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Include in Report</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {Object.entries(rIncludes).map(([key, checked]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "9px 14px", borderRadius: 10, background: checked ? "rgba(110,15,45,0.05)" : "transparent", border: `1px solid ${checked ? "rgba(110,15,45,0.16)" : T.borderDef}`, transition: "all 0.15s" }}>
                      <input type="checkbox" checked={checked} onChange={() => setRIncludes(prev => ({ ...prev, [key]: !prev[key] }))}
                        style={{ width: 16, height: 16, accentColor: T.royalBurgundy, cursor: "pointer" }} />
                      <span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: checked ? 700 : 400, color: checked ? T.luxuryBrown : T.taupe }}>{key}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Format */}
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, marginBottom: 10 }}>Export Format</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {["PDF", "Excel (.xlsx)", "CSV"].map(fmt => (
                    <motion.button key={fmt} onClick={() => setRFormat(fmt)} whileHover={{ scale: 1.03 }}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: rFormat === fmt ? "none" : `1.5px solid ${T.borderDef}`, background: rFormat === fmt ? T.royalBurgundy : "transparent", color: rFormat === fmt ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.18s" }}>
                      {fmt}
                    </motion.button>
                  ))}
                </div>
              </div>
              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowReportDialog(false)}
                  style={{ flex: 2, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${T.antiqueGold} 0%, #B88730 100%)`, color: T.deepWine, border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(200,155,71,0.28)" }}>
                  <Download size={17} /> Generate &amp; Download
                </motion.button>
                <motion.button onClick={() => setShowReportDialog(false)} whileHover={{ scale: 1.02 }}
                  style={{ flex: 1, height: 46, background: "transparent", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                  Cancel
                </motion.button>
              </div>
            </div>
          </ProductionDialog>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ══════════════════════════════════════════════════════════════════════════════
function ProductionFooter() {
  const [email, setEmail] = useState("");
  const cols = [
    { title: "Quick Links", links: ["Overview", "Materials", "Weavers", "Production", "Payments"] },
    { title: "Support",     links: ["Contact Support", "Training Updates", "Get Help", "FAQs"] },
    { title: "Legal",       links: ["Privacy Policy", "Terms of Use", "Compliance", "Data Policy"] },
  ];
  return (
    <footer style={{ background: T.darkBurgundy, paddingTop: 52, marginTop: 52 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 40px 40px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr", gap: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <img src={imgBKBLogo} alt="BKB Logo" style={{ width: 36, height: 36, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            <div>
              <div style={{ fontFamily: F.display, fontSize: 16, color: "#FFFDF9", lineHeight: 1.2 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.display, fontSize: 16, color: "#FFFDF9", lineHeight: 1.2 }}>&amp; Brothers Silks</div>
            </div>
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,253,249,0.50)", lineHeight: 1.6, marginBottom: 20, maxWidth: 240 }}>Tracking every saree from loom to delivery. Preserving traditional silk weaving since 1999.</div>
          <div style={{ display: "flex", gap: 12 }}>
            {[Facebook, Instagram, Youtube, Linkedin].map((Icon, i) => (
              <motion.div key={i} whileHover={{ scale: 1.15 }} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,253,249,0.10)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon size={14} color="rgba(255,253,249,0.70)" />
              </motion.div>
            ))}
          </div>
        </div>
        {cols.map(c => (
          <div key={c.title}>
            <div style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 16 }}>{c.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {c.links.map(l => (
                <motion.span key={l} whileHover={{ x: 3 }} style={{ fontFamily: F.ui, fontSize: 12.5, color: "rgba(255,253,249,0.55)", cursor: "pointer", display: "block" }}>{l}</motion.span>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: T.antiqueGold, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 16 }}>Need Help?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={13} color={T.antiqueGold} /><span style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.70)" }}>+91 70428 78199</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={13} color={T.antiqueGold} /><span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.70)" }}>Admin@beerekeshava.in</span></div>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,253,249,0.35)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Newsletter</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address"
              style={{ fontFamily: F.ui, fontSize: 12, color: "#FFFDF9", background: "rgba(255,253,249,0.07)", border: "1px solid rgba(255,253,249,0.14)", borderRadius: 10, padding: "9px 12px", outline: "none", width: "100%", boxSizing: "border-box" }} />
            <motion.button initial={{ backgroundColor: T.royalBurgundy }} animate={{ backgroundColor: T.royalBurgundy }} whileHover={{ scale: 1.02, backgroundColor: "#5A0A24" }} whileTap={{ scale: 0.97 }}
              style={{ color: "#FFFDF9", border: "none", borderRadius: 10, padding: "9px 0", fontFamily: F.ui, fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%" }}>
              Subscribe
            </motion.button>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,253,249,0.08)", padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: F.ui, fontSize: 11.5, color: "rgba(255,253,249,0.35)" }}>© 2026 Beere Kesava &amp; Brothers Silks. All rights reserved.</div>
        <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(255,253,249,0.25)", letterSpacing: "2px", textTransform: "uppercase" }}>TRADITION · TIMELESS QUALITY</div>
      </div>
    </footer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════════
// ── Design Library link card (replaces inline DesignLibrarySection) ──────────
function DesignLibraryLinkCard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  return (
    <div style={{ padding: "32px 48px 0" }}>
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 18px rgba(74,6,27,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Swatches size={28} color="#FFFDF9" weight="duotone" />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown, marginBottom: 4 }}>Design Library</div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.5 }}>
                View all design codes, color slip photos, design graphs, and weaver notes. Design Library has moved to its own dedicated page.
              </div>
            </div>
          </div>
          <motion.button onClick={() => onNavigate?.("Designs")}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 22px", background: `linear-gradient(135deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, color: "#FFFDF9", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            Open Design Library <ArrowRight size={15} weight="bold" />
          </motion.button>
        </div>
      </FadeUp>
    </div>
  );
}

export function ProductionPage({ superadmin = false, onNavigate }: { superadmin?: boolean; onNavigate?: (tab: string) => void }) {
  const { getDesign } = useDesignLibrary();
  const [openDesignCode, setOpenDesignCode] = useState<string | null>(null);
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);
  const openDesign = openDesignCode ? getDesign(openDesignCode) : undefined;
  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;

  return (
    <div style={{ fontFamily: F.ui }}>
      <PageHeader />
      <StatsStrip />
      <div style={{ background: T.silkCream, paddingBottom: 0 }}>
        <BulkOrdersSection superadmin={superadmin} onNavigate={onNavigate} />
        <ActiveBatchesSection onNavigate={onNavigate} onDesignClick={setOpenDesignCode} onSareeTypeClick={setOpenSareeTypeCode} />
        <DefectiveSareesSection superadmin={superadmin} onNavigate={onNavigate} onDesignClick={setOpenDesignCode} onSareeTypeClick={setOpenSareeTypeCode} />
        <ProductionAnalyticsSection />
        <DesignLibraryLinkCard onNavigate={onNavigate} />
        <ProductionHistorySection onDesignClick={setOpenDesignCode} onSareeTypeClick={setOpenSareeTypeCode} />
      </div>
      <ProductionFooter />
      <AnimatePresence>
        {openDesign && <DesignCodeCard design={openDesign} onClose={() => setOpenDesignCode(null)} />}
        {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
      </AnimatePresence>
    </div>
  );
}
export function ProductionDialog({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(26,10,15,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ y: 18, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 18, scale: 0.96 }} onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: "100%", background: "#FFFFFF", borderRadius: 22, border: `1px solid ${T.borderDef}`, boxShadow: "0 30px 90px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", background: `linear-gradient(100deg, ${T.deepWine}, ${T.royalBurgundy})`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: F.display, fontSize: 21, color: "#FFFDF9", fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 26 }}>{children}</div>
      </motion.div>
    </motion.div>
  );
}

export function OrderDialogContent({ order, mode }: { order: BulkOrder; mode: "view" | "slip" }) {
  // Find match from PaymentsPage INVOICES
  const refMatch = order.ref.match(/ORD-\d{4}-(\d+)/) || order.ref.match(/ORD-(.*)/);
  const refNum = refMatch ? refMatch[1] : "";
  const matchedInvoice = INVOICES.find(inv => {
    const invMatch = inv.id.match(/INV-\d{4}-(\d+)/) || inv.id.match(/INV-(.*)/);
    const invNum = invMatch ? invMatch[1] : "";
    return invNum && invNum === refNum;
  }) || INVOICES.find(inv => inv.customer.toLowerCase() === order.customer.toLowerCase());

  const amountDue = matchedInvoice ? matchedInvoice.total : (order.amountDue ?? 0);
  const amountPaid = matchedInvoice ? matchedInvoice.paid : (order.amountPaid ?? 0);
  const balance = amountDue - amountPaid;

  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");

  if (mode === "slip") {
    const invoices = matchedInvoice ? [
      { id: matchedInvoice.id, date: matchedInvoice.invoiceDate, amount: matchedInvoice.total, status: matchedInvoice.status.toLowerCase() }
    ] : [
      { id: `INV-${refNum || "2026-101"}`, date: "20 May 2026", amount: amountDue, status: amountPaid === amountDue ? "paid" : amountPaid > 0 ? "partial" : "pending" }
    ].filter(i => i.amount > 0);

    const payments = matchedInvoice ? (matchedInvoice.payments || []) : (
      amountPaid > 0 ? [
        { amount: amountPaid, utr: "UTR202604229988", method: "RTGS", date: "16 May 2026", firmName: "Beere Kesava & Brothers Silks" }
      ] : []
    );

    return (
      <div style={{ fontFamily: F.ui, color: T.luxuryBrown, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 4 }}>Order Reference</div>
          <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.royalBurgundy }}>{order.ref}</div>
        </div>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 4 }}>Customer</div>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700 }}>{order.customer}</div>
        </div>

        <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "14px 16px", textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>Outstanding Balance</div>
          <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.antiqueGold }}>₹{balance.toLocaleString("en-IN")}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: "Est. Value", val: amountDue > 0 ? `₹${amountDue.toLocaleString("en-IN")}` : "—" },
            { label: "Amount Paid", val: amountPaid > 0 ? `₹${amountPaid.toLocaleString("en-IN")}` : "₹0" },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: "rgba(110,15,45,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(110,15,45,0.10)" }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Tab Toggle Buttons */}
        <div style={{ display: "flex", background: "rgba(110,15,45,0.05)", borderRadius: 12, padding: 4, border: `1px solid ${T.borderDef}` }}>
          <button
            onClick={() => setActiveTab("invoices")}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: 8,
              fontFamily: F.ui,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "invoices" ? "#FFFFFF" : "transparent",
              color: activeTab === "invoices" ? T.royalBurgundy : T.taupe,
              boxShadow: activeTab === "invoices" ? "0 4px 12px rgba(110,15,45,0.08)" : "none",
              transition: "all 0.2s"
            }}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: 8,
              fontFamily: F.ui,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "payments" ? "#FFFFFF" : "transparent",
              color: activeTab === "payments" ? T.royalBurgundy : T.taupe,
              boxShadow: activeTab === "payments" ? "0 4px 12px rgba(110,15,45,0.08)" : "none",
              transition: "all 0.2s"
            }}
          >
            Payment History ({payments.length})
          </button>
        </div>

        {/* Dynamic History Content Box */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "18px 20px", boxShadow: "0 2px 10px rgba(74,6,27,0.02)" }}>
          {activeTab === "invoices" ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13.5, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={16} color={T.royalBurgundy} /> Invoices
                </div>
              </div>
              {invoices.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, fontStyle: "italic", textAlign: "center", padding: "16px 0", background: T.silkCream, borderRadius: 10 }}>No invoices generated yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 160, overflowY: "auto", paddingRight: 4 }}>
                  {invoices.map((inv, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.warmIvory, borderRadius: 10, border: "1px solid rgba(110,15,45,0.06)", borderLeft: `4px solid ${inv.status === "paid" ? T.green : T.antiqueGold}` }}>
                      <div>
                        <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{inv.id}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>{inv.date}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>₹{inv.amount.toLocaleString("en-IN")}</div>
                        <span style={{ display: "inline-block", fontSize: 9.5, fontFamily: F.mono, fontWeight: 700, background: inv.status === "paid" ? "rgba(30,102,64,0.11)" : "rgba(200,155,71,0.11)", color: inv.status === "paid" ? T.green : T.antiqueGold, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", marginTop: 4 }}>{inv.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13.5, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 8 }}>
                  <Receipt size={16} color={T.royalBurgundy} /> Previous Payments
                </div>
              </div>
              {payments.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, fontStyle: "italic", textAlign: "center", padding: "16px 0", background: T.silkCream, borderRadius: 10 }}>No previous payments recorded.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 160, overflowY: "auto", paddingRight: 4 }}>
                  {payments.map((p, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", background: T.warmIvory, borderRadius: 10, border: "1px solid rgba(110,15,45,0.06)", borderLeft: `4px solid ${T.antiqueGold}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: T.royalBurgundy }}>₹{p.amount.toLocaleString("en-IN")}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, marginTop: 3 }}>{p.utr} · {p.method}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span style={{ fontSize: 9.5, fontFamily: F.mono, fontWeight: 700, background: "rgba(200,155,71,0.11)", color: T.antiqueGold, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{p.firmName || "Beere Kesava & Brothers Silks"}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
                            <CalendarClock size={11} /> {p.date}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: F.ui, color: T.luxuryBrown, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 4 }}>Order Reference</div>
        <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.royalBurgundy }}>{order.ref}</div>
      </div>
      <div>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 4 }}>Customer</div>
        <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700 }}>{order.customer}</div>
        {order.customerId && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{order.customerId}</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { label: "Total Sarees", val: String(order.total) },
          { label: "Completed", val: String(order.done) },
          { label: "Delivery Due", val: order.due },
          { label: "Status", val: order.status === "on-track" ? "On Track" : order.status === "at-risk" ? "At Risk" : "Overdue" },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: "rgba(110,15,45,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(110,15,45,0.10)" }}>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown }}>{val}</div>
          </div>
        ))}
      </div>
      {amountDue > 0 && (
        <div style={{ padding: "12px 14px", background: "rgba(200,155,71,0.07)", borderRadius: 10, border: "1px solid rgba(200,155,71,0.20)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px" }}>Est. Order Value</span>
          <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#8B6018" }}>₹{amountDue.toLocaleString("en-IN")}</span>
        </div>
      )}
      {order.instructions && (
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Special Instructions</div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: "rgba(110,15,45,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(110,15,45,0.10)" }}>{order.instructions}</div>
        </div>
      )}
      {order.photoUrls && order.photoUrls.length > 0 && (
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Attached Photos</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, background: "rgba(110,15,45,0.04)", borderRadius: 12, padding: "14px", border: "1px solid rgba(110,15,45,0.10)" }}>
            {order.photoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                <img src={url} alt={`Bulk order attachment ${i + 1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `1px solid ${T.borderDef}`, cursor: "pointer", transition: "transform 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


