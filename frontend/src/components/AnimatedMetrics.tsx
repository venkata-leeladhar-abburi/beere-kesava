import React from "react";
import { motion } from "motion/react";
import { useInViewFade } from "../hooks/useInViewFade";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber";
import { EASE } from "../lib/tokens";

// ── AnimatedBar ────────────────────────────────────────────────────────────────
interface AnimatedBarProps {
  pct: number;
  color: string;
  height?: number;
  trackBg?: string;
}

/**
 * Animated progress bar — fills from 0% to `pct` on scroll-enter.
 */
export function AnimatedBar({
  pct,
  color,
  height = 5,
  trackBg = "rgba(110,15,45,0.07)",
}: AnimatedBarProps) {
  const { ref, inView } = useInViewFade("-40px 0px");
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

// ── AnimatedNumber ─────────────────────────────────────────────────────────────
interface AnimatedNumberProps {
  raw: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Animated counter — counts from 0 to the numeric value in `raw`.
 * Preserves surrounding text: "₹1.4L" → counts from "₹0.0L" to "₹1.4L".
 */
export function AnimatedNumber({ raw, duration = 1600, className, style }: AnimatedNumberProps) {
  const { ref, displayed } = useAnimatedNumber(raw, duration);
  return (
    <span ref={ref} className={className} style={style}>
      {displayed}
    </span>
  );
}
