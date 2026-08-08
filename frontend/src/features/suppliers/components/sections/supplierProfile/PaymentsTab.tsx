// Payment History tab of the supplier profile.

import React from "react";
import { DateFilterBar, DateFilterState } from "../../../../../shared/ui/DateFilterBar";
import { T, F } from "../../theme";
import { SupplierPayment, formatINR } from "../../../contexts/SupplierContext";

export function PaymentsTab({
  card, filteredPaidSum, totalPaid, outstanding, payFilter, setPayFilter, filteredPayments,
}: {
  card: React.CSSProperties;
  filteredPaidSum: number;
  totalPaid: number;
  outstanding: number;
  payFilter: DateFilterState;
  setPayFilter: (f: DateFilterState) => void;
  filteredPayments: SupplierPayment[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { label: "Paid in Range",  value: formatINR(filteredPaidSum),      color: T.green },
          { label: "Paid All Time",  value: formatINR(totalPaid),      color: T.luxuryBrown },
          { label: "Outstanding",    value: formatINR(outstanding),    color: outstanding > 0 ? T.crimson : T.green },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: "20px 22px" }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.borderDef}` }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: T.luxuryBrown, marginBottom: 12 }}>Payments Made</div>
          <DateFilterBar filter={payFilter} onChange={setPayFilter} />
        </div>
        {filteredPayments.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No payments in this period.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.silkCream }}>
                {["Payment Ref", "Date", "Against Purchase", "Mode", "Reference", "Amount"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textAlign: "left", letterSpacing: "0.8px" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p, i) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${T.borderDef}`, background: i % 2 === 0 ? "#FFF" : "rgba(247,242,234,0.4)" }}>
                  <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy }}>{p.id}</td>
                  <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{p.date}</td>
                  <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 12, color: T.luxuryBrown }}>{p.purchaseId || "—"}</td>
                  <td style={{ padding: "13px 16px", fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{p.mode}</td>
                  <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{p.reference}</td>
                  <td style={{ padding: "13px 16px", fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.green }}>{formatINR(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
