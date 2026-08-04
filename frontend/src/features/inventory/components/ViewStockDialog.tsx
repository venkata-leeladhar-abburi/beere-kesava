import React from "react";
import { motion } from "motion/react";
import { CheckCircle } from "@phosphor-icons/react";
import { StockSaree, STATUS_CFG } from "./StockCard";

const T = {
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#69635E",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const G = {
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
};

export function ViewStockDialog({ saree, onClose }: { saree: StockSaree; onClose: () => void }) {
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
        <div style={{ background: `linear-gradient(100deg, ${T.deepWine}, ${T.royalBurgundy})`, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.55)", letterSpacing: "1px", marginBottom: 4 }}>SAREE DETAILS</div>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9" }}>{saree.id}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 11, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cfg.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={20} color={cfg.color} weight="fill" />
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
              {saree.assignedAt && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>Since: {saree.assignedAt}</div>}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Saree ID",   val: saree.id,       mono: true  },
              { label: "Design",     val: saree.design,   mono: true  },
              { label: "Saree Type", val: saree.sareeType, mono: false },
              { label: "Weight",     val: saree.weight,   mono: true  },
              { label: "QC Date",    val: saree.qcDate,   mono: false },
              saree.source === "external"
                ? { label: "Invoice No.", val: saree.invoiceNumber || "—", mono: true }
                : { label: "Loom No.",    val: `Loom ${saree.loom}`,       mono: true },
            ].map(r => (
              <div key={r.label} style={{ background: T.warmCream, borderRadius: 10, padding: "11px 14px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>{r.label}</div>
                <div style={{ fontFamily: r.mono ? F.mono : F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(110,15,45,0.05)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Source</div>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
              {saree.source === "factory"  ? `Own Factory · Loom ${saree.loom}`
             : saree.source === "external" ? `External Purchase · ${saree.supplier} (${saree.supplierLocation}) · ${saree.purchaseId}`
             :                               `${saree.weaver} (${saree.weaverCode}) · Loom ${saree.loom}`}
            </div>
          </div>
          {saree.customer && (
            <div style={{ background: "rgba(200,155,71,0.08)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
                {saree.status === "sold" ? "Sold To" : "Assigned Wholesale Order"}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{saree.customer}</div>
              {saree.saleRef && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, marginTop: 3 }}>{saree.saleRef}</div>}
            </div>
          )}
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
