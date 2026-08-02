import React from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { DateFilterBar, DateFilterState } from "../../../../../shared/ui/DateFilterBar";
import { T, F } from "../theme";
import { Select } from "../common/primitives";

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
}) {
  return (
    <div style={{ padding: "48px 56px 0" }}>
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
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <Search
            size={16}
            color={T.taupe}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by supplier, ID, location, GST, invoice…"
            style={{
              width: "100%",
              height: 44,
              borderRadius: 12,
              border: `1.5px solid ${T.borderDef}`,
              background: T.silkCream,
              fontFamily: F.ui,
              fontSize: 14,
              paddingLeft: 44,
              paddingRight: 14,
              color: T.luxuryBrown,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "All Status", label: "All Status" },
            { key: "Paid", label: "Paid" },
            { key: "Pending", label: "Pending" },
            { key: "Partial", label: "Partial" },
          ].map(f => (
            <motion.button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              whileHover={{ scale: 1.03 }}
              style={{
                fontFamily: F.ui,
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 18px",
                borderRadius: 99,
                cursor: "pointer",
                background: statusFilter === f.key ? T.royalBurgundy : "transparent",
                color: statusFilter === f.key ? "#FFFDF9" : T.taupe,
                border: statusFilter === f.key ? "none" : `1.5px solid rgba(110,15,45,0.18)`,
                transition: "all 0.18s"
              }}
            >
              {f.label}
            </motion.button>
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
          <button onClick={clearFilters}
            style={{
              height: 44, padding: "0 14px", background: "transparent", color: T.royalBurgundy,
              border: `1.5px solid ${T.borderDef}`, borderRadius: 12, fontFamily: F.ui,
              fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: "auto"
            }}>
            Clear filters
          </button>
        )}
      </div>

      <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
    </div>
  );
}
