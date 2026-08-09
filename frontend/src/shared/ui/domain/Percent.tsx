/**
 * <Percent> — design-system/06-DOMAIN.md Part F.2.
 * ═══════════════════════════════════════════════════════════════════════════
 *   <Percent value={72} />                  72.0%
 *   <Percent value={14} delta />            ↑ 14.0%  in --text-success
 *   <Percent value={-3} delta invert />     ↓ 3.0%   in --text-success (lower is better)
 *
 * Deltas always carry an arrow glyph — never colour alone (Phase 4's
 * MetricCard rule, WCAG 1.4.1).
 */
import * as React from "react";
import { cn } from "../utils";

const tabular: React.CSSProperties = { fontVariantNumeric: "tabular-nums lining-nums" };

export interface PercentProps {
  value: number | null | undefined;
  /** Renders as a change indicator with an arrow, not a plain figure. */
  delta?: boolean;
  /** When set, a decrease is the good outcome (e.g. defect rate, overdue %) —
   *  flips which direction renders as `--text-success`. */
  invert?: boolean;
  decimals?: number;
  className?: string;
}

export function Percent({ value, delta, invert, decimals = 1, className }: PercentProps) {
  if (value == null) {
    return (
      <span className={cn("text-[var(--text-tertiary)]", className)} style={tabular} aria-label="Not available">
        —
      </span>
    );
  }

  const formatted = `${Math.abs(value).toFixed(decimals)}%`;

  if (!delta) {
    return (
      <span className={cn("text-[var(--text-primary)]", className)} style={tabular}>
        {value.toFixed(decimals)}%
      </span>
    );
  }

  const isUp = value > 0;
  const isDown = value < 0;
  const isGood = value === 0 ? null : invert ? isDown : isUp;
  const colorClass = isGood == null ? "text-[var(--text-tertiary)]" : isGood ? "text-[var(--text-success)]" : "text-[var(--text-danger)]";
  const arrow = isUp ? "↑" : isDown ? "↓" : "–";

  return (
    <span className={cn("inline-flex items-center gap-0.5", colorClass, className)} style={tabular}>
      <span aria-hidden="true">{arrow}</span>
      {formatted}
    </span>
  );
}
