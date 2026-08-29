// Supplier directory card — summary tile with a "View Profile" action.

import React, { useState } from "react";
import { motion } from "motion/react";
import { MapPin, Phone, Package, Eye } from "lucide-react";
import { T, F } from "../theme";
import { StatusPill, StarRating } from "../common/primitives";
import { useSuppliers, Supplier } from "../../contexts/SupplierContext";
import { formatMoney, rupees } from "@/lib/domain/money";
import { Button } from "../../../../shared/ui/primitives";
import { toInitials } from "@/shared/lib/initials";

export function SupplierCard({ supplier, onView }: { supplier: Supplier; onView: (s: Supplier) => void }) {
  const { statsFor } = useSuppliers();
  const stats = statsFor(supplier.id);
  const [hov, setHov] = useState(false);

  return (
    <motion.div whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(74,6,27,0.14)" }} transition={{ duration: 0.22 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: "#FFF", borderRadius: 20, border: `1.5px solid ${hov ? "rgba(110,15,45,0.22)" : T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 2px 12px rgba(74,6,27,0.05)", transition: "border-color 0.2s" }}>
      <div style={{ height: 6, background: T.royalBurgundy }} />
      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${T.darkBurgundy},${T.royalBurgundy})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(110,15,45,0.25)" }}>
              <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 800, color: "#FFF" }}>{toInitials(supplier.initials)}</span>
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.2, marginBottom: 3 }}>{supplier.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: "rgba(110,15,45,0.08)", padding: "1px 7px", borderRadius: 4 }}>{supplier.code || supplier.id}</span>
                <StatusPill status={supplier.status} />
              </div>
            </div>
          </div>
          <StarRating rating={supplier.rating} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12, color: T.taupe }}><MapPin size={13} color={T.royalBurgundy} />{supplier.city}, {supplier.state}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12, color: T.taupe }}><Phone size={13} color={T.royalBurgundy} />{supplier.phone}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12, color: T.taupe }}><Package size={13} color={T.royalBurgundy} />{supplier.specialty}</div>
        </div>

        <div className="grid grid-cols-3" style={{ gap: 0, background: T.silkCream, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.borderDef}` }}>
          {[
            { label: "Purchases", value: String(stats.purchases.length), alert: false },
            { label: "Sarees",    value: String(stats.sareeCount), alert: false },
            { label: "Outstanding", value: formatMoney(rupees(stats.outstanding)), alert: stats.outstanding > 0 },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "8px 6px", borderRight: i < 2 ? `1px solid ${T.borderDef}` : "none", textAlign: "center" }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, fontWeight: 600, letterSpacing: "0.4px", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: s.alert ? T.crimson : T.luxuryBrown }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Terms: <strong style={{ color: T.luxuryBrown }}>{supplier.terms}</strong></span>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Last: {stats.lastPurchaseDate}</span>
        </div>

        <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 14 }}>
          <Button variant="primary" size="sm" fullWidth iconLeft={Eye} onClick={() => onView(supplier)}>
            View Profile
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
