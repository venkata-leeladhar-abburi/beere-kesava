import React, { useRef, useState, useEffect, useContext, createContext } from "react";
import { imgWarp as _imgWarpLocal, imgResham as _imgReshamLocal, imgJari as _imgJariLocal } from "../constants/imageData";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  AlertTriangle, Package, Eye, Search, ChevronDown, ChevronRight,
  LayoutList, LayoutGrid, Printer, Calendar, SlidersHorizontal, ArrowRight,
  CheckCircle2, XCircle, Archive, FileText, QrCode, Boxes, Layers, Tag,
  Sparkles, Clock, Palette, ClipboardList, UserCheck, Timer, X, Plus,
  Download, BarChart2, History, Filter, Check, ChevronUp, IndianRupee,
  ChevronLeft, PackageCheck,
} from "lucide-react";
import { usePO, PurchaseOrder } from "./POContext";
import { POCreateModal } from "./POCreateModal";
import { PODocumentModal } from "./PODocumentModal";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell,
} from "recharts";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { imgPadmaVeni, imgRaviKumar, imgSureshMurti, imgAnandK } from "../constants/weaverImages";
import { AllPurchasesPage } from "./AllPurchasesPage";
import { useMaterialIssue } from "./MaterialIssueContext";

const imgWarp        = _imgWarpLocal;
const imgResham      = _imgReshamLocal;
const imgJari        = _imgJariLocal;

// ─── Design tokens ────────────────────────────────────────────────────────────
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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const G_GOLD = "linear-gradient(135deg,#C89B47,#E7C983)";
const G_CARD = "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)";
const NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1, "lnum" 1' };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

const MobileCtx = createContext({ isMobile: false, px: 56 });

// ─── AnimatedBar ──────────────────────────────────────────────────────────────
function AnimatedBar({ pct, color, height = 5, trackBg = "rgba(110,15,45,0.09)" }: {
  pct: number; color: string; height?: number; trackBg?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <div ref={ref} style={{ height, borderRadius: 999, background: trackBg, overflow: "hidden" }}>
      <motion.div
        initial={{ width: "0%" }}
        animate={inView ? { width: `${pct}%` } : undefined}
        transition={{ duration: 1.4, delay: 0.2, ease: EASE }}
        style={{ height: "100%", borderRadius: 999, background: color }}
      />
    </div>
  );
}

// ─── FadeUp ───────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style, id }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties; id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, delay, ease: EASE }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedNumber ───────────────────────────────────────────────────────────
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

// ─── SectionHeader — with real visible action button ─────────────────────────
function SectionHeader({
  title,
  action = "View All",
  actionIcon,
  onAction,
  actionVariant = "outline",
}: {
  title: string;
  action?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  actionVariant?: "solid" | "outline" | "gold";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });

  const btnStyle: React.CSSProperties =
    actionVariant === "solid"
      ? { background: T.royalBurgundy, color: "#FFFDF9", border: "none" }
      : actionVariant === "gold"
      ? { background: G_GOLD, color: T.luxuryBrown, border: "none" }
      : { background: "rgba(110,15,45,0.06)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.20)` };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: EASE }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 12 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : undefined}
          transition={{ duration: 0.45, delay: 0.12, ease: EASE }}
          style={{ width: 4, height: 26, borderRadius: 2, background: G_GOLD, transformOrigin: "top", flexShrink: 0 }}
        />
        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 32, color: T.luxuryBrown, letterSpacing: "-0.3px", lineHeight: 1.15 }}>
          {title}
        </span>
      </div>
      <motion.button
        onClick={onAction}
        whileHover={{ scale: 1.04, boxShadow: "0 6px 22px rgba(110,15,45,0.22)" }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.18 }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 20px", borderRadius: 10, cursor: "pointer",
          fontFamily: F.ui, fontWeight: 700, fontSize: 13.5,
          boxShadow: "0 2px 10px rgba(110,15,45,0.10)",
          transition: "all 0.18s",
          ...btnStyle,
        }}
      >
        {actionIcon}
        {action}
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL OVERLAY WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════
function ModalOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(61,14,26,0.60)", backdropFilter: "blur(4px)",
            zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.28, ease: EASE }}
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFFDF9", borderRadius: 22, boxShadow: "0 40px 120px rgba(61,14,26,0.40)",
              width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto",
              border: `1px solid ${T.borderDef}`,
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, borderRadius: "22px 22px 0 0", padding: "26px 28px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: "#FFFDF9", marginBottom: subtitle ? 4 : 0 }}>{title}</div>
        {subtitle && <div style={{ fontFamily: F.ui, fontSize: 13.5, color: "rgba(255,253,249,0.65)" }}>{subtitle}</div>}
      </div>
      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.18)" }}
        whileTap={{ scale: 0.95 }}
        style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
      >
        <X size={18} color="#FFFDF9" />
      </motion.button>
    </div>
  );
}

// ─── ADD NEW STOCK MODAL ──────────────────────────────────────────────────────
function AddNewStockModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    materialType: "Warp",
    details: "",
    vendor: "",
    receivedDate: "",
    quantity: "",
    quantityGm: "",
    jariUnit: "Reels" as "Reels" | "Buns",
    warpReshamUnit: "kg" as "kg" | "g",
    pricePerKg: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.details || !form.vendor || !form.receivedDate || !form.quantity) return;
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); onClose(); setForm({ materialType: "Warp", details: "", vendor: "", receivedDate: "", quantity: "", quantityGm: "", jariUnit: "Reels", warpReshamUnit: "kg", pricePerKg: "", notes: "" }); }, 1800);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown,
    border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 10,
    padding: "11px 14px", outline: "none", background: T.warmIvory, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, color: T.taupe,
    letterSpacing: "0.3px", marginBottom: 6, display: "block",
  };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <ModalHeader title="Add New Stock" subtitle="Record a new material delivery from a vendor" onClose={onClose} />
      <div style={{ padding: "28px 28px 24px" }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(30,102,64,0.12)", border: "2px solid rgba(30,102,64,0.30)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Check size={32} color={T.green} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: T.green, marginBottom: 8 }}>Stock Added Successfully!</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>The new batch has been recorded and is now in the system.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Material Type */}
            <div>
              <label style={labelStyle}>Material Type *</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["Warp", "Resham", "Jari"].map(t => (
                  <motion.button
                    key={t}
                    onClick={() => set("materialType", t)}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer",
                      fontFamily: F.ui, fontWeight: 700, fontSize: 14,
                      background: form.materialType === t ? T.royalBurgundy : T.warmIvory,
                      color: form.materialType === t ? "#FFFDF9" : T.taupe,
                      border: form.materialType === t ? "none" : `1.5px solid rgba(110,15,45,0.18)`,
                    }}
                  >{t}</motion.button>
                ))}
              </div>
            </div>

            {/* Details + Vendor */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Material Details *</label>
                <input value={form.details} onChange={e => set("details", e.target.value)} placeholder="e.g. Cotton/Silk, Silk Red, Polyester 2G Gold" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Vendor Name *</label>
                <input value={form.vendor} onChange={e => set("vendor", e.target.value)} placeholder="e.g. Sri Venkateswara Textiles" style={inputStyle} />
              </div>
            </div>

            {/* Date + Quantity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Date Received *</label>
                <input type="date" value={form.receivedDate} onChange={e => set("receivedDate", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>
                  {form.materialType === "Jari" ? `Quantity (${form.jariUnit}) *` : `Quantity Received (${form.warpReshamUnit || "kg"}) *`}
                </label>
                {form.materialType === "Jari" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      {(["Reels", "Buns"] as const).map(u => (
                        <button key={u} onClick={() => set("jariUnit", u)} style={{
                          flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
                          fontFamily: F.ui, fontSize: 13, fontWeight: 700,
                          background: form.jariUnit === u ? T.royalBurgundy : T.warmIvory,
                          color: form.jariUnit === u ? "#FFFDF9" : T.taupe,
                          border: form.jariUnit === u ? "none" : `1.5px solid rgba(110,15,45,0.18)`,
                        }}>{u}</button>
                      ))}
                    </div>
                    <div style={{ position: "relative" }}>
                      <input type="number" value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="0" style={{ ...inputStyle, paddingRight: 52 }} />
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{form.jariUnit}</span>
                    </div>
                    {form.quantity && (
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold }}>
                        = {form.jariUnit === "Reels" ? `${Math.round(parseFloat(form.quantity) / 4)} Buns` : `${Math.round(parseFloat(form.quantity) * 4)} Reels`} <span style={{ color: T.taupe }}>(1 Bun = 4 Reels)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      {(["kg", "g"] as const).map(u => (
                        <button key={u} onClick={() => set("warpReshamUnit", u)} style={{
                          flex: 1, padding: "8px 0", borderRadius: 9, cursor: "pointer",
                          fontFamily: F.ui, fontSize: 13, fontWeight: 700,
                          background: (form.warpReshamUnit || "kg") === u ? T.royalBurgundy : T.warmIvory,
                          color: (form.warpReshamUnit || "kg") === u ? "#FFFDF9" : T.taupe,
                          border: (form.warpReshamUnit || "kg") === u ? "none" : `1.5px solid rgba(110,15,45,0.18)`,
                        }}>{u}</button>
                      ))}
                    </div>
                    <div style={{ position: "relative" }}>
                      <input type="number" value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="0" style={{ ...inputStyle, paddingRight: 36 }} />
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{form.warpReshamUnit || "kg"}</span>
                    </div>
                    {form.quantity && (
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>
                        = {(form.warpReshamUnit || "kg") === "kg" ? `${(parseFloat(form.quantity) * 1000).toFixed(0)} g` : `${(parseFloat(form.quantity) / 1000).toFixed(3)} kg`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Price per kg */}
            <div>
              <label style={labelStyle}>Price Per Kg (₹)</label>
              <input type="number" value={form.pricePerKg} onChange={e => set("pricePerKg", e.target.value)} placeholder="e.g. 280" style={inputStyle} />
              {form.quantity && form.pricePerKg && (
                <div style={{ marginTop: 8, fontFamily: F.ui, fontSize: 13, color: T.antiqueGold, fontWeight: 600 }}>
                  Total value: ₹{(parseFloat(form.quantity) * parseFloat(form.pricePerKg)).toLocaleString("en-IN")}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label style={labelStyle}>Notes / Additional Info</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any additional notes about this batch..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, background: T.warmIvory, color: T.taupe, border: `1.5px solid rgba(110,15,45,0.18)` }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSubmit}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }}
                whileTap={{ scale: 0.97 }}
                style={{ flex: 2, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Plus size={16} /> Add to Stock
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

// ─── BATCH VIEW DETAILS MODAL ─────────────────────────────────────────────────
type BatchRow = { id: string; type: string; details: string; vendor: string; date: string; received: number; given: number; remaining: number; statusType: StatusType };
type StatusType = "good" | "warning" | "critical" | "empty";

const STATUS_CFG: Record<StatusType, { dot: string; color: string; bg: string; text: string; icon: React.ReactNode }> = {
  good:     { dot: T.green,       color: T.green,       bg: "rgba(30,102,64,0.09)",   text: "In Stock",         icon: <CheckCircle2 size={13} /> },
  warning:  { dot: T.antiqueGold, color: "#7A5E1C",     bg: "rgba(200,155,71,0.12)",  text: "Running Low",      icon: <AlertTriangle size={13} /> },
  critical: { dot: T.crimson,     color: T.crimson,     bg: "rgba(192,57,43,0.09)",   text: "Very Low",         icon: <AlertTriangle size={13} /> },
  empty:    { dot: T.taupe,       color: T.taupe,       bg: "rgba(139,112,96,0.09)",  text: "All Used Up",      icon: <Archive size={13} /> },
};

function BatchViewDetailsModal({ batch, onClose }: { batch: BatchRow | null; onClose: () => void }) {
  if (!batch) return null;
  const sc = STATUS_CFG[batch.statusType];
  const remPct = batch.received > 0 ? Math.round((batch.remaining / batch.received) * 100) : 0;
  const usagePct = batch.received > 0 ? Math.round((batch.given / batch.received) * 100) : 0;

  const MAT_TAG: Record<string, { col: string; bg: string }> = {
    Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.09)"   },
    Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.13)"  },
    Jari:   { col: T.luxuryBrown,   bg: "rgba(59,35,20,0.09)"    },
  };
  const mt = MAT_TAG[batch.type];

  return (
    <ModalOverlay open={!!batch} onClose={onClose}>
      <ModalHeader title="Batch Details" subtitle={`Full information for batch ${batch.id}`} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        {/* Batch ID + type row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <span style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "6px 14px", borderRadius: 8, letterSpacing: "0.3px" }}>{batch.id}</span>
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: mt.col, background: mt.bg, padding: "6px 14px", borderRadius: 20 }}>{batch.type}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: sc.bg, color: sc.color, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 20 }}>
            {sc.icon} {sc.text}
          </span>
        </div>

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Material Details", value: batch.details },
            { label: "Vendor", value: batch.vendor },
            { label: "Date Received", value: batch.date },
            { label: "Material Type", value: batch.type },
          ].map(row => (
            <div key={row.label} style={{ background: T.silkCream, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 5 }}>{row.label}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{row.value}</div>
            </div>
          ))}
        </div>

        {/* Quantities */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Received", value: batch.received, color: T.luxuryBrown, icon: <Package size={18} color={T.royalBurgundy} /> },
            { label: "Given to Weavers", value: batch.given, color: T.taupe, icon: <ArrowRight size={18} color={T.antiqueGold} /> },
            { label: "Remaining", value: batch.remaining, color: sc.color, icon: <CheckCircle2 size={18} color={sc.color} /> },
          ].map(row => (
            <div key={row.label} style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "16px 16px 14px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{row.icon}</div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: batch.type === "Jari" ? 20 : 28, color: row.color, lineHeight: 1.2 }}>
                {batch.type === "Jari" ? (
                  <>
                    <div>{row.value} Buns</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.taupe, marginTop: 3 }}>({row.value * 4} Reels)</div>
                  </>
                ) : (
                  row.value
                )}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 4 }}>
                {row.label} {batch.type === "Jari" ? "" : "(kg)"}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div style={{ background: T.silkCream, borderRadius: 14, padding: "18px 20px", marginBottom: 22 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Stock remaining</span>
              <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: sc.color }}>{remPct}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(110,15,45,0.10)", borderRadius: 4 }}>
              <div style={{ width: `${remPct}%`, height: "100%", background: sc.dot, borderRadius: 4 }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Usage rate</span>
              <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.antiqueGold }}>{usagePct}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(200,155,71,0.12)", borderRadius: 4 }}>
              <div style={{ width: `${usagePct}%`, height: "100%", background: T.antiqueGold, borderRadius: 4 }} />
            </div>
          </div>
        </div>

        {/* Close button */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(110,15,45,0.22)" }}
          whileTap={{ scale: 0.97 }}
          style={{ width: "100%", padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}
        >
          Close
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

// ─── PRINT BARCODE MODAL ──────────────────────────────────────────────────────
function PrintBarcodeModal({ batch, onClose }: { batch: BatchRow | null; onClose: () => void }) {
  if (!batch) return null;
  const MAT_TAG: Record<string, { col: string; bg: string }> = {
    Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.09)"   },
    Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.13)"  },
    Jari:   { col: T.luxuryBrown,   bg: "rgba(59,35,20,0.09)"    },
  };
  const mt = MAT_TAG[batch.type];

  // Generate a simple barcode visualization from the batch ID
  const barPattern = batch.id.split("").map(c => c.charCodeAt(0));

  return (
    <ModalOverlay open={!!batch} onClose={onClose}>
      <ModalHeader title="Print Barcode" subtitle={`Barcode label for batch ${batch.id}`} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        {/* Label preview card */}
        <div style={{ background: "#FFFFFF", border: `2px dashed rgba(110,15,45,0.20)`, borderRadius: 16, padding: "28px 28px 24px", marginBottom: 22, textAlign: "center" }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "2px", color: T.taupe, textTransform: "uppercase", marginBottom: 10 }}>Beere Kesava & Brothers Silks</div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: T.luxuryBrown, marginBottom: 4 }}>{batch.type} — {batch.details}</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 18 }}>{batch.vendor} · {batch.date}</div>

          {/* Simulated barcode bars */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2, height: 60, marginBottom: 10 }}>
            {barPattern.slice(0, 32).map((v, i) => (
              <div key={i} style={{ width: i % 3 === 0 ? 3 : 1.5, height: `${40 + (v % 20)}%`, background: T.darkBurgundy, borderRadius: 1 }} />
            ))}
          </div>

          <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, letterSpacing: "3px", marginBottom: 14 }}>{batch.id}</div>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: mt.col, background: mt.bg, padding: "4px 12px", borderRadius: 6, letterSpacing: "1px" }}>{batch.type}</span>
            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, background: T.silkCream, padding: "4px 12px", borderRadius: 6 }}>Received: {batch.received} kg</span>
            <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, background: T.silkCream, padding: "4px 12px", borderRadius: 6 }}>Remaining: {batch.remaining} kg</span>
          </div>
        </div>

        {/* Print info */}
        <div style={{ background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.22)", borderRadius: 10, padding: "12px 16px", marginBottom: 22 }}>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: "#7A5E1C", lineHeight: 1.6 }}>
            <strong>Print instructions:</strong> This barcode label can be printed and attached to the physical material batch for easy scanning and tracking.
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, background: T.warmIvory, color: T.taupe, border: `1.5px solid rgba(110,15,45,0.18)` }}>
            Cancel
          </motion.button>
          <motion.button
            onClick={() => { window.print(); }}
            whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }}
            whileTap={{ scale: 0.97 }}
            style={{ flex: 2, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Printer size={16} /> Print Barcode Label
          </motion.button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── WEAVER VIEW DETAILS MODAL ────────────────────────────────────────────────
type WeaverStatus = "on-time" | "approaching" | "overdue" | "quality";
type WeaverMat = { name: string; id: string; initials: string; avatarBg: string; batch: string; daysAgo: number; img?: string; status: WeaverStatus; statusText: string; warp: string; resham: string; jari: string; expected: number; done: number; design: string };

function WeaverViewDetailsModal({ weaver, onClose }: { weaver: WeaverMat | null; onClose: () => void }) {
  if (!weaver) return null;
  const pct = Math.round((weaver.done / weaver.expected) * 100);
  const barColor = weaver.status === "overdue" ? T.crimson : weaver.status === "on-time" ? T.green : T.antiqueGold;

  const W_STATUS: Record<WeaverStatus, { border: string; bannerBg: string; bannerColor: string }> = {
    "on-time":    { border: T.royalBurgundy, bannerBg: "rgba(30,102,64,0.10)",  bannerColor: T.green       },
    "approaching":{ border: T.antiqueGold,   bannerBg: "rgba(200,155,71,0.12)", bannerColor: "#7A5E1C"    },
    "overdue":    { border: T.crimson,       bannerBg: "rgba(192,57,43,0.10)",  bannerColor: T.crimson     },
    "quality":    { border: T.antiqueGold,   bannerBg: "rgba(200,155,71,0.12)", bannerColor: "#7A5E1C"    },
  };
  const sc = W_STATUS[weaver.status];

  return (
    <ModalOverlay open={!!weaver} onClose={onClose}>
      <ModalHeader title="Weaver Details" subtitle={`Material issued to ${weaver.name}`} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        {/* Weaver profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22, background: T.silkCream, borderRadius: 16, padding: "18px 20px" }}>
          {weaver.img
            ? <img src={weaver.img} alt={weaver.name} style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", objectPosition: "top center", border: `2px solid ${T.borderGold}`, flexShrink: 0 }} />
            : <div style={{ width: 64, height: 64, borderRadius: 16, background: weaver.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.display, fontSize: 22, color: "#FFFDF9", fontWeight: 700 }}>{weaver.initials}</span>
              </div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: T.luxuryBrown, marginBottom: 6 }}>{weaver.name}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", padding: "3px 10px", borderRadius: 6 }}>{weaver.id}</span>
              <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe, background: "#FFFFFF", padding: "3px 10px", borderRadius: 6, border: `1px solid ${T.borderDef}` }}>{weaver.batch}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Issued {weaver.daysAgo} days ago</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 18, background: sc.bannerBg, borderRadius: 12, padding: "13px 16px" }}>
          <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: sc.bannerColor }}>{weaver.statusText}</span>
        </div>

        {/* Materials given */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>Materials Issued</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: <Layers size={16} color={T.royalBurgundy} />, label: "Warp", value: weaver.warp, bg: "rgba(110,15,45,0.06)" },
              { icon: <Tag size={16} color="#7A5E1C" />, label: "Resham", value: weaver.resham, bg: "rgba(200,155,71,0.08)" },
              { icon: <Sparkles size={16} color={T.luxuryBrown} />, label: "Jari", value: weaver.jari, bg: "rgba(59,35,20,0.06)" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 14, background: row.bg, borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>{row.icon}</div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 2 }}>{row.label} Given</div>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div style={{ background: T.silkCream, borderRadius: 12, padding: "16px 18px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.luxuryBrown }}>Sarees Progress</div>
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 15, color: barColor }}>{weaver.done} / {weaver.expected} done</span>
          </div>
          <div style={{ height: 10, background: "rgba(110,15,45,0.10)", borderRadius: 5, marginBottom: 8 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 5 }} />
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{pct}% complete · {weaver.expected - weaver.done} sarees remaining</div>
        </div>

        {/* Design */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(110,15,45,0.05)", borderRadius: 10, padding: "12px 16px", marginBottom: 22 }}>
          <Palette size={16} color={T.royalBurgundy} />
          <div>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Design Code: </span>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: T.royalBurgundy, fontWeight: 700 }}>{weaver.design}</span>
          </div>
        </div>

        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(110,15,45,0.22)" }}
          whileTap={{ scale: 0.97 }}
          style={{ width: "100%", padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}
        >
          Close
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

// ─── ISSUE SLIP MODAL ─────────────────────────────────────────────────────────
function IssueSlipModal({ weaver, onClose }: { weaver: WeaverMat | null; onClose: () => void }) {
  if (!weaver) return null;
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const slipNo = `ISS-${weaver.id}-${weaver.batch}-${Date.now().toString().slice(-4)}`;

  return (
    <ModalOverlay open={!!weaver} onClose={onClose}>
      <ModalHeader title="Issue Slip" subtitle="Material issue record for weaver" onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        {/* Slip document */}
        <div style={{ background: "#FFFFFF", border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 16, padding: "24px 26px", marginBottom: 22 }}>
          {/* Slip header */}
          <div style={{ textAlign: "center", borderBottom: `1.5px solid rgba(110,15,45,0.12)`, paddingBottom: 18, marginBottom: 18 }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 2 }}>Beere Kesava & Brothers Silks</div>
            <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "2.5px", textTransform: "uppercase", color: T.taupe, marginBottom: 10 }}>Material Issue Slip</div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "3px 10px", borderRadius: 6 }}>{slipNo}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Date: {today}</span>
            </div>
          </div>

          {/* Weaver info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Weaver Name", value: weaver.name },
              { label: "Weaver ID", value: weaver.id },
              { label: "Batch Number", value: weaver.batch },
              { label: "Design Code", value: weaver.design },
            ].map(row => (
              <div key={row.label}>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 3 }}>{row.label}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{row.value}</div>
              </div>
            ))}
          </div>

          {/* Materials table */}
          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid rgba(110,15,45,0.10)`, marginBottom: 16 }}>
            <div style={{ background: T.silkCream, padding: "10px 16px", display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 8 }}>
              {["Material", "Specification", "Quantity"].map(h => (
                <span key={h} style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {[
              { mat: "Warp", spec: "Cotton / Silk", qty: weaver.warp },
              { mat: "Resham", spec: weaver.resham, qty: "— see spec" },
              { mat: "Jari", spec: weaver.jari, qty: "— see spec" },
            ].map((row, i) => (
              <div key={row.mat} style={{ padding: "11px 16px", display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 8, background: i % 2 === 0 ? "#FFFFFF" : T.warmIvory, borderTop: `1px solid rgba(110,15,45,0.06)` }}>
                <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13.5, color: T.luxuryBrown }}>{row.mat}</span>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{row.spec}</span>
                <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 600, color: T.royalBurgundy }}>{row.qty}</span>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {["Issued By (Signature)", "Received By (Weaver)"].map(s => (
              <div key={s}>
                <div style={{ height: 36, borderBottom: `1.5px solid rgba(110,15,45,0.18)`, marginBottom: 6 }} />
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, background: T.warmIvory, color: T.taupe, border: `1.5px solid rgba(110,15,45,0.18)` }}>
            Close
          </motion.button>
          <motion.button
            onClick={() => window.print()}
            whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }}
            whileTap={{ scale: 0.97 }}
            style={{ flex: 2, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Printer size={16} /> Print Issue Slip
          </motion.button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── CUSTOM DATE PICKER ───────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function DatePickerInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [mode, setMode] = useState<"day" | "month" | "year">("day");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const parsed = value ? new Date(value) : null;
  const displayValue = parsed
    ? `${parsed.getDate()} ${MONTHS_SHORT[parsed.getMonth()]} ${parsed.getFullYear()}`
    : "";

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const selectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(d.toISOString().split("T")[0]);
    setOpen(false);
  };

  const yearRange = Array.from({ length: 10 }, (_, i) => viewYear - 4 + i);

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, minWidth: 160 }}>
      {label && <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>}
      <motion.button
        onClick={() => { setOpen(o => !o); setMode("day"); }}
        whileHover={{ borderColor: T.royalBurgundy }}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
          background: T.warmIvory, border: `1.5px solid ${open ? T.royalBurgundy : "rgba(110,15,45,0.18)"}`,
          borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14,
          color: displayValue ? T.luxuryBrown : T.taupe, textAlign: "left",
          transition: "border-color 0.2s",
        }}
      >
        <Calendar size={15} color={open ? T.royalBurgundy : T.taupe} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{displayValue || "Select date"}</span>
        <ChevronDown size={13} color={T.taupe} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 500,
              background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`,
              boxShadow: "0 16px 48px rgba(74,6,27,0.18)", padding: "16px", width: 276,
            }}
          >
            {/* Month/Year header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <motion.button
                onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
                whileHover={{ background: T.silkCream }} whileTap={{ scale: 0.92 }}
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <ChevronLeft size={14} color={T.taupe} />
              </motion.button>

              <div style={{ display: "flex", gap: 6 }}>
                <motion.button
                  onClick={() => setMode(m => m === "month" ? "day" : "month")}
                  whileHover={{ background: T.silkCream }}
                  style={{ padding: "4px 10px", borderRadius: 7, border: `1px solid ${T.borderDef}`, background: mode === "month" ? T.silkCream : "transparent", cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}
                >
                  {MONTHS_SHORT[viewMonth]}
                </motion.button>
                <motion.button
                  onClick={() => setMode(m => m === "year" ? "day" : "year")}
                  whileHover={{ background: T.silkCream }}
                  style={{ padding: "4px 10px", borderRadius: 7, border: `1px solid ${T.borderDef}`, background: mode === "year" ? T.silkCream : "transparent", cursor: "pointer", fontFamily: F.mono, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}
                >
                  {viewYear}
                </motion.button>
              </div>

              <motion.button
                onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
                whileHover={{ background: T.silkCream }} whileTap={{ scale: 0.92 }}
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <ChevronRight size={14} color={T.taupe} />
              </motion.button>
            </div>

            {/* Month picker */}
            {mode === "month" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {MONTHS_SHORT.map((m, i) => (
                  <motion.button key={m} onClick={() => { setViewMonth(i); setMode("day"); }}
                    whileHover={{ background: T.silkCream }}
                    style={{ padding: "8px 4px", borderRadius: 8, border: `1px solid ${i === viewMonth ? T.royalBurgundy : T.borderDef}`, background: i === viewMonth ? "rgba(110,15,45,0.08)" : "transparent", cursor: "pointer", fontFamily: F.ui, fontSize: 12.5, fontWeight: i === viewMonth ? 700 : 400, color: i === viewMonth ? T.royalBurgundy : T.luxuryBrown, textAlign: "center" }}>
                    {m}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Year picker */}
            {mode === "year" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                {yearRange.map(y => (
                  <motion.button key={y} onClick={() => { setViewYear(y); setMode("day"); }}
                    whileHover={{ background: T.silkCream }}
                    style={{ padding: "8px 4px", borderRadius: 8, border: `1px solid ${y === viewYear ? T.royalBurgundy : T.borderDef}`, background: y === viewYear ? "rgba(110,15,45,0.08)" : "transparent", cursor: "pointer", fontFamily: F.mono, fontSize: 13, fontWeight: y === viewYear ? 700 : 400, color: y === viewYear ? T.royalBurgundy : T.luxuryBrown, textAlign: "center" }}>
                    {y}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Day grid */}
            {mode === "day" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                    <div key={d} style={{ textAlign: "center", fontFamily: F.mono, fontSize: 10, color: T.taupe, padding: "4px 0", fontWeight: 600, letterSpacing: "0.5px" }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                  {Array.from({ length: getFirstDayOfMonth(viewYear, viewMonth) }, (_, i) => (
                    <div key={`e-${i}`} />
                  ))}
                  {Array.from({ length: getDaysInMonth(viewYear, viewMonth) }, (_, i) => {
                    const day = i + 1;
                    const isSelected = parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;
                    const isToday = new Date().getFullYear() === viewYear && new Date().getMonth() === viewMonth && new Date().getDate() === day;
                    return (
                      <motion.button
                        key={day}
                        onClick={() => selectDay(day)}
                        whileHover={{ background: isSelected ? T.royalBurgundy : T.silkCream }}
                        style={{
                          height: 32, borderRadius: 7, border: isToday && !isSelected ? `1.5px solid rgba(110,15,45,0.30)` : "1px solid transparent",
                          background: isSelected ? T.royalBurgundy : "transparent",
                          cursor: "pointer", fontFamily: F.ui, fontSize: 12.5, fontWeight: isSelected ? 700 : 400,
                          color: isSelected ? "#FFFDF9" : T.luxuryBrown, display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {day}
                      </motion.button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Clear button */}
            {value && (
              <motion.button
                onClick={() => { onChange(""); setOpen(false); }}
                whileHover={{ background: "rgba(192,57,43,0.08)" }}
                style={{ width: "100%", marginTop: 12, padding: "7px 0", borderRadius: 8, border: "1px solid rgba(192,57,43,0.20)", background: "transparent", cursor: "pointer", fontFamily: F.ui, fontSize: 12.5, color: "#C0392B", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <X size={12} /> Clear date
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── FULL REPORTS MODAL ───────────────────────────────────────────────────────
function FullReportsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalOverlay open={open} onClose={onClose}>
      <ModalHeader title="Full Reports" subtitle="Detailed stock analysis and material reports" onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 22 }}>
          {[
            { icon: <Package size={20} color={T.royalBurgundy} />, title: "Current Stock Report", desc: "Full breakdown of all materials currently in stock with quantities and values", bg: "rgba(110,15,45,0.05)" },
            { icon: <BarChart2 size={20} color={T.antiqueGold} />, title: "Stock Movement Report", desc: "All inward and outward movement of materials over the selected period", bg: "rgba(200,155,71,0.07)" },
            { icon: <FileText size={20} color={T.green} />, title: "Vendor Purchase Report", desc: "Total purchases from each vendor with cost breakdown and order history", bg: "rgba(30,102,64,0.06)" },
            { icon: <AlertTriangle size={20} color={T.crimson} />, title: "Low Stock Alert Report", desc: "All materials that have gone below minimum stock levels requiring reorder", bg: "rgba(192,57,43,0.06)" },
          ].map((r, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.01, boxShadow: "0 6px 20px rgba(74,6,27,0.10)" }}
              style={{ display: "flex", alignItems: "flex-start", gap: 16, background: r.bg, borderRadius: 14, padding: "18px 20px", cursor: "pointer", border: `1px solid rgba(110,15,45,0.09)` }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>{r.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown, marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.5 }}>{r.desc}</div>
              </div>
              <Download size={16} color={T.taupe} style={{ flexShrink: 0, marginTop: 4 }} />
            </motion.div>
          ))}
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ width: "100%", padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}>
          Close
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

// ─── FULL ISSUE HISTORY MODAL ─────────────────────────────────────────────────
function FullIssueHistoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const historyEntries = [
    { ref: "ISS-PV-BATCH086-20260501", weaver: "Padma Veni", weaverId: "WV002", batch: "BATCH-086", materials: "Warp 4.5kg · Resham 1.2kg · Jari 6 Reels", date: "01 May 2026, 2:15 PM", status: "Active" },
    { ref: "ISS-RK-BATCH089-20260429", weaver: "Ravi Kumar", weaverId: "WV001", batch: "BATCH-089", materials: "Warp 6kg · Resham 900g · Jari 8 Reels", date: "29 Apr 2026, 9:45 AM", status: "Active" },
    { ref: "ISS-SM-BATCH081-20260427", weaver: "Suresh Murti", weaverId: "WV003", batch: "BATCH-081", materials: "Warp 3kg · Resham 900g · Jari 5 Reels", date: "27 Apr 2026, 10:00 AM", status: "Quality Check" },
    { ref: "ISS-AK-BATCH083-20260425", weaver: "Anand K.", weaverId: "WV005", batch: "BATCH-083", materials: "Warp 5kg · Resham 700g · Jari 6 Reels", date: "25 Apr 2026, 11:30 AM", status: "Active" },
    { ref: "ISS-MR-BATCH085-20260423", weaver: "Meena R.", weaverId: "WV004", batch: "BATCH-085", materials: "Warp 3.5kg · Resham 700g · Jari 5 Reels", date: "23 Apr 2026, 2:00 PM", status: "Overdue" },
    { ref: "ISS-RK-BATCH077-20260415", weaver: "Ravi Kumar", weaverId: "WV001", batch: "BATCH-077", materials: "Warp 5.5kg · Resham 1.1kg · Jari 7 Reels", date: "15 Apr 2026, 9:00 AM", status: "Completed" },
  ];

  const statusColors: Record<string, string> = { Active: T.green, "Quality Check": "#7A5E1C", Overdue: T.crimson, Completed: T.taupe };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <ModalHeader title="Full Issue History" subtitle="All material issues to weavers — complete record" onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
          {historyEntries.map((entry, i) => (
            <motion.div
              key={entry.ref}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "14px 18px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown, marginBottom: 3 }}>{entry.weaver}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 10.5, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>{entry.weaverId}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe }}>{entry.batch}</span>
                  </div>
                </div>
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: statusColors[entry.status] || T.taupe, background: `${statusColors[entry.status]}18` || T.silkCream, padding: "4px 10px", borderRadius: 20 }}>{entry.status}</span>
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 6 }}>{entry.materials}</div>
              <div style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>{entry.date}</div>
            </motion.div>
          ))}
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ width: "100%", padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}>
          Close
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

// ─── DOWNLOAD REPORT MODAL ────────────────────────────────────────────────────
function DownloadReportModal({ open, onClose, title }: { open: boolean; onClose: () => void; title: string }) {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => { setDownloading(false); setDone(true); }, 1500);
    setTimeout(() => { setDone(false); onClose(); }, 3000);
  };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <ModalHeader title={`Download ${title}`} subtitle="Choose format and export options" onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(30,102,64,0.12)", border: "2px solid rgba(30,102,64,0.30)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Check size={32} color={T.green} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: T.green, marginBottom: 8 }}>Report Downloaded!</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Your report has been saved successfully.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
              {[
                { fmt: "PDF Report", icon: <FileText size={20} color={T.royalBurgundy} />, desc: "Formatted document with charts and tables", bg: "rgba(110,15,45,0.05)" },
                { fmt: "Excel Spreadsheet", icon: <BarChart2 size={20} color={T.green} />, desc: "Raw data in .xlsx format for analysis", bg: "rgba(30,102,64,0.05)" },
                { fmt: "CSV File", icon: <Download size={20} color={T.antiqueGold} />, desc: "Simple comma-separated values file", bg: "rgba(200,155,71,0.07)" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: f.bg, borderRadius: 12, padding: "14px 16px", cursor: "pointer", border: `1px solid rgba(110,15,45,0.08)` }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{f.fmt}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, background: T.warmIvory, color: T.taupe, border: `1.5px solid rgba(110,15,45,0.18)` }}>
                Cancel
              </motion.button>
              <motion.button
                onClick={handleDownload}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }}
                whileTap={{ scale: 0.97 }}
                style={{ flex: 2, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {downloading ? "Generating..." : <><Download size={16} /> Download Report</>}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — PAGE HEADER
// ═══════════════════════════════════════════════════════════════════════════════
function PageHeader() {
  const { isMobile, px } = useContext(MobileCtx);
  return (
    <header style={{ background: T.darkBurgundy, position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
      <div style={{ position: "relative", zIndex: 2, padding: `48px ${px}px 90px`, flex: "0 0 65%", maxWidth: "65%" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
          Since 1999 · Raw Material Management
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Materials</h1>
          <span style={{ fontFamily: F.display, fontSize: 32, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Inventory Overview</span>
        </div>
        <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 16, color: "rgba(255,253,249,0.70)", lineHeight: 1.6, maxWidth: 600, margin: "0 0 20px" }}>
          See all raw materials in stock — Warp, Resham, and Jari. Track what was received, what was given to weavers, and what is remaining.
        </p>
      </div>

      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, ${T.darkBurgundy} 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
        <ImageWithFallback src={imgWarp} alt="Silk warp thread material" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.65) saturate(0.85)" }} />
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — METRICS BAR
// ═══════════════════════════════════════════════════════════════════════════════
const MATERIAL_METRICS = [
  { label: "Total In Stock",       val: "322", sub: "kg Warp & Resham",  hi: false },
  { label: "Warp Available",       val: "142", sub: "approx 284 sarees", hi: false },
  { label: "Resham Available",     val: "180", sub: "6 colors",          hi: false },
  { label: "Jari Alerts",          val: "36 Buns",  sub: "(144 Reels) · some colors low",           hi: true  },
];

function MetricsBar() {
  const { px } = useContext(MobileCtx);
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      style={{ padding: `0 ${px}px`, marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: G_CARD, borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {MATERIAL_METRICS.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 22px",
              backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              backgroundColor: "rgba(0,0,0,0)",
              borderRight: i < 3 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative",
              cursor: "pointer",
            }}
          >
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
            {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: G_GOLD }} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — STOCK ALERTS CARD
// ═══════════════════════════════════════════════════════════════════════════════
const ALERTS = [
  { type: "JARI",   subtype: "Polyester · 1G · Silver", batchId: "JRI-PLY-1G-SLV-20260501-002", current: "4 Buns (16 Reels)",  minimum: "20 Buns (80 Reels)",  pct: 20 },
  { type: "RESHAM", subtype: "Silk · Green",            batchId: "RSM-GRN-20260428-001",         current: "2 kg",  minimum: "8 kg",  pct: 25 },
  { type: "WARP",   subtype: "Cotton / Silk",           batchId: "WRP-20260428-003",             current: "4 kg",  minimum: "10 kg", pct: 40 },
];

const JARI_STOCK_TYPES = [
  { key: "poly-2g-gold", label: "Polyester 2G Gold", buns: 4, reels: 16 },
  { key: "silkfast-2g-gold", label: "Silk Fast 2G Gold", buns: 2, reels: 8 },
];

function ThresholdsModal({ open, onClose, thresholds, onSave }: {
  open: boolean; onClose: () => void;
  thresholds: { warp: number; resham: number; jari: Record<string, { qty: number; unit: "Buns" | "Reels" }> };
  onSave: (t: { warp: number; resham: number; jari: Record<string, { qty: number; unit: "Buns" | "Reels" }> }) => void;
}) {
  const [warp, setWarp] = useState(thresholds.warp);
  const [resham, setResham] = useState(thresholds.resham);
  const [jari, setJari] = useState(thresholds.jari);

  useEffect(() => {
    if (open) { setWarp(thresholds.warp); setResham(thresholds.resham); setJari(thresholds.jari); }
  }, [open, thresholds]);

  const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, background: T.silkCream, borderRadius: 12, padding: "14px 16px" };
  const chipStyle = (col: string, bg: string): React.CSSProperties => ({ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: col, background: bg, borderRadius: 6, padding: "4px 10px", flexShrink: 0 });
  const inputStyle: React.CSSProperties = { width: 90, fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 8, padding: "8px 10px", outline: "none", background: "#FFFFFF" };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <ModalHeader title="Set Alert Thresholds" subtitle="Define minimum stock levels that trigger a low-stock alert" onClose={onClose} />
      <div style={{ padding: "26px 28px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={rowStyle}>
          <span style={chipStyle(T.royalBurgundy, "rgba(110,15,45,0.09)")}>Warp</span>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, flex: 1 }}>Cotton / Silk</span>
          <input type="number" value={warp} onChange={e => setWarp(parseFloat(e.target.value) || 0)} style={inputStyle} />
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>kg</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginLeft: 8 }}>Current: 4 kg</span>
        </div>
        <div style={rowStyle}>
          <span style={chipStyle("#7A5E1C", "rgba(200,155,71,0.13)")}>Resham</span>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, flex: 1 }}>Silk · Green</span>
          <input type="number" value={resham} onChange={e => setResham(parseFloat(e.target.value) || 0)} style={inputStyle} />
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>kg</span>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginLeft: 8 }}>Current: 2 kg</span>
        </div>
        {JARI_STOCK_TYPES.map(jt => {
          const val = jari[jt.key] || { qty: 0, unit: "Buns" as const };
          return (
            <div key={jt.key} style={rowStyle}>
              <span style={chipStyle(T.luxuryBrown, "rgba(59,35,20,0.09)")}>Jari</span>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, flex: 1 }}>{jt.label}</span>
              <input type="number" value={val.qty} onChange={e => setJari(prev => ({ ...prev, [jt.key]: { ...val, qty: parseFloat(e.target.value) || 0 } }))} style={inputStyle} />
              <div style={{ display: "flex", border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 8, overflow: "hidden" }}>
                {(["Buns", "Reels"] as const).map(u => (
                  <button key={u} onClick={() => setJari(prev => ({ ...prev, [jt.key]: { ...val, unit: u } }))}
                    style={{ padding: "7px 12px", fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, cursor: "pointer", border: "none", background: val.unit === u ? T.royalBurgundy : "#FFFFFF", color: val.unit === u ? "#FFFDF9" : T.taupe }}>
                    {u}
                  </button>
                ))}
              </div>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginLeft: 8 }}>Current: {jt.buns} Buns / {jt.reels} Reels</span>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
          <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, background: T.warmIvory, color: T.taupe, border: `1.5px solid rgba(110,15,45,0.18)` }}>
            Cancel
          </motion.button>
          <motion.button onClick={() => { onSave({ warp, resham, jari }); onClose(); }} whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }} whileTap={{ scale: 0.97 }}
            style={{ flex: 2, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}>
            Save Thresholds
          </motion.button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function AlertsCard({ onCreatePO }: { onCreatePO?: () => void }) {
  const { px } = useContext(MobileCtx);
  const [thresholdsOpen, setThresholdsOpen] = useState(false);
  const [thresholds, setThresholds] = useState<{ warp: number; resham: number; jari: Record<string, { qty: number; unit: "Buns" | "Reels" }> }>({
    warp: 10, resham: 8, jari: { "poly-2g-gold": { qty: 5, unit: "Buns" }, "silkfast-2g-gold": { qty: 3, unit: "Buns" } },
  });
  return (
    <FadeUp id="mat-alerts" style={{ padding: `28px ${px}px 0` }}>
      <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid rgba(110,15,45,0.08)", borderTop: `3px solid ${T.crimson}`, boxShadow: "0 4px 24px rgba(192,57,43,0.08)", padding: "26px 32px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={22} color={T.crimson} />
            <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 18, color: T.luxuryBrown }}>Stock Alerts — Items That Need Attention</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <motion.button
              onClick={onCreatePO}
              whileHover={{ scale: 1.03, boxShadow: "0 6px 20px rgba(110,15,45,0.22)" }}
              whileTap={{ scale: 0.97 }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, cursor: "pointer", fontFamily: F.ui, fontWeight: 700, fontSize: 13, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}
            >
              <Plus size={14} /> Create Purchase Order
            </motion.button>
            <motion.span onClick={() => setThresholdsOpen(true)} whileHover={{ x: 3 }} transition={{ duration: 0.2 }} style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: T.antiqueGold, cursor: "pointer" }}>
              Set Alert Thresholds →
            </motion.span>
          </div>
        </div>
        <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14.5, color: T.taupe, margin: "0 0 24px", lineHeight: 1.6 }}>
          The following materials have gone below the minimum stock level set by the system admin. Please create a purchase order to restock.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {ALERTS.map((a, i) => (
            <motion.div
              key={a.batchId}
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
              style={{ background: "#FFFFFF", border: "1px solid rgba(192,57,43,0.14)", borderLeft: `3px solid ${T.crimson}`, borderRadius: 10, padding: "18px 20px", minWidth: 240, flex: "1 1 240px", maxWidth: 300, boxShadow: "0 2px 10px rgba(192,57,43,0.05)" }}
            >
              <div style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 500, color: T.taupe, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>{a.type}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 16, color: T.luxuryBrown, marginBottom: 4 }}>{a.subtype}</div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, marginBottom: 12, letterSpacing: "0.3px" }}>{a.batchId}</div>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 28, color: T.crimson, lineHeight: 1, marginBottom: 6 }}>{a.current}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.taupe, marginBottom: 14 }}>
                Minimum set: {a.type === "WARP" ? `${thresholds.warp} kg` : a.type === "RESHAM" ? `${thresholds.resham} kg` : a.minimum}
              </div>
              <div style={{ marginBottom: 16 }}><AnimatedBar pct={a.pct} color={T.crimson} height={6} trackBg="rgba(192,57,43,0.10)" /></div>
              <motion.button
                onClick={onCreatePO}
                whileHover={{ scale: 1.02, backgroundColor: T.deepWine }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center", background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 8, padding: "10px 14px", fontFamily: F.ui, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                <Package size={15} /> Create Purchase Order
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
      <ThresholdsModal open={thresholdsOpen} onClose={() => setThresholdsOpen(false)} thresholds={thresholds} onSave={setThresholds} />
    </FadeUp>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3b — PO TRACKER
// ═══════════════════════════════════════════════════════════════════════════════
const PO_STATUS_CFG = {
  pending:  { border: "#C89B47",  badge: "⏳ Awaiting Superadmin Approval", badgeBg: "rgba(200,155,71,0.12)", badgeColor: "#C89B47", label: "Pending Approval" },
  approved: { border: "#1E6640",  badge: "✓ Approved — Ready to Receive",   badgeBg: "rgba(30,102,64,0.10)",  badgeColor: "#1E6640", label: "Approved" },
  rejected: { border: "#C0392B",  badge: "✗ Rejected",                       badgeBg: "rgba(192,57,43,0.09)", badgeColor: "#C0392B", label: "Rejected" },
  received: { border: "#8B7060",  badge: "📦 Received",                      badgeBg: "rgba(139,112,96,0.10)", badgeColor: "#8B7060", label: "Received" },
};

type POFilter = "all" | "pending" | "approved" | "received" | "rejected";

// ── PO Vendor Detail Panel ────────────────────────────────────────────────────
function POVendorDetailModal({ po, onClose }: { po: PurchaseOrder | null; onClose: () => void }) {
  if (!po) return null;
  const cfg = PO_STATUS_CFG[po.status];
  const MT: Record<string, { col: string; bg: string }> = {
    Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.09)"  },
    Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.13)" },
    Jari:   { col: T.luxuryBrown,   bg: "rgba(59,35,20,0.09)"   },
  };
  return (
    <AnimatePresence>
      <motion.div
        key="po-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 1800, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "flex-end" }}
      >
        <motion.div
          key="po-panel"
          initial={{ x: 360, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 360, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          onClick={e => e.stopPropagation()}
          style={{ width: 430, maxWidth: "95vw", height: "100vh", background: "#FFFDF9", display: "flex", flexDirection: "column", boxShadow: "-24px 0 64px rgba(74,6,27,0.20)", overflowY: "auto" }}
        >
          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, ${T.darkBurgundy} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 24px 20px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, color: T.antiqueGold, letterSpacing: "1.5px", textTransform: "uppercase" as const, marginBottom: 4 }}>Purchase Order</div>
                <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 22, color: "#FFFDF9", letterSpacing: "-0.3px" }}>{po.poNumber}</div>
              </div>
              <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.10)", color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, padding: "5px 12px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.badgeColor }} />
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{cfg.label}</span>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>

            {/* Vendor Card */}
            <div style={{ background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: "rgba(110,15,45,0.04)", padding: "10px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe }}>Vendor Details</div>
              </div>
              <div style={{ padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg, ${T.darkBurgundy}, ${T.royalBurgundy})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(110,15,45,0.25)" }}>
                    <span style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 800, color: "#FFF" }}>{po.vendor.charAt(0)}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: T.luxuryBrown }}>{po.vendor}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>📍 {po.vendorCity}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Contact",       val: po.vendorContact || "—" },
                    { label: "Purchasing Firm", val: po.firmName || "—" },
                    { label: "Submitted",     val: new Date(po.submittedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
                    { label: "Delivery By",   val: po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                  ].map(r => (
                    <div key={r.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: T.taupe, marginBottom: 4 }}>{r.label}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown }}>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Materials */}
            <div style={{ background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: "rgba(110,15,45,0.04)", padding: "10px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.2px", color: T.taupe }}>Materials Ordered</div>
              </div>
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {po.materials.map((m, mi) => {
                  const mt = MT[m.materialType] || MT.Warp;
                  return (
                    <div key={mi} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: T.silkCream, borderRadius: 10 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 800, textTransform: "uppercase" as const, color: mt.col, background: mt.bg, padding: "3px 9px", borderRadius: 6, flexShrink: 0, marginTop: 1 }}>{m.materialType}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{m.subtype || m.description || "—"}</div>
                        {m.description && m.subtype && <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>{m.description}</div>}
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{m.quantity} {m.unit}</div>
                        {m.pricePerUnit > 0 && <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, marginTop: 1 }}>₹{m.pricePerUnit.toLocaleString("en-IN")}/{m.unit}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div style={{ background: "linear-gradient(135deg, rgba(200,155,71,0.08) 0%, rgba(200,155,71,0.02) 100%)", border: `1.5px solid ${T.borderGold}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe }}>Total Order Value</span>
                <span style={{ fontFamily: F.display, fontSize: 20, fontWeight: 800, color: "#8B6018" }}>₹{po.totalValue.toLocaleString("en-IN")}</span>
              </div>
              {po.urgency === "Urgent" && (
                <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(192,57,43,0.10)", border: "1px solid rgba(192,57,43,0.25)", borderRadius: 6, padding: "4px 10px" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.crimson }}>🚨 Urgent Priority</span>
                </div>
              )}
            </div>

            {/* Notes */}
            {(po.notesVendor || po.notesAdmin) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {po.notesVendor && (
                  <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: T.taupe, marginBottom: 6 }}>Note to Vendor</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, lineHeight: 1.55, fontStyle: "italic" }}>"{po.notesVendor}"</div>
                  </div>
                )}
                {po.notesAdmin && (
                  <div style={{ background: "rgba(200,155,71,0.05)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: T.taupe, marginBottom: 6 }}>Admin Note</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, lineHeight: 1.55 }}>{po.notesAdmin}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function POTrackerSection({
  onCreatePO,
  onViewPO,
}: {
  onCreatePO: () => void;
  onViewPO: (po: PurchaseOrder) => void;
}) {
  const { px } = useContext(MobileCtx);
  const { pos } = usePO();
  const [filter, setFilter] = useState<POFilter>("all");
  const [invoiceAmounts, setInvoiceAmounts] = useState<Record<string, string>>({});
  const [invoiceDrafts, setInvoiceDrafts] = useState<Record<string, string>>({});
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const MAT_TAG_PO: Record<string, { col: string; bg: string }> = {
    Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.09)"   },
    Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.13)"  },
    Jari:   { col: T.luxuryBrown,   bg: "rgba(59,35,20,0.09)"    },
  };

  const counts = {
    all: pos.length,
    pending: pos.filter(p => p.status === "pending").length,
    approved: pos.filter(p => p.status === "approved").length,
    received: pos.filter(p => p.status === "received").length,
    rejected: pos.filter(p => p.status === "rejected").length,
  };

  const filtered = filter === "all" ? pos : pos.filter(p => p.status === filter);

  const PILL_LABELS: { key: POFilter; label: string }[] = [
    { key: "all",      label: `All POs (${counts.all})` },
    { key: "pending",  label: `Pending Approval (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "received", label: `Received (${counts.received})` },
    { key: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  return (
    <>
    <FadeUp id="mat-po-tracker" style={{ padding: `32px ${px}px 0` }}>
      {/* Section header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 4, height: 26, borderRadius: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)", flexShrink: 0 }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 32, color: T.luxuryBrown, letterSpacing: "-0.3px", lineHeight: 1.15 }}>
            Purchase Orders
          </span>
        </div>
        <motion.button
          onClick={onCreatePO}
          whileHover={{ x: 3 }}
          transition={{ duration: 0.2 }}
          style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: T.antiqueGold, cursor: "pointer", background: "none", border: "none" }}
        >
          ➕ Create New PO →
        </motion.button>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {PILL_LABELS.map(p => (
          <motion.button
            key={p.key}
            onClick={() => setFilter(p.key)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              fontFamily: F.ui, fontWeight: 600, fontSize: 12, padding: "7px 14px", borderRadius: 99, cursor: "pointer",
              background: filter === p.key ? T.royalBurgundy : "transparent",
              color: filter === p.key ? "#FFFDF9" : T.taupe,
              border: filter === p.key ? "none" : `1px solid rgba(110,15,45,0.16)`,
              transition: "all 0.2s",
            }}
          >
            {p.label}
          </motion.button>
        ))}
      </div>

      {/* PO cards */}
      {filtered.length === 0 ? (
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "32px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No purchase orders in this category.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map(po => {
            const cfg = PO_STATUS_CFG[po.status];
            return (
              <motion.div
                key={po.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedPO(po)}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 20,
                  border: `1.5px solid ${T.borderDef}`,
                  boxShadow: "0 8px 30px rgba(74,6,27,0.04)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  position: "relative",
                  cursor: "pointer",
                  transition: "transform 0.25s, box-shadow 0.25s",
                }}
                whileHover={{ y: -4, boxShadow: "0 18px 45px rgba(74,6,27,0.09)" }}
              >
                {/* Status-colored banner highlight */}
                <div style={{ height: 6, background: cfg.border, width: "100%" }} />

                <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
                  {/* Top row: PO number + Date */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "4px 10px", borderRadius: 8 }}>
                      {po.poNumber}
                    </span>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, background: "#F7F2EA", padding: "4px 10px", borderRadius: 8 }}>
                      {new Date(po.submittedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* Vendor Details */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: T.luxuryBrown, letterSpacing: "-0.2px", marginBottom: 4 }}>
                      {po.vendor}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                      <span>{po.vendorCity}</span>
                      {po.firmName && (
                        <>
                          <span style={{ color: T.borderDef }}>•</span>
                          <span style={{ color: T.antiqueGold, fontWeight: 600 }}>{po.firmName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Materials Grid */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18, background: "rgba(110,15,45,0.015)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: 12 }}>
                    <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Materials Requested</div>
                      {po.materials.map((m, mi) => {
                        const mt = MAT_TAG_PO[m.materialType] || MAT_TAG_PO.Warp;
                        const invKey = `${po.id}-${mi}`;
                        return (
                          <div key={mi} style={{ display: "flex", flexDirection: "column", gap: 8, borderBottom: mi < po.materials.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none", paddingBottom: mi < po.materials.length - 1 ? 12 : 0, paddingTop: mi > 0 ? 8 : 0 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: mt.col, background: mt.bg, borderRadius: 6, padding: "2px 8px", minWidth: 50, textAlign: "center", marginTop: 1, flexShrink: 0 }}>
                                {m.materialType}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {(m.subtype || m.description) ? (
                                  <>
                                    <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                      {m.subtype || m.description}
                                    </div>
                                    {m.description && m.subtype && (
                                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, marginTop: 1 }}>
                                        {m.description}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>—</div>
                                )}
                              </div>
                              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700, flexShrink: 0, background: "rgba(110,15,45,0.06)", padding: "2px 7px", borderRadius: 5, marginTop: 1 }}>
                                {m.quantity} {m.unit}
                              </span>
                            </div>
                            
                            {/* Material Invoice Section */}
                            <div style={{ paddingLeft: 60, marginTop: 4 }}>
                              {invoiceAmounts[invKey] ? (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FDFBF7", padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.borderGold}40` }}>
                                  <span style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>Invoice Amount</span>
                                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#8B6018" }}>
                                    ₹{parseFloat(invoiceAmounts[invKey]).toLocaleString("en-IN")}
                                  </span>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                                  <input
                                    type="number"
                                    value={invoiceDrafts[invKey] || ""}
                                    onChange={e => setInvoiceDrafts(prev => ({ ...prev, [invKey]: e.target.value }))}
                                    placeholder="Invoice amount in ₹"
                                    style={{ flex: 1, height: 28, fontFamily: F.ui, fontSize: 11, padding: "0 8px", borderRadius: 6, border: `1px solid ${T.borderDef}`, outline: "none", background: "#FFFFFF", boxSizing: "border-box" }}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (invoiceDrafts[invKey]) setInvoiceAmounts(prev => ({ ...prev, [invKey]: invoiceDrafts[invKey] }));
                                    }}
                                    style={{ height: 28, padding: "0 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.luxuryBrown, background: "#FDFBF7", border: `1px solid ${T.borderDef}`, borderRadius: 6, cursor: "pointer" }}
                                  >
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Metadata Row: Delivery Deadline & Notes */}
                  {(po.deliveryDate || po.notesVendor) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18, paddingLeft: 2 }}>
                      {po.deliveryDate && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>
                          <span style={{ color: T.taupe }}>Deadline:</span>
                          <span style={{ fontWeight: 600, color: T.royalBurgundy }}>
                            {new Date(po.deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {po.notesVendor && (
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", lineHeight: 1.4 }}>
                          "{po.notesVendor}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total Invoice Amount */}
                  {(() => {
                    const totalInvoiceAmount = po.materials.reduce((sum, _, mi) => {
                      const amount = invoiceAmounts[`${po.id}-${mi}`];
                      return sum + (amount ? parseFloat(amount) : 0);
                    }, 0);
                    const hasAnyAmount = po.materials.some((_, mi) => invoiceAmounts[`${po.id}-${mi}`]);
                    if (!hasAnyAmount) return null;
                    return (
                      <div style={{ border: `1.5px solid ${T.borderGold}`, background: "linear-gradient(135deg, rgba(200,155,71,0.06) 0%, rgba(200,155,71,0.01) 100%)", borderRadius: 12, padding: "12px 14px", marginBottom: 18, marginTop: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe }}>Total Invoice Value</span>
                          <span style={{ fontFamily: F.display, fontSize: 16, fontWeight: 800, color: "#8B6018" }}>
                            ₹{totalInvoiceAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Status Badge */}
                  <div style={{ background: cfg.badgeBg, border: `1px solid ${cfg.border}22`, borderRadius: 10, padding: "8px 12px", marginBottom: 18, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: cfg.badgeColor, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.badgeColor }} />
                    {cfg.badge}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10 }}>
                    {po.status === "approved" && (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate?.("ReceiveStock", { poId: po.poNumber });
                        }}
                        whileHover={{ scale: 1.02, backgroundColor: "#154d30" }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          flex: 1.8, height: 38, borderRadius: 10, cursor: "pointer",
                          fontFamily: F.ui, fontWeight: 700, fontSize: 12.5,
                          background: T.green, color: "#FFFFFF", border: "none",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        }}
                      >
                        📦 Receive Materials
                      </motion.button>
                    )}
                    {po.status === "received" && po.grnId && (
                      <div style={{ flex: 1.8, height: 38, borderRadius: 10, background: "rgba(30,102,64,0.06)", border: `1.5px solid rgba(30,102,64,0.18)`, fontFamily: F.ui, fontSize: 12, color: T.green, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ✓ {po.grnId} Created
                      </div>
                    )}
                    {po.status === "rejected" && (
                      <motion.button
                        onClick={(e) => { e.stopPropagation(); onCreatePO(); }}
                        whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.08)" }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          flex: 1.8, height: 38, borderRadius: 10, cursor: "pointer",
                          fontFamily: F.ui, fontWeight: 700, fontSize: 12.5,
                          background: "transparent", color: T.royalBurgundy,
                          border: `1.5px solid rgba(110,15,45,0.22)`,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        }}
                      >
                        📋 Recreate PO
                      </motion.button>
                    )}
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); onViewPO(po); }}
                      whileHover={{ scale: 1.02, background: "rgba(110,15,45,0.10)" }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        flex: po.status === "pending" ? 1 : 0.8,
                        height: 38, borderRadius: 10, cursor: "pointer",
                        fontFamily: F.ui, fontWeight: 700, fontSize: 12.5,
                        background: "rgba(110,15,45,0.04)", color: T.royalBurgundy,
                        border: `1.5px solid rgba(110,15,45,0.16)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      📄 View PO
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </FadeUp>
    <POVendorDetailModal po={selectedPO} onClose={() => setSelectedPO(null)} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — CURRENT STOCK OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
const MAT_CARDS = [
  { name: "Warp",   desc: "Base Thread used for weaving · Cotton and Silk types",                  stock: "142 kg in stock", note: "You can make approximately 284 sarees with this",    pct: 72, barColor: T.royalBurgundy, stockColor: T.antiqueGold, badge: "✓ Stock is Healthy",             green: true,  img: imgWarp,   extra: null as React.ReactNode },
  { name: "Resham", desc: "Silk Thread used for design and colour · Multiple colours",             stock: "180 kg in stock", note: "6 different colours currently available",           pct: 85, barColor: T.antiqueGold,   stockColor: T.antiqueGold, badge: "✓ Stock is Healthy",             green: true,  img: imgResham,
    extra: (<div style={{ display: "flex", gap: 8, margin: "10px 0 6px" }}>{["#B22222","#C89B47","#1E5C8A","#2D6B3A","#8B008B","#E8DCCB"].map((c,i) => <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: "1.5px solid rgba(0,0,0,0.10)" }} />)}</div>) as React.ReactNode },
  { name: "Jari",   desc: "Metallic Thread for borders and designs · Polyester and Silk Fast types", stock: "36 Buns (144 Reels)",  note: "Polyester and Silk Fast · 5 Grades · 6 Colors", pct: 30, barColor: T.crimson, stockColor: T.crimson, badge: "⚠ Some Types Are Low — Check Alerts", green: false, img: imgJari,
    extra: (<div style={{ display: "flex", gap: 8, margin: "10px 0 6px" }}>{["Polyester","Silk Fast"].map(p => <span key={p} style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase", background: "rgba(139,112,96,0.10)", border: "1px solid rgba(139,112,96,0.18)", borderRadius: 6, padding: "4px 10px" }}>{p}</span>)}</div>) as React.ReactNode },
];

function StockOverview({ onSeeFullReports }: { onSeeFullReports: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <section id="mat-stock-overview" style={{ padding: `40px ${px}px 0` }}>
      <motion.div ref={ref} initial={{ opacity: 0, y: 22 }} animate={inView ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 0.6, ease: EASE }}>
        <SectionHeader
          title="Current Stock Overview"
          action="See Full Reports"
          actionIcon={<BarChart2 size={15} />}
          onAction={onSeeFullReports}
          actionVariant="solid"
        />
      </motion.div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 18 : 28 }}>
        {MAT_CARDS.map((card, i) => (
          <FadeUp key={card.name} delay={i * 0.1} style={{ height: "100%" }}>
            <motion.div
              initial={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              animate={{ boxShadow: "0px 6px 24px rgba(74,6,27,0.07)" }}
              whileHover={{ y: -6, boxShadow: "0px 28px 72px rgba(74,6,27,0.15)" }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              style={{ background: T.warmIvory, borderRadius: 22, border: `1px solid ${T.borderDef}`, overflow: "hidden", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <div style={{ height: 180, flexShrink: 0, overflow: "hidden" }}>
                <motion.img src={card.img} alt={card.name} whileHover={{ scale: 1.06 }} transition={{ duration: 0.6, ease: EASE }} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ padding: "26px 28px 28px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 24, color: T.luxuryBrown, marginBottom: 6 }}>{card.name}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: T.taupe, lineHeight: 1.6, marginBottom: 4 }}>{card.desc}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: card.stockColor, lineHeight: 1, margin: "18px 0 8px" }}>{card.stock}</div>
              </div>
            </motion.div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── Compact summary card: materials issued to weavers this month ──────────────
function IssuedThisMonthCard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const { issueRecords } = useMaterialIssue();

  const now = new Date();
  const thisMonthRecords = issueRecords.filter(r => {
    const d = new Date(r.issuedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  let warpKg = 0, reshamKg = 0, jariBuns = 0;
  thisMonthRecords.forEach(r => r.materials.forEach(m => {
    if (m.materialType === "Warp") warpKg += m.quantity;
    else if (m.materialType === "Resham") reshamKg += m.quantity;
    else if (m.materialType === "Jari") jariBuns += m.unit === "Buns" ? m.quantity : m.quantity / 4;
  }));

  const jariReels = jariBuns * 4;

  return (
    <section id="mat-issued" style={{ padding: `24px ${px}px 0` }}>
      <div style={{
        background: `linear-gradient(135deg, ${T.warmIvory} 0%, #FFFFFF 100%)`,
        border: `1.5px solid ${T.borderDef}`,
        borderRadius: 20,
        padding: "24px 30px",
        boxShadow: "0 10px 30px rgba(74,6,27,0.04), 0 1px 3px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "space-between",
        gap: 24,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle decorative gold line at the left */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: G_GOLD }} />

        {/* Info Left */}
        <div style={{ flex: "1 1 25%", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClipboardList size={18} color={T.royalBurgundy} />
            <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.luxuryBrown }}>
              Issued to Weavers
            </span>
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            Weaver material disbursements recorded for {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            width: "fit-content",
            gap: 6,
            background: "rgba(110,15,45,0.06)",
            color: T.royalBurgundy,
            fontFamily: F.mono,
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 6,
            marginTop: 4,
          }}>
            {thisMonthRecords.length} {thisMonthRecords.length === 1 ? "Issuance" : "Issuances"}
          </div>
        </div>

        {/* Middle Stats Grid */}
        <div style={{
          flex: "1 1 55%",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 16,
        }}>
          {[
            {
              label: "Warp Disbursed",
              val: `${warpKg.toFixed(warpKg % 1 === 0 ? 0 : 1)} kg`,
              sub: "For vertical threads",
              color: T.royalBurgundy,
              bg: "rgba(110,15,45,0.04)",
              border: "rgba(110,15,45,0.12)",
              icon: <Layers size={16} color={T.royalBurgundy} />
            },
            {
              label: "Resham Disbursed",
              val: `${reshamKg.toFixed(reshamKg % 1 === 0 ? 0 : 1)} kg`,
              sub: "For body & borders",
              color: T.antiqueGold,
              bg: "rgba(200,155,71,0.06)",
              border: "rgba(200,155,71,0.18)",
              icon: <Tag size={16} color="#7A5E1C" />
            },
            {
              label: "Jari Disbursed",
              val: `${jariBuns.toFixed(jariBuns % 1 === 0 ? 0 : 1)} Buns`,
              sub: `${jariReels.toFixed(0)} Reels`,
              color: T.luxuryBrown,
              bg: "rgba(59,35,20,0.04)",
              border: "rgba(59,35,20,0.12)",
              icon: <Sparkles size={16} color={T.luxuryBrown} />
            },
          ].map(s => (
            <div
              key={s.label}
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {s.icon}
                <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {s.label}
                </span>
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 20, color: s.color, marginTop: 4 }}>
                {s.val}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 500 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Right Action Button */}
        <div style={{ flex: "1 1 15%", display: "flex", justifyContent: isMobile ? "stretch" : "flex-end" }}>
          <motion.button
            onClick={() => onNavigate?.("IssueMaterial")}
            whileHover={{ scale: 1.03, boxShadow: "0 6px 20px rgba(110,15,45,0.15)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: isMobile ? "100%" : "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: 12,
              background: "rgba(110,15,45,0.06)",
              color: T.royalBurgundy,
              border: `1.5px solid rgba(110,15,45,0.16)`,
              fontFamily: F.ui,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            <span>View Full History</span>
            <ArrowRight size={14} />
          </motion.button>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — ALL MATERIAL BATCHES IN STOCK
// ═══════════════════════════════════════════════════════════════════════════════
const MAT_TAG: Record<string, { col: string; bg: string }> = {
  Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.09)"   },
  Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.13)"  },
  Jari:   { col: T.luxuryBrown,   bg: "rgba(59,35,20,0.09)"    },
};
const BATCH_IMG: Record<string, string> = { Warp: imgWarp, Resham: imgResham, Jari: imgJari };

const BATCH_DATA: BatchRow[] = [
  { id: "SRI-WARP-001",          type: "Warp",   details: "Cotton / Silk",             vendor: "Sri Venkateswara Textiles", date: "01 May 2026", received: 50, given: 8,  remaining: 42, statusType: "good"     },
  { id: "KANCH-RESH-001",        type: "Resham", details: "Silk · Red",                vendor: "Kanchipuram Silks",         date: "02 May 2026", received: 30, given: 5,  remaining: 25, statusType: "good"     },
  { id: "SURAT-PLY2GGOLD-001",   type: "Jari",   details: "Polyester · 2G · Gold",     vendor: "Surat Zari Works",          date: "01 May 2026", received: 8,  given: 3,  remaining: 5,  statusType: "good"     },
  { id: "LAKSH-WARP-001",        type: "Warp",   details: "Cotton / Silk",             vendor: "Lakshmi Thread House",      date: "28 Apr 2026", received: 40, given: 30, remaining: 10, statusType: "warning"  },
  { id: "MYSOR-RESH-001",        type: "Resham", details: "Silk · Gold",               vendor: "Mysore Silk Co.",           date: "28 Apr 2026", received: 25, given: 20, remaining: 5,  statusType: "critical" },
  { id: "SURAT-PLY1GSLVR-002",   type: "Jari",   details: "Polyester · 1G · Silver",   vendor: "Surat Zari Works",          date: "28 Apr 2026", received: 3,  given: 1,  remaining: 2,  statusType: "warning"  },
  { id: "SRI-WARP-002",          type: "Warp",   details: "Cotton / Silk",             vendor: "Sri Venkateswara Textiles", date: "20 Apr 2026", received: 35, given: 35, remaining: 0,  statusType: "empty"    },
  { id: "KANCH-RESH-002",        type: "Resham", details: "Silk · Blue",               vendor: "Kanchipuram Silks",         date: "15 Apr 2026", received: 28, given: 18, remaining: 10, statusType: "warning"  },
  { id: "SURAT-PLY3GCPPR-001",   type: "Jari",   details: "Polyester · 3G · Copper",   vendor: "Surat Zari Works",          date: "01 May 2026", received: 4,  given: 2,  remaining: 2,  statusType: "good"     },
  { id: "VARA-SF2GGOLD-001",     type: "Jari",   details: "Silk Fast · 2G · Gold",     vendor: "Varanasi Zari House",       date: "28 Apr 2026", received: 6,  given: 2,  remaining: 4,  statusType: "good"     },
  { id: "VARA-SF1GBLUE-001",     type: "Jari",   details: "Silk Fast · 1G · Blue",     vendor: "Varanasi Zari House",       date: "28 Apr 2026", received: 2,  given: 1,  remaining: 1,  statusType: "critical" },
  { id: "VARA-SF3GPINK-001",     type: "Jari",   details: "Silk Fast · 3G · Pink",     vendor: "Varanasi Zari House",       date: "01 May 2026", received: 3,  given: 1,  remaining: 2,  statusType: "warning"  },
  { id: "KANCH-RESH-GRN-001",    type: "Resham", details: "Silk · Green",              vendor: "Kanchipuram Silks",         date: "28 Apr 2026", received: 22, given: 20, remaining: 2,  statusType: "critical" },
];

const MAT_FILTERS = ["All Materials", "Warp Only", "Resham Only", "Jari Only"];
const STATUS_FILTERS = ["All Status", "In Stock", "Running Low", "Very Low", "All Used Up"];
const STATUS_FILTER_MAP: Record<string, StatusType | null> = {
  "All Status": null,
  "In Stock": "good",
  "Running Low": "warning",
  "Very Low": "critical",
  "All Used Up": "empty",
};

function BatchTableView({ rows, onViewDetails, onPrintBarcode }: { rows: BatchRow[]; onViewDetails: (b: BatchRow) => void; onPrintBarcode: (b: BatchRow) => void }) {
  const TH: React.CSSProperties = { fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, color: T.taupe, letterSpacing: "0.6px", textTransform: "uppercase" as const, padding: "14px 16px", textAlign: "left" as const, whiteSpace: "nowrap" as const, borderBottom: `1px solid rgba(110,15,45,0.08)`, background: T.silkCream };
  const TD: React.CSSProperties = { padding: "14px 16px", borderBottom: "1px solid rgba(110,15,45,0.05)", verticalAlign: "middle" as const };
  const BTN: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 12px", borderRadius: 8, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const };
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.05)", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1020 }}>
        <thead>
          <tr>
            {[
              { label: "Batch ID",         icon: <Tag size={12} /> },
              { label: "Material",         icon: <Layers size={12} /> },
              { label: "Description",      icon: <FileText size={12} /> },
              { label: "Vendor",           icon: <Boxes size={12} /> },
              { label: "Received On",      icon: <Calendar size={12} /> },
              { label: "Received",         icon: <Package size={12} /> },
              { label: "Given",            icon: <ArrowRight size={12} /> },
              { label: "Remaining",        icon: <CheckCircle2 size={12} /> },
              { label: "Status",           icon: null },
              { label: "Actions",          icon: null },
            ].map(h => (
              <th key={h.label} style={TH}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {h.icon}<span>{h.label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const sc = STATUS_CFG[r.statusType];
            const mt = MAT_TAG[r.type];
            const remPct = r.received > 0 ? Math.round((r.remaining / r.received) * 100) : 0;
            return (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.03, ease: EASE }}
                style={{ background: i % 2 === 0 ? "#FFFFFF" : T.warmIvory }}
              >
                <td style={TD}>
                  <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.royalBurgundy, letterSpacing: "0.2px", background: "rgba(110,15,45,0.05)", padding: "4px 8px", borderRadius: 6, display: "inline-block" }}>{r.id}</span>
                </td>
                <td style={TD}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: mt.col, background: mt.bg, padding: "5px 11px", borderRadius: 20, letterSpacing: "0.3px" }}>{r.type}</span>
                </td>
                <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown }}>{r.details}</span></td>
                <td style={TD}><span style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.luxuryBrown }}>{r.vendor}</span></td>
                <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.taupe }}>{r.date}</span></td>
                <td style={TD}>
                  <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>
                    {r.received} <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 400, color: T.taupe }}>{r.type === "Jari" ? `Buns (${r.received * 4} Reels)` : "kg"}</span>
                  </span>
                </td>
                <td style={TD}>
                  <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.taupe }}>
                    {r.given} <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 400 }}>{r.type === "Jari" ? `Buns (${r.given * 4} Reels)` : "kg"}</span>
                  </span>
                </td>
                <td style={TD}>
                  <div>
                    <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: sc.color }}>
                      {r.remaining} <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 400 }}>{r.type === "Jari" ? `Buns (${r.remaining * 4} Reels)` : "kg"}</span>
                    </span>
                    <div style={{ width: 64, height: 4, background: "rgba(110,15,45,0.08)", borderRadius: 2, marginTop: 5 }}>
                      <div style={{ width: `${remPct}%`, height: "100%", background: sc.dot, borderRadius: 2 }} />
                    </div>
                  </div>
                </td>
                <td style={TD}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: sc.bg, color: sc.color, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
                    {sc.icon} {sc.text}
                  </span>
                </td>
                <td style={TD}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <motion.button onClick={() => onViewDetails(r)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ ...BTN, background: "rgba(110,15,45,0.06)", color: T.royalBurgundy, border: `1px solid rgba(110,15,45,0.16)` }}>
                      <FileText size={13} /> View Details
                    </motion.button>
                    <motion.button onClick={() => onPrintBarcode(r)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ ...BTN, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}>
                      <QrCode size={13} /> Print Barcode
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BatchCardView({ rows, onViewDetails, onPrintBarcode }: { rows: BatchRow[]; onViewDetails: (b: BatchRow) => void; onPrintBarcode: (b: BatchRow) => void }) {
  const { isMobile } = useContext(MobileCtx);
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 14 : 20, alignItems: "stretch" }}>
      {rows.map((r, i) => {
        const sc = STATUS_CFG[r.statusType];
        const mt = MAT_TAG[r.type];
        const remPct = r.received > 0 ? Math.round((r.remaining / r.received) * 100) : 0;
        const matIcon = r.type === "Warp" ? <Layers size={22} color={mt.col} /> : r.type === "Resham" ? <Tag size={22} color={mt.col} /> : <Boxes size={22} color={mt.col} />;
        return (
          <FadeUp key={r.id} delay={i * 0.05} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ background: mt.bg, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                    {matIcon}
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: mt.col }}>{r.type}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{r.details}</div>
                  </div>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: sc.bg, color: sc.color, fontFamily: F.ui, fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 20 }}>
                  {sc.icon} {sc.text}
                </span>
              </div>
              <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, background: "rgba(110,15,45,0.05)", display: "inline-block", padding: "3px 8px", borderRadius: 6, marginBottom: 8, letterSpacing: "0.3px" }}>{r.id}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{r.vendor}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <Calendar size={12} color={T.taupe} />
                    <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Received {r.date}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {[
                    { icon: <Package size={13} color={T.taupe} />, label: "Received", val: r.received, color: T.luxuryBrown },
                    { icon: <ArrowRight size={13} color={T.taupe} />, label: "Given",    val: r.given,    color: T.taupe },
                    { icon: <CheckCircle2 size={13} color={sc.color} />, label: "Remaining", val: r.remaining, color: sc.color },
                  ].map(s => (
                    <div key={s.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 10px 8px", textAlign: "center" as const }}>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontFamily: F.display, fontSize: r.type === "Jari" ? 14 : 18, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>
                        {r.type === "Jari" ? (
                          <>
                            <div>{s.val} Buns</div>
                            <div style={{ fontSize: 11, fontWeight: 500, color: T.taupe, marginTop: 2 }}>{s.val * 4} Reels</div>
                          </>
                        ) : (
                          s.val
                        )}
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, marginTop: 3 }}>
                        {s.label} {r.type === "Jari" ? "" : "kg"}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 16, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>Stock remaining</span>
                    <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: sc.color }}>{remPct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(110,15,45,0.08)", borderRadius: 3 }}>
                    <div style={{ width: `${remPct}%`, height: "100%", background: sc.dot, borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <motion.button onClick={() => onViewDetails(r)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, background: "rgba(110,15,45,0.06)", color: T.royalBurgundy, border: `1px solid rgba(110,15,45,0.16)`, borderRadius: 9, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                    <FileText size={14} /> View Details
                  </motion.button>
                  <motion.button onClick={() => onPrintBarcode(r)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 9, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                    <QrCode size={14} /> Print Barcode
                  </motion.button>
                </div>
              </div>
            </div>
          </FadeUp>
        );
      })}
    </div>
  );
}

function BatchesSection({ onAddNewStock }: { onAddNewStock: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const [view, setView] = useState<"table" | "card">(isMobile ? "card" : "table");
  const [matFilter, setMatFilter] = useState("All Materials");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);
  const [barcodeBatch, setBarcodeBatch] = useState<BatchRow | null>(null);

  const filtered = BATCH_DATA.filter(b => {
    const matchMat = matFilter === "All Materials" || b.type === matFilter.replace(" Only", "");
    const matchStatus = statusFilter === "All Status" || b.statusType === STATUS_FILTER_MAP[statusFilter];
    const matchSearch = search === "" || b.id.toLowerCase().includes(search.toLowerCase()) || b.vendor.toLowerCase().includes(search.toLowerCase());
    return matchMat && matchStatus && matchSearch;
  });

  return (
    <section style={{ padding: `44px ${px}px 0` }}>
      <SectionHeader
        title="All Material Batches in Stock"
        action="Receive Materials"
        actionIcon={<Package size={15} />}
        onAction={onAddNewStock}
        actionVariant="solid"
      />
      <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.taupe, margin: "0 0 20px", lineHeight: 1.6 }}>
        Each batch is one delivery of material received from a vendor. Every batch has its own unique barcode for tracking.
      </p>

      {/* Controls row */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: 16, gap: 12 }}>
        {/* Material filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {MAT_FILTERS.map(f => (
            <motion.button
              key={f}
              onClick={() => setMatFilter(f)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                fontFamily: F.ui, fontWeight: 600, fontSize: 12, padding: "6px 13px", borderRadius: 99, cursor: "pointer",
                background: matFilter === f ? T.royalBurgundy : "transparent",
                color: matFilter === f ? "#FFFDF9" : T.taupe,
                border: matFilter === f ? "none" : `1px solid rgba(110,15,45,0.16)`,
                transition: "all 0.2s",
              }}
            >
              {f}
            </motion.button>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "7px 12px", flex: isMobile ? 1 : "none" }}>
            <Search size={13} color={T.taupe} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isMobile ? "Search batch / vendor..." : "Search by batch number or vendor name..."}
              style={{ fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, border: "none", outline: "none", background: "transparent", width: isMobile ? "100%" : 240, minWidth: 0 }}
            />
          </div>

          {/* Filter by Status dropdown */}
          <div style={{ position: "relative" }}>
            <motion.button
              onClick={() => setStatusDropOpen(o => !o)}
              whileHover={{ scale: 1.03 }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: statusFilter !== "All Status" ? T.royalBurgundy : "#FFFFFF",
                color: statusFilter !== "All Status" ? "#FFFDF9" : T.taupe,
                border: statusFilter !== "All Status" ? "none" : `1px solid ${T.borderDef}`,
                borderRadius: 10, padding: "7px 14px", fontFamily: F.ui, fontSize: 12.5, cursor: "pointer",
              }}
            >
              <Filter size={12} /> {statusFilter} {statusDropOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </motion.button>
            <AnimatePresence>
              {statusDropOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200,
                    background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`,
                    boxShadow: "0 12px 40px rgba(74,6,27,0.15)", minWidth: 160, overflow: "hidden",
                  }}
                >
                  {STATUS_FILTERS.map(f => {
                    const colors: Record<string, string> = { "In Stock": T.green, "Running Low": "#7A5E1C", "Very Low": T.crimson, "All Used Up": T.taupe, "All Status": T.luxuryBrown };
                    return (
                      <motion.button
                        key={f}
                        onClick={() => { setStatusFilter(f); setStatusDropOpen(false); }}
                        whileHover={{ background: T.silkCream }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "10px 16px", background: "transparent", border: "none",
                          fontFamily: F.ui, fontSize: 13.5, fontWeight: statusFilter === f ? 700 : 500,
                          color: statusFilter === f ? colors[f] : T.luxuryBrown, cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {f !== "All Status" && (
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[f], flexShrink: 0 }} />
                        )}
                        {f}
                        {statusFilter === f && <Check size={13} color={colors[f]} style={{ marginLeft: "auto" }} />}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", gap: 6 }}>
            {([["table", LayoutList, "Table"], ["card", LayoutGrid, "Card"]] as const).map(([v, Icon, label]) => (
              <motion.button
                key={v}
                onClick={() => setView(v as "table" | "card")}
                whileHover={{ scale: 1.03 }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, background: view === v ? T.royalBurgundy : "#FFFFFF", color: view === v ? "#FFFDF9" : T.taupe, border: view === v ? "none" : `1px solid ${T.borderDef}`, transition: "all 0.2s" }}
              >
                <Icon size={13} /> {label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      {(statusFilter !== "All Status" || matFilter !== "All Materials" || search) && (
        <div style={{ marginBottom: 12, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
          Showing <strong style={{ color: T.luxuryBrown }}>{filtered.length}</strong> of {BATCH_DATA.length} batches
          {statusFilter !== "All Status" && <> · Status: <strong style={{ color: T.royalBurgundy }}>{statusFilter}</strong></>}
        </div>
      )}

      <FadeUp>
        {view === "table"
          ? <BatchTableView rows={filtered} onViewDetails={setSelectedBatch} onPrintBarcode={setBarcodeBatch} />
          : <BatchCardView rows={filtered} onViewDetails={setSelectedBatch} onPrintBarcode={setBarcodeBatch} />
        }
      </FadeUp>

      <BatchViewDetailsModal batch={selectedBatch} onClose={() => setSelectedBatch(null)} />
      <PrintBarcodeModal batch={barcodeBatch} onClose={() => setBarcodeBatch(null)} />
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — MATERIAL GIVEN TO WEAVERS RIGHT NOW
// ═══════════════════════════════════════════════════════════════════════════════
const W_STATUS: Record<WeaverStatus, { border: string; bannerBg: string; bannerColor: string }> = {
  "on-time":    { border: T.royalBurgundy, bannerBg: "rgba(30,102,64,0.10)",  bannerColor: T.green       },
  "approaching":{ border: T.antiqueGold,   bannerBg: "rgba(200,155,71,0.12)", bannerColor: "#7A5E1C"    },
  "overdue":    { border: T.crimson,       bannerBg: "rgba(192,57,43,0.10)",  bannerColor: T.crimson     },
  "quality":    { border: T.antiqueGold,   bannerBg: "rgba(200,155,71,0.12)", bannerColor: "#7A5E1C"    },
};



// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — PURCHASE HISTORY FROM ALL VENDORS
// ═══════════════════════════════════════════════════════════════════════════════
const VENDOR_DATA = [
  { name: "Sri Venkateswara Textiles", materials: [{ type: "Warp", label: "Warp" }, { type: "Jari", label: "Jari" }], totals: ["1,200 kg", "2 Buns (8 Reels)"], price: "₹280 per kg",   paid: "₹3,36,000",  orders: 12, last: "01 May 2026" },
  { name: "Lakshmi Thread House",      materials: [{ type: "Warp", label: "Warp" }],       totals: ["1,640 kg"], price: "₹275 per kg",   paid: "₹4,51,000",  orders: 18, last: "28 Apr 2026" },
  { name: "Kanchipuram Silks",         materials: [{ type: "Resham", label: "Resham" }],      totals: ["820 kg"],   price: "₹1,500 per kg", paid: "₹12,30,000", orders: 22, last: "02 May 2026" },
  { name: "Mysore Silk Co.",           materials: [{ type: "Resham", label: "Resham" }], totals: ["420 kg"],   price: "₹1,480 per kg", paid: "₹6,21,600",  orders: 14, last: "28 Apr 2026" },
  { name: "Surat Zari Works",          materials: [{ type: "Jari", label: "Jari" }],   totals: ["24 Buns (96 Reels)"],   price: "—", paid: "₹15,36,000", orders: 16, last: "01 May 2026" },
  { name: "Varanasi Zari House",       materials: [{ type: "Jari", label: "Jari" }],   totals: ["10 Buns (40 Reels)"],   price: "—",  paid: "₹9,12,000",  orders: 8,  last: "28 Apr 2026" },
];

const MONTHLY_DATA = [
  { month: "Dec", Warp: 420, Resham: 180, Jari: 90  },
  { month: "Jan", Warp: 480, Resham: 200, Jari: 110 },
  { month: "Feb", Warp: 510, Resham: 230, Jari: 130 },
  { month: "Mar", Warp: 400, Resham: 190, Jari: 100 },
  { month: "Apr", Warp: 460, Resham: 220, Jari: 120 },
  { month: "May", Warp: 570, Resham: 220, Jari: 130 },
];

const SPEND_DATA = [
  { name: "Warp",   pct: 25, value: "₹14,20,000", color: T.royalBurgundy },
  { name: "Resham", pct: 32, value: "₹18,60,000", color: T.antiqueGold   },
  { name: "Jari",   pct: 43, value: "₹24,48,000", color: T.luxuryBrown   },
];

const PURCHASE_PERIOD_FILTERS = ["All Time", "This Month", "Last 3 Months", "This Year"];

function PurchaseHistorySection({ onDownloadReport }: { onDownloadReport: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const [period, setPeriod] = useState("All Time");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  return (
    <section id="mat-purchase-history" style={{ padding: `44px ${px}px 0` }}>
      <SectionHeader
        title="Purchase History From All Vendors"
        action="Download Report"
        actionIcon={<Download size={15} />}
        onAction={onDownloadReport}
        actionVariant="gold"
      />
      <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 15, color: T.taupe, margin: "0 0 16px", lineHeight: 1.6 }}>
        This shows everything that was ever purchased and received — from the day this system was started until today. You can also filter by a specific date range.
      </p>

      {/* Filter Panel */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 24px rgba(74,6,27,0.07)", marginBottom: 24, overflow: "visible" }}>
          <div style={{ background: `linear-gradient(100deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12, borderTopLeftRadius: 17, borderTopRightRadius: 17 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SlidersHorizontal size={17} color="#FFFDF9" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: "#FFFDF9", letterSpacing: "-0.1px" }}>Filter Purchase History</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12.5, color: "rgba(255,253,249,0.65)", marginTop: 1 }}>Select a quick range or set a custom date window</div>
            </div>
          </div>

          <div style={{ padding: "22px 24px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 500, color: T.taupe, letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>Quick Range</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PURCHASE_PERIOD_FILTERS.map(f => (
                  <motion.button
                    key={f}
                    onClick={() => setPeriod(f)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      fontFamily: F.ui, fontWeight: 600, fontSize: 13.5,
                      padding: "9px 20px", borderRadius: 99, cursor: "pointer",
                      background: period === f ? T.royalBurgundy : T.warmIvory,
                      color: period === f ? "#FFFDF9" : T.luxuryBrown,
                      border: period === f ? `1px solid ${T.royalBurgundy}` : `1px solid rgba(110,15,45,0.16)`,
                      boxShadow: period === f ? "0 4px 14px rgba(110,15,45,0.22)" : "none",
                      transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
                    }}
                  >
                    {f}
                  </motion.button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(110,15,45,0.08)" }} />
              <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "2px", textTransform: "uppercase" }}>or custom date range</span>
              <div style={{ flex: 1, height: 1, background: "rgba(110,15,45,0.08)" }} />
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
              <DatePickerInput value={fromDate} onChange={setFromDate} label="From Date" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: T.warmCream, flexShrink: 0, marginBottom: 2 }}>
                <ArrowRight size={15} color={T.taupe} strokeWidth={2} />
              </div>
              <DatePickerInput value={toDate} onChange={setToDate} label="To Date" />
            </div>
            {(fromDate || toDate) && (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.antiqueGold, fontWeight: 500 }}>
                Selected range: {fromDate ? new Date(fromDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "start"} → {toDate ? new Date(toDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "end"}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.015, boxShadow: "0 8px 28px rgba(110,15,45,0.32)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: `linear-gradient(100deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, color: "#FFFDF9", border: "none", borderRadius: 12, padding: "14px 24px", fontFamily: F.ui, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 18px rgba(110,15,45,0.22)", letterSpacing: "-0.1px" }}
            >
              <SlidersHorizontal size={17} strokeWidth={2} />
              Apply Filter
            </motion.button>
          </div>
        </div>
      </FadeUp>

      {/* 4 stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 12 : 18, marginBottom: 26, alignItems: "stretch" }}>
        {[
          { Icon: Layers,      label: "Total Warp Purchased",   amount: "2,840 kg", cost: "₹14,20,000", sub: "From 4 vendors · Since system started",    dark: false },
          { Icon: Tag,         label: "Total Resham Purchased", amount: "1,240 kg", cost: "₹18,60,000", sub: "From 3 vendors · All colors combined",       dark: false },
          { Icon: Sparkles,    label: "Total Jari Purchased",   amount: "680 Reels (170 Buns)", cost: "₹24,48,000", sub: "From 2 vendors · All types and grades",      dark: false },
          { Icon: IndianRupee, label: "TOTAL AMOUNT SPENT",     amount: "₹57,28,000", cost: "", sub: "On all raw materials since system started", dark: true  },
        ].map((card, i) => (
          <FadeUp key={card.label} delay={i * 0.09} style={{ height: "100%" }}>
            <div style={{ background: card.dark ? T.darkBurgundy : "#FFFFFF", borderRadius: 16, border: `1px solid ${card.dark ? "transparent" : T.borderDef}`, padding: "22px 22px 20px", boxShadow: card.dark ? "0 8px 32px rgba(61,14,26,0.30)" : "0 2px 12px rgba(74,6,27,0.06)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
              {card.dark && <>
                <div style={{ position: "absolute", top: "-30%", right: "-10%", width: 140, height: 140, borderRadius: "50%", background: "rgba(200,155,71,0.07)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: 100, height: 100, borderRadius: "50%", background: "rgba(200,155,71,0.05)", pointerEvents: "none" }} />
              </>}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: card.dark ? "rgba(200,155,71,0.12)" : "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <card.Icon size={19} color={card.dark ? T.antiqueGold : T.royalBurgundy} />
                </div>
                <span style={{ fontFamily: card.dark ? F.mono : F.ui, fontWeight: 600, fontSize: card.dark ? 10 : 13, color: card.dark ? "rgba(200,155,71,0.85)" : T.taupe, letterSpacing: card.dark ? "2px" : 0, textTransform: card.dark ? "uppercase" : "none", lineHeight: 1.3 }}>{card.label}</span>
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: card.dark ? 32 : 28, color: card.dark ? T.goldLight : T.luxuryBrown, lineHeight: 1, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>{card.amount}</div>
              {card.cost && <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 16, color: T.antiqueGold, marginBottom: 8 }}>{card.cost}</div>}
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: card.dark ? "rgba(255,253,249,0.55)" : T.taupe, lineHeight: 1.5, marginTop: "auto" }}>{card.sub}</div>
            </div>
          </FadeUp>
        ))}
      </div>

      {/* Vendor table */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 16px rgba(74,6,27,0.06)", overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "22px 26px 16px", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 6 }}>How Much Was Bought From Each Vendor</div>
            <div style={{ fontFamily: F.ui, fontSize: 14.5, color: T.taupe, lineHeight: 1.55 }}>Each vendor listed separately — what material they supplied, how much, and what it cost in total.</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: T.silkCream }}>
                  {["Vendor Name", "Material Supplied", "Total Purchased", "Total Paid", "Orders", "Last Purchase"].map(h => (
                    <th key={h} style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", padding: "14px 18px", textAlign: "left", borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VENDOR_DATA.map((v, i) => {
                  return (
                    <motion.tr
                      key={v.name}
                      initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                      transition={{ duration: 0.38, delay: i * 0.05, ease: EASE }}
                      style={{ background: i % 2 === 0 ? "#FFFFFF" : T.warmIvory }}
                    >
                      <td style={{ padding: "15px 18px", fontFamily: F.ui, fontWeight: 700, fontSize: 14.5, color: T.luxuryBrown, borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>{v.name}</td>
                      <td style={{ padding: "15px 18px", borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                          {v.materials.map(m => {
                            const mt = MAT_TAG[m.type as keyof typeof MAT_TAG] || MAT_TAG["Warp"];
                            return <span key={m.label} style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 500, color: mt.col, background: mt.bg, padding: "4px 11px", borderRadius: 7, letterSpacing: "1.2px", whiteSpace: "nowrap" }}>{m.label}</span>
                          })}
                        </div>
                      </td>
                      <td style={{ padding: "15px 18px", fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown, borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                          {v.totals.map((t, idx) => <div key={idx}>{t}</div>)}
                        </div>
                      </td>
                      <td style={{ padding: "15px 18px", fontFamily: F.mono, fontWeight: 700, fontSize: 14.5, color: T.antiqueGold, borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>{v.paid}</td>
                      <td style={{ padding: "15px 18px", fontFamily: F.ui, fontSize: 14.5, color: T.taupe, textAlign: "center", borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>{v.orders}</td>
                      <td style={{ padding: "15px 18px", fontFamily: F.mono, fontSize: 13, color: T.taupe, borderBottom: `1px solid rgba(110,15,45,0.05)`, verticalAlign: "top" }}>{v.last}</td>
                    </motion.tr>
                  );
                })}
                <tr style={{ background: T.warmCream }}>
                  <td colSpan={3} style={{ padding: "16px 18px", fontFamily: F.ui, fontWeight: 600, fontSize: 15, color: T.taupe }}>Grand Total across all vendors:</td>
                  <td colSpan={3} style={{ padding: "16px 18px", fontFamily: F.display, fontWeight: 700, fontSize: 22, color: T.antiqueGold, textAlign: "right" }}>₹57,28,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 22 }}>
        <FadeUp>
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "24px 26px 22px", boxShadow: "0 2px 16px rgba(74,6,27,0.06)", height: "100%" }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 6 }}>How Much Was Purchased Each Month</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 22, lineHeight: 1.5 }}>Last 6 months — Warp, Resham, and Jari compared side by side</div>
            {(() => {
              const maxVal = Math.max(...MONTHLY_DATA.flatMap(d => [d.Warp, d.Resham, d.Jari]));
              return (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 200, paddingBottom: 4 }}>
                  {MONTHLY_DATA.map(d => (
                    <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 164, width: "100%", justifyContent: "center" }}>
                        <motion.div initial={{ height: 0 }} whileInView={{ height: `${(d.Warp / maxVal) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }} style={{ width: 12, background: T.royalBurgundy, borderRadius: "4px 4px 0 0", minHeight: 2 }} />
                        <motion.div initial={{ height: 0 }} whileInView={{ height: `${(d.Resham / maxVal) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.08, ease: EASE }} style={{ width: 12, background: T.antiqueGold, borderRadius: "4px 4px 0 0", minHeight: 2 }} />
                        <motion.div initial={{ height: 0 }} whileInView={{ height: `${(d.Jari / maxVal) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.16, ease: EASE }} style={{ width: 12, background: T.luxuryBrown, borderRadius: "4px 4px 0 0", minHeight: 2 }} />
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe, letterSpacing: "0.5px" }}>{d.month}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
              {[["Warp", T.royalBurgundy], ["Resham", T.antiqueGold], ["Jari", T.luxuryBrown]].map(([name, color]) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: "24px 26px 22px", boxShadow: "0 2px 16px rgba(74,6,27,0.06)", height: "100%" }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: T.luxuryBrown, marginBottom: 6 }}>Total Spend Split</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 22, lineHeight: 1.5 }}>How much of your total spend goes to each material type</div>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ flexShrink: 0 }}>
                <PieChart width={160} height={160}>
                  <Pie data={SPEND_DATA} cx={80} cy={80} innerRadius={48} outerRadius={72} dataKey="pct" paddingAngle={3}>
                    {SPEND_DATA.map((entry) => <Cell key={`spend-cell-${entry.name}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                {SPEND_DATA.map(s => (
                  <div key={s.name}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 15, color: T.luxuryBrown, flex: 1 }}>{s.name}</span>
                      <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 16, color: s.color }}>{s.pct}%</span>
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 13.5, color: T.antiqueGold, paddingLeft: 22 }}>{s.value}</div>
                    <AnimatedBar pct={s.pct} color={s.color} height={5} trackBg="rgba(110,15,45,0.07)" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — RECENTLY RECEIVED FROM VENDORS
// ═══════════════════════════════════════════════════════════════════════════════
const RECENT_DATA = [
  { date: "01 May 2026", vendor: "Sri Venkateswara Textiles", vendorCity: "Ongole, AP",      firmName: "Beere Kesava & Brothers Silks", description: "Cotton/Silk",        quantity: "50 kg",  po: "PO-SVT-2026-042", type: "Warp"   },
  { date: "02 May 2026", vendor: "Kanchipuram Silks",         vendorCity: "Kanchipuram, TN", firmName: "Beere Kesava & Brothers Silks", description: "Red + Blue",         quantity: "58 kg",  po: "PO-KNC-2026-118", type: "Resham" },
  { date: "01 May 2026", vendor: "Surat Zari Works",          vendorCity: "Surat, GJ",       firmName: "Beere Kesava & Brothers Silks", description: "Polyester 2G Gold",  quantity: "5 Buns", po: "PO-SZW-2026-033", type: "Jari"   },
  { date: "28 Apr 2026", vendor: "Mysore Silk Co.",           vendorCity: "Mysore, KA",      firmName: "Beere Kesava & Brothers Silks", description: "Gold",               quantity: "25 kg",  po: "PO-MSC-2026-056", type: "Resham" },
];

function RecentReceivedDetailModal({ item, onClose }: { item: typeof RECENT_DATA[0] | null; onClose: () => void }) {
  if (!item) return null;
  const mt = MAT_TAG[item.type];
  return (
    <ModalOverlay open={!!item} onClose={onClose}>
      <ModalHeader title="Material Receipt Details" subtitle={item.po} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          {[
            { label: "Vendor", value: item.vendor },
            { label: "Vendor City", value: item.vendorCity },
            { label: "Purchasing Firm", value: item.firmName },
            { label: "Material Type", value: item.type },
            { label: "Description", value: item.description },
            { label: "Quantity", value: item.quantity },
            { label: "Received Date", value: item.date },
            { label: "PO Reference", value: item.po },
          ].map(row => (
            <div key={row.label} style={{ background: T.silkCream, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 5 }}>{row.label}</div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{row.value}</div>
            </div>
          ))}
        </div>
        <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{ width: "100%", padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}>
          Close
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

function RecentProcurementSection({ onViewAllPurchases }: { onViewAllPurchases: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const [viewItem, setViewItem] = useState<typeof RECENT_DATA[0] | null>(null);
  return (
    <section id="mat-recent" style={{ padding: `44px ${px}px 0` }}>
      <SectionHeader title="Recently Received from Vendors" action="View All Purchases" actionIcon={<Package size={15} />} actionVariant="outline" onAction={onViewAllPurchases} />
      <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 15, color: T.taupe, margin: "0 0 22px", lineHeight: 1.65 }}>
        These are the last few deliveries of raw material to the factory — most recent first.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: isMobile ? 16 : 22, alignItems: "stretch" }}>
        {RECENT_DATA.map((r, i) => {
              const mt = MAT_TAG[r.type];
              const typeGrad = r.type === "Warp"
                ? "linear-gradient(135deg, #6E0F2D 0%, #A0334F 100%)"
                : r.type === "Resham"
                ? "linear-gradient(135deg, #7A5010 0%, #C89B47 100%)"
                : "linear-gradient(135deg, #1E5E40 0%, #2E9E6A 100%)";
              const typeAccent = r.type === "Warp" ? T.royalBurgundy : r.type === "Resham" ? T.antiqueGold : T.green;
              const typeLight = r.type === "Warp" ? "rgba(110,15,45,0.07)" : r.type === "Resham" ? "rgba(200,155,71,0.10)" : "rgba(30,102,64,0.07)";
              const initials = r.vendor.split(" ").slice(0,2).map((w: string) => w[0]).join("").toUpperCase();
              return (
                <FadeUp key={r.po} delay={i * 0.09} style={{ height: "100%" }}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: "0px 28px 64px rgba(74,6,27,0.18)" }}
                    transition={{ type: "spring", stiffness: 240, damping: 22 }}
                    style={{ background: "#FFFFFF", borderRadius: 22, border: `1px solid ${T.borderDef}`, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", height: "100%", boxShadow: "0px 4px 20px rgba(74,6,27,0.08)" }}
                  >
                    {/* Gradient header strip with type pill + date */}
                    <div style={{ background: typeGrad, padding: "18px 20px 20px", position: "relative", overflow: "hidden" }}>
                      {/* Subtle radial glow */}
                      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.10)", pointerEvents: "none" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.90)", background: "rgba(255,255,255,0.18)", padding: "4px 12px", borderRadius: 6, letterSpacing: "2px", textTransform: "uppercase" as const }}>{r.type}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 10.5, color: "rgba(255,255,255,0.70)", letterSpacing: "0.5px" }}>#{r.po.split("-").slice(-1)[0]}</span>
                      </div>
                      {/* Big quantity display */}
                      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 34, color: "#FFFFFF", lineHeight: 1, marginBottom: 4, letterSpacing: "-0.5px" }}>{r.quantity}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.80)", fontWeight: 500 }}>{r.description}</div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", flex: 1, gap: 14 }}>
                      {/* Date chip */}
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: typeLight, borderRadius: 8, padding: "5px 10px", alignSelf: "flex-start" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: typeAccent }} />
                        <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 600, color: typeAccent }}>{r.date}</span>
                      </div>

                      {/* Vendor row with avatar */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: typeGrad, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(74,6,27,0.15)" }}>
                          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 800, color: "#FFFFFF" }}>{initials}</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13.5, color: T.luxuryBrown, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.vendor}</div>
                          <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{r.vendorCity}</div>
                        </div>
                      </div>

                      <div style={{ height: 1, background: "rgba(110,15,45,0.08)" }} />

                      {/* Firm + PO */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "1.3px", textTransform: "uppercase" as const, color: T.taupe }}>Firm</span>
                          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: typeAccent, textAlign: "right" as const, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.firmName}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "1.3px", textTransform: "uppercase" as const, color: T.taupe }}>PO Ref</span>
                          <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 8px", borderRadius: 5 }}>{r.po}</span>
                        </div>
                      </div>

                      {/* Entry complete badge */}
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.22)", borderRadius: 8, padding: "7px 12px", alignSelf: "flex-start" }}>
                        <CheckCircle2 size={13} color={T.green} />
                        <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.green }}>Entry Complete</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ padding: "0 20px 20px", display: "flex", gap: 8, marginTop: "auto" }}>
                      <motion.button onClick={() => setViewItem(r)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.14 }}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: typeLight, color: typeAccent, border: `1.5px solid ${typeAccent}30`, borderRadius: 12, padding: "11px 10px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        <Eye size={15} strokeWidth={2.2} /> View
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.14 }}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: typeGrad, color: "#FFF", border: "none", borderRadius: 12, padding: "11px 10px", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        <Printer size={15} strokeWidth={2.2} /> Print
                      </motion.button>
                    </div>
                  </motion.div>
                </FadeUp>
              );
            })}
      </div>
      <RecentReceivedDetailModal item={viewItem} onClose={() => setViewItem(null)} />
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9 — FULL MOVEMENT HISTORY
// ═══════════════════════════════════════════════════════════════════════════════
type MoveType = "in" | "out";
type MoveEntry = { type: MoveType; desc: string; ref: string; time: string };

const MOVEMENT_ENTRIES: MoveEntry[] = [
  { type: "in",  desc: "50 kg of Warp (Cotton/Silk) was received from Sri Venkateswara Textiles",    ref: "GRN-WRP-SVT-20260501-001", time: "01 May 2026, 10:30 AM" },
  { type: "out", desc: "Warp 4.5 kg, Resham 1.2 kg and Jari 200g was given to Padma Veni for weaving", ref: "ISS-PV-BATCH086-20260501",  time: "01 May 2026, 02:15 PM" },
  { type: "in",  desc: "30 kg of Resham (Red and Blue) was received from Kanchipuram Silks",          ref: "GRN-RSM-KNC-20260430-001", time: "30 Apr 2026, 11:00 AM" },
  { type: "out", desc: "Warp 6 kg, Resham 900g and Jari 250g was given to Ravi Kumar for weaving",    ref: "ISS-RK-BATCH089-20260429",  time: "29 Apr 2026, 09:45 AM" },
  { type: "in",  desc: "20 kg of Jari Polyester 2G was received from Surat Zari Works",               ref: "GRN-JRI-SZW-20260428-001", time: "28 Apr 2026, 03:00 PM" },
  { type: "out", desc: "Warp 3 kg, Resham 900g and Jari 150g was given to Suresh Murti for weaving",  ref: "ISS-SM-BATCH081-20260427",  time: "27 Apr 2026, 10:00 AM" },
  { type: "in",  desc: "25 kg of Resham Gold was received from Mysore Silk Co.",                      ref: "GRN-RSM-MSC-20260426-001", time: "26 Apr 2026, 04:30 PM" },
  { type: "out", desc: "Warp 5 kg, Resham 700g and Jari 200g was given to Anand K. for weaving",      ref: "ISS-AK-BATCH083-20260425",  time: "25 Apr 2026, 11:30 AM" },
];

const MOVE_CHART_DATA = [
  { label: "1–7 May",      received: 80, given: 15 },
  { label: "24–30 Apr",    received: 45, given: 40 },
  { label: "17–23 Apr",    received: 60, given: 35 },
  { label: "10–16 Apr",    received: 40, given: 28 },
  { label: "3–9 Apr",      received: 55, given: 32 },
  { label: "26 Mar–2 Apr", received: 70, given: 22 },
];

const PERIOD_PILLS = ["Last 7 Days", "Last 30 Days", "Last 3 Months", "Choose Your Own Dates"];

function MovementHistorySection({ onDownloadMovementReport }: { onDownloadMovementReport: () => void }) {
  const { isMobile, px } = useContext(MobileCtx);
  const [period, setPeriod] = useState("Last 30 Days");

  return (
    <section id="mat-movement" style={{ padding: `44px ${px}px 0` }}>
      <SectionHeader
        title="Full Movement History — Stock Coming In and Going Out"
        action="Download Report"
        actionIcon={<Download size={15} />}
        onAction={onDownloadMovementReport}
        actionVariant="gold"
      />
      <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 15, color: T.taupe, margin: "0 0 22px", lineHeight: 1.65 }}>
        Every time material came into the factory from a vendor, or was given out to a weaver — it is recorded here.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 26, flexWrap: "wrap" }}>
        {PERIOD_PILLS.map(p => (
          <motion.button
            key={p}
            onClick={() => setPeriod(p)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, padding: "9px 20px", borderRadius: 99, cursor: "pointer", background: period === p ? T.royalBurgundy : "#FFFFFF", color: period === p ? "#FFFDF9" : T.luxuryBrown, border: period === p ? `1px solid ${T.royalBurgundy}` : `1px solid rgba(110,15,45,0.18)`, boxShadow: period === p ? "0 4px 14px rgba(110,15,45,0.22)" : "none", transition: "background 0.2s, color 0.2s, box-shadow 0.2s" }}
          >
            {p}
          </motion.button>
        ))}
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.07)", overflow: "hidden", marginBottom: 28 }}>
          <div style={{ padding: "22px 28px 18px", borderBottom: `1px solid rgba(110,15,45,0.07)`, display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 22, color: T.luxuryBrown, marginBottom: 4 }}>Stock Coming In vs Going Out</div>
              <div style={{ fontFamily: F.ui, fontSize: 14.5, color: T.taupe }}>How much material was received from vendors vs given out to weavers each week</div>
            </div>
            <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 500, color: T.antiqueGold, background: "rgba(200,155,71,0.10)", border: "1px solid rgba(200,155,71,0.22)", borderRadius: 8, padding: "5px 13px", letterSpacing: "0.5px" }}>{period}</span>
          </div>

          <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: 32, alignItems: "stretch" }}>
            <div style={{ flex: "0 0 58%", display: "flex", flexDirection: "column" }}>
              {(() => {
                const maxVal = Math.max(...MOVE_CHART_DATA.flatMap(d => [d.received, d.given]));
                return (
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 10, minHeight: 220 }}>
                    {MOVE_CHART_DATA.map(d => (
                      <div key={d.label} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 5, width: "100%", justifyContent: "center" }}>
                          <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.65, ease: EASE }} style={{ width: 18, height: `${(d.received / maxVal) * 100}%`, background: T.royalBurgundy, borderRadius: "5px 5px 0 0", minHeight: 4, transformOrigin: "bottom" }} />
                          <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.65, delay: 0.1, ease: EASE }} style={{ width: 18, height: `${(d.given / maxVal) * 100}%`, background: T.antiqueGold, borderRadius: "5px 5px 0 0", minHeight: 4, transformOrigin: "bottom" }} />
                        </div>
                        <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, textAlign: "center", lineHeight: 1.35, marginTop: 8, flexShrink: 0 }}>{d.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div style={{ display: "flex", gap: 24, marginTop: 20, flexShrink: 0 }}>
                {[["Received from Vendor", T.royalBurgundy], ["Given to Weavers", T.antiqueGold]].map(([label, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 13, height: 13, borderRadius: 4, background: color, flexShrink: 0 }} />
                    <span style={{ fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Total received from vendors", value: "412 kg", sub: "Across all deliveries in this period",  color: T.royalBurgundy, bg: "rgba(110,15,45,0.05)",  border: "rgba(110,15,45,0.14)"  },
                { label: "Total given to weavers",      value: "157 kg", sub: "Across all issue slips in this period", color: T.antiqueGold,   bg: "rgba(200,155,71,0.06)", border: "rgba(200,155,71,0.20)" },
                { label: "Currently still in factory",  value: "255 kg", sub: "Net stock remaining in the store",      color: T.green,         bg: "rgba(30,102,64,0.06)",  border: "rgba(30,102,64,0.20)"  },
              ].map(row => (
                <div key={row.label} style={{ flex: 1, background: row.bg, border: `1px solid ${row.border}`, borderRadius: 14, padding: "22px 22px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: T.taupe, marginBottom: 8 }}>{row.label}</div>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: row.color, lineHeight: 1, marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>{row.value}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>{row.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "22px 28px 18px", borderBottom: `1px solid rgba(110,15,45,0.07)` }}>
            <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 22, color: T.luxuryBrown, marginBottom: 4 }}>Every Movement Entry</div>
            <div style={{ fontFamily: F.ui, fontSize: 14.5, color: T.taupe }}>Each line below is one movement — material arriving or leaving the factory store.</div>
          </div>

          <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
            {MOVEMENT_ENTRIES.map((entry, i) => (
              <motion.div
                key={entry.ref}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: EASE }}
                style={{ display: "flex", gap: 18, paddingBottom: i < MOVEMENT_ENTRIES.length - 1 ? 22 : 0, position: "relative" }}
              >
                {i < MOVEMENT_ENTRIES.length - 1 && (
                  <div style={{ position: "absolute", left: 22, top: 46, bottom: 0, width: 2, background: "rgba(110,15,45,0.07)", zIndex: 0 }} />
                )}
                <div style={{ flexShrink: 0, zIndex: 1 }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: entry.type === "in" ? "rgba(30,102,64,0.11)" : "rgba(192,57,43,0.09)", border: `2px solid ${entry.type === "in" ? "rgba(30,102,64,0.32)" : "rgba(192,57,43,0.28)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: entry.type === "in" ? T.green : T.crimson }} />
                  </div>
                </div>
                <div style={{ flex: 1, background: entry.type === "in" ? "rgba(30,102,64,0.03)" : "rgba(192,57,43,0.02)", borderRadius: 14, border: `1px solid ${entry.type === "in" ? "rgba(30,102,64,0.12)" : "rgba(192,57,43,0.10)"}`, padding: "16px 22px", boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: entry.type === "in" ? "rgba(30,102,64,0.10)" : "rgba(192,57,43,0.09)", color: entry.type === "in" ? T.green : T.crimson, fontFamily: F.ui, fontWeight: 700, fontSize: 13.5, padding: "6px 14px", borderRadius: 8 }}>
                      {entry.type === "in"
                        ? <PackageCheck size={15} />
                        : <ArrowRight size={15} />
                      }
                      {entry.type === "in" ? "Received from Vendor" : "Given to Weaver"}
                    </span>
                    <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.taupe, whiteSpace: "nowrap" }}>{entry.time}</span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 15, color: T.luxuryBrown, lineHeight: 1.6, marginBottom: 8 }}>{entry.desc}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, letterSpacing: "0.4px" }}>{entry.ref}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════════════════
const FOOTER_LINKS = {
  "Quick Links": ["Overview", "Materials", "Weavers", "Production", "Payments", "Reports", "Customers"],
  "Company":     ["About Us", "Our Story", "Awards", "Blog"],
  "Support":     ["Help Center", "Contact Us", "Privacy Policy", "Terms of Use"],
};

function MaterialsFooter() {
  const { isMobile, px } = useContext(MobileCtx);
  const [email, setEmail] = useState("");
  return (
    <footer style={{ background: T.darkBurgundy, marginTop: 56, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 56px, rgba(200,155,71,0.018) 56px, rgba(200,155,71,0.018) 57px), repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.014) 80px, rgba(200,155,71,0.014) 81px)` }} />
      <div style={{ position: "absolute", top: "-20%", right: "5%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(200,155,71,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, padding: `${isMobile ? 32 : 56}px ${px}px 0`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 28 : 48 }}>
        <div style={{ flex: "0 0 260px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.24)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.display, fontSize: 17, color: T.goldLight }}>BK</span>
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: "#FFFDF9", lineHeight: 1.1 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: "rgba(255,253,249,0.55)" }}>&amp; Brothers Silks</div>
              <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 8, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase" }}>Est. 1999</div>
            </div>
          </div>
          <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12.5, color: "rgba(255,253,249,0.50)", lineHeight: 1.8, margin: "0 0 22px" }}>
            Four generations of weavers crafting heritage silk sarees. Tradition, trust, and timeless quality since 1999.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {["f", "in", "yt", "li"].map((s) => (
              <motion.div key={s} whileHover={{ scale: 1.12, y: -2 }} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,253,249,0.12)", background: "rgba(255,253,249,0.05)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <span style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(255,253,249,0.55)" }}>{s}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {Object.entries(FOOTER_LINKS).map(([col, links]) => (
          <div key={col} style={{ flex: 1 }}>
            <div style={{ fontFamily: F.mono, fontSize: 8.5, fontWeight: 500, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 18 }}>{col}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {links.map(l => (
                <motion.span key={l} whileHover={{ x: 3, color: "#FFFDF9" }} transition={{ duration: 0.18 }} style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(255,253,249,0.55)", cursor: "pointer" }}>
                  {l}
                </motion.span>
              ))}
            </div>
          </div>
        ))}

        <div style={{ flex: "0 0 220px" }}>
          <div style={{ fontFamily: F.mono, fontSize: 8.5, fontWeight: 500, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 18 }}>Subscribe to Updates</div>
          <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12.5, color: "rgba(255,253,249,0.50)", lineHeight: 1.7, margin: "0 0 16px" }}>
            Get notified about stock alerts and system updates.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" style={{ fontFamily: F.ui, fontSize: 12.5, color: "#FFFDF9", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: "10px 14px", outline: "none", width: "100%" }} />
            <motion.button initial={{ backgroundColor: T.royalBurgundy }} animate={{ backgroundColor: T.royalBurgundy }} whileHover={{ scale: 1.03, backgroundColor: "#5A0A24" }} whileTap={{ scale: 0.97 }} style={{ color: "#FFFDF9", border: "none", borderRadius: 10, padding: "10px 0", fontFamily: F.ui, fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%" }}>
              Subscribe
            </motion.button>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2, margin: `32px ${px}px 0`, borderTop: "1px solid rgba(255,253,249,0.08)", padding: "18px 0 32px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 0, justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center" }}>
        <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11.5, color: "rgba(255,253,249,0.35)" }}>
          © 2025 Beere Kesava &amp; Brothers Silks. All rights reserved.
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 10, color: "rgba(200,155,71,0.60)", letterSpacing: "2px", textTransform: "uppercase" }}>Tradition · Trust · Timeless Quality</span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.antiqueGold, opacity: 0.6 }} />
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export function MaterialsPage({ onNavigate }: { onNavigate?: (tab: string, ctx?: any) => void } = {}) {
  const isMobile = useIsMobile();
  const px = isMobile ? 16 : 56;

  const { pos, addPO, nextPONumber } = usePO();

  // Top-level modal state
  const [showAddStock, setShowAddStock] = useState(false);
  const [showFullReports, setShowFullReports] = useState(false);
  const [showPurchaseDownload, setShowPurchaseDownload] = useState(false);
  const [showMovementDownload, setShowMovementDownload] = useState(false);
  const [showAllPurchases, setShowAllPurchases] = useState(false);

  // PO modal state
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  const [successPOId, setSuccessPOId] = useState<string | null>(null);

  const handlePOSubmit = (po: PurchaseOrder) => {
    addPO(po);
    setSuccessPOId(po.poNumber);
    toast.success(`${po.poNumber} submitted for Superadmin approval`);
  };

  // Sub-page: All Purchases
  if (showAllPurchases) {
    return <AllPurchasesPage onBack={() => setShowAllPurchases(false)} />;
  }

  return (
    <MobileCtx.Provider value={{ isMobile, px }}>
      <div style={{ fontFamily: F.ui }}>
        <PageHeader />
        <MetricsBar />
        <div style={{ background: T.silkCream }}>
          {/* Success strip */}
          {successPOId && (
            <div style={{ padding: `16px ${px}px 0` }}>
              <div style={{
                background: "rgba(30,102,64,0.12)",
                border: "1px solid rgba(30,102,64,0.24)",
                borderRadius: 10,
                padding: "13px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontFamily: F.ui, fontSize: 13.5, color: "#1E6640", fontWeight: 600 }}>
                  ✓ Purchase Order {successPOId} submitted for Superadmin approval. You will be notified when it is approved or rejected.
                </span>
                <button
                  onClick={() => setSuccessPOId(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#1E6640", marginLeft: 16 }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <AlertsCard onCreatePO={() => setShowCreatePO(true)} />
          <POTrackerSection
            onCreatePO={() => setShowCreatePO(true)}
            onViewPO={(po) => setViewPO(po)}
          />
          <StockOverview onSeeFullReports={() => setShowFullReports(true)} />
          <IssuedThisMonthCard onNavigate={onNavigate} />
          <BatchesSection onAddNewStock={() => onNavigate?.("ReceiveStock")} />
          <PurchaseHistorySection onDownloadReport={() => setShowPurchaseDownload(true)} />
          <MovementHistorySection onDownloadMovementReport={() => setShowMovementDownload(true)} />
        </div>
        <MaterialsFooter />

        {/* Top-level modals */}
        <AddNewStockModal open={showAddStock} onClose={() => setShowAddStock(false)} />
        <FullReportsModal open={showFullReports} onClose={() => setShowFullReports(false)} />
        <DownloadReportModal open={showPurchaseDownload} onClose={() => setShowPurchaseDownload(false)} title="Purchase History Report" />
        <DownloadReportModal open={showMovementDownload} onClose={() => setShowMovementDownload(false)} title="Movement History Report" />

        {/* PO modals */}
        <POCreateModal
          open={showCreatePO}
          onClose={() => setShowCreatePO(false)}
          onSubmit={handlePOSubmit}
          nextPONumber={nextPONumber}
        />
        <PODocumentModal
          open={!!viewPO}
          onClose={() => setViewPO(null)}
          po={viewPO}
        />
      </div>
    </MobileCtx.Provider>
  );
}
