import React from "react";
import { ShoppingBag, LayoutGrid, List } from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER } from "@/shared/ui/DateFilterBar";
import { MobileFilterBar } from "@/shared/ui/filter/MobileFilterBar";
import { T } from "../theme";
import { Select, SectionCard } from "../common/primitives";
import { Button, SearchInput } from "@/shared/ui/primitives";

export interface FilterOptions {
  supplier: string[];
  po: string[];
  type: string[];
  color: string[];
}

/** Search box, status pills, and the supplier/PO/serial/type/colour dropdown filters. */
export function FilterBar({
  search, setSearch,
  statusFilter, setStatusFilter, statusCounts,
  dateFilter, setDateFilter,
  viewMode, setViewMode,
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
  /** How many purchases each status covers under the other active filters. */
  statusCounts?: Record<string, number>;
  dateFilter: DateFilterState; setDateFilter: (v: DateFilterState) => void;
  viewMode?: "card" | "table"; setViewMode?: (v: "card" | "table") => void;
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
      {/* Mobile Flipkart-style Filter Bar */}
      <div className="md:hidden mb-4 bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
        <MobileFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by supplier, ID, location, GST..."
          filterGroups={[
            {
              id: "time",
              label: "Time Period",
              value: dateFilter.mode,
              defaultValue: "all",
              options: [
                { value: "all", label: "All Time" },
                { value: "day", label: "Specific Date" },
                { value: "range", label: "Date Range" },
                { value: "month", label: "Monthly" },
                { value: "year", label: "Yearly" },
              ],
              onChange: (m: string) => {
                const mode = m as DateFilterState["mode"];
                if (mode === "day") setDateFilter({ mode, day: new Date().toISOString().slice(0, 10), from: "", to: "", month: "", year: "" });
                else if (mode === "month") setDateFilter({ mode, day: "", from: "", to: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, year: "" });
                else if (mode === "year") setDateFilter({ mode, day: "", from: "", to: "", month: "", year: String(new Date().getFullYear()) });
                else setDateFilter({ mode, day: "", from: "", to: "", month: "", year: "" });
              },
            },
            {
              id: "status",
              label: "Payment Status",
              value: statusFilter,
              defaultValue: "All Status",
              options: [
                { value: "All Status", label: "All Status" },
                { value: "Paid", label: "Paid" },
                { value: "Partial", label: "Partial" },
                { value: "Pending", label: "Unpaid" },
              ],
              onChange: setStatusFilter,
            },
            {
              id: "supplier",
              label: "Supplier",
              value: fSupplier,
              defaultValue: opts.supplier[0] ?? "All Suppliers",
              options: opts.supplier.map(s => ({ value: s, label: s })),
              onChange: v => { setFSupplier(v); setFPurchaseOrder("All Purchase Orders"); setFSerial("All Serial No.s"); },
            },
            {
              id: "po",
              label: "Purchase Order",
              value: fPurchaseOrder,
              defaultValue: opts.po[0] ?? "All Purchase Orders",
              options: opts.po.map(p => ({ value: p, label: p })),
              onChange: v => { setFPurchaseOrder(v); setFSerial("All Serial No.s"); },
            },
            {
              id: "serial",
              label: "Serial No",
              value: fSerial,
              defaultValue: poSerialOpts[0] ?? "All Serial No.s",
              options: poSerialOpts.map(s => ({ value: s, label: s })),
              onChange: setFSerial,
            },
            {
              id: "type",
              label: "Saree Type",
              value: fType,
              defaultValue: opts.type[0] ?? "All Types",
              options: opts.type.map(t => ({ value: t, label: t })),
              onChange: setFType,
            },
            {
              id: "color",
              label: "Color",
              value: fColor,
              defaultValue: opts.color[0] ?? "All Colors",
              options: opts.color.map(c => ({ value: c, label: c })),
              onChange: setFColor,
            },
          ]}
          onResetAll={clearFilters}
        />
      </div>

      {/* Desktop Filter Bar & Controls */}
      <div className="hidden md:block">
        <div style={{
          background: "white",
          borderRadius: 18,
          border: `1px solid ${T.borderDef}`,
          boxShadow: "0 4px 20px rgba(74,6,27,0.07)",
          padding: "18px 22px",
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}>
          {/* Top Row: Search Input + Status Filter Pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <div className="flex-1 min-w-0">
              <SearchInput aria-label="Search by supplier, ID, location, GST, invoice"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={setSearch}
                placeholder="Search by supplier, ID, location, GST, invoice…"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
              {[
                { key: "All Status", label: "All Status" },
                { key: "Paid", label: "Paid" },
                { key: "Partial", label: "Partial" },
                // Labelled "Unpaid" to match the pill the table shows for this
                // status — the stored value is still "Pending".
                { key: "Pending", label: "Unpaid" },
              ].map(f => (
                <Button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  size="sm"
                  className={
                    statusFilter === f.key
                      ? "rounded-[10px] bg-[var(--surface-brand)] text-[#FFFDF9] border-none shadow-none"
                      : "rounded-[10px] bg-transparent text-[var(--text-tertiary)] border border-[rgba(110,15,45,0.18)] shadow-none"
                  }
                >
                  {f.label}
                  {statusCounts && (
                    <span className="ml-1.5 opacity-70">{statusCounts[f.key] ?? 0}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Bottom Row: Dropdown Filters below search bar line */}
          <div className="flex flex-wrap items-center gap-2.5 w-full pt-2 border-t border-[rgba(110,15,45,0.08)]">
            <Select value={fSupplier} options={opts.supplier} containerClassName="w-full sm:w-auto" className="w-full sm:w-auto"
              onChange={v => { setFSupplier(v); setFPurchaseOrder("All Purchase Orders"); setFSerial("All Serial No.s"); }} />

            <Select value={fPurchaseOrder} options={opts.po} containerClassName="w-full sm:w-auto" className="w-full sm:w-auto"
              onChange={v => { setFPurchaseOrder(v); setFSerial("All Serial No.s"); }} />

            <Select value={fSerial} options={poSerialOpts} containerClassName="w-full sm:w-auto" className="w-full sm:w-auto" onChange={setFSerial} />

            <Select value={fType} options={opts.type} containerClassName="w-full sm:w-auto" className="w-full sm:w-auto" onChange={setFType} />

            <Select value={fColor} options={opts.color} containerClassName="w-full sm:w-auto" className="w-full sm:w-auto" onChange={setFColor} />

            {filtersActive && (
              <Button
                onClick={clearFilters}
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto sm:ml-auto shadow-none rounded-[10px]"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>
      </div>

      <div className="flex md:hidden items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0 mb-4 w-fit">
        <Button
          onClick={() => setViewMode?.("card")}
          variant="ghost"
          className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
            viewMode === "card"
              ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
              : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
          }`}
        >
          <LayoutGrid size={14} /> Card View
        </Button>
        <Button
          onClick={() => setViewMode?.("table")}
          variant="ghost"
          className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
            viewMode === "table"
              ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
              : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
          }`}
        >
          <List size={14} /> Table View
        </Button>
      </div>

      {children}
    </SectionCard>
    </div>
  );
}
