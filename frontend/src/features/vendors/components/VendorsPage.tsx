import React, { useEffect, useMemo, useState } from "react";
import { useListDetailScroll } from "@/shared/ui/ScrollToTop";
import { useLocation } from "react-router";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { T } from "./vendors-page/theme";
import { Vendor } from "./vendors-page/types";
import { MaterialsFooter } from "@/features/materials";
import { VendorsHeroStats } from "./vendors-page/VendorsHeroStats";
import { AddVendorModal } from "./vendors-page/AddVendorModal";
import { VendorAnalyticsSection } from "./vendors-page/VendorAnalyticsSection";
import { VendorDirectorySection } from "./vendors-page/VendorDirectorySection";
import { VendorProfile } from "./vendors-page/VendorProfile";
import { BackendVendor, vendorsApi } from "../../../shared/api/vendors";
import { ApiError } from "../../../shared/api/client";
import { usePO } from "@/features/purchasing";
import { vendorBillsApi } from "../../../shared/api/vendor-bills";
import { vendorPaymentsApi } from "../../../shared/api/payments";
import { resolveAssetUrl, toStoredAssetPath } from "@/shared/api/uploads";

// totalOrders/totalSpend/outstanding/lastOrder have no backend column yet
// (would need a PurchaseOrder aggregation query) — left at placeholder
// values until that's built, same call as Customers' derived stats.
function toVendor(v: BackendVendor): Vendor {
  return {
    id: v.id,
    code: v.code ?? undefined,
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
    ifscCode: v.ifscCode ?? undefined,
    notes: v.notes ?? undefined,
    visitingCard: resolveAssetUrl(v.visitingCardUrl) ?? undefined,
    status: v.status === "ACTIVE" ? "active" : v.status === "INACTIVE" ? "inactive" : "overdue",
    totalOrders: 0,
    totalSpend: "0",
    outstanding: "0",
    lastOrder: "—",
    rating: v.rating ?? 0,
    createdAt: v.createdAt,
  };
}


function useVendorRollup() {
  const { pos } = usePO();
  const { data: billsRes } = useQuery({ queryKey: ["vendor-bills-rollup"], queryFn: () => vendorBillsApi.list() });
  const { data: paymentsRes } = useQuery({ queryKey: ["vendor-payments-rollup"], queryFn: () => vendorPaymentsApi.list() });

  return useMemo(() => {
    const bills = billsRes?.items ?? [];
    const payments = paymentsRes?.items ?? [];
    const billByPoId = new Map(bills.filter(b => b.poId).map(b => [b.poId as string, b]));
    const paidByBillId = new Map<string, number>();
    payments.forEach(p => {
      if (p.billId) paidByBillId.set(p.billId, (paidByBillId.get(p.billId) ?? 0) + Number(p.amount));
    });

    const byVendor = new Map<string, { totalOrders: number; totalSpend: number; outstanding: number; lastOrder: string }>();
    pos.forEach(po => {
      // Rejected orders never actually cost anything — exclude them from
      // spend/order-count rollups (they still surface on the vendor's own
      // order history, just not counted as real business done).
      if (po.status === "rejected") return;
      const entry = byVendor.get(po.vendorId) ?? { totalOrders: 0, totalSpend: 0, outstanding: 0, lastOrder: "" };
      entry.totalOrders += 1;
      entry.totalSpend += po.totalValue;
      const bill = billByPoId.get(po.id);
      if (bill) {
        const invoiceAmt = Number(bill.amount);
        const paidAmt = paidByBillId.get(bill.id) ?? 0;
        entry.outstanding += Math.max(0, invoiceAmt - paidAmt);
      }
      if (!entry.lastOrder || po.submittedDate > entry.lastOrder) entry.lastOrder = po.submittedDate;
      byVendor.set(po.vendorId, entry);
    });
    return byVendor;
  }, [pos, billsRes, paymentsRes]);
}

export function VendorsPage() {
  const location = useLocation();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState<unknown>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const { openDetail, backToList } = useListDetailScroll();
  // Command palette "New Vendor" action deep-links here with ?new=1 to open
  // the add-vendor form straight away.
  const [showAddForm, setShowAddForm] = useState(() => new URLSearchParams(location.search).get("new") === "1");

  const vendorRollup = useVendorRollup();

  const loadVendors = React.useCallback(() => {
    setVendorsLoading(true);
    setVendorsError(null);
    vendorsApi.list()
      .then(res => setVendors(res.items.map(toVendor)))
      .catch(err => setVendorsError(err))
      .finally(() => setVendorsLoading(false));
  }, []);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  const vendorsWithRollup = useMemo(() => vendors.map(v => {
    const r = vendorRollup.get(v.id);
    if (!r) return v;
    return {
      ...v,
      totalOrders: r.totalOrders,
      totalSpend: String(r.totalSpend),
      outstanding: String(Math.round(r.outstanding)),
      lastOrder: r.lastOrder || v.lastOrder,
    };
  }), [vendors, vendorRollup]);


  const handleSave = async (v: Vendor) => {
    try {
      await vendorsApi.create({
      name: v.name, contactName: v.contactName, phone: v.phone, whatsapp: v.whatsapp,
      city: v.city, state: v.state, address: v.address, gstCode: v.gstCode,
      specialty: v.type, terms: v.terms, bankName: v.bankName, accountNo: v.accountNo, ifscCode: v.ifscCode,
      notes: v.notes, rating: v.rating,
        visitingCardUrl: toStoredAssetPath(v.visitingCard) ?? undefined,
      });
    } catch (err) {
      // Includes the backend's duplicate-vendor conflict — surfaced here so
      // the modal stays open with the entered details instead of closing on a
      // create that never happened.
      toast.error(err instanceof ApiError ? err.message : "Failed to add vendor");
      throw err;
    }
    setShowAddForm(false);
    // Refetch rather than prepending the created row: the server list is the
    // source of truth for code/createdAt/ordering, so this is also what makes
    // a duplicate that slipped through show up as one row, not two.
    loadVendors();
    toast.success("Vendor added");
  };

  const handleUpdate = async (v: Vendor) => {
    const updated = await vendorsApi.update(v.id, {
      name: v.name, contactName: v.contactName, phone: v.phone, whatsapp: v.whatsapp,
      city: v.city, state: v.state, address: v.address, gstCode: v.gstCode,
      specialty: v.type, terms: v.terms, bankName: v.bankName, accountNo: v.accountNo, ifscCode: v.ifscCode,
      notes: v.notes, rating: v.rating, status: v.status.toUpperCase(),
      visitingCardUrl: toStoredAssetPath(v.visitingCard) ?? undefined,
    });
    const merged = { ...toVendor(updated), totalOrders: v.totalOrders, totalSpend: v.totalSpend, outstanding: v.outstanding, lastOrder: v.lastOrder };
    setVendors(prev => prev.map(old => old.id === merged.id ? merged : old));
    setSelectedVendor(merged);
  };

  const handleDelete = async (v: Vendor) => {
    try {
      await vendorsApi.remove(v.id);
      setVendors(prev => prev.filter(x => x.id !== v.id));
      backToList(() => setSelectedVendor(null));
      toast.success("Vendor deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete vendor");
    }
  };
  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", display: "flex", flexDirection: "column", paddingBottom: 0 }}>
      {selectedVendor ? (
        <VendorProfile vendor={selectedVendor} onBack={() => backToList(() => setSelectedVendor(null))} onUpdate={v => { void handleUpdate(v); }} onDelete={v => { void handleDelete(v); }} />
      ) : (
        <>
          <VendorsHeroStats vendors={vendorsWithRollup} onAddClick={() => setShowAddForm(true)} />

          <AnimatePresence>
            {showAddForm && (
              <AddVendorModal
                onCancel={() => setShowAddForm(false)}
                onSave={handleSave}
              />
            )}
          </AnimatePresence>

          <div id="vend-directory">
            <VendorDirectorySection
              vendors={vendorsWithRollup}
              onSelectVendor={v => openDetail(() => setSelectedVendor(v))}
              onAddClick={() => setShowAddForm(true)}
              loading={vendorsLoading}
              error={vendorsError}
              onRetry={loadVendors}
            />
          </div>

          <div id="vend-analytics"><VendorAnalyticsSection vendors={vendorsWithRollup} /></div>
        </>
      )}
      <div style={{ marginTop: "auto" }}>
        <MaterialsFooter />
      </div>
    </div>
  );
}
