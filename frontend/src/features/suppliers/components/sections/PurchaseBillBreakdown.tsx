// The bill of one external purchase, line by line: sarees total, discount,
// GST and the final bill — plus what's been paid against it and what's left,
// when the caller knows. Shared by the supplier payment screens (View
// Details, Pay Now) so a bill reads the same everywhere it's shown.

import { Purchase, parseINR } from "../../contexts/supplier-types";
import { formatMoneyExact, rupees } from "@/lib/domain/money";
import { T, F } from "../theme";

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
  const hasBreakdown = purchase.subtotal !== undefined;
  const discountLabel =
    purchase.discountType === "percent" ? `Discount (${purchase.discountValue}%)` : "Discount";

  const row = (label: string, value: string, color: string = T.luxuryBrown, strong = false) => (
    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0" }}>
      <span style={{ fontFamily: F.ui, fontSize: 12, color: strong ? T.luxuryBrown : T.taupe, fontWeight: strong ? 700 : 400 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: strong ? 700 : 600, color, whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );

  return (
    <div style={{ background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 12px" }}>
      {hasBreakdown ? (
        <>
          {row("Sarees total", money(purchase.subtotal ?? 0))}
          {!!purchase.discountAmount && row(discountLabel, `− ${money(purchase.discountAmount)}`, T.greenMid)}
          {!!purchase.discountAmount && !!purchase.gstPercent &&
            row("After discount", money((purchase.subtotal ?? 0) - purchase.discountAmount))}
          {!!purchase.gstPercent && row(`GST (${purchase.gstPercent}%)`, `+ ${money(purchase.gstAmount ?? 0)}`)}
        </>
      ) : (
        <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, paddingBottom: 3 }}>
          Bill entered by hand — no discount / GST breakdown recorded.
        </div>
      )}
      <div style={{ borderTop: `1px dashed ${T.borderDef}`, marginTop: 4, paddingTop: 4 }}>
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
