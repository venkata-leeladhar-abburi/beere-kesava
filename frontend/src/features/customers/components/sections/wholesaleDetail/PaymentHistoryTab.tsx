import React from "react";
import { DateFilterBar, DateFilterState, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { T, F } from "../../theme";

export function PaymentHistoryTab({
  wholesalePaymentDateFilter, setWholesalePaymentDateFilter,
}: {
  wholesalePaymentDateFilter: DateFilterState;
  setWholesalePaymentDateFilter: (f: DateFilterState) => void;
}) {
  return (
    <div>
      <h3 style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown, marginBottom: 16 }}>Ledger Payments Received</h3>
      <DateFilterBar filter={wholesalePaymentDateFilter} onChange={setWholesalePaymentDateFilter} />
      <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.warmCream, borderBottom: `1px solid ${T.borderDef}` }}>
              {["Receipt No", "Payment Date", "UTR Number", "Amount Paid", "Deductions", "Status"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.taupe }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { rec: "REC-90821", date: "02 May 2026", utr: "UTR9832104523", amt: "₹1,80,000", ded: "₹0", status: "Settled" },
              { rec: "REC-90145", date: "15 Apr 2026", utr: "UTR8293108420", amt: "₹2,60,000", ded: "₹20,000", status: "Settled" },
              { rec: "REC-89234", date: "18 Dec 2025", utr: "UTR7489312048", amt: "₹1,00,000", ded: "₹5,000", status: "Settled" },
            ].filter(p => matchesDateFilter(p.date, wholesalePaymentDateFilter)).map(p => (
              <tr key={p.rec} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy }}>{p.rec}</td>
                <td style={{ padding: "14px 16px", fontFamily: F.ui, fontSize: 13.5, color: T.taupe }}>{p.date}</td>
                <td style={{ padding: "14px 16px", fontFamily: F.mono, fontSize: 13, color: T.taupe }}>{p.utr}</td>
                <td style={{ padding: "14px 16px", fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.green }}>{p.amt}</td>
                <td style={{ padding: "14px 16px", fontFamily: F.display, fontSize: 14, color: T.crimson }}>{p.ded}</td>
                <td style={{ padding: "14px 16px" }}><span style={{ background: T.greenBg, color: T.green, padding: "3px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 700 }}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
