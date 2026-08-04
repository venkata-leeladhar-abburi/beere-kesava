import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, SlidersHorizontal, Moon } from 'lucide-react';
import { T, F, G, EASE } from '../theme';
// @ts-ignore
import imgHero from '../../../../../assets/hero.webp';

export function Hero() {
  return (
    <section style={{ position: "relative", height: "calc(100dvh - 90px - 100px)", minHeight: 500, overflow: "hidden", background: "#0D0207" }}>
      {/* Ken Burns hero image — actual Beere Kesava showroom */}
      <motion.img
        src={imgHero}
        alt="Beere Kesava & Brothers Silks Showroom"
        initial={{ scale: 1.18, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 1 }}
        transition={{ duration: 10, ease: "linear", opacity: { duration: 1.4, ease: [0.22, 1, 0.36, 1] } }}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "62%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />

      {/* Gold sweep reveal line */}
      <motion.div
        initial={{ scaleX: 0, x: "-100%" }}
        animate={{ scaleX: 1, x: "200vw" }}
        transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute", top: 0, left: 0, width: "60%", height: "100%",
          background: "linear-gradient(to right, transparent 0%, rgba(200,155,71,0.06) 40%, rgba(200,155,71,0.12) 50%, rgba(200,155,71,0.06) 60%, transparent 100%)",
          pointerEvents: "none", zIndex: 8, transformOrigin: "left center",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #0D0207 0%, #0D0207 32%, rgba(13,2,7,0.97) 40%, rgba(13,2,7,0.88) 48%, rgba(13,2,7,0.55) 58%, rgba(13,2,7,0.18) 72%, rgba(13,2,7,0) 80%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to top, rgba(13,2,7,0.7) 0%, rgba(13,2,7,0) 100%)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.022) 60px, rgba(200,155,71,0.022) 61px)` }} />

      <div style={{ position: "relative", zIndex: 5, width: "50%", height: "100%", padding: "40px 56px 100px 56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ width: 24, height: 1, background: T.antiqueGold, opacity: 0.6 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" }}>
            Since 1999 · Heritage Craftsmanship
          </span>
        </motion.div>

        {/* Headline lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { text: "Weaving", italic: false, color: T.warmCream, delay: 0.5 },
            { text: "Heritage", italic: true, color: T.antiqueGold, delay: 0.68 },
            { text: "Into Every Thread", italic: false, color: T.warmCream, delay: 0.86 },
          ].map(({ text, italic, color, delay }) => (
            <div key={text} style={{ overflow: "hidden", lineHeight: "1.12" }}>
              <motion.div
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: F.display, fontWeight: 400, fontStyle: italic ? "italic" : "normal", fontSize: "clamp(36px, 3.8vw, 60px)", letterSpacing: "-0.5px", color }}
              >
                {text}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.90)", lineHeight: 1.85, margin: 0, maxWidth: 360, letterSpacing: "0.05px" }}
        >
          From the finest raw silk to masterful craftsmanship,<br />we deliver excellence at every step — for four generations.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.15, ease: EASE }}
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          <motion.button
            initial={{ boxShadow: "0px 8px 32px rgba(110,15,45,0.40)" }}
            whileHover={{ scale: 1.04, boxShadow: "0px 16px 48px rgba(110,15,45,0.55)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 28px", borderRadius: 16, border: "none", cursor: "pointer", background: G.button, fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.warmCream, letterSpacing: "0.2px", boxShadow: `0 8px 32px rgba(110,15,45,0.40)` }}
          >
            Explore Production
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(245,232,208,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={13} color={T.warmCream} />
            </div>
          </motion.button>
          <motion.button
            initial={{ backgroundColor: "rgba(245,232,208,0.10)" }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.16)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "13px 22px", borderRadius: 16, cursor: "pointer", backgroundColor: "rgba(245,232,208,0.10)", border: "1px solid rgba(245,232,208,0.30)", fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: "rgba(245,232,208,0.92)", letterSpacing: "0.1px" }}
          >
            View Reports
          </motion.button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}
        >
          <motion.svg
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            width="14" height="24" viewBox="0 0 14 24" fill="none"
          >
            <rect x="1" y="1" width="12" height="22" rx="6" stroke="rgba(245,232,208,0.22)" strokeWidth="1.5" />
            <rect x="5.5" y="5" width="3" height="6" rx="1.5" fill="rgba(200,155,71,0.50)" />
          </motion.svg>
          <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 12, color: "rgba(245,232,208,0.28)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Scroll to Explore</span>
        </motion.div>
      </div>

      <div style={{ position: "absolute", right: 24, top: "40%", transform: "translateY(-50%)", zIndex: 6, display: "flex", flexDirection: "column", gap: 10 }}>
        {[SlidersHorizontal, Moon].map((Icon, i) => (
          <motion.button
            key={i}
            initial={{ backgroundColor: "rgba(245,232,208,0.07)" }}
            whileHover={{ scale: 1.1, backgroundColor: "rgba(245,232,208,0.12)" }}
            whileTap={{ scale: 0.93 }}
            style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(245,232,208,0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(245,232,208,0.10)", boxShadow: "0 4px 16px rgba(0,0,0,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon size={15} color="rgba(245,232,208,0.55)" />
          </motion.button>
        ))}
      </div>
    </section>
  );
}
