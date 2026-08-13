import React from "react";
import { Trash2 } from "lucide-react";
import { T, F, ExtItem } from "./POTypesAndVendors";
import { IconButton, Textarea, NumberInput, Select, SelectItem, Button } from "../../../shared/ui/primitives";

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
  const set = (k: keyof ExtItem, v: unknown) => {
    const updated = { ...item, [k]: v } as ExtItem;
    // Reset unit when type changes
    if (k === "materialType") {
      updated.unit = v === "Jari" ? "Buns" : "kg";
    }
    if (k === "quantity") {
      updated.subtotal = (updated.pricePerUnit || 0) * (Number(v) || 0);
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
        <IconButton
          onClick={onRemove}
          label="Remove material"
          icon={Trash2}
          variant="ghost"
          size="sm"
          className="absolute top-[10px] right-[12px]"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_1fr]" style={{ gap: 10, alignItems: "start" }}>
        {/* Material Type */}
        <div>
          <label style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, marginBottom: 5, display: "block", letterSpacing: "0.3px" }}>Type *</label>
          <Select value={item.materialType} onValueChange={v => set("materialType", v)}>
            <SelectItem value="Warp">Warp</SelectItem>
            <SelectItem value="Resham">Resham</SelectItem>
            <SelectItem value="Jari">Jari</SelectItem>
          </Select>
          {errors[`mat-${item._key}-type`] && <div style={{ color: T.crimson, fontSize: 12, marginTop: 3 }}>{errors[`mat-${item._key}-type`]}</div>}
        </div>

        {/* Description */}
        <div>
          <label style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, marginBottom: 5, display: "block", letterSpacing: "0.3px" }}>Description</label>
          <Textarea
            value={item.description ?? ""}
            onChange={e => set("description", e.target.value)}
            placeholder="Color, grade, subtype, quality notes..."
            rows={2}
          />
        </div>

        {/* Quantity */}
        <div>
          <label style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, marginBottom: 5, display: "block", letterSpacing: "0.3px" }}>
            Quantity * {item.materialType !== "Jari" ? "(kg + g)" : ""}
          </label>
          {item.materialType === "Jari" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", gap: 5, marginBottom: 2 }}>
                {["Buns", "Reels"].map(u => (
                  <Button key={u} onClick={() => set("unit", u)} variant={item.unit === u ? "primary" : "secondary"} size="sm" className="flex-1">{u}</Button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <NumberInput
                  min={0}
                  value={item.quantity || ""}
                  onValueChange={v => set("quantity", v === "" ? 0 : v)}
                  className="pr-11" placeholder="0"
                />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{item.unit}</span>
              </div>
              {item.quantity > 0 && (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold }}>
                  = {item.unit === "Reels" ? `${Math.round(item.quantity / 4)} Buns` : `${Math.round(item.quantity * 4)} Reels`}
                  <span style={{ color: T.taupe }}> (1 Bun = 4 Reels)</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", gap: 5, marginBottom: 2 }}>
                {["kg", "g"].map(u => (
                  <Button key={u} onClick={() => set("unit", u)} variant={item.unit === u ? "primary" : "secondary"} size="sm" className="flex-1">{u}</Button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <NumberInput
                  min={0}
                  value={item.quantity || ""}
                  onValueChange={v => set("quantity", v === "" ? 0 : v)}
                  className="pr-8" placeholder="0"
                />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{item.unit}</span>
              </div>
              {item.quantity > 0 && (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.antiqueGold, fontWeight: 600 }}>
                  = {item.unit === "kg" ? `${(item.quantity * 1000).toFixed(0)} g` : `${(item.quantity / 1000).toFixed(3)} kg`}
                </div>
              )}
            </div>
          )}
          {errors[`mat-${item._key}-qty`] && <div style={{ color: T.crimson, fontSize: 12, marginTop: 3 }}>{errors[`mat-${item._key}-qty`]}</div>}
        </div>

        {/* Price per unit */}
        <div>
          <label style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, marginBottom: 5, display: "block", letterSpacing: "0.3px" }}>
            Price / {item.unit} (₹)
          </label>
          <NumberInput
            min={0}
            value={item.pricePerUnit || ""}
            onValueChange={v => {
              const price = v === "" ? 0 : Number(v);
              onChange({ ...item, pricePerUnit: price, subtotal: price * (item.quantity || 0) });
            }}
            placeholder="0"
          />
          {item.quantity > 0 && item.pricePerUnit > 0 && (
            <div style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, fontWeight: 600, marginTop: 4 }}>
              = ₹{(item.pricePerUnit * item.quantity).toLocaleString("en-IN")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
