import { Skeleton } from "../primitives/Skeleton";
import { Icon } from "../primitives/Icon";

export interface LoadingStateProps {
  variant?: "skeleton" | "spinner" | "inline";
  label?: string;
  /** Skeleton row count, for variant="skeleton". */
  rows?: number;
}

/**
 * The default content-region loading state. Skeleton is the default variant
 * — it holds the layout still and reads as "arriving", not "broken", which
 * a centered spinner does on a slow connection. Use "spinner" only where a
 * skeleton has no sensible shape (a modal, a small panel); "inline" for a
 * loading state next to existing content (e.g. a section refreshing).
 */
export function LoadingState({ variant = "skeleton", label = "Loading…", rows = 4 }: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <span aria-live="polite" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-tertiary)" }}>
        <Icon name="spinner" size="sm" className="animate-spin" />
        <span className="bk-body-sm">{label}</span>
      </span>
    );
  }

  if (variant === "spinner") {
    return (
      <div role="status" aria-live="polite" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-2)", padding: "var(--space-12) var(--space-6)", color: "var(--text-tertiary)" }}>
        <Icon name="spinner" size="lg" className="animate-spin" />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div aria-busy="true" aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-2) 0" }}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Skeleton key={`loading-row-${i}`} style={{ height: 16, width: i === rows - 1 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}
