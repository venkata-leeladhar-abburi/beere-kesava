import {
  Download, Eye, UserPlus,
  LayoutGrid, AlignJustify, MapPin,
  Phone, Calendar, Star, IndianRupee, AlertTriangle, Users,
} from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../../shared/ui/DateFilterBar";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { SectionTitle, Pill } from "../common/primitives";
import { Button, IconButton, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { RetailCustomer } from "../types";
import { retailData } from "../data";
import { RetailChartsRow1, RetailChartsRow2 } from "./RetailCharts";

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
              <div style={{ fontFamily: F.display, fontSize: 30, color: st.c, fontWeight: 700, lineHeight: 1.0 }}>{st.v}</div>
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginTop: 6 }}>{st.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <RetailChartsRow1 />
      <RetailChartsRow2 />

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap" as const, gap: 12 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" as const }}>
          <div style={{ width: 300 }}>
            <SearchInput
              value={retailSearch}
              onChange={e => setRetailSearch(e.target.value)}
              placeholder="Search by customer name or phone..."
            />
          </div>
          <Pill active={retailStatusFilter === "all"} onClick={() => setRetailStatusFilter("all")}>All Retail ({retailData.length})</Pill>
          <Pill active={retailStatusFilter === "regular"} onClick={() => setRetailStatusFilter("regular")}>Regular Buyers ({retailData.filter(r => r.regular).length})</Pill>
          <Pill active={retailStatusFilter === "inactive"} onClick={() => setRetailStatusFilter("inactive")}>Inactive ({retailData.filter(r => r.inactive).length})</Pill>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" as const }}>
          <div style={{ width: 160 }}>
            <Select value={retailCityFilter} onValueChange={setRetailCityFilter} size="sm" placeholder="All Cities">
              <SelectItem value="all">All Cities</SelectItem>
              {retailCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </Select>
          </div>
          <div style={{ width: 200 }}>
            <Select value={retailSort} onValueChange={v => setRetailSort(v as any)} size="sm">
              <SelectItem value="spend">Sort: Total Spend</SelectItem>
              <SelectItem value="purchases">Sort: Total Purchases</SelectItem>
              <SelectItem value="recent">Sort: Most Recent Visit</SelectItem>
            </Select>
          </div>
          <div style={{ display: "flex", background: "#FFF", borderRadius: 8, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
            <IconButton
              icon={LayoutGrid}
              label="Card view"
              variant={retailView === "card" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setRetailView("card")}
              className="rounded-none"
            />
            <IconButton
              icon={AlignJustify}
              label="List view"
              variant={retailView === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setRetailView("list")}
              className="rounded-none border-l"
            />
          </div>
        </div>
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 18 }}>{filteredRetail.length} customer{filteredRetail.length !== 1 ? "s" : ""} found</div>

      {/* Retail Cards View */}
      {retailView === "card" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, alignItems: "stretch" }}>
          {filteredRetail.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 20px", color: T.taupe, fontFamily: F.ui, fontSize: 14 }}>No retail customers match these filters.</div>
          )}
          {filteredRetail.map((r, i) => (
            <div key={i} style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ height: 4, background: r.regular ? T.antiqueGold : r.inactive ? T.taupe : T.royalBurgundy }} />
              <div style={{ padding: "22px 22px 0", flex: 1 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
                  <div style={{ width: 60, height: 60, minWidth: 60, borderRadius: "50%", background: T.warmCream, border: `2px solid ${T.borderGold}`, color: T.luxuryBrown, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                    {r.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: T.luxuryBrown, margin: "0 0 6px 0", lineHeight: 1.2 }}>{r.name}</h4>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      {r.regular && (
                        <span style={{ background: T.goldLight, padding: "3px 10px", borderRadius: 12, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 4 }}>
                          <Star size={11} fill={T.luxuryBrown} /> Regular
                        </span>
                      )}
                      {r.inactive && (
                        <span style={{ background: T.crimsonBg, padding: "3px 10px", borderRadius: 12, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.crimson }}>Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 8 }}>
                    <Phone size={13} color={T.taupe} />{r.phone}
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 8 }}>
                    <MapPin size={13} color={T.taupe} />{r.city}
                  </div>
                </div>
                <div style={{ height: 1, background: T.borderDef, marginBottom: 18 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, marginBottom: 4 }}>Total Purchases</div>
                    <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.antiqueGold, lineHeight: 1 }}>{r.purchases}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500, marginBottom: 4 }}>Total Spent</div>
                    <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1 }}>₹{r.spend}</div>
                  </div>
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, display: "flex", alignItems: "center", gap: 6, marginBottom: 22 }}>
                  <Calendar size={13} color={T.taupe} /> Last visit: {r.lastVisit}
                </div>
              </div>
              <div style={{ padding: "0 22px 22px", display: "flex", gap: 8 }}>
                <Button onClick={() => onViewHistory(r)} iconLeft={Eye} fullWidth className="whitespace-nowrap">
                  View Purchase History
                </Button>
                <DownloadGate>
                  <Button
                    onClick={() => onDownloadConfirm(r)}
                    iconLeft={Download}
                    variant="tertiary"
                    title="Download Data"
                    className="whitespace-nowrap"
                  >
                    Download
                  </Button>
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
                  <td style={{ padding: "14px 18px" }}>{r.regular ? <span style={{ background: T.goldLight, padding: "3px 10px", borderRadius: 12, fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}>⭐ Regular</span> : "—"}</td>
                  <td style={{ padding: "14px 18px" }}><Button onClick={() => onViewHistory(r)} variant="link">View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
