import React from "react";
import { motion } from "motion/react";
import { useInViewFade } from "../hooks/useInViewFade";
import { EASE } from "../lib/tokens";

interface Props {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  className?: string;
}

/** Scroll-triggered fade + slide up animation. */
export function FadeUp({ children, delay = 0, style, className }: Props) {
  const { ref, inView } = useInViewFade("-80px 0px");
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 26,
        delay,
        opacity: { duration: 0.45 },
      }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Scroll-triggered fade in (no vertical movement). */
export function FadeIn({ children, delay = 0, style, className }: Props) {
  const { ref, inView } = useInViewFade("-60px 0px");
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : undefined}
      transition={{ duration: 0.65, delay }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}
