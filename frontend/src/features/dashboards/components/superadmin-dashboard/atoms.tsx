import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "motion/react";
import { T, F, G, EASE } from "./theme";

export function TabLoadingFallback() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(139,26,46,0.15)", borderTopColor: "#6B1A2A", animation: "bk-spin 0.8s linear infinite" }} />
      <style>{"@keyframes bk-spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
export function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay, opacity: { duration: 0.45 } }}
      style={style}
    >{children}</motion.div>
  );
}

export function AnimatedBar({ pct, color, height = 5, trackBg = "rgba(110,15,45,0.07)" }: { pct: number; color: string; height?: number; trackBg?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <div ref={ref} style={{ height, borderRadius: 999, background: trackBg }}>
      <motion.div
        initial={{ width: "0%" }}
        animate={inView ? { width: `${pct}%` } : undefined}
        transition={{ duration: 1.4, delay: 0.18, ease: EASE }}
        style={{ height: "100%", borderRadius: 999, background: color }}
      />
    </div>
  );
}

export function AnimatedNumber({ raw }: { raw: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(() => {
    const m = raw.match(/(\d+(?:\.\d+)?)/);
    if (!m) return raw;
    const isFloat = m[1].includes(".");
    return raw.replace(m[1], isFloat ? "0.0" : "0");
  });
  useEffect(() => {
    if (!inView) return;
    const match = raw.match(/(\d+(?:\.\d+)?)/);
    if (!match) { setDisplayed(raw); return; }
    const numStr = match[1];
    const target = Number(numStr);
    const isFloat = numStr.includes(".");
    const idx = raw.indexOf(numStr);
    const pre = raw.slice(0, idx);
    const suf = raw.slice(idx + numStr.length);
    const dur = 1600;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setDisplayed(`${pre}${isFloat ? (e * target).toFixed(1) : Math.round(e * target)}${suf}`);
      if (p < 1) requestAnimationFrame(step);
      else setDisplayed(raw);
    };
    requestAnimationFrame(step);
  }, [inView, raw]);
  return <span ref={ref}>{displayed}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
export function SectionHeader({ title, actionText = "View All →", small, onAction }: { title: string; actionText?: string; small?: boolean; onAction?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, ease: EASE }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: small ? 18 : 32 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          style={{ width: 3, height: small ? 18 : 22, borderRadius: 2, background: G.gold, flexShrink: 0, transformOrigin: "top" }}
        />
        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: small ? 22 : 30, color: T.luxuryBrown, lineHeight: 1.1, letterSpacing: "-0.3px" }}>
          {title}
        </span>
      </div>
      <motion.span onClick={onAction} whileHover={{ x: 3, opacity: 1 }} transition={{ duration: 0.2 }}
        style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: "#845E04", cursor: "pointer", letterSpacing: "0.1px" }}
      >{actionText}</motion.span>
    </motion.div>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 48, scale: 0.92, filter: "blur(8px)" }}
      animate={inView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : undefined}
      whileHover={{ y: -7, scale: 1.008, boxShadow: "0px 32px 80px rgba(74,6,27,0.16)" }}
      transition={{ type: "spring", stiffness: 240, damping: 22, opacity: { duration: 0.5 }, filter: { duration: 0.55 } }}
      style={{ background: T.warmIvory, borderRadius: 28, border: `1px solid ${T.borderDef}`, boxShadow: "0px 10px 40px rgba(74,6,27,0.07)", ...style }}
    >{children}</motion.div>
  );
}
