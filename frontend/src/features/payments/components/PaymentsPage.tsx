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

export function PaymentsPage() {
  return (
    <div style={{ fontFamily: F.ui, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <PaymentsHeader />
      <StatsStrip />
      <div style={{ background: T.silkCream, paddingBottom: 0 }}>
        <FinancialSummarySection />
        <WeaverMakingChargesSection />
        <WholesaleCollectionsSection />
        <VendorPaymentsSection />
        <SupplierPaymentsSection />
        <PaymentAnalyticsSection />
        <PaymentHistorySection />
      </div>
      <MaterialsFooter />
    </div>
  );
}
