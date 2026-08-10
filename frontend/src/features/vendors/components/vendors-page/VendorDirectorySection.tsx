import React, { useState } from "react";
import { motion } from "motion/react";
import { Building2 } from "lucide-react";
import { T, F } from "./theme";
import { Vendor } from "./types";
import { MATERIAL_TYPES } from "./data";
import { FadeUp } from "./FadeUp";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { VendorCard, type VendorCardProps } from "@/shared/ui/domain";
import { rupees } from "@/lib/domain/money";

// Vendor.status (types.ts) is the overloaded-field pattern the design
// system audit calls out (design-system/06-DOMAIN.md Part A.3/D.1): it
// mixes a person lifecycle state ("active"/"inactive") with a payment
// concept ("overdue"). Split it into the shared card's two typed slots
// instead of growing PersonStatus with a payment value.
const VENDOR_STATUS: Record<Vendor["status"], Pick<VendorCardProps, "status" | "paymentStatus">> = {
  active: { status: "active" },
  inactive: { status: "inactive" },
  overdue: { status: "active", paymentStatus: "overdue" },
};

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

  const pag = usePagination(filtered, 25);

  return (
    <div style={{ padding: "0 56px" }}>
      <FadeUp>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 28, background: T.antiqueGold, borderRadius: 2 }} />
            <h2 style={{ fontFamily: F.display, fontSize: 24, color: T.luxuryBrown, margin: 0, fontWeight: 600 }}>Vendor Directory</h2>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
            <Button
              onClick={onAddClick}
              variant="primary"
              iconLeft="add"
              className="rounded-[10px] bg-[linear-gradient(135deg,#4A061B,#6E0F2D)] shadow-[0_4px_16px_rgba(110,15,45,0.22)]"
            >
              Add New Vendor
            </Button>
          </motion.div>
        </div>

        <div style={{ background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", boxShadow: "0 2px 10px rgba(74,6,27,0.05)" }}>
          <div style={{ flex: "1 1 280px" }}>
            <SearchInput
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by vendor name, city, or contact…"
              className="bg-[var(--bk-cream-50,#FBF4E7)]"
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["All", "Active", "Overdue", "Inactive"].map(s => (
              <Button
                key={s}
                onClick={() => setStatusFilter(s)}
                variant={statusFilter === s ? "primary" : "secondary"}
                size="sm"
                className={
                  statusFilter === s
                    ? "rounded-full bg-[#6E0F2D] border-none"
                    : "rounded-full bg-transparent text-[#9C8672] border-[1.5px] border-[rgba(110,15,45,0.18)]"
                }
              >
                {s}
              </Button>
            ))}
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            {MATERIAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </Select>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectItem value="All Ratings">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </Select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {pag.pageItems.map((v, i) => (
            <FadeUp key={v.id} delay={i * 0.06}>
              <VendorCard
                code={v.id}
                name={v.name}
                service={v.type}
                jobs={v.totalOrders}
                outstanding={rupees(Number(v.outstanding) || 0)}
                {...VENDOR_STATUS[v.status]}
                onClick={() => onSelectVendor(v)}
              />
            </FadeUp>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", background: "#FFF", borderRadius: 16, border: `1.5px solid ${T.borderDef}`, padding: "60px 24px", textAlign: "center" }}>
              <Building2 size={44} color={T.taupe} style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: F.display, fontSize: 18, color: T.taupe }}>No vendors match your search or filter.</div>
            </div>
          )}
        </div>
        <Pagination page={pag.page} pageCount={pag.pageCount} total={pag.total} pageSize={pag.pageSize} start={pag.start}
          onPageChange={pag.setPage} onPageSizeChange={pag.setPageSize} itemLabel="vendors" />
      </FadeUp>
    </div>
  );
}
