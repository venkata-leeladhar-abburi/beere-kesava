import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
const imgInventoryHero = "https://images.unsplash.com/photo-1585914924626-15adac1e6402?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import {
  Scan, Package, Truck, ShoppingBag, Users, X, CheckCircle2, AlertTriangle, Clock, FileText,
} from "lucide-react";
import { useFinishing, FinishingReturn, DispatchRecord, Quotation } from "../../finishing/contexts/FinishingContext";
import { useFirms } from "../../firms/contexts/FirmsContext";
import { useDesignLibrary } from "../../design-library/contexts/DesignLibraryContext";
import { useBulkOrders } from "../../bulk-orders/contexts/BulkOrderContext";
import { useBatches } from "../../production/contexts/BatchContext";
import { DesignCodeCard } from "../../design-library/components/DesignLibraryPage";
import { SareeTypeCard, getSareeTypeByCode } from "../../pricing/components/RatesPricingPage";
import { WeaverSareesSection, WeaverSareeRow } from "../../weavers/components/WeaverSareesSection";
import { MoneyAccessProvider } from "../../../shared/ui/MoneyAccess";

import { T, F, EASE, card } from "./theme";
import { WHOLESALE_CUSTOMERS } from "./data";
import { TransportData, InvoiceData, InventoryRecord } from "./types";
import { getLoomForRecord, getSareeColor } from "./utils";
import { Toast } from "./common/primitives";
import { rowToDispatchSaree } from "./modals/shared/SareePicker";
import { DispatchShopModal } from "./modals/DispatchShopModal";
import { DispatchWholesaleModal } from "./modals/dispatchWholesale/DispatchWholesaleModal";
import { RaiseQuotationModal } from "./modals/RaiseQuotationModal";
import { ResumeDispatchModal } from "./modals/ResumeDispatchModal";
import { InventoryDetailModal } from "./modals/InventoryDetailModal";
import { DispatchHistorySection } from "./sections/DispatchHistorySection";
import { QuotationsSection } from "./sections/QuotationsSection";

// Re-exported so existing imports of `DispatchHistorySection` / `ResumeDispatchModal`
// from this file (e.g. the Worker Staff portal) keep working unchanged.
export { DispatchHistorySection, ResumeDispatchModal };
export { getLoomForRecord, getSareeColor };
export type { InventoryRecord };

/**
 * Composition root for the Inventory (Finished Goods & Dispatch) feature.
 * Originally a single 2,426-line file — split into theme/types/data/utils +
 * common primitives + modals/ (with a modals/shared/ group for the pieces
 * reused across the three dispatch flows, and a modals/dispatchWholesale/
 * sub-split for the largest modal) + sections/, all under this same
 * directory. See git history for the pre-split version if you need to trace
 * exactly what moved where.
 */
export function InventoryPage({
  canRaiseQuotation = true, canDispatchWholesale = true, canDispatchShop = true, canSeeMoney = true,
  showQuickDispatch = true, showCategorySplit = true, showQuotationsSection = true, showDispatchHistory = true,
}: {
  canRaiseQuotation?: boolean;
  /** Wholesale dispatch always involves per-saree pricing and GST, so it's tied
   *  to money visibility rather than gated separately. */
  canDispatchWholesale?: boolean;
  canDispatchShop?: boolean;
  canSeeMoney?: boolean;
  /** Sidebar "Quick Dispatch" card — same three actions as the action bar, just
   *  a second entry point. Independent of the action bar so it can be hidden
   *  even when at least one dispatch action remains available. */
  showQuickDispatch?: boolean;
  showCategorySplit?: boolean;
  showQuotationsSection?: boolean;
  showDispatchHistory?: boolean;
} = {}) {
  const { returns, dispatches, dispatchSarees, updateDispatch, readySarees, raiseQuotation, quotations, markQuotationDispatched } = useFinishing();
  const { getDesign } = useDesignLibrary();
  const { bulkOrders, markDispatched } = useBulkOrders();
  const { batches } = useBatches();
  const { firms } = useFirms();

  // ── Clickable code modals ───────────────────────────────────────────────────
  const [openDesignCode, setOpenDesignCode] = useState<string | null>(null);
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);
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
  // Nothing to select for if every dispatch route is closed off — the action
  // bar and the table's checkboxes fold away together in that case.
  const hasAnyDispatchAction = canDispatchShop || canDispatchWholesale || canRaiseQuotation;

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

  // ── Selection helpers — driven by the "All Sarees Inventory" table's own filters/tabs ──
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

  // Whole inventory table as dispatch-shaped rows — the pool the modals' scan
  // and "select from inventory" controls draw from.
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

  // Simulated barcode scan
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
    // The modal owns the list once sarees can be scanned or picked inside it.
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

  // Sarees belonging to a quotation that have come back from finishing and are ready to dispatch.
  const quotationDispatchSarees = useMemo(() => {
    if (!quotationDispatch) return [];
    return returns.filter(r => r.quotationRef === quotationDispatch.quotationNumber && r.inventoryStatus === "Ready for Dispatch");
  }, [quotationDispatch, returns]);

  const handleWholesaleConfirm = (transport: TransportData, inv: InvoiceData, customerId: string, bulkOrderRef?: string, opts?: { skipped?: boolean; picked?: FinishingReturn[]; quotationRef?: string }) => {
    // The modal owns the saree list now (scanned / picked / pulled from a
    // quotation), so it is the source of truth when it supplies one.
    const sareeIds = opts?.picked?.length
      ? opts.picked.map(s => s.sareeId || s.id)
      : quotationDispatch ? quotationDispatchSarees.map(r => r.sareeId) : dispatchableSelected.map(r => r.id);
    const customer = WHOLESALE_CUSTOMERS.find(c => c.id === customerId);
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
    const customer = WHOLESALE_CUSTOMERS.find(c => c.id === customerId);
    // The modal's own list wins — sarees may have been scanned or picked there.
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

  return (
    <MoneyAccessProvider allowed={canSeeMoney}>
    <div style={{ background: T.silkCream, minHeight: "100vh", fontFamily: F.ui }}>

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <header style={{ background: "#3D0E1A", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        {/* Left text content */}
        <div style={{ position: "relative", zIndex: 2, padding: "48px 0 110px 48px", flex: "0 0 64%", maxWidth: "64%" }}>
          <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 12 }}>SINCE 1999 · INVENTORY MANAGEMENT</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Finished Goods</h1>
            <span style={{ fontFamily: F.display, fontSize: 32, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Dispatch</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: 560, lineHeight: 1.6 }}>
            Track all finished sarees received from quality check and dispatch them to shop or wholesale customers.
          </p>
        </div>
        {/* Right image with gradient */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #3D0E1A 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
          <img src={imgInventoryHero} alt="Silk saree inventory" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
        </div>
      </header>

      {/* ── FLOATING STAT STRIP ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
      >
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
          {[
            { val: total,        label: "TOTAL IN INVENTORY",     sub: "All finished sarees",          hi: false, crimson: false, goldVal: false, Icon: Package },
            { val: pendingCount, label: "PENDING FINISHING",      sub: "QC passed, needs finishing",   hi: false, crimson: false, goldVal: false, Icon: Clock },
            { val: ready,        label: "READY FOR DISPATCH",     sub: "Cleared, awaiting dispatch",   hi: true,  crimson: false, goldVal: true,  Icon: CheckCircle2 },
            { val: thisMonth,    label: "DISPATCHED THIS MONTH",  sub: "To shop + wholesale",          hi: false, crimson: false, goldVal: false, Icon: Truck },
            { val: damaged,      label: "DAMAGED — NEEDS REVIEW", sub: "Reported during verification", hi: false, crimson: true,  goldVal: false, Icon: AlertTriangle },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.09 }}
              whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
              style={{
                flex: 1, padding: "28px 22px",
                backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
                borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none",
                display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "default",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.crimson ? "#F47B72" : m.goldVal ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)" }}>
                  {m.sub}
                </div>
              </div>
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: "96px 56px 80px", maxWidth: 1500, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 28, alignItems: "start" }}>

          {/* ── MAIN TABLE SECTION ──────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Toolbar */}
            <div style={{ ...card, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                {/* Scan */}
                <button onClick={handleScan}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, background: T.deepWine, border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: "#FFF", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" as const }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.royalBurgundy; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = T.deepWine; }}>
                  <Scan size={14} color="#FFF" /> Scan
                </button>
                <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
                  Scans a random unselected saree from the table below and selects it.
                </span>
              </div>

              {/* Scan feedback */}
              {scanMsg && (
                <div style={{ marginTop: 2, background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.12)`, borderRadius: 8, padding: "7px 12px", fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>
                  {scanMsg}
                </div>
              )}
            </div>

            {/* Action bar — always visible so the dispatch routes are discoverable
                before any saree is picked. The modals themselves gate on selection.
                Folds away entirely once every dispatch route is closed off. */}
            {hasAnyDispatchAction && (
              <motion.div layout transition={{ duration: 0.2, ease: EASE }}
                style={{ background: T.deepWine, borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 20px rgba(61,14,26,0.20)" }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,255,255,0.80)", flex: 1 }}>
                  {selected.size > 0 ? (
                    <>
                      <strong style={{ color: "#FFF" }}>{selected.size}</strong> selected
                      {dispatchableSelected.length !== selected.size && ` (${dispatchableSelected.length} ready for dispatch)`}
                    </>
                  ) : (
                    <>No sarees selected — <span style={{ color: "rgba(255,255,255,0.62)" }}>pick sarees from the table below, or open an action to start</span></>
                  )}
                </span>
                {canDispatchShop && (
                  <button onClick={() => setModal("shop")}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 40, background: T.antiqueGold, border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.deepWine, cursor: "pointer" }}>
                    <ShoppingBag size={15} /> Dispatch to Shop
                  </button>
                )}
                {canDispatchWholesale && (
                  <button onClick={() => setModal("wholesale")}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 40, background: "#FFF", border: "none", borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.royalBurgundy, cursor: "pointer" }}>
                    <Users size={15} /> Dispatch to Wholesale
                  </button>
                )}
                {canRaiseQuotation && (
                  <button onClick={() => setModal("quotation")}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 40, background: "transparent", border: `1px solid rgba(255,255,255,0.35)`, borderRadius: 10, fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: "#FFF", cursor: "pointer" }}>
                    <FileText size={15} /> Raise Quotation
                  </button>
                )}
                {selected.size > 0 && (
                  <button onClick={() => setSelected(new Set())} title="Clear selection"
                    style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={14} color="#FFF" />
                  </button>
                )}
              </motion.div>
            )}

            {/* All Sarees Inventory — same table used on the Production page */}
            <div style={{ ...card, borderRadius: 16, padding: 20 }}>
              <WeaverSareesSection
                ownerType="all"
                selectable={hasAnyDispatchAction}
                selectedIds={selected}
                onToggleRow={toggleSareeRow}
                onToggleAll={toggleAllVisible}
                onVisibleChange={setMirroredRows}
              />
            </div>
          </div>

          {/* ── QUICK ACTIONS SIDEBAR ───────────────────────────────────── */}
          {(showQuickDispatch || showCategorySplit) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 100 }}>
            {/* Dispatch buttons */}
            {showQuickDispatch && (
            <div style={{ ...card, padding: "20px 20px", borderRadius: 16 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 14 }}>Quick Dispatch</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {canDispatchShop && (
                  <button onClick={() => setModal("shop")}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: `linear-gradient(135deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, border: "none", borderRadius: 12, cursor: "pointer", textAlign: "left" as const }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ShoppingBag size={18} color="#FFF" />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFF" }}>Dispatch to Shop</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>
                        {selected.size > 0 ? `${selected.size} saree${selected.size > 1 ? "s" : ""} ready` : "Select sarees first"}
                      </div>
                    </div>
                  </button>
                )}
                {canDispatchWholesale && (
                  <button onClick={() => setModal("wholesale")}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, cursor: "pointer", textAlign: "left" as const, boxShadow: "0 1px 6px rgba(44,24,16,0.06)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Users size={18} color={T.royalBurgundy} />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Dispatch to Wholesale</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>With tax invoice generation</div>
                    </div>
                  </button>
                )}
                {canRaiseQuotation && (
                  <button onClick={() => setModal("quotation")}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 12, cursor: "pointer", textAlign: "left" as const, boxShadow: "0 1px 6px rgba(44,24,16,0.06)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(200,155,71,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={18} color={T.antiqueGold} />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>Raise Quotation</div>
                      <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 1 }}>Send to finishing before dispatch</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
            )}

            {/* Category split */}
            {showCategorySplit && (
            <div style={{ ...card, padding: "20px 20px", borderRadius: 16 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.luxuryBrown, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 16 }}>Category Split</div>
              {[
                { label: "Pending Finishing",  val: pendingCount, total: Math.max(1, total), color: T.antiqueGold },
                { label: "Ready for Dispatch",  val: ready,        total: Math.max(1, total), color: T.green },
                { label: "Dispatched",          val: dispatched,   total: Math.max(1, total), color: T.royalBurgundy },
                { label: "Damaged / Review",    val: damaged,      total: Math.max(1, total), color: T.crimson },
              ].map(b => {
                const pct = Math.round((b.val / b.total) * 100);
                return (
                  <div key={b.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{b.label}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: b.color }}>{b.val} <span style={{ color: T.taupe, fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ background: "rgba(139,112,96,0.10)", borderRadius: 999, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: b.color, borderRadius: 999, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* ── QUOTATIONS ───────────────────────────────────────────────────── */}
      {showQuotationsSection && (
        <div style={{ padding: "0 48px", marginTop: 40 }}>
          <QuotationsSection
            quotations={quotations}
            onDispatch={q => { setQuotationDispatch(q); setModal("wholesale"); }}
          />
        </div>
      )}

      {/* ── DISPATCH HISTORY ─────────────────────────────────────────────── */}
      {showDispatchHistory && (
        <div style={{ padding: "0 48px 80px", marginTop: 24 }}>
          <DispatchHistorySection dispatches={dispatches} firms={firms} onResume={setResumeDispatch} />
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal === "shop" && (
          <DispatchShopModal
            key="shop-modal"
            sarees={selectedSarees}
            available={availableSarees}
            onConfirm={handleShopConfirm}
            onClose={() => setModal(null)}
          />
        )}
        {modal === "wholesale" && canDispatchWholesale && quotationDispatch && (
          <DispatchWholesaleModal
            key="wholesale-modal-quotation"
            sarees={quotationDispatchSarees}
            available={availableSarees}
            initialCustomerId={quotationDispatch.customerId}
            initialBulkOrderRef={quotationDispatch.bulkOrderRef}
            onConfirm={handleWholesaleConfirm}
            onClose={() => { setModal(null); setQuotationDispatch(null); }}
          />
        )}
        {/* Opens with or without a prior selection — sarees can be added inside. */}
        {modal === "wholesale" && canDispatchWholesale && !quotationDispatch && (() => {
          // Auto-detect bulk order from selected sarees
          const selectedRecords = allRecords.filter(r => dispatchableSelected.some(d => d.id === r.id));
          const detectedRef = selectedRecords.find(r => r.bulkOrderRef)?.bulkOrderRef;
          const detectedOrder = detectedRef ? bulkOrders.find(o => o.ref === detectedRef) : undefined;
          // Map bulk order customerId to WHOLESALE_CUSTOMERS
          const detectedCustomerId = detectedOrder?.customerId
            ? WHOLESALE_CUSTOMERS.find(c => c.id === detectedOrder.customerId)?.id
            : undefined;
          return (
            <DispatchWholesaleModal
              key="wholesale-modal"
              sarees={selectedSarees}
              available={availableSarees}
              initialBulkOrderRef={detectedRef}
              initialCustomerId={detectedCustomerId}
              onConfirm={handleWholesaleConfirm}
              onClose={() => setModal(null)}
            />
          );
        })()}
        {modal === "quotation" && canRaiseQuotation && (() => {
          const selectedRecords = allRecords.filter(r => dispatchableSelected.some(d => d.id === r.id));
          const detectedRef = selectedRecords.find(r => r.bulkOrderRef)?.bulkOrderRef;
          const detectedOrder = detectedRef ? bulkOrders.find(o => o.ref === detectedRef) : undefined;
          const detectedCustomerId = detectedOrder?.customerId
            ? WHOLESALE_CUSTOMERS.find(c => c.id === detectedOrder.customerId)?.id
            : undefined;
          return (
            <RaiseQuotationModal
              key="quotation-modal"
              sarees={selectedSarees}
              available={availableSarees}
              initialBulkOrderRef={detectedRef}
              initialCustomerId={detectedCustomerId}
              onConfirm={handleRaiseQuotation}
              onClose={() => setModal(null)}
            />
          );
        })()}
      </AnimatePresence>
      <AnimatePresence>
        {resumeDispatch && (
          <ResumeDispatchModal
            record={resumeDispatch}
            onSave={patch => {
              updateDispatch(resumeDispatch.id, patch);
              setResumeDispatch(null);
              setToast("Dispatch details completed");
            }}
            onClose={() => setResumeDispatch(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
      <AnimatePresence>
        {viewingItem && (
          <InventoryDetailModal
            item={viewingItem}
            dispatches={dispatches}
            returns={returns}
            onClose={() => setViewingItem(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {openDesign && <DesignCodeCard design={openDesign} onClose={() => setOpenDesignCode(null)} />}
        {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
      </AnimatePresence>
    </div>
    </MoneyAccessProvider>
  );
}
