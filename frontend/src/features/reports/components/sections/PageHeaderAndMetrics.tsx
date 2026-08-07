import React from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, Clock, Calendar, Download, FileText } from "lucide-react";
import { imgSaree } from "../../../../shared/constants/weaverImages";
import { T, F, EASE } from "../theme";
import { AnimCount } from "../common/primitives";
import { reportsApi } from "../../../../shared/api/reports";

export function ReportsHeader() {
  return (
    <header style={{ background: "linear-gradient(135deg, #2C0913 0%, #4A061B 50%, #3D0E1A 100%)", position: "relative", overflow: "hidden", minHeight: 480, display: "flex", alignItems: "center" }}>
      {/* Decorative gold rings */}
      <div style={{ position: "absolute", right: -80, top: -100, width: 560, height: 560, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.10)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", right: -20, top: -30, width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.07)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", right: 60, bottom: -80, width: 280, height: 280, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.05)", pointerEvents: "none", zIndex: 1 }} />

      {/* Right — photography */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "55%", zIndex: 1 }}>
        {/* Primary left-to-right fade — eased multi-stop */}
        <div style={{ position: "absolute", inset: 0, zIndex: 3, background: `linear-gradient(to right, #2C0913 0%, #2C0913 4%, rgba(44,9,19,0.97) 10%, rgba(44,9,19,0.88) 20%, rgba(44,9,19,0.70) 32%, rgba(44,9,19,0.45) 48%, rgba(44,9,19,0.20) 65%, rgba(44,9,19,0.06) 82%, transparent 100%)` }} />
        {/* Bottom vignette for depth */}
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to top, rgba(44,9,19,0.55) 0%, transparent 45%)` }} />
        {/* Top vignette */}
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to bottom, rgba(44,9,19,0.35) 0%, transparent 30%)` }} />
        <img src={imgSaree} alt="Banarasi silk saree" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.78) saturate(0.88)" }} />
      </div>

      {/* Cross-hatch grid overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 56px, rgba(200,155,71,0.022) 56px, rgba(200,155,71,0.022) 57px), repeating-linear-gradient(90deg, transparent, transparent 56px, rgba(200,155,71,0.014) 56px, rgba(200,155,71,0.014) 57px)` }} />

      {/* Left content */}
      <div style={{ position: "relative", zIndex: 3, padding: "64px 0 148px 56px", flex: "0 0 62%", maxWidth: "62%" }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 2, background: `linear-gradient(90deg, ${T.antiqueGold}, rgba(200,155,71,0))` }} />
          <span style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(200,155,71,0.85)", letterSpacing: "3px", textTransform: "uppercase" as const, fontWeight: 600 }}>
            Beere Kanchi Silks · Reports &amp; Analytics
          </span>
        </div>
        {/* Headline */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: F.display, fontSize: 72, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.0, letterSpacing: "-1px" }}>
            Reports
          </h1>
          <div style={{ fontFamily: F.display, fontSize: 38, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400, letterSpacing: "-0.4px", marginTop: 6, lineHeight: 1.1 }}>
            &amp; Business Analytics
          </div>
        </div>
        {/* Body */}
        <p style={{ fontFamily: F.ui, fontSize: 16, color: "rgba(255,253,249,0.65)", margin: "0", maxWidth: 520, lineHeight: 1.70 }}>
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
      style={{ padding: "0 48px", marginTop: -80, position: "relative", zIndex: 20 }}
    >
      <div style={{
        background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
        borderRadius: 28,
        display: "flex",
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
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: m.hi ? T.goldLight : "#FFFDF9", lineHeight: 1.0, marginBottom: 8 }}>
                <AnimCount raw={m.val} />
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

