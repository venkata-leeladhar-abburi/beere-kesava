// ── Shared primitives ──────────────────────────────────────────────────────
import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { X } from "lucide-react";
import { T, F, EASE } from "../theme";
import { IconButton } from "../../../../shared/ui/primitives";

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
export function SectionPill({ label }: { label: string }) {
  return <div style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>;
}

export function ActionDialog({ open, title, children, tone = "gold", onClose }: { open: boolean; title: string; children: React.ReactNode; tone?: "gold" | "green" | "red"; onClose: () => void }) {
  if (!open) return null;
  const color = tone === "green" ? T.green : tone === "red" ? T.crimson : T.royalBurgundy;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: "var(--z-modal)", background: "rgba(26,10,15,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 18 }} onClick={e => e.stopPropagation()} style={{ width: 520, maxWidth: "100%", background: "#FFFFFF", borderRadius: 22, border: `1px solid ${T.borderDef}`, boxShadow: "0 30px 90px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", background: `linear-gradient(100deg, ${color}, ${T.deepWine})`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9" }}>{title}</div>
          <IconButton icon={X} label="Close" onClick={onClose} variant="ghost" className="rounded-[10px] bg-white/15 border border-white/20 text-[#FFFDF9]" />
        </div>
        <div style={{ padding: 26 }}>{children}</div>
      </motion.div>
    </motion.div>
  );
}
