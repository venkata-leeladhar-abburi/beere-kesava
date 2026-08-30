import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tag, Banknote, Percent, RefreshCcw, Store } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { T, F } from "../theme";
import { semantic } from "../../../../design-system/tokens";
import { FadeUp, SilkSumCard, SectionCard, ReportDLBar } from "../common/primitives";
import {
  ChartCard, ChartBand, ChartHint, TrackBar, BAND, CHART, NUM, CountUp
} from "../../../production/components/sections/chart-primitives";
import { salesApi } from "../../../../shared/api/sales";
import { customersApi } from "../../../../shared/api/customers";
import { batchesApi } from "../../../../shared/api/batches";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";
import { useReportPeriod, useRegisterExport } from "../PeriodContext";

interface RetailSaleRow {
  id: string;
  date: string;
  customer: string;
  phone: string;
  sarId: string;
  price: number;
}

function RetailWeeklyTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>
        {label} — {d.sarees} sarees sold — {formatMoney(rupees(d.revenue))} revenue
      </span>
    </div>
  );
}

export function RetailSalesReport() {
  const { data: salesRes, isLoading: salesLoading, isError: salesError, refetch: refetchSales } = useQuery({
    queryKey: ["reports", "sales"],
    queryFn: () => salesApi.list(),
  });
  const { data: returnsRes, isError: returnsError, refetch: refetchReturns } = useQuery({
    queryKey: ["reports", "sale-returns"],
    queryFn: () => salesApi.listReturns(),
  });
  const { data: customersRes, isError: customersError, refetch: refetchCustomers } = useQuery({
    queryKey: ["reports", "customers-roster"],
    queryFn: () => customersApi.list(),
  });
  const { data: batchesRes } = useQuery({
    queryKey: ["reports", "batches-design-type"],
    queryFn: () => batchesApi.list(),
  });

  const isError = salesError || returnsError || customersError;
  const refetchAll = () => { void refetchSales(); void refetchReturns(); void refetchCustomers(); };

  const { inCurrent, label: periodLabel } = useReportPeriod();

  const retailSales = useMemo(() => {
    return (salesRes?.items ?? []).filter(s => s.channel === "RETAIL" && inCurrent(s.saleDate));
  }, [salesRes, inCurrent]);

  const customerById = useMemo(() => {
    return new Map((customersRes?.items ?? []).map(c => [c.id, c]));
  }, [customersRes]);

  const returnBySareeId = useMemo(() => {
    return new Map((returnsRes?.items ?? []).map(r => [r.sareeId, r]));
  }, [returnsRes]);

  const sareeInfoMap = useMemo(() => {
    const map = new Map<string, { designCode: string | null; sareeTypeCode: string | null }>();
    if (batchesRes?.items) {
      for (const b of batchesRes.items) {
        for (const r of b.rows) {
          if (r.sareeId) {
            map.set(r.sareeId, { designCode: r.designCode, sareeTypeCode: r.sareeTypeCode });
          }
        }
      }
    }
    return map;
  }, [batchesRes]);

  const retailRows = useMemo(() => {
    return retailSales
      .slice()
      .sort((a, b) => b.saleDate.localeCompare(a.saleDate))
      .map(s => {
        const ret = returnBySareeId.get(s.sareeId);
        const customer = s.customerId ? customerById.get(s.customerId) : undefined;
        return {
          id: s.saleRef,
          date: new Date(s.saleDate).toLocaleDateString("en-IN"),
          customer: ret ? "RETURN" : (customer?.name ?? "Walk-in Customer"),
          phone: customer?.phone ?? "—",
          sarId: s.sareeId,
          price: ret ? -Number(ret.refundAmount) : Number(s.amount),
        };
      });
  }, [retailSales, returnBySareeId, customerById]);

  const totalRevenue = retailRows.filter(r => r.price > 0).reduce((s, r) => s + r.price, 0);
  const refundTotal = retailRows.filter(r => r.price < 0).reduce((s, r) => s - r.price, 0);
  const netRevenue = totalRevenue - refundTotal;
  const returnsTotal = retailRows.filter(r => r.price < 0).length;
  const avgSale = retailRows.length - returnsTotal > 0 ? totalRevenue / (retailRows.length - returnsTotal) : 0;

  // Day-of-month buckets over whatever period is selected. These used to
  // match every sale ever recorded on those days regardless of month or year,
  // so the chart and its summary strip showed all-time figures under a
  // current-month heading.
  const retailWeeklyData = useMemo(() => {
    const weeks = [
      { label: "Week 1 (1–7)", from: 1, to: 7 },
      { label: "Week 2 (8–15)", from: 8, to: 15 },
      { label: "Week 3 (16–22)", from: 16, to: 22 },
      { label: "Week 4 (23–31)", from: 23, to: 31 },
    ];
    return weeks.map(w => {
      const inWeek = retailSales.filter(s => {
        const day = new Date(s.saleDate).getDate();
        return day >= w.from && day <= w.to;
      });
      return { week: w.label, sarees: inWeek.length, revenue: inWeek.reduce((s, sale) => s + Number(sale.amount), 0) };
    });
  }, [retailSales]);

  const retailDesignSales = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sale of retailSales) {
      const info = sareeInfoMap.get(sale.sareeId);
      const code = info?.designCode ?? "General Design";
      counts[code] = (counts[code] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([design, count]) => ({ design, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [retailSales, sareeInfoMap]);

  const retailRevenueDonut = useMemo(() => {
    const typeMap: Record<string, number> = {};
    const colors = semantic.chart.series;

    for (const sale of retailSales) {
      // A returned saree brought in no revenue, so it must not inflate its
      // type's slice — the headline revenue figure already nets refunds out.
      if (returnBySareeId.has(sale.sareeId)) continue;
      const info = sareeInfoMap.get(sale.sareeId);
      const type = info?.sareeTypeCode ?? "Silk Saree";
      typeMap[type] = (typeMap[type] || 0) + Number(sale.amount);
    }

    const entries = Object.entries(typeMap);
    if (entries.length === 0) return [];
    return entries.map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [retailSales, sareeInfoMap, returnBySareeId]);

  const maxDesignCount = Math.max(1, ...(retailDesignSales.map(d => d.count)));

  useRegisterExport(useMemo(() => ({
    name: "Retail Sales Report",
    headers: ["Sale ID", "Sale Date", "Customer", "Phone", "Saree ID", "Retail Price"],
    rows: retailRows.map(r => [r.id, r.date, r.customer, r.phone, r.sarId, r.price]),
  }), [retailRows]));

  const retailColumns: ColumnDef<RetailSaleRow>[] = [
    {
      id: "id", header: "Sale ID", accessor: r => r.id,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>{r.id}</span>,
    },
    {
      id: "date", header: "Sale Date", accessor: r => r.date,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.date}</span>,
    },
    {
      id: "customer", header: "Customer Name", accessor: r => r.customer,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span>,
    },
    {
      id: "phone", header: "Phone", accessor: r => r.phone,
      cell: (_v, r) => <span style={{ color: T.taupe }}>{r.phone}</span>,
    },
    {
      id: "sarId", header: "Saree ID", accessor: r => r.sarId,
      cell: (_v, r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{r.sarId}</span>,
    },
    {
      id: "price", header: "Retail Price", accessor: r => r.price, align: "end",
      cell: (_v, r) => (
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: r.price < 0 ? T.crimson : T.green }}>
          <Money value={rupees(r.price)} sign={r.price < 0} />
        </span>
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

      <FadeUp>
        <ChartCard style={{ marginBottom: 24 }}>
          <ChartBand tone="output" icon={<Store size={19} color={BAND.output.icon} />} title="Sarees Sold Each Week" sub={`${periodLabel} — weekly breakdown`} />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sarees Sold</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.royalBurgundy }}>{retailWeeklyData.reduce((s, w) => s + w.sarees, 0)}</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Revenue</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.green }}><Money value={rupees(retailWeeklyData.reduce((s, w) => s + w.revenue, 0))} /></div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={retailWeeklyData}>
              <CartesianGrid key="retw-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="retw-x" dataKey="week" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="retw-y" tick={{ fontFamily: "var(--font-mono)", fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={30} />
              <Tooltip key="retw-tip" content={<RetailWeeklyTooltip />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="retw-bar" dataKey="sarees" name="Sarees Sold" fill={T.royalBurgundy} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>
      </FadeUp>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 20, marginBottom: 24, alignItems: "stretch" }}>
        <ChartCard>
          <ChartBand tone="pipeline" icon={<Tag size={19} color={BAND.pipeline.icon} />} title="Which Designs Sold Most at Retail" sub="Top 5 designs by saree count" />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {retailDesignSales.length === 0 ? (
            <div style={{ padding: "30px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              No retail sales recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "10px 0" }}>
              {retailDesignSales.map((d, i) => (
                <div key={d.design}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{d.design}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{d.count} sarees</span>
                  </div>
                  <TrackBar pct={Math.round((d.count / maxDesignCount) * 100)} fill={T.royalBurgundy} height={9} delay={i * 0.08} />
                </div>
              ))}
            </div>
          )}
          </div>
        </ChartCard>

        <ChartCard>
          <ChartBand tone="orders" icon={<Percent size={19} color={BAND.orders.icon} />} title="Revenue by Saree Type" sub="Retail revenue split" />
          <div className="p-5 sm:p-6" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {retailRevenueDonut.length === 0 ? (
            <div style={{ padding: "30px 0", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              No retail sales recorded yet.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie key="ret-rev-pie" data={retailRevenueDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none" paddingAngle={3}>
                    {retailRevenueDonut.map(e => <Cell key={`ret-rev-cell-${e.name}`} fill={e.color} />)}
                  </Pie>
                  <Tooltip key="ret-rev-tip" formatter={(v: number | string, n: string) => [formatMoney(rupees(Number(v))), n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "0 4px" }}>
                {retailRevenueDonut.map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: d.color }}><Money value={rupees(d.value)} /></span>
                  </div>
                ))}
              </div>
            </>
          )}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: 22, marginBottom: 28, alignItems: "stretch" }}>
        <SilkSumCard icon={<Tag size={22} color={T.antiqueGold} />} label="Total Sarees Sold at Shop" value={`${retailRows.length - returnsTotal} sarees`} sub="Retail sales in the selected period" gid="rsr-s" />
        <SilkSumCard icon={<Banknote size={22} color={T.antiqueGold} />} label="Total Retail Revenue" value={formatMoney(rupees(netRevenue))} sub={refundTotal > 0 ? `After ${formatMoney(rupees(refundTotal))} refunded` : "All-time, net of returns"} gid="rsr-r" />
        <SilkSumCard icon={<Percent size={22} color={T.antiqueGold} />} label="Average Sale Value" value={avgSale > 0 ? formatMoney(rupees(avgSale)) : "—"} sub="Per saree" gid="rsr-a" />
        <SilkSumCard icon={<RefreshCcw size={22} color={T.antiqueGold} />} label="Total Returns at Shop" value={`${returnsTotal} sarees`} sub={refundTotal > 0 ? `${formatMoney(rupees(refundTotal))} refunded` : "All-time"} gid="rsr-t" />
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div className="w-full">
            <div className="min-w-[850px]">
              <DataTable
                columns={retailColumns}
                data={retailRows}
                getRowId={r => r.id + r.sarId}
                loading={salesLoading}
                error={!!isError}
                onRetry={refetchAll}
                emptyTitle="No retail sales recorded yet."
                pagination
              />
            </div>
          </div>
        </div>
      </FadeUp>
    </SectionCard>
    </div>
  );
}
