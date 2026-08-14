import React from "react";
import { Package, Layers, Sparkles } from "lucide-react";
import { IssuedMaterialItem } from "../../contexts/MaterialIssueContext";
import { F, T } from "./theme";

// ── Materials summary formatter (shared by history table + modal) ────────────
export function summarizeMaterials(items: IssuedMaterialItem[]): string {
  return items.map(m => {
    if (m.materialType === "Warp") return `Warp (${m.warpSubtype ?? "—"}) ${m.quantity}${m.unit}`;
    if (m.materialType === "Resham") return `Resham${m.jariColor ? ` ${m.jariColor}` : ""} ${m.quantity}${m.unit}`;
    return `Jari ${m.jariType ?? ""} ${m.jariGrade ?? ""} ${m.jariColor ?? ""} ${m.quantity} ${m.unit}`.replace(/\s+/g, " ").trim();
  }).join(" · ");
}

export function renderIssuedMaterials(items: IssuedMaterialItem[]) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map((m) => {
        let desc = "";
        if (m.materialType === "Warp") {
          desc = m.warpSubtype || "";
          if (m.description) desc += desc ? ` (${m.description})` : m.description;
        } else if (m.materialType === "Resham") {
          desc = m.description || m.jariColor || "";
        } else if (m.materialType === "Jari") {
          desc = `${m.jariType || ""} ${m.jariGrade || ""} ${m.jariColor || ""}`.replace(/\s+/g, " ").trim();
        }

        return (
          // grnBatchId can repeat across issued lines (multiple material types drawn from the
          // same GRN batch), so it's combined with the other per-line fields for a stable key.
          <div key={`${m.grnBatchId}-${m.materialType}-${desc}-${m.quantity}-${m.unit}`} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: F.mono, fontSize: 12, fontWeight: 700,
              color: m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : T.royalBurgundy,
              background: m.materialType === "Warp" ? "rgba(196,146,58,0.14)" : m.materialType === "Resham" ? "rgba(200,155,71,0.13)" : "rgba(110,15,45,0.08)",
              padding: "2px 6px", borderRadius: 4
            }}>{m.materialType}</span>
            {desc && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{desc}</span>}
            <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{m.quantity} {m.unit}</span>
          </div>
        );
      })}
    </div>
  );
}

export function materialIcon(type: string) {
  if (type === "Warp") return <Package size={14} color={T.royalBurgundy} />;
  if (type === "Resham") return <Layers size={14} color={T.royalBurgundy} />;
  return <Sparkles size={14} color={T.antiqueGold} />;
}
