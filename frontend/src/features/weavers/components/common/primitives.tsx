// ── Shared primitives ──────────────────────────────────────────────────────
import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
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
export function getTwoLetterInitials(nameOrInitials?: string): string {
  if (!nameOrInitials) return "";
  const parts = nameOrInitials.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export function Avatar({ photo, initials, name, bg, size = 44 }: { photo: string | null; initials?: string; name?: string; bg: string; size?: number }) {
  const [imgError, setImgError] = React.useState(false);
  const showPhoto = photo && !imgError;
  const displayInitials = getTwoLetterInitials(name || initials);

  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${T.borderGold}` }}>
      {showPhoto ? (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onError is a media-load event, not a user interaction; it drives the initials fallback when the photo 404s.
        <img
          src={photo}
          alt={displayInitials}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: F.display, fontSize: size * 0.38, fontWeight: 700, color: "#FFFDF9" }}>{displayInitials}</span>
        </div>
      )}
    </div>
  );
}
export function Divider() { return <div style={{ height: 1, background: T.borderDef, margin: "16px 0" }} />; }

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// Production, Materials, and Payments pages.
// SectionCard/SectionPill moved to shared/ui/SectionCard — eight features
// render them, so they are not weavers-feature internals.
export { SectionCard, SectionPill } from "../../../../shared/ui/SectionCard";

export function ActionDialog({ open, title, children, tone = "gold", onClose }: { open: boolean; title: string; children: React.ReactNode; tone?: "gold" | "green" | "red"; onClose: () => void }) {
  const color = tone === "green" ? T.green : tone === "red" ? T.crimson : T.royalBurgundy;
  return (
    <Modal open={open} onOpenChange={o => { if (!o) onClose(); }} size="sm">
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#FFFFFF", borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        <div style={{ padding: "20px 24px", background: `linear-gradient(100deg, ${color}, ${T.deepWine})`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <Dialog.Title style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: "#FFFDF9", margin: 0 }}>{title}</Dialog.Title>
          <Dialog.Description className="sr-only">{title}</Dialog.Description>
          <Dialog.Close asChild>
            <IconButton icon={X} label="Close" onClick={onClose} variant="ghost" className="rounded-[10px] bg-white/15 border border-white/20 text-[#FFFDF9] hover:bg-white/25 hover:text-white" />
          </Dialog.Close>
        </div>
        <div style={{ padding: 26, overflowY: "auto" }}>{children}</div>
      </div>
    </Modal>
  );
}
