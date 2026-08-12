import React, { useContext } from "react";
import { motion } from "motion/react";
import { T, F, MobileCtx } from "../theme";
import { FOOTER_LINKS } from "../materialConfig";
export function MaterialsFooter() {
  const { isMobile, px } = useContext(MobileCtx);
  
  return (
    <footer style={{ background: "linear-gradient(180deg, #1A040B 0%, #0D0207 100%)", marginTop: 56, position: "relative", overflow: "hidden" }}>
      {/* Decorative Backgrounds */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 56px, rgba(200,155,71,0.015) 56px, rgba(200,155,71,0.015) 57px), repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.012) 80px, rgba(200,155,71,0.012) 81px)` }} />
      <div style={{ position: "absolute", top: "-30%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(200,155,71,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(110,15,45,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, padding: `${isMobile ? 40 : 72}px ${px}px 0`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 40 : 64, maxWidth: 1600, margin: "0 auto" }}>
        
        {/* Brand Block */}
        <div style={{ flex: "0 0 300px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, rgba(200,155,71,0.15) 0%, rgba(200,155,71,0.05) 100%)", border: "1px solid rgba(200,155,71,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
              <span style={{ fontFamily: F.display, fontSize: 18, color: T.goldLight, fontWeight: 500 }}>BK</span>
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: "#FFFDF9", lineHeight: 1.1 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(255,253,249,0.55)", marginTop: 2 }}>&amp; Brothers Silks</div>
              <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 11, color: T.antiqueGold, letterSpacing: "3px", textTransform: "uppercase", marginTop: 4 }}>Est. 1999</div>
            </div>
          </div>
          <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(255,253,249,0.50)", lineHeight: 1.7, margin: "0 0 28px" }}>
            Four generations of master weavers crafting heritage silk sarees. A legacy built on tradition, trust, and timeless quality.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {["f", "in", "yt", "li"].map((s) => (
              <motion.div key={s} whileHover={{ scale: 1.12, y: -2, backgroundColor: "rgba(200,155,71,0.12)", borderColor: "rgba(200,155,71,0.4)" }} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(255,253,249,0.10)", background: "rgba(255,253,249,0.03)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s ease" }}>
                <span style={{ fontFamily: F.mono, fontSize: 13, color: "rgba(255,253,249,0.70)" }}>{s}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Links Grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(160px, 1fr))", gap: 32 }}>
          {Object.entries(FOOTER_LINKS).map(([col, links]) => (
            <div key={col}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 12, height: 1, background: T.antiqueGold, opacity: 0.5 }} />
                <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 500, color: T.goldLight, letterSpacing: "2.5px", textTransform: "uppercase" }}>{col}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {links.map(l => (
                  <motion.span key={l} whileHover={{ x: 4, color: "#E7C983" }} transition={{ duration: 0.2 }} style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(255,253,249,0.60)", cursor: "pointer", display: "inline-block" }}>
                    {l}
                  </motion.span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom Bar */}
      <div style={{ position: "relative", zIndex: 2, margin: `48px auto 0`, maxWidth: 1600, padding: `24px ${px}px`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 0, justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center" }}>
        <div style={{ position: "absolute", top: 0, left: px, right: px, height: 1, background: "linear-gradient(90deg, rgba(200,155,71,0.02) 0%, rgba(200,155,71,0.15) 50%, rgba(200,155,71,0.02) 100%)" }} />
        <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(255,253,249,0.40)" }}>
          © 2026 Beere Kesava &amp; Brothers Silks. All rights reserved.
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 12, color: "rgba(200,155,71,0.65)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Tradition · Trust · Timeless Quality</span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.antiqueGold, opacity: 0.6 }} />
        </div>
      </div>
    </footer>
  );
}
