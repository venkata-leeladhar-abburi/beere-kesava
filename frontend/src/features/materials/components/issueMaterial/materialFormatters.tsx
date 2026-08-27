import React from "react";
import { Package, Layers, Sparkles } from "lucide-react";
import { IssuedMaterialItem } from "../../contexts/MaterialIssueContext";
import { F, T } from "./theme";
import { EntityCode } from "@/shared/ui/domain";

// ── Materials summary formatter (shared by history table + modal) ────────────
export function summarizeMaterials(items: IssuedMaterialItem[]): string {
  return items.map(m => {
    if (m.materialType === "Warp") return `Warp (${m.warpSubtype ?? "—"}) ${m.quantity}${m.unit}`;
    if (m.materialType === "Resham") return `Resham${m.jariColor ? ` ${m.jariColor}` : ""} ${m.quantity}${m.unit}`;
    return `Jari ${m.jariType ?? ""} ${m.jariGrade ?? ""} ${m.jariColor ?? ""} ${m.quantity} ${m.unit}`.replace(/\s+/g, " ").trim();
  }).join(" · ");
}

/** Human-readable detail line for one issued material (subtype, colour, grade, or the GRN line's own description). */
export function describeMaterial(m: IssuedMaterialItem): string {
  if (m.materialType === "Warp") {
    const parts = [m.warpSubtype, m.description].filter(Boolean);
    return parts.join(" · ");
  }
  if (m.materialType === "Resham") {
    return m.description || m.jariColor || "";
  }
  return `${m.jariType || ""} ${m.jariGrade || ""} ${m.jariColor || ""}`.replace(/\s+/g, " ").trim();
}

/**
 * One stacked block per issued material: type badge, description, quantity,
 * and the exact GRN line code it came from — the same id printed on that
 * batch's label and shown in Goods Receipt History, so a material can be
 * traced back to its delivery from here without opening the record.
 */
export function renderIssuedMaterials(items: IssuedMaterialItem[]) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 230 }}>
      {items.map((m, idx) => {
        const desc = describeMaterial(m);
        return (
          <div
            // grnBatchId repeats when several materials come from one receipt,
            // so index is folded in to keep the key stable per rendered line.
            // eslint-disable-next-line react/no-array-index-key -- issued lines have no stable client-side id; order is fixed per record
            key={`${m.grnItemCode ?? m.grnBatchId}-${idx}`}
            style={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                color: m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : T.royalBurgundy,
                background: m.materialType === "Warp" ? "rgba(196,146,58,0.14)" : m.materialType === "Resham" ? "rgba(200,155,71,0.13)" : "rgba(110,15,45,0.08)",
                padding: "2px 6px", borderRadius: 4
              }}>{m.materialType}</span>
              {desc && <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{desc}</span>}
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{m.quantity} {m.unit}</span>
            </div>
            {(m.grnBatchId || m.grnItemCode) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start", marginTop: 2 }}>
                {m.grnBatchId && <EntityCode type="goodsReceipt" value={m.grnBatchId} size="sm" />}
                {m.grnItemCode && m.grnItemCode !== m.grnBatchId && (
                  <span style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.antiqueGold, background: "rgba(200,155,71,0.12)", border: `1px solid ${T.borderGold}`, borderRadius: 4, padding: "1px 6px" }}>
                    Sub-GRN {m.grnItemCode.slice(m.grnBatchId ? m.grnBatchId.length : 0) || m.grnItemCode}
                  </span>
                )}
              </div>
            )}
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
