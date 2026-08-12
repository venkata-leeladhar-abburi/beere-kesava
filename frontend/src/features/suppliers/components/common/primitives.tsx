// Small reusable UI primitives shared across Suppliers sections/modals.

import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Star, CheckCircle2, type LucideIcon } from "lucide-react";
import { T, F, EASE } from "../theme";
import { StatusPill as DomainStatusPill } from "../../../../shared/ui/domain";
import type { StatusValueOf } from "../../../../lib/domain/status";

export function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay, ease: EASE }} style={style}>
      {children}
    </motion.div>
  );
}

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// Production, Materials, Payments, Weavers, Customers, and Vendors pages.
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

export const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 6,
  border: `1px solid rgba(110,15,45,0.12)`, fontFamily: F.ui,
  fontSize: 14, color: T.luxuryBrown, background: "#FFF",
  outline: "none", boxSizing: "border-box",
};
export const lbl: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 12, fontWeight: 600,
  color: T.luxuryBrown, display: "block", marginBottom: 6,
};

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active:   { bg: "rgba(30,102,64,0.09)",  color: T.greenMid, label: "Active" },
    inactive: { bg: "rgba(139,112,96,0.10)", color: T.taupe,    label: "Inactive" },
    overdue:  { bg: "rgba(192,57,43,0.08)",  color: T.crimson,  label: "Overdue" },
  };
  const s = map[status] ?? map.active;
  return <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20 }}>{s.label}</span>;
}

// "Paid" | "Pending" | "Partial" (Purchase.status, free-form) — normalized
// onto the shared payment taxonomy (lib/domain/status.ts) rather than a
// hand-rolled colour map, per design-system/06-DOMAIN.md Part D.
const PAY_STATUS_KEY: Record<string, StatusValueOf<"payment">> = {
  Paid: "paid",
  Pending: "unpaid",
  Partial: "partial",
};

export function PayStatusPill({ status }: { status: string }) {
  return <DomainStatusPill taxonomy="payment" status={PAY_STATUS_KEY[status] ?? "unpaid"} />;
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill={i <= rating ? T.antiqueGold : "none"} color={i <= rating ? T.antiqueGold : T.taupe} />)}
    </div>
  );
}

export function Toast({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
      style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: T.darkBurgundy, color: "#FFF", padding: "14px 22px", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 600, zIndex: "var(--z-toast)", whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 9 }}>
      <CheckCircle2 size={16} color={T.antiqueGold} /> {msg}
    </motion.div>
  );
}
