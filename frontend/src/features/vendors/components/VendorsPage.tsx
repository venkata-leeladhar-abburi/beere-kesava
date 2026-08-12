import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { T } from "./vendors-page/theme";
import { Vendor } from "./vendors-page/types";
import { MaterialsFooter } from "../../materials/components/sections/MaterialsFooter";
import { VendorsHeroStats } from "./vendors-page/VendorsHeroStats";
import { AddVendorModal } from "./vendors-page/AddVendorModal";
import { VendorAnalyticsSection } from "./vendors-page/VendorAnalyticsSection";
import { VendorDirectorySection } from "./vendors-page/VendorDirectorySection";
import { VendorProfile } from "./vendors-page/VendorProfile";
import { BackendVendor, vendorsApi } from "../../../shared/api/vendors";
import { ApiError } from "../../../shared/api/client";

// totalOrders/totalSpend/outstanding/lastOrder have no backend column yet
// (would need a PurchaseOrder aggregation query) — left at placeholder
// values until that's built, same call as Customers' derived stats.
function toVendor(v: BackendVendor): Vendor {
  return {
    id: v.id,
    name: v.name,
    initials: v.initials ?? v.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase(),
    contactName: v.contactName ?? "",
    phone: v.phone ?? "",
    whatsapp: v.whatsapp ?? undefined,
    city: v.city ?? "",
    state: v.state ?? "",
    address: v.address ?? "",
    gstCode: v.gstCode ?? "",
    type: v.specialty ?? "",
    terms: v.terms ?? "",
    bankName: v.bankName ?? undefined,
    accountNo: v.accountNo ?? undefined,
    status: v.status === "ACTIVE" ? "active" : v.status === "INACTIVE" ? "inactive" : "overdue",
    totalOrders: 0,
    totalSpend: "0",
    outstanding: "0",
    lastOrder: "—",
    rating: v.rating ?? 0,
  };
}

export function VendorsPage() {
  const location = useLocation();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  // Command palette "New Vendor" action deep-links here with ?new=1 to open
  // the add-vendor form straight away.
  const [showAddForm, setShowAddForm] = useState(() => new URLSearchParams(location.search).get("new") === "1");

  useEffect(() => {
    vendorsApi.list().then(res => setVendors(res.items.map(toVendor))).catch(() => setVendors([]));
  }, []);

  const nextId = `VEN-${String(vendors.length + 1).padStart(3, "0")}`;

  const handleSave = async (v: Vendor) => {
    const created = await vendorsApi.create({
      name: v.name, contactName: v.contactName, phone: v.phone, whatsapp: v.whatsapp,
      city: v.city, state: v.state, address: v.address, gstCode: v.gstCode,
      specialty: v.type, terms: v.terms, bankName: v.bankName, accountNo: v.accountNo,
      rating: v.rating,
    });
    setVendors(p => [toVendor(created), ...p]);
    setShowAddForm(false);
  };

  const handleUpdate = async (v: Vendor) => {
    const updated = await vendorsApi.update(v.id, {
      name: v.name, contactName: v.contactName, phone: v.phone, whatsapp: v.whatsapp,
      city: v.city, state: v.state, address: v.address, gstCode: v.gstCode,
      specialty: v.type, terms: v.terms, bankName: v.bankName, accountNo: v.accountNo,
      rating: v.rating, status: v.status.toUpperCase(),
    });
    const merged = { ...toVendor(updated), totalOrders: v.totalOrders, totalSpend: v.totalSpend, outstanding: v.outstanding, lastOrder: v.lastOrder };
    setVendors(prev => prev.map(old => old.id === merged.id ? merged : old));
    setSelectedVendor(merged);
  };

  const handleDelete = async (v: Vendor) => {
    try {
      await vendorsApi.remove(v.id);
      setVendors(prev => prev.filter(x => x.id !== v.id));
      setSelectedVendor(null);
      toast.success("Vendor deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete vendor");
    }
  };
  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", paddingBottom: 0 }}>
      {selectedVendor ? (
        <VendorProfile vendor={selectedVendor} onBack={() => setSelectedVendor(null)} onUpdate={v => { void handleUpdate(v); }} onDelete={v => { void handleDelete(v); }} />
      ) : (
        <>
          <VendorsHeroStats vendors={vendors} onAddClick={() => setShowAddForm(true)} />

          <AnimatePresence>
            {showAddForm && (
              <AddVendorModal
                nextId={nextId}
                onCancel={() => setShowAddForm(false)}
                onSave={v => { void handleSave(v); }}
              />
            )}
          </AnimatePresence>

          <VendorAnalyticsSection vendors={vendors} />

          <VendorDirectorySection
            vendors={vendors}
            onSelectVendor={setSelectedVendor}
            onAddClick={() => setShowAddForm(v => !v)}
          />
        </>
      )}
      <MaterialsFooter />
    </div>
  );
}
