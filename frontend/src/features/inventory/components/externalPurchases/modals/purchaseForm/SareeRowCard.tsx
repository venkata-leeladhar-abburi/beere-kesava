import React from "react";
import { X, UploadCloud } from "lucide-react";
import {
  formatINR, buildSareeCode, computeFinalAmount,
  lineBuying, lineSelling, lineProfit, pieceCodeFromLineCode,
} from "../../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../../theme";
import { SareeRow } from "../../types";
import { inputStyle, labelStyle } from "../../common/primitives";
import { Field, Input, NumberInput, Textarea, IconButton } from "../../../../../../shared/ui/primitives";

/** One editable saree line within the Add/Edit Purchase form's "Saree Details" list. */
export function SareeRowCard({
  s,
  idx,
  supplier,
  invoiceNumber,
  updateSareeRow,
  removeSareeRow,
}: {
  s: SareeRow;
  idx: number;
  supplier: string;
  invoiceNumber: string;
  updateSareeRow: (uid: string, patch: Partial<SareeRow>) => void;
  removeSareeRow: (uid: string) => void;
}) {
  const price = Number(s.price) || 0;
  const sellPercent = Number(s.sellPercent) || 0;
  const quantity = Number(s.quantity) || 1;
  const buying = lineBuying(s);
  const selling = lineSelling(s);
  const profit = lineProfit(s);
  const code = buildSareeCode(supplier, idx + 1, invoiceNumber);

  return (
    <div
      style={{
        border: `1px solid ${T.borderDef}`,
        borderRadius: 10,
        padding: "12px 14px",
        background: T.warmIvory,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            title="Serial number in this purchase"
            style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: "#FFF", background: T.royalBurgundy, borderRadius: 6, padding: "3px 8px" }}
          >
            #{idx + 1}
          </span>
          <span
            title="Auto-generated: supplier prefix + serial number + invoice number"
            style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 12, color: T.royalBurgundy, background: "rgba(200,155,71,0.13)", border: `1px solid ${T.borderGold}`, borderRadius: 6, padding: "3px 9px" }}
          >
            {code}
          </span>
        </div>
        <IconButton
          icon={X}
          label="Remove saree"
          size="sm"
          variant="ghost"
          onClick={() => removeSareeRow(s._uid)}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Field label="Saree Type">
          <Input
            size="sm"
            value={s.sareeType}
            onChange={(e) => updateSareeRow(s._uid, { sareeType: e.target.value })}
            placeholder="e.g. Kanjivaram"
          />
        </Field>
        <Field label="Colour">
          <Input
            size="sm"
            value={s.color}
            onChange={(e) => updateSareeRow(s._uid, { color: e.target.value })}
            placeholder="e.g. Maroon"
          />
        </Field>
        <Field label="Weight (grams)">
          <NumberInput
            size="sm"
            value={s.weight.replace(/g$/, "") === "" ? "" : Number(s.weight.replace(/g$/, ""))}
            onValueChange={(v) => updateSareeRow(s._uid, { weight: `${v}g` })}
            placeholder="e.g. 820"
          />
        </Field>
      </div>
      {/* Price per quantity × quantity = buying price */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 0.75fr 1fr", gap: 10, marginBottom: 10 }}>
        <Field label="Price / Quantity (₹)">
          <NumberInput
            size="sm"
            value={s.price || ""}
            onValueChange={(v) => updateSareeRow(s._uid, { price: Number(v) || 0 })}
            placeholder="e.g. 600"
          />
        </Field>
        <Field label="Quantity">
          <NumberInput
            size="sm"
            min={1}
            value={s.quantity ?? 1}
            onValueChange={(v) => updateSareeRow(s._uid, { quantity: Math.max(1, Number(v) || 1) })}
            placeholder="1"
          />
        </Field>
        <div>
          <label style={labelStyle}>Buying Price</label>
          <div style={{ ...inputStyle, height: 36, fontSize: 12, display: "flex", alignItems: "center", fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown, background: T.silkCream }}>
            {formatINR(buying)}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 3 }}>
            {formatINR(price)} × {quantity}
          </div>
        </div>
      </div>

      {/* Markup drives selling price and profit */}
      <div style={{ display: "grid", gridTemplateColumns: "0.75fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <Field label="Sell % (markup)">
          <NumberInput
            size="sm"
            value={s.sellPercent || ""}
            onValueChange={(v) => updateSareeRow(s._uid, { sellPercent: Number(v) || 0 })}
            placeholder="e.g. 25"
          />
        </Field>
        <div>
          <label style={labelStyle}>Selling Price</label>
          <div style={{ ...inputStyle, height: 36, fontSize: 12, display: "flex", alignItems: "center", fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy, background: T.cream }}>
            {formatINR(selling)}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 3 }}>
            {formatINR(computeFinalAmount(price, sellPercent))} × {quantity}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Profit</label>
          <div style={{ ...inputStyle, height: 36, fontSize: 12, display: "flex", alignItems: "center", fontFamily: F.mono, fontWeight: 700, color: T.green, background: "rgba(30,102,64,0.07)", borderColor: "rgba(30,102,64,0.22)" }}>
            {formatINR(profit)}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, marginTop: 3 }}>
            selling − buying
          </div>
        </div>
      </div>
      {/* Every piece under this serial gets its own tag code */}
      <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "9px 11px", marginBottom: 10 }}>
        <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: 0.6, marginBottom: 6 }}>
          Saree codes ({quantity})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {Array.from({ length: Math.min(quantity, 24) }, (_, p) => (
            <span key={p} style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "#FFF", border: `1px solid ${T.borderGold}`, borderRadius: 5, padding: "2px 7px" }}>
              {pieceCodeFromLineCode(code, p + 1)}
            </span>
          ))}
          {quantity > 24 && (
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, alignSelf: "center" }}>
              +{quantity - 24} more
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 10 }}>
        <Field label="Notes (optional)">
          <Textarea
            value={s.notes}
            onChange={(e) => updateSareeRow(s._uid, { notes: e.target.value })}
            rows={2}
            className="resize-y text-[12px]"
          />
        </Field>
        <div>
          <label style={labelStyle}>Saree Photo (optional)</label>
          {s.imageUrl ? (
            <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.borderDef}` }}>
              <img src={s.imageUrl} alt="Saree" style={{ width: "100%", height: 68, objectFit: "cover", display: "block" }} />
              <IconButton
                icon={X}
                label="Remove photo"
                size="sm"
                onClick={() => updateSareeRow(s._uid, { imageUrl: undefined })}
                className="absolute top-[5px] right-[5px] size-[22px] rounded-full bg-black/55 text-white hover:bg-black/70 [&_svg]:size-[11px]"
              />
            </div>
          ) : (
            <label
              style={{ height: 68, border: `1.5px dashed ${T.borderGold}`, borderRadius: 8, background: T.silkCream, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", color: T.taupe }}
            >
              <UploadCloud size={16} />
              <span style={{ fontFamily: F.ui, fontSize: 12 }}>Upload photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => updateSareeRow(s._uid, { imageUrl: ev.target?.result as string });
                  reader.readAsDataURL(file);
                }}
                style={{ display: "none" }}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
