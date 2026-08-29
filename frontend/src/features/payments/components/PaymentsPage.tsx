import React from "react";
import { F, T } from "../theme";
import { FinancialSummarySection } from "./FinancialSummarySection";
import { MaterialsFooter } from "@/features/materials";
import { PaymentsHeader } from "./PaymentsHeader";
import { StatsStrip } from "./StatsStrip";
import { PaymentAnalyticsSection } from "./analytics/PaymentAnalyticsSection";
import { PaymentHistorySection } from "./history/PaymentHistorySection";
import { VendorPaymentsSection } from "./vendor/VendorPaymentsSection";
import { SupplierPaymentsSection } from "./supplier/SupplierPaymentsSection";
import { WeaverMakingChargesSection } from "./weaver/WeaverMakingChargesSection";
import { WholesaleCollectionsSection } from "./wholesale/WholesaleCollectionsSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function PaymentsPage() {
  return (
    <div style={{ fontFamily: F.ui, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <PaymentsHeader />
      <ErrorBoundary variant="inline">
        <StatsStrip />
      </ErrorBoundary>
      <div style={{ background: T.silkCream, paddingBottom: 48, flex: 1 }}>
        <ErrorBoundary variant="inline">
          <FinancialSummarySection />
        </ErrorBoundary>
        <ErrorBoundary variant="inline">
          <WeaverMakingChargesSection />
        </ErrorBoundary>
        <ErrorBoundary variant="inline">
          <WholesaleCollectionsSection />
        </ErrorBoundary>
        <ErrorBoundary variant="inline">
          <VendorPaymentsSection />
        </ErrorBoundary>
        <ErrorBoundary variant="inline">
          <SupplierPaymentsSection />
        </ErrorBoundary>
        <ErrorBoundary variant="inline">
          <PaymentAnalyticsSection />
        </ErrorBoundary>
        <ErrorBoundary variant="inline">
          <PaymentHistorySection />
        </ErrorBoundary>
      </div>
      <MaterialsFooter />
    </div>
  );
}
