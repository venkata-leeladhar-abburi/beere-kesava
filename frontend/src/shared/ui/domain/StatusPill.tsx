/**
 * <StatusPill taxonomy status> — design-system/06-DOMAIN.md Part D.3.
 * ═══════════════════════════════════════════════════════════════════════════
 * Resolves label/tone from `lib/domain/status.ts`'s registries and renders
 * through the existing `shared/ui/primitives/Badge.tsx` `StatusPill` — whose
 * own comment already flagged this as pending: "design-system/06-DOMAIN.md's
 * 6-tone taxonomy will map onto these at the component boundary once Phase 6
 * lands; today this takes the tone directly."
 *
 *   <StatusPill taxonomy="payment" status="overdue" />   // ● Overdue
 *
 * Callers never pass a colour — "Active" vs "active" is a TypeScript error
 * at the call site, not a possible visual inconsistency (Part D.3).
 */
import { StatusPill as BaseStatusPill } from "../primitives/Badge";
import { resolveStatus, type StatusTaxonomyName, type StatusValueOf } from "@/lib/domain/status";

export interface DomainStatusPillProps<T extends StatusTaxonomyName> {
  taxonomy: T;
  status: StatusValueOf<T>;
  size?: "sm" | "md";
  className?: string;
}

export function StatusPill<T extends StatusTaxonomyName>({ taxonomy, status, size, className }: DomainStatusPillProps<T>) {
  const entry = resolveStatus(taxonomy, status);
  return <BaseStatusPill tone={entry.tone} label={entry.label} size={size} className={className} />;
}
