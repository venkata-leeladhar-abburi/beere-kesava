import { T, F } from "../theme";
import { SectionTitle, Pill } from "../common/primitives";
import { monthsSinceLabel } from "../utils";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { FilterBarActive, type ActiveFilter } from "../../../../shared/ui/filter";

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
  /** Fires when "Clear all" is pressed in the active-filters row. Omit to hide the row entirely. */
  onClearAllFilters?: () => void;
}

const TIMELINE_LABEL: Record<string, string> = { "6": "6+ months", "8": "8+ months", "10": "10+ months", "12": "12+ months" };

// ── SECTION 6: INACTIVE CUSTOMERS ───────────────────────────────────────────
export function InactiveCustomersSection({
  inactiveSearch, setInactiveSearch, inactiveTypeFilter, setInactiveTypeFilter,
  inactiveCityFilter, setInactiveCityFilter, inactiveTimelineFilter, setInactiveTimelineFilter,
  inactiveCities, filteredInactive, inactiveDataLength, wholesaleCount, retailCount,
  onClearAllFilters,
}: InactiveCustomersSectionProps) {
  type Row = InactiveCustomerRow & { _rowIndex: number };

  const activeFilters: ActiveFilter[] = [
    ...(inactiveCityFilter !== "all" ? [{ key: "city", label: `City: ${inactiveCityFilter}`, onRemove: () => setInactiveCityFilter("all") }] : []),
    ...(inactiveTimelineFilter !== "all" ? [{ key: "timeline", label: TIMELINE_LABEL[inactiveTimelineFilter], onRemove: () => setInactiveTimelineFilter("all") }] : []),
  ];

  const inactiveColumns: ColumnDef<Row>[] = [
    {
      id: "name", header: "Customer Name", accessor: row => row.name,
      cell: (_v, row) => <span style={{ fontWeight: 600, color: T.luxuryBrown }}>{row.name}</span>,
    },
    {
      id: "type", header: "Type", accessor: row => row.type,
      cell: (_v, row) => <span style={{ padding: "4px 8px", background: row.type === "Wholesale" ? T.crimsonBg : T.greenBg, color: row.type === "Wholesale" ? T.crimson : T.greenMid, fontSize: 12, borderRadius: 4, fontWeight: 600 }}>{row.type}</span>,
    },
    {
      id: "city", header: "City", accessor: row => row.city,
      cell: (_v, row) => <span style={{ color: T.taupe }}>{row.city}</span>,
    },
    {
      id: "inactiveSince", header: "Inactive Since", accessor: row => row.last,
      cell: (_v, row) => {
        const months = Math.round(monthsSinceLabel(row.last));
        const severity = months >= 12 ? { color: T.crimson, bg: T.crimsonBg, label: "Critical" } : months >= 9 ? { color: "#B5651D", bg: "rgba(181,101,29,0.10)", label: "High" } : { color: T.antiqueGold, bg: "rgba(200,155,71,0.12)", label: "Moderate" };
        const pct = Math.min(100, Math.round((months / 12) * 100));
        return (
          <div style={{ minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontWeight: 600, color: severity.color }}>{row.last}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: severity.color, background: severity.bg, borderRadius: 999, padding: "2px 8px" }}>{severity.label}</span>
            </div>
            <div style={{ height: 4, background: T.silkCream, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: severity.color, borderRadius: 2 }} />
            </div>
          </div>
        );
      },
    },
    {
      id: "spend", header: "Total Spend Ever", accessor: row => row.spend,
      cell: (_v, row) => <span style={{ color: T.luxuryBrown, fontFamily: F.mono }}>₹{row.spend}</span>,
    },
    {
      id: "action", header: "Action", accessor: () => null, type: "actions",
      cell: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button variant="link">Mark as Inactive</Button>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" as const }}>🔒 Superadmin only</span>
        </div>
      ),
    },
  ];

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
          <div style={{ width: 260 }}>
            <SearchInput
              value={inactiveSearch}
              onChange={e => setInactiveSearch(e.target.value)}
              placeholder="Search by customer name..."
            />
          </div>
          <Pill active={inactiveTypeFilter === "all"} onClick={() => setInactiveTypeFilter("all")}>All ({inactiveDataLength})</Pill>
          <Pill active={inactiveTypeFilter === "Wholesale"} onClick={() => setInactiveTypeFilter("Wholesale")}>Wholesale ({wholesaleCount})</Pill>
          <Pill active={inactiveTypeFilter === "Retail"} onClick={() => setInactiveTypeFilter("Retail")}>Retail ({retailCount})</Pill>
        </div>
        <div style={{ width: 160 }}>
          <Select value={inactiveCityFilter} onValueChange={setInactiveCityFilter} size="sm" placeholder="All Cities">
            <SelectItem value="all">All Cities</SelectItem>
            {inactiveCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </Select>
        </div>
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
          <Button
            key={t.key}
            onClick={() => setInactiveTimelineFilter(t.key)}
            variant={inactiveTimelineFilter === t.key ? "danger" : "tertiary"}
            size="sm"
            className="rounded-full"
          >
            {t.label}
          </Button>
        ))}
      </div>

      {onClearAllFilters && (
        <FilterBarActive filters={activeFilters} onClearAll={activeFilters.length > 0 ? onClearAllFilters : undefined} className="mb-4" />
      )}

      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 12 }}>{filteredInactive.length} customer{filteredInactive.length !== 1 ? "s" : ""} found</div>

      <div style={{ background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
        <DataTable
          columns={inactiveColumns}
          data={filteredInactive.map((row, i) => ({ ...row, _rowIndex: i }))}
          getRowId={row => String(row._rowIndex)}
          emptyTitle="No customers match these filters"
        />
      </div>
    </div>
  );
}
