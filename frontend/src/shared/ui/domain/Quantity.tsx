/**
 * <Quantity> — design-system/06-DOMAIN.md Part F.1.
 * ═══════════════════════════════════════════════════════════════════════════
 *   <Quantity value={620} unit="g" />        620 g
 *   <Quantity value={1240} unit="g" />       1.24 kg   (auto-promotes)
 *   <Quantity value={18} unit="saree" />     18 sarees (pluralised)
 *   <Quantity value={2.5} unit="m" />        2.5 m
 *
 * Always Inter + tabular figures — never mono (Part C.4's mono-reclaim: this
 * is one of the categories that used to be `fontFamily: F.mono`).
 */
import * as React from "react";
import { cn } from "../utils";
import { resolveQuantity } from "@/lib/domain/units";

const tabular: React.CSSProperties = { fontVariantNumeric: "tabular-nums lining-nums" };

export interface QuantityProps {
  value: number | null | undefined;
  unit: string;
  className?: string;
}

export function Quantity({ value, unit, className }: QuantityProps) {
  if (value == null) {
    return (
      <span className={cn("text-[var(--text-tertiary)]", className)} style={tabular} aria-label="Not available">
        —
      </span>
    );
  }

  const q = resolveQuantity(value, unit);
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: q.decimals,
    maximumFractionDigits: q.decimals,
  }).format(q.value);

  return (
    <span className={cn("text-[var(--text-primary)]", className)} style={tabular}>
      {formatted} <span className="text-[var(--text-tertiary)]">{q.unit}</span>
    </span>
  );
}
