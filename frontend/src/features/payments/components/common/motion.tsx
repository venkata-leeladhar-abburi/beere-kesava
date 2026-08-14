import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

import { EASE } from "../../theme";

// ── FadeUp ────────────────────────────────────────────────────────────────────
export function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 22 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE, delay }} style={style}>
      {children}
    </motion.div>
  );
}

// ── Animated number counter ────────────────────────────────────────────────────
export function AnimCount({ raw }: { raw: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [disp, setDisp] = useState(() => {
    const m = raw.match(/[\d.]+/);
    return m ? raw.replace(m[0], raw.includes(".") ? "0.0" : "0") : raw;
  });
  useEffect(() => {
    if (!inView) return;
    const m = raw.match(/[\d.]+/);
    if (!m) { setDisp(raw); return; }
    // eslint-disable-next-line no-restricted-syntax -- animates a display string's numeric run (counts or already-formatted money text) purely for a visual count-up; not currency arithmetic, no precision requirement
    const target = parseFloat(m[0]);
    const isFloat = m[0].includes(".");
    const idx = raw.indexOf(m[0]);
    const pre = raw.slice(0, idx), suf = raw.slice(idx + m[0].length);
    const dur = 1400; let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setDisp(`${pre}${isFloat ? (e * target).toFixed(1) : Math.round(e * target)}${suf}`);
      if (p < 1) requestAnimationFrame(step); else setDisp(raw);
    };
    requestAnimationFrame(step);
  }, [inView, raw]);
  return <span ref={ref}>{disp}</span>;
}

// ── Animated progress bar ──────────────────────────────────────────────────────
export function AnimBar({ pct, color, height = 8, trackBg = "rgba(110,15,45,0.08)" }: { pct: number; color: string; height?: number; trackBg?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} style={{ height, borderRadius: 99, background: trackBg, overflow: "hidden" }}>
      <motion.div initial={{ width: "0%" }} animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 1.3, delay: 0.2, ease: EASE }}
        style={{ height: "100%", borderRadius: 99, background: color }} />
    </div>
  );
}
