import React, { useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useAnimatedNumber } from "../../../../hooks/useAnimatedNumber";
import { T, F, EASE, G_GOLD } from "../theme";

export function AnimatedBar({ pct, color, height = 5, trackBg = "rgba(110,15,45,0.09)" }: {
  pct: number; color: string; height?: number; trackBg?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <div ref={ref} style={{ height, borderRadius: 999, background: trackBg, overflow: "hidden" }}>
      <motion.div
        initial={{ width: "0%" }}
        animate={inView ? { width: `${pct}%` } : undefined}
        transition={{ duration: 1.4, delay: 0.2, ease: EASE }}
        style={{ height: "100%", borderRadius: 999, background: color }}
      />
    </div>
  );
}

export function FadeUp({ children, delay = 0, style, id }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties; id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });
  return (
    <motion.div
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, delay, ease: EASE }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({ raw }: { raw: string }) {
  const { ref, displayed } = useAnimatedNumber(raw);
  return <span ref={ref}>{displayed}</span>;
}

export function SectionHeader({
  title,
  action = "View All",
  actionIcon,
  onAction,
  actionVariant = "outline",
}: {
  title: string;
  action?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  actionVariant?: "solid" | "outline" | "gold";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });

  const btnStyle: React.CSSProperties =
    actionVariant === "solid"
      ? { background: T.royalBurgundy, color: "#FFFDF9", border: "none" }
      : actionVariant === "gold"
      ? { background: G_GOLD, color: T.luxuryBrown, border: "none" }
      : { background: "rgba(110,15,45,0.06)", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.20)` };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: EASE }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 12 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : undefined}
          transition={{ duration: 0.45, delay: 0.12, ease: EASE }}
          style={{ width: 4, height: 26, borderRadius: 2, background: G_GOLD, transformOrigin: "top", flexShrink: 0 }}
        />
        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 32, color: T.luxuryBrown, letterSpacing: "-0.3px", lineHeight: 1.15 }}>
          {title}
        </span>
      </div>
      <motion.button
        onClick={onAction}
        whileHover={{ scale: 1.04, boxShadow: "0 6px 22px rgba(110,15,45,0.22)" }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.18 }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 20px", borderRadius: 10, cursor: "pointer",
          fontFamily: F.ui, fontWeight: 700, fontSize: 13.5,
          boxShadow: "0 2px 10px rgba(110,15,45,0.10)",
          transition: "all 0.18s",
          ...btnStyle,
        }}
      >
        {actionIcon}
        {action}
      </motion.button>
    </motion.div>
  );
}

export function ModalOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(61,14,26,0.60)", backdropFilter: "blur(4px)",
            zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.28, ease: EASE }}
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFFDF9", borderRadius: 22, boxShadow: "0 40px 120px rgba(61,14,26,0.40)",
              width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto",
              border: `1px solid ${T.borderDef}`,
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, borderRadius: "22px 22px 0 0", padding: "26px 28px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, color: "#FFFDF9", marginBottom: subtitle ? 4 : 0 }}>{title}</div>
        {subtitle && <div style={{ fontFamily: F.ui, fontSize: 13.5, color: "rgba(255,253,249,0.65)" }}>{subtitle}</div>}
      </div>
      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.1, background: "rgba(255,255,255,0.18)" }}
        whileTap={{ scale: 0.95 }}
        style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
      >
        <X size={18} color="#FFFDF9" />
      </motion.button>
    </div>
  );
}
