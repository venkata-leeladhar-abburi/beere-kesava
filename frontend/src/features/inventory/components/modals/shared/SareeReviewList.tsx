import React from "react";
import { Package } from "lucide-react";
import { FinishingReturn } from "../../../../finishing/contexts/FinishingContext";
import { useBatches } from "../../../../production/contexts/BatchContext";
import { T, F } from "../../theme";
import { StatusBadge } from "../../common/primitives";
import { toPaise, fromPaise } from "../../../../../lib/gst";
import { rupees } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

// ── Saree review list (shared by the quotation / invoice review steps) ────────
export function SareeReviewList({ sarees, prices, applyGst, gstPct, docLabel }: {
  sarees: FinishingReturn[];
  prices: Record<string, string>;
  applyGst: boolean;
  gstPct: string;
  docLabel: string;
}) {
  const { batches } = useBatches();
  // Part A.4/I.5 — sum in integer paise, not floats (see the identical fix
  // and comment in InvoiceGenerator.tsx, which this list is reviewed after).
  const subtotalPaise = sarees.reduce((sum, s) => sum + toPaise(Number(prices[s.sareeId || s.id]) || 0), 0);
  const gstPaise = applyGst ? Math.round(subtotalPaise * (Number(gstPct) || 0) / 100) : 0;
  const subtotal = fromPaise(subtotalPaise);
  const gstAmount = fromPaise(gstPaise);

  return (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, marginBottom: 14 }}>
        {sarees.length} saree{sarees.length === 1 ? "" : "s"} on this {docLabel.toLowerCase()}, with the amounts entered.
      </div>
      <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", padding: "10px 16px", background: T.silkCream, borderBottom: `1px solid ${T.borderDef}` }}>
          {["Saree", "Amount (₹)"].map((h, i) => (
            <div key={h} style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: i ? "right" as const : "left" as const }}>{h}</div>
          ))}
        </div>
        {sarees.map((s, i) => {
          const sId = s.sareeId || s.id;
          const bId = batches.find(b => b.rows.some(r => r.sareeId === sId))?.batchId;
          const p = parseFloat(prices[sId]) || 0;
          return (
            <div key={sId} style={{ display: "grid", gridTemplateColumns: "1fr 130px", alignItems: "center", padding: "12px 16px", borderBottom: i < sarees.length - 1 ? `1px solid ${T.borderDef}` : "none", background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.45)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <Package size={15} color={T.taupe} style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" as const }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{sId}</span>
                    {bId && <span style={{ fontFamily: F.mono, fontSize: 12, color: T.antiqueGold, background: "rgba(200,155,71,0.08)", border: "1px solid rgba(200,155,71,0.18)", padding: "1px 5px", borderRadius: 4 }}>{bId}</span>}
                    <StatusBadge status={s.inventoryStatus} />
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>
                    {s.sareeTypeCode || s.designCode} · {s.sareeType} · Weaver: {s.weaverName}
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: p ? T.luxuryBrown : T.crimson, textAlign: "right" as const }}>
                {p ? <Money value={rupees(p)} /> : "not priced"}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, background: T.bgGold, border: `1px solid ${T.borderGold}`, borderRadius: 12, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Subtotal ({sarees.length} sarees)</span>
          <span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}><Money value={rupees(subtotal)} /></span>
        </div>
        {applyGst && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>GST ({gstPct}%)</span>
            <span style={{ fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown }}><Money value={rupees(gstAmount)} /></span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${T.borderGold}`, paddingTop: 8, marginTop: 2 }}>
          <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>Grand Total</span>
          <span style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 700, color: T.royalBurgundy }}><Money value={rupees(subtotal + gstAmount)} /></span>
        </div>
      </div>
    </div>
  );
}
