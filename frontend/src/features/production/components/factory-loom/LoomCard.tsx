import { motion } from "motion/react";
import { FileText, Factory } from "lucide-react";
import { FactoryLoom, loomLabel } from "../../data/factoryLooms";
import { T, F } from "./theme";
import { LoomBatch, LoomSaree, LOOM_STATUS_TO_CONDITION } from "./types";
import { Button } from "../../../../shared/ui/primitives";
import { StatusPill } from "../../../../shared/ui/domain";

// ── Loom Card ─────────────────────────────────────────────────────────────────
export function LoomCard({ loom, batches, sarees, onView }: { loom: FactoryLoom; batches: LoomBatch[]; sarees: LoomSaree[]; onView: () => void }) {
  const ab = batches.filter(b => b.loomId === loom.id && b.status === "active").length;
  const done = sarees.filter(s => s.loomId === loom.id && s.status === "complete").length;
  const tb = batches.filter(b => b.loomId === loom.id).length;
  const tc = T.royalBurgundy;
  return (
    <motion.div whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(200,155,71,0.2)" }} transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{
        background: "#FFFDF9",
        borderRadius: 12,
        border: `1.5px solid ${T.antiqueGold}`,
        boxShadow: "0 4px 20px rgba(200,155,71,0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        color: T.luxuryBrown,
      }}>
      {/* Accent top */}
      <div style={{ height: 4, background: tc, width: "100%", flexShrink: 0 }} />
      
      {/* Header */}
      <div style={{ padding: "20px 22px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: tc, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `3px solid ${T.antiqueGold}` }}>
            <Factory size={26} color="#FFF" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 700, lineHeight: 1.2 }}>{loomLabel(loom)}</div>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: tc, letterSpacing: "0.4px" }}>Operator: {loom.operatorName || "Unassigned"}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "8px 22px 18px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 3 }}>Location</div>
            <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{loom.location || "—"}</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 3 }}>Installed</div>
            <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{loom.installedYear || "—"}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {[{ v: ab, l: "Active Batches", c: T.royalBurgundy, bg: "rgba(110,15,45,0.06)" }, { v: done, l: "Sarees Done", c: T.green, bg: "rgba(30,102,64,0.07)" }, { v: tb, l: "Total Batches", c: T.antiqueGold, bg: "rgba(200,155,71,0.08)" }].map(s => (
            <div key={s.l} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: "8px 12px", textAlign: "center" as const }}>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: s.c }}>{s.v}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>{s.l}</div>
            </div>
          ))}
        </div>
        
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <StatusPill taxonomy="condition" status={LOOM_STATUS_TO_CONDITION[loom.status]} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "18px 22px 22px", display: "flex", gap: 12 }}>
        <Button onClick={onView} variant="secondary" className="flex-1 rounded-xl shadow-none border-[#E8DCC4] hover:bg-[#F7F2EA] hover:border-[#D4C3A3] text-[#4A2B1D]">
          <FileText size={20} className="mr-2" />
          View Details
        </Button>
      </div>
    </motion.div>
  );
}
