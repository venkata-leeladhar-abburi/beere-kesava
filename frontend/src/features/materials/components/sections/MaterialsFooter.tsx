import React, { useContext, useState } from "react";
import { motion } from "motion/react";
import { T, F, MobileCtx } from "../theme";
import { FOOTER_LINKS } from "../data";

export function MaterialsFooter() {
  const { isMobile, px } = useContext(MobileCtx);
  const [email, setEmail] = useState("");
  return (
    <footer style={{ background: T.darkBurgundy, marginTop: 56, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 56px, rgba(200,155,71,0.018) 56px, rgba(200,155,71,0.018) 57px), repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.014) 80px, rgba(200,155,71,0.014) 81px)` }} />
      <div style={{ position: "absolute", top: "-20%", right: "5%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(200,155,71,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, padding: `${isMobile ? 32 : 56}px ${px}px 0`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 28 : 48 }}>
        <div style={{ flex: "0 0 260px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.24)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.display, fontSize: 16, color: T.goldLight }}>BK</span>
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 16, color: "#FFFDF9", lineHeight: 1.1 }}>Beere Kesava</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: "rgba(255,253,249,0.55)" }}>&amp; Brothers Silks</div>
              <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 12, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase" }}>Est. 1999</div>
            </div>
          </div>
          <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: "rgba(255,253,249,0.50)", lineHeight: 1.8, margin: "0 0 22px" }}>
            Four generations of weavers crafting heritage silk sarees. Tradition, trust, and timeless quality since 1999.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {["f", "in", "yt", "li"].map((s) => (
              <motion.div key={s} whileHover={{ scale: 1.12, y: -2 }} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,253,249,0.12)", background: "rgba(255,253,249,0.05)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.55)" }}>{s}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {Object.entries(FOOTER_LINKS).map(([col, links]) => (
          <div key={col} style={{ flex: 1 }}>
            <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 500, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 18 }}>{col}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {links.map(l => (
                <motion.span key={l} whileHover={{ x: 3, color: "#FFFDF9" }} transition={{ duration: 0.18 }} style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(255,253,249,0.55)", cursor: "pointer" }}>
                  {l}
                </motion.span>
              ))}
            </div>
          </div>
        ))}

        <div style={{ flex: "0 0 220px" }}>
          <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 500, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 18 }}>Subscribe to Updates</div>
          <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: "rgba(255,253,249,0.50)", lineHeight: 1.7, margin: "0 0 16px" }}>
            Get notified about stock alerts and system updates.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" style={{ fontFamily: F.ui, fontSize: 12, color: "#FFFDF9", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: "10px 14px", outline: "none", width: "100%" }} />
            <motion.button initial={{ backgroundColor: T.royalBurgundy }} animate={{ backgroundColor: T.royalBurgundy }} whileHover={{ scale: 1.03, backgroundColor: "#5A0A24" }} whileTap={{ scale: 0.97 }} style={{ color: "#FFFDF9", border: "none", borderRadius: 10, padding: "10px 0", fontFamily: F.ui, fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%" }}>
              Subscribe
            </motion.button>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2, margin: `32px ${px}px 0`, borderTop: "1px solid rgba(255,253,249,0.08)", padding: "18px 0 32px", display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 0, justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center" }}>
        <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: "rgba(255,253,249,0.35)" }}>
          © 2025 Beere Kesava &amp; Brothers Silks. All rights reserved.
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 12, color: "rgba(200,155,71,0.60)", letterSpacing: "2px", textTransform: "uppercase" }}>Tradition · Trust · Timeless Quality</span>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.antiqueGold, opacity: 0.6 }} />
        </div>
      </div>
    </footer>
  );
}
