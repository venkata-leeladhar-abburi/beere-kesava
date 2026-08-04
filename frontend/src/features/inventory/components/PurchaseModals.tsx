import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package, Layers, Tag, Sparkles, Printer, Calendar, IndianRupee, X, Check, FileText,
} from "lucide-react";

const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  warmCream:     "#F5E8D0",
  green:         "#1E6640",
  borderDef:     "rgba(110,15,45,0.10)",
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
const NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1, "lnum" 1' };

export type MatType = "Warp" | "Resham" | "Jari";

export interface Purchase {
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

export const MAT_CFG: Record<MatType, { col: string; bg: string; Icon: React.ElementType }> = {
  Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.09)",   Icon: Layers   },
  Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.13)",  Icon: Tag      },
  Jari:   { col: T.luxuryBrown,   bg: "rgba(59,35,20,0.09)",    Icon: Sparkles },
};

export const STATUS_CFG = {
  complete: { label: "Entry Complete",  color: T.green,        bg: "rgba(30,102,64,0.10)",  border: "rgba(30,102,64,0.22)" },
  pending:  { label: "Pending / Partial", color: "#7A5E1C",   bg: "rgba(200,155,71,0.12)", border: "rgba(200,155,71,0.28)" },
  partial:  { label: "Partial Entry",   color: "#7A5E1C",     bg: "rgba(200,155,71,0.12)", border: "rgba(200,155,71,0.28)" },
};

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
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", marginBottom: subtitle ? 4 : 0 }}>{title}</div>
        {subtitle && <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.65)" }}>{subtitle}</div>}
      </div>
      <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
        <X size={18} color="#FFFDF9" />
      </motion.button>
    </div>
  );
}

export function ViewPurchaseModal({ purchase, onClose }: { purchase: Purchase | null; onClose: () => void }) {
  if (!purchase) return null;
  const mc = MAT_CFG[purchase.type];
  const sc = STATUS_CFG[purchase.status];
  const MatIcon = mc.Icon;

  return (
    <ModalOverlay open={!!purchase} onClose={onClose}>
      <ModalHeader title="Purchase Details" subtitle={`Full record for ${purchase.po}`} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "5px 12px", borderRadius: 8 }}>{purchase.po}</span>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, background: T.silkCream, padding: "5px 12px", borderRadius: 8, border: `1px solid ${T.borderDef}` }}>{purchase.grn}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 20, padding: "5px 12px" }}>
            <Check size={12} /> {sc.label}
          </span>
        </div>

        <div style={{ background: mc.bg, borderRadius: 14, padding: "16px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", flexShrink: 0 }}>
            <MatIcon size={22} color={mc.col} />
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.luxuryBrown, marginBottom: 3 }}>{purchase.vendor}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>{purchase.vendorCity}</div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: mc.col, background: "rgba(255,255,255,0.60)", padding: "2px 9px", borderRadius: 6, display: "inline-block", letterSpacing: "1px" }}>{purchase.type} · {purchase.material}</div>
          </div>
        </div>

        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600, marginBottom: 14 }}>{purchase.firmName}</div>

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
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase" }}>{row.label}</span>
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.3 }}>{row.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: G.card, borderRadius: 14, padding: "20px 22px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(200,155,71,0.80)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>Total Amount Paid</div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: T.goldLight, lineHeight: 1, ...NUM }}>{purchase.totalPaid}</div>
          </div>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IndianRupee size={24} color={T.antiqueGold} />
          </div>
        </div>

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

export function PrintPurchaseModal({ purchase, onClose }: { purchase: Purchase | null; onClose: () => void }) {
  if (!purchase) return null;
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const mc = MAT_CFG[purchase.type];
  const MatIcon = mc.Icon;

  return (
    <ModalOverlay open={!!purchase} onClose={onClose}>
      <ModalHeader title="Print GRN Receipt" subtitle={`Goods Received Note — ${purchase.grn}`} onClose={onClose} />
      <div style={{ padding: "26px 28px 28px" }}>
        <div style={{ background: "#FFFFFF", border: `1.5px solid rgba(110,15,45,0.15)`, borderRadius: 16, padding: "24px 26px", marginBottom: 22 }}>
          <div style={{ textAlign: "center", borderBottom: `1.5px solid rgba(110,15,45,0.10)`, paddingBottom: 18, marginBottom: 18 }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 2 }}>Beere Kesava & Brothers Silks</div>
            <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "2.5px", textTransform: "uppercase", color: T.taupe, marginBottom: 10 }}>Goods Received Note (GRN)</div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "3px 10px", borderRadius: 6 }}>{purchase.grn}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Printed: {today}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Supplier / Vendor", value: purchase.vendor },
              { label: "Purchase Order No.", value: purchase.po },
              { label: "Date of Receipt", value: purchase.date },
              { label: "Material Type", value: purchase.type },
            ].map(row => (
              <div key={row.label}>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 3 }}>{row.label}</div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{row.value}</div>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid rgba(110,15,45,0.10)`, marginBottom: 16 }}>
            <div style={{ background: T.silkCream, padding: "10px 16px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
              {["Description", "Qty", "Total"].map(h => (
                <span key={h} style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.taupe, letterSpacing: "1.5px", textTransform: "uppercase" }}>{h}</span>
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
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

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
