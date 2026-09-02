import { ReturnedMaterialItem } from "../../contexts/MaterialReturnContext";
import { F, T } from "../issueMaterial/theme";

const JARI_REEL_GRAMS = 230;

/** Jari is always shown in Reels — a manually-recorded return can only ever
 *  carry a REEL/BUN unit (server-enforced), but an auto-recorded return
 *  (material drawn down by weight when a saree is received) stores it in
 *  grams, so this normalizes either shape to the one unit Jari is shown in
 *  everywhere else. Warp/Resham are already weight units — passed through. */
export function displayQuantity(m: ReturnedMaterialItem): { quantity: number | string; unit: string } {
  if (m.materialType !== "Jari") return { quantity: m.quantity, unit: m.unit };
  const unit = (m.unit || "").trim().toUpperCase();
  if (unit.startsWith("REEL")) return { quantity: m.quantity, unit: "Reels" };
  if (unit.startsWith("BUN")) return { quantity: (m.quantity / 4).toFixed(2).replace(/\.?0+$/, ""), unit: "Reels" };
  // Grams (or any other weight unit) — convert via the same 230g/reel
  // constant used everywhere else (see weight-units.util.ts on the backend).
  const grams = unit === "KG" ? m.quantity * 1000 : m.quantity;
  const reels = grams / JARI_REEL_GRAMS;
  return { quantity: reels % 1 === 0 ? reels : reels.toFixed(1), unit: "Reels" };
}

// ── Materials summary formatter (shared by history table + modal) ────────────
// Mirrors issueMaterial/materialFormatters.tsx's summarizeMaterials/
// renderIssuedMaterials, minus the grnBatchId field returns don't carry.
export function summarizeMaterials(items: ReturnedMaterialItem[]): string {
  return items.map(m => {
    const { quantity, unit } = displayQuantity(m);
    return `${m.materialType}${m.description ? ` (${m.description})` : ""} ${quantity}${unit}`;
  }).join(" · ");
}

export function renderReturnedMaterials(items: ReturnedMaterialItem[]) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map((m, idx) => {
        const desc = m.description || "";
        const { quantity, unit } = displayQuantity(m);

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
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{quantity} {unit}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Format an outstanding-material line's grams into a human quantity for its material type. */
export function formatOutstandingGrams(materialType: "Warp" | "Resham" | "Jari", grams: number): string {
  if (materialType === "Jari") {
    const reels = grams / JARI_REEL_GRAMS;
    return `${reels % 1 === 0 ? reels : reels.toFixed(1)} Reels`;
  }
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2)} kg`;
  return `${grams.toFixed(0)} g`;
}
