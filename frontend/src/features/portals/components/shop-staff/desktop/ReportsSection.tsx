/**
 * Shop Staff → Reports (tablet + desktop).
 * ═══════════════════════════════════════════════════════════════════════════
 * Layout in three bands:
 *   1. Controls   — the app-wide DateFilterBar timeline + a live result count
 *                   + Export, in one toolbar card.
 *   2. Analytics  — revenue trend, performance tiles, and four equal-height
 *                   insight cards. Every figure obeys the timeline.
 *   3. Records    — one "Sales & Returns" section with a tab per record type,
 *                   each a real <DataTable> (aligned columns, sortable
 *                   headers, its own pagination) rather than a grid-of-divs.
 */
import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie,
} from "recharts";
import {
  LayoutGrid, Table as TableIcon,
  BarChart2, RotateCcw, ShoppingBag, TrendingUp, Users, Wallet, CreditCard,
  Award, Download, ReceiptText,
} from "lucide-react";
import { C, F, PageHero, PortalStatsStrip, type PortalStat } from "../theme";
import { Button } from "../../../../../shared/ui/primitives";
import { LoadingState, ErrorState } from "../../../../../shared/ui/state";
import { ChartFigure, DataTable, exportTable } from "../../../../../shared/ui/data";
import { DateFilterBar } from "../../../../../shared/ui/DateFilterBar";
import { ViewSelector } from "../../../../../shared/ui/ViewSelector";
import { RoyalSubTabStrip } from "../../../../../shared/ui/RoyalSubTabStrip";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { useSalesReportModel } from "../salesReportModel";
import { CHART_COLORS, ChartLegend } from "../reportCharts";
import { salesReportColumns, returnReportColumns } from "../reportColumns";
import { ExportReportDialog, type ExportFormat } from "./ExportReportDialog";

// Record-view toggle — the same two records can be read as a scannable table
// or as one card per row; the reader picks, at any viewport.
const RECORD_VIEWS = [
  { key: "table" as const, label: "Table", Icon: TableIcon },
  { key: "cards" as const, label: "Cards", Icon: LayoutGrid },
];
type RecordView = (typeof RECORD_VIEWS)[number]["key"];

const CARD: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 20,
  border: "1px solid rgba(110,15,45,0.14)",
  boxShadow: "0 1px 2px rgba(74,6,27,0.03), 0 8px 24px rgba(74,6,27,0.05)",
};

/** Equal-height card with a burgundy icon header. */
function Panel({ title, subtitle, icon: Icon, children, align = "start" }: {
  title: string; subtitle?: string; icon?: React.ElementType;
  children: React.ReactNode; align?: "start" | "center";
}) {
  return (
    <section style={{ ...CARD, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 24px", borderBottom: `1px solid rgba(110,15,45,0.10)`, background: "linear-gradient(180deg, #FFFDF9 0%, #FFFFFF 100%)" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {Icon ? <Icon size={18} color={C.burg} /> : <BarChart2 size={18} color={C.burg} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 700, color: C.text }}>{title}</div>
          {subtitle && <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 1 }}>{subtitle}</div>}
        </div>
      </header>
      <div style={{ padding: 22, flex: 1, display: "flex", flexDirection: "column", justifyContent: align === "center" ? "center" : "flex-start", minWidth: 0 }}>
        {children}
      </div>
    </section>
  );
}

function MiniStat({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      padding: "16px 18px", borderRadius: 16, minWidth: 0,
      background: accent ? "linear-gradient(135deg, rgba(110,15,45,0.06) 0%, rgba(200,155,71,0.08) 100%)" : "#FFFDF9",
      border: `1px solid ${accent ? "rgba(200,155,71,0.32)" : "rgba(110,15,45,0.10)"}`,
    }}>
      <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: F.d, fontSize: 24, fontWeight: 700, color: C.text, marginTop: 6, overflowWrap: "anywhere" }}>{value}</div>
      {sub && <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function ShareBar({ label, right, pct, color }: { label: string; right: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: F.u, fontSize: 13, color: C.text, marginBottom: 6 }}>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ color: C.muted, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{right}</span>
      </div>
      <div style={{ height: 8, borderRadius: 6, background: "rgba(110,15,45,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(pct, 1.5)}%`, height: "100%", background: color, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export function ReportsSection({ isTablet, canSeePrices }: {
  bp: "tablet" | "desktop"; isTablet: boolean; canSeePrices: boolean;
}) {
  const m = useSalesReportModel();
  const {
    filter, setFilter, filterLabel, salesRows, returnRows, metrics,
    trend, paymentMix, returnReasons, channelData, topCustomers,
  } = m;

  const [tab, setTab] = React.useState<"sales" | "returns">("sales");
  // Desktop defaults to the table — there is room for every column.
  const [recordView, setRecordView] = React.useState<RecordView>("table");
  const [exportDialog, setExportDialog] = React.useState<{ label: string } | null>(null);
  const [exportFormat, setExportFormat] = React.useState<ExportFormat>("excel");
  const [exportDone, setExportDone] = React.useState(false);

  const salesColumns = React.useMemo(() => salesReportColumns(canSeePrices), [canSeePrices]);
  const returnColumns = React.useMemo(() => returnReportColumns(canSeePrices), [canSeePrices]);

  async function runExport(format: ExportFormat) {
    const fmt = format === "excel" ? "xlsx" : "csv";
    if (tab === "sales") {
      await exportTable({ columns: salesColumns, rows: salesRows, filename: `sales_report_${filterLabel.replace(/\s+/g, "_")}`, format: fmt });
    } else {
      await exportTable({ columns: returnColumns, rows: returnRows, filename: `returns_report_${filterLabel.replace(/\s+/g, "_")}`, format: fmt });
    }
  }

  const stats: PortalStat[] = [
    { label: "Total sales", value: metrics.totalSalesCount, sub: "Sarees sold", icon: BarChart2, highlight: true },
    ...(canSeePrices ? [{ label: "Total revenue", value: formatMoney(rupees(metrics.totalRevenue)), sub: "Gross sales", icon: ShoppingBag }] : []),
    { label: "Returns", value: metrics.returnsCount, sub: `${metrics.returnRate.toFixed(1)}% of sales`, icon: RotateCcw },
    ...(canSeePrices ? [{ label: "Average per sale", value: formatMoney(rupees(metrics.avgRevenue)), sub: "Per saree", icon: BarChart2 }] : []),
  ];

  const insightCols = isTablet ? "1fr" : "repeat(3, minmax(0, 1fr))";
  const avgPerDay = trend.length > 0 ? Math.round(metrics.totalRevenue / trend.length) : 0;

  return (
    <>
      <PageHero
        eyebrow="Shop Staff Portal · Beere Kesava & Brothers Silks"
        title="Sales Report"
        titleAccent="& Analytics"
        description="Review all sales, revenue, customer trends, and return patterns across retail and wholesale channels."
      />
      <PortalStatsStrip stats={stats} />

      <div style={{ padding: isTablet ? "24px 28px 48px" : "36px 48px 64px", display: "flex", flexDirection: "column", gap: 28 }}>
        {/* ── 1. Controls ─────────────────────────────────────────────── */}
        <section style={{ ...CARD, padding: isTablet ? "18px 20px" : "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minWidth: 0 }}>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: C.muted }}>Timeline</span>
            <DateFilterBar filter={filter} onChange={setFilter} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto", flexWrap: "wrap" }}>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>
              <strong style={{ color: C.text }}>{filterLabel}</strong> · {metrics.totalSalesCount} sales · {metrics.returnsCount} returns
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => { setExportDone(false); setExportDialog({ label: tab === "sales" ? `Sales — ${filterLabel}` : `Returns — ${filterLabel}` }); }}
              className="rounded-[14px] border-none bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] font-bold gap-2"
            >
              <Download size={16} /> Export
            </Button>
          </div>
        </section>

        {/* ── 2. Revenue trend ────────────────────────────────────────── */}
        <Panel title="Revenue Trend" subtitle={filterLabel} icon={TrendingUp}>
          {trend.length === 0 ? (
            <div style={{ padding: "56px 16px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>
              No sales in this period — pick a wider timeline to see the trend.
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 22 }}>
                <MiniStat label="Days traded" value={trend.length} sub="With at least one sale" />
                {canSeePrices && <MiniStat label="Average / day" value={<Money value={rupees(avgPerDay)} />} sub="Across the period" />}
                <MiniStat label="Peak day" value={metrics.bestDay?.label ?? "—"} sub={metrics.bestDay ? `${metrics.bestDay.count} sales` : "No sales yet"} accent />
                {canSeePrices && <MiniStat label="Peak revenue" value={<Money value={rupees(metrics.bestDay?.revenue ?? 0)} />} sub="Best single day" />}
              </div>
              <ChartFigure
                title="Revenue Trend"
                summary={`Revenue across ${trend.length} day${trend.length === 1 ? "" : "s"}, peaking on ${metrics.bestDay?.label ?? "—"}.`}
              >
                <ResponsiveContainer width="100%" height={isTablet ? 240 : 300}>
                  <AreaChart data={trend} margin={{ left: 4, right: 16, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="shopRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.burg} stopOpacity={0.30} />
                        <stop offset="100%" stopColor={C.burg} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,15,45,0.08)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontFamily: F.m, fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
                    <YAxis
                      tick={{ fontFamily: F.m, fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={58}
                      tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                    />
                    <Tooltip
                      contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 10 }}
                      labelStyle={{ fontWeight: 700, color: C.text }}
                      formatter={(v: number) => [formatMoney(rupees(v)), "Revenue"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke={C.burg} strokeWidth={2.5} fill="url(#shopRevGrad)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartFigure>
            </>
          )}
        </Panel>

        {/* ── Performance tiles ───────────────────────────────────────── */}
        <Panel title="Performance Summary" subtitle={`Every figure below covers ${filterLabel.toLowerCase()}`} icon={Award}>
          <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 14 }}>
            {canSeePrices && <MiniStat label="Net revenue" value={<Money value={rupees(metrics.netRevenue)} />} sub="After refunds" accent />}
            {canSeePrices && <MiniStat label="Refunded" value={<Money value={rupees(metrics.refundTotal)} />} sub={`${metrics.returnsCount} returns`} />}
            {canSeePrices && <MiniStat label="Highest sale" value={<Money value={rupees(metrics.highestSale)} />} sub="Single saree" />}
            <MiniStat label="Customers" value={metrics.uniqueCustomers} sub="Unique buyers" />
            <MiniStat label="Retail" value={metrics.retailCount} sub={canSeePrices ? formatMoney(rupees(metrics.retailRevenue)) : "sarees sold"} />
            <MiniStat label="Wholesale" value={metrics.wholesaleCount} sub={canSeePrices ? formatMoney(rupees(metrics.wholesaleRevenue)) : "sarees sold"} />
            <MiniStat label="Return rate" value={`${metrics.returnRate.toFixed(1)}%`} sub="Of total sales" />
            <MiniStat label="Avg / sale" value={canSeePrices ? <Money value={rupees(metrics.avgRevenue)} /> : metrics.totalSalesCount} sub={canSeePrices ? "Per saree" : "Sarees sold"} />
          </div>
        </Panel>

        {/* ── Insight cards ───────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: insightCols, gap: 22, alignItems: "stretch" }}>
          <Panel title="Sales by Channel" icon={BarChart2} align="center">
            {metrics.totalSalesCount === 0 && metrics.returnsCount === 0 ? (
              <div style={{ padding: "28px 8px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>Nothing recorded in this period.</div>
            ) : (
              <ChartFigure title="Sales by Channel" summary={channelData.map(d => `${d.design} ${d.count}`).join(", ") + "."}>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={channelData} layout="vertical" margin={{ left: 4, right: 28, top: 4, bottom: 4 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fontFamily: F.m, fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="design" tick={{ fontFamily: F.u, fontSize: 12, fill: C.text }} axisLine={false} tickLine={false} width={78} />
                    <Tooltip cursor={{ fill: "rgba(110,15,45,0.04)" }} contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 10 }} formatter={(v: number) => [`${v} sarees`, "Count"]} />
                    <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={26} isAnimationActive={false}>
                      {channelData.map(entry => (
                        <Cell key={`cell-${entry.design}`} fill={entry.design === "Retail" ? C.burg : entry.design === "Wholesale" ? C.gold : C.crim} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFigure>
            )}
          </Panel>

          <Panel title="Payment Methods" icon={CreditCard} align="center">
            {paymentMix.length === 0 ? (
              <div style={{ padding: "28px 8px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>No sales in this period.</div>
            ) : (
              <ChartFigure title="Payment Methods" summary={paymentMix.map(p => `${p.method} ${p.count}`).join(", ") + "."}>
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={paymentMix} dataKey="count" nameKey="method" innerRadius={46} outerRadius={74} paddingAngle={2} isAnimationActive={false}>
                        {paymentMix.map((p, i) => <Cell key={p.method} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#FFF" strokeWidth={2} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 10 }} formatter={(v: number, n) => [`${v} sales`, String(n)]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ChartLegend items={paymentMix.map(p => ({ label: p.method, value: String(p.count) }))} />
                </>
              </ChartFigure>
            )}
          </Panel>

          <Panel title={canSeePrices ? "Revenue Split" : "Channel Split"} icon={Wallet}>
            {metrics.totalSalesCount === 0 ? (
              <div style={{ padding: "28px 8px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>No sales in this period.</div>
            ) : canSeePrices ? (
              <div>
                {[
                  { label: "Retail", value: metrics.retailRevenue, color: C.burg },
                  { label: "Wholesale", value: metrics.wholesaleRevenue, color: C.gold },
                ].map(row => {
                  const pct = metrics.totalRevenue > 0 ? (row.value / metrics.totalRevenue) * 100 : 0;
                  return <ShareBar key={row.label} label={row.label} right={`${formatMoney(rupees(row.value))} · ${Math.round(pct)}%`} pct={pct} color={row.color} />;
                })}
                <div style={{ marginTop: 6, paddingTop: 14, borderTop: `1px solid rgba(110,15,45,0.08)`, display: "flex", justifyContent: "space-between", fontFamily: F.u, fontSize: 13, color: C.muted }}>
                  <span>Refunded</span>
                  <span style={{ color: C.crim, fontWeight: 700 }}>− {formatMoney(rupees(metrics.refundTotal))}</span>
                </div>
              </div>
            ) : (
              <div>
                {[
                  { label: "Retail", value: metrics.retailCount, color: C.burg },
                  { label: "Wholesale", value: metrics.wholesaleCount, color: C.gold },
                ].map(row => {
                  const pct = metrics.totalSalesCount > 0 ? (row.value / metrics.totalSalesCount) * 100 : 0;
                  return <ShareBar key={row.label} label={row.label} right={`${row.value} · ${Math.round(pct)}%`} pct={pct} color={row.color} />;
                })}
              </div>
            )}
          </Panel>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 22, alignItems: "stretch" }}>
          <Panel title="Top Customers" subtitle={filterLabel} icon={Users}>
            {m.salesLoading ? (
              <LoadingState variant="skeleton" rows={3} />
            ) : m.salesError ? (
              <ErrorState error={undefined} onRetry={m.refetchSales} />
            ) : topCustomers.length === 0 ? (
              <div style={{ padding: "28px 8px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>No customer sales in this period.</div>
            ) : (
              <div>
                {topCustomers.map((c, i) => (
                  <div key={c.custId} style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 0", borderBottom: i < topCustomers.length - 1 ? `1px solid rgba(110,15,45,0.07)` : "none" }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: i === 0 ? "rgba(200,155,71,0.18)" : "rgba(110,15,45,0.06)",
                      fontFamily: F.d, fontWeight: 700, fontSize: 16, color: i === 0 ? C.gold : C.burg,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{c.purchases} purchase{c.purchases === 1 ? "" : "s"}</div>
                    </div>
                    {canSeePrices && (
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 17, color: C.gold, flexShrink: 0 }}>
                        <Money value={rupees(c.total)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Return Reasons" subtitle={`${metrics.returnsCount} returns`} icon={RotateCcw}>
            {returnReasons.length === 0 ? (
              <div style={{ padding: "28px 8px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>No returns in this period.</div>
            ) : (
              <div>
                {returnReasons.map(r => {
                  const pct = metrics.returnsCount > 0 ? (r.count / metrics.returnsCount) * 100 : 0;
                  return <ShareBar key={r.reason} label={r.reason} right={`${r.count} · ${Math.round(pct)}%`} pct={pct} color={C.burg} />;
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* ── 3. Records ──────────────────────────────────────────────── */}
        <section id="shoprep-records" style={{ ...CARD, overflow: "hidden" }}>
          <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, padding: "20px 24px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 5, height: 24, borderRadius: 3, background: C.gold }} />
              <div>
                <div style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: C.text }}>Sales &amp; Returns</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{filterLabel} · sorted newest first</div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setExportDone(false); setExportDialog({ label: tab === "sales" ? `Sales — ${filterLabel}` : `Returns — ${filterLabel}` }); }}
              className="ml-auto rounded-[12px] border border-[rgba(110,15,45,0.16)] bg-white hover:bg-[rgba(110,15,45,0.05)] font-semibold gap-2 text-[#6E0F2D]"
            >
              <Download size={15} /> Export {tab === "sales" ? "sales" : "returns"}
            </Button>
          </header>

          <div style={{ padding: "16px 24px 24px" }}>
            <RoyalSubTabStrip
              tabs={[
                { key: "sales", label: `Sales (${metrics.totalSalesCount})`, icon: <ReceiptText size={16} /> },
                { key: "returns", label: `Returns (${metrics.returnsCount})`, icon: <RotateCcw size={16} /> },
              ]}
              activeTab={tab}
              onTabChange={setTab}
            />

            {/* Table ⇄ Cards — same rows, same pagination, two readings. */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: C.muted }}>
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
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14, marginTop: 14, padding: "16px 20px", background: "#FFFDF9", border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 14 }}>
                    <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>Total ({filterLabel})</span>
                    <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}><Money value={rupees(metrics.totalRevenue)} /></span>
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
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14, marginTop: 14, padding: "16px 20px", background: "#FFFDF9", border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 14 }}>
                    <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>Refunded ({filterLabel})</span>
                    <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.burg }}><Money value={rupees(metrics.refundTotal)} /></span>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
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
    </>
  );
}
