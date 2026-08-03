import React from "react";
import { motion } from "motion/react";
import { imgShowroom } from "../../../shared/constants/weaverImages";
// @ts-ignore
import logo from "../../../assets/logo.webp";

const C = {
  darkBg: "#3D0E1A",
  gold:   "#C4923A",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

const PORTALS = ["Superadmin", "Admin", "Worker Staff", "Weaver", "Shop Staff"];

export function LoginBrandPanel() {
  return (
    <div style={{
      width: "45%", minHeight: "100vh", background: C.darkBg,
      position: "relative" as const, overflow: "hidden",
      display: "flex", flexDirection: "column" as const,
    }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img src={imgShowroom} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.15, filter: "saturate(0.6)" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${C.darkBg} 0%, rgba(61,14,26,0.90) 60%, ${C.darkBg} 100%)` }} />
      </div>

      <div style={{ position: "absolute", inset: 0, zIndex: 1, backgroundImage: `repeating-linear-gradient(45deg, rgba(196,146,58,0.025) 0px, rgba(196,146,58,0.025) 1px, transparent 1px, transparent 28px)` }} />

      <div style={{ position: "absolute", right: -120, bottom: -120, width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(196,146,58,0.07)", zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: -60, bottom: -60, width: 340, height: 340, borderRadius: "50%", border: "1px solid rgba(196,146,58,0.04)", zIndex: 1, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, padding: "64px", flex: 1, display: "flex", flexDirection: "column" as const, justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 52 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#FFFFFF", border: "1px solid rgba(196,146,58,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.10)" }}>
            <img src={logo} alt="Beere Kesava Logo" style={{ width: 40, height: 40, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: "#F5EDD0", lineHeight: 1.1 }}>Beere Kesava</div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: "rgba(245,237,208,0.60)", lineHeight: 1.2 }}>& Brothers Silks</div>
            <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase" as const, color: C.gold, marginTop: 6 }}>Since 1999</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          {[
            { text: "Weaving",     italic: false, gold: false },
            { text: "Heritage",    italic: true,  gold: true  },
            { text: "Into Every",  italic: false, gold: false },
            { text: "Thread",      italic: false, gold: false },
          ].map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
              style={{
                fontFamily: F.display,
                fontWeight: 700,
                fontSize: 56,
                fontStyle: line.italic ? "italic" : "normal",
                color: line.gold ? C.gold : "#FFFDF9",
                lineHeight: 1.05,
                letterSpacing: "-0.5px",
              }}
            >
              {line.text}
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 15, color: "rgba(245,237,208,0.55)", lineHeight: 1.75, maxWidth: 340, margin: 0 }}
        >
          Four generations of passion, precision, and pure silk craftsmanship. Welcome back.
        </motion.p>
      </div>

      <div style={{
        position: "absolute" as const, bottom: 40, left: 64, right: 64, zIndex: 2,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 14, padding: "18px 22px",
      }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "rgba(245,237,208,0.40)", marginBottom: 12 }}>
          This system is used by:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px 8px" }}>
          {PORTALS.map(p => (
            <span key={p} style={{
              fontFamily: F.ui, fontSize: 11, fontWeight: 500,
              color: C.gold, background: "rgba(196,146,58,0.14)", border: "1px solid rgba(196,146,58,0.25)",
              borderRadius: 999, padding: "5px 14px",
            }}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
