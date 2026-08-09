import { useState, useMemo, useCallback } from "react";
import { useFinishing, FinishingReturn, DispatchRecord, Quotation } from "../../finishing/contexts/FinishingContext";
import { useDesignLibrary } from "../../design-library/contexts/DesignLibraryContext";
import { useBulkOrders } from "../../bulk-orders/contexts/BulkOrderContext";
import { useBatches } from "../../production/contexts/BatchContext";
import { useFirms } from "../../firms/contexts/FirmsContext";
import { useRatesPricing } from "../../pricing/contexts/RatesContext";
import { useCustomers } from "../../customers/contexts/CustomersContext";
import { TransportData, InvoiceData, InventoryRecord } from "../components/types";
import { rowToDispatchSaree } from "../components/modals/shared/SareePicker";
import { WeaverSareeRow } from "../../weavers/components/WeaverSareesSection";

export function useInventoryPageState() {
  const { returns, dispatches, dispatchSarees, updateDispatch, readySarees, raiseQuotation, quotations, markQuotationDispatched } = useFinishing();
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
  const [viewingItem, setViewingItem]         = useState<InventoryRecord | null>(null);
  const [modal,    setModal]                  = useState<"shop" | "wholesale" | "quotation" | null>(null);
  const [toast,    setToast]                  = useState("");
  const [scanMsg,  setScanMsg]                = useState("");
  const [quotationDispatch, setQuotationDispatch] = useState<Quotation | null>(null);
  const [resumeDispatch, setResumeDispatch]   = useState<DispatchRecord | null>(null);

  // ── Unified Records ────────────────────────────────────────────────────────
  const allRecords = useMemo(() => {
    const list: InventoryRecord[] = [];

    // 1. Ready sarees (QC Passed — pending finishing)
    readySarees.forEach(s => {
      const boRef = (s as any).bulkOrderRef || bulkOrders.find(bo =>
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
      list.push({
        id: r.sareeId,
        designCode: r.designCode,
        sareeType: r.sareeType,
        weaverName: r.weaverName,
        date: r.receivedDate,
        status: r.inventoryStatus === "Ready for Dispatch" ? "Finishing complete" : (r.inventoryStatus.includes("Damaged") ? "Damaged — Review Needed" : r.inventoryStatus) as any,
        rawType: "return",
        originalId: r.id,
        bulkOrderRef: boRef,
        batchId: bId,
        quotationRef: r.quotationRef,
      });
    });

    return list;
  }, [readySarees, returns, bulkOrders, batches]);

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
  const dispatchableSelected = useMemo(() => {
    return mirroredRows.filter(r => selected.has(r.sareeId)).map(r => ({
      id: r.sareeId,
      originalId: r.sareeId,
      designCode: r.designCode || "",
      sareeType: r.sareeTypeName || r.sareeTypeCode || "—",
      weaverName: r.ownerLabel || "—",
      date: r.finishingCompletedDate || r.qcDate || r.assignedDate || "",
      status: r.finishingStatus === "completed" ? "Finishing complete" : r.qcStatus === "passed" ? "QC Passed" : "In Production",
      bulkOrderRef: undefined as string | undefined,
    }));
  }, [mirroredRows, selected]);

  const availableSarees = useMemo<FinishingReturn[]>(() => mirroredRows.map(rowToDispatchSaree), [mirroredRows]);

  const selectedSarees = useMemo(
    () => availableSarees.filter(s => selected.has(s.sareeId)),
    [availableSarees, selected]
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

  const handleScan = useCallback(() => {
    const unselected = mirroredRows.filter(r => !selected.has(r.sareeId));
    if (!unselected.length) { setScanMsg("No more sarees to scan."); setTimeout(() => setScanMsg(""), 2000); return; }
    setScanMsg("Scanning…");
    setTimeout(() => {
      const r = unselected[Math.floor(Math.random() * unselected.length)];
      setSelected(prev => { const next = new Set(prev); next.add(r.sareeId); return next; });
      setScanMsg(`Scanned: ${r.sareeId}`);
      setTimeout(() => setScanMsg(""), 2500);
    }, 800);
  }, [mirroredRows, selected]);

  const handleShopConfirm = (transport: TransportData, opts?: { skipped?: boolean; picked?: FinishingReturn[] }) => {
    const sareeIds = opts?.picked?.length
      ? opts.picked.map(s => s.sareeId || s.id)
      : dispatchableSelected.map(r => r.id);
    dispatchSarees(sareeIds, {
      type: "shop", sareeIds, dispatchDate: transport.dispatchDate || new Date().toISOString().slice(0, 10),
      lrNumber: transport.lrNumber, transportCompany: transport.transportCompany, vehicleNumber: transport.vehicleNumber, driverName: transport.driverName, notes: transport.notes,
      pendingTransport: !!opts?.skipped && !(transport.lrNumber && transport.transportCompany && transport.vehicleNumber),
      pendingReceipt: !!opts?.skipped,
    });
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

  const handleWholesaleConfirm = (transport: TransportData, inv: InvoiceData, customerId: string, bulkOrderRef?: string, opts?: { skipped?: boolean; picked?: FinishingReturn[]; quotationRef?: string }) => {
    const sareeIds = opts?.picked?.length
      ? opts.picked.map(s => s.sareeId || s.id)
      : quotationDispatch ? quotationDispatchSarees.map(r => r.sareeId) : dispatchableSelected.map(r => r.id);
    const customer = wholesaleCustomers.find(c => c.id === customerId);
    const subtotal = sareeIds.reduce((sum, id) => sum + (parseFloat(inv.prices[id]) || 0), 0);
    const gstAmount = inv.applyGst ? subtotal * (parseFloat(inv.gstPct) || 0) / 100 : 0;
    const dispatchId = dispatchSarees(sareeIds, {
      type: "wholesale", sareeIds, dispatchDate: transport.dispatchDate || new Date().toISOString().slice(0, 10),
      lrNumber: transport.lrNumber, transportCompany: transport.transportCompany, vehicleNumber: transport.vehicleNumber, driverName: transport.driverName, notes: transport.notes,
      customerId, customerName: customer?.name, customerPhone: customer?.phone,
      expectedDelivery: transport.expectedDelivery, specialInstructions: transport.specialInstructions,
      invoiceNumber: inv.invoiceNumber, invoiceDate: inv.invoiceDate,
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
    if (bulkOrderRef) {
      markDispatched(bulkOrderRef, inv.invoiceNumber);
    }
    if (quotationDispatch) {
      markQuotationDispatched(quotationDispatch.id, dispatchId);
    }
    setModal(null);
    setQuotationDispatch(null);
    setSelected(new Set());
    setToast(opts?.skipped
      ? `Invoice raised — ${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to ${customer?.name}, complete transport & receipt later`
      : `Invoice sent — ${sareeIds.length} saree${sareeIds.length > 1 ? "s" : ""} dispatched to ${customer?.name}`);
  };

  const handleRaiseQuotation = (inv: InvoiceData, customerId: string, bulkOrderRef?: string, picked?: FinishingReturn[]) => {
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
    raiseQuotation({
      quotationNumber: inv.invoiceNumber,
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
    setToast(`Quotation ${inv.invoiceNumber} raised for ${customer?.name} — sent to finishing`);
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
    setMirroredRows,
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
