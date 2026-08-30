import React from "react";
import { ReturnedMaterialItem } from "../../contexts/MaterialReturnContext";
import { F, T } from "../issueMaterial/theme";

// ── Materials summary formatter (shared by history table + modal) ────────────
// Mirrors issueMaterial/materialFormatters.tsx's summarizeMaterials/
// renderIssuedMaterials, minus the grnBatchId field returns don't carry.
export function summarizeMaterials(items: ReturnedMaterialItem[]): string {
  return items.map(m => `${m.materialType}${m.description ? ` (${m.description})` : ""} ${m.quantity}${m.unit}`).join(" · ");
}

export function renderReturnedMaterials(items: ReturnedMaterialItem[]) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map((m, idx) => {
        const desc = m.description || "";

        return (
          // ReturnedMaterialItem carries no unique id/sku — fall back to a composite of its
          // distinguishing fields plus index, since two entries can otherwise be identical.
          // eslint-disable-next-line react/no-array-index-key
          <div key={`${m.materialType}-${desc}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: F.ui, fontSize: 12, fontWeight: 700,
              color: m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : T.royalBurgundy,
              background: m.materialType === "Warp" ? "rgba(196,146,58,0.14)" : m.materialType === "Resham" ? "rgba(200,155,71,0.13)" : "rgba(110,15,45,0.08)",
              padding: "2px 6px", borderRadius: 4
            }}>{m.materialType}</span>
            {desc && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{desc}</span>}
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{m.quantity} {m.unit}</span>
          </div>
        );
      })}
    </div>
  );
}

const JARI_REEL_GRAMS = 230;

/** Format an outstanding-material line's grams into a human quantity for its material type. */
export function formatOutstandingGrams(materialType: "Warp" | "Resham" | "Jari", grams: number): string {
  if (materialType === "Jari") {
    const reels = grams / JARI_REEL_GRAMS;
    return `${reels % 1 === 0 ? reels : reels.toFixed(1)} Reels`;
  }
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2)} kg`;
  return `${grams.toFixed(0)} g`;
}
