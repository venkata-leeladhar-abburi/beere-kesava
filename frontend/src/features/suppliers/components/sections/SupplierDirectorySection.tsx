// Directory grid — search/filter controls plus the card grid of all suppliers.

import React from "react";
import { Plus, Building2 } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SectionCard } from "../common/primitives";
import { Supplier, useSuppliers } from "../../contexts/SupplierContext";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { SupplierCard, type SupplierCardProps } from "@/shared/ui/domain";
import { rupees } from "@/lib/domain/money";

// SupplierCard's shared taxonomy is person-only (design-system/06-DOMAIN.md
// Part G.2 — no payment slot for suppliers), so the "overdue" value from
// Supplier.status (a payment concept, same overloaded-field pattern as
// vendors) maps to the closest PersonStatus rather than growing the
// taxonomy for this one call site.
const SUPPLIER_STATUS: Record<Supplier["status"], SupplierCardProps["status"]> = {
  active: "active",
  inactive: "inactive",
  overdue: "at-risk",
};

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
  const { statsFor } = useSuppliers();
  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 48 }}>
      <FadeUp>
      <SectionCard
        icon={Building2}
        title="Supplier Directory"
        subtitle="Browse all raw-material suppliers, track their orders, ratings, and outstanding balances."
        actions={
          <Button variant="secondary" size="md" iconLeft={Plus} onClick={onAddSupplier} className="bg-white/10 text-[#FFFDF9] border-white/20">
            Add New Supplier
          </Button>
        }
      >
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
          {filtered.map((s, i) => {
            const stats = statsFor(s.id);
            return (
              <FadeUp key={s.id} delay={i * 0.06}>
                <SupplierCard
                  code={s.code || s.id}
                  name={s.name}
                  city={s.city}
                  purchaseOrders={stats.purchases.length}
                  spend={rupees(stats.totalPurchased)}
                  rating={s.rating || undefined}
                  status={SUPPLIER_STATUS[s.status]}
                  onClick={() => onViewSupplier(s)}
                />
              </FadeUp>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "60px 24px", textAlign: "center" }}>
              <Building2 size={44} color={T.taupe} style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: F.display, fontSize: 18, color: T.taupe }}>No suppliers match your search or filter.</div>
            </div>
          )}
        </div>
      </SectionCard>
      </FadeUp>
    </div>
  );
}
