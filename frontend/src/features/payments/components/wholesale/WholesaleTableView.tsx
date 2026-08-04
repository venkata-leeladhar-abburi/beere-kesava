import React from "react";
import { Eye, MapPin } from "lucide-react";
import { F, T } from "../../theme";
import { Invoice } from "../../types";
import { INV_STATUS_CFG, InvBadge } from "./InvBadge";

interface WholesaleTableViewProps {
  view: "list" | "table";
  filtered: Invoice[];
  setViewInvoice: (inv: Invoice) => void;
  setRecordPayment: (inv: Invoice) => void;
}

export function WholesaleTableView({ view, filtered, setViewInvoice, setRecordPayment }: WholesaleTableViewProps) {
  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.taupe, textTransform: "uppercase" as const, letterSpacing: "0.7px", padding: "12px 16px", textAlign: "left" as const, background: T.warmCream, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "14px 16px", verticalAlign: "middle" as const, borderBottom: `1px solid ${T.borderDef}`, whiteSpace: "nowrap" as const };

  if (view === "list") {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 32, boxShadow: "0 4px 20px rgba(74,6,27,0.05)" }}>
        {filtered.map((inv, i) => {
          const rem = inv.total - inv.paid;
          return (
            <div
              key={inv.id}
              style={{
                display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
                background: i % 2 === 0 ? "#FFFDF9" : T.silkCream,
                borderBottom: i < filtered.length - 1 ? `1px solid ${T.borderDef}` : "none",
                borderLeft: `4px solid ${INV_STATUS_CFG[inv.status].color}`,
                transition: "background-color 0.15s ease",
              }}
            >
              <div style={{ flex: "0 0 130px" }}>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: "rgba(110,15,45,0.06)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>{inv.id}</span>
              </div>
              <div style={{ flex: "0 0 230px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{inv.customer}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>
                  <MapPin size={12} />{inv.city}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Invoice Total</div>
                <div style={{ fontFamily: F.mono, fontSize: 14, color: T.luxuryBrown, fontWeight: 700 }}>₹{inv.total.toLocaleString("en-IN")}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Remaining Due</div>
                <div style={{ fontFamily: F.mono, fontSize: 13, color: rem === 0 ? T.green : T.crimson, fontWeight: 700 }}>
                  {rem === 0 ? "Paid ✓" : `₹${rem.toLocaleString("en-IN")}`}
                </div>
              </div>
              <div style={{ flex: "0 0 130px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Due Date</div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: inv.status === "Overdue" ? T.crimson : T.luxuryBrown, fontWeight: inv.status === "Overdue" ? 700 : 500 }}>{inv.dueDate}</div>
              </div>
              <div style={{ flex: "0 0 150px" }}>
                <InvBadge status={inv.status} />
              </div>
              <button
                onClick={() => setViewInvoice(inv)}
                style={{
                  padding: "7px 14px", border: `1.5px solid rgba(110,15,45,0.12)`, borderRadius: 8,
                  background: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                  color: T.royalBurgundy, cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(110,15,45,0.04)"; e.currentTarget.style.borderColor = T.royalBurgundy; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(110,15,45,0.12)"; }}
              >
                View
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)", marginBottom: 32 }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
          <thead>
            <tr>
              <th style={TH}>Invoice ID</th>
              <th style={TH}>Customer</th>
              <th style={TH}>City</th>
              <th style={TH}>Invoice Date</th>
              <th style={TH}>Due Date</th>
              <th style={{ ...TH, textAlign: "right" as const }}>Total Amount</th>
              <th style={{ ...TH, textAlign: "right" as const }}>Paid Amount</th>
              <th style={{ ...TH, textAlign: "right" as const }}>Remaining Due</th>
              <th style={{ ...TH, textAlign: "center" as const }}>Status</th>
              <th style={{ ...TH, textAlign: "center" as const }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, i) => {
              const rem = inv.total - inv.paid;
              return (
                <tr key={inv.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${INV_STATUS_CFG[inv.status].color}` }}>
                  <td style={TD}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{inv.id}</span>
                  </td>
                  <td style={TD}>
                    <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{inv.customer}</span>
                  </td>
                  <td style={TD}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.taupe, fontSize: 13 }}>
                      <MapPin size={12} />{inv.city}
                    </div>
                  </td>
                  <td style={TD}>{inv.invoiceDate}</td>
                  <td style={{ ...TD, color: inv.status === "Overdue" ? T.crimson : T.luxuryBrown, fontWeight: inv.status === "Overdue" ? 700 : 400 }}>
                    {inv.dueDate}
                    {inv.daysOverdue && <span style={{ fontFamily: F.mono, fontSize: 12, marginLeft: 6, background: "rgba(192,57,43,0.10)", color: T.crimson, padding: "1px 6px", borderRadius: 5 }}>{inv.daysOverdue}d late</span>}
                  </td>
                  <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14 }}>₹{inv.total.toLocaleString("en-IN")}</td>
                  <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 600, fontSize: 13, color: T.green }}>₹{inv.paid.toLocaleString("en-IN")}</td>
                  <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: rem === 0 ? T.green : inv.status === "Overdue" ? T.crimson : T.antiqueGold }}>
                    {rem === 0 ? "Paid ✓" : `₹${rem.toLocaleString("en-IN")}`}
                  </td>
                  <td style={{ ...TD, textAlign: "center" as const }}><InvBadge status={inv.status} /></td>
                  <td style={{ ...TD, textAlign: "center" as const }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button
                        onClick={() => setViewInvoice(inv)}
                        style={{
                          padding: "6px 12px", border: `1.5px solid rgba(110,15,45,0.12)`, borderRadius: 8,
                          background: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                          color: T.royalBurgundy, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(110,15,45,0.04)"; e.currentTarget.style.borderColor = T.royalBurgundy; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(110,15,45,0.12)"; }}
                      >
                        <Eye size={12} /> View
                      </button>
                      {inv.status !== "Paid" && (
                        <button
                          onClick={() => setRecordPayment(inv)}
                          style={{
                            padding: "6px 14px", background: T.royalBurgundy, color: "#FFFDF9",
                            border: "none", borderRadius: 8, fontFamily: F.ui, fontSize: 12, fontWeight: 700,
                            cursor: "pointer", transition: "all 0.2s ease"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = T.deepWine; }}
                          onMouseLeave={e => { e.currentTarget.style.background = T.royalBurgundy; }}
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: T.warmCream, borderTop: `2px solid ${T.borderDef}` }}>
              <td colSpan={5} style={{ ...TD, fontFamily: F.ui, fontWeight: 700, color: T.luxuryBrown, fontSize: 13 }}>
                Totals — {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
              </td>
              <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>
                ₹{filtered.reduce((s, inv) => s + inv.total, 0).toLocaleString("en-IN")}
              </td>
              <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 13, color: T.green }}>
                ₹{filtered.reduce((s, inv) => s + inv.paid, 0).toLocaleString("en-IN")}
              </td>
              <td style={{ ...TD, textAlign: "right" as const, fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.crimson }}>
                ₹{filtered.reduce((s, inv) => s + (inv.total - inv.paid), 0).toLocaleString("en-IN")}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
