import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useDesignLibrary } from "@/features/design-library";
import { DesignCodeCard } from "@/features/design-library";
import { SareeTypeCard } from "@/features/pricing";
import { useRatesPricing } from "@/features/pricing";
import { BulkOrderDetailPage } from "@/features/bulk-orders";
import { useBatches } from "../contexts/BatchContext";

import { scrollToTop } from "@/shared/ui/ScrollToTop";

import { F } from "./theme";
import type { BulkOrder } from "./types";
import { PageHeader, StatsStrip } from "./sections/PageHeaderAndStats";
import { BulkOrdersSection } from "./sections/BulkOrdersSection";
import { ActiveBatchesSection } from "./sections/ActiveBatchesSection";
import { BatchTallyPage } from "./BatchTallyPage";
import { DefectiveSareesSection } from "./sections/DefectiveSareesSection";
import { ProductionAnalyticsSection } from "./sections/ProductionAnalyticsSection";
import { ProductionHistorySection } from "./sections/ProductionHistorySection";
import { MaterialsFooter } from "@/features/materials";
import { DesignLibraryLinkCard, AllSareesSection } from "./sections/MiscCards";

/**
 * Composition root for the Production feature. Originally a single
 * 2,898-line file — split into theme/types/data + common primitives +
 * dialogs/ + sections/, all under this same directory. See git history for
 * the pre-split version if you need to trace exactly what moved where.
 *
 * Public API preserved for external consumers (app/pages/index.ts,
 * features/payments/theme.ts, features/bulk-orders/components/AllOrdersPage.tsx,
 * features/dashboards/*, features/qc/components/QcHistoryPage.tsx):
 * `ProductionPage`, `BulkOrder` (type), `BulkOrderCard`, `ProductionDialog`.
 */
export function ProductionPage({ superadmin = false, onNavigate }: { superadmin?: boolean; onNavigate?: (tab: string) => void }) {
  const { getDesign } = useDesignLibrary();
  const [openDesignCode, setOpenDesignCode] = useState<string | null>(null);
  const { getSareeTypeByCode } = useRatesPricing();
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);
  const openDesign = openDesignCode ? getDesign(openDesignCode) : undefined;
  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;
  // "View Order" / "Payment" replace the whole page with the bulk order's own
  // full page — the same pattern the Weavers page uses for a weaver's profile —
  // rather than a cramped modal.
  const [viewingOrder, setViewingOrder] = useState<{ order: BulkOrder; tab: "overview" | "payments" } | null>(null);
  // Batch tally is likewise its own full page rather than a dialog.
  const [tallyBatchId, setTallyBatchId] = useState<string | null>(null);
  const { setPendingOpenBatchId } = useBatches();

  if (viewingOrder) {
    return (
      <BulkOrderDetailPage
        order={viewingOrder.order}
        initialTab={viewingOrder.tab}
        onBack={() => {
          scrollToTop();
          setViewingOrder(null);
        }}
      />
    );
  }

  if (tallyBatchId) {
    return (
      <BatchTallyPage
        batchId={tallyBatchId}
        onBack={() => {
          scrollToTop();
          setTallyBatchId(null);
        }}
        onOpenCreation={() => {
          setPendingOpenBatchId(tallyBatchId);
          onNavigate?.("Batches");
          setTallyBatchId(null);
        }}
      />
    );
  }

  return (
    <div style={{ fontFamily: F.ui, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <PageHeader />
      <StatsStrip />
      <AllSareesSection />
      <div style={{ background: "#F7F2EA", paddingBottom: 48, flex: 1 }}>
        <BulkOrdersSection superadmin={superadmin} onNavigate={onNavigate} onOpenOrder={(order, tab) => {
          scrollToTop();
          setViewingOrder({ order, tab });
        }} />
        <ActiveBatchesSection onNavigate={onNavigate} onOpenTally={id => { window.scrollTo(0, 0); setTallyBatchId(id); }} onDesignClick={setOpenDesignCode} onSareeTypeClick={setOpenSareeTypeCode} />
        <DefectiveSareesSection superadmin={superadmin} onNavigate={onNavigate} onDesignClick={setOpenDesignCode} onSareeTypeClick={setOpenSareeTypeCode} />
        <ProductionAnalyticsSection />
        <DesignLibraryLinkCard onNavigate={onNavigate} />
        <ProductionHistorySection onDesignClick={setOpenDesignCode} onSareeTypeClick={setOpenSareeTypeCode} />
      </div>
      <MaterialsFooter />
      <AnimatePresence>
        {openDesign && <DesignCodeCard design={openDesign} onClose={() => setOpenDesignCode(null)} />}
        {openSareeType && <SareeTypeCard sareeType={openSareeType} onClose={() => setOpenSareeTypeCode(null)} />}
      </AnimatePresence>
    </div>
  );
}

export type { BulkOrder } from "./types";
export { BulkOrderCard } from "./sections/BulkOrdersSection";
export { ProductionDialog } from "./common/primitives";
export { OrderDialogContent } from "./dialogs/OrderDialogContent";
