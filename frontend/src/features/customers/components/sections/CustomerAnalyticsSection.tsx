import {
  Download, Star, IndianRupee, Users, Calendar, AlertTriangle, MapPin,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { DateFilterBar, DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { SectionTitle } from "../common/primitives";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { downloadDataAsCSV } from "../utils";
import {
  top10Customers, revenueSplit, newVsReturning, frequentBuyers, inactiveAlerts,
} from "../data";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../../../../shared/api/analytics";

export interface CustomerAnalyticsSectionProps {
  analyticsDateFilter: DateFilterState;
  setAnalyticsDateFilter: (f: DateFilterState) => void;
}

// ── SECTION 3: CUSTOMER ANALYTICS ───────────────────────────────────────────
export function CustomerAnalyticsSection({ analyticsDateFilter, setAnalyticsDateFilter }: CustomerAnalyticsSectionProps) {
  const { data: revSplitRes } = useQuery({
    queryKey: ["analytics-revenue-split"],
    queryFn: () => analyticsApi.getRevenueSplit(),
  });

  const liveRevSplit = [
    { name: "Retail Store", value: revSplitRes?.retail ?? 0, fill: T.greenMid },
    { name: "Wholesale Sales", value: revSplitRes?.wholesale ?? 0, fill: T.royalBurgundy },
  ];
  const totalRevLakhs = ((revSplitRes?.total ?? 0) / 100000).toFixed(1);
  return (
    <div style={{ padding: "96px 56px 48px" }}>
      <SectionTitle
        title="Customer Analytics"
        sub="Overview of customer behaviour — who spends the most, who buys most frequently, who has not bought recently, and where your customers are from."
        action="Download Analytics Report →"
      />

      <div style={{ marginBottom: 32 }}>
        <DateFilterBar filter={analyticsDateFilter} onChange={setAnalyticsDateFilter} />
      </div>

      {/* Charts Row 1 — equal 3 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, marginBottom: 22, alignItems: "stretch" }}>

        {/* Chart 1: Top Customers */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                <Star size={24} color={T.antiqueGold} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Top 10 Customers by Purchase Value</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Wholesale and retail combined</p>
              </div>
            </div>
            <DownloadGate><IconButton
              icon={Download}
              label="Download CSV"
              onClick={() => downloadDataAsCSV("top_10_customers.csv", ["Rank", "Customer Name", "Total Spend (₹)"], top10Customers.map((c, i) => [i + 1, c.name, c.spend]))}
              title="Download CSV"
              variant="ghost"
              shape="circle"
              size="sm"
              className="self-start"
            /></DownloadGate>
          </div>
          {/* Summary strip */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[
              { label: "Top Spender", val: "₹0", color: T.royalBurgundy },
              { label: "Combined Value", val: "₹0", color: T.antiqueGold },
              { label: "Avg Spend", val: "₹0", color: T.greenMid },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, letterSpacing: "0.4px", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          {/* Custom ranked bar rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {top10Customers.map((c, i) => {
              const maxSpend = top10Customers[0]?.spend || 1;
              const pct = Math.round((c.spend / maxSpend) * 100);
              const isTop = i === 0;
              const barBg = i === 0 ? `linear-gradient(90deg, ${T.royalBurgundy}, #A01535)` : i === 1 ? `linear-gradient(90deg, ${T.antiqueGold}, #E7C983)` : i === 2 ? `linear-gradient(90deg, ${T.greenMid}, #3BA86A)` : `linear-gradient(90deg, rgba(200,155,71,0.40), rgba(200,155,71,0.20))`;
              const rankBg = i === 0 ? T.royalBurgundy : i === 1 ? "rgba(200,155,71,0.22)" : i === 2 ? T.greenBg : T.silkCream;
              const rankColor = i === 0 ? "#FFF" : i === 1 ? T.antiqueGold : i === 2 ? T.greenMid : T.taupe;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: isTop ? "8px 10px" : "4px 6px", borderRadius: 8, background: isTop ? "rgba(110,15,45,0.04)" : "transparent", border: isTop ? `1px solid rgba(110,15,45,0.08)` : "1px solid transparent" }}>
                  <div style={{ width: 22, height: 22, minWidth: 22, borderRadius: "50%", background: rankBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: rankColor }}>{i + 1}</span>
                  </div>
                  <div style={{ width: 96, minWidth: 96, fontFamily: F.ui, fontSize: 12, fontWeight: i < 3 ? 700 : 500, color: i < 3 ? T.luxuryBrown : T.taupe, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.name}
                  </div>
                  <div style={{ flex: 1, height: 7, background: T.silkCream, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundImage: barBg, borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 44, textAlign: "right", fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: i < 3 ? T.luxuryBrown : T.taupe }}>
                    {c.spend >= 100000 ? `${(c.spend / 100000).toFixed(1)}L` : `${Math.round(c.spend / 1000)}K`}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, textAlign: "right" }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: T.antiqueGold, fontWeight: 600, cursor: "pointer" }}>View Full List →</span>
          </div>
        </div>

        {/* Chart 2: Revenue Split */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(110,15,45,0.08)" }}>
                <IndianRupee size={24} color={T.royalBurgundy} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Wholesale vs Retail Revenue Split</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Revenue from each sales channel</p>
              </div>
            </div>
            <DownloadGate><IconButton
              icon={Download}
              label="Download CSV"
              onClick={() => downloadDataAsCSV("revenue_split.csv", ["Channel", "Revenue Value (₹)"], revenueSplit.map(item => [item.name, item.value]))}
              title="Download CSV"
              variant="ghost"
              shape="circle"
              size="sm"
              className="self-start"
            /></DownloadGate>
          </div>
          <div style={{ flex: 1, position: "relative", minHeight: 240 }}>
            <ResponsiveContainer key="rc-2" width="100%" height="100%">
              <PieChart key="pie-chart" id="revenue-pie-chart">
                <Pie key="revenue-pie" id="revenue-pie" data={liveRevSplit} innerRadius={75} outerRadius={108} paddingAngle={3} dataKey="value" nameKey="name" stroke="none">
                  {liveRevSplit.map((entry, index) => (
                    <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <span style={{ fontFamily: F.display, fontSize: 30, fontWeight: 700, color: T.luxuryBrown }}>₹{totalRevLakhs}L</span>
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>Total Revenue</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 28, marginTop: 18 }}>
            {liveRevSplit.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.fill }} />
                <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown, fontWeight: 500 }}>{item.name}: ₹{(item.value/100000).toFixed(1)}L</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: New vs Returning */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(30,102,64,0.08)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(30,102,64,0.10)" }}>
                <Users size={24} color={T.greenMid} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>New vs Returning Customers</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Last 6 months trend</p>
              </div>
            </div>
            <DownloadGate><IconButton
              icon={Download}
              label="Download CSV"
              onClick={() => downloadDataAsCSV("new_vs_returning.csv", ["Month", "New Customers", "Returning Customers"], newVsReturning.map(item => [item.month, item.new, item.returning]))}
              title="Download CSV"
              variant="ghost"
              shape="circle"
              size="sm"
              className="self-start"
            /></DownloadGate>
          </div>
          <div style={{ flex: 1, minHeight: 280 }}>
            <ResponsiveContainer key="rc-3" width="100%" height="100%">
              <BarChart key="bar-chart-new" id="new-vs-returning-chart" data={newVsReturning} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke={T.borderDef} />
                <XAxis key="x-axis-2" id="x-axis-2" dataKey="month" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 13, fill: T.taupe }} dy={10} />
                <YAxis key="y-axis-2" id="y-axis-2" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 13, fill: T.taupe }} />
                <RechartsTooltip key="tooltip-2" cursor={{fill: 'rgba(110,15,45,0.04)'}} contentStyle={{fontFamily: F.ui, fontSize: 13, borderRadius: 8, border: `1px solid ${T.borderDef}`}} />
                <Legend key="legend" iconType="circle" wrapperStyle={{ fontFamily: F.ui, fontSize: 13 }} />
                <Bar key="bar-new" id="bar-new" dataKey="new" name="New" fill={T.royalBurgundy} radius={[5, 5, 0, 0]} barSize={14} />
                <Bar key="bar-returning" id="bar-returning" dataKey="returning" name="Returning" fill={T.antiqueGold} radius={[5, 5, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 — equal 2 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 22, alignItems: "stretch" }}>

        {/* Chart 4: Frequent Buyers */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                <Calendar size={24} color={T.antiqueGold} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Customers Who Buy Most Often</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>By number of purchases — all time</p>
              </div>
            </div>
            <DownloadGate><IconButton
              icon={Download}
              label="Download CSV"
              onClick={() => downloadDataAsCSV("frequent_buyers.csv", ["Rank", "Customer Name", "Orders Count", "Frequency"], frequentBuyers.map((fb, i) => [i + 1, fb.name, fb.count, fb.freq]))}
              title="Download CSV"
              variant="ghost"
              shape="circle"
              size="sm"
              className="self-start"
            /></DownloadGate>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
            {frequentBuyers.map((fb, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: "50%", background: i === 0 ? T.royalBurgundy : "rgba(200,155,71,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: i === 0 ? "#FFF" : T.antiqueGold }}>#{i+1}</span>
                </div>
                <div style={{ flex: 1, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{fb.name}</div>
                <div style={{ flex: 2 }}>
                  <div style={{ height: 10, background: "rgba(200,155,71,0.13)", borderRadius: 5 }}>
                    <div style={{ width: `${(fb.count/25)*100}%`, height: "100%", background: i === 0 ? T.royalBurgundy : T.antiqueGold, borderRadius: 5 }} />
                  </div>
                </div>
                <div style={{ width: 120, textAlign: "right" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{fb.count} orders</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{fb.freq}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 5: Inactive Customers */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(192,57,43,0.10)" }}>
                <AlertTriangle size={24} color={T.crimson} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Customers Who Have Not Bought Recently</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>No purchase in 6 months — consider reaching out</p>
              </div>
            </div>
            <DownloadGate><IconButton
              icon={Download}
              label="Download CSV"
              onClick={() => downloadDataAsCSV("inactive_customers.csv", ["Customer Name", "Type", "Last Purchase Date"], inactiveAlerts.map(al => [al.name, al.type, al.time]))}
              title="Download CSV"
              variant="ghost"
              shape="circle"
              size="sm"
              className="self-start"
            /></DownloadGate>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            {inactiveAlerts.map((al, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, boxShadow: "0 1px 4px rgba(74,6,27,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 16, color: T.royalBurgundy, fontWeight: 700 }}>
                    {al.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{al.name}</span>
                      <span style={{ padding: "2px 8px", background: al.type === "Wholesale" ? T.crimsonBg : T.greenBg, color: al.type === "Wholesale" ? T.crimson : T.greenMid, fontSize: 12, borderRadius: 5, fontWeight: 600, fontFamily: F.ui }}>{al.type}</span>
                    </div>
                    <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Last purchase: {al.time}</div>
                  </div>
                </div>
                <Button variant="tertiary" size="sm">Reach Out</Button>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right", marginTop: 16 }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: T.antiqueGold, fontWeight: 600, cursor: "pointer" }}>Mark as Inactive →</span>
          </div>
        </div>
      </div>

      {/* Charts Row 3 — Geographic */}
      <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px 36px", display: "flex", gap: 48, boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 26 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(45,145,88,0.09)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(30,102,64,0.10)" }}>
                <MapPin size={24} color={T.greenMid} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Customer Locations — State-wise Distribution</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Which states your wholesale and retail customers are from</p>
              </div>
            </div>
            <DownloadGate><IconButton
              icon={Download}
              label="Download CSV"
              onClick={() => downloadDataAsCSV("customer_locations.csv", ["State", "Customers Count", "Percentage Share"], [["Andhra Pradesh", 18, "37%"], ["Telangana", 14, "29%"], ["Tamil Nadu", 8, "17%"], ["Karnataka", 5, "10%"], ["Others", 3, "6%"]])}
              title="Download CSV"
              variant="ghost"
              shape="circle"
              size="sm"
              className="self-start"
            /></DownloadGate>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {([].map as any)((loc: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 28, display: "flex", justifyContent: "center" }}>
                  <div style={{ width: loc.size, height: loc.size, borderRadius: "50%", background: loc.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{loc.state}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 2 }}>{loc.count} customers</div>
                </div>
                <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown, minWidth: 52, textAlign: "right" }}>{loc.pct}%</div>
                <div style={{ width: 130, height: 8, background: T.silkCream, borderRadius: 4 }}>
                  <div style={{ width: `${loc.pct}%`, height: "100%", background: loc.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>

          <DownloadGate>
            <Button variant="tertiary" iconLeft={Download} className="mt-8">
              Download Customer List with Locations
            </Button>
          </DownloadGate>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "28px 24px", minHeight: 300 }}>
          <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, marginBottom: 4 }}>State-wise Share</div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 20 }}>0 customers across 0 states</div>
          <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[]}
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown }}>0</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>States</span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "10px 18px", marginTop: 22, justifyContent: "center" }}>
            {([].map as any)((s: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 500 }}>{s.name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, fontWeight: 600 }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
