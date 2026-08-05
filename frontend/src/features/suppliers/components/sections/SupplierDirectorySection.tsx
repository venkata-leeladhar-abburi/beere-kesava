// Directory grid — search/filter controls plus the card grid of all suppliers.

import React from "react";
import { Plus, Building2 } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp } from "../common/primitives";
import { SupplierCard } from "./SupplierCard";
import { Supplier } from "../../contexts/SupplierContext";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";

export function SupplierDirectorySection({
  filtered, search, setSearch, statusFilter, setStatusFilter,
  ratingFilter, setRatingFilter, onAddSupplier, onViewSupplier,
}: {
  filtered: Supplier[];
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  ratingFilter: string;
  setRatingFilter: (v: string) => void;
  onAddSupplier: () => void;
  onViewSupplier: (s: Supplier) => void;
}) {
  return (
    <div style={{ padding: "48px 56px 0" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
            <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Supplier Directory</h2>
          </div>
          <Button variant="primary" size="md" iconLeft={Plus} onClick={onAddSupplier}>
            Add New Supplier
          </Button>
        </div>

        <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", boxShadow: "0 2px 10px rgba(74,6,27,0.05)" }}>
          <div style={{ flex: "1 1 280px" }}>
            <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by supplier name, city, or contact…" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["All", "Active", "Overdue", "Inactive"].map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? "primary" : "tertiary"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="rounded-full"
              >
                {s}
              </Button>
            ))}
          </div>
          <div style={{ width: 160 }}>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              {["All Ratings", "5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </Select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {filtered.map((s, i) => (
            <FadeUp key={s.id} delay={i * 0.06}>
              <SupplierCard supplier={s} onView={onViewSupplier} />
            </FadeUp>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "60px 24px", textAlign: "center" }}>
              <Building2 size={44} color={T.taupe} style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: F.display, fontSize: 18, color: T.taupe }}>No suppliers match your search or filter.</div>
            </div>
          )}
        </div>
      </FadeUp>
    </div>
  );
}
