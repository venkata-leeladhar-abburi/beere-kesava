import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  Package, Tag, Eye, Printer, Calendar, IndianRupee, Check, FileText, Hash,
} from "lucide-react";
import { Purchase, MAT_CFG, STATUS_CFG } from "./PurchaseModals";
import { Button } from "../../../shared/ui/primitives";

const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  borderDef:     "rgba(110,15,45,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const G = {
  card: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
};
const NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1, "lnum" 1' };

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

export function PurchaseCard({ p, onView, onPrint, index }: { p: Purchase; onView: (p: Purchase) => void; onPrint: (p: Purchase) => void; index: number }) {
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
        <div style={{ background: mc.bg, padding: "18px 20px 16px", borderBottom: `1px solid rgba(110,15,45,0.07)`, position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: mc.col }} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", flexShrink: 0 }}>
                <MatIcon size={20} color={mc.col} />
              </div>
              <div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.2 }}>{p.vendor}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{p.vendorCity}</div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: mc.col, letterSpacing: "1px", marginTop: 2 }}>{p.type} · {p.material}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600, marginTop: 2 }}>{p.firmName}</div>
              </div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 20, padding: "4px 10px", flexShrink: 0 }}>
              <Check size={11} /> {sc.label}
            </span>
          </div>
        </div>

        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", flex: 1, gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Hash size={11} color={T.royalBurgundy} />
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, letterSpacing: "0.3px" }}>{p.po}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Calendar size={11} color={T.taupe} />
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Quantity",    value: p.quantity,   Icon: Package,      color: T.luxuryBrown },
              { label: "Description", value: p.material,   Icon: Tag,          color: T.taupe },
            ].map(stat => (
              <div key={stat.label} style={{ background: T.silkCream, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.borderDef}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <stat.Icon size={11} color={T.taupe} />
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" }}>{stat.label}</span>
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: stat.color, ...NUM }}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: G.card, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(200,155,71,0.75)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>Total Paid</div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: T.goldLight, lineHeight: 1, ...NUM }}>{p.totalPaid}</div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(200,155,71,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IndianRupee size={18} color={T.antiqueGold} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={11} color={T.taupe} />
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "0.3px" }}>{p.grn}</span>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
            <Button
              variant="secondary"
              iconLeft={Eye}
              onClick={() => onView(p)}
              className="flex-1 rounded-[10px] bg-[rgba(110,15,45,0.06)] border-[rgba(110,15,45,0.18)]"
            >
              View
            </Button>
            <Button variant="primary" iconLeft={Printer} onClick={() => onPrint(p)} className="flex-1 rounded-[10px]">
              Print
            </Button>
          </div>
        </div>
      </motion.div>
    </FadeUp>
  );
}
