import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { F, GrnBatch, MaterialRowState, T } from "./theme";
import { PillTab } from "./primitives";
import { GrnBatchSelector } from "./GrnBatchSelector";

// ── One material row editor ──────────────────────────────────────────────────
export function MaterialRowEditor({ row, grnBatches, onChange, onRemove, showRemove }: {
  row: MaterialRowState; grnBatches: GrnBatch[]; onChange: (r: MaterialRowState) => void; onRemove: () => void; showRemove: boolean;
}) {
  const patch = (p: Partial<MaterialRowState>) => onChange({ ...row, ...p });
  const selectedGrn = grnBatches.find(g => g.grnBatchId === row.grnBatchId);
  const qtyNum = parseFloat(row.quantity) || 0;
  const overAvailable = selectedGrn && qtyNum > selectedGrn.availableQty;
  const reelsToBuns = row.jariUnit === "Reels" ? (qtyNum / 4) : (qtyNum * 4);

  return (
    <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 16, padding: 20, marginBottom: 16, position: "relative" as const }}>
      {showRemove && (
        <button onClick={onRemove} title="Remove" style={{ position: "absolute" as const, top: 14, right: 14, background: "rgba(192,57,43,0.08)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Trash2 size={14} color={T.crimson} />
        </button>
      )}

      {/* Material Type */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 8 }}>Material Type</label>
        <PillTab options={["Warp", "Resham", "Jari"]} value={row.materialType} onChange={v => patch({ materialType: v as any, grnBatchId: "", description: "", quantity: "" })} />
      </div>

      {/* Description + Quantity */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 16 }}>
        <div>
          <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>
            Description
          </label>
          <input
            value={row.description}
            onChange={e => patch({ description: e.target.value })}
            placeholder={
              row.materialType === "Warp"   ? "e.g. Cotton/Silk blend warp" :
              row.materialType === "Resham" ? "e.g. Red Resham" :
                                             "e.g. Polyester Gold Jari"
            }
            style={{ width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 14px", fontFamily: F.ui, fontSize: 13, outline: "none", boxSizing: "border-box" as const }}
          />
        </div>
        <div>
          <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>
            Quantity {row.materialType === "Jari" ? "(Reels / Buns)" : `(${row.warpReshamUnit || "kg"})`}
          </label>
          {row.materialType === "Jari" ? (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                {["Reels", "Buns"].map(u => (
                  <button key={u} onClick={() => patch({ jariUnit: u as any })} style={{
                    flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${row.jariUnit === u ? T.royalBurgundy : T.borderDef}`,
                    background: row.jariUnit === u ? T.royalBurgundy : "#FFF",
                    color: row.jariUnit === u ? "#FFF" : T.luxuryBrown,
                  }}>{u}</button>
                ))}
              </div>
              <div style={{ position: "relative" as const }}>
                <input
                  type="number"
                  value={row.quantity}
                  onChange={e => patch({ quantity: e.target.value })}
                  placeholder="0"
                  style={{ width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 52px 0 14px", fontFamily: F.mono, fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
                />
                <span style={{ position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{row.jariUnit}</span>
              </div>
              {row.quantity && (
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, marginTop: 4 }}>
                  = {reelsToBuns.toFixed(reelsToBuns % 1 === 0 ? 0 : 1)} {row.jariUnit === "Reels" ? "Buns" : "Reels"} <span style={{ color: T.taupe }}>(1 Bun = 4 Reels)</span>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                {["kg", "g"].map(u => (
                  <button key={u} onClick={() => patch({ warpReshamUnit: u as any })} style={{
                    flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${(row.warpReshamUnit || "kg") === u ? T.royalBurgundy : T.borderDef}`,
                    background: (row.warpReshamUnit || "kg") === u ? T.royalBurgundy : "#FFF",
                    color: (row.warpReshamUnit || "kg") === u ? "#FFF" : T.luxuryBrown,
                  }}>{u}</button>
                ))}
              </div>
              <div style={{ position: "relative" as const }}>
                <input
                  type="number"
                  value={row.quantity}
                  onChange={e => patch({ quantity: e.target.value })}
                  placeholder="0"
                  style={{ width: "100%", height: 42, borderRadius: 10, border: `1.5px solid ${T.borderDef}`, padding: "0 38px 0 14px", fontFamily: F.mono, fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
                />
                <span style={{ position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{row.warpReshamUnit || "kg"}</span>
              </div>
              {row.quantity && (
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold }}>
                  = {(row.warpReshamUnit || "kg") === "kg" ? `${(parseFloat(row.quantity) * 1000).toFixed(0)} g` : `${(parseFloat(row.quantity) / 1000).toFixed(3)} kg`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* GRN Batch Selector */}
      <div>
        <GrnBatchSelector grnBatches={grnBatches} materialType={row.materialType} value={row.grnBatchId} onChange={v => patch({ grnBatchId: v })} />
        {overAvailable && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 7, background: "rgba(196,146,58,0.14)", border: `1px solid ${T.antiqueGold}`, borderRadius: 8, padding: "8px 12px" }}>
            <AlertTriangle size={14} color="#8B6018" />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018" }}>Only {selectedGrn!.availableQty} {selectedGrn!.unit} available — you entered {qtyNum} {selectedGrn!.unit}</span>
          </div>
        )}
      </div>
    </div>
  );
}
