import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
const imgRatesHero = "https://images.unsplash.com/photo-1527751171053-6ac5ec50000b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import {
  Edit2, Plus, Check, X, AlertTriangle, ChevronRight,
  Clock, Download, Lock, Package, Layers, Tag,
  ChevronLeft, BarChart2, Settings, Eye,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════
const T = {
  silkCream: "#F7F2EA", warmIvory: "#FFFDF9", royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B", darkBurgundy: "#3D0E1A", antiqueGold: "#C89B47",
  goldLight: "#E7C983", luxuryBrown: "#3B2314", warmCream: "#F5E8D0",
  taupe: "#8B7060", green: "#1E6640", crimson: "#C0392B",
  borderDef: "rgba(110,15,45,0.10)", borderGold: "rgba(200,155,71,0.22)",
  cream: "#F0E8D0",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ═══════════════════════════════════════════════════════════════════════════
// SHARED STYLE HELPERS
// ═══════════════════════════════════════════════════════════════════════════
const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${T.borderDef}`,
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
  overflow: "hidden",
};

const inputStyle: React.CSSProperties = {
  background: "#FFF8F0",
  border: "1px solid rgba(110,15,45,0.18)",
  borderRadius: 8,
  padding: "8px 12px",
  fontFamily: F.ui,
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
  color: T.luxuryBrown,
};

const labelStyle: React.CSSProperties = {
  fontFamily: F.ui,
  fontSize: 11,
  fontWeight: 600,
  color: T.taupe,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  marginBottom: 5,
  display: "block",
};

function SectionTitle({ children, link }: { children: React.ReactNode; link?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 4, height: 22, borderRadius: 2, background: T.royalBurgundy, flexShrink: 0 }} />
        <span style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>{children}</span>
      </div>
      {link}
    </div>
  );
}

function GoldLink({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.antiqueGold, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
    >
      {children}
    </span>
  );
}

const thStyle: React.CSSProperties = {
  fontFamily: F.mono,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: "0.10em",
  textTransform: "uppercase" as const,
  color: T.taupe,
  padding: "11px 16px",
  textAlign: "left" as const,
  borderBottom: `1px solid ${T.borderDef}`,
  background: "#FAFAF8",
  whiteSpace: "nowrap" as const,
};

const tdStyle: React.CSSProperties = {
  padding: "13px 16px",
  fontFamily: F.ui,
  fontSize: 13,
  color: T.luxuryBrown,
  borderBottom: `1px solid rgba(110,15,45,0.06)`,
  verticalAlign: "middle" as const,
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA TYPES
// ═══════════════════════════════════════════════════════════════════════════
export interface SareeTypeRecord {
  code: string;
  type: string;
  description: string;
  charge: string;
  retail: string;
  wholesale: string;
  stdWeight: string;
  warpWeight: string;
  reshamWeight: string;
  jariWeight: string;
  changed: string;
}

export const INITIAL_RATES: SareeTypeRecord[] = [
  { code: "SB-001", type: "Self Brocade",   description: "Traditional brocade with self-woven patterns",    charge: "450",    retail: "8500",  wholesale: "7200",  stdWeight: "850",  warpWeight: "480", reshamWeight: "240", jariWeight: "6",  changed: "3 days ago"  },
  { code: "HZ-003", type: "Heavy Zari",     description: "Rich gold zari work with heavy metallic detailing", charge: "680",   retail: "12000", wholesale: "10500", stdWeight: "920",  warpWeight: "500", reshamWeight: "280", jariWeight: "10", changed: "1 week ago"  },
  { code: "PS-002", type: "Plain Silk",     description: "Classic plain silk with minimal ornamentation",     charge: "280",   retail: "5500",  wholesale: "4800",  stdWeight: "780",  warpWeight: "450", reshamWeight: "200", jariWeight: "0",  changed: "2 weeks ago" },
  { code: "BS-004", type: "Bridal Special", description: "Premium bridal collection with intricate work",     charge: "1200",  retail: "22000", wholesale: "19500", stdWeight: "1050", warpWeight: "580", reshamWeight: "340", jariWeight: "14", changed: "1 month ago" },
  { code: "LC-005", type: "Light Cotton",   description: "Lightweight cotton blend for everyday use",         charge: "220",   retail: "4200",  wholesale: "3600",  stdWeight: "680",  warpWeight: "400", reshamWeight: "180", jariWeight: "0",  changed: "1 month ago" },
];

// ═══════════════════════════════════════════════════════════════════════════
// LOOKUP HELPERS — resolve saree type records by code/name from other pages
// ═══════════════════════════════════════════════════════════════════════════
export function getSareeTypeByCode(code: string): SareeTypeRecord | undefined {
  return INITIAL_RATES.find(r => r.code === code);
}

export function getSareeTypeByName(name: string): SareeTypeRecord | undefined {
  return INITIAL_RATES.find(r => r.type === name);
}

// ═══════════════════════════════════════════════════════════════════════════
// SAREE TYPE CARD — reusable exported modal (also used from Batch Creation)
// ═══════════════════════════════════════════════════════════════════════════
export function SareeTypeCard({ sareeType, onClose }: { sareeType: SareeTypeRecord; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(30,10,20,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FFFDF9", borderRadius: 20, width: 480, maxWidth: "calc(100vw - 48px)",
          boxShadow: "0 24px 80px rgba(44,6,27,0.28)", overflow: "hidden",
          border: `1px solid ${T.borderDef}`,
        }}
      >
        {/* Header */}
        <div style={{ background: T.darkBurgundy, padding: "24px 28px", position: "relative" }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em", color: T.antiqueGold, textTransform: "uppercase", marginBottom: 8 }}>
            Saree Type Details
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", borderRadius: 6, padding: "4px 10px" }}>
              {sareeType.code}
            </span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>
              {sareeType.type}
            </span>
          </div>
          <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.10)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {sareeType.description && (
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: 0, lineHeight: 1.7 }}>{sareeType.description}</p>
          )}

          {/* Price + weight row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: T.cream, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 6 }}>Making Charge</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: T.antiqueGold }}>₹{parseInt(sareeType.charge).toLocaleString("en-IN")}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>per saree</div>
            </div>
            <div style={{ background: T.cream, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 6 }}>Standard Weight</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: T.luxuryBrown }}>{sareeType.stdWeight}g</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>grams</div>
            </div>
          </div>

          {/* Retail / Wholesale */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 4 }}>Retail Price</div>
              <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>₹{parseInt(sareeType.retail).toLocaleString("en-IN")}</div>
            </div>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 4 }}>Wholesale Price</div>
              <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>₹{parseInt(sareeType.wholesale).toLocaleString("en-IN")}</div>
            </div>
          </div>

          {/* Material breakdown */}
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 10 }}>Material Weight Breakdown</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Warp", value: sareeType.warpWeight, unit: "g" },
                { label: "Resham", value: sareeType.reshamWeight, unit: "g" },
                { label: "Jari", value: sareeType.jariWeight, unit: " reels" },
              ].map(({ label, value, unit }) => (
                <div key={label} style={{ background: "rgba(110,15,45,0.04)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.08em", color: T.taupe, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{value || "—"}{value ? unit : ""}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, borderTop: `1px solid ${T.borderDef}`, paddingTop: 12 }}>
            Last updated: {sareeType.changed}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const WHOLESALE = [
  { name: "Lakshmi Silks",          code: "WHL-001", terms: "30 days", alert: "Day 45", overdue: "Day 46", changed: "2 weeks ago" },
  { name: "Narayana Silk Emporium", code: "WHL-002", terms: "30 days", alert: "Day 45", overdue: "Day 46", changed: "1 month ago" },
  { name: "Padmavathi Textiles",    code: "WHL-003", terms: "30 days", alert: "Day 45", overdue: "Day 46", changed: "1 month ago" },
  { name: "Vijaya Silk House",      code: "WHL-004", terms: "45 days", alert: "Day 45", overdue: "Day 46", changed: "3 weeks ago" },
  { name: "Meenakshi Silks",        code: "WHL-005", terms: "60 days", alert: "Day 45", overdue: "Day 46", changed: "2 months ago" },
  { name: "Kalavathi Exports",      code: "WHL-006", terms: "45 days", alert: "Day 45", overdue: "Day 46", changed: "1 month ago" },
  { name: "Srinivasa Silks",        code: "WHL-007", terms: "30 days", alert: "Day 45", overdue: "Day 46", changed: "2 months ago" },
  { name: "Annapurna Textiles",     code: "WHL-008", terms: "90 days", alert: "Day 45", overdue: "Day 46", changed: "3 months ago" },
];

const HISTORY = [
  { date: "10 Jun 2026 · 10:24 AM", by: "Superadmin", what: "Self Brocade Making Charge", old: "₹420/saree", next: "₹450/saree", reason: "Market rate increase" },
  { date: "05 Jun 2026 · 2:15 PM",  by: "Superadmin", what: "Heavy Zari Standard Weight",  old: "900g",       next: "920g",       reason: "Adjusted for new design" },
  { date: "01 Jun 2026 · 11:00 AM", by: "Superadmin", what: "Warp Deduction Rate",         old: "₹4.80/g",    next: "₹5.20/g",    reason: "Vendor price increase" },
  { date: "28 May 2026 · 3:40 PM",  by: "Superadmin", what: "Vijaya Silk — Payment Terms", old: "30 days",    next: "45 days",    reason: "Customer request" },
  { date: "22 May 2026 · 9:00 AM",  by: "Superadmin", what: "Bridal Special Retail Price", old: "₹20,000",    next: "₹22,000",    reason: "Annual price revision" },
  { date: "15 May 2026 · 4:20 PM",  by: "Superadmin", what: "Jari Deduction Rate",         old: "₹38/reel",   next: "₹42/reel",   reason: "Raw material cost increase" },
  { date: "10 May 2026 · 10:05 AM", by: "Superadmin", what: "Light Cotton Making Charge",  old: "₹200/saree", next: "₹220/saree", reason: "Annual revision" },
  { date: "01 May 2026 · 8:30 AM",  by: "Superadmin", what: "Meenakshi — Payment Terms",   old: "90 days",    next: "60 days",    reason: "Credit policy review" },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// SAREE TYPE COMBOBOX
// ═══════════════════════════════════════════════════════════════════════════
function SareeTypeCombobox({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = options
    .filter(o => o.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const showNew = query.trim() && !options.some(o => o.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        style={inputStyle}
        placeholder="e.g. Self Brocade or type a new name…"
        autoComplete="off"
      />
      <AnimatePresence>
        {open && (filtered.length > 0 || showNew) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 500,
              background: "#FFFDF9", borderRadius: 10, boxShadow: "0 8px 28px rgba(44,6,27,0.14)",
              border: `1px solid ${T.borderDef}`, overflow: "hidden", maxHeight: 220, overflowY: "auto",
            }}
          >
            {filtered.map(opt => (
              <button key={opt} onMouseDown={() => { onChange(opt); setQuery(opt); setOpen(false); }}
                style={{ width: "100%", display: "block", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                {opt}
              </button>
            ))}
            {showNew && (
              <button onMouseDown={() => { onChange(query.trim()); setOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, textAlign: "left", padding: "9px 14px", border: "none", borderTop: filtered.length > 0 ? `1px solid ${T.borderDef}` : "none", background: "rgba(110,15,45,0.03)", cursor: "pointer", fontFamily: F.ui, fontSize: 13, color: T.royalBurgundy }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(110,15,45,0.07)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(110,15,45,0.03)")}
              >
                <Plus size={13} /> Add &ldquo;{query.trim()}&rdquo; as new type
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function RatesPricingPage() {
  // Saree types — mutable state so new additions persist in session
  const [rates, setRates] = useState<SareeTypeRecord[]>(INITIAL_RATES);
  const [editRow, setEditRow] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [viewCard, setViewCard] = useState<SareeTypeRecord | null>(null);

  // Edit form state
  const [editVals, setEditVals] = useState<Partial<SareeTypeRecord>>({});

  // New form state
  const [newVals, setNewVals] = useState<Partial<SareeTypeRecord>>({});

  function openEdit(i: number) {
    if (editRow === i) { setEditRow(null); return; }
    setEditRow(i);
    setEditVals({ ...rates[i] });
  }

  function saveEdit(i: number) {
    setRates(prev => prev.map((r, idx) => idx === i ? { ...r, ...editVals, changed: "Just now" } as SareeTypeRecord : r));
    setEditRow(null);
  }

  function saveNew() {
    if (!newVals.type?.trim() || !newVals.code?.trim()) return;
    const entry: SareeTypeRecord = {
      code: newVals.code!.trim(),
      type: newVals.type!.trim(),
      description: newVals.description ?? "",
      charge: newVals.charge ?? "0",
      retail: newVals.retail ?? "0",
      wholesale: newVals.wholesale ?? "0",
      stdWeight: newVals.stdWeight ?? "0",
      warpWeight: newVals.warpWeight ?? "0",
      reshamWeight: newVals.reshamWeight ?? "0",
      jariWeight: newVals.jariWeight ?? "0",
      changed: "Just now",
    };
    setRates(prev => [entry, ...prev]);
    setNewVals({});
    setShowNewForm(false);
  }

  // All current type names for the combobox
  const typeNames = rates.map(r => r.type);

  // Section B state
  const [editDeduction, setEditDeduction] = useState<string | null>("warp");

  // Section C state
  const [editTermsRow, setEditTermsRow] = useState<number | null>(0);
  const [editAlertDay, setEditAlertDay] = useState(false);

  // History pagination
  const [histPage, setHistPage] = useState(1);

  return (
    <>
    <div style={{ background: T.silkCream, minHeight: "100vh", fontFamily: F.ui }}>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. PAGE HEADER                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <header style={{ background: T.darkBurgundy, position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        {/* Left text content */}
        <div style={{ position: "relative", zIndex: 2, padding: "48px 0 110px 48px", flex: "0 0 64%", maxWidth: "64%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 12 }}>SINCE 1999 · RATES &amp; PRICING</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Rates &amp; Pricing</h1>
            <span style={{ fontFamily: F.display, fontSize: 32, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Making Charges</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 560, lineHeight: 1.6 }}>
            Configure making charges, raw material deduction rates, and wholesale payment terms across all saree types. All changes are logged and immutable.
          </p>
        </div>
        {/* Right image with gradient */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, ${T.darkBurgundy} 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
          <img src={imgRatesHero} alt="Saree pricing" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.85)" }} />
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. FLOATING STATS STRIP                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
      >
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { label: "TOTAL SAREE TYPES",       val: String(rates.length),  sub: "All with short codes and rates set",  hi: false, crimson: false, goldVal: false },
            { label: "LAST RATE CHANGE",         val: "3 days ago",           sub: "Self Brocade · ₹420 → ₹450",        hi: false, crimson: false, goldVal: false },
            { label: "HIGHEST MAKING CHARGE",    val: "₹1,200",              sub: "Bridal Special · BS-004",            hi: true,  crimson: false, goldVal: true  },
            { label: "LOWEST MAKING CHARGE",     val: "₹220",               sub: "Light Cotton · LC-005 per saree",    hi: false, crimson: false, goldVal: false },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.09 }}
              whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
              style={{
                flex: 1, padding: "28px 22px",
                backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
                borderRight: i < 3 ? "1px solid rgba(245,232,208,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "default",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.crimson ? "#F47B72" : m.goldVal ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)" }}>
                  {m.sub}
                </div>
              </div>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 3. SECTION A — MAKING CHARGE RATES                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "96px 56px 48px" }}>
        <SectionTitle link={
          <GoldLink><BarChart2 size={13} /> View Rate Change History →</GoldLink>
        }>
          Making Charge Rates — Per Saree Type
        </SectionTitle>
        <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 24px 0", lineHeight: 1.7 }}>
          These charges are applied to each saree during production billing. Making charge is the amount paid to the weaver per saree woven. All prices in Indian Rupees (₹).
        </p>

        {/* Rates Table */}
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Code", "Saree Type", "Making Charge", "Retail", "Wholesale", "Std Weight", "Last Changed", "Actions"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rates.map((row, i) => (
                <React.Fragment key={row.code}>
                  <tr style={{ background: editRow === i ? "rgba(110,15,45,0.03)" : "transparent" }}>
                    <td style={tdStyle}>
                      <span style={{
                        fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 600,
                        background: "rgba(110,15,45,0.08)", padding: "3px 8px", borderRadius: 6,
                      }}>{row.code}</span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{row.type}</td>
                    <td style={{ ...tdStyle, fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.antiqueGold }}>
                      ₹{parseInt(row.charge).toLocaleString("en-IN")}
                    </td>
                    <td style={tdStyle}>₹{parseInt(row.retail).toLocaleString("en-IN")}</td>
                    <td style={tdStyle}>₹{parseInt(row.wholesale).toLocaleString("en-IN")}</td>
                    <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11 }}>{row.stdWeight}g</td>
                    <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{row.changed}</td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setViewCard(row)}
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: "transparent", border: `1px solid ${T.borderDef}`,
                            color: T.taupe, borderRadius: 10, padding: "5px 10px",
                            fontFamily: F.ui, fontSize: 12, cursor: "pointer",
                          }}
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => openEdit(i)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            background: "transparent", border: `1px solid ${T.royalBurgundy}`,
                            color: T.royalBurgundy, borderRadius: 10, padding: "5px 12px",
                            fontFamily: F.ui, fontSize: 12, fontWeight: 500, cursor: "pointer",
                          }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline edit form */}
                  <tr>
                    <td colSpan={8} style={{ padding: 0, borderBottom: "none" }}>
                      <AnimatePresence>
                        {editRow === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            style={{ overflow: "hidden" }}
                          >
                            <div style={{ background: T.cream, borderTop: `2px solid ${T.antiqueGold}`, padding: 24 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                                <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
                                  Editing: {row.type} — <span style={{ fontFamily: F.mono, color: T.royalBurgundy }}>{row.code}</span>
                                </span>
                                <button onClick={() => setEditRow(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe, display: "flex", alignItems: "center", gap: 4 }}>
                                  <X size={16} />
                                </button>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 18 }}>
                                {/* Col 1 — Identity */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                  <div>
                                    <label style={labelStyle}>Saree Type Name *</label>
                                    <SareeTypeCombobox
                                      value={editVals.type ?? row.type}
                                      onChange={v => setEditVals(p => ({ ...p, type: v }))}
                                      options={typeNames.filter(n => n !== row.type)}
                                    />
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Short Code</label>
                                    <input value={row.code} readOnly style={{ ...inputStyle, background: "#EDE5D8", color: T.taupe, cursor: "not-allowed" }} />
                                    <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4, display: "block" }}>Code cannot be changed</span>
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Description</label>
                                    <textarea rows={2} value={editVals.description ?? row.description} onChange={e => setEditVals(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, resize: "none" }} placeholder="Short description…" />
                                  </div>
                                </div>
                                {/* Col 2 — Pricing */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                  <div>
                                    <label style={labelStyle}>Making Charge (₹) *</label>
                                    <input type="number" value={editVals.charge ?? row.charge} onChange={e => setEditVals(p => ({ ...p, charge: e.target.value }))} style={inputStyle} />
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Retail Price (₹)</label>
                                    <input type="number" value={editVals.retail ?? row.retail} onChange={e => setEditVals(p => ({ ...p, retail: e.target.value }))} style={inputStyle} />
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Wholesale Price (₹)</label>
                                    <input type="number" value={editVals.wholesale ?? row.wholesale} onChange={e => setEditVals(p => ({ ...p, wholesale: e.target.value }))} style={inputStyle} />
                                  </div>
                                </div>
                                {/* Col 3 — Weights */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                  <div>
                                    <label style={labelStyle}>Standard Weight (g) *</label>
                                    <input type="number" value={editVals.stdWeight ?? row.stdWeight} onChange={e => setEditVals(p => ({ ...p, stdWeight: e.target.value }))} style={inputStyle} placeholder="Enter manually" />
                                  </div>
                                  <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: 14 }}>
                                    <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 10 }}>Material Weight Breakdown</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                      <div>
                                        <label style={{ ...labelStyle, marginBottom: 3 }}>Warp Weight (g)</label>
                                        <input type="number" value={editVals.warpWeight ?? row.warpWeight} onChange={e => setEditVals(p => ({ ...p, warpWeight: e.target.value }))} style={inputStyle} />
                                      </div>
                                      <div>
                                        <label style={{ ...labelStyle, marginBottom: 3 }}>Resham Weight (g)</label>
                                        <input type="number" value={editVals.reshamWeight ?? row.reshamWeight} onChange={e => setEditVals(p => ({ ...p, reshamWeight: e.target.value }))} style={inputStyle} />
                                      </div>
                                      <div>
                                        <label style={{ ...labelStyle, marginBottom: 3 }}>Jari (Reels)</label>
                                        <input type="number" value={editVals.jariWeight ?? row.jariWeight} onChange={e => setEditVals(p => ({ ...p, jariWeight: e.target.value }))} style={inputStyle} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div style={{
                                background: "rgba(196,146,58,0.10)", border: `1px solid rgba(200,155,71,0.35)`,
                                borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
                              }}>
                                <AlertTriangle size={15} color={T.antiqueGold} />
                                <span style={{ fontFamily: F.ui, fontSize: 12, color: "#7A5E1A" }}>
                                  Changing making charges affects all future production bills for <strong>{row.type}</strong>. Changes are logged in rate history.
                                </span>
                              </div>

                              <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => saveEdit(i)} style={{
                                  background: T.green, color: "#fff", border: "none", borderRadius: 999,
                                  padding: "9px 22px", fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer",
                                  display: "flex", alignItems: "center", gap: 6,
                                }}>
                                  <Check size={14} /> Save Changes
                                </button>
                                <button onClick={() => setEditRow(null)} style={{
                                  background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
                                  borderRadius: 999, padding: "9px 18px", fontFamily: F.ui, fontSize: 13, cursor: "pointer",
                                  display: "flex", alignItems: "center", gap: 6,
                                }}>
                                  <X size={13} /> Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add New Saree Type */}
        <button
          onClick={() => { setShowNewForm(!showNewForm); setNewVals({}); }}
          style={{
            width: "100%", marginTop: 16, background: T.royalBurgundy, color: "#fff",
            border: "none", borderRadius: 999, height: 48, fontFamily: F.ui, fontSize: 14,
            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8,
          }}
        >
          <Plus size={16} /> Add New Saree Type
        </button>

        <AnimatePresence>
          {showNewForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: "hidden", marginTop: 12 }}
            >
              <div style={{ ...cardStyle, padding: 24 }}>
                <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown, marginBottom: 18 }}>
                  New Saree Type
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 18 }}>
                  {/* Col 1 — Identity */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Saree Type Name * <span style={{ color: T.antiqueGold, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(select existing or type new)</span></label>
                      <SareeTypeCombobox
                        value={newVals.type ?? ""}
                        onChange={v => setNewVals(p => ({ ...p, type: v }))}
                        options={typeNames}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Short Code *</label>
                      <input value={newVals.code ?? ""} onChange={e => setNewVals(p => ({ ...p, code: e.target.value }))} style={{ ...inputStyle, fontFamily: F.mono }} placeholder="e.g. KS-006" />
                    </div>
                    <div>
                      <label style={labelStyle}>Description</label>
                      <textarea rows={2} value={newVals.description ?? ""} onChange={e => setNewVals(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, resize: "none" }} placeholder="Short description…" />
                    </div>
                  </div>
                  {/* Col 2 — Pricing */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Making Charge (₹) *</label>
                      <input type="number" value={newVals.charge ?? ""} onChange={e => setNewVals(p => ({ ...p, charge: e.target.value }))} style={inputStyle} placeholder="0" />
                    </div>
                    <div>
                      <label style={labelStyle}>Retail Price (₹)</label>
                      <input type="number" value={newVals.retail ?? ""} onChange={e => setNewVals(p => ({ ...p, retail: e.target.value }))} style={inputStyle} placeholder="0" />
                    </div>
                    <div>
                      <label style={labelStyle}>Wholesale Price (₹)</label>
                      <input type="number" value={newVals.wholesale ?? ""} onChange={e => setNewVals(p => ({ ...p, wholesale: e.target.value }))} style={inputStyle} placeholder="0" />
                    </div>
                  </div>
                  {/* Col 3 — Weights */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Standard Weight (g) *</label>
                      <input type="number" value={newVals.stdWeight ?? ""} onChange={e => setNewVals(p => ({ ...p, stdWeight: e.target.value }))} style={inputStyle} placeholder="Enter manually" />
                    </div>
                    <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: 14 }}>
                      <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 10 }}>Material Weight Breakdown</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: 3 }}>Warp Weight (g)</label>
                          <input type="number" value={newVals.warpWeight ?? ""} onChange={e => setNewVals(p => ({ ...p, warpWeight: e.target.value }))} style={inputStyle} placeholder="0" />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: 3 }}>Resham Weight (g)</label>
                          <input type="number" value={newVals.reshamWeight ?? ""} onChange={e => setNewVals(p => ({ ...p, reshamWeight: e.target.value }))} style={inputStyle} placeholder="0" />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: 3 }}>Jari (Reels)</label>
                          <input type="number" value={newVals.jariWeight ?? ""} onChange={e => setNewVals(p => ({ ...p, jariWeight: e.target.value }))} style={inputStyle} placeholder="0" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={saveNew}
                    disabled={!newVals.type?.trim() || !newVals.code?.trim()}
                    style={{
                      background: (!newVals.type?.trim() || !newVals.code?.trim()) ? T.taupe : T.green,
                      color: "#fff", border: "none", borderRadius: 999,
                      padding: "9px 22px", fontFamily: F.ui, fontSize: 13, fontWeight: 600,
                      cursor: (!newVals.type?.trim() || !newVals.code?.trim()) ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 6, opacity: (!newVals.type?.trim() || !newVals.code?.trim()) ? 0.55 : 1,
                    }}
                  >
                    <Check size={14} /> Save New Type
                  </button>
                  <button onClick={() => { setShowNewForm(false); setNewVals({}); }} style={{
                    background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
                    borderRadius: 999, padding: "9px 18px", fontFamily: F.ui, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <X size={13} /> Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. SECTION B — RAW MATERIAL DEDUCTION RATES                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "48px 56px" }}>
        <SectionTitle>Raw Material Deduction Rates</SectionTitle>
        <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 24px 0", lineHeight: 1.7 }}>
          When a weaver returns less raw material than the standard issue, a deduction is applied to their payment. These rates define the per-unit deduction value.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 16 }}>
          {/* Warp Card */}
          <div>
            <div style={{ ...cardStyle, borderTop: `4px solid ${T.royalBurgundy}`, padding: 24, borderRadius: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: T.royalBurgundy,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
              }}>
                <Package size={16} color="#fff" />
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Warp Deduction Rate</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}>₹5.20</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>per gram below standard</div>
              <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 12px 0" }} />
              <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6 }}>
                Applied when returned warp weight is less than the standard issued weight for the saree type.
              </p>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginBottom: 14 }}>Last changed: 2 weeks ago</div>
              <button
                onClick={() => setEditDeduction(editDeduction === "warp" ? null : "warp")}
                style={{
                  width: "100%", background: "transparent", border: `1px solid ${T.borderDef}`,
                  borderRadius: 8, padding: "8px 0", fontFamily: F.ui, fontSize: 12,
                  color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Edit2 size={12} /> Edit Rate
              </button>
            </div>

            {/* Warp inline edit */}
            <AnimatePresence>
              {editDeduction === "warp" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ background: "#fff", border: `1px solid ${T.borderDef}`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: 20 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={labelStyle}>Deduction Rate (₹ per gram) *</label>
                        <input type="number" defaultValue="5.20" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Applies After Variance (grams) *</label>
                        <input type="number" defaultValue="5" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Reason</label>
                        <textarea rows={2} style={{ ...inputStyle, resize: "none" }} placeholder="e.g. Vendor price increase…" />
                      </div>
                    </div>
                    <div style={{
                      background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                      borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                    }}>
                      <AlertTriangle size={14} color={T.crimson} />
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>
                        This rate change will apply to all future warp deduction calculations immediately.
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{
                        flex: 1, background: T.green, color: "#fff", border: "none", borderRadius: 999,
                        padding: "8px 0", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      }}>
                        <Check size={13} /> Save
                      </button>
                      <button onClick={() => setEditDeduction(null)} style={{
                        flex: 1, background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
                        borderRadius: 999, padding: "8px 0", fontFamily: F.ui, fontSize: 12, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      }}>
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Resham Card */}
          <div style={{ ...cardStyle, borderTop: `4px solid ${T.antiqueGold}`, padding: 24, borderRadius: 16, alignSelf: "start" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(200,155,71,0.15)",
              border: `1px solid rgba(200,155,71,0.30)`,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
            }}>
              <Tag size={16} color={T.antiqueGold} />
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Resham Deduction Rate</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}>₹15.00</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 16 }}>per gram below standard</div>
            <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 12px 0" }} />
            <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6 }}>
              Applied when returned resham (silk thread) weight is less than the standard issued quantity for the design.
            </p>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginBottom: 14 }}>Last changed: 1 month ago</div>
            <button
              onClick={() => setEditDeduction(editDeduction === "resham" ? null : "resham")}
              style={{
                width: "100%", background: "transparent", border: `1px solid ${T.borderDef}`,
                borderRadius: 8, padding: "8px 0", fontFamily: F.ui, fontSize: 12,
                color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Edit2 size={12} /> Edit Rate
            </button>
            <AnimatePresence>
              {editDeduction === "resham" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  style={{ overflow: "hidden", marginTop: 16 }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Deduction Rate (₹ per gram) *</label>
                      <input type="number" defaultValue="15.00" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Applies After Variance (grams) *</label>
                      <input type="number" defaultValue="3" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Reason</label>
                      <textarea rows={2} style={{ ...inputStyle, resize: "none" }} />
                    </div>
                    <div style={{
                      background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                      borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <AlertTriangle size={14} color={T.crimson} />
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>Rate applies to all future calculations.</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ flex: 1, background: T.green, color: "#fff", border: "none", borderRadius: 999, padding: "8px 0", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        <Check size={13} /> Save
                      </button>
                      <button onClick={() => setEditDeduction(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe, borderRadius: 999, padding: "8px 0", fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Jari Card */}
          <div style={{ ...cardStyle, borderTop: `4px solid #2C1810`, padding: 24, borderRadius: 16, alignSelf: "start" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "#2C1810",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
            }}>
              <Layers size={16} color="#fff" />
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown, marginBottom: 6 }}>Jari Deduction Rate</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 4 }}>₹42.00</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 12 }}>per reel below standard</div>
            <div style={{
              display: "inline-block", background: "rgba(200,155,71,0.12)", border: `1px solid rgba(200,155,71,0.25)`,
              borderRadius: 999, padding: "3px 10px", marginBottom: 14,
            }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: T.antiqueGold }}>Jari is measured in Reels · 1 Bun = 4 Reels</span>
            </div>
            <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 12px 0" }} />
            <p style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, margin: "0 0 12px 0", lineHeight: 1.6 }}>
              Applied when returned jari is less than the standard issued quantity. Measured in reels, not grams.
            </p>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginBottom: 14 }}>Last changed: 3 weeks ago</div>
            <button
              onClick={() => setEditDeduction(editDeduction === "jari" ? null : "jari")}
              style={{
                width: "100%", background: "transparent", border: `1px solid ${T.borderDef}`,
                borderRadius: 8, padding: "8px 0", fontFamily: F.ui, fontSize: 12,
                color: T.royalBurgundy, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Edit2 size={12} /> Edit Rate
            </button>
            <AnimatePresence>
              {editDeduction === "jari" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  style={{ overflow: "hidden", marginTop: 16 }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Deduction Rate (₹ per reel) *</label>
                      <input type="number" defaultValue="42.00" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Applies After Variance (reels) *</label>
                      <input type="number" defaultValue="1" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Reason</label>
                      <textarea rows={2} style={{ ...inputStyle, resize: "none" }} />
                    </div>
                    <div style={{
                      background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
                      borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <AlertTriangle size={14} color={T.crimson} />
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>Rate applies to all future Jari deduction calculations.</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ flex: 1, background: T.green, color: "#fff", border: "none", borderRadius: 999, padding: "8px 0", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Save
                      </button>
                      <button onClick={() => setEditDeduction(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe, borderRadius: 999, padding: "8px 0", fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Variance Rule Strip */}
        <div style={{
          background: T.cream, border: `1px solid ${T.borderGold}`, borderRadius: 12,
          padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.10em", color: T.taupe, textTransform: "uppercase", marginBottom: 5 }}>
              Current Variance Rule
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 500, color: T.luxuryBrown }}>
              Deductions only apply when the returned material is more than <strong>5 grams</strong> (or <strong>1 reel</strong> for Jari) below the standard issued quantity.
            </div>
          </div>
          <GoldLink>
            <Edit2 size={12} /> Edit Variance Rule <ChevronRight size={14} />
          </GoldLink>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 5. SECTION C — WHOLESALE PAYMENT TERMS                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "48px 56px" }}>
        <SectionTitle>Wholesale Payment Terms</SectionTitle>
        <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 20px 0", lineHeight: 1.7 }}>
          Configure payment terms and overdue alert thresholds for each wholesale customer. Alert start day is a global setting applied to all customers.
        </p>

        {/* Global Alert Setting Strip */}
        <div style={{
          background: "rgba(200,155,71,0.08)", border: `1px solid rgba(200,155,71,0.28)`,
          borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={16} color={T.antiqueGold} />
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
              Payment alerts start from:{" "}
              <strong style={{ color: T.antiqueGold, fontSize: 15 }}>Day 45</strong>{" "}
              for all customers
            </span>
          </div>

          <AnimatePresence mode="wait">
            {!editAlertDay ? (
              <GoldLink onClick={() => setEditAlertDay(true)}>
                <Edit2 size={12} /> Edit Alert Day
              </GoldLink>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>Alert starts from Day:</span>
                <input type="number" defaultValue="45" style={{ ...inputStyle, width: 70 }} />
                <button style={{ background: T.green, color: "#fff", border: "none", borderRadius: 999, padding: "6px 14px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Save
                </button>
                <button onClick={() => setEditAlertDay(false)} style={{ background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe, borderRadius: 999, padding: "6px 12px", fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}>
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Payment Terms Table */}
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Customer Name", "Code", "Current Terms", "Alert Starts", "Overdue From", "Last Changed", "Edit"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WHOLESALE.map((row, i) => (
                <React.Fragment key={row.code}>
                  <tr style={{ background: editTermsRow === i ? "rgba(110,15,45,0.03)" : "transparent" }}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{row.name}</td>
                    <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy }}>{row.code}</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown,
                        background: T.cream, padding: "3px 10px", borderRadius: 6,
                      }}>{row.terms}</span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11, color: T.antiqueGold }}>{row.alert}</td>
                    <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11, color: T.crimson }}>{row.overdue}</td>
                    <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{row.changed}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => setEditTermsRow(editTermsRow === i ? null : i)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          background: "transparent", border: `1px solid ${T.royalBurgundy}`,
                          color: T.royalBurgundy, borderRadius: 10, padding: "5px 12px",
                          fontFamily: F.ui, fontSize: 12, fontWeight: 500, cursor: "pointer",
                        }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={7} style={{ padding: 0, borderBottom: "none" }}>
                      <AnimatePresence>
                        {editTermsRow === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            style={{ overflow: "hidden" }}
                          >
                            <div style={{ background: T.cream, borderTop: `2px solid ${T.antiqueGold}`, padding: 20 }}>
                              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown, marginBottom: 14 }}>
                                Editing Terms: {row.name}
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
                                <div>
                                  <label style={labelStyle}>Payment Terms (Days) *</label>
                                  <input type="number" defaultValue={parseInt(row.terms)} style={inputStyle} />
                                </div>
                                <div>
                                  <label style={labelStyle}>Notes</label>
                                  <textarea rows={2} style={{ ...inputStyle, resize: "none" }} placeholder="Optional notes about this customer's terms…" />
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 10 }}>
                                <button style={{
                                  background: T.green, color: "#fff", border: "none", borderRadius: 999,
                                  padding: "8px 20px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                  display: "flex", alignItems: "center", gap: 6,
                                }}>
                                  <Check size={13} /> Save Terms
                                </button>
                                <button onClick={() => setEditTermsRow(null)} style={{
                                  background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
                                  borderRadius: 999, padding: "8px 16px", fontFamily: F.ui, fontSize: 12, cursor: "pointer",
                                  display: "flex", alignItems: "center", gap: 5,
                                }}>
                                  <X size={13} /> Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 6. SECTION D — JARI MEASUREMENT SETTINGS                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "48px 56px" }}>
        <SectionTitle>Jari Measurement Settings</SectionTitle>
        <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 24px 0", lineHeight: 1.7 }}>
          Define the conversion ratio between Buns and Reels for Jari material. This setting affects all Jari-related calculations system-wide.
        </p>

        <div style={{ ...cardStyle, padding: 40 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1, marginBottom: 8 }}>
              1 Bun = 4 Reels
            </div>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              The current conversion is set to 4 Reels per Bun. This is used when calculating Jari deductions and stock tracking across all weaver accounts.
            </p>
          </div>

          <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "0 0 28px 0" }} />

          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>1 Bun equals:</label>
              <input
                type="number"
                defaultValue="4"
                style={{ ...inputStyle, width: 90, fontFamily: F.mono, fontSize: 20, fontWeight: 700, textAlign: "center" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>Unit name (singular):</label>
              <input defaultValue="Reel" style={{ ...inputStyle, width: 110 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: "nowrap" }}>Unit name (plural):</label>
              <input defaultValue="Reels" style={{ ...inputStyle, width: 110 }} />
            </div>
          </div>

          <div style={{
            background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.22)`,
            borderRadius: 8, padding: "12px 18px", display: "flex", alignItems: "center",
            gap: 10, marginBottom: 24, maxWidth: 600, margin: "0 auto 24px",
          }}>
            <AlertTriangle size={16} color={T.crimson} style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, lineHeight: 1.6 }}>
              <strong>Warning:</strong> Changing the Bun-to-Reel conversion will affect all Jari calculations system-wide, including historical display values and future deduction calculations. This should only be changed if the physical measurement standard changes.
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button style={{
              background: T.green, color: "#fff", border: "none", borderRadius: 999,
              padding: "10px 28px", fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 7,
            }}>
              <Check size={15} /> Save Conversion Settings
            </button>
            <button style={{
              background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
              borderRadius: 999, padding: "10px 20px", fontFamily: F.ui, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 7. SECTION E — RATE CHANGE HISTORY                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "48px 56px" }}>
        <SectionTitle link={
          <GoldLink><Download size={13} /> Download History →</GoldLink>
        }>
          Rate Change History
        </SectionTitle>
        <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 20px 0", lineHeight: 1.7 }}>
          A permanent, immutable log of all rate changes made in the system. This record cannot be edited or deleted and serves as the official audit trail.
        </p>

        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date & Time", "Changed By", "What Was Changed", "Old Value", "New Value", "Reason"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(110,15,45,0.015)" }}>
                  <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" }}>{row.date}</td>
                  <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 12, fontWeight: 500 }}>{row.by}</td>
                  <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 13, fontWeight: 500 }}>{row.what}</td>
                  <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.crimson }}>{row.old}</td>
                  <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.green }}>{row.next}</td>
                  <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 12, fontStyle: "italic", color: T.taupe }}>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table footer */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={12} color={T.taupe} />
              <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>
                This history is permanent and cannot be edited or deleted.
              </span>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => setHistPage(p => Math.max(1, p - 1))}
                style={{
                  background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
                  borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: F.ui, fontSize: 12,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <ChevronLeft size={13} /> Previous
              </button>
              {[1, 2, 3].map(p => (
                <button
                  key={p}
                  onClick={() => setHistPage(p)}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: "none",
                    background: histPage === p ? T.royalBurgundy : "transparent",
                    color: histPage === p ? "#fff" : T.taupe,
                    fontFamily: F.ui, fontSize: 13, cursor: "pointer",
                    fontWeight: histPage === p ? 600 : 400,
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setHistPage(p => Math.min(3, p + 1))}
                style={{
                  background: "transparent", border: `1px solid ${T.borderDef}`, color: T.taupe,
                  borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: F.ui, fontSize: 12,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 8. FOOTER                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: T.luxuryBrown,
        padding: "32px 56px",
        textAlign: "center",
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 400, color: T.warmCream, marginBottom: 6 }}>
          Beere Kesava &amp; Brothers Silks · Est. 1999
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
          Rates &amp; Pricing Management
        </div>
      </div>

    </div>

    {/* Saree Type Card Modal */}
    <AnimatePresence>
      {viewCard && (
        <SareeTypeCard sareeType={viewCard} onClose={() => setViewCard(null)} />
      )}
    </AnimatePresence>
    </>
  );
}
