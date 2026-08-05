import React from "react";
import { motion } from "motion/react";
import { FileText, Factory } from "lucide-react";
import { FactoryLoom } from "../../data/factoryLooms";
import { T, F } from "./theme";
import { STATUS_CFG, LoomBatch, LoomSaree } from "./types";

// ── Loom Card ─────────────────────────────────────────────────────────────────
export function LoomCard({ loom, batches, sarees, onView }: { loom: FactoryLoom; batches: LoomBatch[]; sarees: LoomSaree[]; onView: () => void }) {
  const sc = STATUS_CFG[loom.status];
  const ab = batches.filter(b => b.loomId === loom.id && b.status === "active").length;
  const done = sarees.filter(s => s.loomId === loom.id && s.status === "complete").length;
  const tb = batches.filter(b => b.loomId === loom.id).length;
  const tc = T.royalBurgundy;
  return (
    <motion.div whileHover={{ y: -4, boxShadow: "0 20px 56px rgba(74,6,27,0.14)" }} transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 3px 16px rgba(74,6,27,0.07)", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 6, background: tc }} />
      <div style={{ padding: "20px 22px", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: tc, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Factory size={22} color="#FFF" /></div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.luxuryBrown }}>{loom.loomNumber}</div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 2 }}>{loom.id}</div>
            </div>
          </div>
          <span style={{ background: sc.bg, color: sc.color, borderRadius: 999, padding: "4px 10px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>{sc.icon}{sc.label}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[{ l: "Location", v: loom.location }, { l: "Operator", v: loom.operatorName }, { l: "Installed", v: loom.installedYear || "—" }].map(f => (
            <div key={f.l} style={{ background: T.silkCream, borderRadius: 10, padding: "9px 11px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 3 }}>{f.l}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{f.v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ v: ab, l: "Active Batches", c: T.royalBurgundy, bg: "rgba(110,15,45,0.06)" }, { v: done, l: "Sarees Done", c: T.green, bg: "rgba(30,102,64,0.07)" }, { v: tb, l: "Total Batches", c: T.antiqueGold, bg: "rgba(200,155,71,0.08)" }].map(s => (
            <div key={s.l} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: "8px 12px", textAlign: "center" as const }}>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: s.c }}>{s.v}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 22px 20px" }}>
        <motion.button onClick={onView} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{ width: "100%", height: 42, borderRadius: 12, border: `1.5px solid ${T.royalBurgundy}`, background: "transparent", color: T.royalBurgundy, fontFamily: F.ui, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <FileText size={15} /> View Details
        </motion.button>
      </div>
    </motion.div>
  );
}
