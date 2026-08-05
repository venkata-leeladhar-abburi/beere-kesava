import React from "react";
import { motion } from "motion/react";
import { Check, X, Package, TrendingUp } from "lucide-react";
import { T, F } from "./tokens";
import { WARP_DATA } from "./data";
import { GreenBtn, CrimsonBtn, InfoStrip } from "./SharedUI";

// ─── Warp Card ────────────────────────────────────────────────────────────────
export function WarpCard({ item, onAction }: { item: typeof WARP_DATA[0]; onAction: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      style={{
        background: "#FFF", borderRadius: 16,
        border: "1px solid " + T.borderDef,
        borderLeft: "4px solid " + T.green,
        boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
        padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      {/* Top row: avatar + name + batch */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid " + T.borderGold }}>
            {item.photo ? (
              <img src={item.photo} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{
                width: "100%", height: "100%", background: T.cream,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.royalBurgundy,
              }}>
                {item.name.split(" ").map(n => n[0]).join("")}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
              {item.name}
            </div>
            <span style={{
              fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy,
              background: "rgba(110,15,45,0.07)", borderRadius: 5, padding: "2px 7px",
            }}>
              {item.code}
            </span>
          </div>
        </div>
        <span style={{
          fontFamily: F.mono, fontSize: 12, color: T.taupe,
          background: T.cream, borderRadius: 6, padding: "4px 10px",
        }}>
          {item.batch}
        </span>
      </div>

      {/* Raised chip */}
      <span style={{
        fontFamily: F.mono, fontSize: 12, color: T.taupe,
        background: T.cream, borderRadius: 6, padding: "4px 10px", alignSelf: "flex-start",
      }}>
        Request raised: {item.raised}
      </span>

      {/* Qualifies strip */}
      <div style={{
        background: T.greenBg, borderRadius: 8, padding: "7px 12px",
        fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: T.green,
      }}>
        ✓ Qualifies — {item.pct}%+ of batch completed
      </div>

      {/* Material */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={15} color={T.taupe} />
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Material Requested:</span>
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{item.material}</span>
        </div>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", paddingLeft: 24 }}>
          {item.reason}
        </span>
      </div>

      {/* Batch progress */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Batch progress</span>
          <span style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>
            {item.done} of {item.total} sarees done
          </span>
        </div>
        <div style={{ height: 8, background: "rgba(200,155,71,0.15)", borderRadius: 4, position: "relative" }}>
          <div style={{
            background: T.antiqueGold, borderRadius: 4, height: "100%",
            width: item.pct + "%",
          }} />
        </div>
        <div style={{ textAlign: "right", fontFamily: F.mono, fontSize: 12, color: T.green }}>
          {item.pct}%
        </div>
      </div>

      {/* Stock strip */}
      <InfoStrip>{item.stock}</InfoStrip>

      {/* Design */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <TrendingUp size={14} color={T.taupe} />
        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{item.design}</span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <GreenBtn className="flex-1" onClick={() => onAction(item.id)}>
          <Check size={14} /> Approve Warp Request
        </GreenBtn>
        <CrimsonBtn className="flex-1" onClick={() => onAction(item.id)}>
          <X size={14} /> Reject
        </CrimsonBtn>
      </div>
    </motion.div>
  );
}
