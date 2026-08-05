import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Receipt, ShoppingBag, Clock } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SumCard, TabTitle, StatusPill, TH, TD } from "../common/primitives";
import { reportsApi } from "../../../../shared/api/reports";

const SOURCE_LABEL: Record<string, string> = { invoice: "Invoice", bulk_order: "Bulk Order" };

function statusTone(status: string): "bad" | "warn" {
  return status === "OVERDUE" ? "bad" : "warn";
}

export function OutstandingPaymentsReport() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "outstanding-payments"],
    queryFn: () => reportsApi.outstandingPayments(),
  });

  const items = data?.items ?? [];
  const invoiceCount = items.filter(i => i.source === "invoice").length;
  const bulkOrderCount = items.filter(i => i.source === "bulk_order").length;

  return (
    <div id="rep-outstanding-payments" style={{ padding: "32px 40px" }}>
      <TabTitle
        title="Outstanding Payments Report"
        sub="Every unpaid or partially-paid invoice and bulk order across all wholesale customers, pulled live from the backend."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32, alignItems: "stretch" }}>
        <SumCard icon={<Wallet size={22} color={T.crimson} />} label="Total Outstanding" value={`₹${(data?.totalOutstanding ?? 0).toLocaleString("en-IN")}`} sub={`${data?.count ?? 0} records`} crimsonHi />
        <SumCard icon={<Receipt size={22} color={T.royalBurgundy} />} label="Unpaid Invoices" value={`${invoiceCount}`} sub="From /invoices" />
        <SumCard icon={<ShoppingBag size={22} color={T.antiqueGold} />} label="Unpaid Bulk Orders" value={`${bulkOrderCount}`} sub="From /bulk-orders" hi />
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={TH}>Source</th>
                  <th style={TH}>Reference</th>
                  <th style={TH}>Customer</th>
                  <th style={{ ...TH, textAlign: "right" }}>Total</th>
                  <th style={{ ...TH, textAlign: "right" }}>Paid</th>
                  <th style={{ ...TH, textAlign: "right" }}>Outstanding</th>
                  <th style={TH}>Due Date</th>
                  <th style={{ ...TH, textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td style={TD} colSpan={8}>Loading…</td></tr>
                )}
                {isError && (
                  <tr><td style={{ ...TD, color: T.crimson }} colSpan={8}>Failed to load the outstanding-payments report.</td></tr>
                )}
                {!isLoading && !isError && items.length === 0 && (
                  <tr><td style={TD} colSpan={8}>Nothing outstanding — every invoice and bulk order is fully paid.</td></tr>
                )}
                {items.map((r, i) => (
                  <tr key={`${r.source}-${r.id}`} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${T.crimson}` }}>
                    <td style={TD}>
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 8px", borderRadius: 5 }}>
                        {SOURCE_LABEL[r.source] ?? r.source}
                      </span>
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.id}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customerName}</span></td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700 }}>₹{r.total.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, color: T.green }}>₹{r.paid.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: T.crimson }}>₹{r.outstanding.toLocaleString("en-IN")}</td>
                    <td style={TD}>
                      {r.dueDate ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Clock size={12} color={T.taupe} />
                          {new Date(r.dueDate).toLocaleDateString("en-IN")}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ ...TD, textAlign: "center" }}><StatusPill label={r.status} type={statusTone(r.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
