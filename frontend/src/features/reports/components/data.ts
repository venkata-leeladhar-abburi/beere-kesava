import React from "react";
import { BarChart2, Clock, Calendar, Download, FileText } from "lucide-react";

// Unused legacy hero background — kept from the pre-split file for parity.
export const imgHeaderBg = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

// ── SECTION 1 — PAGE HEADER (HERO) ──────────────────────────────────────────
export const REPORTS_CHIPS = [
  { value: "8",        label: "Report Categories"      },
  { value: "All Periods", label: "Date Range Support"  },
  { value: "PDF & Excel", label: "Export Formats"      },
  { value: "5 Active", label: "Scheduled Reports"      },
];

// ── SECTION 2 — STATS STRIP ──────────────────────────────────────────────────
// MOCK: these are meta-stats about report *usage* (reports generated, last
// generated, downloads this month) — no backend endpoint tracks that
// activity (see the "no download history" gap noted in
// DownloadHistorySection.tsx and the "no scheduling backend" gap in
// ScheduledReportsSection.tsx). Static hero copy until that exists.
export const REPORT_METRICS = [
  {
    ico: React.createElement(BarChart2, { size: 22, color: "rgba(245,232,208,0.90)" }),
    label: "Reports Generated",
    val: "34",
    sub: "All admin users · May 2026",
    hi: false,
  },
  {
    ico: React.createElement(Clock, { size: 22, color: "rgba(245,232,208,0.90)" }),
    label: "Last Generated",
    val: "2 hrs ago",
    sub: "Weaver Payment Report",
    hi: false,
  },
  {
    ico: React.createElement(Calendar, { size: 22, color: "rgba(231,201,131,0.95)" }),
    label: "Scheduled Reports",
    val: "5",
    sub: "Auto-sent every month",
    hi: true,
  },
  {
    ico: React.createElement(Download, { size: 22, color: "rgba(245,232,208,0.90)" }),
    label: "Downloads This Month",
    val: "18",
    sub: "PDF: 12 · Excel: 6",
    hi: false,
  },
  {
    ico: React.createElement(FileText, { size: 22, color: "rgba(245,232,208,0.90)" }),
    label: "Report Categories",
    val: "8",
    sub: "Full business coverage",
    hi: false,
  },
];
