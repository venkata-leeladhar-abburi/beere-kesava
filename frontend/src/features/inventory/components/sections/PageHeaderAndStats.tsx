import React from "react";
import { motion } from "motion/react";
import { Package, Clock, CheckCircle2, Truck, AlertTriangle } from "lucide-react";
import { T, F } from "../theme";
import inventoryHero from "../../../../assets/inline/inventoryHero.jpg";

import { LuxuryStatsCard } from "../../../../shared/ui/LuxuryStatsCard";

interface PageHeaderAndStatsProps {
  total: number;
  pendingCount: number;
  ready: number;
  thisMonth: number;
  damaged: number;
}

export function PageHeaderAndStats({
  total,
  pendingCount,
  ready,
  thisMonth,
  damaged,
}: PageHeaderAndStatsProps) {
  const statItems = [
    { label: "TOTAL IN INVENTORY", value: String(total), sub: "All QC-passed stock", icon: <Package size={22} color="rgba(245,232,208,0.90)" />, highlight: false },
    { label: "PENDING FINISHING", value: String(pendingCount), sub: "QC passed, needs finishing", icon: <Clock size={22} color="rgba(245,232,208,0.90)" />, highlight: false },
    { label: "READY FOR DISPATCH", value: String(ready), sub: "Cleared, awaiting dispatch", icon: <CheckCircle2 size={22} color="rgba(245,232,208,0.90)" />, highlight: true, goldVal: true },
    { label: "DISPATCHED THIS MONTH", value: String(thisMonth), sub: "To shop + wholesale", icon: <Truck size={22} color="rgba(245,232,208,0.90)" />, highlight: false },
    { label: "DAMAGED — NEEDS REVIEW", value: String(damaged), sub: "Reported during verification", icon: <AlertTriangle size={22} color="rgba(245,232,208,0.90)" />, crimson: damaged > 0 },
  ];

  return (
    <>
      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
        {/* Left text content */}
        <div className="pl-4 md:pl-7 xl:pl-14 w-full xl:w-auto xl:basis-[64%] xl:max-w-[64%]" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase" as const, marginBottom: 12 }}>SINCE 1999 · INVENTORY MANAGEMENT</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" as const, marginBottom: 10 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Finished Goods</h1>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Dispatch</span>
          </div>
          <p style={{ fontFamily: F.ui, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", margin: 0, maxWidth: "min(600px, 100%)", lineHeight: 1.6 }}>
            Track all finished sarees received from quality check and dispatch them to shop or wholesale customers.
          </p>
        </div>
        {/* Right image with gradient */}
        <div className="hidden xl:block" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)` }} />
          <img src={inventoryHero} alt="Silk saree inventory" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
        </div>
      </header>

      {/* ── FLOATING STAT STRIP ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="px-4 md:px-7 xl:px-14 -mt-8 md:-mt-12 xl:-mt-[72px]"
        style={{ position: "relative", zIndex: 20 }}
      >
        <LuxuryStatsCard stats={statItems} />
      </motion.div>
    </>
  );
}
