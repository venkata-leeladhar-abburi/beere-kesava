import React from "react";

// ── Shared date filter (All Time / Date Range / Monthly / Yearly) ──────────
// Used across Weavers, Batches, Weaver Dispatcher, Goods Receipt, Material
// Issuance, External Purchases, and Payments (Making Charges, Wholesale
// Collections, Vendor Payments, Analytics, Payment History) so every history
// table in the app filters dates the same way.

const DFB_T = {
  royalBurgundy: "#6E0F2D",
  luxuryBrown: "#3B2314",
  warmCream: "#F5E8D0",
  taupe: "#8B7060",
  borderDef: "rgba(110,15,45,0.10)",
};
const DFB_F = {
  ui: "'Inter', sans-serif",
};

export type DateFilterMode = "all" | "day" | "range" | "month" | "year";
export interface DateFilterState { mode: DateFilterMode; day: string; from: string; to: string; month: string; year: string; }
export const DEFAULT_DATE_FILTER: DateFilterState = { mode: "all", day: "", from: "", to: "", month: "", year: "" };

export function matchesDateFilter(dateStr: string | undefined | null, filter: DateFilterState): boolean {
  if (filter.mode === "all" || !dateStr) return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  if (filter.mode === "day") {
    if (!filter.day) return true;
    const sel = new Date(filter.day);
    return d.getFullYear() === sel.getFullYear() && d.getMonth() === sel.getMonth() && d.getDate() === sel.getDate();
  }
  if (filter.mode === "range") {
    if (filter.from && d < new Date(filter.from)) return false;
    if (filter.to && d > new Date(`${filter.to}T23:59:59`)) return false;
    return true;
  }
  if (filter.mode === "month") {
    if (!filter.month) return true;
    const [y, m] = filter.month.split("-");
    return d.getFullYear() === parseInt(y, 10) && d.getMonth() + 1 === parseInt(m, 10);
  }
  if (filter.mode === "year") {
    if (!filter.year) return true;
    return d.getFullYear() === parseInt(filter.year, 10);
  }
  return true;
}

export function DateFilterBar({ filter, onChange }: { filter: DateFilterState; onChange: (f: DateFilterState) => void }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const inputStyle = { height: 38, borderRadius: 10, border: `1.5px solid ${DFB_T.borderDef}`, padding: "0 10px", fontFamily: DFB_F.ui, fontSize: 12.5, color: DFB_T.luxuryBrown, background: "#FFF" };

  const modes: { key: DateFilterMode; label: string }[] = [
    { key: "all", label: "All Time" },
    { key: "day", label: "Specific Date" },
    { key: "range", label: "Date Range" },
    { key: "month", label: "Monthly" },
    { key: "year", label: "Yearly" },
  ];

  const selectMode = (key: DateFilterMode) => {
    if (key === "day") onChange({ ...DEFAULT_DATE_FILTER, mode: key, day: now.toISOString().slice(0, 10) });
    else if (key === "month") onChange({ ...DEFAULT_DATE_FILTER, mode: key, month: currentMonth });
    else if (key === "year") onChange({ ...DEFAULT_DATE_FILTER, mode: key, year: String(currentYear) });
    else onChange({ ...DEFAULT_DATE_FILTER, mode: key });
  };

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center", marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 4, background: DFB_T.warmCream, borderRadius: 10, padding: 4 }}>
        {modes.map(m => (
          <button
            key={m.key}
            onClick={() => selectMode(m.key)}
            style={{
              border: "none", borderRadius: 8, padding: "7px 14px", fontFamily: DFB_F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              background: filter.mode === m.key ? DFB_T.royalBurgundy : "transparent",
              color: filter.mode === m.key ? "#FFFDF9" : DFB_T.taupe,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {filter.mode === "day" && (
        <input type="date" value={filter.day} onChange={e => onChange({ ...filter, day: e.target.value })} style={inputStyle} />
      )}

      {filter.mode === "range" && (
        <>
          <span style={{ fontFamily: DFB_F.ui, fontSize: 12.5, color: DFB_T.taupe }}>From</span>
          <input type="date" value={filter.from} onChange={e => onChange({ ...filter, from: e.target.value })} style={inputStyle} />
          <span style={{ fontFamily: DFB_F.ui, fontSize: 12.5, color: DFB_T.taupe }}>To</span>
          <input type="date" value={filter.to} onChange={e => onChange({ ...filter, to: e.target.value })} style={inputStyle} />
        </>
      )}

      {filter.mode === "month" && (
        <input type="month" value={filter.month} onChange={e => onChange({ ...filter, month: e.target.value })} style={inputStyle} />
      )}

      {filter.mode === "year" && (
        <select value={filter.year} onChange={e => onChange({ ...filter, year: e.target.value })} style={{ ...inputStyle, cursor: "pointer" as const }}>
          {Array.from({ length: 6 }, (_, i) => currentYear - i).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      )}

      {filter.mode !== "all" && (
        <button
          onClick={() => onChange(DEFAULT_DATE_FILTER)}
          style={{ border: "none", background: "none", padding: "0 4px", fontFamily: DFB_F.ui, fontSize: 12.5, fontWeight: 600, color: DFB_T.royalBurgundy, cursor: "pointer", textDecoration: "underline" }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
