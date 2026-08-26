/**
 * The five mandatory table states — design-system/04-DATA-DISPLAY.md Part F.
 * "Filtered-empty" is distinct from "empty": a table with 3 filters applied
 * that matches nothing must never look identical to a table with no data at
 * all — that reads as data loss (Part F.3, the state this app was missing
 * most often before this component existed).
 *
 * Built on the shared StateView shell (ui/state/StateView.tsx) so a table's
 * empty/error states and a page-level empty/error state never drift apart.
 */
import { StateView } from "../state/StateView";
import { Skeleton } from "../primitives/Skeleton";
import type { IconName } from "../primitives/icons";

interface TableEmptyProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

/** No data has ever existed for this table. */
export function TableEmpty({ icon = "info", title, description, action }: TableEmptyProps) {
  return <StateView icon={icon} title={title} description={description} action={action} />;
}

/** Data exists, but the current filters/search matched nothing — NEVER
 *  render the same as TableEmpty; always offer a way out. */
export function TableFilteredEmpty({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <StateView
      icon="search"
      title="No results match your filters"
      description="Try removing a filter or broadening your search."
      action={{ label: "Clear all filters", onClick: onClearFilters }}
    />
  );
}

export function TableError({ onRetry }: { onRetry: () => void }) {
  return (
    <StateView
      role="alert"
      icon="error"
      title="Couldn't load this data"
      description="Check your connection and try again."
      action={{ label: "Retry", onClick: onRetry }}
    />
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" style={{ padding: "var(--space-2) 0" }}>
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, r) => (
        // Placeholder skeleton rows with no backing data — position is the only identity.
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={`skeleton-row-${r}`}
          style={{
            display: "flex", gap: "var(--space-4)", alignItems: "center",
            height: "var(--row-height-default, 48px)", padding: "0 var(--pad-cell-x, 16px)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            // Placeholder skeleton cells with no backing data — position is the only identity.
            // eslint-disable-next-line react/no-array-index-key
            <Skeleton key={`skeleton-cell-${c}`} style={{ height: 14, flex: c === 0 ? 2 : 1, minWidth: 40 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
