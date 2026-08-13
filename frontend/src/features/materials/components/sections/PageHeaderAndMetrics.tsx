import React, { useContext } from "react";
import { motion } from "motion/react";
import { ChevronRight, Package, Layers, Palette, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ImageWithFallback } from "../../../../shared/ui/ImageWithFallback";
import { imgWarp } from "../../../../shared/constants/imageData";
import { T, F, EASE, G_CARD, NUM, MobileCtx } from "../theme";
import { rawMaterialsApi } from "../../../../shared/api/rawMaterials";
import { AnimatedNumber } from "../common/primitives";

export function PageHeader() {
  const { px } = useContext(MobileCtx);
  return (
    <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
      <div style={{ position: "relative", zIndex: 2, padding: `48px 0 110px ${px}px`, flex: "0 0 100%", maxWidth: "100%" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
          Since 1999 · Admin · Materials
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 8vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Receive Stock</h1>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 6vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Goods Receipt Note</span>
        </div>
        <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: "clamp(15px, 3.5vw, 18px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, maxWidth: 600, margin: "0 0 20px" }}>
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

  const jariItems = stockItems.filter(i => i.materialType === "JARI");
  const jariBuns = jariItems
    .filter(i => (i.unit ?? "").toLowerCase().includes("bun"))
    .reduce((s, i) => s + Number(i.currentStock), 0);
  const jariReels = jariItems
    .filter(i => (i.unit ?? "").toLowerCase().includes("reel"))
    .reduce((s, i) => s + Number(i.currentStock), 0);

  const totalJariStock = jariItems.reduce((s, i) => s + Number(i.currentStock), 0);
  const displayJariBuns = jariBuns > 0 ? jariBuns : totalJariStock;
  const displayJariReels = jariReels > 0 ? jariReels : totalJariStock * 4;

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
    <Package size={22} color={T.warmCream} />,
    <Layers size={22} color={T.warmCream} />,
    <Palette size={22} color={T.warmCream} />,
    <Bell size={22} color={T.warmCream} />,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      className="-mt-8 md:-mt-12 xl:-mt-[72px]"
      style={{ padding: `0 ${px}px`, position: "relative", zIndex: 20 }}
    >
      <div className="grid grid-cols-2 xl:flex" style={{ background: G_CARD, borderRadius: 28, alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {materialMetrics.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 22px",
              backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              backgroundColor: "rgba(0,0,0,0)",
              borderRight: i < 3 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative",
              cursor: "pointer",
            }}
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ duration: 0.25 }}
              style={{ width: 50, height: 50, borderRadius: 15, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {ICONS[i]}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: "clamp(28px, 8vw, 48px)", color: m.hi ? T.goldLight : T.warmCream, lineHeight: 1.0, marginBottom: 8, ...NUM }}>
                <AnimatedNumber raw={m.val} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                  {m.sub}
                </span>
                {m.hi && (
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    style={{ width: 20, height: 20, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.38)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(200,155,71,0.10)" }}
                  >
                    <ChevronRight size={10} color={T.goldLight} />
                  </motion.div>
                )}
              </div>
            </div>
            {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
