import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { BarChart2, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { salesApi } from "../../../../../shared/api/sales";
import { customersApi } from "../../../../../shared/api/customers";
import { C, F, ShopDesktopHero, SHOP_BG } from "../theme";
import { DSH } from "./DSH";
import { Button } from "../../../../../shared/ui/primitives";

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function ReportsSection({
  bp, isTablet, canSeePrices, setExportDone, setExportDialog,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean; canSeePrices: boolean;
  setExportDone: (v: boolean) => void; setExportDialog: (v: { label: string } | null) => void;
}) {
  const { data: salesRes } = useQuery({
    queryKey: ["sales-list-desktop-report"],
    queryFn: () => salesApi.list(100),
  });

  const { data: returnsRes } = useQuery({
    queryKey: ["returns-list-desktop-report"],
    queryFn: () => salesApi.listReturns(100),
  });

  const { data: customersRes } = useQuery({
    queryKey: ["customers-list-desktop-report"],
    queryFn: () => customersApi.list(100),
  });

  const salesList = salesRes?.items ?? [];
  const returnsList = returnsRes?.items ?? [];
  const customerMap = new Map((customersRes?.items ?? []).map(c => [c.id, c.name]));

  const totalSalesCount = salesList.length;
  const totalRevenue = salesList.reduce((sum, s) => sum + Number(s.amount), 0);
  const avgRevenue = totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0;

  const designData = [
    { design: "Retail Sales", count: salesList.filter(s => s.channel === "RETAIL").length },
    { design: "Wholesale Sales", count: salesList.filter(s => s.channel === "WHOLESALE").length },
    { design: "Returns", count: returnsList.length },
  ];

  const salesRows = salesList.map(s => ({
    time: timeLabel(s.saleDate),
    id: s.sareeId,
    customer: s.customerId ? (customerMap.get(s.customerId) ?? `Customer ${s.customerId.slice(0, 6)}`) : "Walk-in Customer",
    design: s.channel === "WHOLESALE" ? "Wholesale" : "Retail",
    pay: "Counter",
    amt: `₹${Number(s.amount).toLocaleString("en-IN")}`,
    src: "factory",
  }));

  const topCustomers = React.useMemo(() => {
    const map = new Map<string, { name: string; purchases: number; total: number }>();
    for (const s of salesList) {
      const custId = s.customerId ?? "walkin";
      const name = s.customerId ? (customerMap.get(s.customerId) ?? `Customer ${s.customerId.slice(0, 6)}`) : "Walk-in Counter Customer";
      const existing = map.get(custId) ?? { name, purchases: 0, total: 0 };
      existing.purchases += 1;
      existing.total += Number(s.amount);
      map.set(custId, existing);
    }
    const sorted = Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
    if (sorted.length === 0 && customersRes?.items) {
      return customersRes.items.slice(0, 5).map(c => ({
        name: c.name,
        purchases: 0,
        amt: "₹0",
      }));
    }
    return sorted.map(c => ({
      name: c.name,
      purchases: c.purchases,
      amt: `₹${c.total.toLocaleString("en-IN")}`,
    }));
  }, [salesList, customerMap, customersRes]);

  return (
    <>
      <ShopDesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · REPORTS"
        titleMain="Sales Report"
        titleSub="& Analytics"
        description="Review all sales, revenue, customer trends, and return patterns. Use the period selector to view different time ranges."
        pills={[{ text: "Today's View" }, { text: `${totalSalesCount} Sarees Total` }, ...(canSeePrices ? [{ text: `₹${totalRevenue.toLocaleString("en-IN")} Revenue` }] : [])]}
        stats={[
          { label: "TOTAL SALES", val: String(totalSalesCount), sub: "Sarees sold" },
          ...(canSeePrices ? [{ label: "TOTAL REVENUE", val: `₹${totalRevenue.toLocaleString("en-IN")}`, sub: "Gross sales", highlight: true }] : []),
          { label: "RETURNS", val: String(returnsList.length), sub: "Recorded returns", crimson: true },
          ...(canSeePrices ? [{ label: "AVERAGE PER SALE", val: `₹${avgRevenue.toLocaleString("en-IN")}`, sub: "Per saree" }] : []),
        ]}
        bgUrl={SHOP_BG}
      />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        {/* Period selector */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          {["Today", "This Week", "This Month", "Last 3 Months"].map((p, i) => (
            <Button key={p} variant={i === 0 ? "primary" : "secondary"} size="md" className={i === 0 ? "rounded-full border border-[rgba(139,26,46,0.12)] bg-[#6B1A2A] hover:bg-[#6B1A2A]" : "rounded-full border border-[rgba(139,26,46,0.12)] bg-white"}>{p}</Button>
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
              {salesRows.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>
                  No sales recorded today yet.
                </div>
              ) : (
                salesRows.map((s, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: `80px 160px 1fr 1fr 80px${canSeePrices ? " 120px" : ""}`, padding: "18px 24px", borderBottom: i < salesRows.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
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
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}>₹{totalRevenue.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>

            <DSH label="Returns This Month" />
            <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.07)" }}>
              {returnsList.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>
                  No returns recorded this month.
                </div>
              ) : (
                returnsList.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", borderBottom: i < returnsList.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none", borderLeft: `6px solid ${C.crim}` }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <RotateCcw size={20} color={C.crim} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{new Date(r.returnDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                        <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.burg }}>{r.sareeId}</span>
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>Returned Saree · {r.reason}</div>
                    </div>
                    {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.crim }}>{r.refundAmount ? `₹${Number(r.refundAmount).toLocaleString("en-IN")}` : "₹0"}</div>}
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
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={designData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontFamily: F.m, fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="design" tick={{ fontFamily: F.m, fontSize: 12, fill: C.burg }} axisLine={false} tickLine={false} width={64} />
                  <Tooltip contentStyle={{ fontFamily: F.u, fontSize: 13, border: `1px solid ${C.bdr}`, borderRadius: 10 }} formatter={(v: number) => [`${v} sarees`, "Sold"]} />
                  <Bar dataKey="count" radius={[0, 5, 5, 0]}>
                    {designData.map((entry, i) => <Cell key={`cell-${entry.design}`} fill={i === 0 ? C.burg : i === 1 ? C.gold : C.muted} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
              <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 5, height: 22, background: C.gold, borderRadius: 3 }} />
                <span style={{ fontFamily: F.u, fontSize: 16, fontWeight: 700, color: C.text }}>Top Customers</span>
              </div>
              {topCustomers.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", fontFamily: F.u, fontSize: 14, color: C.muted }}>
                  No customer sales recorded yet.
                </div>
              ) : (
                topCustomers.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", borderBottom: i < topCustomers.length - 1 ? `1px solid rgba(107,26,42,0.06)` : "none" }}>
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
