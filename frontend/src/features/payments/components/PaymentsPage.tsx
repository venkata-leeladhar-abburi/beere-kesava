import React from "react";
import { F, T } from "../theme";
import { FinancialSummarySection } from "./FinancialSummarySection";
import { PaymentsFooter } from "./PaymentsFooter";
import { PaymentsHeader } from "./PaymentsHeader";
import { StatsStrip } from "./StatsStrip";
import { PaymentAnalyticsSection } from "./analytics/PaymentAnalyticsSection";
import { PaymentHistorySection } from "./history/PaymentHistorySection";
import { VendorPaymentsSection } from "./vendor/VendorPaymentsSection";
import { WeaverMakingChargesSection } from "./weaver/WeaverMakingChargesSection";
import { WholesaleCollectionsSection } from "./wholesale/WholesaleCollectionsSection";

export function PaymentsPage() {
  return (
    <div style={{ fontFamily: F.ui }}>
      <PaymentsHeader />
      <StatsStrip />
      <div style={{ background: T.silkCream, paddingBottom: 0 }}>
        <FinancialSummarySection />
        <WeaverMakingChargesSection />
        <WholesaleCollectionsSection />
        <VendorPaymentsSection />
        <PaymentAnalyticsSection />
        <PaymentHistorySection />
      </div>
      <PaymentsFooter />
    </div>
  );
}
