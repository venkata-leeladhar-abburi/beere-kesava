// ── Shared primitives ──────────────────────────────────────────────────────
import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, type LucideIcon } from "lucide-react";
import { T, F, EASE } from "../theme";
import { IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";

export function qcColor(r: number) { return r > 95 ? T.green : r >= 85 ? "#8B6018" : T.crimson; }

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
export function Avatar({ photo, initials, bg, size = 44 }: { photo: string | null; initials: string; bg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${T.borderGold}` }}>
      {photo
        ? <img src={photo} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: F.display, fontSize: size * 0.4, color: "#FFFDF9" }}>{initials}</span>
        </div>}
    </div>
  );
}
export function Divider() { return <div style={{ height: 1, background: T.borderDef, margin: "16px 0" }} />; }

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// Production, Materials, and Payments pages.
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
        {actions && <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>{actions}</div>}
      </div>
      <div style={{ padding: "24px 28px 28px" }}>
        {children}
      </div>
    </div>
  );
}
export function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>;
}

export function ActionDialog({ open, title, children, tone = "gold", onClose }: { open: boolean; title: string; children: React.ReactNode; tone?: "gold" | "green" | "red"; onClose: () => void }) {
  const color = tone === "green" ? T.green : tone === "red" ? T.crimson : T.royalBurgundy;
  return (
    <Modal open={open} onOpenChange={o => { if (!o) onClose(); }} size="sm">
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#FFFFFF", borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        <div style={{ padding: "20px 24px", background: `linear-gradient(100deg, ${color}, ${T.deepWine})`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <Dialog.Title style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9", margin: 0 }}>{title}</Dialog.Title>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" onClick={onClose} variant="ghost" className="rounded-[10px] bg-white/15 border border-white/20 text-[#FFFDF9]" />
          </Dialog.Close>
        </div>
        <div style={{ padding: 26, overflowY: "auto" }}>{children}</div>
      </div>
    </Modal>
  );
}
