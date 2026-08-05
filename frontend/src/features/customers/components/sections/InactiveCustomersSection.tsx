import { Search } from "lucide-react";
import { T, F } from "../theme";
import { SectionTitle, Pill } from "../common/primitives";
import { monthsSinceLabel } from "../utils";

export interface InactiveCustomerRow {
  name: string;
  type: string;
  city: string;
  last: string;
  spend: string;
}

export interface InactiveCustomersSectionProps {
  inactiveSearch: string;
  setInactiveSearch: (s: string) => void;
  inactiveTypeFilter: "all" | "Wholesale" | "Retail";
  setInactiveTypeFilter: (t: "all" | "Wholesale" | "Retail") => void;
  inactiveCityFilter: "all" | string;
  setInactiveCityFilter: (c: string) => void;
  inactiveTimelineFilter: "all" | "6" | "8" | "10" | "12";
  setInactiveTimelineFilter: (t: "all" | "6" | "8" | "10" | "12") => void;
  inactiveCities: string[];
  filteredInactive: InactiveCustomerRow[];
  inactiveDataLength: number;
  wholesaleCount: number;
  retailCount: number;
}

// ── SECTION 6: INACTIVE CUSTOMERS ───────────────────────────────────────────
export function InactiveCustomersSection({
  inactiveSearch, setInactiveSearch, inactiveTypeFilter, setInactiveTypeFilter,
  inactiveCityFilter, setInactiveCityFilter, inactiveTimelineFilter, setInactiveTimelineFilter,
  inactiveCities, filteredInactive, inactiveDataLength, wholesaleCount, retailCount,
}: InactiveCustomersSectionProps) {
  return (
    <div style={{ padding: "0 56px 64px 56px" }}>
      <SectionTitle
        title="Inactive Customers — No Purchase in 6 Months"
        sub="These customers have not placed any order or visited the shop in the last 6 months. Consider reaching out to bring them back."
        action="Download Inactive List →"
      />

      {/* Filters + timeline */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap" as const, gap: 12 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 9, padding: "9px 16px", width: 260 }}>
            <Search size={16} color={T.taupe} />
            <input
              type="text" value={inactiveSearch} onChange={e => setInactiveSearch(e.target.value)}
              placeholder="Search by customer name..."
              style={{ border: "none", outline: "none", width: "100%", marginLeft: 8, fontFamily: F.ui, fontSize: 14 }}
            />
          </div>
          <Pill active={inactiveTypeFilter === "all"} onClick={() => setInactiveTypeFilter("all")}>All ({inactiveDataLength})</Pill>
          <Pill active={inactiveTypeFilter === "Wholesale"} onClick={() => setInactiveTypeFilter("Wholesale")}>Wholesale ({wholesaleCount})</Pill>
          <Pill active={inactiveTypeFilter === "Retail"} onClick={() => setInactiveTypeFilter("Retail")}>Retail ({retailCount})</Pill>
        </div>
        <select
          value={inactiveCityFilter} onChange={e => setInactiveCityFilter(e.target.value)}
          style={{ height: 38, borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "#FFF", padding: "0 10px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, cursor: "pointer" }}
        >
          <option value="all">All Cities</option>
          {inactiveCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Timeline filter — how long inactive */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20, flexWrap: "wrap" as const }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 600, marginRight: 4 }}>Inactive for:</span>
        {([
          { key: "all", label: "Any length" },
          { key: "6", label: "6+ months" },
          { key: "8", label: "8+ months" },
          { key: "10", label: "10+ months" },
          { key: "12", label: "12+ months" },
        ] as const).map(t => (
          <button
            key={t.key} onClick={() => setInactiveTimelineFilter(t.key)}
            style={{ padding: "7px 16px", borderRadius: 20, cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 600, background: inactiveTimelineFilter === t.key ? T.crimson : "transparent", border: `1px solid ${inactiveTimelineFilter === t.key ? T.crimson : T.borderDef}`, color: inactiveTimelineFilter === t.key ? "#FFF" : T.taupe }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 12 }}>{filteredInactive.length} customer{filteredInactive.length !== 1 ? "s" : ""} found</div>

      <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.ui, fontSize: 14 }}>
          <thead>
            <tr style={{ background: T.silkCream, borderBottom: `1px solid ${T.borderDef}`, textAlign: "left" }}>
              <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Customer Name</th>
              <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Type</th>
              <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>City</th>
              <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Inactive Since</th>
              <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Total Spend Ever</th>
              <th style={{ padding: "16px 24px", color: T.taupe, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInactive.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "40px 24px", textAlign: "center", color: T.taupe, fontFamily: F.ui, fontSize: 14 }}>No customers match these filters.</td></tr>
            )}
            {filteredInactive.map((row, i) => {
              const months = Math.round(monthsSinceLabel(row.last));
              const severity = months >= 12 ? { color: T.crimson, bg: T.crimsonBg, label: "Critical" } : months >= 9 ? { color: "#B5651D", bg: "rgba(181,101,29,0.10)", label: "High" } : { color: T.antiqueGold, bg: "rgba(200,155,71,0.12)", label: "Moderate" };
              const pct = Math.min(100, Math.round((months / 12) * 100));
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderDef}` }}>
                  <td style={{ padding: "16px 24px", fontWeight: 600, color: T.luxuryBrown }}>{row.name}</td>
                  <td style={{ padding: "16px 24px" }}><span style={{ padding: "4px 8px", background: row.type === "Wholesale" ? T.crimsonBg : T.greenBg, color: row.type === "Wholesale" ? T.crimson : T.greenMid, fontSize: 12, borderRadius: 4, fontWeight: 600 }}>{row.type}</span></td>
                  <td style={{ padding: "16px 24px", color: T.taupe }}>{row.city}</td>
                  <td style={{ padding: "16px 24px", minWidth: 180 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, color: severity.color }}>{row.last}</span>
                      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: severity.color, background: severity.bg, borderRadius: 999, padding: "2px 8px" }}>{severity.label}</span>
                    </div>
                    <div style={{ height: 4, background: T.silkCream, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: severity.color, borderRadius: 2 }} />
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px", color: T.luxuryBrown, fontFamily: F.mono }}>₹{row.spend}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button style={{ background: "transparent", border: "none", color: T.antiqueGold, fontWeight: 600, cursor: "pointer", fontFamily: F.ui, fontSize: 13 }}>Mark as Inactive</button>
                      <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" as const }}>🔒 Superadmin only</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
