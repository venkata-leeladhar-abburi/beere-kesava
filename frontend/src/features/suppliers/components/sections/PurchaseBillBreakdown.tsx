// The bill of one external purchase, in full: every saree line (qty × price),
// the sarees total, the discount (as entered and in rupees), the taxable value,
// GST (rate and rupees) and the final bill — plus what's been paid against it
// and what's left, when the caller knows. Shared by the supplier payment
// screens (View Details, Pay Now) so a bill reads the same everywhere.
//
// Discount and GST rows are always shown, zero included, so "no discount" and
// "0% GST" read as facts rather than as missing information.

import { Purchase, parseINR, invoicedBuying } from "../../contexts/supplier-types";
import { formatMoneyExact, rupees } from "@/lib/domain/money";
import { T, F } from "../theme";

const pct = (n: number) => `${Number(n.toFixed(2))}%`;

export function PurchaseBillBreakdown({
  purchase,
  paid,
}: {
  purchase: Purchase;
  /** Paid against this purchase so far — shows Paid and Balance rows when given. */
  paid?: number;
}) {
  const bill = parseINR(purchase.billAmount);
  const money = (n: number) => formatMoneyExact(rupees(n));

  // Older purchases had their bill typed in by hand: no stored subtotal,
  // discount or GST. Their lines still say what the sarees cost, so the
  // sarees total is rebuilt from them and whatever separates it from the bill
  // is shown as one un-itemised adjustment rather than guessed at.
  const hasBreakdown = purchase.subtotal !== undefined;
  const linesTotal = invoicedBuying(purchase.sarees);
  const subtotal = hasBreakdown ? purchase.subtotal ?? 0 : linesTotal;
  const discountAmount = hasBreakdown ? purchase.discountAmount ?? 0 : 0;
  const discountValue = purchase.discountValue ?? 0;
  const gstPercent = hasBreakdown ? purchase.gstPercent ?? 0 : 0;
  const gstAmount = hasBreakdown ? purchase.gstAmount ?? 0 : 0;
  const taxable = subtotal - discountAmount;
  const unitemised = hasBreakdown ? 0 : bill - linesTotal;

  const discountLabel = !discountAmount
    ? "Discount (none)"
    : purchase.discountType === "percent"
      ? `Discount (${pct(discountValue)} of sarees total)`
      : `Discount (flat ${money(discountValue)} · ${pct(subtotal ? (discountAmount / subtotal) * 100 : 0)})`;

  const row = (label: string, value: string, color: string = T.luxuryBrown, strong = false) => (
    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0" }}>
      <span style={{ fontFamily: F.ui, fontSize: 12, color: strong ? T.luxuryBrown : T.taupe, fontWeight: strong ? 700 : 400 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: strong ? 700 : 600, color, whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
  const rule = { borderTop: `1px dashed ${T.borderDef}`, marginTop: 4, paddingTop: 4 };

  return (
    <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 12px" }}>
      {/* ── Saree lines ── */}
      {purchase.sarees.length > 0 && (
        <div style={{ paddingBottom: 4 }}>
          <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px", paddingBottom: 2 }}>
            Sarees
          </div>
          {purchase.sarees.map((s, i) => {
            const qty = Number(s.quantity) > 0 ? Number(s.quantity) : 1;
            const name = [s.sareeType, s.color].filter(Boolean).join(" · ") || s.id;
            return (
              <div key={s.lineId ?? s.id ?? i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "2px 0" }}>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, minWidth: 0 }}>
                  {name}
                  <span style={{ color: T.taupe }}> · {qty} × {money(Number(s.price) || 0)}</span>
                  {!!s.returnedQuantity && <span style={{ color: T.crimson }}> · {s.returnedQuantity} returned</span>}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.luxuryBrown, whiteSpace: "nowrap" }}>
                  {money((Number(s.price) || 0) * qty)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sarees total → discount → taxable → GST ── */}
      <div style={purchase.sarees.length > 0 ? rule : undefined}>
        {row("Sarees total", money(subtotal), T.luxuryBrown, true)}
        {hasBreakdown ? (
          <>
            {row(discountLabel, discountAmount ? `− ${money(discountAmount)}` : money(0), discountAmount ? T.greenMid : T.taupe)}
            {row("Taxable value (after discount)", money(taxable))}
            {row(`GST (${pct(gstPercent)})`, gstAmount ? `+ ${money(gstAmount)}` : money(0), gstAmount ? T.luxuryBrown : T.taupe)}
          </>
        ) : unitemised === 0 ? (
          <>
            {row("Discount (none)", money(0), T.taupe)}
            {row("GST (0%)", money(0), T.taupe)}
          </>
        ) : (
          <>
            {row(
              unitemised > 0 ? "GST / charges (not itemised)" : "Discount (not itemised)",
              `${unitemised > 0 ? "+" : "−"} ${money(Math.abs(unitemised))}`,
              unitemised > 0 ? T.luxuryBrown : T.greenMid,
            )}
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, padding: "2px 0" }}>
              This bill was entered before discount and GST were recorded separately — edit the purchase to itemise them.
            </div>
          </>
        )}
      </div>

      {/* ── Final bill, paid, balance ── */}
      <div style={rule}>
        {row("Final bill", money(bill), T.royalBurgundy, true)}
        {paid !== undefined && row("Paid", money(paid), T.greenMid)}
        {paid !== undefined && row("Balance", money(Math.max(0, bill - paid)), bill - paid > 0 ? T.crimson : T.greenMid, true)}
      </div>
      {(purchase.gstNumber || purchase.invoiceNumber) && (
        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {purchase.invoiceNumber && <span>Invoice <span style={{ fontFamily: "var(--font-mono)", color: T.luxuryBrown }}>{purchase.invoiceNumber}</span></span>}
          {purchase.gstNumber && <span>GSTIN <span style={{ fontFamily: "var(--font-mono)", color: T.luxuryBrown }}>{purchase.gstNumber}</span></span>}
        </div>
      )}
    </div>
  );
}
