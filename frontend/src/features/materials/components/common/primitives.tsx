import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, type LucideIcon } from "lucide-react";
import { useAnimatedNumber } from "../../../../hooks/useAnimatedNumber";
import { T, F, EASE, G_GOLD } from "../theme";
import { Button, IconButton } from "../../../../shared/ui/primitives";
import { Modal } from "../../../../shared/ui/overlay";

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

  const buttonVariant = actionVariant === "solid" ? "primary" : actionVariant === "gold" ? "primary" : "secondary";

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
        <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, color: T.luxuryBrown, letterSpacing: "-0.3px", lineHeight: 1.15 }}>
          {title}
        </span>
      </div>
      <Button onClick={onAction} variant={buttonVariant} size="sm">
        {actionIcon}
        {action}
      </Button>
    </motion.div>
  );
}

export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div className="p-4 sm:p-7" style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}>
        <div className="flex items-start gap-3.5 sm:gap-4 w-full">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon size={24} color="#FFFDF9" />
          </div>
          <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>{title}</div>
              {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
            </div>
            {actions && <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto pt-1">{actions}</div>}
          </div>
        </div>
      </div>
      <div className="p-2.5 sm:p-5 md:p-6 pb-2.5 sm:pb-4">
        {children}
      </div>
    </div>
  );
}

export function ModalOverlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal open={open} onOpenChange={o => { if (!o) onClose(); }} size="md">
      <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "calc(100dvh - 96px)", background: "#FFFDF9", borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        {children}
      </div>
    </Modal>
  );
}

export function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div style={{ background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`, padding: "26px 28px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
      <div>
        <Dialog.Title style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", marginBottom: subtitle ? 4 : 0 }}>{title}</Dialog.Title>
        {subtitle && <div style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.65)" }}>{subtitle}</div>}
      </div>
      <Dialog.Close asChild>
        <IconButton
          icon={X}
          label="Close"
          onClick={onClose}
          shape="circle"
          className="bg-white/12 text-white border border-white/22 hover:bg-white/18"
        />
      </Dialog.Close>
    </div>
  );
}
