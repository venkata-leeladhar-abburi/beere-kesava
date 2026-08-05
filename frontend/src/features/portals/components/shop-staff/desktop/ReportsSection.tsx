import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { BarChart2, RotateCcw } from "lucide-react";
import { C, F, ShopDesktopHero, SHOP_BG } from "../theme";
import { DSH } from "./DSH";
import { Button } from "../../../../../shared/ui/primitives";

const designData = [
  { design: "BKB-045", count: 84 }, { design: "BKB-031", count: 62 },
  { design: "BKB-022", count: 48 }, { design: "BKB-038", count: 32 }, { design: "Others", count: 22 },
];

export function ReportsSection({
  bp, isTablet, canSeePrices, setExportDone, setExportDialog,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean; canSeePrices: boolean;
  setExportDone: (v: boolean) => void; setExportDialog: (v: { label: string } | null) => void;
}) {
  return (
    <>
      <ShopDesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · SHOP STAFF PORTAL · REPORTS"
        titleMain="Sales Report"
        titleSub="& Analytics"
        description="Review all sales, revenue, customer trends, and return patterns. Use the period selector to view different time ranges."
        pills={[{ text: "Today's View" }, { text: "248 Sarees This Month" }, ...(canSeePrices ? [{ text: "₹18,40,000 Revenue" }] : [])]}
        stats={[
          { label: "TOTAL SALES THIS MONTH", val: "248", sub: "Sarees sold" },
          ...(canSeePrices ? [{ label: "TOTAL REVENUE", val: "₹18,40,000", sub: "Gross sales", highlight: true }] : []),
          { label: "RETURNS", val: "3", sub: "This month", crimson: true },
          ...(canSeePrices ? [{ label: "AVERAGE PER SALE", val: "₹7,419", sub: "Per saree" }] : []),
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
              {[
                { time: "11:42", id: "PADMA-L1-004", customer: "Smt. Annapurna", design: "BKB-045", pay: "UPI", amt: "₹8,500", src: "factory" },
                { time: "10:30", id: "RAVI-L2-008", customer: "Sri Ramesh K.", design: "BKB-031", pay: "Card", amt: "₹12,000", src: "factory" },
                { time: "9:45", id: "BKB-L3-002", customer: "Smt. Lakshmi", design: "BKB-022", pay: "Cash", amt: "₹5,500", src: "factory" },
                { time: "9:20", id: "EXT-RAVI-001", customer: "Smt. Padmavathi", design: "External", pay: "UPI", amt: "₹6,200", src: "external" },
                { time: "9:05", id: "PADMA-L1-003", customer: "Smt. Saraswathi", design: "BKB-045", pay: "Cash", amt: "₹8,500", src: "factory" },
              ].map((s, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: `80px 160px 1fr 1fr 80px${canSeePrices ? " 120px" : ""}`, padding: "18px 24px", borderBottom: i < 4 ? `1px solid rgba(107,26,42,0.06)` : "none", alignItems: "center" }}>
                  <div style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{s.time}</div>
                  <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{s.id}</div>
                  <div style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>{s.customer}</div>
                  <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>{s.design}</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{s.pay}</div>
                  {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: C.gold }}>{s.amt}</div>}
                </div>
              ))}
              {canSeePrices && (
                <div style={{ padding: "16px 24px", background: "#FAFAF8", borderTop: `1px solid ${C.bdr}`, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 600, color: C.text }}>Total Today:</span>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}>₹40,700</span>
                </div>
              )}
            </div>

            <DSH label="Returns This Month" />
            <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${C.bdr}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.07)" }}>
              {[
                { date: "10 Jun", id: "RAVI-L2-007", customer: "Smt. Meenakshi", reason: "Wrong Design", amt: "₹12,000" },
                { date: "05 Jun", id: "PADMA-L1-001", customer: "Smt. Kalpana", reason: "Defective", amt: "₹8,500" },
                { date: "02 Jun", id: "BKB-L3-001", customer: "Sri Venkat", reason: "Changed Mind", amt: "₹5,500" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", borderBottom: i < 2 ? `1px solid rgba(107,26,42,0.06)` : "none", borderLeft: `6px solid ${C.crim}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(192,57,43,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <RotateCcw size={20} color={C.crim} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{r.date}</span>
                      <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.burg }}>{r.id}</span>
                    </div>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.text }}>{r.customer} · {r.reason}</div>
                  </div>
                  {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.crim }}>{r.amt}</div>}
                </div>
              ))}
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
              {[
                { name: "Smt. Annapurna Devi", purchases: 8, amt: "₹68,000" },
                { name: "Smt. Lakshmi Bai", purchases: 5, amt: "₹42,000" },
                { name: "Smt. Saraswathi", purchases: 4, amt: "₹34,000" },
                { name: "Sri Ramesh K.", purchases: 2, amt: "₹24,500" },
                { name: "Smt. Padmavathi", purchases: 1, amt: "₹12,500" },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", borderBottom: i < 4 ? `1px solid rgba(107,26,42,0.06)` : "none" }}>
                  <div style={{ fontFamily: F.d, fontWeight: i === 0 ? 700 : 600, fontSize: i === 0 ? 26 : 22, color: i === 0 ? C.gold : C.text, width: 30, textAlign: "center" as const }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>{c.name}</div>
                    <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{c.purchases} purchases</div>
                  </div>
                  {canSeePrices && <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 16, color: C.gold }}>{c.amt}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
