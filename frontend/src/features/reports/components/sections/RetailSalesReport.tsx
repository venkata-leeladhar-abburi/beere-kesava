import React from "react";
import { Tag, Banknote, Percent, RefreshCcw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { T, F } from "../theme";
import { FadeUp, ChartCard, SumCard, TabTitle, ReportDLBar, AnimBar, TablePager, StatusPill, TH, TD } from "../common/primitives";

const retailDailySales = [
  { week: "W1 (1–7)", may: 11, apr: 9  },
  { week: "W2 (8–15)",may: 14, apr: 11 },
  { week: "W3 (16–22)",may: 13, apr: 10 },
  { week: "W4 (23–31)",may: 10, apr: 9  },
];
const retailWeeklyData = [
  { week: "Week 1", sarees: 11, revenue: 96500  },
  { week: "Week 2", sarees: 14, revenue: 122000 },
  { week: "Week 3", sarees: 13, revenue: 114500 },
  { week: "Week 4", sarees: 10, revenue: 87000  },
];
function RetailWeeklyTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${T.borderDef}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 16px rgba(74,6,27,0.12)" }}>
      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontWeight: 600 }}>
        {label} — {d.sarees} sarees sold — ₹{d.revenue.toLocaleString("en-IN")} revenue
      </span>
    </div>
  );
}
const retailDesignSales = [
  { design: "BKB-045", count: 14 },
  { design: "BKB-031", count: 11 },
  { design: "BKB-022", count: 9  },
  { design: "BKB-038", count: 8  },
  { design: "BKB-019", count: 6  },
];
const retailRevenueDonut = [
  { name: "Bridal Special",  value: 180000, color: T.royalBurgundy },
  { name: "Heavy Zari",      value: 112000, color: T.antiqueGold },
  { name: "Self Brocade",    value: 85000,  color: T.green },
  { name: "Plain Silk",      value: 43000,  color: T.taupe },
];
const retailRows = [
  { id: "SR-001", date: "28 May 2026", customer: "Walk-in Customer", phone: "—",          sarId: "BKS-0421", design: "BKB-045", type: "Bridal Special",  price: 12500, barcode: "Yes", bill: "Yes" },
  { id: "SR-002", date: "27 May 2026", customer: "Priya Sharma",     phone: "9845678901", sarId: "BKS-0419", design: "BKB-031", type: "Heavy Zari",       price: 9800,  barcode: "Yes", bill: "Yes" },
  { id: "SR-003", date: "26 May 2026", customer: "Walk-in Customer", phone: "—",          sarId: "BKS-0418", design: "BKB-022", type: "Self Brocade",     price: 8200,  barcode: "Yes", bill: "Yes" },
  { id: "SR-004", date: "25 May 2026", customer: "Rekha Patel",      phone: "9712345678", sarId: "BKS-0415", design: "BKB-038", type: "Bridal Special",  price: 14000, barcode: "Yes", bill: "Yes" },
  { id: "SR-005", date: "24 May 2026", customer: "Walk-in Customer", phone: "—",          sarId: "BKS-0412", design: "BKB-019", type: "Plain Silk",       price: 5500,  barcode: "Yes", bill: "Yes" },
  { id: "SR-006", date: "23 May 2026", customer: "Anita Verma",      phone: "9823456789", sarId: "BKS-0410", design: "BKB-045", type: "Bridal Special",  price: 13500, barcode: "Yes", bill: "Yes" },
  { id: "SR-007", date: "22 May 2026", customer: "Walk-in Customer", phone: "—",          sarId: "BKS-0408", design: "BKB-031", type: "Heavy Zari",       price: 8800,  barcode: "Yes", bill: "Yes" },
  { id: "SR-008", date: "20 May 2026", customer: "RETURN",           phone: "—",          sarId: "BKS-0402", design: "BKB-022", type: "Self Brocade",     price: -7200, barcode: "Yes", bill: "Yes" },
];

export function RetailSalesReport() {
  return (
    <div id="rep-retail" style={{ padding: "32px 40px" }}>
      <TabTitle title="Retail Sales Report"
        sub="Track all sales at the retail shop — how many sarees were sold, to which customers, at what prices, and what the total revenue was." />
      <ReportDLBar />

      {/* Weekly saree sales — summary strip + bar chart */}
      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, padding: "20px 24px", marginBottom: 24, boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.luxuryBrown }}>Sarees Sold Each Week This Month</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>May 2026 — weekly breakdown</div>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Sarees This Month</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.royalBurgundy }}>{retailWeeklyData.reduce((s, w) => s + w.sarees, 0)}</div>
              </div>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Revenue This Month</div>
                <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.green }}>₹{retailWeeklyData.reduce((s, w) => s + w.revenue, 0).toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={retailWeeklyData}>
              <CartesianGrid key="retw-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="retw-x" dataKey="week" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="retw-y" tick={{ fontFamily: F.mono, fontSize: 12, fill: T.taupe }} axisLine={false} tickLine={false} width={30} />
              <Tooltip key="retw-tip" content={<RetailWeeklyTooltip />} cursor={{ fill: "rgba(110,15,45,0.04)" }} />
              <Bar key="retw-bar" dataKey="sarees" name="Sarees Sold" fill={T.royalBurgundy} radius={[6, 6, 0, 0] as any} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <ChartCard title="Which Designs Sold Most at Retail" sub="Top 5 designs by saree count">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "10px 0" }}>
            {retailDesignSales.map((d, i) => (
              <div key={d.design}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{d.design}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>{d.count} sarees</span>
                </div>
                <AnimBar pct={Math.round((d.count / retailDesignSales[0].count) * 100)} color={T.royalBurgundy} height={7} delay={i * 0.07} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Revenue by Saree Type" sub="Retail revenue split — May 2026">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie key="ret-rev-pie" data={retailRevenueDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none" paddingAngle={3}>
                {retailRevenueDonut.map(e => <Cell key={`ret-rev-cell-${e.name}`} fill={e.color} />)}
              </Pie>
              <Tooltip key="ret-rev-tip" formatter={(v: any, n: any) => [`₹${Number(v).toLocaleString("en-IN")}`, n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "0 4px" }}>
            {retailRevenueDonut.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: d.color }}>₹{(d.value / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <SumCard icon={<Tag size={22} color={T.royalBurgundy} />} label="Total Sarees Sold at Shop" value="48 sarees" sub="This month" />
        <SumCard icon={<Banknote size={22} color={T.green} />} label="Total Retail Revenue" value="₹4,20,000" sub="May 2026" greenHi />
        <SumCard icon={<Percent size={22} color={T.antiqueGold} />} label="Average Sale Value" value="₹8,750" sub="Per saree" hi />
        <SumCard icon={<RefreshCcw size={22} color={T.crimson} />} label="Total Returns at Shop" value="2 sarees" sub="This month" crimsonHi />
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={TH}>Sale ID</th><th style={TH}>Sale Date</th><th style={TH}>Customer Name</th>
                  <th style={TH}>Phone</th><th style={TH}>Saree ID</th><th style={TH}>Design Code</th>
                  <th style={TH}>Saree Type</th><th style={{ ...TH, textAlign: "right" }}>Retail Price</th>
                  <th style={{ ...TH, textAlign: "center" }}>Barcode Scanned</th><th style={{ ...TH, textAlign: "center" }}>Bill Generated</th>
                </tr>
              </thead>
              <tbody>
                {retailRows.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream, borderLeft: `3px solid ${r.price < 0 ? T.crimson : T.green}` }}>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.id}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12 }}>{r.date}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.customer}</span></td>
                    <td style={TD}><span style={{ color: T.taupe }}>{r.phone}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{r.sarId}</span></td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{r.design}</span></td>
                    <td style={TD}>{r.type}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: r.price < 0 ? T.crimson : T.green }}>{r.price < 0 ? `−₹${Math.abs(r.price).toLocaleString("en-IN")}` : `₹${r.price.toLocaleString("en-IN")}`}</td>
                    <td style={{ ...TD, textAlign: "center" }}><StatusPill label={r.barcode} type="ok" /></td>
                    <td style={{ ...TD, textAlign: "center" }}><StatusPill label={r.bill} type="ok" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePager total={48} showing={8} />
        </div>
      </FadeUp>
    </div>
  );
}

