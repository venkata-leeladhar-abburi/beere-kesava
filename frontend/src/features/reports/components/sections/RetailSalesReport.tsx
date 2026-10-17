import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tag, Banknote, Percent, RefreshCcw, Store } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { T, F } from "../theme";
import { semantic } from "../../../../design-system/tokens";
import { FadeUp, SilkSumCard, SectionCard, ReportDLBar, StatusPill } from "../common/primitives";
import { CompareStrip, metric, pick } from "../common/compare";
import { TrendChart } from "../common/TrendChart";
import { ChartCard, ChartBand, TrackBar, BAND } from "@/features/production";
import {
  salesApi,
  type BackendSaleRecord,
  type BackendSaleReturn,
} from "../../../../shared/api/sales";
import { saleGstAmount, saleGstRate } from "../../../../lib/domain/saleGst";
import { customersApi } from "../../../../shared/api/customers";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { useReportPeriod, useRegisterExport, usePeriodSplit } from "../PeriodContext";
import { buildSeries, bucketPhrase } from "../timeSeries";
import { matchReturnsToSales } from "../reportMath";

interface RetailSaleRow {
  id: string;
  billId: string;
  saleDate: string;
  customer: string;
  phone: string;
  sarId: string;
  design: string;
  type: string;
  paymentMethod: string;
  price: number;
  /** GST inside `price` (0 when none was charged). */
  gst: number;
  gstRate: number | null;
  customerGstin: string;
  returnedOn: string | null;
  refund: number;
}

const designOf = (s: BackendSaleRecord) => s.saree?.designCode || "No design code";
const typeOf = (s: BackendSaleRecord) =>
  s.saree?.sareeType?.type || s.externalSareeType || s.saree?.sareeTypeCode || "Other";

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

interface RetailReturn {
  ret: BackendSaleReturn;
  sale: BackendSaleRecord;
}

/** Headline figures for one window: sales by sale date, refunds by return date. */
function summarise(sales: BackendSaleRecord[], returns: RetailReturn[]) {
  const gross = sales.reduce((s, x) => s + Number(x.amount), 0);
  const refunds = returns.reduce((s, r) => s + Number(r.ret.refundAmount ?? 0), 0);
  const bills = new Set(sales.map((s) => s.billId || s.saleRef)).size;
  return {
    sold: sales.length,
    bills,
    gross,
    refunds,
    net: gross - refunds,
    returns: returns.length,
    avg: sales.length ? gross / sales.length : 0,
    gst: sales.reduce((s, x) => s + saleGstAmount(x), 0),
  };
}

export function RetailSalesReport() {
  const {
    data: allSales,
    isLoading: salesLoading,
    isError: salesError,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ["reports", "sales-all"],
    // Every sale, not the first page of 100 — the report under-counted as
    // soon as the shop had made more sales than that.
    queryFn: () => salesApi.listAll(),
  });
  const {
    data: allReturns,
    isLoading: returnsLoading,
    isError: returnsError,
    refetch: refetchReturns,
  } = useQuery({
    queryKey: ["reports", "sale-returns-all"],
    queryFn: () => salesApi.listAllReturns(),
  });
  const {
    data: customersRes,
    isError: customersError,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ["reports", "customers-roster"],
    queryFn: () => customersApi.list(),
  });

  const isLoading = salesLoading || returnsLoading;
  const isError = salesError || returnsError || customersError;
  const refetchAll = () => {
    void refetchSales();
    void refetchReturns();
    void refetchCustomers();
  };

  const {
    current,
    prior,
    compareActive,
    label: periodLabel,
    compareLabel,
    priorLabel,
  } = useReportPeriod();

  const retailAll = useMemo(
    () => (allSales ?? []).filter((s) => s.channel === "RETAIL"),
    [allSales]
  );
  const returnBySaleRef = useMemo(
    () => matchReturnsToSales(allSales ?? [], allReturns ?? []),
    [allSales, allReturns]
  );
  // Returns of retail sales, carrying the sale they undo.
  const retailReturnsAll = useMemo(() => {
    const saleByRef = new Map(retailAll.map((s) => [s.saleRef, s]));
    const out: RetailReturn[] = [];
    for (const [ref, ret] of returnBySaleRef) {
      const sale = saleByRef.get(ref);
      if (sale) out.push({ ret, sale });
    }
    return out;
  }, [retailAll, returnBySaleRef]);

  const salesSplit = usePeriodSplit(retailAll, (s) => s.saleDate);
  const returnsSplit = usePeriodSplit(retailReturnsAll, (r) => r.ret.returnDate);

  const cur = useMemo(
    () => summarise(salesSplit.cur, returnsSplit.cur),
    [salesSplit.cur, returnsSplit.cur]
  );
  const pri = useMemo(
    () => (compareActive ? summarise(salesSplit.prev, returnsSplit.prev) : null),
    [compareActive, salesSplit.prev, returnsSplit.prev]
  );

  const metrics = useMemo(
    () => [
      metric("sold", "Sarees sold", "count", cur.sold, pri?.sold),
      metric("bills", "Bills", "count", cur.bills, pri?.bills),
      metric("gross", "Gross sales", "money", cur.gross, pri?.gross),
      metric("refunds", "Refunds", "money", cur.refunds, pri?.refunds, "down"),
      metric("net", "Net revenue", "money", cur.net, pri?.net),
      metric("avg", "Average sale value", "money", cur.avg, pri?.avg),
      metric("returns", "Sarees returned", "count", cur.returns, pri?.returns, "down"),
      metric("gst", "GST collected", "money", cur.gst, pri?.gst, "neutral"),
    ],
    [cur, pri]
  );

  const customerById = useMemo(
    () => new Map((customersRes?.items ?? []).map((c) => [c.id, c])),
    [customersRes]
  );

  const retailRows = useMemo<RetailSaleRow[]>(
    () =>
      salesSplit.cur
        .slice()
        .sort((a, b) => b.saleDate.localeCompare(a.saleDate))
        .map((s) => {
          const ret = returnBySaleRef.get(s.saleRef);
          const customer = s.customerId ? customerById.get(s.customerId) : undefined;
          return {
            id: s.saleRef,
            billId: s.billId ?? "",
            saleDate: s.saleDate,
            customer: s.customer?.name ?? customer?.name ?? "Walk-in Customer",
            phone: s.customer?.phone ?? customer?.phone ?? "—",
            sarId: s.sareeId,
            design: designOf(s),
            type: typeOf(s),
            paymentMethod: s.paymentMethod ?? "—",
            price: Number(s.amount),
            gst: saleGstAmount(s),
            gstRate: saleGstRate(s),
            customerGstin: s.customerGstin ?? "",
            returnedOn: ret?.returnDate ?? null,
            refund: ret ? Number(ret.refundAmount ?? 0) : 0,
          };
        }),
    [salesSplit.cur, returnBySaleRef, customerById]
  );

  const series = useMemo(
    () => ({
      count: buildSeries({
        current,
        prior,
        currentItems: salesSplit.cur,
        priorItems: salesSplit.prev,
        dateOf: (s) => s.saleDate,
      }),
      revenue: buildSeries({
        current,
        prior,
        currentItems: salesSplit.cur,
        priorItems: salesSplit.prev,
        dateOf: (s) => s.saleDate,
        amountOf: (s) => Number(s.amount),
      }),
    }),
    [current, prior, salesSplit.cur, salesSplit.prev]
  );

  const retailDesignSales = useMemo(() => {
    const counts = new Map<string, { current: number; prior: number }>();
    for (const sale of salesSplit.cur) {
      const e = counts.get(designOf(sale)) ?? { current: 0, prior: 0 };
      e.current += 1;
      counts.set(designOf(sale), e);
    }
    for (const sale of salesSplit.prev) {
      const e = counts.get(designOf(sale));
      if (e) e.prior += 1;
    }
    return Array.from(counts.entries())
      .map(([design, c]) => ({ design, ...c }))
      .sort((a, b) => b.current - a.current)
      .slice(0, 5);
  }, [salesSplit.cur, salesSplit.prev]);

  const retailRevenueDonut = useMemo(() => {
    const typeMap = new Map<string, number>();
    const colors = semantic.chart.series;
    for (const sale of salesSplit.cur) {
      // A returned saree brought in no revenue, so it must not inflate its
      // type's slice.
      if (returnBySaleRef.has(sale.saleRef)) continue;
      typeMap.set(typeOf(sale), (typeMap.get(typeOf(sale)) ?? 0) + Number(sale.amount));
    }
    return Array.from(typeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length]! }));
  }, [salesSplit.cur, returnBySaleRef]);

  const maxDesignCount = Math.max(1, ...retailDesignSales.map((d) => d.current));

  useRegisterExport(
    useMemo(
      () => ({
        name: "Retail Sales Report",
        sheetName: "Retail Sales",
        headers: [
          "Sale ID",
          "Bill",
          "Sale Date",
          "Customer",
          "Phone",
          "Saree ID",
          "Design",
          "Saree Type",
          "Payment",
          "GST %",
          "GST",
          "Customer GSTIN",
          "Amount",
          "Returned On",
          "Refund",
        ],
        columns: [
          "text",
          "text",
          "date",
          "text",
          "text",
          "text",
          "text",
          "text",
          "text",
          "figure",
          "money",
          "text",
          "money",
          "date",
          "money",
        ],
        totals: true,
        rows: retailRows.map((r) => [
          r.id,
          r.billId,
          r.saleDate,
          r.customer,
          r.phone,
          r.sarId,
          r.design,
          r.type,
          r.paymentMethod,
          r.gstRate ?? "",
          r.gst,
          r.customerGstin,
          r.price,
          r.returnedOn,
          r.refund || null,
        ]),
        extraSheets: [
          {
            name: "Returns",
            headers: [
              "Return Ref",
              "Returned On",
              "Sale ID",
              "Sold On",
              "Saree ID",
              "Reason",
              "Restocked",
              "Refund",
            ],
            columns: ["text", "date", "text", "date", "text", "text", "text", "money"],
            totals: true,
            rows: returnsSplit.cur.map(({ ret, sale }) => [
              ret.returnRef,
              ret.returnDate,
              sale.saleRef,
              sale.saleDate,
              ret.sareeId,
              ret.reason ?? "",
              ret.restocked ? "Yes" : "No",
              Number(ret.refundAmount ?? 0),
            ]),
          },
        ],
        metrics,
        ready: !isLoading,
      }),
      [retailRows, returnsSplit.cur, metrics, isLoading]
    )
  );

  const retailColumns: ColumnDef<RetailSaleRow>[] = [
    {
      id: "id",
      header: "Sale ID",
      accessor: (r) => r.id,
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>
          {r.id}
        </span>
      ),
    },
    {
      id: "date",
      header: "Sale Date",
      accessor: (r) => r.saleDate,
      sortable: true,
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDay(r.saleDate)}</span>
      ),
    },
    {
      id: "customer",
      header: "Customer Name",
      accessor: (r) => r.customer,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span>,
    },
    {
      id: "phone",
      header: "Phone",
      accessor: (r) => r.phone,
      cell: (_v, r) => <span style={{ color: T.taupe }}>{r.phone}</span>,
    },
    {
      id: "sarId",
      header: "Saree ID",
      accessor: (r) => r.sarId,
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
          {r.sarId}
          <div style={{ fontFamily: F.ui, fontSize: 11 }}>{r.design}</div>
        </span>
      ),
    },
    {
      id: "gst",
      header: "GST",
      accessor: (r) => r.gst,
      align: "end",
      cell: (_v, r) =>
        r.gstRate === null ? (
          <span style={{ color: T.taupe }}>—</span>
        ) : (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
            <Money value={rupees(r.gst)} /> <span style={{ color: T.taupe }}>@ {r.gstRate}%</span>
            {r.customerGstin && (
              <div style={{ color: T.taupe, fontSize: 11 }}>{r.customerGstin}</div>
            )}
          </span>
        ),
    },
    {
      id: "price",
      header: "Retail Price",
      accessor: (r) => r.price,
      align: "end",
      sortable: true,
      cell: (_v, r) => (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color: r.returnedOn ? T.taupe : T.green,
            textDecoration: r.returnedOn ? "line-through" : undefined,
          }}
        >
          <Money value={rupees(r.price)} />
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: (r) => (r.returnedOn ? "Returned" : "Sold"),
      align: "center",
      cell: (_v, r) =>
        r.returnedOn ? (
          <span title={`Refunded ${formatMoney(rupees(r.refund))} on ${fmtDay(r.returnedOn)}`}>
            <StatusPill label={`Returned ${fmtDay(r.returnedOn)}`} type="bad" />
          </span>
        ) : (
          <StatusPill label="Sold" type="ok" />
        ),
    },
  ];

  return (
    <div id="rep-retail" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 32 }}>
      <SectionCard
        icon={Store}
        title="Retail Sales Report"
        subtitle="Track all sales at the retail shop — how many sarees were sold, to which customers, at what prices, and what the total revenue was."
      >
        <ReportDLBar />
        <CompareStrip metrics={metrics} />

        <FadeUp>
          <ChartCard style={{ marginBottom: 24 }}>
            <ChartBand
              tone="output"
              icon={<Store size={19} color={BAND.output.icon} />}
              title="Sarees Sold Over Time"
              sub={`${compareActive ? (compareLabel ?? periodLabel) : periodLabel} — ${bucketPhrase(series.count.bucket)}`}
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 14,
                  flexWrap: "wrap",
                  gap: 24,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: T.taupe,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Sarees Sold
                  </div>
                  <div
                    style={{
                      fontFamily: F.display,
                      fontSize: 20,
                      fontWeight: 700,
                      color: T.royalBurgundy,
                    }}
                  >
                    {cur.sold.toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: T.taupe,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Gross Sales
                  </div>
                  <div
                    style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.green }}
                  >
                    <Money value={rupees(cur.gross)} />
                  </div>
                </div>
              </div>
              <TrendChart
                points={series.count.points}
                unit="count"
                currentName={compareLabel ?? periodLabel}
                priorName={priorLabel}
                emptyText={isLoading ? "Loading sales…" : `No retail sales in ${periodLabel}.`}
              />
            </div>
          </ChartCard>
        </FadeUp>

        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ gap: 20, marginBottom: 24, alignItems: "stretch" }}
        >
          <ChartCard>
            <ChartBand
              tone="pipeline"
              icon={<Tag size={19} color={BAND.pipeline.icon} />}
              title="Which Designs Sold Most at Retail"
              sub="Top 5 designs by saree count"
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              {retailDesignSales.length === 0 ? (
                <div
                  style={{
                    padding: "30px 0",
                    textAlign: "center" as const,
                    fontFamily: F.ui,
                    fontSize: 13,
                    color: T.taupe,
                  }}
                >
                  No retail sales in {periodLabel}.
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12, padding: "10px 0" }}
                >
                  {retailDesignSales.map((d, i) => (
                    <div key={d.design}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: 4,
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            fontWeight: 700,
                            color: T.royalBurgundy,
                          }}
                        >
                          {d.design}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            fontWeight: 700,
                            color: T.luxuryBrown,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {d.current} sarees
                          {compareActive && (
                            <span style={{ fontWeight: 500, color: T.taupe }}>
                              {" "}
                              · was {d.prior}
                            </span>
                          )}
                        </span>
                      </div>
                      <TrackBar
                        pct={Math.round((d.current / maxDesignCount) * 100)}
                        fill={T.royalBurgundy}
                        height={9}
                        delay={i * 0.08}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ChartCard>

          <ChartCard>
            <ChartBand
              tone="orders"
              icon={<Percent size={19} color={BAND.orders.icon} />}
              title="Revenue by Saree Type"
              sub="Retail revenue split, returned sarees excluded"
            />
            <div
              className="p-5 sm:p-6"
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              {retailRevenueDonut.length === 0 ? (
                <div
                  style={{
                    padding: "30px 0",
                    textAlign: "center" as const,
                    fontFamily: F.ui,
                    fontSize: 13,
                    color: T.taupe,
                  }}
                >
                  No retail sales in {periodLabel}.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={retailRevenueDonut}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        dataKey="value"
                        stroke="none"
                        paddingAngle={3}
                      >
                        {retailRevenueDonut.map((e) => (
                          <Cell key={`ret-rev-cell-${e.name}`} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number | string, n: string) => [
                          formatMoney(rupees(Number(v))),
                          n,
                        ]}
                        contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 5, padding: "0 4px" }}
                  >
                    {retailRevenueDonut.map((d) => (
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
                          <Money value={rupees(d.value)} />
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
            icon={<Tag size={22} color={T.antiqueGold} />}
            label="Total Sarees Sold at Shop"
            value={`${cur.sold.toLocaleString("en-IN")} sarees`}
            sub={`${cur.bills.toLocaleString("en-IN")} bills in ${periodLabel}`}
            gid="rsr-s"
            delta={pick(metrics, "sold")}
          />
          <SilkSumCard
            icon={<Banknote size={22} color={T.antiqueGold} />}
            label="Net Retail Revenue"
            value={formatMoney(rupees(cur.net))}
            sub={
              cur.refunds > 0
                ? `${formatMoney(rupees(cur.gross))} sold − ${formatMoney(rupees(cur.refunds))} refunded`
                : "No refunds in this period"
            }
            gid="rsr-r"
            delta={pick(metrics, "net")}
          />
          <SilkSumCard
            icon={<Percent size={22} color={T.antiqueGold} />}
            label="Average Sale Value"
            value={cur.avg > 0 ? formatMoney(rupees(cur.avg)) : "—"}
            sub="Per saree sold"
            gid="rsr-a"
            delta={pick(metrics, "avg")}
          />
          <SilkSumCard
            icon={<RefreshCcw size={22} color={T.antiqueGold} />}
            label="Total Returns at Shop"
            value={`${cur.returns} sarees`}
            sub={
              cur.refunds > 0
                ? `${formatMoney(rupees(cur.refunds))} refunded`
                : "No refunds in this period"
            }
            gid="rsr-t"
            delta={pick(metrics, "returns")}
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
                  columns={retailColumns}
                  data={retailRows}
                  getRowId={(r) => r.id + r.sarId}
                  loading={isLoading}
                  error={!!isError}
                  onRetry={refetchAll}
                  emptyTitle={`No retail sales in ${periodLabel}.`}
                  pagination
                  itemLabel="sales"
                />
              </div>
            </div>
          </div>
        </FadeUp>
      </SectionCard>
    </div>
  );
}
