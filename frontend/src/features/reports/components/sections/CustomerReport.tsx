import React, { useMemo, useState } from "react";
import { semantic } from "../../../../design-system/tokens";
import { useQuery } from "@tanstack/react-query";
import { UsersRound, CheckCircle2, TrendingUp, ShieldAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { FadeUp, ChartCard, SumCard, TabTitle, ReportDLBar, ChartTip, AnimBar, TablePager, StatusPill, TH, TD } from "../common/primitives";
import { Button, SearchInput } from "../../../../shared/ui/primitives";
import { customersApi, BackendCustomer } from "../../../../shared/api/customers";
import { invoicesApi } from "../../../../shared/api/invoices";
import { salesApi } from "../../../../shared/api/sales";

interface CustomerRow {
  id: string;
  name: string;
  type: "Wholesale" | "Retail";
  phone: string;
  city: string;
  address: string;
  gstCode: string;
  purchases: number;
  spend: number;
  due: number;
  lastPurchase: string;
  status: "Active" | "Overdue";
}

function downloadCustomerData(r: CustomerRow) {
  const rows: string[][] = [
    ["Field", "Value"],
    ["Name", r.name],
    ["Type", r.type],
    ["Phone", r.phone],
    ["Total Purchases", String(r.purchases)],
    ["Total Spend (₹)", String(r.spend)],
    ["Outstanding Due (₹)", String(r.due)],
    ["Last Purchase Date", r.lastPurchase],
    ["Status", r.status],
  ];
  const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${r.name.replace(/\s+/g, "_")}_customer_data.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CustomerReport() {
  const [filter, setFilter] = useState("All Customers");
  const filters = ["All Customers", "Retail Only", "Wholesale Only", "Has Outstanding Dues", "No Purchases This Month"];

  const { data: customersRes, isLoading, isError: customersError } = useQuery({
    queryKey: ["reports", "customers-roster"],
    queryFn: () => customersApi.list(),
  });
  const { data: invoicesRes, isError: invoicesError } = useQuery({
    queryKey: ["reports", "invoices"],
    queryFn: () => invoicesApi.list(),
  });
  const { data: salesRes, isError: salesError } = useQuery({
    queryKey: ["reports", "sales"],
    queryFn: () => salesApi.list(),
  });
  const isError = customersError || invoicesError || salesError;

  const custRows: CustomerRow[] = useMemo(() => {
    const customers = customersRes?.items ?? [];
    const invoices = invoicesRes?.items ?? [];
    const sales = (salesRes?.items ?? []).filter(s => s.channel === "RETAIL");

    return customers.map((c: BackendCustomer) => {
      if (c.type === "WHOLESALE") {
        const custInvoices = invoices.filter(i => i.customerId === c.id);
        const spend = custInvoices.reduce((s, i) => s + Number(i.paid), 0);
        const due = custInvoices.reduce((s, i) => s + (Number(i.total) - Number(i.paid)), 0);
        const dates = custInvoices.map(i => i.invoiceDate).sort();
        return {
          id: c.id, name: c.name, type: "Wholesale" as const, phone: c.phone ?? "—",
          city: c.city ?? "—", address: c.address ?? "—", gstCode: c.gstCode ?? "—",
          purchases: custInvoices.length, spend, due,
          lastPurchase: dates.length > 0 ? new Date(dates[dates.length - 1]).toLocaleDateString("en-IN") : "—",
          status: due > 0 ? "Overdue" as const : "Active" as const,
        };
      }
      const custSales = sales.filter(s => s.customerId === c.id);
      const spend = custSales.reduce((s, sale) => s + Number(sale.amount), 0);
      const dates = custSales.map(s => s.saleDate).sort();
      return {
        id: c.id, name: c.name, type: "Retail" as const, phone: c.phone ?? "—",
        city: c.city ?? "—", address: c.address ?? "—", gstCode: c.gstCode ?? "—",
        purchases: custSales.length, spend, due: 0,
        lastPurchase: dates.length > 0 ? new Date(dates[dates.length - 1]).toLocaleDateString("en-IN") : "—",
        status: "Active" as const,
      };
    });
  }, [customersRes, invoicesRes, salesRes]);

  // Dynamic monthly New vs Returning customer acquisition
  const custMonthly = useMemo(() => {
    const customers = customersRes?.items ?? [];
    const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const newMap: Record<string, number> = {};
    const retMap: Record<string, number> = {};

    for (const c of customers) {
      const d = new Date(c.createdAt);
      if (!isNaN(d.getTime())) {
        const m = d.toLocaleString("en-US", { month: "short" });
        newMap[m] = (newMap[m] || 0) + 1;
      }
    }

    const activeMonths = monthsOrder.filter(m => newMap[m] !== undefined);
    if (activeMonths.length === 0) return [];
    return activeMonths.map(m => ({
      month: m,
      newC: newMap[m] || 0,
      ret: retMap[m] || 0,
    }));
  }, [customersRes]);

  const topCustomers = [...custRows].sort((a, b) => b.spend - a.spend).slice(0, 5).map(c => ({ name: c.name, total: c.spend }));
  const maxTop = topCustomers[0]?.total || 1;
  const wholesaleSpend = custRows.filter(c => c.type === "Wholesale").reduce((s, c) => s + c.spend, 0);
  const retailSpend = custRows.filter(c => c.type === "Retail").reduce((s, c) => s + c.spend, 0);
  const custSplitDonut = [
    { name: "Wholesale", value: wholesaleSpend, color: T.royalBurgundy },
    { name: "Retail",    value: retailSpend,    color: T.antiqueGold },
  ].filter(d => d.value > 0);
  const activeCount = custRows.filter(c => c.purchases > 0).length;
  const overdueCount = custRows.filter(c => c.status === "Overdue").length;
  const now = new Date();
  const newThisMonthCount = (customersRes?.items ?? []).filter(c => {
    const d = new Date(c.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  return (
    <div id="rep-customers" style={{ padding: "32px 40px" }}>
      <TabTitle title="Customer Report"
        sub="See all retail and wholesale customers — their purchase history, total spend, frequency of buying, and any outstanding dues. Find your best customers and track who owes money." />
      <ReportDLBar />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
        <ChartCard title="Top Customers by Total Purchase Value" sub="All-time wholesale + retail combined">
          <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "8px 0" }}>
            {isError && (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson, padding: "8px 0" }}>Failed to load customer purchases.</div>
            )}
            {!isError && topCustomers.length === 0 && (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "8px 0" }}>No customer purchases recorded yet.</div>
            )}
            {!isError && [...topCustomers].sort((a, b) => b.total - a.total).map((c, i) => (
              <div key={c.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{c.name}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.antiqueGold }}>₹{c.total.toLocaleString("en-IN")}</span>
                </div>
                <AnimBar pct={Math.round((c.total / maxTop) * 100)} color={T.antiqueGold} height={7} delay={i * 0.07} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="New vs Returning Customers Each Month" sub="Monthly customer growth">
          {custMonthly.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              No customer records yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={custMonthly} barGap={4}>
                <CartesianGrid key="cust-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
                <XAxis key="cust-x" dataKey="month" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                <YAxis key="cust-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={28} />
                <Tooltip key="cust-tip" content={<ChartTip suffix=" customers" />} />
                <Bar key="cust-new" dataKey="newC" name="New"      fill={T.royalBurgundy} radius={[4,4,0,0] as any} />
                <Bar key="cust-ret" dataKey="ret"  name="Returning" fill={semantic.chart.series[1]}   radius={[4,4,0,0] as any} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Retail vs Wholesale Revenue Split" sub="Revenue contribution">
          {isError ? (
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, padding: "16px 8px" }}>Failed to load revenue split.</div>
          ) : (
          <>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie key="cust-split-pie" data={custSplitDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none" paddingAngle={3}>
                {custSplitDonut.map(e => <Cell key={`cust-cell-${e.name}`} fill={e.color} />)}
              </Pie>
              <Tooltip key="cust-split-tip" formatter={(v: any, n: any) => [`₹${Number(v).toLocaleString("en-IN")}`, n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "0 8px" }}>
            {custSplitDonut.length === 0 && (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>No revenue recorded yet.</div>
            )}
            {custSplitDonut.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: d.color }}>₹{d.value.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
          </>
          )}
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 22, alignItems: "stretch" }}>
        <SumCard icon={<UsersRound size={22} color={T.royalBurgundy} />} label="Total Customers (All Time)" value={`${custRows.length} customers`} sub="Retail + wholesale" />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Active (All Time)" value={`${activeCount} customers`} sub="Made at least one purchase" greenHi />
        <SumCard icon={<TrendingUp size={22} color={T.antiqueGold} />} label="New This Month" value={`${newThisMonthCount} customers`} sub="Added to the roster" hi />
        <SumCard icon={<ShieldAlert size={22} color={T.crimson} />} label="Customers with Dues" value={`${overdueCount} customers`} sub="Outstanding balance" crimsonHi />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
        {filters.map(f => (
          <Button key={f} variant={filter === f ? "primary" : "secondary"} size="sm" onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
        <div style={{ flex: 1, minWidth: 200 }}>
          <SearchInput aria-label="Search by customer name or phone number..." placeholder="Search by customer name or phone number..." />
        </div>
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={TH}>Customer Name</th>
                  <th style={{ ...TH, textAlign: "center" }}>Type</th>
                  <th style={TH}>Phone</th>
                  <th style={{ ...TH, textAlign: "center" }}>Total Purchases</th>
                  <th style={{ ...TH, textAlign: "right" }}>Total Spend</th>
                  <th style={{ ...TH, textAlign: "right" }}>Outstanding Due</th>
                  <th style={TH}>Last Purchase</th>
                  <th style={{ ...TH, textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td style={TD} colSpan={8}>Loading…</td></tr>
                )}
                {isError && (
                  <tr><td style={{ ...TD, color: T.crimson }} colSpan={8}>Failed to load customers.</td></tr>
                )}
                {!isLoading && !isError && custRows.length === 0 && (
                  <tr><td style={TD} colSpan={8}>No customers on record yet.</td></tr>
                )}
                {custRows.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream }}>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.name}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <StatusPill label={r.type} type={r.type === "Wholesale" ? "neutral" : "gold"} />
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.phone}</span></td>
                    <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{r.purchases}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700 }}>₹{r.spend.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: r.due > 0 ? T.crimson : T.green }}>
                      {r.due > 0 ? `₹${r.due.toLocaleString("en-IN")}` : "— Nil"}
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.lastPurchase}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <StatusPill label={r.status} type={r.status === "Active" ? "ok" : "bad"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePager total={custRows.length} showing={custRows.length} />
        </div>
      </FadeUp>

      {/* Individual customer cards — with per-customer download */}
      <FadeUp>
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 12 }}>Customer Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {custRows.map(r => (
              <div key={r.id} style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(74,6,27,0.06)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{r.name}</div>
                  <StatusPill label={r.type} type={r.type === "Wholesale" ? "neutral" : "gold"} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {r.type === "Wholesale" ? (
                    <>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>City: <span style={{ color: T.luxuryBrown }}>{r.city}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Address: <span style={{ color: T.luxuryBrown }}>{r.address}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Phone: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>{r.phone}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>GST Code: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>{r.gstCode}</span></div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Phone: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>{r.phone}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Total Purchases: <span style={{ fontFamily: F.mono, color: T.luxuryBrown, fontWeight: 700 }}>{r.purchases}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Last Purchase: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>{r.lastPurchase}</span></div>
                    </>
                  )}
                </div>
                <DownloadGate>
                  <Button variant="secondary" size="sm" fullWidth onClick={() => downloadCustomerData(r)} className="mt-auto">
                    ↓ Download Data
                  </Button>
                </DownloadGate>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
