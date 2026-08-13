import React from "react";
import { AlertTriangle } from "lucide-react";
import { F, GrnBatch, MaterialRowState, T } from "./theme";
import { PillTab } from "./primitives";
import { GrnBatchSelector } from "./GrnBatchSelector";
import { Button, IconButton, Input, NumberInput } from "../../../../shared/ui/primitives";

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
        <IconButton
          icon="delete"
          label="Remove"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="absolute top-[14px] right-[14px] bg-[rgba(192,57,43,0.08)] text-[var(--text-danger)] hover:bg-[rgba(192,57,43,0.14)] hover:text-[var(--text-danger)]"
        />
      )}

      {/* Material Type */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 8 }}>Material Type</label>
        <PillTab options={["Warp", "Resham", "Jari"]} value={row.materialType} onChange={v => patch({ materialType: v as any, grnBatchId: "", description: "", quantity: "" })} />
      </div>

      {/* Description + Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]" style={{ gap: 14, marginBottom: 16 }}>
        <div>
          <label style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>
            Description
          </label>
          <Input
            value={row.description}
            onChange={e => patch({ description: e.target.value })}
            placeholder={
              row.materialType === "Warp"   ? "e.g. Cotton/Silk blend warp" :
              row.materialType === "Resham" ? "e.g. Red Resham" :
                                             "e.g. Polyester Gold Jari"
            }
            className="w-full"
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
                  <Button
                    key={u}
                    variant={row.jariUnit === u ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => patch({ jariUnit: u as any })}
                    className="flex-1"
                  >{u}</Button>
                ))}
              </div>
              <div style={{ position: "relative" as const }}>
                <NumberInput
                  value={row.quantity === "" ? "" : Number(row.quantity)}
                  onValueChange={v => patch({ quantity: v === "" ? "" : String(v) })}
                  placeholder="0"
                  className="w-full pr-[52px]"
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
                  <Button
                    key={u}
                    variant={(row.warpReshamUnit || "kg") === u ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => patch({ warpReshamUnit: u as any })}
                    className="flex-1"
                  >{u}</Button>
                ))}
              </div>
              <div style={{ position: "relative" as const }}>
                <NumberInput
                  value={row.quantity === "" ? "" : Number(row.quantity)}
                  onValueChange={v => patch({ quantity: v === "" ? "" : String(v) })}
                  placeholder="0"
                  className="w-full pr-[38px]"
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
