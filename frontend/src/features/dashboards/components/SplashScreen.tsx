import React, { useEffect } from "react";
import { motion } from "motion/react";
import { imgBKLogo } from "../../../shared/constants/weaverImages";
import { T, F, EASE } from './beere-dashboard/theme';
import { Lotus } from './beere-dashboard/ui';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 3200);
    return () => clearTimeout(t);
  }, [onComplete]);

  // Animated silk thread lines across background
  const THREADS = Array.from({ length: 14 }, (_, i) => ({
    x1: `${i * 8 - 4}%`, y1: "0%",
    x2: `${i * 8 + 18}%`, y2: "100%",
    delay: 0.4 + i * 0.12,
    opacity: 0.04 + (i % 3) * 0.025,
  }));

  // Floating gold particle dots
  const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
    cx: `${8 + i * 6}%`,
    cy: `${15 + (i % 5) * 17}%`,
    r: 1 + (i % 3) * 0.8,
    delay: i * 0.18,
    dur: 2.5 + (i % 4) * 0.8,
  }));

  return (
    <motion.div
      key="splash"
      exit={{
        opacity: 0,
        scale: 1.06,
        filter: "blur(22px)",
        transition: { duration: 1.1, ease: [0.4, 0, 0.2, 1] },
      }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "linear-gradient(160deg, #050107 0%, #140408 18%, #2C0913 45%, #4A061B 72%, #6E0F2D 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* ── Silk threads SVG background ── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {THREADS.map((l, i) => (
          <motion.line
            key={`t${i}`}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={`rgba(200,155,71,${l.opacity})`}
            strokeWidth={1}
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 1.6, delay: l.delay, ease: EASE }}
          />
        ))}
        {/* Floating gold particles */}
        {PARTICLES.map((p, i) => (
          <motion.circle
            key={`p${i}`}
            cx={p.cx} cy={p.cy} r={p.r}
            fill="rgba(200,155,71,0.35)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0, 1, 0], y: [0, -30, -60] }}
            transition={{ duration: p.dur, delay: 1.2 + p.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* ── Central ambient glow ── */}
      <div style={{
        position: "absolute", width: 480, height: 480, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,155,71,0.14) 0%, rgba(110,15,45,0.10) 40%, transparent 70%)",
        filter: "blur(50px)", pointerEvents: "none",
      }} />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,155,71,0.22) 0%, transparent 70%)",
          filter: "blur(28px)", pointerEvents: "none",
        }}
      />

      {/* ── Logo with pulse rings ── */}
      <motion.div
        initial={{ scale: 0.25, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.15 }}
        style={{ position: "relative", marginBottom: 34 }}
      >
        {/* Outer pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.7, 1], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          style={{ position: "absolute", inset: -28, borderRadius: 52, border: "1px solid rgba(200,155,71,0.30)", pointerEvents: "none" }}
        />
        {/* Inner pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.85 }}
          style={{ position: "absolute", inset: -14, borderRadius: 40, border: "1px solid rgba(200,155,71,0.45)", pointerEvents: "none" }}
        />
        {/* Logo box */}
        <div style={{
          width: 118, height: 118, borderRadius: 30, overflow: "hidden",
          border: "2px solid rgba(200,155,71,0.48)",
          boxShadow: "0 0 56px rgba(200,155,71,0.40), 0 0 112px rgba(200,155,71,0.15), 0 24px 60px rgba(0,0,0,0.55), inset 0 1px 1px rgba(200,155,71,0.20)",
        }}>
          <img src={imgBKLogo} alt="BK" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>

      </motion.div>

      {/* ── Brand name ── */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.6 }}
        style={{ textAlign: "center", marginBottom: 28 }}
      >
        <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: "clamp(32px, 5vw, 48px)", color: T.warmCream, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
          Beere Kesava
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          style={{ fontFamily: F.ui, fontWeight: 300, fontSize: 18, color: "rgba(245,232,208,0.68)", letterSpacing: "1.5px", marginTop: 6 }}
        >
          &amp; Brothers Silks
        </motion.div>
        <motion.div
          initial={{ opacity: 0, letterSpacing: "10px" }}
          animate={{ opacity: 1, letterSpacing: "6px" }}
          transition={{ duration: 1.1, delay: 1.0, ease: EASE }}
          style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 10, color: T.antiqueGold, textTransform: "uppercase", marginTop: 10 }}
        >
          Est. 1999
        </motion.div>
      </motion.div>

      {/* ── Ornamental divider ── */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
        style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}
      >
        <div style={{ width: 90, height: 1, background: "linear-gradient(to left, rgba(200,155,71,0.55), transparent)" }} />
        <motion.div
          animate={{ rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >
          <Lotus sz={24} col={T.antiqueGold} />
        </motion.div>
        <div style={{ width: 90, height: 1, background: "linear-gradient(to right, rgba(200,155,71,0.55), transparent)" }} />
      </motion.div>

      {/* ── Tagline ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.28 }}
        style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 10, color: "rgba(200,155,71,0.60)", letterSpacing: "3.8px", textTransform: "uppercase", margin: 0 }}
      >
        Weaving Heritage Into Every Thread
      </motion.p>

      {/* ── Version / sub-info ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.38 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        style={{ position: "absolute", bottom: 18, fontFamily: F.mono, fontSize: 9.5, color: T.antiqueGold, letterSpacing: "1.5px" }}
      >
        Admin Dashboard v2.0 · Est. 1999
      </motion.div>
    </motion.div>
  );
}
