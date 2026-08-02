import React from "react";
import { motion } from "motion/react";

import { STATS } from "../data/summary";
import { EASE, F, T } from "../theme";
import { AnimCount } from "./common/motion";

export function StatsStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{
        background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
        borderRadius: 28,
        display: "flex",
        alignItems: "stretch",
        boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)",
        overflow: "hidden",
        minHeight: 140,
      }}>
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: s.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1,
              padding: "28px 22px",
              backgroundImage: s.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              backgroundColor: "rgba(0,0,0,0)",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 14,
              position: "relative",
              cursor: "pointer",
            }}
          >
            {/* Icon box */}
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ duration: 0.25 }}
              style={{
                width: 50, height: 50, borderRadius: 15, flexShrink: 0,
                background: s.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)",
                border: `1px solid ${s.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {s.icon}
            </motion.div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10.5, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, color: s.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 44, color: s.gold ? T.goldLight : s.crimson ? "#F47B72" : "#FFFDF9", lineHeight: 1.0, marginBottom: 8 }}>
                <AnimCount raw={s.value} />
              </div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: s.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                {s.sub}
              </div>
            </div>

            {/* Gold shimmer bar on highlighted cell */}
            {s.hi && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})` }} />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
