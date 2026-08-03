import React from "react";
import { motion } from "motion/react";
import { Search, RotateCcw } from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../shared/ui/DateFilterBar";

const T = {
  silkCream: "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  deepWine: "#4A061B",
  luxuryBrown: "#3B2314",
  taupe: "#8B7060",
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
  return (
    <div style={{ padding: "28px 48px 0" }}>
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, padding: "22px 24px", boxShadow: "0 4px 18px rgba(74,6,27,0.03)", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Top row: search & reset */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
            <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by order ref, customer, saree type, or design..."
              style={{ width: "100%", height: 42, paddingLeft: 42, paddingRight: 16, fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, background: "#FFFDF9", border: `1.5px solid ${T.borderDef}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          {(search || statusFilter !== "all" || paymentFilter !== "all") && (
            <motion.button 
              onClick={resetFilters}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ display: "flex", alignItems: "center", gap: 6, height: 42, padding: "0 16px", background: "rgba(110,15,45,0.05)", color: T.royalBurgundy, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <RotateCcw size={14} /> Reset Filters
            </motion.button>
          )}
        </div>

        <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />

        {/* Timeline */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Timeline:</span>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>by delivery deadline</span>
          </div>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>

        <div style={{ height: 1, background: "rgba(110,15,45,0.06)" }} />

        {/* Bottom row: Filter Categories */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          {/* Status Categories */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status:</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { key: "all", label: "All Statuses" },
                { key: "on-track", label: "On Track" },
                { key: "at-risk", label: "At Risk / Delayed" },
                { key: "completed", label: "Completed" }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setStatusFilter(item.key as any)}
                  style={{
                    fontFamily: F.ui, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                    background: statusFilter === item.key ? T.royalBurgundy : "transparent",
                    color: statusFilter === item.key ? "#FFFDF9" : T.taupe,
                    border: statusFilter === item.key ? "none" : `1.5px solid rgba(110,15,45,0.14)`,
                    transition: "all 0.15s"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Status Categories */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.5px" }}>Payments:</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { key: "all", label: "All Payments" },
                { key: "paid", label: "Paid" },
                { key: "partial", label: "Partial" },
                { key: "pending", label: "Pending" }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setPaymentFilter(item.key as any)}
                  style={{
                    fontFamily: F.ui, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                    background: paymentFilter === item.key ? T.royalBurgundy : "transparent",
                    color: paymentFilter === item.key ? "#FFFDF9" : T.taupe,
                    border: paymentFilter === item.key ? "none" : `1.5px solid rgba(110,15,45,0.14)`,
                    transition: "all 0.15s"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
