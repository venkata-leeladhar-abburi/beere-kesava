import React from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Layers, Factory, CheckCircle2, AlertCircle } from "lucide-react";
import { imgSaree as imgSareeHero } from "../../../../shared/constants/weaverImages";
import { T, F } from "../theme";
import { useBatches } from "../../contexts/BatchContext";
import { qcApi } from "../../../../shared/api/qc";

import { LuxuryStatsCard } from "../../../../shared/ui/LuxuryStatsCard";

function isSameMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function PageHeader() {
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
      <div className="pl-4 md:pl-7 xl:pl-12 w-full xl:w-auto xl:basis-[65%] xl:max-w-[65%]" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 90 }}>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>SINCE 1999 · PRODUCTION MANAGEMENT</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Production</h1>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Batch Overview</span>
        </div>
        <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: "0 0 20px", lineHeight: 1.6 }}>
          See all active batches, track saree production at every stage, manage quality check, assign finishing work, and monitor bulk order progress — all in one place.
        </p>
      </div>
      <div className="hidden xl:block" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)` }} />
        <img src={imgSareeHero} alt="Banarasi silk saree" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
      </div>
    </header>
  );
}

export function StatsStrip() {
  const { batches } = useBatches();
  const { data: qcRecords = [] } = useQuery({
    queryKey: ["qc", "stats-strip"],
    queryFn: () => qcApi.list().then(r => r.items),
  });

  const now = new Date();
  const activeBatches = batches.filter(b => b.status === "active" || b.status === "draft");
  const sareesInProduction = batches.reduce(
    (sum, b) => sum + b.rows.filter(r => r.sareeId && !r.qcPassed && !r.finished).length,
    0,
  );
  const completedThisMonthIds = new Set<string>();
  qcRecords.forEach(r => {
    if (r.result === "PASSED" && isSameMonth(r.qcDate, now)) completedThisMonthIds.add(r.sareeId);
  });
  batches.forEach(b => {
    b.rows.forEach(r => {
      if (r.sareeId && r.finished && r.finishedAt && isSameMonth(r.finishedAt, now)) {
        completedThisMonthIds.add(r.sareeId);
      }
    });
  });
  const sareesCompletedThisMonth = completedThisMonthIds.size;
  const sareesWaitingQc = batches.reduce(
    (sum, b) => sum + b.rows.filter(r => r.sareeId && r.receivedAt && !r.qcPassed && b.status !== "draft").length,
    0,
  );

  const statItems = [
    { label: "TOTAL BATCHES ACTIVE RIGHT NOW", value: String(activeBatches.length), sub: "Across all weavers currently", icon: <Layers size={22} color={T.warmCream} />, highlight: false },
    { label: "SAREES BEING PRODUCED", value: String(sareesInProduction), sub: "In progress across all batches", icon: <Factory size={22} color={T.warmCream} />, highlight: false },
    { label: "SAREES COMPLETED THIS MONTH", value: String(sareesCompletedThisMonth), sub: "QC-passed so far this month", icon: <CheckCircle2 size={22} color={T.warmCream} />, highlight: true, goldVal: true },
    { label: "SAREES WAITING FOR QUALITY CHECK", value: String(sareesWaitingQc), sub: sareesWaitingQc > 0 ? "⚠ Need quality check" : "All caught up", icon: <AlertCircle size={22} color={T.warmCream} />, crimson: sareesWaitingQc > 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-12 xl:-mt-[72px]"
      style={{ position: "relative", zIndex: 20 }}
    >
      <LuxuryStatsCard stats={statItems} />
    </motion.div>
  );
}
