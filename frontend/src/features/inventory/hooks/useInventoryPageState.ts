import { useState, useMemo, useCallback } from "react";
import { useFinishing, FinishingReturn, DispatchRecord, Quotation } from "@/features/finishing";
import { useDesignLibrary } from "@/features/design-library";
import { useBulkOrders } from "@/features/bulk-orders";
import { useBatches } from "@/features/production";
import { useFirms } from "@/features/firms";
import { useRatesPricing } from "@/features/pricing";
import { useCustomers } from "@/features/customers";
import { TransportData, InvoiceData, InventoryRecord } from "../components/types";
import { rowToDispatchSaree } from "../components/modals/shared/SareePicker";
import { toastMessageForError } from "@/shared/ui/state";
import { WeaverSareeRow, isSareePickable } from "@/features/weavers";

export function useInventoryPageState() {
  const { returns, dispatches, dispatchSarees, updateDispatch, deleteDispatch, readySarees, raiseQuotation, quotations, markQuotationDispatched } = useFinishing();
  const { getDesign } = useDesignLibrary();
  const { bulkOrders, markDispatched } = useBulkOrders();
  const { batches } = useBatches();
  const { firms } = useFirms();
  const { wholesaleCustomers = [] } = useCustomers() || {};

  // ── Clickable code modals ───────────────────────────────────────────────────
  const [openDesignCode, setOpenDesignCode] = useState<string | null>(null);
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);
  const { getSareeTypeByCode } = useRatesPricing();
  const openDesign = openDesignCode ? getDesign(openDesignCode) : undefined;
  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;

  // ── Selection States ────────────────────────────────────────────────────────
  const [selected, setSelected]               = useState<Set<string>>(new Set());
  const [mirroredRows, setMirroredRows]       = useState<WeaverSareeRow[]>([]);
  // The table only ever reports the rows its current tab + filters show, but a
  // selection outlives a tab switch — so every row that has been on screen is
  // remembered here, keyed by saree id. Without this, ticking two sarees on
  // "Assigned" and then changing tab emptied the dispatch modals of the very
  // sarees the action bar still counted as selected.
  const [seenRows, setSeenRows]               = useState<Map<string, WeaverSareeRow>>(new Map());
  const [viewingItem, setViewingItem]         = useState<InventoryRecord | null>(null);
  const [modal,    setModal]                  = useState<"shop" | "wholesale" | "quotation" | null>(null);
  const [toast,    setToast]                  = useState("");
  const [scanMsg,  setScanMsg]                = useState("");
  const [quotationDispatch, setQuotationDispatch] = useState<Quotation | null>(null);
  const [resumeDispatch, setResumeDispatch]   = useState<DispatchRecord | null>(null);
  const [viewingInvoice, setViewingInvoice]   = useState<DispatchRecord | null>(null);

  const dispatchedSareeIds = useMemo(
    () => new Set(dispatches.flatMap(d => d.sareeIds)),
    [dispatches]
  );

  // ── Unified Records ────────────────────────────────────────────────────────
  const allRecords = useMemo(() => {
    const list: InventoryRecord[] = [];

    // 1. Ready sarees (QC Passed — pending finishing)
    readySarees.forEach(s => {
      const boRef = s.bulkOrderRef || bulkOrders.find(bo =>
        bo.design === s.designCode &&
        (bo.sareeType.toLowerCase().includes(s.sareeType.toLowerCase()) ||
         s.sareeType.toLowerCase().includes(bo.sareeType.split(" · ")[0].toLowerCase()))
      )?.ref;
      const bId = batches.find(b => b.rows.some(row => row.sareeId === s.id))?.batchId;
      list.push({
        id: s.id,
        designCode: s.designCode,
        sareeType: s.sareeType,
        weaverName: s.weaverName,
        date: s.qcPassDate,
        status: "QC Passed",
        rawType: "readySaree",
        originalId: s.id,
        bulkOrderRef: boRef,
        batchId: bId
      });
    });

    // 2. Returns (Ready for Dispatch, Dispatched, Damaged)
    returns.forEach(r => {
      const boRef = bulkOrders.find(bo =>
        bo.design === r.designCode &&
        (bo.sareeType.toLowerCase().includes(r.sareeType.toLowerCase()) ||
         r.sareeType.toLowerCase().includes(bo.sareeType.split(" · ")[0].toLowerCase()))
      )?.ref;
      const bId = batches.find(b => b.rows.some(row => row.sareeId === r.sareeId))?.batchId;
      const status = dispatchedSareeIds.has(r.sareeId)
        ? "Dispatched"
        : r.inventoryStatus === "Ready for Dispatch" ? "Finishing complete" : (r.inventoryStatus.includes("Damaged") ? "Damaged — Review Needed" : r.inventoryStatus);
      list.push({
        id: r.sareeId,
        designCode: r.designCode,
        sareeType: r.sareeType,
        weaverName: r.weaverName,
        date: r.receivedDate,
        status: status as InventoryRecord["status"],
        rawType: "return",
        originalId: r.id,
        bulkOrderRef: boRef,
        batchId: bId,
        quotationRef: r.quotationRef,
      });
    });

    return list;
  }, [readySarees, returns, bulkOrders, batches, dispatchedSareeIds]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total        = allRecords.length;
  const pendingCount = allRecords.filter(r => r.status === "QC Passed").length;
  const ready        = allRecords.filter(r => r.status === "Finishing complete").length;
  const dispatched   = allRecords.filter(r => r.status === "Dispatched").length;
  const damaged      = allRecords.filter(r => r.status === "Damaged — Review Needed").length;

  // Dispatched this month
  const thisMonth  = dispatches.filter(d => {
    try { return new Date(d.dispatchDate).getMonth() === new Date().getMonth(); } catch { return true; }
  }).reduce((acc, d) => acc + d.sareeIds.length, 0);

  // ── Selection helpers ──
  // Every row the table has shown, remembered so a selection survives the tab
  // switch, filter or search that scrolls it out of `mirroredRows`.
  const rememberRows = useCallback((rows: WeaverSareeRow[]) => {
    setMirroredRows(rows);
    setSeenRows(prev => {
      const next = new Map(prev);
      let changed = false;
      rows.forEach(r => { if (next.get(r.sareeId) !== r) { next.set(r.sareeId, r); changed = true; } });
      return changed ? next : prev;
    });
  }, []);

  // The one resolution of "what is currently ticked", shared by the action bar,
  // the three dispatch modals and the confirm handlers. It runs the same
  // `isSareePickable` rule the table's own checkboxes use, so a saree that
  // could be ticked always reaches the modal it was ticked for — previously the
  // page re-derived this twice with two different rules, and the stricter one
  // (QC-passed only) silently emptied the modals of sarees the action bar was
  // still counting, while the confirm path dispatched them anyway.
  // A remembered row is a snapshot: once its saree is dispatched it is dropped
  // from every pick tab, so nothing ever re-reports it and its cached copy
  // still reads `dispatched: false`. `dispatchedSareeIds` is the live record,
  // so it decides that half of the rule.
  const isPickableNow = useCallback(
    (r: WeaverSareeRow) => isSareePickable(r) && !dispatchedSareeIds.has(r.sareeId),
    [dispatchedSareeIds],
  );

  const selectedRows = useMemo(
    () => [...selected]
      .map(id => seenRows.get(id))
      .filter((r): r is WeaverSareeRow => !!r && isPickableNow(r)),
    [selected, seenRows, isPickableNow],
  );

  const dispatchableSelected = useMemo(() => selectedRows.map(r => ({
    id: r.sareeId,
    originalId: r.sareeId,
    designCode: r.designCode || "",
    sareeType: r.sareeTypeName || r.sareeTypeCode || "—",
    weaverName: r.ownerLabel || "—",
    date: r.finishingCompletedDate || r.qcDate || r.assignedDate || "",
    status: r.finishingStatus === "completed" ? "Finishing complete" : r.qcStatus === "passed" ? "QC Passed" : "In Production",
    bulkOrderRef: undefined as string | undefined,
  })), [selectedRows]);

  // Pool the modals scan and pick against. A saree already on a dispatch record
  // (including one dispatched via a previously raised quotation) is gone from
  // the shelf, and a QC reject needs a decision before it can be sold — both are
  // excluded by `isSareePickable`. Drawn from every row seen rather than only
  // the current tab, so scanning an ID inside a modal finds it either way.
  const availableSarees = useMemo<FinishingReturn[]>(
    () => [...seenRows.values()].filter(isPickableNow).map(rowToDispatchSaree),
    [seenRows, isPickableNow],
  );

  const selectedSarees = useMemo<FinishingReturn[]>(
    () => selectedRows.map(rowToDispatchSaree),
    [selectedRows],
  );

  const toggleSareeRow = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllVisible = useCallback((ids: string[]) => {
    setSelected(prev => {
      const allSelected = ids.length > 0 && ids.every(id => prev.has(id));
      const next = new Set(prev);
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  // Selects the saree whose id was actually scanned. Barcode scanners behave as
  // keyboards (they type the code and press Enter), so the scanned value comes
  // in as text and is matched against the rows on screen. This previously
  // ignored its input entirely and selected a *random* unselected saree, which
  // silently mis-assigned physical goods.
  const handleScan = useCallback((rawId: string) => {
    const id = rawId.trim();
    const show = (msg: string) => { setScanMsg(msg); setTimeout(() => setScanMsg(""), 2500); };
    if (!id) return show("Scan a barcode or type a saree ID.");

    const match = mirroredRows.find(r => r.sareeId.toLowerCase() === id.toLowerCase());
    if (!match) return show(`No saree "${id}" in this list.`);
    // Same rule as the checkboxes — scanning must not slip a saree past a gate
    // the table would have blocked, or it would vanish again downstream.
    if (!isPickableNow(match)) {
      return show(match.dispatched || dispatchedSareeIds.has(match.sareeId)
        ? `${match.sareeId} is already dispatched.`
        : `${match.sareeId} needs a QC decision before it can be dispatched.`);
    }
    if (selected.has(match.sareeId)) return show(`${match.sareeId} is already selected.`);

    setSelected(prev => new Set(prev).add(match.sareeId));
    show(`Selected ${match.sareeId}`);
  }, [mirroredRows, selected, isPickableNow, dispatchedSareeIds]);

  // Awaited, unlike before: the mutation rolls its optimistic row back when the
  // server rejects the dispatch, so firing and forgetting made a failed shop
  // dispatch look like it had worked — the row flashed into Dispatch History
  // and vanished, with the reason only ever reaching the console.
  const handleShopConfirm = async (transport: TransportData, opts?: { skipped?: boolean; picked?: FinishingReturn[]; receiptUrl?: string | null }) => {
    const sareeIds = opts?.picked?.length
      ? opts.picked.map(s => s.sareeId || s.id)
      : dispatchableSelected.map(r => r.id);
    try {
      await dispatchSarees(sareeIds, {
        type: "shop", sareeIds, dispatchDate: transport.dispatchDate || new Date().toISOString().slice(0, 10),
        lrNumber: transport.lrNumber, transportCompany: transport.transportCompany, vehicleNumber: transport.vehicleNumber, driverName: transport.driverName, notes: transport.notes,
        pendingTransport: !!opts?.skipped && !(transport.lrNumber && transport.transportCompany && transport.vehicleNumber),
        // A receipt uploaded here settles the requirement, even on a "skip for now" dispatch.
        pendingReceipt: !!opts?.skipped && !opts?.receiptUrl,
        receiptUrl: opts?.receiptUrl ?? undefined,
      });
    } catch (err) {
      setToast(toastMessageForError(err));
      return;
    }
    setModal(null);
    setSelected(new Set());
    setToast(opts?.skipped
      ? `${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to Shop — complete remaining details from Dispatch History`
      : `${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to Shop`);
  };

  const quotationDispatchSarees = useMemo(() => {
    if (!quotationDispatch) return [];
    return returns.filter(r => r.quotationRef === quotationDispatch.quotationNumber && r.inventoryStatus === "Ready for Dispatch");
  }, [quotationDispatch, returns]);

  const handleWholesaleConfirm = async (transport: TransportData, inv: InvoiceData, customerId: string, bulkOrderRef?: string, opts?: { skipped?: boolean; picked?: FinishingReturn[]; quotationRef?: string }) => {
    const sareeIds = opts?.picked?.length
      ? opts.picked.map(s => s.sareeId || s.id)
      : quotationDispatch ? quotationDispatchSarees.map(r => r.sareeId) : dispatchableSelected.map(r => r.id);
    const customer = wholesaleCustomers.find(c => c.id === customerId);
    const subtotal = sareeIds.reduce((sum, id) => sum + (parseFloat(inv.prices[id]) || 0), 0);
    const gstAmount = inv.applyGst ? subtotal * (parseFloat(inv.gstPct) || 0) / 100 : 0;
    let created: { id: string; invoiceNumber?: string };
    try {
      created = await dispatchSarees(sareeIds, {
        type: "wholesale", sareeIds, dispatchDate: transport.dispatchDate || new Date().toISOString().slice(0, 10),
        lrNumber: transport.lrNumber, transportCompany: transport.transportCompany, vehicleNumber: transport.vehicleNumber, driverName: transport.driverName, notes: transport.notes,
        customerId, customerName: customer?.name, customerPhone: customer?.phone,
        expectedDelivery: transport.expectedDelivery, specialInstructions: transport.specialInstructions,
        invoiceDate: inv.invoiceDate,
        pricePerSaree: sareeIds.length ? Math.round(subtotal / sareeIds.length) : 0,
        totalAmount: subtotal,
        gstPct: inv.applyGst ? parseFloat(inv.gstPct) || 0 : 0,
        grandTotal: subtotal + gstAmount,
        firmId: inv.firmId, paymentDueDate: inv.paymentDueDate, invoiceNotes: inv.invoiceNotes,
        bulkOrderRef,
        quotationRef: opts?.quotationRef ?? quotationDispatch?.quotationNumber,
        pendingTransport: !!opts?.skipped && !(transport.lrNumber && transport.transportCompany && transport.vehicleNumber),
        pendingReceipt: !!opts?.skipped,
      });
    } catch (err) {
      setToast(toastMessageForError(err));
      return;
    }
    if (bulkOrderRef) {
      markDispatched(bulkOrderRef, created.invoiceNumber ?? "");
    }
    if (quotationDispatch) {
      markQuotationDispatched(quotationDispatch.id);
    }
    setModal(null);
    setQuotationDispatch(null);
    setSelected(new Set());
    const invoiceLabel = created.invoiceNumber ? ` ${created.invoiceNumber}` : "";
    setToast(opts?.skipped
      ? `Invoice${invoiceLabel} raised — ${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to ${customer?.name}, complete transport & receipt later`
      : `Invoice${invoiceLabel} sent — ${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to ${customer?.name}`);
  };

  const handleRaiseQuotation = async (inv: InvoiceData, customerId: string, bulkOrderRef?: string, picked?: FinishingReturn[]) => {
    const customer = wholesaleCustomers.find(c => c.id === customerId);
    const quoteSarees = (picked?.length ? picked : selectedSarees).map(s => ({
      id: s.sareeId || s.id,
      designCode: s.designCode,
      sareeTypeCode: s.sareeTypeCode,
      sareeType: s.sareeType,
      weaverName: s.weaverName,
    }));
    const subtotal = quoteSarees.reduce((sum, r) => sum + (parseFloat(inv.prices[r.id]) || 0), 0);
    const gstAmount = inv.applyGst ? subtotal * (parseFloat(inv.gstPct) || 0) / 100 : 0;
    const firm = firms.find(f => f.id === inv.firmId);
    const createdQuotation = await raiseQuotation({
      // Placeholder only — QuotationsService assigns the real number, which is
      // read back from the response below for the confirmation toast.
      quotationNumber: "",
      quotationDate: inv.invoiceDate,
      customerId,
      customerName: customer?.name ?? "—",
      customerCity: customer?.city,
      customerPhone: customer?.phone,
      customerAddress: customer?.address,
      customerGst: customer?.gstCode,
      bulkOrderRef,
      sarees: quoteSarees.map(r => ({
        sareeId: r.id,
        designCode: r.designCode,
        sareeTypeCode: r.sareeTypeCode,
        sareeType: r.sareeType,
        weaverName: r.weaverName,
        finishingStatus: "pending" as const,
      })),
      prices: inv.prices,
      applyGst: inv.applyGst,
      gstPct: inv.gstPct,
      firmId: inv.firmId,
      firmName: firm?.firmName,
      notes: inv.invoiceNotes,
      subtotal,
      grandTotal: subtotal + gstAmount,
      raisedBy: "Admin",
      status: "raised",
    });
    setModal(null);
    setSelected(new Set());
    setToast(`Quotation ${createdQuotation.quotationNumber} raised for ${customer?.name} — sent to finishing`);
  };

  return {
    returns,
    dispatches,
    updateDispatch,
    bulkOrders,
    firms,
    openDesignCode,
    setOpenDesignCode,
    openSareeTypeCode,
    setOpenSareeTypeCode,
    openDesign,
    openSareeType,
    selected,
    setSelected,
    mirroredRows,
    rememberVisibleRows: rememberRows,
    viewingItem,
    setViewingItem,
    modal,
    setModal,
    toast,
    setToast,
    scanMsg,
    setScanMsg,
    quotationDispatch,
    setQuotationDispatch,
    resumeDispatch,
    setResumeDispatch,
    viewingInvoice,
    setViewingInvoice,
    deleteDispatch,
    markQuotationDispatched,
    allRecords,
    total,
    pendingCount,
    ready,
    dispatched,
    damaged,
    thisMonth,
    dispatchableSelected,
    availableSarees,
    selectedSarees,
    toggleSareeRow,
    toggleAllVisible,
    handleScan,
    handleShopConfirm,
    quotationDispatchSarees,
    handleWholesaleConfirm,
    handleRaiseQuotation,
    quotations,
  };
}
