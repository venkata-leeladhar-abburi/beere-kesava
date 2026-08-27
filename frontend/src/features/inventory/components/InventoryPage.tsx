import React from "react";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { DesignCodeCard } from "@/features/design-library";
import { SareeTypeCard } from "@/features/pricing";
import { WeaverSareesSection } from "@/features/weavers";
import { MoneyAccessProvider } from "../../../shared/ui/MoneyAccess";

import { T, F, card } from "./theme";
import { InventoryRecord } from "./types";
import { getLoomForRecord, getSareeColor } from "./utils";
import { DispatchShopModal } from "./modals/DispatchShopModal";
import { DispatchWholesaleModal } from "./modals/dispatchWholesale/DispatchWholesaleModal";
import { RaiseQuotationModal } from "./modals/RaiseQuotationModal";
import { ResumeDispatchModal } from "./modals/ResumeDispatchModal";
import { DispatchInvoiceModal } from "./modals/DispatchInvoiceModal";
import { DispatchChallanModal } from "./modals/DispatchChallanModal";
import { InventoryDetailModal } from "./modals/InventoryDetailModal";
import { DispatchHistorySection } from "./sections/DispatchHistorySection";
import { QuotationsSection } from "./sections/QuotationsSection";
import { PageHeaderAndStats } from "./sections/PageHeaderAndStats";
import { ActionBar } from "./sections/ActionBar";
import { QuickActionsSidebar } from "./sections/QuickActionsSidebar";
import { useInventoryPageState } from "../hooks/useInventoryPageState";

// Re-exported so existing imports of `DispatchHistorySection` / `ResumeDispatchModal`
// from this file (e.g. the Worker Staff portal) keep working unchanged.
export { DispatchHistorySection, ResumeDispatchModal, DispatchInvoiceModal, DispatchChallanModal };
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
  const {
    returns,
    dispatches,
    updateDispatch,
    bulkOrders,
    firms,
    setOpenDesignCode,
    setOpenSareeTypeCode,
    openDesign,
    openSareeType,
    selected,
    setSelected,
    rememberVisibleRows,
    viewingItem,
    setViewingItem,
    modal,
    setModal,
    scanMsg,
    quotationDispatch,
    setQuotationDispatch,
    resumeDispatch,
    setResumeDispatch,
    deleteDispatch,
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
    viewingInvoice,
    setViewingInvoice,
    handleWholesaleConfirm,
    handleRaiseQuotation,
    quotations,
  } = useInventoryPageState();

  // Nothing to select for if every dispatch route is closed off — the action
  // bar and the table's checkboxes fold away together in that case.
  const hasAnyDispatchAction = canDispatchShop || canDispatchWholesale || canRaiseQuotation;
  const hasSidebar = showQuickDispatch || showCategorySplit;

  return (
    <MoneyAccessProvider allowed={canSeeMoney}>
    <div style={{ background: T.silkCream, minHeight: "100dvh", fontFamily: F.ui }}>

      {/* ── PAGE HEADER & FLOATING STAT STRIP ──────────────────────────────── */}
      <PageHeaderAndStats
        total={total}
        pendingCount={pendingCount}
        ready={ready}
        thisMonth={thisMonth}
        damaged={damaged}
      />

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 96, paddingBottom: 40, width: "100%" }}>
        <div className={hasSidebar ? "grid grid-cols-1 xl:[grid-template-columns:minmax(0,1fr)_300px]" : "grid grid-cols-1"} style={{ gap: 28, alignItems: "start" }}>

          {/* ── MAIN TABLE SECTION ──────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Action Bar (Barcode Scanner + Bulk Dispatch Buttons) */}
            <ActionBar
              hasAnyDispatchAction={hasAnyDispatchAction}
              selectedCount={selected.size}
              dispatchableSelectedCount={dispatchableSelected.length}
              scanMsg={scanMsg}
              onScan={handleScan}
              canDispatchShop={canDispatchShop}
              canDispatchWholesale={canDispatchWholesale}
              canRaiseQuotation={canRaiseQuotation}
              onOpenModal={setModal}
              onClearSelection={() => setSelected(new Set())}
            />

            {/* All Sarees Inventory — same table used on the Production page */}
            <div style={{ ...card, borderRadius: 16, padding: 20 }}>
              <WeaverSareesSection
                ownerType="all"
                selectable={hasAnyDispatchAction}
                selectedIds={selected}
                onToggleRow={toggleSareeRow}
                onToggleAll={toggleAllVisible}
                onVisibleChange={rememberVisibleRows}
              />
            </div>
          </div>

          {/* ── QUICK ACTIONS SIDEBAR ───────────────────────────────────── */}
          <QuickActionsSidebar
            showQuickDispatch={showQuickDispatch}
            showCategorySplit={showCategorySplit}
            canDispatchShop={canDispatchShop}
            canDispatchWholesale={canDispatchWholesale}
            canRaiseQuotation={canRaiseQuotation}
            selectedCount={selected.size}
            pendingCount={pendingCount}
            ready={ready}
            dispatched={dispatched}
            damaged={damaged}
            total={total}
            onOpenModal={setModal}
          />
        </div>
      </div>

      {/* ── QUOTATIONS ───────────────────────────────────────────────────── */}
      {showQuotationsSection && (
        <div className="px-4 md:px-7 xl:px-14" style={{ marginTop: 40 }}>
          <QuotationsSection
            quotations={quotations}
            onDispatch={q => { setQuotationDispatch(q); setModal("wholesale"); }}
          />
        </div>
      )}

      {/* ── DISPATCH HISTORY ─────────────────────────────────────────────── */}
      {showDispatchHistory && (
        <div className="px-4 md:px-7 xl:px-14" style={{ paddingBottom: 80, marginTop: 24 }}>
          <DispatchHistorySection 
            dispatches={dispatches} 
            firms={firms} 
            onResume={setResumeDispatch} 
            onDelete={(d) => deleteDispatch(d.id, "admin-staff")}
            onViewInvoice={setViewingInvoice}
          />
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
          const detectedCustomerId = detectedOrder?.customerId;
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
          const detectedCustomerId = detectedOrder?.customerId;
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
              toast.success("Dispatch details completed");
            }}
            onClose={() => setResumeDispatch(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {/* Wholesale bills a customer, so it prints a tax invoice. A shop
            dispatch is our own stock moving to our own showroom — no sale, no
            GST, no amount payable — so it prints a delivery challan instead. */}
        {viewingInvoice && viewingInvoice.type === "shop" && (
          <DispatchChallanModal
            dispatch={viewingInvoice}
            onClose={() => setViewingInvoice(null)}
          />
        )}
        {viewingInvoice && viewingInvoice.type !== "shop" && (
          <DispatchInvoiceModal
            dispatch={viewingInvoice}
            onClose={() => setViewingInvoice(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
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
