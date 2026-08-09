/**
 * FilterBar — design-system/05-OVERLAYS.md Part J.
 * ═══════════════════════════════════════════════════════════════════════════
 * The row anatomy only: search + filter triggers as children, plus an
 * active-filters row below built from Phase 3's own `Chip` ("the one member
 * of the badge family that's interactive/removable — used for active
 * filters", per Chip.tsx's own doc comment — there is no separate
 * FilterChip, Chip already is that). Pair with `useUrlFilters` for the
 * `?status=production&city=Chennai` URL-state half of the contract.
 */
import * as React from "react";
import { cn } from "../utils";
import { Chip } from "../primitives/Chip";
import { Button } from "../primitives/Button";

export function FilterBar({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 flex-wrap rounded-[var(--radius-lg)] border p-4",
        "bg-[var(--surface-raised)]",
        className
      )}
      style={{ borderColor: "var(--border-default)" }}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ActiveFilter {
  key: string;
  label: React.ReactNode;
  onRemove: () => void;
}

export interface FilterBarActiveProps {
  filters: ActiveFilter[];
  onClearAll?: () => void;
  className?: string;
}

/** Renders nothing when no filter is active — mount unconditionally. */
export function FilterBarActive({ filters, onClearAll, className }: FilterBarActiveProps) {
  if (filters.length === 0) return null;
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {filters.map(f => (
        <Chip key={f.key} label={f.label} onRemove={f.onRemove} />
      ))}
      {onClearAll && (
        <Button variant="link" size="sm" onClick={onClearAll}>
          Clear all
        </Button>
      )}
    </div>
  );
}
