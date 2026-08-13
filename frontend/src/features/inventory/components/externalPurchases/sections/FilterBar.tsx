import React from "react";
import { ShoppingBag } from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../../../shared/ui/DateFilterBar";
import { T } from "../theme";
import { Select, SectionCard } from "../common/primitives";
import { Button, SearchInput } from "../../../../../shared/ui/primitives";

export interface FilterOptions {
  supplier: string[];
  po: string[];
  type: string[];
  color: string[];
}

/** Search box, status pills, and the supplier/PO/serial/type/colour dropdown filters. */
export function FilterBar({
  search, setSearch,
  statusFilter, setStatusFilter,
  dateFilter, setDateFilter,
  fSupplier, setFSupplier,
  fPurchaseOrder, setFPurchaseOrder,
  fSerial, setFSerial,
  poSerialOpts,
  fType, setFType,
  fColor, setFColor,
  opts,
  filtersActive,
  clearFilters,
  children,
}: {
  search: string; setSearch: (v: string) => void;
  statusFilter: string; setStatusFilter: (v: string) => void;
  dateFilter: DateFilterState; setDateFilter: (v: DateFilterState) => void;
  fSupplier: string; setFSupplier: (v: string) => void;
  fPurchaseOrder: string; setFPurchaseOrder: (v: string) => void;
  fSerial: string; setFSerial: (v: string) => void;
  poSerialOpts: string[];
  fType: string; setFType: (v: string) => void;
  fColor: string; setFColor: (v: string) => void;
  opts: FilterOptions;
  filtersActive: boolean;
  clearFilters: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40 }}>
    <SectionCard icon={ShoppingBag} title="External Purchases" subtitle="Every raw-material purchase recorded, with supplier, invoice, and payment status.">
      <div style={{
        background: "white",
        borderRadius: 18,
        border: `1px solid ${T.borderDef}`,
        boxShadow: "0 4px 20px rgba(74,6,27,0.07)",
        padding: "18px 22px",
        marginBottom: 24,
        display: "flex",
        gap: 14,
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <div style={{ flex: "1 1 280px" }}>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={setSearch}
            placeholder="Search by supplier, ID, location, GST, invoice…"
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "All Status", label: "All Status" },
            { key: "Paid", label: "Paid" },
            { key: "Pending", label: "Pending" },
            { key: "Partial", label: "Partial" },
          ].map(f => (
            <Button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              size="sm"
              className={
                statusFilter === f.key
                  ? "rounded-full bg-[var(--surface-brand)] text-[#FFFDF9] border-none shadow-none"
                  : "rounded-full bg-transparent text-[var(--text-tertiary)] border border-[rgba(110,15,45,0.18)] shadow-none"
              }
            >
              {f.label}
            </Button>
          ))}
        </div>

        <Select value={fSupplier} options={opts.supplier}
          onChange={v => { setFSupplier(v); setFPurchaseOrder("All Purchase Orders"); setFSerial("All Serial No.s"); }} />

        <Select value={fPurchaseOrder} options={opts.po}
          onChange={v => { setFPurchaseOrder(v); setFSerial("All Serial No.s"); }} />

        <Select value={fSerial} options={poSerialOpts} onChange={setFSerial} />

        <Select value={fType} options={opts.type} onChange={setFType} />

        <Select value={fColor} options={opts.color} onChange={setFColor} />

        {filtersActive && (
          <Button
            onClick={clearFilters}
            variant="secondary"
            className="ml-auto shadow-none"
          >
            Clear filters
          </Button>
        )}
      </div>

      <DateFilterBar filter={dateFilter} onChange={setDateFilter} />

      {children}
    </SectionCard>
    </div>
  );
}
