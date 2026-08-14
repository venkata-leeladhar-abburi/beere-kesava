import React, { useState } from "react";
import { OutstandingPage } from "@/features/payments";

import { T, F } from "./theme";
import type { ReportTabKey } from "./types";
import { ReportsHeader, ReportsStatsStrip } from "./sections/PageHeaderAndMetrics";
import { ReportTabNav } from "./sections/ReportTabNav";
import { RawMaterialReport } from "./sections/RawMaterialReport";
import { SareeProductionReport } from "./sections/SareeProductionReport";
import { WeaverPaymentReport } from "./sections/WeaverPaymentReport";
import { RetailSalesReport } from "./sections/RetailSalesReport";
import { WholesaleSalesReport } from "./sections/WholesaleSalesReport";
import { ProfitLossReport } from "./sections/ProfitLossReport";
import { CustomerReport } from "./sections/CustomerReport";
import { OverdueAlertsReport } from "./sections/OverdueAlertsReport";
import { OutstandingPaymentsReport } from "./sections/OutstandingPaymentsReport";
import { LiveSummarySnapshot } from "./sections/LiveSummarySnapshot";
import { ScheduledReportsSection } from "./sections/ScheduledReportsSection";
import { DownloadHistorySection } from "./sections/DownloadHistorySection";
import { ReportsFooter } from "./sections/ReportsFooter";

/**
 * Composition root for the Reports feature. Originally a single
 * 2,705-line file — split into theme/types/data + common primitives +
 * sections/, all under this same directory (see git history for the
 * pre-split version if you need to trace exactly what moved where).
 */
export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTabKey>("production");
  const [activePeriod, setActivePeriod] = useState("This Month");
  const [compareOn, setCompareOn] = useState(false);

  const TAB_CONTENT: Record<ReportTabKey, React.ReactNode> = {
    "raw-material":   <RawMaterialReport />,
    "production":     <SareeProductionReport />,
    "outstanding":    <OutstandingPage embedded />,
    "outstanding-payments": <OutstandingPaymentsReport />,
    "weaver-payment": <WeaverPaymentReport />,
    "retail":         <RetailSalesReport />,
    "wholesale":      <WholesaleSalesReport />,
    "pnl":            <ProfitLossReport />,
    "customers":      <CustomerReport />,
    "overdue":        <OverdueAlertsReport />,
  };

  return (
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100dvh" }}>
      <ReportsHeader />
      <div style={{ paddingBottom: 36, background: T.silkCream }}>
        <ReportsStatsStrip />
        <LiveSummarySnapshot />
      </div>
      <ReportTabNav
        activeTab={activeTab} setActiveTab={setActiveTab}
        activePeriod={activePeriod} setActivePeriod={setActivePeriod}
        compareOn={compareOn} setCompareOn={setCompareOn}
      />
      <div style={{ background: T.silkCream }}>
        {TAB_CONTENT[activeTab]}
        <ScheduledReportsSection />
        <DownloadHistorySection />
      </div>
      <ReportsFooter />
    </div>
  );
}
