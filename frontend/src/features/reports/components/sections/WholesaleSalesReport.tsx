import React, { useMemo } from "react";
import { ReceiptText, Banknote, CheckCircle2, BellRing } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useBulkOrders } from "../../../bulk-orders/contexts/BulkOrderContext";
import { T, F } from "../theme";
import { FadeUp, ChartCard, SumCard, TabTitle, ReportDLBar, ChartTip, AnimBar, TablePager } from "../common/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { semantic } from "../../../../design-system/tokens";
import type { BulkOrder } from "../../../bulk-orders/contexts/BulkOrderContext";
import { StatusPill } from "../../../../shared/ui/domain";
import type { StatusValueOf } from "../../../../lib/domain/status";

// BulkOrder.paymentStatus ("pending" | "partial" | "paid") normalized onto
// the shared payment taxonomy (lib/domain/status.ts) per
// design-system/06-DOMAIN.md Part D.
const PAYMENT_STATUS_KEY: Record<string, StatusValueOf<"payment">> = {
  paid: "paid",
  partial: "partial",
  pending: "unpaid",
};

function WholesaleWeeklyTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>
        {label} — {d.sarees} sarees dispatched — ₹{d.revenue.toLocaleString("en-IN")} revenue
      </span>
    </div>
  );
}

export function WholesaleSalesReport() {
  const { bulkOrders, isError } = useBulkOrders();

  // Dynamic calculation for wholesale weekly breakdown
  const wholesaleWeeklyData = useMemo(() => {
    const weeks = [
      { week: "Week 1", from: 1, to: 7 },
      { week: "Week 2", from: 8, to: 15 },
      { week: "Week 3", from: 16, to: 22 },
      { week: "Week 4", from: 23, to: 31 },
    ];

    return weeks.map(w => {
      let sarees = 0;
      let revenue = 0;

      for (const order of bulkOrders) {
        const d = new Date(order.createdDate);
        if (!isNaN(d.getTime())) {
          const day = d.getDate();
          if (day >= w.from && day <= w.to) {
            sarees += order.done || order.total || 0;
            revenue += order.amountDue || 0;
          }
        }
      }

      return { week: w.week, sarees, revenue };
    });
  }, [bulkOrders]);

  // Dynamic calculation for wholesale monthly revenue (last 6 months)
  const wsMonthlyRev = useMemo(() => {
    const monthsMap: Record<string, number> = {};
    const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (const order of bulkOrders) {
      const d = new Date(order.createdDate);
      if (!isNaN(d.getTime())) {
        const mLabel = d.toLocaleString("en-US", { month: "short" });
        monthsMap[mLabel] = (monthsMap[mLabel] || 0) + (order.amountDue || 0);
      }
    }

    const activeMonths = monthsOrder.filter(m => monthsMap[m] !== undefined);
    if (activeMonths.length === 0) return [];
    return activeMonths.map(m => ({ month: m, rev: monthsMap[m] || 0 }));
  }, [bulkOrders]);

  if (isError) {
    return (
      <div id="rep-wholesale" style={{ padding: "32px 40px" }}>
        <TabTitle title="Wholesale Sales Report" sub="Track all wholesale dispatches, invoices raised, payments received, and outstanding dues from every wholesale customer." />
        <div style={{ padding: "24px", borderRadius: 12, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.22)", color: T.crimson, fontFamily: F.ui, fontSize: 14, fontWeight: 600 }}>
          Failed to load wholesale sales data. Please try again.
        </div>
      </div>
    );
  }

  const maxOutstanding = Math.max(1, ...bulkOrders.map(o => (o.amountDue ?? 0) - (o.amountPaid ?? 0)));
  const wsOutstanding = bulkOrders.map(o => {
    const amt = Math.max(0, (o.amountDue ?? 0) - (o.amountPaid ?? 0));
    return { customer: o.customer, amt, color: amt === 0 ? T.green : (o.status === "overdue" ? T.crimson : T.antiqueGold) };
  });

  const wsInvStatus = (["paid", "partial", "pending"] as const).map(status => ({
    name: status === "paid" ? "Paid" : status === "partial" ? "Partially Paid" : "Pending",
    value: bulkOrders.filter(o => (o.paymentStatus ?? "pending") === status).length,
    color: status === "paid" ? T.green : status === "partial" ? T.antiqueGold : T.crimson,
  })).filter(d => d.value > 0);

  const totalInvoiced = bulkOrders.reduce((s, o) => s + (o.amountDue ?? 0), 0);
  const totalCollected = bulkOrders.reduce((s, o) => s + (o.amountPaid ?? 0), 0);
  const totalOutstanding = totalInvoiced - totalCollected;

  const bulkOrderColumns: ColumnDef<BulkOrder>[] = [
    {
      id: "ref", header: "Bulk Order Ref", accessor: o => o.ref,
      cell: (_v, o) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{o.ref}</span>,
    },
    {
      id: "customer", header: "Customer Name", accessor: o => o.customer,
      cell: (_v, o) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{o.customer}</span>,
    },
    {
      id: "sarees", header: "Sarees", accessor: o => o.total, align: "center",
      cell: (_v, o) => <span style={{ fontFamily: F.mono, fontWeight: 700 }}>{o.total}</span>,
    },
    {
      id: "invoiceAmt", header: "Invoice Amount", accessor: o => o.amountDue ?? 0, type: "number",
      cell: (_v, o) => {
        const invoiceAmt = o.amountDue ?? 0;
        return <span style={{ fontFamily: F.mono, fontWeight: 700 }}>{invoiceAmt > 0 ? `₹${invoiceAmt.toLocaleString("en-IN")}` : "—"}</span>;
      },
    },
    {
      id: "collected", header: "Collected", accessor: o => o.amountPaid ?? 0, type: "number",
      cell: (_v, o) => {
        const collected = o.amountPaid ?? 0;
        return <span style={{ fontFamily: F.mono, color: T.green, fontWeight: 600 }}>{collected > 0 ? `₹${collected.toLocaleString("en-IN")}` : "—"}</span>;
      },
    },
    {
      id: "balance", header: "Balance Due", accessor: o => (o.amountDue ?? 0) - (o.amountPaid ?? 0), type: "number",
      cell: (_v, o) => {
        const balance = (o.amountDue ?? 0) - (o.amountPaid ?? 0);
        return <span style={{ fontFamily: F.mono, fontWeight: 700, color: balance <= 0 ? T.green : T.crimson }}>{balance > 0 ? `₹${balance.toLocaleString("en-IN")}` : "— Paid"}</span>;
      },
    },
    {
      id: "dispatchDate", header: "Dispatch Date", accessor: o => o.dispatchDate,
      cell: (_v, o) => <span style={{ fontFamily: F.mono, fontSize: 12 }}>{o.dispatchDate || "—"}</span>,
    },
    {
      id: "status", header: "Status", accessor: o => o.paymentStatus, type: "status", align: "center",
      cell: (_v, o) => <StatusPill taxonomy="payment" status={PAYMENT_STATUS_KEY[o.paymentStatus ?? "pending"] ?? "unpaid"} />,
    },
  ];

  return (
    <div id="rep-wholesale" style={{ padding: "32px 40px" }}>
      <TabTitle title="Wholesale Sales Report"
        sub="Track all wholesale dispatches, invoices raised, payments received, and outstanding dues from every wholesale customer." />
      <ReportDLBar />

      {/* Weekly sarees dispatched — summary strip + bar chart */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.luxuryBrown }}>Wholesale Sarees Dispatched Each Week</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>Current Month — weekly breakdown</div>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Sarees (All Orders)</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.royalBurgundy }}>{bulkOrders.reduce((s, o) => s + o.total, 0)}</div>
              </div>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Invoiced (All Orders)</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.green }}>₹{totalInvoiced.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={wholesaleWeeklyData}>
              <CartesianGrid key="wsw-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="wsw-x" dataKey="week" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="wsw-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={30} />
              <Tooltip key="wsw-tip" content={<WholesaleWeeklyTooltip />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="wsw-bar" dataKey="sarees" name="Sarees Dispatched" fill={T.royalBurgundy} radius={[6, 6, 0, 0] as any} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
        <ChartCard title="Wholesale Revenue — Last Months" sub="Monthly invoiced amount">
          {wsMonthlyRev.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              No wholesale orders recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={wsMonthlyRev}>
                <CartesianGrid key="ws-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
                <XAxis key="ws-x" dataKey="month" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
                <YAxis key="ws-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} width={55} />
                <Tooltip key="ws-tip" content={<ChartTip prefix="₹" />} />
                <Bar key="ws-rev" dataKey="rev" name="Revenue">
                  {wsMonthlyRev.map((e, i) => <Cell key={`ws-cell-${e.month}`} fill={i === wsMonthlyRev.length - 1 ? semantic.chart.series[0] : "rgba(154,45,74,0.35)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="How Much Each Customer Still Owes" sub="Outstanding balance per customer">
          <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "8px 0" }}>
            {wsOutstanding.length === 0 && (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No bulk orders recorded yet.</div>
            )}
            {wsOutstanding.map((d, i) => (
              <div key={d.customer}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{d.customer}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: d.color }}>{d.amt === 0 ? "Paid ✓" : `₹${d.amt.toLocaleString("en-IN")}`}</span>
                </div>
                <AnimBar pct={d.amt === 0 ? 100 : Math.round((d.amt / maxOutstanding) * 100)} color={d.color} height={6} delay={i * 0.06} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Invoice Status — All Bulk Orders" sub="Live payment status breakdown">
          {wsInvStatus.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No bulk orders recorded yet.</div>
          ) : (
          <>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie key="ws-inv-pie" data={wsInvStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none" paddingAngle={3}>
                {wsInvStatus.map(e => <Cell key={`ws-inv-cell-${e.name}`} fill={e.color} />)}
              </Pie>
              <Tooltip key="ws-inv-tip" formatter={(v: any, n: any) => [`${v} invoices`, n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 8px" }}>
            {wsInvStatus.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
          </>
          )}
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<ReceiptText size={22} color={T.royalBurgundy} />} label="Total Bulk Orders" value={`${bulkOrders.length} orders`} sub="All-time" />
        <SumCard icon={<Banknote size={22} color={T.royalBurgundy} />} label="Total Invoiced Amount" value={`₹${totalInvoiced.toLocaleString("en-IN")}`} sub="Across all customers" />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Total Collected" value={`₹${totalCollected.toLocaleString("en-IN")}`} sub="Payments received" greenHi />
        <SumCard icon={<BellRing size={22} color={T.crimson} />} label="Total Outstanding" value={`₹${Math.max(totalOutstanding, 0).toLocaleString("en-IN")}`} sub="Yet to be collected" crimsonHi />
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <DataTable
              columns={bulkOrderColumns}
              data={bulkOrders}
              getRowId={o => o.ref}
              emptyTitle="No bulk orders recorded yet"
            />
          </div>
          <TablePager total={bulkOrders.length} showing={bulkOrders.length} />
        </div>
      </FadeUp>
    </div>
  );
}
