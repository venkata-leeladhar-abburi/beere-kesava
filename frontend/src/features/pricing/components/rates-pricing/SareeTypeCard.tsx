import { motion } from "motion/react";
import { X } from "lucide-react";
import { T, F } from "./theme";
import { jariFromReels, jariGrams, trimNum } from "./jariUtils";
import type { SareeTypeRecord } from "./sareeTypeData";

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
                {
                  label: "Jari", value: sareeType.jariWeight, unit: " reels",
                  sub: `${trimNum(jariFromReels(parseFloat(sareeType.jariWeight) || 0, "buns"))} buns · ${trimNum(jariGrams(parseFloat(sareeType.jariWeight) || 0), 0)}g`,
                },
              ].map(({ label, value, unit, sub }: { label: string; value: string; unit: string; sub?: string }) => (
                <div key={label} style={{ background: "rgba(110,15,45,0.04)", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.08em", color: T.taupe, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{value || "—"}{value ? unit : ""}</div>
                  {sub && value && <div style={{ fontFamily: F.mono, fontSize: 9.5, color: T.taupe, marginTop: 3 }}>{sub}</div>}
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
