import React, { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  Search, ChevronLeft, Package, CheckCircle2,
  Printer as LucidePrinter, Tag, X,
} from "lucide-react";
import {
  CheckCircle, WarningCircle, ArrowLeft, Hash, Palette,
  User as PhUser, CalendarBlank, Scales, ShoppingBag, Stack,
} from "@phosphor-icons/react";

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
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const G = {
  card:   "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
};
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay, opacity: { duration: 0.45 } }}
      style={style}>
      {children}
    </motion.div>
  );
}

// ── Stock data ──────────────────────────────────────────────────────────────
type StockStatus = "available" | "sold" | "wholesale";
interface StockSaree {
  id: string; source: "factory" | "outsourced";
  weaver: string | null; weaverCode: string | null;
  loom: number; weight: string; qcDate: string;
  design: string; sareeType: string; status: StockStatus;
  saleRef: string | null; customer: string | null;
  assignedBy: string | null; assignedAt: string | null;
  initials?: string; avatarBg?: string;
}

const ALL_STOCK: StockSaree[] = [
  { id: "RAVI-L2-001",   source: "outsourced", weaver: "Ravi Kumar",   weaverCode: "WV-001", loom: 2, weight: "842g", qcDate: "08 Jun 2026", design: "BKB-045", sareeType: "HZ-003 · Heavy Zari",   status: "available",  saleRef: null,           customer: null,                assignedBy: null,    assignedAt: null,                  initials: "RK", avatarBg: "#5A3E6B" },
  { id: "PADMA-L1-001",  source: "outsourced", weaver: "Padma Veni",   weaverCode: "WV-002", loom: 1, weight: "786g", qcDate: "07 Jun 2026", design: "BKB-022", sareeType: "PS-002 · Plain Silk",   status: "sold",       saleRef: "SAL-2026-041", customer: "Mrs. Kamala Reddy", assignedBy: "shop",  assignedAt: "Today · 11:42 AM",    initials: "PV", avatarBg: T.royalBurgundy },
  { id: "BKB-L3-001",    source: "factory",    weaver: null,           weaverCode: null,     loom: 3, weight: "910g", qcDate: "09 Jun 2026", design: "BKB-038", sareeType: "SB-001 · Self Brocade", status: "available",  saleRef: null,           customer: null,                assignedBy: null,    assignedAt: null,                  initials: "BK", avatarBg: T.darkBurgundy },
  { id: "SURESH-L2-001", source: "outsourced", weaver: "Suresh Murti", weaverCode: "WV-003", loom: 2, weight: "798g", qcDate: "06 Jun 2026", design: "BKB-019", sareeType: "BS-004 · Bridal",       status: "sold",       saleRef: "SAL-2026-038", customer: "Mrs. Anita Sharma", assignedBy: "admin", assignedAt: "Today · 10:15 AM",    initials: "SM", avatarBg: "#2D6B6B" },
  { id: "BKB-L1-001",    source: "factory",    weaver: null,           weaverCode: null,     loom: 1, weight: "864g", qcDate: "05 Jun 2026", design: "BKB-031", sareeType: "HZ-003 · Heavy Zari",   status: "wholesale",  saleRef: "ORD-2026-041", customer: "Lakshmi Silks",     assignedBy: "admin", assignedAt: "Yesterday · 3:20 PM", initials: "BK", avatarBg: T.deepWine },
  { id: "ANAND-L1-001",  source: "outsourced", weaver: "Anand K.",     weaverCode: "WV-005", loom: 1, weight: "752g", qcDate: "10 Jun 2026", design: "BKB-045", sareeType: "HZ-003 · Heavy Zari",   status: "available",  saleRef: null,           customer: null,                assignedBy: null,    assignedAt: null,                  initials: "AK", avatarBg: "#4A6B4A" },
  { id: "KAMALA-L2-001", source: "outsourced", weaver: "Kamala B.",    weaverCode: "WV-031", loom: 2, weight: "876g", qcDate: "04 Jun 2026", design: "BKB-045", sareeType: "HZ-003 · Heavy Zari",   status: "available",  saleRef: null,           customer: null,                assignedBy: null,    assignedAt: null,                  initials: "KB", avatarBg: "#7A2040" },
  { id: "MEENA-L1-001",  source: "outsourced", weaver: "Meena R.",     weaverCode: "WV-012", loom: 1, weight: "820g", qcDate: "03 Jun 2026", design: "BKB-038", sareeType: "SB-001 · Self Brocade", status: "available",  saleRef: null,           customer: null,                assignedBy: null,    assignedAt: null,                  initials: "MR", avatarBg: "#9B6B8A" },
  { id: "BKB-L2-002",    source: "factory",    weaver: null,           weaverCode: null,     loom: 2, weight: "934g", qcDate: "02 Jun 2026", design: "BKB-019", sareeType: "BS-004 · Bridal",       status: "wholesale",  saleRef: "ORD-2026-038", customer: "Padmavathi Textiles",assignedBy: "admin", assignedAt: "Yesterday · 1:10 PM", initials: "BK", avatarBg: T.darkBurgundy },
];

const STATUS_CFG: Record<StockStatus, { label: string; color: string; bg: string; border: string; topAccent: string }> = {
  available: { label: "In Stock — Available",    color: T.green,       bg: "rgba(30,102,64,0.09)",  border: "rgba(30,102,64,0.22)", topAccent: T.green       },
  sold:      { label: "Sold — Assign Finishing", color: "#8B6018",     bg: "rgba(200,155,71,0.12)", border: "rgba(200,155,71,0.30)", topAccent: T.antiqueGold },
  wholesale: { label: "Wholesale Batch",         color: T.royalBurgundy, bg: "rgba(110,15,45,0.08)", border: "rgba(110,15,45,0.22)", topAccent: T.royalBurgundy },
};

// ── Stock Card ───────────────────────────────────────────────────────────────
function StockCard({ s, onView }: { s: StockSaree; onView: (s: StockSaree) => void }) {
  const cfg = STATUS_CFG[s.status];
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 20px 52px rgba(74,6,27,0.14)" }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        border: `1.5px solid ${T.borderDef}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxShadow: "0 4px 18px rgba(74,6,27,0.07)",
      }}
    >
      {/* Top accent */}
      <div style={{ height: 4, background: cfg.topAccent }} />

      {/* Header */}
      <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Avatar */}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: s.avatarBg || T.taupe, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(0,0,0,0.18)" }}>
            <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: "#FFFDF9" }}>{s.initials}</span>
          </div>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, marginBottom: 3 }}>{s.id}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
              {s.source === "factory" ? `🏭 Factory · Loom ${s.loom}` : `🪡 ${s.weaver} · ${s.weaverCode}`}
            </div>
          </div>
        </div>
        {/* Status badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 99, padding: "5px 12px", flexShrink: 0 }}>
          {s.status === "available"
            ? <CheckCircle size={13} color={cfg.color} weight="fill" />
            : s.status === "sold"
            ? <ShoppingBag size={13} color={cfg.color} weight="fill" />
            : <Stack size={13} color={cfg.color} weight="fill" />
          }
          <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(110,15,45,0.07)", margin: "0 20px" }} />

      {/* Info grid */}
      <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
        {[
          { label: "Weight",   val: s.weight,   icon: <Scales size={13} color={T.taupe} /> },
          { label: "QC Date",  val: s.qcDate,   icon: <CalendarBlank size={13} color={T.taupe} /> },
          { label: "Design",   val: s.design,   icon: <Palette size={13} color={T.taupe} />, mono: true },
          { label: "Type",     val: s.sareeType, icon: <Tag size={13} color={T.taupe} /> },
        ].map(r => (
          <div key={r.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
              {r.icon}
              <span style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px" }}>{r.label}</span>
            </div>
            <div style={{ fontFamily: r.mono ? F.mono : F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.val}</div>
          </div>
        ))}
      </div>

      {/* Customer / Order info */}
      {(s.status === "sold" || s.status === "wholesale") && s.customer && (
        <div style={{ margin: "0 20px 14px", background: "rgba(200,155,71,0.07)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.7px" }}>
            {s.status === "sold" ? "Sold To" : "Wholesale Order"}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: T.luxuryBrown }}>{s.customer}</div>
          {s.saleRef && <div style={{ fontFamily: F.mono, fontSize: 11.5, color: T.royalBurgundy, marginTop: 2 }}>{s.saleRef}</div>}
          {s.assignedAt && <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4 }}>Assigned: {s.assignedAt}</div>}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, padding: "0 20px 20px" }}>
        <motion.button
          onClick={() => onView(s)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: G.button, color: "#FFFDF9", border: "none", borderRadius: 11, padding: "11px 0", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(110,15,45,0.20)" }}>
          View Details
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{ width: 42, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(110,15,45,0.06)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 11, cursor: "pointer" }}>
          <LucidePrinter size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── View Saree Dialog ────────────────────────────────────────────────────────
function ViewStockDialog({ saree, onClose }: { saree: StockSaree; onClose: () => void }) {
  const cfg = STATUS_CFG[saree.status];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(26,10,15,0.50)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <motion.div
        initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }}
        onClick={e => e.stopPropagation()}
        style={{ width: 520, maxWidth: "100%", background: "#FFFFFF", borderRadius: 22, border: `1px solid ${T.borderDef}`, boxShadow: "0 30px 90px rgba(0,0,0,0.28)", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ background: `linear-gradient(100deg, ${T.deepWine}, ${T.royalBurgundy})`, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.55)", letterSpacing: "1px", marginBottom: 4 }}>SAREE DETAILS</div>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9" }}>{saree.id}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {/* Body */}
        <div style={{ padding: 24 }}>
          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 11, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cfg.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={20} color={cfg.color} weight="fill" />
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
              {saree.assignedAt && <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 2 }}>Since: {saree.assignedAt}</div>}
            </div>
          </div>
          {/* Details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Saree ID",   val: saree.id,       mono: true  },
              { label: "Design",     val: saree.design,   mono: true  },
              { label: "Saree Type", val: saree.sareeType, mono: false },
              { label: "Weight",     val: saree.weight,   mono: true  },
              { label: "QC Date",    val: saree.qcDate,   mono: false },
              { label: "Loom No.",   val: `Loom ${saree.loom}`, mono: true },
            ].map(r => (
              <div key={r.label} style={{ background: T.warmCream, borderRadius: 10, padding: "11px 14px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>{r.label}</div>
                <div style={{ fontFamily: r.mono ? F.mono : F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown }}>{r.val}</div>
              </div>
            ))}
          </div>
          {/* Source */}
          <div style={{ background: "rgba(110,15,45,0.05)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Source</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
              {saree.source === "factory" ? `Own Factory · Loom ${saree.loom}` : `${saree.weaver} (${saree.weaverCode}) · Loom ${saree.loom}`}
            </div>
          </div>
          {/* Customer info if any */}
          {saree.customer && (
            <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
                {saree.status === "sold" ? "Sold To" : "Assigned Wholesale Order"}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{saree.customer}</div>
              {saree.saleRef && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, marginTop: 3 }}>{saree.saleRef}</div>}
            </div>
          )}
          {/* Close */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            style={{ width: "100%", height: 46, background: G.button, color: "#FFFDF9", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function AllStockPage({ onBack }: { onBack?: () => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StockStatus>("all");
  const [viewSaree, setViewSaree] = useState<StockSaree | null>(null);

  const filtered = ALL_STOCK.filter(s => {
    const matchSearch = search === "" || s.id.toLowerCase().includes(search.toLowerCase()) || (s.weaver || "").toLowerCase().includes(search.toLowerCase()) || s.design.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const availableCount  = ALL_STOCK.filter(s => s.status === "available").length;
  const soldCount       = ALL_STOCK.filter(s => s.status === "sold").length;
  const wholesaleCount  = ALL_STOCK.filter(s => s.status === "wholesale").length;

  return (
    <div style={{ minHeight: "calc(100vh - 90px)", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── HERO ── */}
      <section style={{ background: G.card, padding: "52px 56px 0", position: "relative", overflow: "hidden" }}>
        {/* Decorative silk lines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(135deg, rgba(200,155,71,0.04) 0px, rgba(200,155,71,0.04) 1px, transparent 1px, transparent 60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, rgba(247,242,234,0.08), transparent)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Back button */}
          {onBack && (
            <motion.button onClick={onBack} whileHover={{ x: -3 }} style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,253,249,0.60)", fontFamily: F.ui, fontSize: 13, fontWeight: 500, background: "none", border: "none", cursor: "pointer", marginBottom: 24, padding: 0 }}>
              <ArrowLeft size={15} /> Back to Production
            </motion.button>
          )}

          {/* Title */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(200,155,71,0.80)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 10 }}>
                PRODUCTION · INVENTORY
              </div>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 44, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
                Sarees In Stock
              </h1>
              <p style={{ fontFamily: F.ui, fontSize: 15, color: "rgba(255,253,249,0.65)", margin: "10px 0 0", lineHeight: 1.6, maxWidth: 560 }}>
                All sarees that have passed quality check and are ready for sale or assignment to finishing staff.
              </p>
            </div>
          </div>

          {/* Stats chips */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingBottom: 36 }}>
            {[
              { label: "Total In Stock",    value: String(ALL_STOCK.length), gold: false, greenAccent: false },
              { label: "Available for Sale", value: String(availableCount),   gold: false, greenAccent: true  },
              { label: "Sold — Pending Finishing", value: String(soldCount), gold: true,  greenAccent: false },
              { label: "Assigned Wholesale", value: String(wholesaleCount),  gold: false, greenAccent: false },
            ].map(c => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10, background: c.gold ? "rgba(200,155,71,0.20)" : c.greenAccent ? "rgba(30,102,64,0.18)" : "rgba(255,253,249,0.10)", border: `1px solid ${c.gold ? "rgba(200,155,71,0.40)" : c.greenAccent ? "rgba(30,102,64,0.35)" : "rgba(255,253,249,0.15)"}`, borderRadius: 99, padding: "9px 18px" }}>
                <span style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: c.gold ? T.antiqueGold : c.greenAccent ? "#6DCE9A" : "#FFFDF9" }}>{c.value}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: c.gold ? T.antiqueGold : c.greenAccent ? "rgba(109,206,154,0.85)" : "rgba(255,253,249,0.68)" }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEARCH + FILTER BAR ── */}
      <section style={{ padding: "28px 56px 0" }}>
        <FadeUp>
          <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "18px 22px", boxShadow: "0 4px 20px rgba(74,6,27,0.07)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 280px" }}>
              <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by saree ID, weaver name, or design code..."
                style={{ width: "100%", height: 44, paddingLeft: 44, paddingRight: 14, fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, background: T.silkCream, border: `1.5px solid ${T.borderDef}`, borderRadius: 12, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            {/* Filter pills */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "all",       label: "All Stock"       },
                { key: "available", label: "Available"       },
                { key: "sold",      label: "Sold"            },
                { key: "wholesale", label: "Wholesale"       },
              ].map(f => (
                <motion.button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key as "all" | StockStatus)}
                  whileHover={{ scale: 1.03 }}
                  style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: 99, cursor: "pointer", background: statusFilter === f.key ? T.royalBurgundy : "transparent", color: statusFilter === f.key ? "#FFFDF9" : T.taupe, border: statusFilter === f.key ? "none" : `1.5px solid rgba(110,15,45,0.18)`, transition: "all 0.18s" }}
                >
                  {f.label}
                </motion.button>
              ))}
            </div>
            {/* Count badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", background: T.warmCream, borderRadius: 10, padding: "8px 14px" }}>
              <Package size={15} color={T.taupe} />
              <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, fontWeight: 600 }}>{filtered.length} saree{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── CARDS GRID ── */}
      <section style={{ padding: "24px 56px 56px" }}>
        {filtered.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "stretch" }}>
            {filtered.map((s, i) => (
              <FadeUp key={s.id} delay={i * 0.05} style={{ height: "100%" }}>
                <StockCard s={s} onView={setViewSaree} />
              </FadeUp>
            ))}
          </div>
        ) : (
          <FadeUp>
            <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "64px 32px", textAlign: "center" }}>
              <Package size={48} color={T.taupe} style={{ marginBottom: 16, opacity: 0.5 }} />
              <div style={{ fontFamily: F.display, fontSize: 20, color: T.taupe }}>No sarees match your search or filter.</div>
            </div>
          </FadeUp>
        )}
      </section>

      {/* ── DIALOG ── */}
      <AnimatePresence>
        {viewSaree && <ViewStockDialog saree={viewSaree} onClose={() => setViewSaree(null)} />}
      </AnimatePresence>
    </div>
  );
}
