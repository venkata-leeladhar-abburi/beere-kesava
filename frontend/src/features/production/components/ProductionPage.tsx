import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useDesignLibrary } from "../../design-library/contexts/DesignLibraryContext";
import { DesignCodeCard } from "../../design-library/components/DesignLibraryPage";
import { SareeTypeCard, getSareeTypeByCode } from "../../pricing/components/RatesPricingPage";
import { BulkOrderDetailPage } from "../../bulk-orders/components/BulkOrderDetailPage";

import { F } from "./theme";
import type { BulkOrder } from "./types";
import { PageHeader, StatsStrip } from "./sections/PageHeaderAndStats";
import { BulkOrdersSection } from "./sections/BulkOrdersSection";
import { ActiveBatchesSection } from "./sections/ActiveBatchesSection";
import { DefectiveSareesSection } from "./sections/DefectiveSareesSection";
import { ProductionAnalyticsSection } from "./sections/ProductionAnalyticsSection";
import { ProductionHistorySection } from "./sections/ProductionHistorySection";
import { ProductionFooter } from "./sections/ProductionFooter";
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
  const [openSareeTypeCode, setOpenSareeTypeCode] = useState<string | null>(null);
  const openDesign = openDesignCode ? getDesign(openDesignCode) : undefined;
  const openSareeType = openSareeTypeCode ? getSareeTypeByCode(openSareeTypeCode) : undefined;
  // "View Order" / "Payment" replace the whole page with the bulk order's own
  // full page — the same pattern the Weavers page uses for a weaver's profile —
  // rather than a cramped modal.
  const [viewingOrder, setViewingOrder] = useState<{ order: BulkOrder; tab: "overview" | "payments" } | null>(null);

  if (viewingOrder) {
    return (
      <BulkOrderDetailPage
        order={viewingOrder.order}
        initialTab={viewingOrder.tab}
        onBack={() => setViewingOrder(null)}
      />
    );
  }

  return (
    <div style={{ fontFamily: F.ui }}>
      <PageHeader />
      <StatsStrip />
      <AllSareesSection />
      <div style={{ background: "#F7F2EA", paddingBottom: 0 }}>
        <BulkOrdersSection superadmin={superadmin} onNavigate={onNavigate} onOpenOrder={(order, tab) => setViewingOrder({ order, tab })} />
        <ActiveBatchesSection onNavigate={onNavigate} onDesignClick={setOpenDesignCode} onSareeTypeClick={setOpenSareeTypeCode} />
        <DefectiveSareesSection superadmin={superadmin} onNavigate={onNavigate} onDesignClick={setOpenDesignCode} onSareeTypeClick={setOpenSareeTypeCode} />
        <ProductionAnalyticsSection />
        <DesignLibraryLinkCard onNavigate={onNavigate} />
        <ProductionHistorySection onDesignClick={setOpenDesignCode} onSareeTypeClick={setOpenSareeTypeCode} />
      </div>
      <ProductionFooter />
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
export { ContextBatchDetailsDialog } from "./sections/batches/ContextBatchCard";
