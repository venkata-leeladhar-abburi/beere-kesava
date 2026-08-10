// Small reusable UI primitives shared across Suppliers sections/modals.

import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Star, CheckCircle2 } from "lucide-react";
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
