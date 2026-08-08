import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { T, F, EASE } from "../theme";
import { IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";

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
  return (
    <Modal open={open} onOpenChange={o => { if (!o) onClose(); }} size="sm">
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#FFFFFF", borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        <div style={{ padding: "20px 24px", background: `linear-gradient(100deg, ${T.deepWine}, ${T.royalBurgundy})`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <Dialog.Title style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9", fontWeight: 700, margin: 0 }}>{title}</Dialog.Title>
          <Dialog.Close asChild>
            <IconButton icon="close" label="Close" variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/15" />
          </Dialog.Close>
        </div>
        <div style={{ padding: 26, overflowY: "auto" }}>{children}</div>
      </div>
    </Modal>
  );
}
