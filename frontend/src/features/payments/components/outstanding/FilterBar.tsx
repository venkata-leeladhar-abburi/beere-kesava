import React from "react";
import { Package } from "lucide-react";
import { T, F } from "../../theme";
import { AGE_BUCKETS, Card } from "./primitives";
import type { AgeKey } from "./primitives";
import { Button, SearchInput } from "../../../../shared/ui/primitives";

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
        <div className="flex-1 min-w-[260px]">
          <SearchInput value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search saree code, weaver, loom, supplier, invoice, saree type…" />
        </div>

        <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700 }}>Ageing</span>
          {(["all", ...AGE_BUCKETS] as AgeKey[]).map(k => (
            <Button key={k} onClick={() => setAgeFilter(k)} size="sm" variant={ageFilter === k ? "primary" : "tertiary"}
              className={ageFilter === k ? "rounded-full bg-[#6E0F2D] text-[#FFFDF9] border-none" : "rounded-full bg-transparent text-[var(--text-tertiary)] border-[1.5px] border-[rgba(110,15,45,0.18)]"}>
              {k === "all" ? "All ages" : `${k} d`}
            </Button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", background: T.warmCream, borderRadius: 10, padding: "8px 14px" }}>
          <Package size={15} color={T.taupe} />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 600 }}>{count} outstanding</span>
        </div>
      </div>
    </Card>
  );
}
