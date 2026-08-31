/* eslint-disable no-restricted-syntax */
import { Trash2 } from "lucide-react";
import { T, F, ExtItem } from "./POTypesAndVendors";
import { IconButton, Textarea, NumberInput, Select, SelectItem } from "../../../shared/ui/primitives";

interface POMaterialRowProps {
  item: ExtItem;
  onChange: (updated: ExtItem) => void;
  onRemove: () => void;
  canRemove: boolean;
  errors: Record<string, string>;
  /** 1-based position, shown as the row's chip so stacked cards stay readable. */
  index?: number;
}

const labelCls = "block mb-[6px] text-[11px] font-semibold tracking-[0.4px] uppercase";
const labelStyle: React.CSSProperties = { fontFamily: F.ui, color: T.taupe };

/**
 * UnitToggle — the kg/g (or Buns/Reels) switch, rendered INSIDE the quantity
 * field as an addon rather than as a button row stacked above it. The old
 * stacked layout is what pushed the quantity control ~34px below the
 * description textarea beside it, so the two columns never lined up.
 */
function UnitToggle({ units, value, onChange }: { units: string[]; value: string; onChange: (u: string) => void }) {
  return (
    <span
      className="flex shrink-0 items-center gap-[2px] rounded-[7px] p-[2px]"
      style={{ background: T.silkCream, border: `1px solid ${T.borderDef}` }}
    >
      {units.map(u => {
        const active = value === u;
        return (
          <button
            key={u}
            type="button"
            onClick={() => onChange(u)}
            aria-pressed={active}
            className="h-[22px] rounded-[5px] px-[8px] text-[11px] font-bold leading-none transition-colors"
            style={{
              fontFamily: F.mono,
              background: active ? T.royalBurgundy : "transparent",
              color: active ? "#FFFDF9" : T.taupe,
            }}
          >
            {u}
          </button>
        );
      })}
    </span>
  );
}

export function POMaterialRow({
  item,
  onChange,
  onRemove,
  canRemove,
  errors,
  index,
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

  const isJari = item.materialType === "Jari";
  const units = isJari ? ["Buns", "Reels"] : ["kg", "g"];
  const qtyError = errors[`mat-${item._key}-qty`];

  const conversion = (() => {
    if (!item.quantity || item.quantity <= 0) return null;
    if (isJari) {
      return item.unit === "Reels"
        ? `${Math.round(item.quantity * 4)} Buns · 1 Reel = 4 Buns`
        : `${Math.round(item.quantity / 4)} Reels · 1 Reel = 4 Buns`;
    }
    return item.unit === "kg"
      ? `${(item.quantity * 1000).toFixed(0)} g`
      : `${(item.quantity / 1000).toFixed(3)} kg`;
  })();

  return (
    <div
      className="relative rounded-[12px] p-[14px] sm:p-[16px]"
      style={{ background: T.warmIvory, border: `1.5px solid ${T.borderDef}` }}
    >
      {/* Row chip + remove, on their own line so nothing overlaps the fields
          on narrow screens (the old absolute trash button sat on top of the
          Type select at mobile widths). */}
      <div className="mb-[10px] flex items-center justify-between gap-2">
        <span
          className="rounded-[6px] px-[8px] py-[2px] text-[11px] font-semibold tracking-[0.4px] uppercase"
          style={{ fontFamily: F.ui, color: T.antiqueGold, background: "rgba(200,155,71,0.10)" }}
        >
          Material {index ?? 1}
        </span>
        {canRemove && (
          <IconButton onClick={onRemove} label="Remove material" icon={Trash2} variant="ghost" size="sm" />
        )}
      </div>

      {/* Type and Description share one row — they are the two fields that
          need to be read together — and Quantity gets its own line below.
          Squeezing all three into one row inside a ~500px panel is what
          forced the horizontal scrollbar and left Description a two-word-wide
          box. Both controls here are a single field height, so their tops
          line up exactly. */}
      <div className="grid grid-cols-1 gap-x-[12px] gap-y-[12px] sm:grid-cols-[minmax(110px,132px)_minmax(0,1fr)]">
        {/* Material Type */}
        <div className="min-w-0">
          <span className={labelCls} style={labelStyle}>Type *</span>
          <Select value={item.materialType} onValueChange={v => set("materialType", v)} className="w-full">
            <SelectItem value="Warp">Warp</SelectItem>
            <SelectItem value="Resham">Resham</SelectItem>
            <SelectItem value="Jari">Jari</SelectItem>
          </Select>
        </div>

        {/* Description */}
        <div className="min-w-0">
          <span className={labelCls} style={labelStyle}>Description</span>
          <Textarea
            value={item.description ?? ""}
            onChange={e => set("description", e.target.value)}
            placeholder="Colour, grade, quality notes…"
            rows={1}
            className="min-h-[40px] resize-y"
          />
        </div>

        {/* Quantity — the unit switch lives INSIDE the field as an addon, so
            the control is one row tall like the two above it. */}
        <div className="min-w-0 sm:col-span-2 sm:max-w-[240px]">
          <span className={labelCls} style={labelStyle}>Quantity *</span>
          <NumberInput
            min={0}
            value={item.quantity || ""}
            onValueChange={v => set("quantity", v === "" ? 0 : v)}
            placeholder="0"
            invalid={Boolean(qtyError)}
            className="font-mono"
            addonRight={<UnitToggle units={units} value={item.unit} onChange={u => set("unit", u)} />}
          />
          {qtyError ? (
            <div className="mt-[4px] text-[11px]" style={{ color: T.crimson }}>{qtyError}</div>
          ) : conversion ? (
            <div className="mt-[4px] text-[11px] font-semibold" style={{ fontFamily: F.ui, color: T.antiqueGold }}>
              = {conversion}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
