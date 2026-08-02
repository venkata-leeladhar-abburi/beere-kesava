import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Facebook, Instagram, Youtube, Linkedin, Flower2 as Lotus } from 'lucide-react';
import { imgBKLogo, imgSareeFooter } from '../../../../../app/constants/weaverImages';
import { T, F, G } from '../theme';
import { FadeUp } from '../ui';

export function Footer() {
  return (
    <footer style={{ background: T.silkCream }}>
      <FadeUp style={{ padding: "0 48px" }}>
        <div style={{ background: G.card, borderRadius: 28, overflow: "hidden", display: "flex", alignItems: "stretch", position: "relative", height: 180, boxShadow: "0 20px 60px rgba(74,6,27,0.20)", border: "1px solid rgba(200,155,71,0.12)" }}>
          <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />
          <div style={{ flex: "0 0 40%", display: "flex", alignItems: "center", gap: 20, padding: "0 36px", zIndex: 2 }}>
            <motion.div
              whileHover={{ scale: 1.06, boxShadow: "0px 0px 32px rgba(200,155,71,0.32)" }}
              style={{ width: 54, height: 54, borderRadius: 16, overflow: "hidden", flexShrink: 0, border: "1.5px solid rgba(200,155,71,0.32)", boxShadow: "0px 0px 24px rgba(200,155,71,0.18)" }}
            >
              <img src={imgBKLogo} alt="BK Logo" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "sepia(1) saturate(3) hue-rotate(340deg) brightness(1.2)" }} />
            </motion.div>
            <div>
              <div style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 400, fontSize: 27, color: T.warmCream, lineHeight: 1.2, marginBottom: 2 }}>Crafted with Pride.</div>
              <div style={{ fontFamily: F.display, fontStyle: "italic", fontWeight: 400, fontSize: 27, color: T.antiqueGold, lineHeight: 1.2 }}>Delivered with Trust.</div>
            </div>
          </div>
          <div style={{ flex: "0 0 28%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 20px 0 0", zIndex: 2 }}>
            <p style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(245,232,208,0.88)", lineHeight: 1.85, margin: "0 0 18px", letterSpacing: "0.05px" }}>
              Four generations of passion,<br />woven into every creation.
            </p>
            <motion.button
              initial={{ backgroundColor: "rgba(200,155,71,0.09)" }}
              whileHover={{ scale: 1.04, backgroundColor: "rgba(200,155,71,0.16)" }}
              whileTap={{ scale: 0.97 }}
              style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 16, border: "1px solid rgba(200,155,71,0.32)", backgroundColor: "rgba(200,155,71,0.09)", cursor: "pointer", fontFamily: F.ui, fontWeight: 500, fontSize: 12.5, color: T.goldLight, letterSpacing: "0.1px" }}
            >
              Know Our Story <ArrowRight size={12} color={T.goldLight} />
            </motion.button>
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "60%", background: `linear-gradient(to right, #2C0913 0%, rgba(44,9,19,0.7) 35%, rgba(44,9,19,0) 100%)`, zIndex: 1 }} />
            <motion.img
              src={imgSareeFooter}
              alt="Luxury Silk Saree"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.6 }}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
            />
          </div>
        </div>
      </FadeUp>
      <FadeUp delay={0.1} style={{ padding: "36px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.borderGold}` }}>
              <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }} />
            </div>
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 15, color: T.luxuryBrown, letterSpacing: "0.2px" }}>Beere Kesava</div>
              <div style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 11, color: T.taupe, letterSpacing: "0.1px" }}>&amp; Brothers Silks</div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 8.5, color: T.antiqueGold, letterSpacing: "2.5px", textTransform: "uppercase" }}>Est. 1999</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {["About Us", "Our Legacy", "Sustainability", "Careers", "Contact Us"].map(l => (
              <motion.span
                key={l}
                whileHover={{ opacity: 1 }}
                style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: T.luxuryBrown, cursor: "pointer", opacity: 0.70, letterSpacing: "0.1px" }}
              >
                {l}
              </motion.span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {([Facebook, Instagram, Youtube, Linkedin] as const).map((Icon, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.14, y: -3, boxShadow: "0px 6px 20px rgba(74,6,27,0.14)" }}
                whileTap={{ scale: 0.93 }}
                style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${T.borderDef}`, background: T.warmIvory, boxShadow: "0px 0px 0px rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Icon size={14} color={T.luxuryBrown} />
              </motion.div>
            ))}
          </div>
        </div>
      </FadeUp>
      <div style={{ borderTop: `1px solid ${T.borderDef}`, margin: "28px 48px 0", padding: "18px 0 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: T.taupe, opacity: 0.75, letterSpacing: "0.1px" }}>© 1999 Beere Kesava &amp; Brothers Silks. All rights reserved.</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Lotus size={14} color={T.antiqueGold} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 11, color: T.antiqueGold, letterSpacing: "2px", opacity: 0.75, textTransform: "uppercase" }}>Tradition · Trust · Timeless Quality</span>
        </div>
      </div>
    </footer>
  );
}
