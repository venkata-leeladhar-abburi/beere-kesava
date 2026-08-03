import React from "react";
import { Trash2 } from "lucide-react";
import { T, F, ExtItem } from "./POTypesAndVendors";

interface POMaterialRowProps {
  item: ExtItem;
  onChange: (updated: ExtItem) => void;
  onRemove: () => void;
  canRemove: boolean;
  errors: Record<string, string>;
}

export function POMaterialRow({
  item,
  onChange,
  onRemove,
  canRemove,
  errors,
}: POMaterialRowProps) {
  const inputStyle: React.CSSProperties = {
    fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown,
    border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 8,
    padding: "8px 10px", outline: "none", background: T.warmIvory,
    width: "100%", boxSizing: "border-box" as const,
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  const set = (k: keyof ExtItem, v: unknown) => {
    const updated = { ...item, [k]: v } as ExtItem;
    // Reset unit when type changes
    if (k === "materialType") {
      updated.unit = v === "Jari" ? "Buns" : "kg";
    }
    onChange(updated);
  };

  return (
    <div style={{
      background: T.warmIvory,
      border: `1.5px solid ${T.borderDef}`,
      borderRadius: 12,
      padding: "16px 18px",
      position: "relative",
    }}>
      {canRemove && (
        <button
          onClick={onRemove}
          style={{
            position: "absolute", top: 10, right: 12,
            background: "none", border: "none", cursor: "pointer",
            color: T.taupe, display: "flex", alignItems: "center",
          }}
        >
          <Trash2 size={15} color={T.crimson} />
        </button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 10, alignItems: "start" }}>
        {/* Material Type */}
        <div>
          <label style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 600, marginBottom: 5, display: "block", letterSpacing: "0.3px" }}>Type *</label>
          <select value={item.materialType} onChange={e => set("materialType", e.target.value)} style={selectStyle}>
            <option value="Warp">Warp</option>
            <option value="Resham">Resham</option>
            <option value="Jari">Jari</option>
          </select>
          {errors[`mat-${item._key}-type`] && <div style={{ color: T.crimson, fontSize: 11, marginTop: 3 }}>{errors[`mat-${item._key}-type`]}</div>}
        </div>

        {/* Description */}
        <div>
          <label style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 600, marginBottom: 5, display: "block", letterSpacing: "0.3px" }}>Description</label>
          <textarea
            value={item.description ?? ""}
            onChange={e => set("description", e.target.value)}
            placeholder="Color, grade, subtype, quality notes..."
            rows={2}
            style={{ ...inputStyle, resize: "none" as const }}
          />
        </div>

        {/* Quantity */}
        <div>
          <label style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 600, marginBottom: 5, display: "block", letterSpacing: "0.3px" }}>
            Quantity * {item.materialType !== "Jari" ? "(kg + g)" : ""}
          </label>
          {item.materialType === "Jari" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", gap: 5, marginBottom: 2 }}>
                {["Buns", "Reels"].map(u => (
                  <button key={u} onClick={() => set("unit", u)} style={{
                    flex: 1, padding: "7px 4px", borderRadius: 7, cursor: "pointer",
                    fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                    background: item.unit === u ? T.royalBurgundy : T.warmIvory,
                    color: item.unit === u ? "#FFFDF9" : T.taupe,
                    border: item.unit === u ? "none" : `1.5px solid rgba(110,15,45,0.18)`,
                  }}>{u}</button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="number" min={0}
                  value={item.quantity || ""}
                  onChange={e => set("quantity", parseFloat(e.target.value) || 0)}
                  style={{ ...inputStyle, paddingRight: 44 }} placeholder="0"
                />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy }}>{item.unit}</span>
              </div>
              {item.quantity > 0 && (
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.antiqueGold }}>
                  = {item.unit === "Reels" ? `${Math.round(item.quantity / 4)} Buns` : `${Math.round(item.quantity * 4)} Reels`}
                  <span style={{ color: T.taupe }}> (1 Bun = 4 Reels)</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", gap: 5, marginBottom: 2 }}>
                {["kg", "g"].map(u => (
                  <button key={u} onClick={() => set("unit", u)} style={{
                    flex: 1, padding: "7px 4px", borderRadius: 7, cursor: "pointer",
                    fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                    background: item.unit === u ? T.royalBurgundy : T.warmIvory,
                    color: item.unit === u ? "#FFFDF9" : T.taupe,
                    border: item.unit === u ? "none" : `1.5px solid rgba(110,15,45,0.18)`,
                  }}>{u}</button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="number" min={0}
                  value={item.quantity || ""}
                  onChange={e => set("quantity", parseFloat(e.target.value) || 0)}
                  style={{ ...inputStyle, paddingRight: 32 }} placeholder="0"
                />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.royalBurgundy }}>{item.unit}</span>
              </div>
              {item.quantity > 0 && (
                <div style={{ fontFamily: F.ui, fontSize: 11, color: T.antiqueGold, fontWeight: 600 }}>
                  = {item.unit === "kg" ? `${(item.quantity * 1000).toFixed(0)} g` : `${(item.quantity / 1000).toFixed(3)} kg`}
                </div>
              )}
            </div>
          )}
          {errors[`mat-${item._key}-qty`] && <div style={{ color: T.crimson, fontSize: 11, marginTop: 3 }}>{errors[`mat-${item._key}-qty`]}</div>}
        </div>
      </div>
    </div>
  );
}
