import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, SlidersHorizontal, Moon } from 'lucide-react';
import { T, F, G, EASE } from '../theme';
import { Button, IconButton } from '../../../../../shared/ui/primitives';
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
          <div style={{ width: 28, height: 1, background: T.antiqueGold, opacity: 0.65 }} />
          <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 11.5, color: "rgba(200,155,71,0.82)", letterSpacing: "3.5px", textTransform: "uppercase" }}>
            Since 1999 · Heritage Craftsmanship
          </span>
        </motion.div>

        {/* Headline lines — Updated to DM Serif Display for a beautiful, premium heritage look */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { text: "Weaving", italic: false, color: T.warmCream, delay: 0.5 },
            { text: "Heritage", italic: true, color: T.antiqueGold, delay: 0.68 },
            { text: "Into Every Thread", italic: false, color: T.warmCream, delay: 0.86 },
          ].map(({ text, italic, color, delay }) => (
            <div key={text} style={{ overflow: "hidden", lineHeight: "1.15" }}>
              <motion.div
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontWeight: 400, fontStyle: italic ? "italic" : "normal",
                  fontSize: "clamp(48px, 5vw, 76px)", letterSpacing: "-0.01em", color,
                }}
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
          style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 18, color: "rgba(245,232,208,0.88)", lineHeight: 1.8, margin: 0, maxWidth: 460, letterSpacing: "0.1px" }}
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
          <motion.div initial={{ boxShadow: "0px 8px 32px rgba(110,15,45,0.40)" }} whileHover={{ scale: 1.04, boxShadow: "0px 16px 48px rgba(110,15,45,0.55)" }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }} style={{ borderRadius: 16 }}>
            <Button
              variant="primary"
              className="!gap-3 !py-3.5 !px-7 !rounded-2xl !border-none !bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)] hover:!bg-[linear-gradient(135deg,#6E0F2D_0%,#4A061B_100%)] !text-[#F5E8D0] !text-[13px] !font-semibold !tracking-[0.2px]"
            >
              Explore Production
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(245,232,208,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={13} color={T.warmCream} />
              </div>
            </Button>
          </motion.div>
          <motion.div initial={{ backgroundColor: "rgba(245,232,208,0.10)" }} whileHover={{ scale: 1.02, backgroundColor: "rgba(245,232,208,0.16)" }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }} style={{ borderRadius: 16 }}>
            <Button
              variant="tertiary"
              className="!gap-2.5 !py-[13px] !px-[22px] !rounded-2xl !bg-white/10 !border !border-white/30 !text-[rgba(245,232,208,0.92)] !text-[13px] !font-medium !tracking-[0.1px] hover:!bg-white/16 hover:!text-[rgba(245,232,208,0.92)]"
            >
              View Reports
            </Button>
          </motion.div>
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
        {[{ Icon: SlidersHorizontal, label: "Filters" }, { Icon: Moon, label: "Toggle theme" }].map(({ Icon, label }, i) => (
          <motion.div
            key={i}
            initial={{ backgroundColor: "rgba(245,232,208,0.07)" }}
            whileHover={{ scale: 1.1, backgroundColor: "rgba(245,232,208,0.12)" }}
            whileTap={{ scale: 0.93 }}
            style={{ borderRadius: 12, backdropFilter: "blur(12px)", boxShadow: "0 4px 16px rgba(0,0,0,0.22)" }}
          >
            <IconButton
              icon={Icon}
              label={label}
              variant="ghost"
              className="!size-[38px] !rounded-xl !bg-white/7 !border !border-white/10 !text-[rgba(245,232,208,0.55)] hover:!bg-white/12 hover:!text-[rgba(245,232,208,0.55)]"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
