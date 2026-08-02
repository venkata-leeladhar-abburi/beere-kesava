// Directory grid — search/filter controls plus the card grid of all suppliers.

import React from "react";
import { motion } from "motion/react";
import { Search, Plus, Building2 } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp } from "../common/primitives";
import { SupplierCard } from "./SupplierCard";
import { Supplier } from "../../contexts/SupplierContext";

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
            <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Supplier Directory</h2>
          </div>
          <motion.button onClick={onAddSupplier} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ padding: "10px 22px", background: `linear-gradient(135deg,${T.deepWine},${T.royalBurgundy})`, border: "none", borderRadius: 10, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(110,15,45,0.22)" }}>
            <Plus size={14} /> Add New Supplier
          </motion.button>
        </div>

        <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", boxShadow: "0 2px 10px rgba(74,6,27,0.05)" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.taupe, pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by supplier name, city, or contact…"
              style={{ width: "100%", padding: "9px 12px 9px 38px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["All", "Active", "Overdue", "Inactive"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: "8px 16px", borderRadius: 20, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: statusFilter === s ? T.royalBurgundy : "transparent", color: statusFilter === s ? "#FFF" : T.taupe, border: statusFilter === s ? "none" : `1.5px solid rgba(110,15,45,0.18)`, transition: "all 0.15s" }}>{s}</button>
            ))}
          </div>
          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
            style={{ padding: "9px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: T.silkCream, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, cursor: "pointer", outline: "none" }}>
            {["All Ratings", "5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
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
