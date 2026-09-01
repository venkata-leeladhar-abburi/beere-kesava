import { AlertTriangle } from "lucide-react";
import { F, T } from "../issueMaterial/theme";
import { PillTab } from "../issueMaterial/primitives";
import { WeaverOutstandingLine } from "../../contexts/MaterialReturnContext";
import { Button, IconButton, Input, NumberInput } from "../../../../shared/ui/primitives";
import { ReturnRowState } from "./theme";
import { formatOutstandingGrams } from "./materialFormatters";

const JARI_REEL_GRAMS = 230;
const BUNS_PER_REEL = 4;

function rowToGrams(row: ReturnRowState): number {
  const qty = Number(row.quantity) || 0;
  if (row.materialType === "Jari") {
    return row.jariUnit === "Buns" ? qty * (JARI_REEL_GRAMS / BUNS_PER_REEL) : qty * JARI_REEL_GRAMS;
  }
  return row.warpReshamUnit === "g" ? qty : qty * 1000;
}

// Outstanding is reported per GRN line/variant, but returns are now recorded
// at the material-type level only (no subtype/color selection) — so a row's
// cap is the SUM of every outstanding line for that material type, regardless
// of which variant it came from.
function outstandingGramsForRow(row: ReturnRowState, lines: WeaverOutstandingLine[]): number | undefined {
  const matches = lines.filter(l => l.materialType === row.materialType);
  if (matches.length === 0) return undefined;
  return matches.reduce((sum, l) => sum + l.outstandingGrams, 0);
}

// Return-materials version of issueMaterial/MaterialRowEditor.tsx — same
// material-type/quantity UI, but no GRN batch (returns aren't drawn from a
// GRN) and the over-quantity warning compares against outstanding-with-
// weaver instead of GRN-available-stock.
export function ReturnMaterialRowEditor({ row, outstandingLines, onChange, onRemove, showRemove }: {
  row: ReturnRowState;
  outstandingLines: WeaverOutstandingLine[];
  onChange: (r: ReturnRowState) => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  const patch = (p: Partial<ReturnRowState>) => onChange({ ...row, ...p });
  const qtyNum = Number(row.quantity) || 0;
  const outstandingGrams = outstandingGramsForRow(row, outstandingLines);
  const rowGrams = rowToGrams(row);
  const overOutstanding = outstandingGrams !== undefined && rowGrams > outstandingGrams;
  const reelsToBuns = row.jariUnit === "Reels" ? (qtyNum * 4) : (qtyNum / 4);

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
        <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 8 }}>Material Type</span>
        <PillTab options={["Warp", "Resham", "Jari"]} value={row.materialType} onChange={v => patch({ materialType: v as ReturnRowState["materialType"], description: "", quantity: "" })} />
      </div>


      {/* Description + Quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3.5">
        <div>
          <label htmlFor="return-row-description" style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>
            Description (Optional)
          </label>
          <Input
            id="return-row-description"
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
          <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.taupe, display: "block", marginBottom: 6 }}>
            Quantity {row.materialType === "Jari" ? "(Reels / Buns)" : `(${row.warpReshamUnit || "kg"})`}
          </span>
          {row.materialType === "Jari" ? (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                {["Reels", "Buns"].map(u => (
                  <Button
                    key={u}
                    variant={row.jariUnit === u ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => patch({ jariUnit: u as ReturnRowState["jariUnit"] })}
                    className="flex-1"
                  >{u}</Button>
                ))}
              </div>
              <div style={{ position: "relative" as const }}>
                <NumberInput
                  value={row.quantity === "" ? "" : Number(row.quantity)}
                  onValueChange={v => patch({ quantity: v === "" ? "" : String(v) })}
                  placeholder="0"
                  // Materials are weighed, not counted: 1.2kg of warp, 0.75
                  // reels of jari. NumberInput reads decimal support off
                  // `step`, so the default of 1 silently swallowed the point.
                  step={0.01}
                  className="w-full pr-[52px]"
                />
                <span style={{ position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{row.jariUnit}</span>
              </div>
              {row.quantity && (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, marginTop: 4 }}>
                  = {reelsToBuns.toFixed(reelsToBuns % 1 === 0 ? 0 : 1)} {row.jariUnit === "Reels" ? "Buns" : "Reels"} <span style={{ color: T.taupe }}>(1 Reel = 4 Buns)</span>
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
                    onClick={() => patch({ warpReshamUnit: u as ReturnRowState["warpReshamUnit"] })}
                    className="flex-1"
                  >{u}</Button>
                ))}
              </div>
              <div style={{ position: "relative" as const }}>
                <NumberInput
                  value={row.quantity === "" ? "" : Number(row.quantity)}
                  onValueChange={v => patch({ quantity: v === "" ? "" : String(v) })}
                  placeholder="0"
                  // Materials are weighed, not counted: 1.2kg of warp, 0.75
                  // reels of jari. NumberInput reads decimal support off
                  // `step`, so the default of 1 silently swallowed the point.
                  step={0.01}
                  className="w-full pr-[38px]"
                />
                <span style={{ position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{row.warpReshamUnit || "kg"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {outstandingGrams !== undefined && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 7, background: overOutstanding ? "rgba(196,146,58,0.14)" : "rgba(30,102,64,0.08)", border: `1px solid ${overOutstanding ? T.antiqueGold : "rgba(30,102,64,0.20)"}`, borderRadius: 8, padding: "8px 12px" }}>
          <AlertTriangle size={14} color={overOutstanding ? "#8B6018" : T.green} />
          <span style={{ fontFamily: F.ui, fontSize: 12, color: overOutstanding ? "#8B6018" : T.green }}>
            {overOutstanding
              ? `Only ${formatOutstandingGrams(row.materialType, outstandingGrams)} outstanding for this line — you entered more than that`
              : `${formatOutstandingGrams(row.materialType, outstandingGrams)} outstanding for this line`}
          </span>
        </div>
      )}
    </div>
  );
}
