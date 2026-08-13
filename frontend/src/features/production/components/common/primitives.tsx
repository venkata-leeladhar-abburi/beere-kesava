import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import type { LucideIcon } from "lucide-react";
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

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// Materials, Payments, Weavers, Customers, Vendors, and Suppliers pages.
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  id,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={26} color="#FFFDF9" />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>{title}</div>
            {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>{subtitle}</div>}
          </div>
        </div>
        {actions && <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
      </div>
      <div style={{ padding: "24px 28px 28px" }}>
        {children}
      </div>
    </div>
  );
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
