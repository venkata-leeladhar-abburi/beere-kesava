import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { T, F, EASE } from "../theme";
import { IconButton } from "../../../../shared/ui/primitives";

export function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE, delay }} style={style}>
      {children}
    </motion.div>
  );
}

export function Pip({ initials, bg, size = 26 }: { initials: string; bg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.55)" }}>
      <span style={{ fontFamily: F.ui, fontSize: size * 0.35, fontWeight: 700, color: "#FFFDF9", letterSpacing: "-0.3px" }}>{initials}</span>
    </div>
  );
}

export function ClickableCode({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  if (!onClick) return <span style={style}>{children}</span>;
  return (
    <motion.span
      onClick={onClick}
      whileHover={{ opacity: 0.68 }}
      style={{ ...style, cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(110,15,45,0.35)", textUnderlineOffset: 2 }}
    >
      {children}
    </motion.span>
  );
}

/** Parses a "Name · CODE" combined saree-type string, returning the code half. */
export function parseSareeTypeCode(combined: string): string {
  const parts = combined.split("·").map(s => s.trim());
  return parts.length > 1 ? (parts[parts.length - 1] ?? combined.trim()) : combined.trim();
}

export function ProductionDialog({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: "var(--z-modal)", background: "rgba(26,10,15,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div initial={{ y: 18, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 18, scale: 0.96 }} onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: "100%", background: "#FFFFFF", borderRadius: 22, border: `1px solid ${T.borderDef}`, boxShadow: "0 30px 90px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", background: `linear-gradient(100deg, ${T.deepWine}, ${T.royalBurgundy})`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9", fontWeight: 700 }}>{title}</div>
          <IconButton icon="close" label="Close" variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/15" />
        </div>
        <div style={{ padding: 26 }}>{children}</div>
      </motion.div>
    </motion.div>
  );
}
