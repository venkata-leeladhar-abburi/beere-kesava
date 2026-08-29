import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  useSuppliers, SareeTag, Purchase,
  totalPieces, parseINR,
} from "@/features/suppliers";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";

import { T } from "./externalPurchases/theme";
import { FormState } from "./externalPurchases/types";
import { EMPTY_FORM } from "./externalPurchases/data";
import { PageHeader } from "./externalPurchases/sections/PageHeader";
import { SummaryCards } from "./externalPurchases/sections/SummaryCards";
import { FilterBar } from "./externalPurchases/sections/FilterBar";
import { PurchasesTable } from "./externalPurchases/sections/PurchasesTable";
import { DetailDrawer } from "./externalPurchases/sections/DetailDrawer";
import { PurchaseFormModal } from "./externalPurchases/modals/purchaseForm/PurchaseFormModal";
import { SareeListModal } from "./externalPurchases/modals/SareeListModal";
import { useConfirm } from "../../../shared/ui/overlay";
import { formatMoney, paise } from "@/lib/domain/money";

// Re-exported so existing imports of `PurchaseFormModal` / `FormState` / `EMPTY_FORM`
// from this file (e.g. SuppliersPage) keep working unchanged.
export { PurchaseFormModal };
export { EMPTY_FORM };
export type { FormState };

/**
 * Composition root for the External Purchases feature.
 * Originally a single 2,108-line file — split into theme/types/data/utils +
 * common primitives + modals/ (with a modals/purchaseForm/ sub-split for the
 * largest modal) + sections/, all under the externalPurchases/ subfolder to
 * avoid colliding with the sibling InventoryPage's own already-split
 * theme.ts/types.ts/etc in this same directory. See git history for the
 * pre-split version if you need to trace exactly what moved where.
 */
export function ExternalPurchasesPage() {
  // Purchases live in the shared supplier context so the Suppliers page sees the
  // same inventory, spend and payment history that gets entered here.
  const { purchases, payments, addPurchase, updatePurchase, deletePurchase, getPurchaseDetail, isLoading, isError, refetch } = useSuppliers();
  // getPurchaseDetail is redefined every SupplierProvider render, so it can't
  // sit in a dependency array without re-firing this effect on every render —
  // a ref sidesteps that without missing a real formModal change.
  const getPurchaseDetailRef = useRef(getPurchaseDetail);
  getPurchaseDetailRef.current = getPurchaseDetail;
  const confirm = useConfirm();
  const [detailRow, setDetailRow] = useState<Purchase | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const [formModal, setFormModal] = useState<{ mode: "add" | "edit" | "request" | "request"; editId?: string } | null>(null);
  const [sareeListPurchase, setSareeListPurchase] = useState<Purchase | null>(null);
  // Saree photos (imageUrl/pieceImageUrls) aren't in the list's "summary"
  // view — fetch the full purchase on demand once a user actually opens its
  // detail drawer, saree list, or edit form.
  const [editingFull, setEditingFull] = useState<Purchase | null>(null);

  const openDetail = (row: Purchase) => {
    setDetailRow(row);
    getPurchaseDetail(row.id)
      .then((full) => setDetailRow((prev) => (prev && prev.id === row.id ? full : prev)))
      .catch(() => { /* keep the summary row on failure */ });
  };

  const openSareeList = (row: Purchase) => {
    setSareeListPurchase(row);
    getPurchaseDetail(row.id)
      .then((full) => setSareeListPurchase((prev) => (prev && prev.id === row.id ? full : prev)))
      .catch(() => { /* keep the summary row on failure */ });
  };

  useEffect(() => {
    if (formModal?.mode !== "edit" || !formModal.editId) {
      setEditingFull(null);
      return;
    }
    let cancelled = false;
    setEditingFull(null);
    getPurchaseDetailRef.current(formModal.editId)
      .then((full) => { if (!cancelled) setEditingFull(full); })
      .catch(() => { /* falls back to the summary row below */ });
    return () => { cancelled = true; };
  }, [formModal]);

  const [fSupplier, setFSupplier] = useState("All Suppliers");
  const [fPurchaseOrder, setFPurchaseOrder] = useState("All Purchase Orders");
  const [fSerial, setFSerial] = useState("All Serial No.s");
  const [fType, setFType] = useState("All Saree Types");
  const [fColor, setFColor] = useState("All Colours");

  const opts = useMemo(() => {
    const s = new Set<string>();
    const po = new Set<string>();
    const types = new Set<string>();
    const colors = new Set<string>();
    purchases.forEach(p => {
      if (p.supplier) s.add(p.supplier);
      if (p.id) po.add(p.id);
      p.sarees.forEach(saree => {
        if (saree.sareeType) types.add(saree.sareeType);
        if (saree.color) colors.add(saree.color);
      });
    });
    return {
      supplier: ["All Suppliers", ...Array.from(s).sort()],
      po: ["All Purchase Orders", ...Array.from(po).sort()],
      type: ["All Saree Types", ...Array.from(types).sort()],
      color: ["All Colours", ...Array.from(colors).sort()],
    };
  }, [purchases]);

  const poSerialOpts = useMemo(() => {
    if (fPurchaseOrder === "All Purchase Orders") return ["All Serial No.s"];
    const p = purchases.find(x => x.id === fPurchaseOrder);
    if (!p) return ["All Serial No.s"];
    const s = new Set<string>();
    p.sarees.forEach(x => {
      const serial = x.id.match(/^[A-Za-z]+-(\d{3,4})-/)?.[1];
      if (serial) s.add(serial);
    });
    return ["All Serial No.s", ...Array.from(s).sort()];
  }, [purchases, fPurchaseOrder]);

  // How much has actually been paid against each purchase. The stored status
  // is recomputed server-side when a payment is linked to a purchase, but
  // deriving it here as well keeps the pill, the filter and the amounts in
  // agreement even for rows recorded before that recompute existed.
  const paidByPurchase = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach(pay => {
      if (!pay.purchaseId) return;
      map.set(pay.purchaseId, (map.get(pay.purchaseId) ?? 0) + pay.amount);
    });
    return map;
  }, [payments]);

  const paidFor = useCallback((p: Purchase) => paidByPurchase.get(p.id) ?? 0, [paidByPurchase]);
  const statusOf = useCallback((p: Purchase): Purchase["status"] => {
    const bill = parseINR(p.billAmount);
    const paid = paidFor(p);
    if (bill > 0 && paid >= bill) return "Paid";
    if (paid > 0) return "Partial";
    return p.status === "Paid" && paid === 0 ? "Paid" : p.status;
  }, [paidFor]);

  const matchesExceptStatus = (p: Purchase) => {
    const matchSearch =
      search === "" ||
      p.supplier.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.gstNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchDate = matchesDateFilter(p.date, dateFilter);
    const matchSupplier = fSupplier === "All Suppliers" || p.supplier === fSupplier;
    const matchPO = fPurchaseOrder === "All Purchase Orders" || p.id === fPurchaseOrder;
    const matchType = fType === "All Saree Types" || p.sarees.some(s => s.sareeType === fType);
    const matchColor = fColor === "All Colours" || p.sarees.some(s => s.color === fColor);
    const matchSerial = fSerial === "All Serial No.s" || p.sarees.some(s => {
      const serial = s.id.match(/^[A-Za-z]+-(\d{3,4})-/)?.[1];
      return serial === fSerial;
    });

    return matchSearch && matchDate && matchSupplier && matchPO && matchType && matchColor && matchSerial;
  };

  // Counts shown on the status pills — everything the other filters allow,
  // grouped by payment status, so a pill that would show nothing says so
  // before it is clicked.
  const statusCounts = useMemo(() => {
    const counts = { "All Status": 0, Paid: 0, Pending: 0, Partial: 0 } as Record<string, number>;
    purchases.filter(matchesExceptStatus).forEach(p => {
      counts["All Status"] += 1;
      counts[statusOf(p)] += 1;
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchases, statusOf, search, dateFilter, fSupplier, fPurchaseOrder, fType, fColor, fSerial]);

  const filtered = purchases.filter(
    p => matchesExceptStatus(p) && (statusFilter === "All Status" || statusOf(p) === statusFilter),
  );

  const filtersActive = search !== "" || statusFilter !== "All Status" || dateFilter.mode !== "all"
    || fSupplier !== "All Suppliers" || fPurchaseOrder !== "All Purchase Orders"
    || fSerial !== "All Serial No.s" || fType !== "All Saree Types" || fColor !== "All Colours";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All Status");
    setDateFilter(DEFAULT_DATE_FILTER);
    setFSupplier("All Suppliers");
    setFPurchaseOrder("All Purchase Orders");
    setFSerial("All Serial No.s");
    setFType("All Saree Types");
    setFColor("All Colours");
  };

  const handleAddSubmit = (form: FormState, sarees: SareeTag[]) => {
    addPurchase({
      supplierId: form.supplierId || undefined,
      supplier: form.supplier,
      location: form.location,
      date: form.date || "—",
      sareeCount: totalPieces(sarees),
      gstNumber: form.gstNumber,
      invoiceNumber: form.invoiceNumber,
      billAmount: form.billAmount || formatMoney(paise(0)),
      status: form.status,
      notes: form.notes,
      addedBy: "Admin",
      invoiceFileName: form.invoiceFileName || undefined,
      invoiceFileUrl: form.invoiceFileUrl || undefined,
      sarees,
    });
    setFormModal(null);
  };

  const handleEditSubmit = (id: string, form: FormState, sarees: SareeTag[]) => {
    updatePurchase(id, {
      supplierId: form.supplierId || undefined,
      supplier: form.supplier,
      location: form.location,
      date: form.date || undefined,
      sareeCount: totalPieces(sarees),
      gstNumber: form.gstNumber,
      invoiceNumber: form.invoiceNumber,
      billAmount: form.billAmount,
      status: form.status,
      notes: form.notes,
      invoiceFileName: form.invoiceFileName || undefined,
      invoiceFileUrl: form.invoiceFileUrl || undefined,
      sarees,
    });
    setFormModal(null);
    setDetailRow((d) => (d && d.id === id ? null : d));
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: `Delete purchase ${id}?`,
      description: "This permanently removes the purchase and cannot be undone. Type the purchase ID to confirm.",
      typeToConfirm: id,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    deletePurchase(id);
    setDetailRow((d) => (d && d.id === id ? null : d));
  };

  const editingPurchase = formModal?.mode === "edit"
    ? editingFull ?? purchases.find((p) => p.id === formModal.editId)
    : null;
  const editingFormInitial: FormState | null = editingPurchase
    ? {
        supplierId: editingPurchase.supplierId || "",
        supplier: editingPurchase.supplier,
        location: editingPurchase.location,
        date: editingPurchase.date,
        gstNumber: editingPurchase.gstNumber,
        invoiceNumber: editingPurchase.invoiceNumber,
        billAmount: editingPurchase.billAmount,
        status: editingPurchase.status,
        notes: editingPurchase.notes,
        invoiceFileName: editingPurchase.invoiceFileName || "",
        invoiceFileUrl: editingPurchase.invoiceFileUrl || "",
      }
    : null;

  const totalSarees = purchases.reduce((s, p) => s + p.sareeCount, 0);

  return (
    <div
      style={{
        background: T.silkCream,
        minHeight: "100dvh",
        paddingBottom: 80,
      }}
    >
      <div id="ep-form"><PageHeader onAdd={() => setFormModal({ mode: "add" })} /></div>

      <div id="ep-history">
        <SummaryCards purchases={purchases} totalSarees={totalSarees} />

      <FilterBar
        search={search} setSearch={setSearch}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter} statusCounts={statusCounts}
        dateFilter={dateFilter} setDateFilter={setDateFilter}
        viewMode={viewMode} setViewMode={setViewMode}
        fSupplier={fSupplier} setFSupplier={setFSupplier}
        fPurchaseOrder={fPurchaseOrder} setFPurchaseOrder={setFPurchaseOrder}
        fSerial={fSerial} setFSerial={setFSerial}
        poSerialOpts={poSerialOpts}
        fType={fType} setFType={setFType}
        fColor={fColor} setFColor={setFColor}
        opts={opts}
        filtersActive={filtersActive}
        clearFilters={clearFilters}
      >
        <PurchasesTable
          filtered={filtered}
          paidFor={paidFor}
          statusOf={statusOf}
          totalCount={purchases.length}
          viewMode={viewMode}
          hoveredRow={hoveredRow}
          setHoveredRow={setHoveredRow}
          onView={openDetail}
          onViewSarees={openSareeList}
          onEdit={(id) => setFormModal({ mode: "edit", editId: id })}
          onDelete={handleDelete}
          loading={isLoading}
          loadError={isError}
          onRetry={refetch}
          onClearFilters={clearFilters}
        />
        </FilterBar>
      </div>

      <DetailDrawer
        detailRow={detailRow}
        onClose={() => setDetailRow(null)}
        onEdit={(id) => setFormModal({ mode: "edit", editId: id })}
        onViewSarees={openSareeList}
      />

      {/* ADD / EDIT FORM MODAL */}
      {formModal && formModal.mode === "add" && (
        <PurchaseFormModal
          mode="add"
          initial={EMPTY_FORM}
          initialSarees={[]}
          onClose={() => setFormModal(null)}
          onSubmit={handleAddSubmit}
        />
      )}
      {formModal && formModal.mode === "edit" && editingFormInitial && editingPurchase && (
        <PurchaseFormModal
          mode="edit"
          initial={editingFormInitial}
          initialSarees={editingPurchase.sarees}
          onClose={() => setFormModal(null)}
          onSubmit={(data, sarees) => handleEditSubmit(formModal.editId!, data, sarees)}
        />
      )}

      {/* SAREE BARCODE LIST MODAL */}
      {sareeListPurchase && (
        <SareeListModal
          purchase={sareeListPurchase}
          onClose={() => setSareeListPurchase(null)}
        />
      )}
    </div>
  );
}
