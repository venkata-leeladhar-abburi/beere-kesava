import React from "react";
import { motion } from "motion/react";
import { Search, Download, RefreshCw, X } from "lucide-react";
import { F, T } from "./tokens";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";

export function LiveFilterBar({
  search, setSearch,
  roleFilter, setRoleFilter,
  moduleFilter, setModuleFilter,
  actionFilter, setActionFilter,
  periodFilter, setPeriodFilter,
  resultsLabel,
}: {
  search: string; setSearch: (v: string) => void;
  roleFilter: string; setRoleFilter: (v: string) => void;
  moduleFilter: string; setModuleFilter: (v: string) => void;
  actionFilter: string; setActionFilter: (v: string) => void;
  periodFilter: string; setPeriodFilter: (v: string) => void;
  resultsLabel?: string;
}) {
  return (
    <>
      {/* ── 3. LIVE UPDATE INDICATOR STRIP ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-5 sm:py-3 mb-6 bg-[rgba(30,102,64,0.08)] border border-[rgba(30,102,64,0.20)] rounded-xl">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.div
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ type: "tween", duration: 1.5, repeat: Infinity }}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: T.green,
              flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: T.luxuryBrown }}>
            Live — New entries appear automatically as actions happen across the system.
          </span>
        </div>
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
            Last refreshed: just now
          </span>
          <Button variant="secondary" size="sm" iconLeft={RefreshCw}>
            Refresh Now
          </Button>
        </div>
      </div>

      {/* ── 4. SEARCH AND FILTER BAR ── */}
      <div className="p-3.5 sm:p-5 md:p-6 mb-6" style={{
        background: "#fff",
        borderRadius: 14,
        border: `1px solid ${T.borderDef}`,
        boxShadow: "0 2px 12px rgba(44,24,16,0.06)",
      }}>
        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.luxuryBrown }}>
            Search &amp; Filter Audit Log
          </span>
          <Button variant="secondary" size="sm" iconLeft={Download} className="text-[#C89B47] border-[#C89B47]">
            Export
          </Button>
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr]" style={{
          gap: 12,
          marginBottom: 14,
        }}>
          {/* Search */}
          <SearchInput
            aria-label="Search actions, users, records..."
            placeholder="Search actions, users, records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {/* Role */}
          <Select value={roleFilter} onValueChange={setRoleFilter} placeholder="All Roles">
            <SelectItem value="All Roles">All Roles</SelectItem>
            <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="WORKER STAFF">WORKER STAFF</SelectItem>
            <SelectItem value="FINISHING STAFF">FINISHING STAFF</SelectItem>
            <SelectItem value="SHOP STAFF">SHOP STAFF</SelectItem>
          </Select>
          {/* Module */}
          <Select value={moduleFilter} onValueChange={setModuleFilter} placeholder="All Modules">
            <SelectItem value="All Modules">All Modules</SelectItem>
            <SelectItem value="MATERIALS">MATERIALS</SelectItem>
            <SelectItem value="WEAVERS">WEAVERS</SelectItem>
            <SelectItem value="RATES">RATES</SelectItem>
            <SelectItem value="RATE_REQUESTS">RATE REQUESTS</SelectItem>
            <SelectItem value="SALES">SALES</SelectItem>
            <SelectItem value="BATCHES">BATCHES</SelectItem>
            <SelectItem value="APPROVALS">APPROVALS</SelectItem>
            <SelectItem value="PURCHASE">PURCHASE</SelectItem>
            <SelectItem value="PURCHASE_REQUESTS">PURCHASE REQUESTS</SelectItem>
            <SelectItem value="CUSTOMERS">CUSTOMERS</SelectItem>
            <SelectItem value="VENDORS">VENDORS</SelectItem>
            <SelectItem value="SUPPLIERS">SUPPLIERS</SelectItem>
            <SelectItem value="SUPPLIER_RETURNS">SUPPLIER RETURNS</SelectItem>
            <SelectItem value="PAYMENTS">PAYMENTS</SelectItem>
            <SelectItem value="DISPATCH">DISPATCH</SelectItem>
            <SelectItem value="FINISHING">FINISHING</SelectItem>
            <SelectItem value="QC">QC</SelectItem>
            <SelectItem value="BULK_ORDERS">BULK ORDERS</SelectItem>
            <SelectItem value="WARP_REQUESTS">WARP REQUESTS</SelectItem>
            <SelectItem value="REPORTS">REPORTS</SelectItem>
          </Select>
          {/* Action */}
          <Select value={actionFilter} onValueChange={setActionFilter} placeholder="All Actions">
            <SelectItem value="All Actions">All Actions</SelectItem>
            <SelectItem value="Create">Create</SelectItem>
            <SelectItem value="Update">Update</SelectItem>
            <SelectItem value="Approve">Approve</SelectItem>
            <SelectItem value="Issue">Issue</SelectItem>
            <SelectItem value="Dispatch">Dispatch</SelectItem>
            <SelectItem value="Sale">Sale</SelectItem>
          </Select>
        </div>

        {/* Date + period row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Period pills */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {["Today", "This Week", "This Month", "Last 3 Months", "All Time"].map(p => (
              <Button
                key={p}
                variant={periodFilter === p ? "primary" : "secondary"}
                size="sm"
                className="rounded-[10px] text-xs px-2.5 sm:px-3"
                onClick={() => setPeriodFilter(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          {/* Apply / Clear */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <Button variant="primary" size="sm" iconLeft={Search} className="rounded-[10px] text-xs">
              Apply Filters
            </Button>
            <Button variant="ghost" size="sm" iconLeft={X} className="text-xs">
              Clear
            </Button>
          </div>
        </div>

        {/* Results label */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, marginTop: 10 }}>
          {resultsLabel ?? "Filters apply to the action log below."}
        </div>
      </div>
    </>
  );
}
