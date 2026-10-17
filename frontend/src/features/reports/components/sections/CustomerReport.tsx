import React, { useMemo, useState } from "react";
import { semantic } from "../../../../design-system/tokens";
import { useQuery } from "@tanstack/react-query";
import {
  UsersRound,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  BarChart2,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import {
  FadeUp,
  SumCard,
  SectionCard,
  ReportDLBar,
  ChartTip,
  StatusPill,
} from "../common/primitives";
import { CompareStrip, metric, pick } from "../common/compare";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";
import { ChartCard, ChartBand, TrackBar, BAND } from "@/features/production";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { customersApi, BackendCustomer } from "../../../../shared/api/customers";
import { invoicesApi, type BackendInvoice } from "../../../../shared/api/invoices";
import { salesApi, type BackendSaleRecord } from "../../../../shared/api/sales";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { PAYMENT_STATUS, type StatusValueOf } from "@/lib/domain/status";
import { useReportPeriod, useRegisterExport, usePeriodSplit } from "../PeriodContext";
import { downloadWorkbook, exportFilename } from "../export";

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
  /** ISO date of the last purchase in the period, for sorting and the sheet. */
  lastPurchaseAt: string | null;
  // "has an outstanding due, or not" — maps onto PAYMENT_STATUS's "overdue"
  // (has a due) and "paid" (fully settled / no outstanding balance) keys.
  // Rendering still goes through the local `StatusPill` in
  // reports/components/common/primitives.tsx (tone="ok"/"bad", out of this
  // pass's assigned files) rather than the shared domain `<StatusPill>`, but
  // the stored value itself is now a canonical taxonomy key.
  status: StatusValueOf<"payment">;
}

/** One customer's statement for the period: their details, then every purchase. */
function downloadCustomerData(
  r: CustomerRow,
  periodLabel: string,
  invoices: BackendInvoice[],
  sales: BackendSaleRecord[]
) {
  const purchases = [
    ...invoices
      .filter((i) => i.customerId === r.id)
      .map((i) => [
        i.invoiceDate,
        "Invoice",
        i.code ?? i.id,
        Number(i.total),
        Number(i.paid),
        Math.max(0, Number(i.total) - Number(i.paid)),
        i.status,
      ]),
    ...sales
      .filter((x) => x.customerId === r.id)
      .map((x) => [
        x.saleDate,
        x.channel === "WHOLESALE" ? "Counter sale" : "Retail sale",
        x.saleRef,
        Number(x.amount),
        Number(x.amount),
        0,
        "Paid",
      ]),
  ];
  downloadWorkbook(exportFilename(`${r.name} Customer Statement`, periodLabel), [
    {
      name: "Customer",
      preamble: [[`${r.name} — Customer Statement`], ["Period", periodLabel]],
      headers: ["Field", "Value"],
      rows: [
        ["Name", r.name],
        ["Type", r.type],
        ["Phone", r.phone],
        ["City", r.city],
        ["Address", r.address],
        ["GST Code", r.gstCode],
        ["Purchases in period", r.purchases],
        ["Total spend (INR)", r.spend],
        ["Outstanding due (INR)", r.due],
        ["Last purchase", r.lastPurchase],
        ["Status", PAYMENT_STATUS[r.status].label],
      ],
    },
    {
      name: "Purchases",
      headers: ["Date", "Type", "Reference", "Amount", "Paid", "Due", "Status"],
      columns: ["date", "text", "text", "money", "money", "money", "text"],
      totals: true,
      rows: purchases.sort((a, b) => String(b[0]).localeCompare(String(a[0]))),
    },
  ]);
}

const CARDS_PAGE_SIZE = 9;

/** Per-customer figures for one window. */
function buildCustomerRows(
  customers: BackendCustomer[],
  invoices: BackendInvoice[],
  sales: BackendSaleRecord[]
): CustomerRow[] {
  const invoicesByCustomer = new Map<string, BackendInvoice[]>();
  for (const i of invoices) {
    const list = invoicesByCustomer.get(i.customerId);
    if (list) list.push(i);
    else invoicesByCustomer.set(i.customerId, [i]);
  }
  const salesByCustomer = new Map<string, BackendSaleRecord[]>();
  for (const x of sales) {
    if (!x.customerId) continue;
    const list = salesByCustomer.get(x.customerId);
    if (list) list.push(x);
    else salesByCustomer.set(x.customerId, [x]);
  }
  const lastOf = (dates: string[]) =>
    dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;

  return customers.map((c) => {
    const base = {
      id: c.id,
      name: c.name,
      phone: c.phone ?? "—",
      city: c.city ?? "—",
      address: c.address ?? "—",
      gstCode: c.gstCode ?? "—",
    };
    if (c.type === "WHOLESALE") {
      const custInvoices = invoicesByCustomer.get(c.id) ?? [];
      const counterSales = salesByCustomer.get(c.id) ?? [];
      // "Total Spend" is what the customer bought: invoiced value plus counter
      // sales (paid on the spot). Summing `paid` instead reported only what
      // they had settled so far, so a customer's spend shrank as dues grew.
      const spend =
        custInvoices.reduce((s, i) => s + Number(i.total), 0) +
        counterSales.reduce((s, x) => s + Number(x.amount), 0);
      const due = custInvoices.reduce(
        (s, i) => s + Math.max(0, Number(i.total) - Number(i.paid)),
        0
      );
      const last = lastOf([
        ...custInvoices.map((i) => i.invoiceDate),
        ...counterSales.map((x) => x.saleDate),
      ]);
      return {
        ...base,
        type: "Wholesale" as const,
        purchases: custInvoices.length + counterSales.length,
        spend,
        due,
        lastPurchase: last ? new Date(last).toLocaleDateString("en-IN") : "—",
        lastPurchaseAt: last,
        status: due > 0 ? ("overdue" as const) : ("paid" as const),
      };
    }
    const custSales = salesByCustomer.get(c.id) ?? [];
    const last = lastOf(custSales.map((x) => x.saleDate));
    return {
      ...base,
      type: "Retail" as const,
      purchases: custSales.length,
      spend: custSales.reduce((s, x) => s + Number(x.amount), 0),
      due: 0,
      lastPurchase: last ? new Date(last).toLocaleDateString("en-IN") : "—",
      lastPurchaseAt: last,
      status: "paid" as const,
    };
  });
}

function summarise(rows: CustomerRow[], newCustomers: number) {
  return {
    active: rows.filter((r) => r.purchases > 0).length,
    repeat: rows.filter((r) => r.purchases > 1).length,
    spend: rows.reduce((s, r) => s + r.spend, 0),
    withDues: rows.filter((r) => r.due > 0).length,
    dues: rows.reduce((s, r) => s + r.due, 0),
    newCustomers,
  };
}

export function CustomerReport() {
  const [filter, setFilter] = useState("All Customers");
  const [search, setSearch] = useState("");
  const filters = [
    "All Customers",
    "Retail Only",
    "Wholesale Only",
    "Has Outstanding Dues",
    "No Purchases This Month",
  ];
  const { current, compareActive, label: periodLabel } = useReportPeriod();

  const {
    data: customersRes,
    isLoading,
    isError: customersError,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["reports", "customers-roster"],
    queryFn: () => customersApi.list(),
  });
  const {
    data: invoicesRes,
    isError: invoicesError,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ["reports", "invoices"],
    queryFn: () => invoicesApi.list(),
  });
  const {
    data: salesRes,
    isError: salesError,
    refetch: refetchSales,
  } = useQuery({
    // Every sale, not the first page of 100 — shared with the Retail tab.
    queryKey: ["reports", "sales-all"],
    queryFn: () => salesApi.listAll(),
  });
  const isError = customersError || invoicesError || salesError;
  const refetchAll = () => {
    void refetchCustomers();
    void refetchInvoices();
    void refetchSales();
  };

  const invoiceSplit = usePeriodSplit(invoicesRes?.items, (i) => i.invoiceDate);
  // Both channels: a wholesale customer buying at the counter gets a
  // WHOLESALE sale record and no invoice, so their spend needs both.
  const saleSplit = usePeriodSplit(salesRes, (x) => x.saleDate);
  const joinedSplit = usePeriodSplit(customersRes?.items, (c) => c.createdAt);

  const custRows: CustomerRow[] = useMemo(
    () => buildCustomerRows(customersRes?.items ?? [], invoiceSplit.cur, saleSplit.cur),
    [customersRes, invoiceSplit, saleSplit]
  );
  const priorRows: CustomerRow[] | null = useMemo(
    () =>
      compareActive
        ? buildCustomerRows(customersRes?.items ?? [], invoiceSplit.prev, saleSplit.prev)
        : null,
    [compareActive, customersRes, invoiceSplit, saleSplit]
  );

  // Dynamic monthly New vs Returning customer acquisition
  const custMonthly = useMemo(() => {
    // "Returning" was hard-coded to an always-empty series, so the second bar
    // never rendered under its own legend. It is now real: customers who
    // bought in a month but joined before it. Buckets are keyed by year+month
    // so the same month in different years no longer merges.
    const customers = customersRes?.items ?? [];
    const invoices = invoicesRes?.items ?? [];
    const sales = salesRes ?? [];

    const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const labelOf = (d: Date) =>
      d.toLocaleString("en-US", { month: "short", year: "2-digit" }).replace(" ", " '");
    const map = new Map<string, { month: string; newC: number; ret: number }>();
    const bucket = (d: Date) => {
      const entry = map.get(keyOf(d)) ?? { month: labelOf(d), newC: 0, ret: 0 };
      map.set(keyOf(d), entry);
      return entry;
    };

    const joinedKeyById = new Map<string, string>();
    for (const c of customers) {
      const d = new Date(c.createdAt);
      if (isNaN(d.getTime())) continue;
      joinedKeyById.set(c.id, keyOf(d));
      bucket(d).newC += 1;
    }

    // One "returning" tick per customer per month they transacted in, counted
    // only for months after the one they joined in.
    const seen = new Set<string>();
    const purchases: { customerId: string | null | undefined; date: string }[] = [
      ...invoices.map((i) => ({ customerId: i.customerId, date: i.invoiceDate })),
      ...sales.map((sale) => ({ customerId: sale.customerId, date: sale.saleDate })),
    ];
    for (const pr of purchases) {
      if (!pr.customerId) continue;
      const d = new Date(pr.date);
      if (isNaN(d.getTime())) continue;
      const k = keyOf(d);
      const joined = joinedKeyById.get(pr.customerId);
      if (!joined || joined >= k) continue;
      const dedupe = `${pr.customerId}::${k}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      bucket(d).ret += 1;
    }

    // Only the months the selected period covers.
    const fromKey = current ? keyOf(current.from) : "";
    const toKey = current ? keyOf(new Date(current.to.getTime() - 1)) : "9999-99";
    return Array.from(map.entries())
      .filter(([k]) => k >= fromKey && k <= toKey)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v);
  }, [customersRes, invoicesRes, salesRes, current]);

  // Last purchase per customer, from *unfiltered* transactions: the
  // "No Purchases This Month" filter asks about this calendar month
  // regardless of which period the page is scoped to.
  const lastPurchaseDateById = useMemo(() => {
    const map = new Map<string, Date>();
    const note = (id: string | null | undefined, raw: string) => {
      if (!id) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const prev = map.get(id);
      if (!prev || d > prev) map.set(id, d);
    };
    for (const i of invoicesRes?.items ?? []) note(i.customerId, i.invoiceDate);
    for (const sale of salesRes ?? []) note(sale.customerId, sale.saleDate);
    return map;
  }, [invoicesRes, salesRes]);

  // The dropdown's value was stored but never read, and the search box had no
  // value/onChange at all — the table always rendered every customer.
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    return custRows.filter((r) => {
      if (filter === "Retail Only" && r.type !== "Retail") return false;
      if (filter === "Wholesale Only" && r.type !== "Wholesale") return false;
      if (filter === "Has Outstanding Dues" && r.due <= 0) return false;
      if (filter === "No Purchases This Month") {
        const last = lastPurchaseDateById.get(r.id);
        if (last && last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth())
          return false;
      }
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q);
    });
  }, [custRows, filter, search, lastPurchaseDateById]);

  const cur = useMemo(() => summarise(custRows, joinedSplit.cur.length), [custRows, joinedSplit]);
  const pri = useMemo(
    () => (priorRows ? summarise(priorRows, joinedSplit.prev.length) : null),
    [priorRows, joinedSplit]
  );
  const metrics = useMemo(
    () => [
      metric("active", "Customers who bought", "count", cur.active, pri?.active),
      metric("repeat", "Bought more than once", "count", cur.repeat, pri?.repeat),
      metric("new", "New customers", "count", cur.newCustomers, pri?.newCustomers),
      metric("spend", "Total purchases", "money", cur.spend, pri?.spend),
      metric("withDues", "Customers with dues", "count", cur.withDues, pri?.withDues, "down"),
      metric("dues", "Dues on period invoices", "money", cur.dues, pri?.dues, "down"),
    ],
    [cur, pri]
  );

  useRegisterExport(
    useMemo(
      () => ({
        name: "Customer Report",
        sheetName: "Customers",
        columns: [
          "text",
          "text",
          "text",
          "text",
          "text",
          "number",
          "money",
          "money",
          "date",
          "text",
        ],
        totals: true,
        headers: [
          "Customer Name",
          "Type",
          "Phone",
          "City",
          "GST Code",
          "Total Purchases",
          "Total Spend",
          "Outstanding Due",
          "Last Purchase",
          "Status",
        ],
        rows: visibleRows.map((r) => [
          r.name,
          r.type,
          r.phone,
          r.city,
          r.gstCode,
          r.purchases,
          r.spend,
          r.due,
          r.lastPurchaseAt,
          PAYMENT_STATUS[r.status].label,
        ]),
        extraSheets: [
          {
            name: "Purchases",
            headers: ["Date", "Customer", "Type", "Reference", "Amount", "Paid", "Due"],
            columns: ["date", "text", "text", "text", "money", "money", "money"],
            totals: true,
            rows: [
              ...invoiceSplit.cur.map((i) => [
                i.invoiceDate,
                i.customer?.name ?? "—",
                "Wholesale invoice",
                i.code ?? i.id,
                Number(i.total),
                Number(i.paid),
                Math.max(0, Number(i.total) - Number(i.paid)),
              ]),
              ...saleSplit.cur.map((x) => [
                x.saleDate,
                x.customer?.name ?? "Walk-in Customer",
                x.channel === "WHOLESALE" ? "Wholesale counter sale" : "Retail sale",
                x.saleRef,
                Number(x.amount),
                Number(x.amount),
                0,
              ]),
            ].sort((a, b) => String(b[0]).localeCompare(String(a[0]))),
          },
        ],
        metrics,
        ready: !isLoading,
      }),
      [visibleRows, invoiceSplit, saleSplit, metrics, isLoading]
    )
  );

  const cardsPager = usePagination(visibleRows, CARDS_PAGE_SIZE);

  const topCustomers = [...visibleRows]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5)
    .map((c) => ({ name: c.name, total: c.spend }));
  const maxTop = topCustomers[0]?.total || 1;
  const wholesaleSpend = visibleRows
    .filter((c) => c.type === "Wholesale")
    .reduce((s, c) => s + c.spend, 0);
  const retailSpend = visibleRows
    .filter((c) => c.type === "Retail")
    .reduce((s, c) => s + c.spend, 0);
  const custSplitDonut = [
    { name: "Wholesale", value: wholesaleSpend, color: T.royalBurgundy },
    { name: "Retail", value: retailSpend, color: T.antiqueGold },
  ].filter((d) => d.value > 0);
  const activeCount = visibleRows.filter((c) => c.purchases > 0).length;
  const overdueCount = visibleRows.filter((c) => c.status === "overdue").length;

  const customerColumns: ColumnDef<CustomerRow>[] = [
    {
      id: "name",
      header: "Customer Name",
      accessor: (r) => r.name,
      priority: 1,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.name}</span>,
    },
    {
      id: "type",
      header: "Type",
      accessor: (r) => r.type,
      align: "center",
      cell: (_v, r) => (
        <StatusPill label={r.type} type={r.type === "Wholesale" ? "neutral" : "gold"} />
      ),
    },
    {
      id: "phone",
      header: "Phone",
      accessor: (r) => r.phone,
      priority: 3,
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
          {r.phone}
        </span>
      ),
    },
    {
      id: "purchases",
      header: "Total Purchases",
      accessor: (r) => r.purchases,
      align: "center",
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{r.purchases}</span>
      ),
    },
    {
      id: "spend",
      header: "Total Spend",
      accessor: (r) => r.spend,
      align: "end",
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
          <Money value={rupees(r.spend)} />
        </span>
      ),
    },
    {
      id: "due",
      header: "Outstanding Due",
      accessor: (r) => r.due,
      align: "end",
      cell: (_v, r) => (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color: r.due > 0 ? T.crimson : T.green,
          }}
        >
          {r.due > 0 ? <Money value={rupees(r.due)} /> : "— Nil"}
        </span>
      ),
    },
    {
      id: "lastPurchase",
      header: "Last Purchase",
      accessor: (r) => r.lastPurchase,
      priority: 3,
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
          {r.lastPurchase}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: (r) => r.status,
      align: "center",
      type: "status",
      cell: (_v, r) => (
        <StatusPill
          label={PAYMENT_STATUS[r.status].label}
          type={r.status === "paid" ? "ok" : "bad"}
        />
      ),
    },
  ];

  return (
    <div id="rep-customers" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
      <SectionCard
        icon={UsersRound}
        title="Customer Report"
        subtitle="See all retail and wholesale customers — their purchase history, total spend, frequency of buying, and any outstanding dues. Find your best customers and track who owes money."
      >
        <ReportDLBar />
        <CompareStrip metrics={metrics} />

        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          style={{ gap: 20, marginBottom: 24, alignItems: "stretch" }}
        >
          <ChartCard>
            <ChartBand
              tone="weavers"
              icon={<UsersRound size={19} color={BAND.weavers.icon} />}
              title="Top Customers by Total Purchase Value"
              sub={`${periodLabel} — wholesale + retail combined`}
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "8px 0" }}>
                {isError && (
                  <div
                    style={{
                      fontFamily: F.ui,
                      fontSize: 13,
                      color: T.crimson,
                      padding: "8px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <span>Failed to load customer purchases.</span>
                    <Button variant="danger-subtle" size="sm" onClick={refetchAll}>
                      Retry
                    </Button>
                  </div>
                )}
                {!isError && topCustomers.length === 0 && (
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "8px 0" }}>
                    No customer purchases in {periodLabel}.
                  </div>
                )}
                {!isError &&
                  [...topCustomers]
                    .sort((a, b) => b.total - a.total)
                    .map((c, i) => (
                      <div key={c.name}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>
                            {c.name}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              fontWeight: 700,
                              color: T.antiqueGold,
                            }}
                          >
                            {formatMoney(rupees(c.total))}
                          </span>
                        </div>
                        <TrackBar
                          pct={Math.round((c.total / maxTop) * 100)}
                          fill={semantic.chart.series[1]}
                          height={9}
                          delay={i * 0.08}
                        />
                      </div>
                    ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard>
            <ChartBand
              tone="output"
              icon={<BarChart2 size={19} color={BAND.output.icon} />}
              title="New vs Returning Customers Each Month"
              sub={`Monthly customer growth — ${periodLabel}`}
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              {custMonthly.length === 0 ? (
                <div
                  style={{
                    padding: "40px 0",
                    textAlign: "center" as const,
                    fontFamily: F.ui,
                    fontSize: 13,
                    color: T.taupe,
                  }}
                >
                  No customer records yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={custMonthly} barGap={4}>
                    <CartesianGrid
                      key="cust-grid"
                      strokeDasharray="3 3"
                      stroke="rgba(110,15,45,0.07)"
                      vertical={false}
                    />
                    <XAxis
                      key="cust-x"
                      dataKey="month"
                      tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      key="cust-y"
                      tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip key="cust-tip" content={<ChartTip suffix=" customers" />} />
                    <Bar
                      key="cust-new"
                      dataKey="newC"
                      name="New"
                      fill={T.royalBurgundy}
                      radius={[4, 4, 0, 0] as [number, number, number, number]}
                    />
                    <Bar
                      key="cust-ret"
                      dataKey="ret"
                      name="Returning"
                      fill={semantic.chart.series[1]}
                      radius={[4, 4, 0, 0] as [number, number, number, number]}
                      opacity={0.7}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          <ChartCard>
            <ChartBand
              tone="pipeline"
              icon={<PieChartIcon size={19} color={BAND.pipeline.icon} />}
              title="Retail vs Wholesale Revenue Split"
              sub="Revenue contribution"
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              {isError ? (
                <div
                  style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, padding: "16px 8px" }}
                >
                  Failed to load revenue split.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        key="cust-split-pie"
                        data={custSplitDonut}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        dataKey="value"
                        stroke="none"
                        paddingAngle={3}
                      >
                        {custSplitDonut.map((e) => (
                          <Cell key={`cust-cell-${e.name}`} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        key="cust-split-tip"
                        formatter={(v: number | string, n: React.ReactNode) => [
                          formatMoney(rupees(Number(v))),
                          n,
                        ]}
                        contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 7, padding: "0 8px" }}
                  >
                    {custSplitDonut.length === 0 && (
                      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                        No revenue recorded yet.
                      </div>
                    )}
                    {custSplitDonut.map((d) => (
                      <div
                        key={d.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div
                            style={{
                              width: 9,
                              height: 9,
                              borderRadius: "50%",
                              background: d.color,
                            }}
                          />
                          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                            {d.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            fontWeight: 700,
                            color: d.color,
                          }}
                        >
                          {formatMoney(rupees(d.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </ChartCard>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-4"
          style={{ gap: 16, marginBottom: 22, alignItems: "stretch" }}
        >
          <SumCard
            icon={<UsersRound size={22} color={T.royalBurgundy} />}
            label="Customers Shown"
            value={`${visibleRows.length} customers`}
            sub="Retail + wholesale"
          />
          <SumCard
            icon={<CheckCircle2 size={22} color={T.green} />}
            label="Active"
            value={`${activeCount} customers`}
            sub={`Bought at least once in ${periodLabel}`}
            greenHi
            delta={
              filter === "All Customers" && !search.trim() ? pick(metrics, "active") : undefined
            }
          />
          <SumCard
            icon={<TrendingUp size={22} color={T.antiqueGold} />}
            label={current ? "New Customers" : "Customers on Roster"}
            value={`${current ? cur.newCustomers : (customersRes?.items.length ?? 0)} customers`}
            sub={current ? `Joined in ${periodLabel}` : "Every customer on record"}
            hi
            delta={current ? pick(metrics, "new") : undefined}
          />
          <SumCard
            icon={<ShieldAlert size={22} color={T.crimson} />}
            label="Customers with Dues"
            value={`${overdueCount} customers`}
            sub="Unpaid on invoices in this period"
            crimsonHi
            delta={
              filter === "All Customers" && !search.trim() ? pick(metrics, "withDues") : undefined
            }
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap" as const,
          }}
        >
          <Select
            size="sm"
            value={filter}
            onValueChange={setFilter}
            containerClassName="w-auto shrink-0"
            className="w-[185px] font-semibold text-[13px]"
          >
            {filters.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </Select>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput
              aria-label="Search by customer name or phone number..."
              placeholder="Search by customer name or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <FadeUp>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              border: `1px solid ${T.borderDef}`,
              overflow: "hidden",
              boxShadow: "0 2px 14px rgba(74,6,27,0.06)",
            }}
          >
            <div className="w-full">
              <div className="min-w-[900px]">
                <DataTable
                  responsive={false}
                  columns={customerColumns}
                  data={visibleRows}
                  getRowId={(r) => r.id}
                  loading={isLoading}
                  error={!!isError}
                  onRetry={refetchAll}
                  emptyTitle="No customers match this filter."
                  pagination
                  itemLabel="customers"
                />
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Individual customer cards — with per-customer download */}
        <FadeUp>
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 18,
                color: T.luxuryBrown,
                marginBottom: 12,
              }}
            >
              Customer Details
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: "-6px 0 12px" }}>
              Per-customer statement for {periodLabel}
              {visibleRows.length > 0 ? ` · ${visibleRows.length} customers` : ""}
            </div>
            {visibleRows.length === 0 && (
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, padding: "8px 0" }}>
                No customers match this filter.
              </div>
            )}
            <div
              id="customer-detail-cards"
              className="grid grid-cols-1 md:grid-cols-3"
              style={{ gap: 16 }}
            >
              {cardsPager.pageItems.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 14,
                    border: `1px solid ${T.borderDef}`,
                    boxShadow: "0 2px 14px rgba(74,6,27,0.06)",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: F.ui,
                        fontWeight: 700,
                        fontSize: 14,
                        color: T.luxuryBrown,
                      }}
                    >
                      {r.name}
                    </div>
                    <StatusPill label={r.type} type={r.type === "Wholesale" ? "neutral" : "gold"} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {r.type === "Wholesale" ? (
                      <>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                          City: <span style={{ color: T.luxuryBrown }}>{r.city}</span>
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                          Address: <span style={{ color: T.luxuryBrown }}>{r.address}</span>
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                          Phone:{" "}
                          <span style={{ fontFamily: "var(--font-mono)", color: T.luxuryBrown }}>
                            {r.phone}
                          </span>
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                          GST Code:{" "}
                          <span style={{ fontFamily: "var(--font-mono)", color: T.luxuryBrown }}>
                            {r.gstCode}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                          Phone:{" "}
                          <span style={{ fontFamily: "var(--font-mono)", color: T.luxuryBrown }}>
                            {r.phone}
                          </span>
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                          Total Purchases:{" "}
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              color: T.luxuryBrown,
                              fontWeight: 700,
                            }}
                          >
                            {r.purchases}
                          </span>
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                          Last Purchase:{" "}
                          <span style={{ fontFamily: "var(--font-mono)", color: T.luxuryBrown }}>
                            {r.lastPurchase}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <DownloadGate>
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() =>
                        downloadCustomerData(r, periodLabel, invoiceSplit.cur, saleSplit.cur)
                      }
                      className="mt-auto"
                    >
                      ↓ Download Statement (Excel)
                    </Button>
                  </DownloadGate>
                </div>
              ))}
            </div>
            {visibleRows.length > CARDS_PAGE_SIZE && (
              <div style={{ marginTop: 16 }}>
                <Pagination
                  page={cardsPager.page}
                  pageCount={cardsPager.pageCount}
                  total={cardsPager.total}
                  pageSize={cardsPager.pageSize}
                  start={cardsPager.start}
                  onPageChange={cardsPager.setPage}
                  itemLabel="customers"
                  targetId="customer-detail-cards"
                />
              </div>
            )}
          </div>
        </FadeUp>
      </SectionCard>
    </div>
  );
}
