import React, { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  Search, Package, Layers, Tag, Sparkles, Eye, Printer,
  ChevronLeft, Calendar, Filter, IndianRupee, X, Check,
  Download, FileText, ArrowUpRight, Boxes, TrendingUp, ShoppingBag,
  ChevronRight, Building2, Hash,
} from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#8B7060",
  warmCream:     "#F5E8D0",
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
  gold:   "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
};
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1, "lnum" 1' };

// ── Data ──────────────────────────────────────────────────────────────────────
type MatType = "Warp" | "Resham" | "Jari";

interface Purchase {
  id: string;
  po: string;
  date: string;
  vendor: string;
  vendorCity: string;
  firmName: string;
  material: string;
  type: MatType;
  quantity: string;
  totalPaid: string;
  status: "complete" | "pending" | "partial";
  grn: string;
  notes?: string;
}

const ALL_PURCHASES: Purchase[] = [
  { id: "PUR-001", po: "PO-SVT-2026-042", date: "01 May 2026", vendor: "Sri Venkateswara Textiles", vendorCity: "Ongole, AP",      firmName: "Beere Kesava & Brothers Silks", material: "Cotton/Silk",           type: "Warp",   quantity: "50 kg",  totalPaid: "₹14,000",  status: "complete", grn: "GRN-WRP-SVT-20260501-001" },
  { id: "PUR-002", po: "PO-KNC-2026-118", date: "02 May 2026", vendor: "Kanchipuram Silks",         vendorCity: "Kanchipuram, TN", firmName: "Beere Kesava & Brothers Silks", material: "Red + Blue",            type: "Resham", quantity: "58 kg",  totalPaid: "₹87,000",  status: "complete", grn: "GRN-RSM-KNC-20260430-001" },
  { id: "PUR-003", po: "PO-SZW-2026-033", date: "01 May 2026", vendor: "Surat Zari Works",          vendorCity: "Surat, GJ",       firmName: "Beere Kesava & Brothers Silks", material: "Polyester 2G Gold",     type: "Jari",   quantity: "5 Buns", totalPaid: "₹64,000",  status: "complete", grn: "GRN-JRI-SZW-20260428-001" },
  { id: "PUR-004", po: "PO-MSC-2026-056", date: "28 Apr 2026", vendor: "Mysore Silk Co.",           vendorCity: "Mysore, KA",      firmName: "Beere Kesava & Brothers Silks", material: "Gold",                  type: "Resham", quantity: "25 kg",  totalPaid: "₹37,000",  status: "complete", grn: "GRN-RSM-MSC-20260426-001" },
  { id: "PUR-005", po: "PO-LTH-2026-029", date: "28 Apr 2026", vendor: "Lakshmi Thread House",      vendorCity: "Chennai, TN",     firmName: "Beere Kesava & Brothers Silks", material: "Cotton/Silk",           type: "Warp",   quantity: "40 kg",  totalPaid: "₹11,000",  status: "complete", grn: "GRN-WRP-LTH-20260428-001" },
  { id: "PUR-006", po: "PO-VZH-2026-021", date: "28 Apr 2026", vendor: "Varanasi Zari House",       vendorCity: "Varanasi, UP",    firmName: "Beere Kesava & Brothers Silks", material: "Silk Fast 2G Gold",     type: "Jari",   quantity: "2 Buns", totalPaid: "₹27,360",  status: "complete", grn: "GRN-JRI-VZH-20260428-001" },
  { id: "PUR-007", po: "PO-KNC-2026-109", date: "15 Apr 2026", vendor: "Kanchipuram Silks",         vendorCity: "Kanchipuram, TN", firmName: "Beere Kesava & Brothers Silks", material: "Blue",                  type: "Resham", quantity: "28 kg",  totalPaid: "₹42,000",  status: "complete", grn: "GRN-RSM-KNC-20260415-001" },
  { id: "PUR-008", po: "PO-SVT-2026-038", date: "20 Apr 2026", vendor: "Sri Venkateswara Textiles", vendorCity: "Ongole, AP",      firmName: "Beere Kesava & Brothers Silks", material: "Cotton/Silk",           type: "Warp",   quantity: "35 kg",  totalPaid: "₹9,800",   status: "complete", grn: "GRN-WRP-SVT-20260420-001" },
  { id: "PUR-009", po: "PO-SZW-2026-028", date: "20 Apr 2026", vendor: "Surat Zari Works",          vendorCity: "Surat, GJ",       firmName: "Beere Kesava & Brothers Silks", material: "Polyester 3G Copper",   type: "Jari",   quantity: "1 Bun",  totalPaid: "₹12,800",  status: "complete", grn: "GRN-JRI-SZW-20260420-001" },
  { id: "PUR-010", po: "PO-VZH-2026-018", date: "20 Apr 2026", vendor: "Varanasi Zari House",       vendorCity: "Varanasi, UP",    firmName: "Beere Kesava & Brothers Silks", material: "Silk Fast 1G Blue",     type: "Jari",   quantity: "1 Bun",  totalPaid: "₹9,120",   status: "complete", grn: "GRN-JRI-VZH-20260420-001" },
  { id: "PUR-011", po: "PO-MSC-2026-048", date: "10 Apr 2026", vendor: "Mysore Silk Co.",           vendorCity: "Mysore, KA",      firmName: "Beere Kesava & Brothers Silks", material: "Gold + Red",            type: "Resham", quantity: "30 kg",  totalPaid: "₹44,400",  status: "complete", grn: "GRN-RSM-MSC-20260410-001" },
  { id: "PUR-012", po: "PO-LTH-2026-022", date: "05 Apr 2026", vendor: "Lakshmi Thread House",      vendorCity: "Chennai, TN",     firmName: "Beere Kesava & Brothers Silks", material: "Cotton/Silk",           type: "Warp",   quantity: "45 kg",  totalPaid: "₹12,375",  status: "complete", grn: "GRN-WRP-LTH-20260405-001" },
  { id: "PUR-013", po: "PO-KNC-2026-101", date: "01 Apr 2026", vendor: "Kanchipuram Silks",         vendorCity: "Kanchipuram, TN", firmName: "Beere Kesava & Brothers Silks", material: "Green",                 type: "Resham", quantity: "22 kg",  totalPaid: "₹33,000",  status: "complete", grn: "GRN-RSM-KNC-20260401-001" },
  { id: "PUR-014", po: "PO-SZW-2026-019", date: "28 Mar 2026", vendor: "Surat Zari Works",          vendorCity: "Surat, GJ",       firmName: "Beere Kesava & Brothers Silks", material: "Polyester 1G Silver",   type: "Jari",   quantity: "1 Bun",  totalPaid: "₹9,600",   status: "complete", grn: "GRN-JRI-SZW-20260328-001" },
  { id: "PUR-015", po: "PO-SVT-2026-031", date: "20 Mar 2026", vendor: "Sri Venkateswara Textiles", vendorCity: "Ongole, AP",      firmName: "Beere Kesava & Brothers Silks", material: "Cotton/Silk",           type: "Warp",   quantity: "60 kg",  totalPaid: "₹16,800",  status: "complete", grn: "GRN-WRP-SVT-20260320-001" },
  { id: "PUR-016", po: "PO-VZH-2026-014", date: "15 Mar 2026", vendor: "Varanasi Zari House",       vendorCity: "Varanasi, UP",    firmName: "Beere Kesava & Brothers Silks", material: "Silk Fast 3G Pink",     type: "Jari",   quantity: "1 Bun",  totalPaid: "₹13,680",  status: "pending", grn: "GRN-JRI-VZH-20260315-001", notes: "Partial shipment, remaining stock expected by 25 Mar" },
];

const MAT_CFG: Record<MatType, { col: string; bg: string; Icon: React.ElementType }> = {
  Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.09)",   Icon: Layers   },
  Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.13)",  Icon: Tag      },
  Jari:   { col: T.luxuryBrown,   bg: "rgba(59,35,20,0.09)",    Icon: Sparkles },
};

const STATUS_CFG = {
  complete: { label: "Entry Complete",  color: T.green,        bg: "rgba(30,102,64,0.10)",  border: "rgba(30,102,64,0.22)" },
  pending:  { label: "Pending / Partial", color: "#7A5E1C",   bg: "rgba(200,155,71,0.12)", border: "rgba(200,155,71,0.28)" },
  partial:  { label: "Partial Entry",   color: "#7A5E1C",     bg: "rgba(200,155,71,0.12)", border: "rgba(200,155,71,0.28)" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
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

// ── Modal overlay ─────────────────────────────────────────────────────────────
function ModalOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(61,14,26,0.60)", backdropFilter: "blur(4px)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.28, ease: EASE }}
            onClick={e => e.stopPropagation()}
            style={{ background: T.warmIvory, borderRadius: 22, boxShadow: "0 40px 120px rgba(61,14,26,0.40)", width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", border: `1px solid ${T.borderDef}` }}
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
    <div style={{ background: G.button, borderRadius: "22px 22px 0 0", padding: "26px 28px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: "#FFFDF9", marginBottom: subtitle ? 4 : 0 }}>{title}</div>
        {subtitle && <div style={{ fontFamily: F.ui, fontSize: 13.5, color: "rgba(255,253,249,0.65)" }}>{subtitle}</div>}
      </div>
      <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
        <X size={18} color="#FFFDF9" />
      </motion.button>
    </div>
  );
}

// ── View Purchase Details Modal ───────────────────────────────────────────────
function ViewPurchaseModal({ purchase, onClose }: { purchase: Purchase | null; onClose: () => void }) {
  if (!purchase) return null;
  const mc = MAT_CFG[purchase.type];
  const sc = STATUS_CFG[purchase.status];
  const MatIcon = mc.Icon;

  return (
    <ModalOverlay open={!!purchase} onClose={onClose}>
      <ModalHeader title="Purchase Details" subtitle={`Full record for ${purchase.po}`} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        {/* PO + GRN */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
          <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "5px 12px", borderRadius: 8 }}>{purchase.po}</span>
          <span style={{ fontFamily: F.mono, fontSize: 12.5, color: T.taupe, background: T.silkCream, padding: "5px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}` }}>{purchase.grn}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 20, padding: "5px 12px" }}>
            <Check size={12} /> {sc.label}
          </span>
        </div>

        {/* Vendor + type */}
        <div style={{ background: mc.bg, borderRadius: 14, padding: "16px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", flexShrink: 0 }}>
            <MatIcon size={22} color={mc.col} />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.luxuryBrown, marginBottom: 3 }}>{purchase.vendor}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>{purchase.vendorCity}</div>
            <div style={{ fontFamily: F.mono, fontSize: 11.5, color: mc.col, background: "rgba(255,255,255,0.60)", padding: "2px 9px", borderRadius: 6, display: "inline-block", letterSpacing: "1px" }}>{purchase.type} · {purchase.material}</div>
          </div>
        </div>

        {/* Purchasing firm */}
        <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.antiqueGold, fontWeight: 600, marginBottom: 14 }}>{purchase.firmName}</div>

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          {[
            { label: "Date Received",     value: purchase.date,       Icon: Calendar },
            { label: "Purchase Order",    value: purchase.po,         Icon: FileText },
            { label: "Quantity",          value: purchase.quantity,   Icon: Package },
            { label: "Description",       value: purchase.material,   Icon: Tag },
          ].map(row => (
            <div key={row.label} style={{ background: T.silkCream, borderRadius: 12, padding: "14px 16px", border: `1px solid ${T.borderDef}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <row.Icon size={12} color={T.taupe} />
                <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase" }}>{row.label}</span>
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown, lineHeight: 1.3 }}>{row.value}</div>
            </div>
          ))}
        </div>

        {/* Total paid highlight */}
        <div style={{ background: G.card, borderRadius: 14, padding: "20px 22px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(200,155,71,0.80)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>Total Amount Paid</div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 34, color: T.goldLight, lineHeight: 1, ...NUM }}>{purchase.totalPaid}</div>
          </div>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IndianRupee size={24} color={T.antiqueGold} />
          </div>
        </div>

        {/* Notes */}
        {purchase.notes && (
          <div style={{ background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.22)", borderRadius: 10, padding: "12px 16px", marginBottom: 18 }}>
            <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: "#7A5E1C", marginBottom: 4 }}>Notes</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.6 }}>{purchase.notes}</div>
          </div>
        )}

        <motion.button onClick={onClose} whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(110,15,45,0.22)" }} whileTap={{ scale: 0.97 }}
          style={{ width: "100%", padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none" }}>
          Close
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

// ── Print / GRN Receipt Modal ─────────────────────────────────────────────────
function PrintPurchaseModal({ purchase, onClose }: { purchase: Purchase | null; onClose: () => void }) {
  if (!purchase) return null;
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const mc = MAT_CFG[purchase.type];
  const MatIcon = mc.Icon;

  return (
    <ModalOverlay open={!!purchase} onClose={onClose}>
      <ModalHeader title="Print GRN Receipt" subtitle={`Goods Received Note — ${purchase.grn}`} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        {/* Document */}
        <div style={{ background: "#FFFFFF", border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 16, padding: "24px 26px", marginBottom: 22 }}>
          {/* Document header */}
          <div style={{ textAlign: "center", borderBottom: `1.5px solid rgba(110,15,45,0.10)`, paddingBottom: 18, marginBottom: 18 }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 2 }}>Beere Kesava & Brothers Silks</div>
            <div style={{ fontFamily: F.mono, fontSize: 9.5, letterSpacing: "2.5px", textTransform: "uppercase", color: T.taupe, marginBottom: 10 }}>Goods Received Note (GRN)</div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "3px 10px", borderRadius: 6 }}>{purchase.grn}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Printed: {today}</span>
            </div>
          </div>

          {/* Supplier + PO */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Supplier / Vendor", value: purchase.vendor },
              { label: "Purchase Order No.", value: purchase.po },
              { label: "Date of Receipt", value: purchase.date },
              { label: "Material Type", value: purchase.type },
            ].map(row => (
              <div key={row.label}>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 3 }}>{row.label}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{row.value}</div>
              </div>
            ))}
          </div>

          {/* Materials table */}
          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid rgba(110,15,45,0.10)`, marginBottom: 16 }}>
            <div style={{ background: T.silkCream, padding: "10px 16px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
              {["Description", "Qty", "Total"].map(h => (
                <span key={h} style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 600, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, background: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MatIcon size={14} color={mc.col} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>{purchase.material}</span>
              </div>
              <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>{purchase.quantity}</span>
              <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.antiqueGold }}>{purchase.totalPaid}</span>
            </div>
            <div style={{ padding: "10px 16px", background: T.warmCream, display: "flex", justifyContent: "flex-end", gap: 24 }}>
              <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.taupe }}>Grand Total:</span>
              <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.antiqueGold }}>{purchase.totalPaid}</span>
            </div>
          </div>

          {/* Status + Signatures */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(30,102,64,0.09)", border: "1px solid rgba(30,102,64,0.22)", borderRadius: 8, padding: "6px 14px" }}>
              <Check size={13} color={T.green} />
              <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.green }}>Goods Received & Verified</span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {["Received By (Signature)", "Authorized By (Signature)"].map(s => (
              <div key={s}>
                <div style={{ height: 36, borderBottom: `1.5px solid rgba(110,15,45,0.18)`, marginBottom: 6 }} />
                <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <motion.button onClick={onClose} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ flex: 1, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 600, background: T.silkCream, color: T.taupe, border: `1.5px solid rgba(110,15,45,0.18)` }}>
            Close
          </motion.button>
          <motion.button onClick={() => window.print()} whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.30)" }} whileTap={{ scale: 0.97 }}
            style={{ flex: 2, padding: "13px 0", borderRadius: 11, cursor: "pointer", fontFamily: F.ui, fontSize: 14, fontWeight: 700, background: T.royalBurgundy, color: "#FFFDF9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Printer size={16} /> Print GRN Receipt
          </motion.button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Purchase Card ─────────────────────────────────────────────────────────────
function PurchaseCard({ p, onView, onPrint, index }: { p: Purchase; onView: (p: Purchase) => void; onPrint: (p: Purchase) => void; index: number }) {
  const mc = MAT_CFG[p.type];
  const sc = STATUS_CFG[p.status];
  const MatIcon = mc.Icon;

  return (
    <FadeUp delay={index * 0.04}>
      <motion.div
        whileHover={{ y: -8, boxShadow: "0px 28px 72px rgba(74,6,27,0.16)" }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        style={{ background: T.warmIvory, borderRadius: 24, border: `1px solid ${T.borderDef}`, boxShadow: "0px 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {/* Card header */}
        <div style={{ background: mc.bg, padding: "18px 20px 16px", borderBottom: `1px solid rgba(110,15,45,0.07)`, position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: mc.col }} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", flexShrink: 0 }}>
                <MatIcon size={20} color={mc.col} />
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown, lineHeight: 1.2 }}>{p.vendor}</div>
                <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, marginTop: 1 }}>{p.vendorCity}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10.5, color: mc.col, letterSpacing: "1px", marginTop: 2 }}>{p.type} · {p.material}</div>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: T.antiqueGold, fontWeight: 600, marginTop: 2 }}>{p.firmName}</div>
              </div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 20, padding: "4px 10px", flexShrink: 0 }}>
              <Check size={11} /> {sc.label}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", flex: 1, gap: 14 }}>
          {/* PO + Date */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Hash size={11} color={T.royalBurgundy} />
              <span style={{ fontFamily: F.mono, fontSize: 11, color: T.royalBurgundy, letterSpacing: "0.3px" }}>{p.po}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Calendar size={11} color={T.taupe} />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Quantity",    value: p.quantity,   Icon: Package,      color: T.luxuryBrown },
              { label: "Description", value: p.material,   Icon: Tag,          color: T.taupe },
            ].map(stat => (
              <div key={stat.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.borderDef}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <stat.Icon size={11} color={T.taupe} />
                  <span style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" }}>{stat.label}</span>
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: stat.color, ...NUM }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Total paid */}
          <div style={{ background: G.card, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 9, color: "rgba(200,155,71,0.75)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>Total Paid</div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: T.goldLight, lineHeight: 1, ...NUM }}>{p.totalPaid}</div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(200,155,71,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IndianRupee size={18} color={T.antiqueGold} />
            </div>
          </div>

          {/* GRN */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={11} color={T.taupe} />
            <span style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe, letterSpacing: "0.3px" }}>{p.grn}</span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
            <motion.button
              onClick={() => onView(p)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 40, background: "rgba(110,15,45,0.06)", color: T.royalBurgundy, border: `1px solid rgba(110,15,45,0.18)`, borderRadius: 10, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Eye size={14} /> View
            </motion.button>
            <motion.button
              onClick={() => onPrint(p)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 40, background: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 10, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Printer size={14} /> Print
            </motion.button>
          </div>
        </div>
      </motion.div>
    </FadeUp>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AllPurchasesPage({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | MatType>("all");
  const [viewPurchase, setViewPurchase] = useState<Purchase | null>(null);
  const [printPurchase, setPrintPurchase] = useState<Purchase | null>(null);

  const filtered = ALL_PURCHASES.filter(p => {
    const matchType   = typeFilter === "all" || p.type === typeFilter;
    const matchSearch = search === "" ||
      p.vendor.toLowerCase().includes(search.toLowerCase()) ||
      p.po.toLowerCase().includes(search.toLowerCase()) ||
      p.material.toLowerCase().includes(search.toLowerCase()) ||
      p.grn.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalSpend = ALL_PURCHASES.reduce((sum, p) => {
    const num = parseInt(p.totalPaid.replace(/[₹,]/g, ""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const warpCount   = ALL_PURCHASES.filter(p => p.type === "Warp").length;
  const reshamCount = ALL_PURCHASES.filter(p => p.type === "Resham").length;
  const jariCount   = ALL_PURCHASES.filter(p => p.type === "Jari").length;

  return (
    <div style={{ minHeight: "calc(100vh - 90px)", background: T.silkCream, fontFamily: F.ui }}>

      {/* ── HERO ── */}
      <section style={{ background: G.card, padding: "48px 56px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.022) 60px, rgba(200,155,71,0.022) 61px)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.012) 80px, rgba(200,155,71,0.012) 81px)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Back button */}
          <motion.button
            onClick={onBack}
            whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 16px", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: "rgba(255,253,249,0.80)", cursor: "pointer", marginBottom: 24 }}
          >
            <ChevronLeft size={15} /> Back to Materials
          </motion.button>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EASE }}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 20, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
            <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 9.5, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
              Since 1999 · Purchase Records
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(30px, 3.5vw, 48px)", color: T.warmCream, margin: "0 0 12px", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
            All Purchases{" "}
            <span style={{ fontStyle: "italic", color: T.antiqueGold }}>From All Vendors</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}
            style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.72)", margin: "0 0 20px", maxWidth: 520, lineHeight: 1.7 }}>
            Complete purchase history for all raw materials — Warp, Resham, and Jari — from every vendor since the system started.
          </motion.p>

          {/* Status pills */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: `${ALL_PURCHASES.length} Total Purchases`, color: T.antiqueGold, bg: "rgba(200,155,71,0.15)", border: "rgba(200,155,71,0.30)" },
              { label: `${warpCount} Warp Orders`,   color: T.warmCream, bg: "rgba(110,15,45,0.18)",  border: "rgba(110,15,45,0.35)" },
              { label: `${reshamCount} Resham Orders`, color: T.warmCream, bg: "rgba(122,94,28,0.18)", border: "rgba(200,155,71,0.28)" },
              { label: `${jariCount} Jari Orders`,   color: T.warmCream, bg: "rgba(59,35,20,0.22)",  border: "rgba(59,35,20,0.35)" },
            ].map(p => (
              <span key={p.label} style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: p.color, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 999, padding: "6px 16px" }}>
                {p.label}
              </span>
            ))}
          </motion.div>

          {/* Metrics strip */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
            style={{ display: "flex", gap: 0, marginTop: 36, borderTop: "1px solid rgba(245,232,208,0.08)" }}>
            {[
              { label: "Total Warp Purchased",   val: "2,840 kg",                   sub: "From 2 vendors",         Icon: Layers,      hi: false },
              { label: "Total Resham Purchased", val: "1,240 kg",                   sub: "All colors combined",    Icon: Tag,         hi: false },
              { label: "Total Jari Purchased",   val: "680 kg",                     sub: "All types and grades",   Icon: Sparkles,    hi: false },
              { label: "Total Amount Spent",     val: `₹${(totalSpend/100000).toFixed(1)}L`, sub: "All materials combined", Icon: IndianRupee, hi: true  },
              { label: "Active Vendors",         val: "6",                          sub: "Across 3 states",        Icon: Building2,   hi: false },
            ].map((m, i) => (
              <div key={m.label} style={{ flex: 1, padding: "18px 18px", borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.35)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.Icon size={18} color={m.hi ? T.antiqueGold : "rgba(245,232,208,0.70)"} />
                </div>
                <div>
                  <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 8.5, letterSpacing: "1.8px", textTransform: "uppercase", color: m.hi ? "rgba(200,155,71,0.85)" : "rgba(245,232,208,0.55)", marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 28, color: m.hi ? T.goldLight : T.warmCream, lineHeight: 1, ...NUM }}>{m.val}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 10.5, color: "rgba(245,232,208,0.55)", marginTop: 2 }}>{m.sub}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FILTER + SEARCH BAR ── */}
      <div style={{ background: T.warmIvory, borderBottom: `1px solid ${T.borderDef}`, padding: "0 56px", position: "sticky", top: 90, zIndex: 50, boxShadow: "0 4px 24px rgba(74,6,27,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, height: 60 }}>
          {([
            { key: "all",    label: "All Purchases",  count: ALL_PURCHASES.length },
            { key: "Warp",   label: "Warp",           count: warpCount },
            { key: "Resham", label: "Resham",         count: reshamCount },
            { key: "Jari",   label: "Jari",           count: jariCount },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setTypeFilter(f.key as "all" | MatType)}
              style={{ height: "100%", padding: "0 18px", border: "none", background: "rgba(0,0,0,0)", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, borderBottom: typeFilter === f.key ? `2px solid ${T.royalBurgundy}` : "2px solid transparent" }}>
              <span style={{ fontFamily: F.ui, fontWeight: typeFilter === f.key ? 600 : 400, fontSize: 13.5, color: typeFilter === f.key ? T.royalBurgundy : T.taupe, whiteSpace: "nowrap" }}>{f.label}</span>
              <span style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: typeFilter === f.key ? "rgba(110,15,45,0.08)" : "rgba(139,112,96,0.08)", color: typeFilter === f.key ? T.royalBurgundy : T.taupe }}>{f.count}</span>
            </button>
          ))}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "0 14px", height: 38 }}>
            <Search size={14} color={T.taupe} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vendor, PO number, material…"
              style={{ border: "none", background: "none", outline: "none", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, width: 240 }}
            />
          </div>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, whiteSpace: "nowrap" }}>{filtered.length} purchase{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* ── CARDS GRID ── */}
      <div style={{ padding: "40px 56px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px" }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(110,15,45,0.06)", border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <ShoppingBag size={28} color={T.taupe} />
            </div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: T.luxuryBrown, marginBottom: 8 }}>No purchases found</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Try adjusting your search or filter.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22 }}>
            {filtered.map((p, i) => (
              <PurchaseCard key={p.id} p={p} index={i} onView={setViewPurchase} onPrint={setPrintPurchase} />
            ))}
          </div>
        )}
      </div>

      <ViewPurchaseModal purchase={viewPurchase} onClose={() => setViewPurchase(null)} />
      <PrintPurchaseModal purchase={printPurchase} onClose={() => setPrintPurchase(null)} />
    </div>
  );
}
