import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { IconButton } from "../../../shared/ui/primitives";
import { useIsMobile } from "../../../hooks/useResponsive";
import { usePO, PurchaseOrder } from "@/features/purchasing";
import { POCreateModal } from "@/features/purchasing";
import { PODocumentModal } from "@/features/purchasing";
import { AllPurchasesPage } from "@/features/inventory";

import { F, MobileCtx } from "./theme";
import { PageHeader, MetricsBar } from "./sections/PageHeaderAndMetrics";
import { AlertsCard } from "./sections/AlertsCard";
import { POTrackerSection } from "./sections/POTrackerSection";
import { StockOverview, IssuedThisMonthCard, ReturnedThisMonthCard } from "./sections/StockOverviewAndIssued";
import { BatchesSection } from "./sections/BatchesSection";
import { PurchaseHistorySection } from "./sections/PurchaseHistorySection";
import { MovementHistorySection } from "./sections/MovementHistorySection";
import { MaterialsFooter } from "./sections/MaterialsFooter";
import { AddNewStockModal } from "./modals/StockModals";
import { FullReportsModal, DownloadReportModal, type ReportFormat } from "./modals/ReportModals";

type ReportExporter = (format: ReportFormat) => void | Promise<void>;

/**
 * Composition root for the Materials feature. Originally a single
 * 3,099-line file — split into theme/types/data + common primitives +
 * modals/ + sections/, all under this same directory. See git history for
 * the pre-split version if you need to trace exactly what moved where.
 */
export function MaterialsPage({ onNavigate }: { onNavigate?: (tab: string, ctx?: unknown) => void } = {}) {
  const isMobile = useIsMobile();
  const px = isMobile ? 16 : 56;

  const { addPO, nextPONumber } = usePO();

  const [showAddStock, setShowAddStock] = useState(false);
  const [showFullReports, setShowFullReports] = useState(false);
  // Each section owns the rows/columns for its own report, so it hands the
  // exporter up when the user asks to download.
  const [purchaseExport, setPurchaseExport] = useState<ReportExporter | null>(null);
  const [movementExport, setMovementExport] = useState<ReportExporter | null>(null);
  const [showAllPurchases, setShowAllPurchases] = useState(false);

  const [showCreatePO, setShowCreatePO] = useState(false);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  const [successPOId, setSuccessPOId] = useState<string | null>(null);

  const handlePOSubmit = async (po: PurchaseOrder) => {
    try {
      await addPO(po);
      setSuccessPOId(po.poNumber);
      toast.success(`${po.poNumber} submitted for Superadmin approval`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit the purchase order. Please try again.");
    }
  };

  if (showAllPurchases) {
    return <AllPurchasesPage onBack={() => setShowAllPurchases(false)} />;
  }

  return (
    <MobileCtx.Provider value={{ isMobile, px }}>
      <div style={{ fontFamily: F.ui }}>
        <PageHeader />
        <MetricsBar />
        <div style={{ background: "#F7F2EA", paddingBottom: 48 }}>
          {successPOId && (
            <div style={{ padding: `16px ${px}px 0` }}>
              <div style={{
                background: "rgba(30,102,64,0.12)",
                border: "1px solid rgba(30,102,64,0.24)",
                borderRadius: 10,
                padding: "13px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: "#1E6640", fontWeight: 600 }}>
                  ✓ Purchase Order {successPOId} submitted for Superadmin approval. You will be notified when it is approved or rejected.
                </span>
                <IconButton
                  icon={X}
                  label="Dismiss"
                  onClick={() => setSuccessPOId(null)}
                  variant="ghost"
                  size="sm"
                  className="text-[#1E6640] ml-4"
                />
              </div>
            </div>
          )}

          <AlertsCard onCreatePO={() => setShowCreatePO(true)} />
          <POTrackerSection
            onCreatePO={() => setShowCreatePO(true)}
            onViewPO={(po) => setViewPO(po)}
            onNavigate={onNavigate}
          />
          <StockOverview onSeeFullReports={() => setShowFullReports(true)} />
          <IssuedThisMonthCard onNavigate={onNavigate} />
          <ReturnedThisMonthCard onNavigate={onNavigate} />
          <BatchesSection onAddNewStock={() => onNavigate?.("ReceiveStock")} />
          <PurchaseHistorySection onDownloadReport={fn => setPurchaseExport(() => fn)} />
          <MovementHistorySection onDownloadMovementReport={fn => setMovementExport(() => fn)} />
        </div>
        <MaterialsFooter />

        <AddNewStockModal open={showAddStock} onClose={() => setShowAddStock(false)} />
        <FullReportsModal open={showFullReports} onClose={() => setShowFullReports(false)} />
        {purchaseExport && <DownloadReportModal open onClose={() => setPurchaseExport(null)} title="Purchase History Report" onExport={purchaseExport} />}
        {movementExport && <DownloadReportModal open onClose={() => setMovementExport(null)} title="Movement History Report" onExport={movementExport} />}

        <POCreateModal
          open={showCreatePO}
          onClose={() => setShowCreatePO(false)}
          onSubmit={handlePOSubmit}
          nextPONumber={nextPONumber}
        />
        <PODocumentModal
          open={!!viewPO}
          onClose={() => setViewPO(null)}
          po={viewPO}
        />
      </div>
    </MobileCtx.Provider>
  );
}
