import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, Plus, Building2 } from "lucide-react";
import { T, F } from "./theme";
import { Vendor } from "./types";
import { MATERIAL_TYPES } from "./data";
import { FadeUp } from "./FadeUp";
import { VendorCard } from "./VendorCard";

export function VendorDirectorySection({ vendors, onSelectVendor, onAddClick }: {
  vendors: Vendor[];
  onSelectVendor: (v: Vendor) => void;
  onAddClick: () => void;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    const mSearch = !q || v.name.toLowerCase().includes(q) || v.city.toLowerCase().includes(q) || v.id.toLowerCase().includes(q) || v.contactName.toLowerCase().includes(q);
    const mType = typeFilter === "All Types" || v.type.includes(typeFilter);
    const mStatus = statusFilter === "All" || v.status === statusFilter.toLowerCase();
    const vendorRating = (v as any).rating || 3;
    const mRating = ratingFilter === "All Ratings" || vendorRating === parseInt(ratingFilter, 10);
    return mSearch && mType && mStatus && mRating;
  });

  return (
    <div style={{ padding: "0 56px" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
            <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Vendor Directory</h2>
          </div>
          <motion.button onClick={onAddClick} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ padding: "10px 22px", background: `linear-gradient(135deg,${T.deepWine},${T.royalBurgundy})`, border: "none", borderRadius: 10, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(110,15,45,0.22)" }}>
            <Plus size={14} /> Add New Vendor
          </motion.button>
        </div>

        <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", boxShadow: "0 2px 10px rgba(74,6,27,0.05)" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.taupe, pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by vendor name, city, or contact…"
              style={{ width: "100%", padding: "9px 12px 9px 38px", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: T.silkCream, border: `1px solid ${T.borderDef}`, borderRadius: 10, outline: "none", boxSizing: "border-box" as const }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["All", "Active", "Overdue", "Inactive"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "8px 16px", borderRadius: 20, fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: statusFilter === s ? T.royalBurgundy : "transparent", color: statusFilter === s ? "#FFF" : T.taupe, border: statusFilter === s ? "none" : `1.5px solid rgba(110,15,45,0.18)`, transition: "all 0.15s" }}>{s}</button>
            ))}
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: "9px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: T.silkCream, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, cursor: "pointer", outline: "none" }}>
            {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={{ padding: "9px 14px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: T.silkCream, border: `1.5px solid ${T.borderDef}`, borderRadius: 10, cursor: "pointer", outline: "none" }}>
            <option value="All Ratings">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {filtered.map((v, i) => (
            <FadeUp key={v.id} delay={i * 0.06}>
              <VendorCard vendor={v} onView={onSelectVendor} />
            </FadeUp>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "60px 24px", textAlign: "center" }}>
              <Building2 size={44} color={T.taupe} style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: F.display, fontSize: 18, color: T.taupe }}>No vendors match your search or filter.</div>
            </div>
          )}
        </div>
      </FadeUp>
    </div>
  );
}
