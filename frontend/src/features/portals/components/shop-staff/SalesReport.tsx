/**
 * Shop Staff → Reports (mobile).
 * ═══════════════════════════════════════════════════════════════════════════
 * Same three bands as the desktop section (controls → analytics → records),
 * stacked. Both surfaces read every number from useSalesReportModel and share
 * the report's column definitions, so they can never disagree.
 */
import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie,
} from "recharts";
import { BarChart2, ShoppingBag, RotateCcw, Download, ReceiptText, LayoutGrid, Table as TableIcon } from "lucide-react";

import { C, F, Card, useCanSeePrices, PageHero, PortalStatsStrip, SectionTitle, type PortalStat } from "./theme";
import { Button } from "../../../../shared/ui/primitives";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import { ChartFigure, DataTable, exportTable } from "../../../../shared/ui/data";
import { DateFilterBar } from "../../../../shared/ui/DateFilterBar";
import { ViewSelector } from "../../../../shared/ui/ViewSelector";
import { RoyalSubTabStrip } from "../../../../shared/ui/RoyalSubTabStrip";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { useSalesReportModel } from "./salesReportModel";
import { CHART_COLORS, ChartLegend } from "./reportCharts";
import { salesReportColumns, returnReportColumns } from "./reportColumns";
import { ExportReportDialog, type ExportFormat } from "./desktop/ExportReportDialog";

/** Compact metric tile — half-width on a phone, so the value size is fluid. */
// Record-view toggle — the same two records can be read as a scannable table
// or as one card per row; the reader picks, at any viewport.
const RECORD_VIEWS = [
  { key: "table" as const, label: "Table", Icon: TableIcon },
  { key: "cards" as const, label: "Cards", Icon: LayoutGrid },
];
type RecordView = (typeof RECORD_VIEWS)[number]["key"];

function MiniStat({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      minWidth: 0, padding: "12px 14px", borderRadius: 14,
      background: accent ? "linear-gradient(135deg, rgba(110,15,45,0.06) 0%, rgba(200,155,71,0.08) 100%)" : "#FFFDF9",
      border: `1px solid ${accent ? "rgba(200,155,71,0.32)" : "rgba(110,15,45,0.10)"}`,
    }}>
      <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.4, textTransform: "uppercase" as const }}>{label}</div>
      <div style={{ fontFamily: F.d, fontSize: "clamp(15px, 4.6vw, 19px)", fontWeight: 700, color: C.text, marginTop: 5, overflowWrap: "anywhere" as const }}>{value}</div>
      {sub && <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ShareBar({ label, right, pct, color }: { label: string; right: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: F.u, fontSize: 13, color: C.text, marginBottom: 5 }}>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ color: C.muted, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{right}</span>
      </div>
      <div style={{ height: 8, borderRadius: 6, background: "rgba(110,15,45,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(pct, 1.5)}%`, height: "100%", background: color, borderRadius: 6 }} />
      </div>
    </div>
  );
}

function SalesReport() {
  const canSeePrices = useCanSeePrices();
  const m = useSalesReportModel();
  const {
    filter, setFilter, filterLabel, salesRows, returnRows, metrics,
    trend, paymentMix, returnReasons, channelData, topCustomers,
  } = m;

  const [tab, setTab] = useState<"sales" | "returns">("sales");
  // Mobile defaults to cards — a 7-column table is unreadable at 390px.
  const [recordView, setRecordView] = useState<RecordView>("table");
  const [exportDialog, setExportDialog] = useState<{ label: string } | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [exportDone, setExportDone] = useState(false);

  const salesColumns = React.useMemo(() => salesReportColumns(canSeePrices), [canSeePrices]);
  const returnColumns = React.useMemo(() => returnReportColumns(canSeePrices), [canSeePrices]);

  async function runExport(format: ExportFormat) {
    const fmt = format === "excel" ? "xlsx" : "csv";
    const slug = filterLabel.replace(/\s+/g, "_");
    if (tab === "sales") {
      await exportTable({ columns: salesColumns, rows: salesRows, filename: `sales_report_${slug}`, format: fmt });
    } else {
      await exportTable({ columns: returnColumns, rows: returnRows, filename: `returns_report_${slug}`, format: fmt });
    }
  }

  const stats: PortalStat[] = [
    { label: "Total sales", value: metrics.totalSalesCount, sub: "Sarees sold", icon: BarChart2, highlight: true },
    ...(canSeePrices ? [{ label: "Total revenue", value: formatMoney(rupees(metrics.totalRevenue)), sub: "Gross sales", icon: ShoppingBag }] : []),
    { label: "Returns", value: metrics.returnsCount, sub: `${metrics.returnRate.toFixed(1)}% of sales`, icon: RotateCcw },
    ...(canSeePrices ? [{ label: "Average per sale", value: formatMoney(rupees(metrics.avgRevenue)), sub: "Per saree", icon: BarChart2 }] : []),
  ];

  const avgPerDay = trend.length > 0 ? Math.round(metrics.totalRevenue / trend.length) : 0;

  return (
    <div style={{ paddingBottom: 110 }}>
      <PageHero
        eyebrow="Shop Staff Portal · Beere Kesava & Brothers Silks"
        title="Sales Report"
        titleAccent="& Analytics"
        description="Review all sales, revenue, customer trends, and return patterns across retail and wholesale channels."
      />

      <PortalStatsStrip stats={stats} />

      {/* ── Controls: timeline + export ───────────────────────────────── */}
      <div style={{ margin: "24px 20px 0" }}>
        <Card style={{ margin: 0, padding: "16px 16px 18px" }}>
          <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, color: C.muted, marginBottom: 10 }}>Timeline</div>
          <DateFilterBar filter={filter} onChange={setFilter} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" as const }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, flex: 1, minWidth: 150 }}>
              <strong style={{ color: C.text }}>{filterLabel}</strong> · {metrics.totalSalesCount} sales · {metrics.returnsCount} returns
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setExportDone(false); setExportDialog({ label: tab === "sales" ? `Sales — ${filterLabel}` : `Returns — ${filterLabel}` }); }}
              className="rounded-[12px] border-none bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] font-bold gap-2"
            >
              <Download size={15} /> Export
            </Button>
          </div>
        </Card>
      </div>

      {/* ── Revenue trend ─────────────────────────────────────────────── */}
      <div id="shoprep-trend" style={{ margin: "24px 20px 0" }}>
        <SectionTitle title="Revenue Trend" />
        <Card style={{ margin: 0, padding: "18px 12px" }}>
          {trend.length === 0 ? (
            <div style={{ padding: "24px 12px", textAlign: "center" as const, fontFamily: F.u, fontSize: 14, color: C.muted }}>
              No sales in this period — pick a wider timeline.
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 4px", marginBottom: 16 }}>
                <MiniStat label="Days traded" value={trend.length} sub="With a sale" />
                {canSeePrices && <MiniStat label="Average / day" value={<Money value={rupees(avgPerDay)} />} sub="This period" />}
                <MiniStat label="Peak day" value={metrics.bestDay?.label ?? "—"} sub={metrics.bestDay ? `${metrics.bestDay.count} sales` : "No sales yet"} accent />
                {canSeePrices && <MiniStat label="Peak revenue" value={<Money value={rupees(metrics.bestDay?.revenue ?? 0)} />} sub="Best day" />}
              </div>
              <ChartFigure
                title="Revenue Trend"
                summary={`Revenue across ${trend.length} day${trend.length === 1 ? "" : "s"}, peaking on ${metrics.bestDay?.label ?? "—"}.`}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trend} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="shopRevGradM" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.burg} stopOpacity={0.30} />
                        <stop offset="100%" stopColor={C.burg} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.08)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontFamily: F.m, fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis
                      tick={{ fontFamily: F.m, fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={48}
                      tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                    />
                    <Tooltip
                      contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 8 }}
                      formatter={(v: number) => [formatMoney(rupees(v)), "Revenue"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke={C.burg} strokeWidth={2.5} fill="url(#shopRevGradM)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartFigure>
            </>
          )}
        </Card>
      </div>

      {/* ── Performance summary ───────────────────────────────────────── */}
      <div id="shoprep-summary" style={{ margin: "24px 20px 0" }}>
        <SectionTitle title="Performance Summary" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {canSeePrices && <MiniStat label="Net revenue" value={<Money value={rupees(metrics.netRevenue)} />} sub="After refunds" accent />}
          {canSeePrices && <MiniStat label="Refunded" value={<Money value={rupees(metrics.refundTotal)} />} sub={`${metrics.returnsCount} returns`} />}
          {canSeePrices && <MiniStat label="Highest sale" value={<Money value={rupees(metrics.highestSale)} />} sub="Single saree" />}
          <MiniStat label="Customers" value={metrics.uniqueCustomers} sub="Unique buyers" />
          <MiniStat label="Retail" value={metrics.retailCount} sub={canSeePrices ? formatMoney(rupees(metrics.retailRevenue)) : "sarees"} />
          <MiniStat label="Wholesale" value={metrics.wholesaleCount} sub={canSeePrices ? formatMoney(rupees(metrics.wholesaleRevenue)) : "sarees"} />
          <MiniStat label="Return rate" value={`${metrics.returnRate.toFixed(1)}%`} sub="Of total sales" />
          <MiniStat label="Avg / sale" value={canSeePrices ? <Money value={rupees(metrics.avgRevenue)} /> : metrics.totalSalesCount} sub={canSeePrices ? "Per saree" : "Sarees sold"} />
        </div>
      </div>

      {/* ── Records: sales & returns ──────────────────────────────────── */}
      <div id="shoprep-records" style={{ margin: "24px 20px 0" }}>
        <SectionTitle title="Sales & Returns" />
        <Card style={{ margin: 0, padding: "14px 14px 18px" }}>
          <RoyalSubTabStrip
            tabs={[
              { key: "sales", label: `Sales (${metrics.totalSalesCount})`, icon: <ReceiptText size={15} /> },
              { key: "returns", label: `Returns (${metrics.returnsCount})`, icon: <RotateCcw size={15} /> },
            ]}
            activeTab={tab}
            onTabChange={setTab}
          />

          {/* Table ⇄ Cards — same rows, same pagination, two readings. */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const, marginBottom: 14 }}>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, color: C.muted }}>
              {tab === "sales" ? `${metrics.totalSalesCount} sales` : `${metrics.returnsCount} returns`} · {filterLabel}
            </span>
            <ViewSelector options={RECORD_VIEWS} activeView={recordView} onViewChange={setRecordView} />
          </div>

          {tab === "sales" ? (
            <>
              <DataTable
                columns={salesColumns}
                data={salesRows}
                getRowId={r => r.key}
                caption={`Sales — ${filterLabel}`}
                responsive
                view={recordView}
                pagination
                pageSize={10}
                itemLabel="sales"
                loading={m.salesLoading}
                error={m.salesError}
                onRetry={m.refetchSales}
                isFiltered={filter.mode !== "all"}
                onClearFilters={() => setFilter({ ...filter, mode: "all" })}
                emptyTitle="No sales recorded"
                emptyDescription={`Nothing was sold in ${filterLabel.toLowerCase()}.`}
              />
              {canSeePrices && salesRows.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginTop: 12, padding: "14px 16px", background: C.cream, borderRadius: 14 }}>
                  <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Total ({filterLabel})</span>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold }}><Money value={rupees(metrics.totalRevenue)} /></span>
                </div>
              )}
            </>
          ) : (
            <>
              <DataTable
                columns={returnColumns}
                data={returnRows}
                getRowId={r => r.key}
                caption={`Returns — ${filterLabel}`}
                responsive
                view={recordView}
                pagination
                pageSize={10}
                itemLabel="returns"
                loading={m.returnsLoading}
                error={m.returnsError}
                onRetry={m.refetchReturns}
                isFiltered={filter.mode !== "all"}
                onClearFilters={() => setFilter({ ...filter, mode: "all" })}
                emptyTitle="No returns recorded"
                emptyDescription={`Nothing came back in ${filterLabel.toLowerCase()}.`}
              />
              {canSeePrices && returnRows.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginTop: 12, padding: "14px 16px", background: C.cream, borderRadius: 14 }}>
                  <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Refunded ({filterLabel})</span>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.burg }}><Money value={rupees(metrics.refundTotal)} /></span>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* ── Sales by channel ──────────────────────────────────────────── */}
      <div id="shoprep-by-design" style={{ margin: "24px 20px 0" }}>
        <SectionTitle title="Sales by Channel" />
        <Card style={{ margin: 0, padding: "18px 12px" }}>
          <ChartFigure title="Sales by Channel" summary={channelData.map(d => `${d.design} ${d.count}`).join(", ") + "."}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={channelData} layout="vertical" margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontFamily: F.m, fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="design" tick={{ fontFamily: F.u, fontSize: 12, fill: C.text }} axisLine={false} tickLine={false} width={76} />
                <Tooltip
                  cursor={{ fill: "rgba(110,15,45,0.04)" }}
                  contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 8 }}
                  formatter={(v: number) => [`${v} sarees`, "Count"]}
                />
                <Bar dataKey="count" radius={[12, 12, 12, 12]} barSize={24} isAnimationActive={false}>
                  {channelData.map(entry => (
                    <Cell key={`cell-${entry.design}`} fill={entry.design === "Retail" ? C.burg : entry.design === "Wholesale" ? C.gold : C.crim} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartFigure>
        </Card>
      </div>

      {/* ── Payment methods ───────────────────────────────────────────── */}
      <div id="shoprep-payments" style={{ margin: "24px 20px 0" }}>
        <SectionTitle title="Payment Methods" />
        <Card style={{ margin: 0, padding: "18px 12px" }}>
          {paymentMix.length === 0 ? (
            <div style={{ padding: "20px 12px", textAlign: "center" as const, fontFamily: F.u, fontSize: 14, color: C.muted }}>No sales in this period.</div>
          ) : (
            <ChartFigure title="Payment Methods" summary={paymentMix.map(p => `${p.method} ${p.count}`).join(", ") + "."}>
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={paymentMix} dataKey="count" nameKey="method" innerRadius={44} outerRadius={70} paddingAngle={2} isAnimationActive={false}>
                      {paymentMix.map((p, i) => <Cell key={p.method} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#FFF" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 8 }} formatter={(v: number, n) => [`${v} sales`, String(n)]} />
                  </PieChart>
                </ResponsiveContainer>
                <ChartLegend items={paymentMix.map(p => ({ label: p.method, value: String(p.count) }))} />
              </>
            </ChartFigure>
          )}
        </Card>
      </div>

      {/* ── Revenue split ─────────────────────────────────────────────── */}
      {canSeePrices && metrics.totalRevenue > 0 && (
        <div id="shoprep-revenue-split" style={{ margin: "24px 20px 0" }}>
          <SectionTitle title="Revenue Split" />
          <Card style={{ margin: 0, padding: "18px 16px 10px" }}>
            {[
              { label: "Retail", value: metrics.retailRevenue, color: C.burg },
              { label: "Wholesale", value: metrics.wholesaleRevenue, color: C.gold },
            ].map(row => {
              const pct = metrics.totalRevenue > 0 ? (row.value / metrics.totalRevenue) * 100 : 0;
              return <ShareBar key={row.label} label={row.label} right={`${formatMoney(rupees(row.value))} · ${Math.round(pct)}%`} pct={pct} color={row.color} />;
            })}
            <div style={{ paddingTop: 8, borderTop: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", fontFamily: F.u, fontSize: 13, color: C.muted, paddingBottom: 8 }}>
              <span>Refunded</span>
              <span style={{ color: C.crim, fontWeight: 700 }}>− {formatMoney(rupees(metrics.refundTotal))}</span>
            </div>
          </Card>
        </div>
      )}

      {/* ── Return reasons ────────────────────────────────────────────── */}
      {returnReasons.length > 0 && (
        <div id="shoprep-return-reasons" style={{ margin: "24px 20px 0" }}>
          <SectionTitle title="Return Reasons" />
          <Card style={{ margin: 0, padding: "18px 16px 8px" }}>
            {returnReasons.map(r => {
              const pct = metrics.returnsCount > 0 ? (r.count / metrics.returnsCount) * 100 : 0;
              return <ShareBar key={r.reason} label={r.reason} right={`${r.count} · ${Math.round(pct)}%`} pct={pct} color={C.burg} />;
            })}
          </Card>
        </div>
      )}

      {/* ── Top customers ─────────────────────────────────────────────── */}
      <div id="shoprep-top-customers" style={{ margin: "24px 20px 0" }}>
        <SectionTitle title="Top Customers" />
        <Card style={{ margin: 0, padding: 0, overflow: "hidden", border: `1px solid rgba(110,15,45,0.18)`, borderRadius: 16 }}>
          {m.salesLoading ? (
            <div style={{ padding: 16 }}><LoadingState variant="skeleton" rows={3} /></div>
          ) : m.salesError ? (
            <ErrorState error={undefined} onRetry={m.refetchSales} />
          ) : topCustomers.length === 0 ? (
            <div style={{ padding: "20px 16px", textAlign: "center" as const, fontFamily: F.u, fontSize: 14, color: C.muted }}>
              No customer sales in this period.
            </div>
          ) : (
            topCustomers.map((c, i) => (
              <div key={c.custId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < topCustomers.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: i === 0 ? "rgba(200,155,71,0.18)" : "rgba(110,15,45,0.06)",
                  fontFamily: F.d, fontWeight: 700, fontSize: 15, color: i === 0 ? C.gold : C.burg,
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{c.name}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{c.purchases} purchase{c.purchases === 1 ? "" : "s"}</div>
                </div>
                {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 16, color: C.gold, flexShrink: 0 }}><Money value={rupees(c.total)} /></div>}
              </div>
            ))
          )}
        </Card>
      </div>

      <ExportReportDialog
        dialog={exportDialog}
        onClose={() => { setExportDialog(null); setExportDone(false); }}
        format={exportFormat}
        setFormat={setExportFormat}
        done={exportDone}
        setDone={setExportDone}
        formats={["csv", "excel"]}
        includes={
          tab === "sales"
            ? ["Date, time and saree ID", "Customer and sales channel", "Payment method and staff member", ...(canSeePrices ? ["Amount as a raw number, ready to sum"] : [])]
            : ["Return date and saree ID", "Reason for the return", ...(canSeePrices ? ["Refund amount as a raw number"] : [])]
        }
        onExport={runExport}
      />
    </div>
  );
}

export { SalesReport };
