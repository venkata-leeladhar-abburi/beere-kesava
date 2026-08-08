// Flat "External Purchase History" table shown at the bottom of the main
// Suppliers page (all purchases, across all suppliers).

import React from "react";
import { T, F } from "../theme";
import { FadeUp } from "../common/primitives";
import { Purchase } from "../../contexts/SupplierContext";

export function ExternalPurchaseHistorySection({ purchases }: { purchases: Purchase[] }) {
  return (
    <div style={{ padding: "48px 56px 0" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
          <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>External Purchase History</h2>
        </div>
        <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, overflow: "hidden" }}>
          {purchases.length === 0 ? (
            <div style={{ padding: "44px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No external purchases recorded yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.silkCream }}>
                  {["Purchase Ref", "Supplier", "Invoice", "Sarees", "Bill Amount", "Date", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
                    <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{p.id}</td>
                    <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{p.supplier}</td>
                    <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{p.invoiceNumber || "—"}</td>
                    <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{p.sareeCount} pcs</td>
                    <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#8B6018" }}>{p.billAmount}</td>
                    <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{
                        fontFamily: F.ui, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                        background: p.status === "Paid" ? "rgba(30,102,64,0.09)" : "rgba(230,126,34,0.12)",
                        color: p.status === "Paid" ? T.greenMid : "rgba(230,126,34,1)",
                      }}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </FadeUp>
    </div>
  );
}
