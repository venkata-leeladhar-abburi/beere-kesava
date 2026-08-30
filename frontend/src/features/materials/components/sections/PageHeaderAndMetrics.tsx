import React, { useContext } from "react";
import { motion } from "motion/react";
import { Layers, Palette, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { T, F, EASE, MobileCtx } from "../theme";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { AnimatedNumber } from "../common/primitives";
import { jariToReels } from "../../../../shared/lib/weightUnits";
import { LuxuryStatsCard } from "../../../../shared/ui/LuxuryStatsCard";
import { BG_IMAGE } from "@/shared/ui/heroBackgrounds";

export function PageHeader() {
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${BG_IMAGE})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.22, pointerEvents: "none"
      }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,2,7,0.75) 0%, #0D0207 100%)", pointerEvents: "none" }} />

      <div className="px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
        <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
          Since 1999 · Admin · Materials
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Materials</h1>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 5vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Stock Overview</span>
        </div>
        <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontWeight: 400, fontSize: "clamp(14px, 2.2vw, 16px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, margin: "0 0 16px" }}>
          Track raw material stock, purchase orders, and batch movement across warp, resham, and jari.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { text: "SINCE 1999 · ADMIN PORTAL", color: T.antiqueGold },
            { text: "RAW MATERIALS" },
            { text: "STOCK & PURCHASE ORDERS" },
          ].map((p) => (
            <div key={p.text} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "5px 14px" }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: p.color || "#FFF" }}>{p.text}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

export function MetricsBar() {
  const { px } = useContext(MobileCtx);
  const { data: stockRes, isLoading: stockLoading } = useQuery({
    queryKey: ["raw-material-stock-list"],
    queryFn: () => rawMaterialsApi.listStock(),
  });
  const stockItems = stockRes?.items ?? [];

  const warpItems = stockItems.filter(i => i.materialType === "WARP");
  const warpKg = warpItems.reduce((s, i) => s + Number(i.currentStock), 0);

  const reshamItems = stockItems.filter(i => i.materialType === "RESHAM");
  const reshamKg = reshamItems.reduce((s, i) => s + Number(i.currentStock), 0);

  // Jari is always tallied in Reels — never sum raw quantities of mismatched
  // units (a stock row might be recorded in KG or Buns). 1 Reel = 4 Buns, so
  // the Buns figure is derived by multiplying, not dividing.
  const jariItems = stockItems.filter(i => i.materialType === "JARI");
  const displayJariReels = jariItems.reduce((s, i) => s + jariToReels(Number(i.currentStock), i.unit || "Reels"), 0);
  const displayJariBuns = displayJariReels * 4;

  const materialMetrics = [
    {
      label: "Total Warp",
      val: stockLoading ? "0" : String(Math.round(warpKg)),
      sub: `${warpItems.length} stock ${warpItems.length === 1 ? "entry" : "entries"}`,
      hi: false,
    },
    {
      label: "Total Resham",
      val: stockLoading ? "0" : String(Math.round(reshamKg)),
      sub: `${reshamItems.length} stock ${reshamItems.length === 1 ? "entry" : "entries"}`,
      hi: false,
    },
    {
      label: "Total Jari",
      // Reels is the canonical unit Jari is tracked in everywhere else in
      // the app — shown as the headline figure, with the Buns equivalent
      // (1 Reel = 4 Buns) as the sub-line, not the other way round.
      val: stockLoading ? "0 Reels" : `${Math.round(displayJariReels)} Reels`,
      sub: `${Math.round(displayJariBuns)} Buns`,
      hi: true,
    },
  ];

  const ICONS = [
    <Layers key="layers" size={22} color={T.warmCream} />,
    <Palette key="palette" size={22} color={T.warmCream} />,
    <Bell key="bell" size={22} color={T.warmCream} />,
  ];

  const statItems = materialMetrics.map((m, i) => ({
    label: m.label,
    value: <AnimatedNumber raw={m.val} />,
    sub: m.sub,
    icon: ICONS[i],
    highlight: m.hi,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      className="-mt-8 md:-mt-12 xl:-mt-[72px]"
      style={{ padding: `0 ${px}px`, position: "relative", zIndex: 20 }}
    >
      <LuxuryStatsCard stats={statItems} />
    </motion.div>
  );
}
