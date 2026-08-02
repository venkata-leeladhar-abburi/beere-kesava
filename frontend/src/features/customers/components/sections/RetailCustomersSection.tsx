import {
  Search, Download, Eye, UserPlus,
  LayoutGrid, AlignJustify, MapPin,
  Phone, Calendar, Star, IndianRupee, AlertTriangle, Users,
} from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { SectionTitle, Pill } from "../common/primitives";
import { RetailCustomer } from "../types";
import { retailData, top10RetailCustomers, retailCategorySplit, frequentRetailBuyers, inactiveRetailAlerts, newVsReturningRetail } from "../data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

export interface RetailCustomersSectionProps {
  retailView: "card" | "list";
  setRetailView: (v: "card" | "list") => void;
  retailOverviewDateFilter: DateFilterState;
  setRetailOverviewDateFilter: (f: DateFilterState) => void;
  retailSearch: string;
  setRetailSearch: (s: string) => void;
  retailStatusFilter: "all" | "regular" | "inactive";
  setRetailStatusFilter: (s: "all" | "regular" | "inactive") => void;
  retailCityFilter: "all" | string;
  setRetailCityFilter: (s: string) => void;
  retailSort: "spend" | "purchases" | "recent";
  setRetailSort: (s: "spend" | "purchases" | "recent") => void;
  retailCities: string[];
  filteredRetail: RetailCustomer[];
  onViewHistory: (r: RetailCustomer) => void;
  onDownloadConfirm: (r: RetailCustomer) => void;
}

// ── SECTION 5: RETAIL CUSTOMERS ─────────────────────────────────────────────
export function RetailCustomersSection({
  retailView, setRetailView, retailOverviewDateFilter, setRetailOverviewDateFilter,
  retailSearch, setRetailSearch, retailStatusFilter, setRetailStatusFilter,
  retailCityFilter, setRetailCityFilter, retailSort, setRetailSort,
  retailCities, filteredRetail, onViewHistory, onDownloadConfirm,
}: RetailCustomersSectionProps) {
  return (
    <div style={{ padding: "0 56px 64px 56px" }}>
      <SectionTitle
        title="Retail Customers"
        sub="Retail customer profiles are created automatically when a sale is recorded at the shop. Admin can view all profiles and purchase history."
        action="📥 Download Retail Customer List →"
      />

      <div style={{ marginBottom: 24 }}>
        <DateFilterBar filter={retailOverviewDateFilter} onChange={setRetailOverviewDateFilter} />
      </div>

      {/* Retail stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 28, alignItems: "stretch" }}>
        {[
          { ico: <Users size={24} color={T.royalBurgundy} />, bg: "rgba(110,15,45,0.07)", l: "Total Retail Customers", v: "1,284", c: T.luxuryBrown, sub: "Profiles at point of sale" },
          { ico: <UserPlus size={24} color={T.antiqueGold} />, bg: "rgba(200,155,71,0.09)", l: "New Customers This Month", v: "8", c: T.antiqueGold, sub: "Added via new sale entries" },
          { ico: <IndianRupee size={24} color={T.greenMid} />, bg: T.greenBg, l: "Retail Revenue This Month", v: "₹4,20,000", c: T.greenMid, sub: "Total from all retail sales" },
          { ico: <AlertTriangle size={24} color={T.taupe} />, bg: "rgba(139,112,96,0.08)", l: "Inactive — No Visit in 6M", v: "3", c: T.taupe, sub: "Consider reaching out" },
        ].map((st, i) => (
          <div key={i} style={{ background: "#FFF", padding: "22px 22px 20px", borderRadius: 14, border: `1px solid ${T.borderDef}`, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 2px 10px rgba(74,6,27,0.04)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 13, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {st.ico}
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 6 }}>{st.l}</div>
              <div style={{ fontFamily: F.display, fontSize: 32, color: st.c, fontWeight: 700, lineHeight: 1.0 }}>{st.v}</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>{st.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Retail Charts Row 1 — equal 3 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, marginBottom: 22, alignItems: "stretch" }}>
        {/* Chart 1: Top Retail Customers */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", height: 380, boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                <Star size={24} color={T.antiqueGold} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Top 10 Retail Customers</h3>
                <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: 0 }}>By purchase value</p>
              </div>
            </div>
          </div>
          {/* Custom ranked bar rows */}
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
                    <span style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, color: rankColor }}>{i + 1}</span>
                  </div>
                  <div style={{ width: 96, minWidth: 96, fontFamily: F.ui, fontSize: 12.5, fontWeight: i < 3 ? 700 : 500, color: i < 3 ? T.luxuryBrown : T.taupe, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
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
                <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Category Split</h3>
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
                <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>New vs Returning</h3>
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

      {/* Retail Charts Row 2 — equal 2 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 32, alignItems: "stretch" }}>
        {/* Chart 4: Frequent Buyers */}
        <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 18, padding: "28px", display: "flex", flexDirection: "column", boxShadow: "0 2px 14px rgba(74,6,27,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                <Calendar size={24} color={T.antiqueGold} />
              </div>
              <div>
                <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Frequent Retail Buyers</h3>
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
                <div style={{ flex: 1, fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: T.luxuryBrown }}>{fb.name}</div>
                <div style={{ flex: 2 }}>
                  <div style={{ height: 10, background: "rgba(200,155,71,0.13)", borderRadius: 5 }}>
                    <div style={{ width: `${(fb.count/20)*100}%`, height: "100%", background: i === 0 ? T.royalBurgundy : T.antiqueGold, borderRadius: 5 }} />
                  </div>
                </div>
                <div style={{ width: 120, textAlign: "right" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{fb.count} orders</div>
                  <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 2 }}>{fb.freq}</div>
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
                <h3 style={{ fontFamily: F.ui, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 4px 0", lineHeight: 1.3 }}>Inactive Retail Customers</h3>
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
                      <span style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{al.name}</span>
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

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap" as const, gap: 12 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "9px 16px", width: 300 }}>
            <Search size={16} color={T.taupe} />
            <input
              type="text" value={retailSearch} onChange={e => setRetailSearch(e.target.value)}
              placeholder="Search by customer name or phone..."
              style={{ border: "none", outline: "none", width: "100%", marginLeft: 8, fontFamily: F.ui, fontSize: 14 }}
            />
          </div>
          <Pill active={retailStatusFilter === "all"} onClick={() => setRetailStatusFilter("all")}>All Retail ({retailData.length})</Pill>
          <Pill active={retailStatusFilter === "regular"} onClick={() => setRetailStatusFilter("regular")}>Regular Buyers ({retailData.filter(r => r.regular).length})</Pill>
          <Pill active={retailStatusFilter === "inactive"} onClick={() => setRetailStatusFilter("inactive")}>Inactive ({retailData.filter(r => r.inactive).length})</Pill>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" as const }}>
          <select
            value={retailCityFilter} onChange={e => setRetailCityFilter(e.target.value)}
            style={{ height: 38, borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "#FFF", padding: "0 10px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, cursor: "pointer" }}
          >
            <option value="all">All Cities</option>
            {retailCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={retailSort} onChange={e => setRetailSort(e.target.value as any)}
            style={{ height: 38, borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "#FFF", padding: "0 10px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, cursor: "pointer" }}
          >
            <option value="spend">Sort: Total Spend</option>
            <option value="purchases">Sort: Total Purchases</option>
            <option value="recent">Sort: Most Recent Visit</option>
          </select>
          <div style={{ display: "flex", background: "#FFF", borderRadius: 8, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
            <button onClick={() => setRetailView("card")} style={{ padding: "9px 13px", background: retailView === "card" ? T.silkCream : "transparent", border: "none", cursor: "pointer" }}><LayoutGrid size={18} color={retailView === "card" ? T.royalBurgundy : T.taupe} /></button>
            <button onClick={() => setRetailView("list")} style={{ padding: "9px 13px", background: retailView === "list" ? T.silkCream : "transparent", border: "none", borderLeft: `1px solid ${T.borderDef}`, cursor: "pointer" }}><AlignJustify size={18} color={retailView === "list" ? T.royalBurgundy : T.taupe} /></button>
          </div>
        </div>
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginBottom: 18 }}>{filteredRetail.length} customer{filteredRetail.length !== 1 ? "s" : ""} found</div>

      {/* Retail Cards View */}
      {retailView === "card" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, alignItems: "stretch" }}>
          {filteredRetail.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 20px", color: T.taupe, fontFamily: F.ui, fontSize: 14 }}>No retail customers match these filters.</div>
          )}
          {filteredRetail.map((r, i) => (
            <div key={i} style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Top accent line */}
              <div style={{ height: 4, background: r.regular ? T.antiqueGold : r.inactive ? T.taupe : T.royalBurgundy }} />

              <div style={{ padding: "22px 22px 0", flex: 1 }}>
                {/* Header: avatar + name + badges */}
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
                  <div style={{ width: 60, height: 60, minWidth: 60, borderRadius: "50%", background: T.warmCream, border: `2px solid ${T.borderGold}`, color: T.luxuryBrown, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                    {r.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 6px 0", lineHeight: 1.2 }}>{r.name}</h4>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      {r.regular && (
                        <span style={{ background: T.goldLight, padding: "3px 10px", borderRadius: 12, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 4 }}>
                          <Star size={11} fill={T.luxuryBrown} /> Regular
                        </span>
                      )}
                      {r.inactive && (
                        <span style={{ background: T.crimsonBg, padding: "3px 10px", borderRadius: 12, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.crimson }}>Inactive</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 8 }}>
                    <Phone size={13} color={T.taupe} />{r.phone}
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 8 }}>
                    <MapPin size={13} color={T.taupe} />{r.city}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: T.borderDef, marginBottom: 18 }} />

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, marginBottom: 4 }}>Total Purchases</div>
                    <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.antiqueGold, lineHeight: 1 }}>{r.purchases}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, marginBottom: 4 }}>Total Spent</div>
                    <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>₹{r.spend}</div>
                  </div>
                </div>

                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6, marginBottom: 22 }}>
                  <Calendar size={13} color={T.taupe} /> Last visit: {r.lastVisit}
                </div>
              </div>

              {/* Footer buttons */}
              <div style={{ padding: "0 22px 22px", display: "flex", gap: 8 }}>
                <button onClick={() => onViewHistory(r)} style={{ flex: 1, height: 42, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 9, color: T.royalBurgundy, fontFamily: F.ui, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 7 }}>
                  <Eye size={16} /> View Purchase History
                </button>
                <DownloadGate>
                  <button
                    onClick={() => onDownloadConfirm(r)}
                    style={{ height: 42, padding: "0 14px", background: "transparent", border: `1px solid ${T.borderGold}`, borderRadius: 9, color: T.antiqueGold, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, whiteSpace: "nowrap" as const }}
                    title="Download Data"
                  >
                    <Download size={15} /> Download
                  </button>
                </DownloadGate>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Retail List View */}
      {retailView === "list" && (
        <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.ui, fontSize: 14 }}>
            <thead>
              <tr style={{ background: T.silkCream, borderBottom: `1px solid ${T.borderDef}`, textAlign: "left" }}>
                {["Customer Name", "Phone", "City", "Total Purchases", "Total Spend", "Last Visit", "Regular Buyer", "Action"].map(h => (
                  <th key={h} style={{ padding: "14px 18px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRetail.length === 0 && (
                <tr><td colSpan={8} style={{ padding: "40px 18px", textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14 }}>No retail customers match these filters.</td></tr>
              )}
              {filteredRetail.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                  <td style={{ padding: "14px 18px", fontWeight: 600, color: T.luxuryBrown }}>{r.name}</td>
                  <td style={{ padding: "14px 18px", fontFamily: F.mono, color: T.taupe, fontSize: 13 }}>{r.phone}</td>
                  <td style={{ padding: "14px 18px", color: T.taupe }}>{r.city}</td>
                  <td style={{ padding: "14px 18px", color: T.antiqueGold, fontWeight: 600 }}>{r.purchases}</td>
                  <td style={{ padding: "14px 18px", color: T.luxuryBrown, fontWeight: 600 }}>₹{r.spend}</td>
                  <td style={{ padding: "14px 18px", color: T.taupe }}>{r.lastVisit}</td>
                  <td style={{ padding: "14px 18px" }}>{r.regular ? <span style={{ background: T.goldLight, padding: "3px 10px", borderRadius: 12, fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.luxuryBrown }}>⭐ Regular</span> : "—"}</td>
                  <td style={{ padding: "14px 18px" }}><button onClick={() => onViewHistory(r)} style={{ background: "transparent", border: "none", color: T.royalBurgundy, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
