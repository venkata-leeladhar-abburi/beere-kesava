import React, { useState } from "react";
import { Search, UsersRound, CheckCircle2, TrendingUp, ShieldAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { FadeUp, ChartCard, SumCard, TabTitle, ReportDLBar, ChartTip, AnimBar, TablePager, StatusPill, TH, TD } from "../common/primitives";

const topCustomers = [
  { name: "Meenakshi Silks",        total: 840000 },
  { name: "Kalavathi Exports",      total: 660000 },
  { name: "Lakshmi Silks",          total: 900000 },
  { name: "Padmavathi Textiles",    total: 600000 },
  { name: "Vijaya Silk House",      total: 280000 },
];
const custMonthly = [
  { month: "Jan", newC: 8,  ret: 22 },
  { month: "Feb", newC: 11, ret: 24 },
  { month: "Mar", newC: 9,  ret: 26 },
  { month: "Apr", newC: 14, ret: 28 },
  { month: "May", newC: 12, ret: 26 },
];
const custSplitDonut = [
  { name: "Wholesale",  value: 2840000, color: T.royalBurgundy },
  { name: "Retail",     value: 420000,  color: T.antiqueGold },
];
const custRows = [
  { name: "Lakshmi Silks",          type: "Wholesale", phone: "9412345678", purchases: 8,   spend: 9000000,  due: 0,      lastPurchase: "08 Apr 2026", status: "Active" },
  { name: "Padmavathi Textiles",    type: "Wholesale", phone: "9823456789", purchases: 5,   spend: 3000000,  due: 135000, lastPurchase: "05 Apr 2026", status: "Overdue" },
  { name: "Vijaya Silk House",      type: "Wholesale", phone: "9712345678", purchases: 3,   spend: 840000,   due: 0,      lastPurchase: "10 Apr 2026", status: "Active" },
  { name: "Meenakshi Silks",        type: "Wholesale", phone: "9534567890", purchases: 12,  spend: 5040000,  due: 420000, lastPurchase: "15 Apr 2026", status: "Active" },
  { name: "Kalavathi Exports",      type: "Wholesale", phone: "9645678901", purchases: 6,   spend: 3960000,  due: 45600,  lastPurchase: "18 Apr 2026", status: "Overdue" },
  { name: "Priya Sharma",           type: "Retail",    phone: "9845678901", purchases: 3,   spend: 28500,    due: 0,      lastPurchase: "27 May 2026", status: "Active" },
  { name: "Rekha Patel",            type: "Retail",    phone: "9712345678", purchases: 2,   spend: 26500,    due: 0,      lastPurchase: "25 May 2026", status: "Active" },
  { name: "Anita Verma",            type: "Retail",    phone: "9823456789", purchases: 4,   spend: 41000,    due: 0,      lastPurchase: "22 May 2026", status: "Active" },
];

function downloadCustomerData(r: typeof custRows[0]) {
  const rows: string[][] = [
    ["Field", "Value"],
    ["Name", r.name],
    ["Type", r.type],
    ["Phone", r.phone],
    ["Total Purchases", String(r.purchases)],
    ["Total Spend (₹)", String(r.spend)],
    ["Outstanding Due (₹)", String(r.due)],
    ["Last Purchase Date", r.lastPurchase],
    ["Status", r.status],
  ];
  const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${r.name.replace(/\s+/g, "_")}_customer_data.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CustomerReport() {
  const [filter, setFilter] = useState("All Customers");
  const filters = ["All Customers", "Retail Only", "Wholesale Only", "Has Outstanding Dues", "No Purchases This Month"];
  return (
    <div id="rep-customers" style={{ padding: "32px 40px" }}>
      <TabTitle title="Customer Report"
        sub="See all retail and wholesale customers — their purchase history, total spend, frequency of buying, and any outstanding dues. Find your best customers and track who owes money." />
      <ReportDLBar />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
        <ChartCard title="Top Customers by Total Purchase Value" sub="All-time wholesale + retail combined">
          <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: "8px 0" }}>
            {[...topCustomers].sort((a, b) => b.total - a.total).map((c, i) => (
              <div key={c.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.luxuryBrown }}>{c.name}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.antiqueGold }}>₹{(c.total / 100000).toFixed(1)}L</span>
                </div>
                <AnimBar pct={Math.round((c.total / 900000) * 100)} color={T.antiqueGold} height={7} delay={i * 0.07} />
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="New vs Returning Customers Each Month" sub="Last 5 months">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={custMonthly} barGap={4}>
              <CartesianGrid key="cust-grid" strokeDasharray="3 3" stroke="rgba(110,15,45,0.07)" vertical={false} />
              <XAxis key="cust-x" dataKey="month" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} />
              <YAxis key="cust-y" tick={{ fontFamily: F.mono, fontSize: 10, fill: T.taupe }} axisLine={false} tickLine={false} width={28} />
              <Tooltip key="cust-tip" content={<ChartTip suffix=" customers" />} />
              <Bar key="cust-new" dataKey="newC" name="New"      fill={T.royalBurgundy} radius={[4,4,0,0] as any} />
              <Bar key="cust-ret" dataKey="ret"  name="Returning" fill={T.antiqueGold}   radius={[4,4,0,0] as any} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Retail vs Wholesale Revenue Split" sub="Revenue contribution — May 2026">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie key="cust-split-pie" data={custSplitDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" stroke="none" paddingAngle={3}>
                {custSplitDonut.map(e => <Cell key={`cust-cell-${e.name}`} fill={e.color} />)}
              </Pie>
              <Tooltip key="cust-split-tip" formatter={(v: any, n: any) => [`₹${Number(v).toLocaleString("en-IN")}`, n]} contentStyle={{ fontFamily: F.ui, fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "0 8px" }}>
            {custSplitDonut.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: d.color }}>₹{(d.value / 100000).toFixed(1)}L</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 22, alignItems: "stretch" }}>
        <SumCard icon={<UsersRound size={22} color={T.royalBurgundy} />} label="Total Customers (All Time)" value="284 customers" sub="Retail + wholesale" />
        <SumCard icon={<CheckCircle2 size={22} color={T.green} />} label="Active This Month" value="38 customers" sub="Made a purchase" greenHi />
        <SumCard icon={<TrendingUp size={22} color={T.antiqueGold} />} label="New This Month" value="12 customers" sub="First time buyers" hi />
        <SumCard icon={<ShieldAlert size={22} color={T.crimson} />} label="Customers with Dues" value="14 customers" sub="Outstanding balance" crimsonHi />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "6px 13px", borderRadius: 20, border: `1.5px solid ${filter === f ? T.royalBurgundy : T.borderDef}`, background: filter === f ? T.royalBurgundy : "#fff", color: filter === f ? "#FFFDF9" : T.taupe, fontFamily: F.ui, fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: "pointer" }}>
            {f}
          </button>
        ))}
        <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
          <input placeholder="Search by customer name or phone number..." style={{ width: "100%", height: 36, padding: "0 10px 0 30px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: "#fff", outline: "none", boxSizing: "border-box" as const }} />
        </div>
      </div>

      <FadeUp>
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 14px rgba(74,6,27,0.06)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={TH}>Customer Name</th>
                  <th style={{ ...TH, textAlign: "center" }}>Type</th>
                  <th style={TH}>Phone</th>
                  <th style={{ ...TH, textAlign: "center" }}>Total Purchases</th>
                  <th style={{ ...TH, textAlign: "right" }}>Total Spend</th>
                  <th style={{ ...TH, textAlign: "right" }}>Outstanding Due</th>
                  <th style={TH}>Last Purchase</th>
                  <th style={{ ...TH, textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {custRows.map((r, i) => (
                  <tr key={r.name} style={{ background: i % 2 === 0 ? "#FFFDF9" : T.silkCream }}>
                    <td style={TD}><span style={{ fontFamily: F.ui, fontWeight: 600 }}>{r.name}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <StatusPill label={r.type} type={r.type === "Wholesale" ? "neutral" : "gold"} />
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>{r.phone}</span></td>
                    <td style={{ ...TD, textAlign: "center", fontFamily: F.mono, fontWeight: 700 }}>{r.purchases}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700 }}>₹{r.spend.toLocaleString("en-IN")}</td>
                    <td style={{ ...TD, textAlign: "right", fontFamily: F.mono, fontWeight: 700, color: r.due > 0 ? T.crimson : T.green }}>
                      {r.due > 0 ? `₹${r.due.toLocaleString("en-IN")}` : "— Nil"}
                    </td>
                    <td style={TD}><span style={{ fontFamily: F.mono, fontSize: 11.5, color: T.taupe }}>{r.lastPurchase}</span></td>
                    <td style={{ ...TD, textAlign: "center" }}>
                      <StatusPill label={r.status} type={r.status === "Active" ? "ok" : "bad"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePager total={284} showing={8} />
        </div>
      </FadeUp>

      {/* Individual customer cards — with per-customer download */}
      <FadeUp>
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.luxuryBrown, marginBottom: 12 }}>Customer Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {custRows.map(r => (
              <div key={r.name} style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(74,6,27,0.06)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{r.name}</div>
                  <StatusPill label={r.type} type={r.type === "Wholesale" ? "neutral" : "gold"} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {r.type === "Wholesale" ? (
                    <>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>City: <span style={{ color: T.luxuryBrown }}>—</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Address: <span style={{ color: T.luxuryBrown }}>—</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Phone: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>{r.phone}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>GST Code: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>—</span></div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Phone: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>{r.phone}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Total Purchases: <span style={{ fontFamily: F.mono, color: T.luxuryBrown, fontWeight: 700 }}>{r.purchases}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>Last Purchase: <span style={{ fontFamily: F.mono, color: T.luxuryBrown }}>{r.lastPurchase}</span></div>
                    </>
                  )}
                </div>
                <DownloadGate>
                  <button onClick={() => downloadCustomerData(r)}
                    style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "rgba(110,15,45,0.05)", border: `1px solid ${T.borderDef}`, borderRadius: 8, fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.royalBurgundy, cursor: "pointer" }}>
                    ↓ Download Data
                  </button>
                </DownloadGate>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>
    </div>
  );
}

