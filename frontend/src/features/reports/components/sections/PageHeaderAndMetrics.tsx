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

  const metrics = [
    {
      ico: <BarChart2 size={22} color="rgba(245,232,208,0.90)" />,
      label: "Reports Generated",
      val: String(totalGenerated),
      sub: totalGenerated === 0 ? "No reports generated yet" : "Total recorded downloads",
      hi: false,
    },
    {
      ico: <Clock size={22} color="rgba(245,232,208,0.90)" />,
      label: "Last Generated",
      val: lastGenText,
      sub: lastItem ? lastItem.reportName : "Awaiting first export",
      hi: false,
    },
    {
      ico: <Calendar size={22} color="rgba(231,201,131,0.95)" />,
      label: "Scheduled Reports",
      val: String(activeSchedules),
      sub: "Active auto-delivery schedules",
      hi: true,
    },
    {
      ico: <Download size={22} color="rgba(245,232,208,0.90)" />,
      label: "Downloads This Month",
      val: String(downloadsThisMonth),
      sub: `${downloadsThisMonth} recorded this month`,
      hi: false,
    },
    {
      ico: <FileText size={22} color="rgba(245,232,208,0.90)" />,
      label: "Report Categories",
      val: "8",
      sub: "Full business coverage",
      hi: false,
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
      <div className="grid grid-cols-2 xl:flex" style={{
        background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
        borderRadius: 28,
        alignItems: "stretch",
        boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)",
        overflow: "hidden",
        minHeight: 148,
      }}>
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09, ease: EASE }}
            style={{
              flex: 1,
              padding: "28px 24px",
              backgroundImage: m.hi ? "linear-gradient(135deg,rgba(200,155,71,0.22) 0%,rgba(200,155,71,0.07) 100%)" : "none",
              borderRight: i < metrics.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 16,
              position: "relative" as const,
              cursor: "pointer",
            }}
          >
            {/* Gold top shimmer on highlighted */}
            {m.hi && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.antiqueGold},${T.goldLight})` }} />
            )}
            {/* Icon box */}
            <div style={{
              width: 50, height: 50, borderRadius: 15, flexShrink: 0,
              background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)",
              border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {m.ico}
            </div>
            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.70)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(28px, 8vw, 48px)", color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                {m.val}
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.90)" : "rgba(245,232,208,0.55)", letterSpacing: "0.1px" }}>
                {m.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

