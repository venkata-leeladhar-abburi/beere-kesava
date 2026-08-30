import React from "react";
import { RotateCcw } from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../shared/ui/DateFilterBar";
import { Button, SearchInput } from "../../../shared/ui/primitives";

const T = {
  silkCream: "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B",
  luxuryBrown: "#3B2314",
  taupe: "#69635E",
  borderDef: "rgba(110,15,45,0.10)",
};
const F = { display: "'Plus Jakarta Sans', sans-serif", ui: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" };

interface AllOrdersFilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: "all" | "on-track" | "at-risk" | "completed";
  setStatusFilter: (v: "all" | "on-track" | "at-risk" | "completed") => void;
  paymentFilter: "all" | "paid" | "partial" | "pending";
  setPaymentFilter: (v: "all" | "paid" | "partial" | "pending") => void;
  dateFilter: DateFilterState;
  setDateFilter: (df: DateFilterState) => void;
  resetFilters: () => void;
}

import { MobileFilterBar } from "../../../shared/ui/filter/MobileFilterBar";

export function AllOrdersFilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  paymentFilter,
  setPaymentFilter,
  dateFilter,
  setDateFilter,
  resetFilters,
}: AllOrdersFilterBarProps) {
  const mobileFilterGroups = [
    {
      id: "time",
      label: "Timeline",
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
      label: "Production Status",
      value: statusFilter,
      options: [
        { value: "all", label: "All Statuses" },
        { value: "on-track", label: "On Track" },
        { value: "at-risk", label: "At Risk / Delayed" },
        { value: "completed", label: "Completed" },
      ],
      onChange: (v: string) => setStatusFilter(v as any),
    },
    {
      id: "payment",
      label: "Payment Status",
      value: paymentFilter,
      options: [
        { value: "all", label: "All Payments" },
        { value: "paid", label: "Paid" },
        { value: "partial", label: "Partial" },
        { value: "pending", label: "Pending" },
      ],
      onChange: (v: string) => setPaymentFilter(v as any),
    },
  ];

  return (
    <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 28 }}>
      {/* Mobile Flipkart-style Collapsible Filter Bar */}
      <div className="md:hidden bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs mb-4">
        <MobileFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search order ref, customer, saree type..."
          filterGroups={mobileFilterGroups}
          onResetAll={resetFilters}
        />
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:flex flex-col gap-4 bg-white rounded-[18px] border border-[var(--border-default)] p-5 sm:p-6 shadow-sm">
        {/* Top row: search & reset */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <SearchInput
              aria-label="Search by order ref, customer, saree type, or design"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order ref, customer, saree type, or design..."
            />
          </div>
          {(search || statusFilter !== "all" || paymentFilter !== "all") && (
            <Button
              onClick={resetFilters}
              variant="tertiary"
              size="md"
              iconLeft={RotateCcw}
            >
              Reset Filters
            </Button>
          )}
        </div>

        <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />

        {/* Timeline */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Timeline:</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>by delivery deadline</span>
          </div>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>

        <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />

        {/* Bottom row: Filter Categories */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          {/* Status Categories */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status:</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { key: "all", label: "All Statuses" },
                { key: "on-track", label: "On Track" },
                { key: "at-risk", label: "At Risk / Delayed" },
                { key: "completed", label: "Completed" }
              ].map(item => (
                <Button
                  key={item.key}
                  onClick={() => setStatusFilter(item.key as "all" | "on-track" | "at-risk" | "completed")}
                  size="sm"
                  variant={statusFilter === item.key ? "primary" : "tertiary"}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Status Categories */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Payments:</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { key: "all", label: "All Payments" },
                { key: "paid", label: "Paid" },
                { key: "partial", label: "Partial" },
                { key: "pending", label: "Pending" }
              ].map(item => (
                <Button
                  key={item.key}
                  onClick={() => setPaymentFilter(item.key as "all" | "paid" | "partial" | "pending")}
                  size="sm"
                  variant={paymentFilter === item.key ? "primary" : "tertiary"}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
