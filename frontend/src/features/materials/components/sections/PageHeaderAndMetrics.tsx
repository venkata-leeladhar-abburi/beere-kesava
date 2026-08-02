import React, { useContext } from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { ImageWithFallback } from "../../../../shared/ui/ImageWithFallback";
import { imgWarp } from "../../../../shared/constants/imageData";
import { T, F, EASE, G_CARD, NUM, MobileCtx } from "../theme";
import { MATERIAL_METRICS } from "../data";
import { AnimatedNumber } from "../common/primitives";

export function PageHeader() {
  const { px } = useContext(MobileCtx);
  return (
    <header style={{ background: T.darkBurgundy, position: "relative", overflow: "hidden", minHeight: 380, display: "flex", alignItems: "center" }}>
      <div style={{ position: "relative", zIndex: 2, padding: `48px ${px}px 90px`, flex: "0 0 65%", maxWidth: "65%" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 12 }}>
          Since 1999 · Raw Material Management
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontFamily: F.display, fontSize: 52, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Materials</h1>
          <span style={{ fontFamily: F.display, fontSize: 32, fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Inventory Overview</span>
        </div>
        <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 16, color: "rgba(255,253,249,0.70)", lineHeight: 1.6, maxWidth: 600, margin: "0 0 20px" }}>
          See all raw materials in stock — Warp, Resham, and Jari. Track what was received, what was given to weavers, and what is remaining.
        </p>
      </div>

      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, ${T.darkBurgundy} 0%, rgba(61,14,26,0.65) 38%, rgba(61,14,26,0.10) 100%)` }} />
        <ImageWithFallback src={imgWarp} alt="Silk warp thread material" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.65) saturate(0.85)" }} />
      </div>
    </header>
  );
}

export function MetricsBar() {
  const { px } = useContext(MobileCtx);
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      style={{ padding: `0 ${px}px`, marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: G_CARD, borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {MATERIAL_METRICS.map((m, i) => (
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {m.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: m.hi ? T.goldLight : T.warmCream, lineHeight: 1.0, marginBottom: 8, ...NUM }}>
                <AnimatedNumber raw={m.val} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
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
