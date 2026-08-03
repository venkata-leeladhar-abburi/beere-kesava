import React from "react";
import { X, UploadCloud } from "lucide-react";
import {
  formatINR, buildSareeCode, computeFinalAmount,
  lineBuying, lineSelling, lineProfit, pieceCodeFromLineCode,
} from "../../../../../suppliers/contexts/SupplierContext";
import { T, F } from "../../theme";
import { SareeRow } from "../../types";
import { inputStyle, labelStyle } from "../../common/primitives";

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
            style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 11, color: "#FFF", background: T.royalBurgundy, borderRadius: 6, padding: "3px 8px" }}
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
        <button
          onClick={() => removeSareeRow(s._uid)}
          style={{ background: "none", border: "none", cursor: "pointer", color: T.taupe, display: "flex", alignItems: "center" }}
          title="Remove saree"
        >
          <X size={14} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle} htmlFor="saree-type">Saree Type</label>
          <input id="saree-type"
            style={{ ...inputStyle, height: 36, fontSize: 12 }}
            value={s.sareeType}
            onChange={(e) => updateSareeRow(s._uid, { sareeType: e.target.value })}
            placeholder="e.g. Kanjivaram"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="colour">Colour</label>
          <input id="colour"
            style={{ ...inputStyle, height: 36, fontSize: 12 }}
            value={s.color}
            onChange={(e) => updateSareeRow(s._uid, { color: e.target.value })}
            placeholder="e.g. Maroon"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="weight-grams">Weight (grams)</label>
          <input id="weight-grams"
            type="number"
            style={{ ...inputStyle, height: 36, fontSize: 12 }}
            value={s.weight.replace(/g$/, "")}
            onChange={(e) => updateSareeRow(s._uid, { weight: `${e.target.value}g` })}
            placeholder="e.g. 820"
          />
        </div>
      </div>
      {/* Price per quantity × quantity = buying price */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 0.75fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle} htmlFor="price-quantity">Price / Quantity (₹)</label>
          <input id="price-quantity"
            type="number"
            style={{ ...inputStyle, height: 36, fontSize: 12 }}
            value={s.price || ""}
            onChange={(e) => updateSareeRow(s._uid, { price: Number(e.target.value) })}
            placeholder="e.g. 600"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="quantity">Quantity</label>
          <input id="quantity"
            type="number"
            min={1}
            style={{ ...inputStyle, height: 36, fontSize: 12 }}
            value={s.quantity ?? 1}
            onChange={(e) => updateSareeRow(s._uid, { quantity: Math.max(1, Number(e.target.value) || 1) })}
            placeholder="1"
          />
        </div>
        <div>
          <label style={labelStyle}>Buying Price</label>
          <div style={{ ...inputStyle, height: 36, fontSize: 12.5, display: "flex", alignItems: "center", fontFamily: F.mono, fontWeight: 700, color: T.luxuryBrown, background: T.silkCream }}>
            {formatINR(buying)}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginTop: 3 }}>
            {formatINR(price)} × {quantity}
          </div>
        </div>
      </div>

      {/* Markup drives selling price and profit */}
      <div style={{ display: "grid", gridTemplateColumns: "0.75fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle} htmlFor="sell-markup">Sell % (markup)</label>
          <input id="sell-markup"
            type="number"
            style={{ ...inputStyle, height: 36, fontSize: 12 }}
            value={s.sellPercent || ""}
            onChange={(e) => updateSareeRow(s._uid, { sellPercent: Number(e.target.value) })}
            placeholder="e.g. 25"
          />
        </div>
        <div>
          <label style={labelStyle}>Selling Price</label>
          <div style={{ ...inputStyle, height: 36, fontSize: 12.5, display: "flex", alignItems: "center", fontFamily: F.mono, fontWeight: 700, color: T.royalBurgundy, background: T.cream }}>
            {formatINR(selling)}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginTop: 3 }}>
            {formatINR(computeFinalAmount(price, sellPercent))} × {quantity}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Profit</label>
          <div style={{ ...inputStyle, height: 36, fontSize: 12.5, display: "flex", alignItems: "center", fontFamily: F.mono, fontWeight: 700, color: T.green, background: "rgba(30,102,64,0.07)", borderColor: "rgba(30,102,64,0.22)" }}>
            {formatINR(profit)}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, marginTop: 3 }}>
            selling − buying
          </div>
        </div>
      </div>
      {/* Every piece under this serial gets its own tag code */}
      <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "9px 11px", marginBottom: 10 }}>
        <div style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: 0.6, marginBottom: 6 }}>
          Saree codes ({quantity})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {Array.from({ length: Math.min(quantity, 24) }, (_, p) => (
            <span key={p} style={{ fontFamily: F.mono, fontSize: 10.5, color: T.royalBurgundy, background: "#FFF", border: `1px solid ${T.borderGold}`, borderRadius: 5, padding: "2px 7px" }}>
              {pieceCodeFromLineCode(code, p + 1)}
            </span>
          ))}
          {quantity > 24 && (
            <span style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, alignSelf: "center" }}>
              +{quantity - 24} more
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 10 }}>
        <div>
          <label style={labelStyle} htmlFor="notes-optional">Notes (optional)</label>
          <textarea id="notes-optional"
            value={s.notes}
            onChange={(e) => updateSareeRow(s._uid, { notes: e.target.value })}
            rows={2}
            style={{ ...inputStyle, height: "auto", padding: "8px 12px", fontSize: 12, resize: "vertical" as const }}
          />
        </div>
        <div>
          <label style={labelStyle}>Saree Photo (optional)</label>
          {s.imageUrl ? (
            <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.borderDef}` }}>
              <img src={s.imageUrl} alt="Saree" style={{ width: "100%", height: 68, objectFit: "cover", display: "block" }} />
              <button
                onClick={() => updateSareeRow(s._uid, { imageUrl: undefined })}
                title="Remove photo"
                style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <label
              style={{ height: 68, border: `1.5px dashed ${T.borderGold}`, borderRadius: 8, background: T.silkCream, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", color: T.taupe }}
            >
              <UploadCloud size={16} />
              <span style={{ fontFamily: F.ui, fontSize: 10.5 }}>Upload photo</span>
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
