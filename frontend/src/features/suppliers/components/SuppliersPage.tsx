import React, { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  useSuppliers, Supplier, SareeTag,
} from "../contexts/SupplierContext";
import { PurchaseFormModal, FormState as PurchaseFormState, EMPTY_FORM as EMPTY_PURCHASE_FORM } from "../../inventory/components/ExternalPurchasesPage";

import { T } from "./theme";
import { Toast } from "./common/primitives";
import { SuppliersHero } from "./sections/SuppliersHero";
import { SupplierAnalytics } from "./sections/SupplierAnalytics";
import { SupplierDirectorySection } from "./sections/SupplierDirectorySection";
import { ExternalPurchaseHistorySection } from "./sections/ExternalPurchaseHistorySection";
import { SupplierProfile } from "./sections/supplierProfile/SupplierProfile";
import { AddSupplierModal } from "./modals/AddSupplierModal";

/**
 * Composition root for the Suppliers feature (directory + analytics +
 * per-supplier profile + external purchase history). Originally a single
 * 1,715-line file — split into theme/types/data/utils + common primitives +
 * sections/ + modals/, all under this same directory. See git history for
 * the pre-split version if you need to trace exactly what moved where.
 *
 * `PurchaseFormModal` / `FormState` / `EMPTY_FORM` are imported from the
 * ExternalPurchasesPage composition root (inventory feature) since raising a
 * purchase request here reuses that exact form.
 */
export function SuppliersPage() {
  // `raiseRequest` and `requests` (below, for `pendingRequests`) are kept for
  // parity with the pre-split file — both were already unused dead code there.
  const { suppliers, statsFor, addSupplier, raiseRequest, requests, purchases, addPurchase, nextSupplierId } = useSuppliers();
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [requestFor, setRequestFor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");
  const [toast, setToast] = useState("");

  // Keep the open profile in step with edits made from the Edit Profile tab.
  const liveSelected = selected ? suppliers.find(s => s.id === selected.id) ?? null : null;

  const totals = useMemo(() => {
    let purchased = 0, paid = 0, outstanding = 0, sarees = 0;
    suppliers.forEach(s => {
      const st = statsFor(s.id);
      purchased += st.totalPurchased;
      paid += st.totalPaid;
      outstanding += st.outstanding;
      sarees += st.sareeCount;
    });
    return { purchased, paid, outstanding, sarees };
  }, [suppliers, statsFor]);

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    const mSearch = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.contactName.toLowerCase().includes(q);
    const mStatus = statusFilter === "All" || s.status === statusFilter.toLowerCase();

    let mRating = true;
    if (ratingFilter !== "All Ratings") {
      const match = ratingFilter.match(/(\d)/);
      if (match) {
        const r = parseInt(match[1]);
        mRating = Math.round(s.rating || 3) === r;
      }
    }

    return mSearch && mStatus && mRating;
  });

  const pendingRequests = requests.filter(r => r.status === "pending").length;

  // Raising a purchase request uses the exact same form as adding an external
  // purchase — supplier, invoice and per-saree detail — so it's ready to convert
  // into a real purchase the moment the superadmin approves it.
  const initialPurchaseFormFor = (supplierId: string | null): PurchaseFormState => {
    const s = suppliers.find(x => x.id === supplierId);
    return {
      ...EMPTY_PURCHASE_FORM,
      supplierId: s?.id || "",
      supplier: s?.name || "",
      location: s ? `${s.city}, ${s.state}` : "",
      date: new Date().toISOString().slice(0, 10),
      gstNumber: s?.gstCode || "",
    };
  };

  const handleRaiseRequest = (form: PurchaseFormState, sarees: SareeTag[]) => {
    addPurchase({
      supplierId: form.supplierId || undefined,
      supplier: form.supplier,
      location: form.location,
      date: form.date || "—",
      sareeCount: sarees.length,
      gstNumber: form.gstNumber,
      invoiceNumber: form.invoiceNumber,
      billAmount: form.billAmount || "₹0",
      status: form.status || "Pending",
      notes: form.notes,
      invoiceFileName: form.invoiceFileName || undefined,
      sarees,
    });
    setRequestFor(null);
    setToast(`External purchase added for ${form.supplier}`);
    setTimeout(() => setToast(""), 3200);
  };

  if (liveSelected) {
    return (
      <>
        <SupplierProfile
          supplier={liveSelected}
          onBack={() => setSelected(null)}
          onRaiseRequest={id => setRequestFor(id)}
        />
        <AnimatePresence>
          {requestFor && (
            <PurchaseFormModal
              mode="add"
              initial={initialPurchaseFormFor(requestFor)}
              initialSarees={[]}
              onClose={() => setRequestFor(null)}
              onSubmit={handleRaiseRequest}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>{toast && <Toast msg={toast} />}</AnimatePresence>
      </>
    );
  }

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", paddingBottom: 100 }}>
      <SuppliersHero
        suppliersCount={suppliers.length}
        purchases={purchases}
        totals={totals}
        onAddExternalPurchase={() => setRequestFor(suppliers[0]?.id ?? "")}
        onAddSupplier={() => setShowAdd(true)}
      />

      <SupplierAnalytics />

      <SupplierDirectorySection
        filtered={filtered}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        ratingFilter={ratingFilter}
        setRatingFilter={setRatingFilter}
        onAddSupplier={() => setShowAdd(true)}
        onViewSupplier={setSelected}
      />

      <ExternalPurchaseHistorySection purchases={purchases} />

      <AnimatePresence>
        {showAdd && (
          <AddSupplierModal
            nextId={nextSupplierId()}
            onCancel={() => setShowAdd(false)}
            onSave={(v, cardUrl) => {
              addSupplier({
                name: v.name, contactName: v.contactName, phone: v.phone, whatsapp: v.whatsapp,
                city: v.city, state: v.state, address: v.address, gstCode: v.gstCode,
                specialty: v.specialty, terms: v.terms, bankName: v.bankName, accountNo: v.accountNo,
                notes: v.notes, visitingCard: cardUrl || undefined, status: "active", rating: 3,
              });
              setShowAdd(false);
              setToast(`Supplier ${v.name} added`);
              setTimeout(() => setToast(""), 3000);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {requestFor !== null && (
          <PurchaseFormModal
            mode={"request" as "add"}
            initial={initialPurchaseFormFor(requestFor)}
            initialSarees={[]}
            onClose={() => setRequestFor(null)}
            onSubmit={handleRaiseRequest}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{toast && <Toast msg={toast} />}</AnimatePresence>
    </div>
  );
}
