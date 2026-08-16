import React from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, Clock, Calendar, Download, FileText } from "lucide-react";
import { T, F, EASE } from "../theme";
import { reportsApi } from "../../../../shared/api/reports";

export function ReportsHeader() {
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
      <div className="pl-4 md:pl-7 xl:pl-12" style={{ position: "relative", zIndex: 3, paddingTop: 48, paddingBottom: 110, flex: "0 0 100%", maxWidth: "100%" }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 36, height: 2, background: `linear-gradient(90deg, ${T.antiqueGold}, rgba(200,155,71,0))` }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "rgba(200,155,71,0.85)", letterSpacing: "1.5px", textTransform: "uppercase" as const, fontWeight: 600 }}>
            BEERE KANCHI SILKS · REPORTS &amp; ANALYTICS
          </span>
        </div>
        {/* Headline */}
        <div style={{ marginBottom: 10, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>
            Reports
          </h1>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400, lineHeight: 1.1 }}>
            &amp; Business Analytics
          </div>
        </div>
        {/* Body */}
        <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", fontWeight: 400, color: "rgba(255,253,249,0.70)", margin: "0 0 20px", lineHeight: 1.6 }}>
          View detailed reports for every part of the business — production, payments, weavers, sales, and customers. Compare periods, download as PDF or Excel, and schedule automatic delivery.
        </p>
      </div>
    </header>
  );
}

import { LuxuryStatsCard } from "../../../../shared/ui/LuxuryStatsCard";

export function ReportsStatsStrip() {
  const { data: schedRes } = useQuery({
    queryKey: ["reports-schedules-list"],
    queryFn: () => reportsApi.listSchedules(),
  });
  const { data: histRes } = useQuery({
    queryKey: ["reports-download-history"],
    queryFn: () => reportsApi.listHistory(),
  });

  const totalGenerated = histRes?.total ?? 0;
  const activeSchedules = (schedRes?.items ?? []).filter((s) => s.active).length;
  const lastItem = histRes?.items?.[0];

  const now = new Date();
  const downloadsThisMonth = (histRes?.items ?? []).filter((h) => {
    const d = new Date(h.downloadedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  let lastGenText = "None";
  if (lastItem) {
    const diffMs = now.getTime() - new Date(lastItem.downloadedAt).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) lastGenText = "Just now";
    else if (diffHours < 24) lastGenText = `${diffHours}h ago`;
    else lastGenText = `${Math.floor(diffHours / 24)}d ago`;
  }

  const statItems = [
    {
      icon: <BarChart2 size={22} color="rgba(245,232,208,0.90)" />,
      label: "Reports Generated",
      value: String(totalGenerated),
      sub: totalGenerated === 0 ? "No reports generated yet" : "Total recorded downloads",
      highlight: false,
    },
    {
      icon: <Clock size={22} color="rgba(245,232,208,0.90)" />,
      label: "Last Generated",
      value: lastGenText,
      sub: lastItem ? lastItem.reportName : "Awaiting first export",
      highlight: false,
    },
    {
      icon: <Calendar size={22} color="rgba(231,201,131,0.95)" />,
      label: "Scheduled Reports",
      value: String(activeSchedules),
      sub: "Active auto-delivery schedules",
      highlight: true,
    },
    {
      icon: <Download size={22} color="rgba(245,232,208,0.90)" />,
      label: "Downloads This Month",
      value: String(downloadsThisMonth),
      sub: `${downloadsThisMonth} recorded this month`,
      highlight: false,
    },
    {
      icon: <FileText size={22} color="rgba(245,232,208,0.90)" />,
      label: "Report Categories",
      value: "8",
      sub: "Full business coverage",
      highlight: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-14 xl:-mt-[80px]"
      style={{ position: "relative", zIndex: 20 }}
    >
      <LuxuryStatsCard stats={statItems} />
    </motion.div>
  );
}

