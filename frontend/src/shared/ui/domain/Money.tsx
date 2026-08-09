/**
 * <Money> — design-system/06-DOMAIN.md Part E.4.
 * ═══════════════════════════════════════════════════════════════════════════
 * The intended replacement for the audit's 624 hand-placed `₹` literals and
 * 195 raw `toLocaleString` calls — full rollout across those call sites is
 * explicitly Phase 8's job (Part K), not this pass. This component and
 * `lib/domain/money.ts` are the tested, correct implementation Phase 8's
 * migration will point at.
 *
 *   <Money value={paise} />                    ₹8,400
 *   <Money value={paise} compact />             ₹12.4L
 *   <Money value={paise} decimals={2} />        ₹8,400.00
 *   <Money value={delta} sign colorBySign />    +₹1,200  in --text-success
 *   <Money value={cost} gate="cost" />          ••••  for shop staff
 */
import * as React from "react";
import { cn } from "../utils";
import { formatMoney, type Paise } from "@/lib/domain/money";
import { useDataAccess, type DataAccessScope } from "./DataAccess";

const tabular: React.CSSProperties = { fontVariantNumeric: "tabular-nums lining-nums" };

export interface MoneyProps {
  value: Paise | null | undefined;
  compact?: boolean;
  decimals?: number;
  sign?: boolean;
  /** Positive → `--text-success`, negative → `--text-danger`. Off by default
   *  (most money isn't a delta — only turn this on for genuine +/- values). */
  colorBySign?: boolean;
  /** Hides the value behind `••••` when the current role lacks this scope —
   *  see shared/ui/domain/DataAccess.tsx. */
  gate?: DataAccessScope;
  className?: string;
}

export function Money({ value, compact, decimals, sign, colorBySign, gate, className }: MoneyProps) {
  const allowed = useDataAccess(gate ?? "sell");

  if (gate && !allowed) {
    return (
      <span className={cn("text-[var(--text-tertiary)]", className)} style={tabular} aria-label="Hidden">
        &bull;&bull;&bull;&bull;
      </span>
    );
  }

  if (value == null) {
    return (
      <span className={cn("text-[var(--text-tertiary)]", className)} style={tabular}>
        —
      </span>
    );
  }

  if (value === 0) {
    return (
      <span className={cn("text-[var(--text-tertiary)]", className)} style={tabular}>
        ₹0
      </span>
    );
  }

  const display = formatMoney(value, { compact, decimals, sign });
  const exact = compact ? formatMoney(value, { decimals: 2 }) : undefined;
  const signColor = colorBySign ? (value > 0 ? "text-[var(--text-success)]" : "text-[var(--text-danger)]") : "text-[var(--text-primary)]";

  return (
    <span className={cn(signColor, className)} style={tabular} title={exact}>
      {display}
    </span>
  );
}
