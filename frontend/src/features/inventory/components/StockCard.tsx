import React from "react";
import { motion } from "motion/react";
import { Printer as LucidePrinter } from "lucide-react";
import {
  CheckCircle2 as CheckCircle, Scale as Scales, Calendar as CalendarBlank, Palette, Tag, ShoppingBag, Layers as Stack,
} from "lucide-react";
import { Button, IconButton } from "../../../shared/ui/primitives";

const T = {
  royalBurgundy: "#6E0F2D",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  green:         "#1E6640",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

export type StockStatus = "available" | "sold" | "wholesale";
export type StockSource = "factory" | "outsourced" | "external";

export interface StockSaree {
  id: string; source: StockSource;
  weaver: string | null; weaverCode: string | null;
  loom: number; weight: string; qcDate: string;
  design: string; sareeType: string; status: StockStatus;
  saleRef: string | null; customer: string | null;
  assignedBy: string | null; assignedAt: string | null;
  initials?: string; avatarBg?: string;
  supplier?: string | null;
  supplierLocation?: string | null;
  purchaseId?: string | null;
  invoiceNumber?: string | null;
}

export const STATUS_CFG: Record<StockStatus, { label: string; color: string; bg: string; border: string; topAccent: string }> = {
  available: { label: "In Stock — Available",    color: T.green,       bg: "rgba(30,102,64,0.09)",  border: "rgba(30,102,64,0.22)", topAccent: T.green       },
  sold:      { label: "Sold — Assign Finishing", color: "#8B6018",     bg: "rgba(200,155,71,0.12)", border: "rgba(200,155,71,0.30)", topAccent: T.antiqueGold },
  wholesale: { label: "Wholesale Batch",         color: T.royalBurgundy, bg: "rgba(110,15,45,0.08)", border: "rgba(110,15,45,0.22)", topAccent: T.royalBurgundy },
};

export function StockCard({ s, onView }: { s: StockSaree; onView: (s: StockSaree) => void }) {
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
      <div style={{ height: 4, background: cfg.topAccent }} />

      <div style={{ padding: "20px 20px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: s.avatarBg || T.taupe, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(0,0,0,0.18)" }}>
            <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: "#FFFDF9" }}>{s.initials}</span>
          </div>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy, marginBottom: 3 }}>{s.id}</div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
              {s.source === "factory"  ? `🏭 Factory · Loom ${s.loom}`
             : s.source === "external" ? `🚚 ${s.supplier} · ${s.invoiceNumber}`
             :                           `🪡 ${s.weaver} · ${s.weaverCode}`}
            </div>
          </div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 99, padding: "5px 12px", flexShrink: 0 }}>
          {s.status === "available"
            ? <CheckCircle size={13} color={cfg.color} />
            : s.status === "sold"
            ? <ShoppingBag size={13} color={cfg.color} />
            : <Stack size={13} color={cfg.color} />
          }
          <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(110,15,45,0.07)", margin: "0 20px" }} />

      <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
        {[
          { label: "Weight",   val: s.weight,   icon: <Scales size={13} color={T.taupe} /> },
          { label: s.source === "external" ? "Received" : "QC Date", val: s.qcDate, icon: <CalendarBlank size={13} color={T.taupe} /> },
          { label: "Design",   val: s.design,   icon: <Palette size={13} color={T.taupe} />, mono: true },
          { label: "Type",     val: s.sareeType, icon: <Tag size={13} color={T.taupe} /> },
        ].map(r => (
          <div key={r.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
              {r.icon}
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px" }}>{r.label}</span>
            </div>
            <div style={{ fontFamily: r.mono ? F.mono : F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{r.val}</div>
          </div>
        ))}
      </div>

      {(s.status === "sold" || s.status === "wholesale") && s.customer && (
        <div style={{ margin: "0 20px 14px", background: "rgba(200,155,71,0.07)", border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.7px" }}>
            {s.status === "sold" ? "Sold To" : "Wholesale Order"}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{s.customer}</div>
          {s.saleRef && <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, marginTop: 2 }}>{s.saleRef}</div>}
          {s.assignedAt && <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>Assigned: {s.assignedAt}</div>}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, padding: "0 20px 20px" }}>
        <Button
          variant="primary"
          onClick={() => onView(s)}
          className="flex-1 rounded-[11px] shadow-[0_3px_10px_rgba(110,15,45,0.20)]"
        >
          View Details
        </Button>
        <IconButton
          icon={LucidePrinter}
          label="Print"
          variant="secondary"
          className="rounded-[11px] w-[42px]"
        />
      </div>
    </motion.div>
  );
}
