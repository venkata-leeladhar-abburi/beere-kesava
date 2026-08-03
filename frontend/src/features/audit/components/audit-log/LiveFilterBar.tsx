import React from "react";
import { motion } from "motion/react";
import { Search, Download, RefreshCw, X } from "lucide-react";
import { F, T } from "./tokens";

export function LiveFilterBar({
  search, setSearch,
  roleFilter, setRoleFilter,
  moduleFilter, setModuleFilter,
  actionFilter, setActionFilter,
  periodFilter, setPeriodFilter,
}: {
  search: string; setSearch: (v: string) => void;
  roleFilter: string; setRoleFilter: (v: string) => void;
  moduleFilter: string; setModuleFilter: (v: string) => void;
  actionFilter: string; setActionFilter: (v: string) => void;
  periodFilter: string; setPeriodFilter: (v: string) => void;
}) {
  return (
    <>
      {/* ── 3. LIVE UPDATE INDICATOR STRIP ── */}
      <div style={{
        background: "rgba(30,102,64,0.08)",
        border: "1px solid rgba(30,102,64,0.20)",
        borderRadius: 10,
        padding: "12px 20px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
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
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>
            Last refreshed: just now
          </span>
          <button style={{
            border: `1px solid ${T.borderDef}`,
            borderRadius: 8,
            padding: "6px 12px",
            background: "transparent",
            fontFamily: F.ui,
            fontSize: 12,
            color: T.luxuryBrown,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <RefreshCw size={13} />
            Refresh Now
          </button>
        </div>
      </div>

      {/* ── 4. SEARCH AND FILTER BAR ── */}
      <div style={{
        background: "#fff",
        borderRadius: 14,
        border: `1px solid ${T.borderDef}`,
        boxShadow: "0 2px 12px rgba(44,24,16,0.06)",
        padding: "18px 22px",
        marginBottom: 24,
      }}>
        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.luxuryBrown }}>
            Search &amp; Filter Audit Log
          </span>
          <button style={{
            border: `1px solid ${T.antiqueGold}`,
            borderRadius: 8,
            padding: "7px 14px",
            background: "transparent",
            color: T.antiqueGold,
            fontFamily: F.ui,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <Download size={14} />
            Export
          </button>
        </div>

        {/* Filter row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 12,
          marginBottom: 14,
        }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Search size={14} color={T.taupe} />
            </div>
            <input aria-label="Search actions, users, records..."
              type="text"
              placeholder="Search actions, users, records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                paddingLeft: 36,
                paddingRight: 12,
                background: "#FFF8F0",
                border: `1px solid ${T.borderDef}`,
                borderRadius: 10,
                fontFamily: F.ui,
                fontSize: 13,
                color: T.luxuryBrown,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          {/* Role */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{
              height: 40,
              borderRadius: 10,
              background: "#FFF8F0",
              border: `1px solid ${T.borderDef}`,
              fontFamily: F.ui,
              fontSize: 13,
              color: T.luxuryBrown,
              padding: "0 12px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option>All Roles</option>
            <option>SUPERADMIN</option>
            <option>ADMIN</option>
            <option>WORKER STAFF</option>
            <option>FINISHING STAFF</option>
            <option>SHOP STAFF</option>
          </select>
          {/* Module */}
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            style={{
              height: 40,
              borderRadius: 10,
              background: "#FFF8F0",
              border: `1px solid ${T.borderDef}`,
              fontFamily: F.ui,
              fontSize: 13,
              color: T.luxuryBrown,
              padding: "0 12px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option>All Modules</option>
            <option>MATERIALS</option>
            <option>WEAVERS</option>
            <option>RATES</option>
            <option>SALES</option>
            <option>PRODUCTION</option>
            <option>APPROVALS</option>
            <option>CUSTOMERS</option>
          </select>
          {/* Action */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            style={{
              height: 40,
              borderRadius: 10,
              background: "#FFF8F0",
              border: `1px solid ${T.borderDef}`,
              fontFamily: F.ui,
              fontSize: 13,
              color: T.luxuryBrown,
              padding: "0 12px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option>All Actions</option>
            <option>Create</option>
            <option>Update</option>
            <option>Approve</option>
            <option>Issue</option>
            <option>Dispatch</option>
            <option>Sale</option>
          </select>
        </div>

        {/* Date + period row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Period pills */}
          <div style={{ display: "flex", gap: 6 }}>
            {["Today", "This Week", "This Month", "Last 3 Months", "All Time"].map(p => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                style={{
                  borderRadius: 999,
                  padding: "5px 14px",
                  fontFamily: F.ui,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: periodFilter === p ? "none" : `1px solid ${T.borderDef}`,
                  background: periodFilter === p ? T.royalBurgundy : "transparent",
                  color: periodFilter === p ? "#fff" : T.luxuryBrown,
                  transition: "all 0.15s",
                }}
              >
                {p}
              </button>
            ))}
          </div>
          {/* Apply / Clear */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={{
              borderRadius: 999,
              padding: "8px 18px",
              background: T.royalBurgundy,
              color: "#fff",
              border: "none",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Search size={13} />
              Apply Filters
            </button>
            <button style={{
              background: "none",
              border: "none",
              fontFamily: F.ui,
              fontSize: 12,
              color: T.taupe,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <X size={13} />
              Clear
            </button>
          </div>
        </div>

        {/* Results label */}
        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 10 }}>
          Showing 48 entries for today · 2,840 total in system
        </div>
      </div>
    </>
  );
}
