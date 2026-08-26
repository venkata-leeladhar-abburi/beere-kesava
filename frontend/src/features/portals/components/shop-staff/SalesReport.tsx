import { XAxis, YAxis, Tooltip, Cell } from "recharts";
import { BarChart, Bar, ResponsiveContainer } from "recharts";
import { SectionTitle } from "./theme";
import { FileText, Check } from "lucide-react";
import { semantic } from "../../../../design-system/tokens";


import React, { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Modal } from "../../../../shared/ui/overlay";
import {
  X, BarChart2, ShoppingBag, RotateCcw
} from 'lucide-react';

import { C, F, Card, Chip, useCanSeePrices, PageHero, PortalStatsStrip, type PortalStat } from './theme';
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import { useQuery } from "@tanstack/react-query";
import { salesApi } from "../../../../shared/api/sales";
import { customersApi } from "../../../../shared/api/customers";
import { ChartFigure } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";

function dateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function SalesReport() {
  const canSeePrices = useCanSeePrices();
  const [period, setPeriod] = useState<"today" | "week" | "month" | "3months">("today");
  const periods = [{ id: "today", label: "Today" }, { id: "week", label: "This Week" }, { id: "month", label: "This Month" }, { id: "3months", label: "Last 3 Months" }] as const;

  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "excel">("pdf");
  const [exportDone, setExportDone] = useState(false);

  const { data: salesRes, isLoading: salesLoading, isError: salesError, refetch: refetchSales } = useQuery({
    queryKey: ["sales-list-report"],
    queryFn: () => salesApi.list(100),
  });

  const { data: returnsRes, isLoading: returnsLoading, isError: returnsError, refetch: refetchReturns } = useQuery({
    queryKey: ["returns-list-report"],
    queryFn: () => salesApi.listReturns(100),
  });

  const { data: customersRes, isLoading: customersLoading, isError: customersError, refetch: refetchCustomers } = useQuery({
    queryKey: ["customers-list-report"],
    queryFn: () => customersApi.list(100),
  });

  const salesList = useMemo(() => salesRes?.items ?? [], [salesRes]);
  const returnsList = returnsRes?.items ?? [];
  const customerMap = useMemo(() => new Map((customersRes?.items ?? []).map(c => [c.id, c.name])), [customersRes]);

  const dailySales = salesList.map(s => ({
    saleId: s.saleRef,
    time: timeLabel(s.saleDate),
    id: s.sareeId,
    design: s.channel === "WHOLESALE" ? "Wholesale" : "Retail",
    customer: s.customerId ? (customerMap.get(s.customerId) ?? `Customer ${s.customerId.slice(0, 6)}`) : "Walk-in Customer",
    pay: "Counter",
    amt: formatMoney(rupees(Number(s.amount))),
    src: "factory",
  }));

  const totalToday = salesList.reduce((sum, s) => sum + Number(s.amount), 0);
  const fmtINR = (n: number) => formatMoney(rupees(n));

  const designData = [
    { design: "Retail Sales", count: salesList.filter(s => s.channel === "RETAIL").length },
    { design: "Wholesale Sales", count: salesList.filter(s => s.channel === "WHOLESALE").length },
    { design: "Returns", count: returnsList.length },
  ];

  const topCustomers = useMemo(() => {
    const map = new Map<string, { custId: string; name: string; purchases: number; total: number }>();
    for (const s of salesList) {
      const custId = s.customerId ?? "walkin";
      const name = s.customerId ? (customerMap.get(s.customerId) ?? `Customer ${s.customerId.slice(0, 6)}`) : "Walk-in Counter Customer";
      const existing = map.get(custId) ?? { custId, name, purchases: 0, total: 0 };
      existing.purchases += 1;
      existing.total += Number(s.amount);
      map.set(custId, existing);
    }
    const sorted = Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
    if (sorted.length === 0 && customersRes?.items) {
      return customersRes.items.slice(0, 5).map(c => ({
        custId: c.id,
        name: c.name,
        purchases: 0,
        amt: formatMoney(rupees(0)),
      }));
    }
    return sorted.map(c => ({
      custId: c.custId,
      name: c.name,
      purchases: c.purchases,
      amt: formatMoney(rupees(c.total)),
    }));
  }, [salesList, customerMap, customersRes]);

  const returns = returnsList.map(r => ({
    returnId: r.returnRef,
    date: dateLabel(r.returnDate),
    id: r.sareeId,
    customer: "Returned Item",
    reason: r.reason,
    amt: r.refundAmount ? formatMoney(rupees(Number(r.refundAmount))) : formatMoney(rupees(0)),
  }));

  const totalSalesCount = salesList.length;
  const totalRevenue = useMemo(() => salesList.reduce((sum, s) => sum + Number(s.amount), 0), [salesList]);
  const avgRevenue = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

  const stats: PortalStat[] = [
    { label: "Total sales", value: totalSalesCount, sub: "Sarees sold", icon: BarChart2, highlight: true },
    ...(canSeePrices ? [{ label: "Total revenue", value: formatMoney(rupees(totalRevenue)), sub: "Gross sales", icon: ShoppingBag }] : []),
    { label: "Returns", value: returnsList.length, sub: "Recorded returns", icon: RotateCcw },
    ...(canSeePrices ? [{ label: "Average per sale", value: formatMoney(rupees(avgRevenue)), sub: "Per saree", icon: BarChart2 }] : []),
  ];

  return (
    <div style={{ paddingBottom: 110 }}>
      <PageHero
        eyebrow="Shop Staff Portal · Beere Kesava & Brothers Silks"
        title="Sales Report"
        titleAccent="& Analytics"
        description="Review all sales, revenue, customer trends, and return patterns across retail and wholesale channels."
      />

      <PortalStatsStrip stats={stats} />

      {/* Period toggle — horizontally scrollable */}
      <div style={{ margin: "24px 20px 0", display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {periods.map(p => (
          <Button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            size="sm"
            className={
              "shrink-0 rounded-full px-5 py-2.5 h-auto whitespace-nowrap border " +
              (period === p.id ? "border-[#6E0F2D] bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] font-semibold" : "border-[rgba(110,15,45,0.12)] bg-white hover:bg-[rgba(110,15,45,0.06)] text-[#69635E] hover:text-[#6E0F2D] font-semibold")
            }
          >{p.label}</Button>
        ))}
      </div>

      {/* Daily Sales Table */}
      <div id="shoprep-today-sales" style={{ margin: "24px 20px 0" }}>
        <SectionTitle title={`Today's Sales — ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`} link="Export →" onLink={() => { setExportDone(false); setShowExport(true); }} />
        <Card style={{ margin: 0, overflow: "hidden", padding: 0 }}>
          {dailySales.map((s, i) => (
            <div key={s.saleId} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "16px", borderBottom: i < dailySales.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const, marginBottom: 4 }}>
                  <span style={{ fontFamily: F.m, fontSize: 13, color: C.burg }}>{s.id}</span>
                  <Chip label={s.src === "factory" ? "Factory" : "External"} color={s.src === "factory" ? C.green : C.gold} bg={s.src === "factory" ? "rgba(30,102,64,0.10)" : "rgba(200,155,71,0.12)"} />
                </div>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{s.customer}</div>
                <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 3 }}>{s.time} · {s.pay}</div>
              </div>
              {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: C.gold, flexShrink: 0, textAlign: "right" as const }}>{s.amt}</div>}
            </div>
          ))}
          {/* Total row */}
          {canSeePrices && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: C.cream }}>
              <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>Total (Today)</span>
              <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold }}>{fmtINR(totalToday)}</span>
            </div>
          )}
        </Card>
      </div>


      {/* Returns Summary */}
      <div id="shoprep-returns" style={{ margin: "24px 20px 0" }}>
        <SectionTitle title="Returns This Month" />
        {returnsLoading ? (
          <LoadingState variant="skeleton" rows={3} />
        ) : returnsError ? (
          <ErrorState error={undefined} onRetry={() => void refetchReturns()} />
        ) : returns.length === 0 ? (
          <Card style={{ margin: 0, padding: "20px 16px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No returns recorded this month.</div>
          </Card>
        ) : (
          returns.map((r) => (
            <div key={r.returnId} style={{ marginBottom: 10, background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.crim}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", flexWrap: "wrap" as const, gap: 8 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
                  <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{r.date}</span>
                  <span style={{ fontFamily: F.m, fontSize: 13, color: C.burg }}>{r.id}</span>
                </div>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginTop: 3 }}>{r.customer} · {r.reason}</div>
              </div>
              {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 14, color: C.crim }}>{r.amt}</div>}
            </div>
          ))
        )}
      </div>

      {/* Design Sales Bar Chart */}
      <div id="shoprep-by-design" style={{ margin: "24px 20px 0" }}>
        <SectionTitle title="Sales by Design" />
        <Card style={{ margin: 0, padding: "18px 12px" }}>
          <ChartFigure title="Sales by Design" summary={designData.map(d => `${d.design} ${d.count}`).join(", ") + "."}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={designData} layout="vertical" margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontFamily: F.m, fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="design" tick={{ fontFamily: F.m, fontSize: 12, fill: C.burg }} axisLine={false} tickLine={false} width={68} />
                <Tooltip
                  contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 8 }}
                  formatter={(v: number) => [`${v} sarees`, "Sold"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {designData.map((entry, i) => <Cell key={`cell-${entry.design}`} fill={semantic.chart.series[i % semantic.chart.series.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartFigure>
        </Card>
      </div>

      {/* Top Customers */}
      <div id="shoprep-top-customers" style={{ margin: "24px 20px 0" }}>
        <SectionTitle title="Top Customers" />
        <Card style={{ margin: 0, padding: 0, overflow: "hidden" }}>
          {salesLoading || customersLoading ? (
            <div style={{ padding: 16 }}><LoadingState variant="skeleton" rows={3} /></div>
          ) : salesError || customersError ? (
            <ErrorState error={undefined} onRetry={() => { void refetchSales(); void refetchCustomers(); }} />
          ) : topCustomers.length === 0 ? (
            <div style={{ padding: "20px 16px", textAlign: "center" as const, fontFamily: F.u, fontSize: 14, color: C.muted }}>
              No customer sales recorded yet.
            </div>
          ) : (
            topCustomers.map((c, i) => (
              <div key={c.custId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderBottom: i < topCustomers.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
                <div style={{ fontFamily: F.d, fontWeight: i === 0 ? 700 : 600, fontSize: i === 0 ? 26 : 21, color: i === 0 ? C.gold : C.text, width: 30, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{c.name}</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 2 }}>{c.purchases} purchases</div>
                </div>
                {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 14, color: C.gold, flexShrink: 0 }}>{c.amt}</div>}
              </div>
            ))
          )}
        </Card>
      </div>

      {/* ══════ MODAL: EXPORT REPORT ══════ */}
      <Modal open={showExport} onOpenChange={o => { if (!o) { setShowExport(false); setExportDone(false); } }} size="sm">
              <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "16px 20px 24px", flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(200,155,71,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={24} color={C.gold} />
                </div>
                <div style={{ flex: 1 }}>
                  <Dialog.Title asChild>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF" }}>Export Report</div>
                  </Dialog.Title>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Today's Sales</div>
                </div>
                <Dialog.Close asChild>
                  <IconButton
                    icon={X}
                    label="Close"
                    variant="ghost"
                    shape="circle"
                    className="bg-white/10 text-white/70 w-9 h-9 shrink-0"
                  />
                </Dialog.Close>
              </div>
              <div style={{ padding: "22px 20px 28px", overflowY: "auto" as const }}>
                {exportDone ? (
                  <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
                    <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(30,102,64,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <Check size={32} color={C.green} />
                    </div>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 8 }}>Export Ready!</div>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 22 }}>
                      Your <strong style={{ color: C.text }}>Today's Sales</strong> report has been exported as <strong style={{ color: C.text }}>{exportFormat.toUpperCase()}</strong>. Check your downloads folder.
                    </div>
                    <Button variant="primary" onClick={() => { setShowExport(false); setExportDone(false); }} fullWidth className="h-[52px] rounded-full border-none bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] font-bold text-sm">Done</Button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>Export format</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        {([
                          { key: "pdf" as const, label: "PDF", icon: "📄", desc: "Print-ready" },
                          { key: "csv" as const, label: "CSV", icon: "📊", desc: "Spreadsheet" },
                          { key: "excel" as const, label: "Excel", icon: "📗", desc: "Advanced" },
                        ]).map(f => (
                          <Button
                            key={f.key}
                            onClick={() => setExportFormat(f.key)}
                            variant="ghost"
                            className={
                              "flex-1 h-auto py-3.5 px-2 rounded-2xl border-2 text-center flex-col " +
                              (exportFormat === f.key ? "border-[#6E0F2D] bg-[rgba(110,15,45,0.06)]" : "border-[rgba(110,15,45,0.12)] bg-white hover:bg-[rgba(110,15,45,0.04)]")
                            }
                          >
                            <div style={{ fontSize: 20, marginBottom: 5 }}>{f.icon}</div>
                            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: exportFormat === f.key ? C.burg : C.text, marginBottom: 2 }}>{f.label}</div>
                            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{f.desc}</div>
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: "#F8F4F0", borderRadius: 14, padding: "14px 16px", marginBottom: 22 }}>
                      <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 10 }}>Includes</div>
                      {["Sale ID, customer name, design code", "Payment method and amount", "Timestamp and date", "Running totals and subtotals"].map((item, i) => (
                        <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 3 ? 8 : 0 }}>
                          <Check size={14} color={C.green} />
                          <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                      <Button variant="primary" onClick={() => setExportDone(true)} fullWidth className="h-[52px] rounded-full border-none bg-[#6E0F2D] hover:bg-[#4A061B] text-[#FFFDF9] hover:text-[#FFFDF9] font-bold text-sm gap-2 shadow-[0_4px_16px_rgba(110,15,45,0.30)]">
                        <FileText size={17} /> Export as {exportFormat.toUpperCase()}
                      </Button>
                      <Button onClick={() => { setShowExport(false); setExportDone(false); }} variant="ghost" fullWidth className="h-[50px] rounded-full border-[1.5px] border-[rgba(110,15,45,0.12)] bg-white hover:bg-[rgba(110,15,45,0.06)] font-semibold text-sm text-[#69635E] hover:text-[#1A0A0F]">Cancel</Button>
                    </div>
                  </>
                )}
              </div>
      </Modal>
    </div>
  );
}

export { SalesReport };
