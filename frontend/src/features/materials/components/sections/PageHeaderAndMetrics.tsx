import React, { useContext } from "react";
import { motion } from "motion/react";
import { Package, Layers, Palette, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { T, F, EASE, MobileCtx } from "../theme";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { AnimatedNumber } from "../common/primitives";
import { jariToReels } from "../../../../shared/lib/weightUnits";
import { LuxuryStatsCard } from "../../../../shared/ui/LuxuryStatsCard";

export function PageHeader() {
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
      <div className="px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
        <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
          Since 1999 · Admin · Materials
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Receive Stock</h1>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 5vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Goods Receipt Note</span>
        </div>
        <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontWeight: 400, fontSize: "clamp(14px, 2.2vw, 16px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, margin: 0 }}>
          Record incoming raw materials from vendors against purchase orders and generate GRN numbers.
        </p>
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
  const warpSarees = Math.floor(warpKg * 2.5);

  const reshamItems = stockItems.filter(i => i.materialType === "RESHAM");
  const reshamKg = reshamItems.reduce((s, i) => s + Number(i.currentStock), 0);
  const reshamColors = new Set(reshamItems.map(i => i.color).filter(Boolean)).size;

  // Jari is always tallied in Reels — never sum raw quantities of mismatched
  // units (a stock row might be recorded in KG or Buns).
  const jariItems = stockItems.filter(i => i.materialType === "JARI");
  const displayJariReels = jariItems.reduce((s, i) => s + jariToReels(Number(i.currentStock), i.unit || "Reels"), 0);
  const displayJariBuns = displayJariReels / 4;

  const totalStockKg = Math.round(warpKg + reshamKg);

  const materialMetrics = [
    {
      label: "Total In Stock",
      val: stockLoading ? "0" : String(totalStockKg),
      sub: "kg Warp & Resham",
      hi: false,
    },
    {
      label: "Warp Available",
      val: stockLoading ? "0" : String(Math.round(warpKg)),
      sub: `${warpSarees} sarees`,
      hi: false,
    },
    {
      label: "Resham Available",
      val: stockLoading ? "0" : String(Math.round(reshamKg)),
      sub: `${reshamColors} colors`,
      hi: false,
    },
    {
      label: "Jari Alerts",
      val: stockLoading ? "0 Buns" : `${Math.round(displayJariBuns)} Buns`,
      sub: `${Math.round(displayJariReels)} Reels`,
      hi: true,
    },
  ];

  const ICONS = [
    <Package key="package" size={22} color={T.warmCream} />,
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
