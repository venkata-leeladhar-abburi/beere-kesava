import {
  Star, Calendar, AlertTriangle, Users, IndianRupee,
} from "lucide-react";
import { T, F } from "../theme";
import {
  top10RetailCustomers, retailCategorySplit, frequentRetailBuyers,
  inactiveRetailAlerts, newVsReturningRetail,
} from "../data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Row 1: Top 10 Customers · Category Split · New vs Returning ─────────────
export function RetailChartsRow1() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, marginBottom: 22, alignItems: "stretch" }}>
      {/* Chart 1: Top Retail Customers */}
      <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", height: 380, boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
              <Star size={24} color={T.antiqueGold} />
            </div>
            <div>
              <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Top 10 Retail Customers</h3>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>By purchase value</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          {top10RetailCustomers.slice(0, 5).map((c, i) => {
            const maxSpend = top10RetailCustomers[0].spend;
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

      {/* Chart 2: Category Split */}
      <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", height: 380, boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(110,15,45,0.07)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(110,15,45,0.08)" }}>
              <Users size={24} color={T.royalBurgundy} />
            </div>
            <div>
              <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Category Split</h3>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Revenue by saree type</p>
            </div>
          </div>
        </div>
        <div style={{ position: "relative", height: 200, flexShrink: 0 }}>
          <ResponsiveContainer key="rc-rt-2" width="100%" height="100%">
            <PieChart key="pie-chart-rt" id="retail-category-pie-chart">
              <Pie key="rt-pie" id="rt-pie" data={retailCategorySplit} innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name" stroke="none">
                {retailCategorySplit.map((entry, index) => (
                  <Cell key={`cell-pie-rt-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.luxuryBrown }}>₹4.2L</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>Total Retail</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 18, flexWrap: "wrap" as const }}>
          {retailCategorySplit.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.fill }} />
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, fontWeight: 500 }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 3: New vs Returning */}
      <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", height: 380, boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(30,102,64,0.08)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(30,102,64,0.10)" }}>
              <Users size={24} color={T.greenMid} />
            </div>
            <div>
              <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>New vs Returning</h3>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>Retail customers</p>
            </div>
          </div>
        </div>
        <div style={{ height: 200, flexShrink: 0 }}>
          <ResponsiveContainer key="rc-rt-3" width="100%" height="100%">
            <BarChart key="bar-chart-rt-new" id="retail-new-vs-returning-chart" data={newVsReturningRetail} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid key="grid-rt" strokeDasharray="3 3" vertical={false} stroke={T.borderDef} />
              <XAxis key="x-axis-rt-2" id="x-axis-rt-2" dataKey="month" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} dy={10} />
              <YAxis key="y-axis-rt-2" id="y-axis-rt-2" axisLine={false} tickLine={false} tick={{ fontFamily: F.ui, fontSize: 12, fill: T.taupe }} />
              <RechartsTooltip key="tooltip-rt-2" cursor={{fill: 'rgba(110,15,45,0.04)'}} contentStyle={{fontFamily: F.ui, fontSize: 13, borderRadius: 8, border: `1px solid ${T.borderDef}`}} />
              <Legend key="legend-rt" iconType="circle" wrapperStyle={{ fontFamily: F.ui, fontSize: 12 }} />
              <Bar key="bar-rt-new" id="bar-rt-new" dataKey="new" name="New" fill={T.royalBurgundy} radius={[4, 4, 0, 0]} barSize={10} />
              <Bar key="bar-rt-returning" id="bar-rt-returning" dataKey="returning" name="Returning" fill={T.antiqueGold} radius={[4, 4, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Row 2: Frequent Buyers · Inactive Customers ──────────────────────────────
export function RetailChartsRow2() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 32, alignItems: "stretch" }}>
      {/* Chart 4: Frequent Buyers */}
      <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
              <Calendar size={24} color={T.antiqueGold} />
            </div>
            <div>
              <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Frequent Retail Buyers</h3>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>By number of purchases</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
          {frequentRetailBuyers.map((fb, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: "50%", background: i === 0 ? T.royalBurgundy : "rgba(200,155,71,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: i === 0 ? "#FFF" : T.antiqueGold }}>#{i+1}</span>
              </div>
              <div style={{ flex: 1, fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>{fb.name}</div>
              <div style={{ flex: 2 }}>
                <div style={{ height: 10, background: "rgba(200,155,71,0.13)", borderRadius: 5 }}>
                  <div style={{ width: `${(fb.count/20)*100}%`, height: "100%", background: i === 0 ? T.royalBurgundy : T.antiqueGold, borderRadius: 5 }} />
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
              <h3 style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Inactive Retail Customers</h3>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>No purchase in 6 months</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {inactiveRetailAlerts.map((al, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, boxShadow: "0 1px 4px rgba(74,6,27,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.silkCream, border: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 16, color: T.royalBurgundy, fontWeight: 700 }}>
                  {al.name.replace("Smt. ", "").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{al.name}</span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Last purchase: {al.time}</div>
                </div>
              </div>
              <button style={{ background: "transparent", border: `1px solid ${T.borderGold}`, borderRadius: 7, color: T.antiqueGold, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "7px 16px" }}>Reach Out</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
