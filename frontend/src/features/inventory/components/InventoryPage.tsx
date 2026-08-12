import React from "react";
import { AnimatePresence } from "motion/react";
import { FinishingReturn, DispatchRecord, Quotation } from "../../finishing/contexts/FinishingContext";
import { DesignCodeCard } from "../../design-library/components/DesignLibraryComponents";
import { SareeTypeCard } from "../../pricing/components/RatesPricingPage";
import { WeaverSareesSection } from "../../weavers/components/WeaverSareesSection";
import { MoneyAccessProvider } from "../../../shared/ui/MoneyAccess";

import { T, F, card } from "./theme";
import { TransportData, InvoiceData, InventoryRecord } from "./types";
import { getLoomForRecord, getSareeColor } from "./utils";
import { Toast } from "./common/primitives";
import { DispatchShopModal } from "./modals/DispatchShopModal";
import { DispatchWholesaleModal } from "./modals/dispatchWholesale/DispatchWholesaleModal";
import { RaiseQuotationModal } from "./modals/RaiseQuotationModal";
import { ResumeDispatchModal } from "./modals/ResumeDispatchModal";
import { DispatchInvoiceModal } from "./modals/DispatchInvoiceModal";
import { InventoryDetailModal } from "./modals/InventoryDetailModal";
import { DispatchHistorySection } from "./sections/DispatchHistorySection";
import { QuotationsSection } from "./sections/QuotationsSection";
import { PageHeaderAndStats } from "./sections/PageHeaderAndStats";
import { ActionBar } from "./sections/ActionBar";
import { QuickActionsSidebar } from "./sections/QuickActionsSidebar";
import { useInventoryPageState } from "../hooks/useInventoryPageState";

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
  const {
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
      <div style={{ padding: "96px 56px 40px", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 28, alignItems: "start" }}>

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
                onVisibleChange={setMirroredRows}
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
        <div style={{ padding: "0 56px", marginTop: 40 }}>
          <QuotationsSection
            quotations={quotations}
            onDispatch={q => { setQuotationDispatch(q); setModal("wholesale"); }}
          />
        </div>
      )}

      {/* ── DISPATCH HISTORY ─────────────────────────────────────────────── */}
      {showDispatchHistory && (
        <div style={{ padding: "0 56px 80px", marginTop: 24 }}>
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
              setToast("Dispatch details completed");
            }}
            onClose={() => setResumeDispatch(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {viewingInvoice && (
          <DispatchInvoiceModal
            dispatch={viewingInvoice}
            onClose={() => setViewingInvoice(null)}
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
