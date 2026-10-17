import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReceiptText, Banknote, CheckCircle2, BellRing, Boxes } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { useBulkOrders } from "@/features/bulk-orders";
import { T, F } from "../theme";
import { FadeUp, SilkSumCard, SectionCard, ReportDLBar } from "../common/primitives";
import { CompareStrip, metric, pick } from "../common/compare";
import { TrendChart } from "../common/TrendChart";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import { ChartCard, ChartBand, TrackBar, BAND } from "@/features/production";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";
import type { BulkOrder } from "@/features/bulk-orders";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money, StatusPill } from "@/shared/ui/domain";
import { useReportPeriod, useRegisterExport, usePeriodSplit } from "../PeriodContext";
import { buildSeries, bucketPhrase } from "../timeSeries";
import type { StatusValueOf } from "@/lib/domain/status";
import { salesApi, type BackendSaleRecord } from "../../../../shared/api/sales";

/** Wholesale counter sales — paid at the counter, no dispatch or invoice. */
function summariseCounter(sales: BackendSaleRecord[]) {
  return {
    count: sales.length,
    value: sales.reduce((s, x) => s + Number(x.amount), 0),
    customers: new Set(sales.map((x) => x.customerId)).size,
  };
}

// BulkOrder.paymentStatus ("pending" | "partial" | "paid") normalized onto
// the shared payment taxonomy (lib/domain/status.ts) per
// design-system/06-DOMAIN.md Part D.
const PAYMENT_STATUS_KEY: Record<string, StatusValueOf<"payment">> = {
  paid: "paid",
  partial: "partial",
  pending: "unpaid",
};

const DISPATCH_LABEL: Record<string, string> = {
  pending: "Not dispatched",
  dispatched: "Dispatched",
  invoiced: "Invoiced",
};

const balanceOf = (o: BulkOrder) => Math.max(0, (o.amountDue ?? 0) - (o.amountPaid ?? 0));

const fmtDay = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

function summarise(orders: BulkOrder[]) {
  const invoiced = orders.reduce((s, o) => s + (o.amountDue ?? 0), 0);
  const collected = orders.reduce((s, o) => s + (o.amountPaid ?? 0), 0);
  return {
    orders: orders.length,
    ordered: orders.reduce((s, o) => s + (o.total ?? 0), 0),
    dispatched: orders.reduce((s, o) => s + (o.done ?? 0), 0),
    invoiced,
    collected,
    outstanding: orders.reduce((s, o) => s + balanceOf(o), 0),
    customers: new Set(orders.map((o) => o.customerId ?? o.customer)).size,
    collectedPct: invoiced > 0 ? (collected / invoiced) * 100 : 0,
  };
}

const OWES_PAGE_SIZE = 8;

export function WholesaleSalesReport() {
  const { bulkOrders: allBulkOrders, isError, isLoading, refetch } = useBulkOrders();
  const {
    current,
    prior,
    compareActive,
    label: periodLabel,
    compareLabel,
    priorLabel,
  } = useReportPeriod();

  const split = usePeriodSplit(allBulkOrders, (o) => o.createdDate);

  // Counter sales to wholesale customers are SaleRecords with no dispatch or
  // invoice behind them, so no bulk-order figure includes them. Same cache as
  // the Retail and Customer tabs.
  const { data: allSales, isLoading: salesLoading } = useQuery({
    queryKey: ["reports", "sales-all"],
    queryFn: () => salesApi.listAll(),
  });
  const counterAll = useMemo(
    () => (allSales ?? []).filter((x) => x.channel === "WHOLESALE"),
    [allSales]
  );
  const counterSplit = usePeriodSplit(counterAll, (x) => x.saleDate);
  const counterCur = useMemo(() => summariseCounter(counterSplit.cur), [counterSplit]);
  const counterPri = useMemo(
    () => (compareActive ? summariseCounter(counterSplit.prev) : null),
    [compareActive, counterSplit]
  );
  const counterRows = useMemo(
    () => counterSplit.cur.slice().sort((a, b) => b.saleDate.localeCompare(a.saleDate)),
    [counterSplit]
  );
  const bulkOrders = split.cur;

  const cur = useMemo(() => summarise(split.cur), [split.cur]);
  const pri = useMemo(
    () => (compareActive ? summarise(split.prev) : null),
    [compareActive, split.prev]
  );

  const metrics = useMemo(
    () => [
      metric("orders", "Bulk orders", "count", cur.orders, pri?.orders),
      metric("customers", "Customers ordering", "count", cur.customers, pri?.customers),
      metric("ordered", "Sarees ordered", "count", cur.ordered, pri?.ordered),
      metric("dispatched", "Sarees dispatched", "count", cur.dispatched, pri?.dispatched),
      metric("invoiced", "Invoiced", "money", cur.invoiced, pri?.invoiced),
      metric("collected", "Collected", "money", cur.collected, pri?.collected),
      metric("outstanding", "Outstanding", "money", cur.outstanding, pri?.outstanding, "down"),
      metric(
        "collectedPct",
        "Collected of invoiced",
        "percent",
        cur.collectedPct,
        pri?.collectedPct
      ),
      metric(
        "counterSales",
        "Counter sales (sarees)",
        "count",
        counterCur.count,
        counterPri?.count
      ),
      metric("counterValue", "Counter sales value", "money", counterCur.value, counterPri?.value),
    ],
    [cur, pri, counterCur, counterPri]
  );

  const series = useMemo(
    () => ({
      dispatched: buildSeries({
        current,
        prior,
        currentItems: split.cur,
        priorItems: split.prev,
        dateOf: (o) => o.createdDate,
        // What has actually gone out — falling back to the order total
        // inflated every not-yet-dispatched order to its full size.
        amountOf: (o) => o.done ?? 0,
      }),
      invoiced: buildSeries({
        current,
        prior,
        currentItems: split.cur,
        priorItems: split.prev,
        dateOf: (o) => o.createdDate,
        amountOf: (o) => o.amountDue ?? 0,
      }),
    }),
    [current, prior, split.cur, split.prev]
  );

  // One row per customer — the card is titled per customer, but used to list
  // every order, so repeat buyers appeared several times.
  const owesByCustomer = useMemo(() => {
    const map = new Map<
      string,
      { customer: string; amt: number; orders: number; overdue: boolean }
    >();
    for (const o of bulkOrders) {
      const key = o.customerId ?? o.customer;
      const e = map.get(key) ?? { customer: o.customer, amt: 0, orders: 0, overdue: false };
      e.amt += balanceOf(o);
      e.orders += 1;
      if (o.status === "overdue" && balanceOf(o) > 0) e.overdue = true;
      map.set(key, e);
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .filter((v) => v.amt > 0)
      .sort((a, b) => b.amt - a.amt);
  }, [bulkOrders]);
  const owesPager = usePagination(owesByCustomer, OWES_PAGE_SIZE);
  const settledCustomers = cur.customers - owesByCustomer.length;
  const maxOwed = Math.max(1, ...owesByCustomer.map((o) => o.amt));

  const wsInvStatus = useMemo(
    () =>
      (["paid", "partial", "pending"] as const)
        .map((status) => ({
          name: status === "paid" ? "Paid" : status === "partial" ? "Partially Paid" : "Pending",
          value: bulkOrders.filter((o) => (o.paymentStatus ?? "pending") === status).length,
          color: status === "paid" ? T.green : status === "partial" ? T.antiqueGold : T.crimson,
        }))
        .filter((d) => d.value > 0),
    [bulkOrders]
  );

  // Registered before the loading/error early-returns so the hook order stays
  // stable across renders.
  useRegisterExport(
    useMemo(
      () => ({
        name: "Wholesale Sales Report",
        sheetName: "Bulk Orders",
        headers: [
          "Bulk Order Ref",
          "Order Date",
          "Customer",
          "Saree Type",
          "Design",
          "Sarees Ordered",
          "Sarees Dispatched",
          "Due Date",
          "Dispatch Status",
          "Invoiced",
          "Collected",
          "Outstanding",
          "Payment Status",
        ],
        columns: [
          "text",
          "date",
          "text",
          "text",
          "text",
          "number",
          "number",
          "text",
          "text",
          "money",
          "money",
          "money",
          "text",
        ],
        totals: true,
        rows: bulkOrders.map((o) => [
          o.ref,
          o.createdDate ?? null,
          o.customer,
          o.sareeType,
          o.design || "—",
          o.total,
          o.done ?? 0,
          o.due,
          DISPATCH_LABEL[o.dispatchStatus ?? "pending"] ?? "—",
          o.amountDue ?? 0,
          o.amountPaid ?? 0,
          balanceOf(o),
          o.paymentStatus === "paid"
            ? "Paid"
            : o.paymentStatus === "partial"
              ? "Partially paid"
              : "Pending",
        ]),
        extraSheets: [
          {
            name: "Customer Balances",
            headers: ["Customer", "Orders in Period", "Outstanding", "Has Overdue Order"],
            columns: ["text", "number", "money", "text"],
            totals: true,
            rows: owesByCustomer.map((c) => [
              c.customer,
              c.orders,
              c.amt,
              c.overdue ? "Yes" : "No",
            ]),
          },
          {
            name: "Counter Sales",
            headers: ["Sale ID", "Sale Date", "Customer", "Saree ID", "Payment", "Amount"],
            columns: ["text", "date", "text", "text", "text", "money"],
            totals: true,
            rows: counterRows.map((x) => [
              x.saleRef,
              x.saleDate,
              x.customer?.name ?? "—",
              x.sareeId,
              x.paymentMethod ?? "—",
              Number(x.amount),
            ]),
          },
        ],
        metrics,
        // Rows can be all counter sales in a period with no bulk orders.
        ready: !isLoading && !salesLoading,
      }),
      [bulkOrders, owesByCustomer, counterRows, metrics, isLoading, salesLoading]
    )
  );

  if (isLoading) {
    return (
      <div id="rep-wholesale" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
        <SectionCard
          icon={Boxes}
          title="Wholesale Sales Report"
          subtitle="Track all wholesale dispatches, invoices raised, payments received, and outstanding dues from every wholesale customer."
        >
          <LoadingState variant="skeleton" rows={4} />
        </SectionCard>
      </div>
    );
  }

  if (isError) {
    return (
      <div id="rep-wholesale" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
        <SectionCard
          icon={Boxes}
          title="Wholesale Sales Report"
          subtitle="Track all wholesale dispatches, invoices raised, payments received, and outstanding dues from every wholesale customer."
        >
          <ErrorState error={undefined} onRetry={() => void refetch()} />
        </SectionCard>
      </div>
    );
  }

  const counterColumns: ColumnDef<BackendSaleRecord>[] = [
    {
      id: "ref",
      header: "Sale ID",
      accessor: (x) => x.saleRef,
      cell: (_v, x) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>
          {x.saleRef}
        </span>
      ),
    },
    {
      id: "date",
      header: "Sale Date",
      accessor: (x) => x.saleDate,
      sortable: true,
      cell: (_v, x) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDay(x.saleDate)}</span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      accessor: (x) => x.customer?.name ?? "—",
      cell: (_v, x) => (
        <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{x.customer?.name ?? "—"}</span>
      ),
    },
    {
      id: "saree",
      header: "Saree ID",
      accessor: (x) => x.sareeId,
      cell: (_v, x) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
          {x.sareeId}
        </span>
      ),
    },
    {
      id: "payment",
      header: "Payment",
      accessor: (x) => x.paymentMethod ?? "—",
    },
    {
      id: "amount",
      header: "Amount",
      accessor: (x) => Number(x.amount),
      align: "end",
      sortable: true,
      cell: (_v, x) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: T.green }}>
          <Money value={rupees(Number(x.amount))} />
        </span>
      ),
    },
  ];

  const bulkOrderColumns: ColumnDef<BulkOrder>[] = [
    {
      id: "ref",
      header: "Bulk Order Ref",
      accessor: (o) => o.ref,
      cell: (_v, o) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>
          {o.ref}
        </span>
      ),
    },
    {
      id: "created",
      header: "Order Date",
      accessor: (o) => o.createdDate ?? "",
      sortable: true,
      cell: (_v, o) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {fmtDay(o.createdDate)}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Customer Name",
      accessor: (o) => o.customer,
      cell: (_v, o) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{o.customer}</span>,
    },
    {
      id: "sarees",
      header: "Dispatched / Ordered",
      accessor: (o) => o.total,
      align: "center",
      cell: (_v, o) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
          {o.done ?? 0} / {o.total}
        </span>
      ),
    },
    {
      id: "invoiceAmt",
      header: "Invoice Amount",
      accessor: (o) => o.amountDue ?? 0,
      type: "number",
      sortable: true,
      cell: (_v, o) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
          {(o.amountDue ?? 0) > 0 ? <Money value={rupees(o.amountDue ?? 0)} /> : "—"}
        </span>
      ),
    },
    {
      id: "collected",
      header: "Collected",
      accessor: (o) => o.amountPaid ?? 0,
      type: "number",
      cell: (_v, o) => (
        <span style={{ fontFamily: "var(--font-mono)", color: T.green, fontWeight: 600 }}>
          {(o.amountPaid ?? 0) > 0 ? <Money value={rupees(o.amountPaid ?? 0)} /> : "—"}
        </span>
      ),
    },
    {
      id: "balance",
      header: "Balance Due",
      accessor: (o) => balanceOf(o),
      type: "number",
      sortable: true,
      cell: (_v, o) => {
        const balance = balanceOf(o);
        return (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: balance <= 0 ? T.green : T.crimson,
            }}
          >
            {balance > 0 ? <Money value={rupees(balance)} /> : "— Paid"}
          </span>
        );
      },
    },
    {
      id: "due",
      header: "Due",
      accessor: (o) => o.due,
      cell: (_v, o) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
          {o.due || "—"}
          <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe }}>
            {DISPATCH_LABEL[o.dispatchStatus ?? "pending"]}
          </div>
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: (o) => o.paymentStatus,
      type: "status",
      align: "center",
      cell: (_v, o) => (
        <StatusPill
          taxonomy="payment"
          status={PAYMENT_STATUS_KEY[o.paymentStatus ?? "pending"] ?? "unpaid"}
        />
      ),
    },
  ];

  return (
    <div id="rep-wholesale" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
      <SectionCard
        icon={Boxes}
        title="Wholesale Sales Report"
        subtitle="Track all wholesale dispatches, invoices raised, payments received, and outstanding dues from every wholesale customer."
      >
        <ReportDLBar note="bulk orders placed in the period, plus counter sales" />
        <CompareStrip metrics={metrics} />

        <div
          className="grid grid-cols-1 lg:grid-cols-2"
          style={{ gap: 20, marginBottom: 24, alignItems: "stretch" }}
        >
          <ChartCard>
            <ChartBand
              tone="output"
              icon={<Boxes size={19} color={BAND.output.icon} />}
              title="Wholesale Sarees Dispatched"
              sub={`${compareLabel ?? periodLabel} — ${bucketPhrase(series.dispatched.bucket)}, by order date`}
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              <TrendChart
                points={series.dispatched.points}
                unit="count"
                currentName={compareLabel ?? periodLabel}
                priorName={priorLabel}
                emptyText={`No sarees dispatched against orders placed in ${periodLabel}.`}
                height={220}
              />
            </div>
          </ChartCard>

          <ChartCard>
            <ChartBand
              tone="pipeline"
              icon={<Banknote size={19} color={BAND.pipeline.icon} />}
              title="Wholesale Amount Invoiced"
              sub={`${compareLabel ?? periodLabel} — ${bucketPhrase(series.invoiced.bucket)}`}
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              <TrendChart
                points={series.invoiced.points}
                unit="money"
                currentName={compareLabel ?? periodLabel}
                priorName={priorLabel}
                emptyText={`No wholesale orders placed in ${periodLabel}.`}
                height={220}
              />
            </div>
          </ChartCard>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr]"
          style={{ gap: 20, marginBottom: 24, alignItems: "stretch" }}
        >
          <ChartCard>
            <ChartBand
              tone="weavers"
              icon={<ReceiptText size={19} color={BAND.weavers.icon} />}
              title="How Much Each Customer Still Owes"
              sub="Outstanding balance per customer, largest first"
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "8px 0" }}>
                {owesByCustomer.length === 0 && (
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                    {bulkOrders.length === 0
                      ? `No bulk orders placed in ${periodLabel}.`
                      : "Every customer has paid in full. ✓"}
                  </div>
                )}
                {owesPager.pageItems.map((d, i) => {
                  const color = d.overdue ? T.crimson : T.antiqueGold;
                  return (
                    <div key={d.key}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: 4,
                          gap: 8,
                        }}
                      >
                        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                          {d.customer}
                          <span style={{ color: T.taupe, fontSize: 12 }}>
                            {" "}
                            · {d.orders} order{d.orders === 1 ? "" : "s"}
                            {d.overdue ? " · overdue" : ""}
                          </span>
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            fontWeight: 700,
                            color,
                          }}
                        >
                          {formatMoney(rupees(d.amt))}
                        </span>
                      </div>
                      <TrackBar
                        pct={Math.round((d.amt / maxOwed) * 100)}
                        fill={color}
                        height={9}
                        delay={i * 0.05}
                      />
                    </div>
                  );
                })}
              </div>
              {settledCustomers > 0 && owesByCustomer.length > 0 && (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.green, marginTop: 6 }}>
                  {settledCustomers} other customer{settledCustomers === 1 ? " has" : "s have"} paid
                  in full.
                </div>
              )}
              {owesByCustomer.length > OWES_PAGE_SIZE && (
                <div style={{ marginTop: 12 }}>
                  <Pagination
                    page={owesPager.page}
                    pageCount={owesPager.pageCount}
                    total={owesPager.total}
                    pageSize={owesPager.pageSize}
                    start={owesPager.start}
                    onPageChange={owesPager.setPage}
                    itemLabel="customers"
                    scrollToTop={false}
                  />
                </div>
              )}
            </div>
          </ChartCard>

          <ChartCard>
            <ChartBand
              tone="orders"
              icon={<CheckCircle2 size={19} color={BAND.orders.icon} />}
              title="Payment Status of Orders"
              sub={`Orders placed in ${periodLabel}`}
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              {wsInvStatus.length === 0 ? (
                <div
                  style={{
                    padding: "20px 0",
                    textAlign: "center" as const,
                    fontFamily: F.ui,
                    fontSize: 13,
                    color: T.taupe,
                  }}
                >
                  No bulk orders placed in {periodLabel}.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={wsInvStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        dataKey="value"
                        stroke="none"
                        paddingAngle={3}
                      >
                        {wsInvStatus.map((e) => (
                          <Cell key={`ws-inv-cell-${e.name}`} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: ValueType, n: NameType) => [`${v} orders`, n]}
                        contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 8px" }}
                  >
                    {wsInvStatus.map((d) => (
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
                          {d.value}
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
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          style={{ gap: 22, marginBottom: 28, alignItems: "stretch" }}
        >
          <SilkSumCard
            icon={<ReceiptText size={22} color={T.antiqueGold} />}
            label="Total Bulk Orders"
            value={`${cur.orders} orders`}
            sub={`${cur.ordered.toLocaleString("en-IN")} sarees ordered`}
            gid="wsr-b"
            delta={pick(metrics, "orders")}
          />
          <SilkSumCard
            icon={<Banknote size={22} color={T.antiqueGold} />}
            label="Total Invoiced Amount"
            value={formatMoney(rupees(cur.invoiced))}
            sub={`Across ${cur.customers} customer${cur.customers === 1 ? "" : "s"}`}
            gid="wsr-i"
            delta={pick(metrics, "invoiced")}
          />
          <SilkSumCard
            icon={<CheckCircle2 size={22} color={T.antiqueGold} />}
            label="Total Collected"
            value={formatMoney(rupees(cur.collected))}
            sub={
              cur.invoiced > 0
                ? `${Math.round(cur.collectedPct)}% of invoiced`
                : "Payments received"
            }
            gid="wsr-c"
            delta={pick(metrics, "collected")}
          />
          <SilkSumCard
            icon={<BellRing size={22} color={T.antiqueGold} />}
            label="Total Outstanding"
            value={formatMoney(rupees(cur.outstanding))}
            sub="Yet to be collected"
            gid="wsr-o"
            delta={pick(metrics, "outstanding")}
          />
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
            <div className="w-full overflow-x-auto">
              <div className="min-w-[900px]">
                <DataTable
                  columns={bulkOrderColumns}
                  data={bulkOrders}
                  getRowId={(o) => o.ref}
                  emptyTitle={`No bulk orders placed in ${periodLabel}`}
                  pagination
                  itemLabel="orders"
                />
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Counter sales — sold to wholesale customers at the shop, paid on the spot */}
        <FadeUp>
          <div style={{ marginTop: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: F.display,
                    fontWeight: 700,
                    fontSize: 18,
                    color: T.luxuryBrown,
                  }}
                >
                  Counter Sales to Wholesale Customers
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>
                  Sold at the shop and paid on the spot — no dispatch or invoice, so these are not
                  in the bulk-order figures above.
                </div>
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                <span style={{ fontWeight: 700, color: T.luxuryBrown }}>
                  {counterCur.count.toLocaleString("en-IN")} sarees
                </span>{" "}
                ·{" "}
                <span style={{ fontWeight: 700, color: T.green }}>
                  <Money value={rupees(counterCur.value)} />
                </span>
              </div>
            </div>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: `1px solid ${T.borderDef}`,
                overflow: "hidden",
                boxShadow: "0 2px 14px rgba(74,6,27,0.06)",
              }}
            >
              <div className="w-full overflow-x-auto">
                <div className="min-w-[720px]">
                  <DataTable
                    columns={counterColumns}
                    data={counterRows}
                    getRowId={(x) => x.saleRef}
                    loading={salesLoading}
                    emptyTitle={`No counter sales to wholesale customers in ${periodLabel}.`}
                    pagination
                    itemLabel="sales"
                  />
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </SectionCard>
    </div>
  );
}
