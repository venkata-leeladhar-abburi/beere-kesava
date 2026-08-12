import React, { useContext } from "react";
import { motion } from "motion/react";
import { T, F, G_GOLD, MobileCtx } from "../theme";
import { FOOTER_LINKS } from "../materialConfig";
export function MaterialsFooter() {
  const { isMobile, px } = useContext(MobileCtx);
  
  return (
    <footer style={{ background: T.darkBurgundy, borderTop: `1px solid rgba(245,232,208,0.1)`, marginTop: 64, position: "relative", overflow: "hidden" }}>
      {/* Subtle Background Elements */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "100%", background: "radial-gradient(ellipse at top right, rgba(245,232,208,0.06), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "40%", height: "100%", background: "radial-gradient(ellipse at bottom left, rgba(245,232,208,0.04), transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, padding: `${isMobile ? 48 : 80}px ${px}px 32px`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 48 : 80, maxWidth: 1600, margin: "0 auto" }}>
        
        {/* Brand Block */}
        <div style={{ flex: "0 0 320px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: T.warmCream, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 12px 32px rgba(0,0,0,0.2)" }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: T.darkBurgundy, fontWeight: 600 }}>BK</span>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: T.warmCream, lineHeight: 1.1 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: "rgba(245,232,208,0.75)", marginTop: 4 }}>&amp; Brothers Silks</div>
              <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 11, color: T.antiqueGold, letterSpacing: "3px", textTransform: "uppercase", marginTop: 4 }}>Est. 1999</div>
            </div>
          </div>
          <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 15, color: "rgba(245,232,208,0.6)", lineHeight: 1.7, margin: "0 0 32px" }}>
            Four generations of master weavers crafting heritage silk sarees. A legacy built on tradition, trust, and timeless quality.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {["f", "in", "yt", "li"].map((s) => (
              <motion.div key={s} whileHover={{ scale: 1.12, y: -2, backgroundColor: T.warmCream, borderColor: "transparent", color: T.darkBurgundy }} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid rgba(245,232,208,0.2)`, background: "rgba(245,232,208,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s ease", color: "rgba(245,232,208,0.7)" }}>
                <span style={{ fontFamily: F.mono, fontSize: 14 }}>{s}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Links Grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(160px, 1fr))", gap: isMobile ? 32 : 48 }}>
          {Object.entries(FOOTER_LINKS).map(([col, links]) => (
            <div key={col}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: T.warmCream, marginBottom: 20 }}>{col}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {links.map(l => (
                  <motion.span key={l} whileHover={{ x: 4, color: T.warmCream }} transition={{ duration: 0.2 }} style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.6)", cursor: "pointer", display: "inline-block" }}>
                    {l}
                  </motion.span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom Bar */}
      <div style={{ position: "relative", zIndex: 2, margin: `0 auto`, maxWidth: 1600, padding: `24px ${px}px 32px`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 0, justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center" }}>
        <div style={{ position: "absolute", top: 0, left: px, right: px, height: 1, background: "linear-gradient(90deg, rgba(245,232,208,0.02) 0%, rgba(245,232,208,0.15) 50%, rgba(245,232,208,0.02) 100%)" }} />
        <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(245,232,208,0.4)" }}>
          © 2026 Beere Kesava &amp; Brothers Silks. All rights reserved.
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 12, color: "rgba(245,232,208,0.6)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Tradition · Trust · Timeless Quality</span>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.antiqueGold, opacity: 0.6 }} />
        </div>
      </div>
    </footer>
  );
}
