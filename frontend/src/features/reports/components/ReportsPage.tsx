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
import { ReportPeriodProvider, useReportPeriod } from "./PeriodContext";

/**
 * Composition root for the Reports feature. Originally a single
 * 2,705-line file — split into theme/types/data + common primitives +
 * sections/, all under this same directory (see git history for the
 * pre-split version if you need to trace exactly what moved where).
 */
export function ReportsPage() {
  return (
    <ReportPeriodProvider>
      <ReportsPageInner />
    </ReportPeriodProvider>
  );
}

function ReportsPageInner() {
  const [activeTab, setActiveTab] = useState<ReportTabKey>("production");
  // The period selection lives in context so every section can actually
  // filter against it, rather than being local state nothing downstream read.
  const { period, setPeriod, custom, setCustom, compareOn, setCompareOn, label, priorLabel } = useReportPeriod();

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
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <ReportsHeader />
      <div style={{ paddingBottom: 36, background: T.silkCream }}>
        <ReportsStatsStrip />
        <LiveSummarySnapshot />
      </div>
      <ReportTabNav
        activeTab={activeTab} setActiveTab={setActiveTab}
        activePeriod={period} setActivePeriod={setPeriod}
        custom={custom} setCustom={setCustom}
        compareOn={compareOn} setCompareOn={setCompareOn}
        periodLabel={label} priorLabel={priorLabel}
      />
      <div style={{ background: T.silkCream, flex: 1 }}>
        {TAB_CONTENT[activeTab]}
        <ScheduledReportsSection />
        <DownloadHistorySection />
      </div>
      <ReportsFooter />
    </div>
  );
}
