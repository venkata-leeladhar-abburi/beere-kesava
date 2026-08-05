// Purchase (order) history table with saree drill-down, used by the Order
// History tab of a supplier's profile.

import React, { useState } from "react";
import { T, F } from "../theme";
import { PayStatusPill } from "../common/primitives";
import { SareeInventoryTable } from "./SareeInventoryTable";
import { Purchase, formatINR, purchaseTotals } from "../../contexts/SupplierContext";
import { FileText } from "lucide-react";
import { Button } from "../../../../shared/ui/primitives";

export function PurchaseHistoryTable({ purchases }: { purchases: Purchase[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (purchases.length === 0) {
    return <div style={{ padding: "40px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No purchases in this period.</div>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: T.silkCream }}>
          {["Purchase Ref", "Invoice", "Sarees", "Buying Price", "Selling Price", "Profit", "Bill Amount", "Payment", ""].map(h => (
            <th key={h} style={{ padding: "12px 16px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {purchases.map((p, i) => (
          <React.Fragment key={p.id}>
            <tr style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
              <td style={{ padding: "14px 16px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, marginBottom: 4 }}>{p.id}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</div>
              </td>
              <td style={{ padding: "14px 16px" }}>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{p.invoiceNumber || "—"}</div>
                {p.invoiceFileName && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <FileText size={11} color={T.royalBurgundy} />
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.invoiceFileName}</span>
                  </div>
                )}
              </td>
              <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>{p.sareeCount}</td>
              {(() => {
                const t = purchaseTotals(p.sarees);
                return (
                  <>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown, whiteSpace: "nowrap" }}>{formatINR(t.buying)}</td>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.antiqueGold, whiteSpace: "nowrap" }}>{formatINR(t.selling)}</td>
                    <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.green, whiteSpace: "nowrap" }}>{formatINR(t.profit)}</td>
                  </>
                );
              })()}
              <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: "#8B6018" }}>{p.billAmount}</td>
              <td style={{ padding: "14px 16px" }}><PayStatusPill status={p.status} /></td>
              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                <Button variant="tertiary" size="sm" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  {expanded === p.id ? "Hide sarees" : `View ${p.sareeCount} sarees`}
                </Button>
              </td>
            </tr>
            {expanded === p.id && (
              <tr>
                <td colSpan={9} style={{ padding: 0, background: "rgba(247,242,234,0.7)", borderTop: `1px solid ${T.borderDef}` }}>
                  <div style={{ padding: "6px 16px 16px" }}>
                    <SareeInventoryTable rows={p.sarees.map(s => ({ ...s, purchaseId: p.id, invoiceNumber: p.invoiceNumber }))} />
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}
