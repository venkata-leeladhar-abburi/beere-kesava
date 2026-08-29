import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { BarChart2, RotateCcw, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { salesApi } from "../../../../../shared/api/sales";
import { customersApi } from "../../../../../shared/api/customers";
import { C, F, PageHero, PortalStatsStrip, type PortalStat } from "../theme";
import { DSH } from "./DSH";
import { Button } from "../../../../../shared/ui/primitives";
import { LoadingState, ErrorState } from "../../../../../shared/ui/state";
import { semantic } from "../../../../../design-system/tokens";
import { ChartFigure } from "../../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { Money } from "@/shared/ui/domain";

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function ReportsSection({
  isTablet, canSeePrices, setExportDone, setExportDialog,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean; canSeePrices: boolean;
  setExportDone: (v: boolean) => void; setExportDialog: (v: { label: string } | null) => void;
}) {
  const { data: salesRes, isLoading: salesLoading, isError: salesError, refetch: refetchSales } = useQuery({
    queryKey: ["sales-list-desktop-report"],
    queryFn: () => salesApi.list(100),
  });

  const { data: returnsRes, isLoading: returnsLoading, isError: returnsError, refetch: refetchReturns } = useQuery({
    queryKey: ["returns-list-desktop-report"],
    queryFn: () => salesApi.listReturns(100),
  });

  const { data: customersRes, isLoading: customersLoading, isError: customersError, refetch: refetchCustomers } = useQuery({
    queryKey: ["customers-list-desktop-report"],
    queryFn: () => customersApi.list(100),
  });

  const salesList = React.useMemo(() => salesRes?.items ?? [], [salesRes]);
  const returnsList = returnsRes?.items ?? [];
  const customerMap = React.useMemo(() => new Map((customersRes?.items ?? []).map(c => [c.id, c.name])), [customersRes]);

  const totalSalesCount = salesList.length;
  const totalRevenue = salesList.reduce((sum, s) => sum + Number(s.amount), 0);
  const avgRevenue = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

  const designData = [
    { design: "Retail Sales", count: salesList.filter(s => s.channel === "RETAIL").length },
    { design: "Wholesale Sales", count: salesList.filter(s => s.channel === "WHOLESALE").length },
    { design: "Returns", count: returnsList.length },
  ];

  const salesRows = salesList.map(s => ({
    saleId: s.saleRef,
    time: timeLabel(s.saleDate),
    id: s.sareeId,
    customer: s.customerId ? (customerMap.get(s.customerId) ?? `Customer ${s.customerId.slice(0, 6)}`) : "Walk-in Customer",
    design: s.channel === "WHOLESALE" ? "Wholesale" : "Retail",
    pay: "Counter",
    amt: formatMoney(rupees(Number(s.amount))),
    src: "factory",
  }));

  const topCustomers = React.useMemo(() => {
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

  const stats: PortalStat[] = [
    { label: "Total sales", value: totalSalesCount, sub: "Sarees sold", icon: BarChart2, highlight: true },
    ...(canSeePrices ? [{ label: "Total revenue", value: formatMoney(rupees(totalRevenue)), sub: "Gross sales", icon: ShoppingBag }] : []),
    { label: "Returns", value: returnsList.length, sub: "Recorded returns", icon: RotateCcw },
    ...(canSeePrices ? [{ label: "Average per sale", value: formatMoney(rupees(avgRevenue)), sub: "Per saree", icon: BarChart2 }] : []),
  ];

  return (
    <>
      <PageHero
        eyebrow="Shop Staff Portal · Beere Kesava & Brothers Silks"
        title="Sales Report"
        titleAccent="& Analytics"
        description="Review all sales, revenue, customer trends, and return patterns across retail and wholesale channels."
      />
      <PortalStatsStrip stats={stats} />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        {/* Period selector */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          {["Today", "This Week", "This Month", "Last 3 Months"].map((p, i) => (
            <Button key={p} variant={i === 0 ? "primary" : "secondary"} size="md" className={i === 0 ? "rounded-[14px] border border-[rgba(110,15,45,0.12)] bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-[14px] border border-[rgba(110,15,45,0.12)] bg-white"}>{p}</Button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 360px", gap: isTablet ? 24 : 32, alignItems: "start" }}>
          {/* Left: Sales table + Returns */}
          <div>
            <DSH label="Today's Sales" link="Export →" onLink={() => { setExportDone(false); setExportDialog({ label: "Today's Sales" }); }} />
            <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 24px rgba(44,24,16,0.08)", marginBottom: 32 }}>
              <div style={{ display: "grid", gridTemplateColumns: `80px 160px 1fr 1fr 80px${canSeePrices ? " 120px" : ""}`, padding: "14px 24px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                {["Time", "Saree ID", "Customer", "Design", "Payment", ...(canSeePrices ? ["Amount"] : [])].map(h => (
                  <div key={h} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.4 }}>{h}</div>
                ))}
              </div>
              {salesLoading ? (
                <div style={{ padding: 16 }}><LoadingState variant="skeleton" rows={3} /></div>
              ) : salesError ? (
                <ErrorState error={undefined} onRetry={() => void refetchSales()} />
              ) : salesRows.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>
                  No sales recorded today yet.
                </div>
              ) : (
                salesRows.map((s, i) => (
                  <div key={s.saleId} style={{ display: "grid", gridTemplateColumns: `80px 160px 1fr 1fr 80px${canSeePrices ? " 120px" : ""}`, padding: "18px 24px", borderBottom: i < salesRows.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none", alignItems: "center" }}>
                    <div style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{s.time}</div>
                    <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{s.id}</div>
                    <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>{s.customer}</div>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>{s.design}</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.pay}</div>
                    {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>}
                  </div>
                ))
              )}
              {canSeePrices && (
                <div style={{ padding: "16px 24px", background: "#FAFAF8", borderTop: `1px solid ${C.bdr}`, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>Total Today:</span>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}><Money value={rupees(totalRevenue)} /></span>
                </div>
              )}
            </div>

            <DSH label="Returns This Month" />
            <div style={{ background: "#FFF", borderRadius: 12, border: `1px solid ${C.bdr}`, overflow: "hidden" }}>
              {returnsLoading ? (
                <div style={{ padding: 16 }}><LoadingState variant="skeleton" rows={3} /></div>
              ) : returnsError ? (
                <ErrorState error={undefined} onRetry={() => void refetchReturns()} />
              ) : returnsList.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>
                  No returns recorded this month.
                </div>
              ) : (
                returnsList.map((r, i) => (
                  <div key={r.returnRef} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-4 p-4 sm:p-[20px_24px]" style={{ borderBottom: i < returnsList.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                    <div className="flex items-center gap-4">
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <RotateCcw size={20} color={C.crim} />
                      </div>
                      <div className="sm:hidden flex-1">
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{new Date(r.returnDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                          <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.burg }}>{r.sareeId}</span>
                        </div>
                        <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>Returned Saree · {r.reason}</div>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block flex-1">
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{new Date(r.returnDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                        <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.burg }}>{r.sareeId}</span>
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>Returned Saree · {r.reason}</div>
                    </div>

                    {canSeePrices && (
                      <div className="flex justify-between items-center w-full sm:w-auto pt-2 sm:pt-0 border-t border-[rgba(0,0,0,0.06)] sm:border-t-0">
                        <span className="sm:hidden" style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Refund Amount</span>
                        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.crim }}><Money value={rupees(Number(r.refundAmount ?? 0))} /></div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Chart + Top Customers */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 22 }}>
            <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, padding: "24px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <BarChart2 size={20} color={C.burg} />
                <span style={{ fontFamily: F.u, fontSize: 16, fontWeight: 700, color: C.text }}>Sales by Design</span>
              </div>
              <ChartFigure title="Sales by Design" summary={designData.map(d => `${d.design} ${d.count}`).join(", ") + "."}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={designData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontFamily: F.m, fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="design" tick={{ fontFamily: F.m, fontSize: 12, fill: C.burg }} axisLine={false} tickLine={false} width={64} />
                    <Tooltip contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 10 }} formatter={(v: number) => [`${v} sarees`, "Sold"]} />
                    <Bar dataKey="count" radius={10} barSize={28}>
                      {designData.map((entry, i) => {
                        let fill = C.burg;
                        if (entry.design === "Wholesale Sales") fill = C.gold;
                        else if (entry.design === "Returns") fill = C.gold;
                        else if (i % 2 === 1) fill = C.gold;
                        return <Cell key={`cell-${entry.design}`} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFigure>
            </div>

            <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
              <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 5, height: 22, background: C.gold, borderRadius: 3 }} />
                <span style={{ fontFamily: F.u, fontSize: 16, fontWeight: 700, color: C.text }}>Top Customers</span>
              </div>
              {salesLoading || customersLoading ? (
                <div style={{ padding: 16 }}><LoadingState variant="skeleton" rows={3} /></div>
              ) : salesError || customersError ? (
                <ErrorState error={undefined} onRetry={() => { void refetchSales(); void refetchCustomers(); }} />
              ) : topCustomers.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>
                  No customer sales recorded yet.
                </div>
              ) : (
                topCustomers.map((c, i) => (
                  <div key={c.custId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", borderBottom: i < topCustomers.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                    <div style={{ fontFamily: F.d, fontWeight: i === 0 ? 700 : 600, fontSize: i === 0 ? 26 : 22, color: i === 0 ? C.gold : C.text, width: 30, textAlign: "center" as const }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>{c.name}</div>
                      <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{c.purchases} purchases</div>
                    </div>
                    {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: C.gold }}>{c.amt}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
