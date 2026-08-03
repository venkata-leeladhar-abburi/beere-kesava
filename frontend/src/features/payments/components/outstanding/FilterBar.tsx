import React from "react";
import { Package, Search } from "lucide-react";
import { T, F } from "../../theme";
import { AGE_BUCKETS, Card } from "./primitives";
import type { AgeKey } from "./primitives";

// ── Filter bar ───────────────────────────────────────────────────────────────
export function FilterBar({
  search, setSearch, ageFilter, setAgeFilter, count,
}: {
  search: string; setSearch: (v: string) => void;
  ageFilter: AgeKey; setAgeFilter: (v: AgeKey) => void;
  count: number;
}) {
  return (
    <Card pad={16}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search saree code, weaver, loom, supplier, invoice, saree type…"
            style={{ width: "100%", height: 42, paddingLeft: 42, paddingRight: 14, fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, background: T.silkCream, border: `1.5px solid ${T.borderDef}`, borderRadius: 11, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700 }}>Ageing</span>
          {(["all", ...AGE_BUCKETS] as AgeKey[]).map(k => (
            <button key={k} onClick={() => setAgeFilter(k)}
              style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, padding: "8px 14px", borderRadius: 99, cursor: "pointer", background: ageFilter === k ? T.royalBurgundy : "transparent", color: ageFilter === k ? "#FFFDF9" : T.taupe, border: ageFilter === k ? "none" : `1.5px solid rgba(110,15,45,0.18)` }}>
              {k === "all" ? "All ages" : `${k} d`}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", background: T.warmCream, borderRadius: 10, padding: "8px 14px" }}>
          <Package size={15} color={T.taupe} />
          <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, fontWeight: 600 }}>{count} outstanding</span>
        </div>
      </div>
    </Card>
  );
}
