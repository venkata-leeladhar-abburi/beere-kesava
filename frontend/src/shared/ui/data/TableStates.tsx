/**
 * The five mandatory table states — design-system/04-DATA-DISPLAY.md Part F.
 * "Filtered-empty" is distinct from "empty": a table with 3 filters applied
 * that matches nothing must never look identical to a table with no data at
 * all — that reads as data loss (Part F.3, the state this app was missing
 * most often before this component existed).
 */
import { Icon } from "../primitives/Icon";
import { Button } from "../primitives/Button";
import { Skeleton } from "../primitives/Skeleton";
import type { IconName } from "../primitives/icons";

interface TableEmptyProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

function TableEmptyBase({ icon = "search", title, description, action }: TableEmptyProps) {
  return (
    <div
      role="status"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "var(--space-3)", padding: "var(--space-16) var(--space-6)", textAlign: "center",
        color: "var(--text-tertiary)",
      }}
    >
      <Icon name={icon} size="xl" />
      <div className="bk-title-sm" style={{ color: "var(--text-primary)" }}>{title}</div>
      {description && (
        <div className="bk-body-md" style={{ color: "var(--text-secondary)", maxWidth: "40ch" }}>
          {description}
        </div>
      )}
      {action && (
        <Button variant="primary" size="lg" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}

/** No data has ever existed for this table. */
export function TableEmpty(props: Omit<TableEmptyProps, "icon"> & { icon?: IconName }) {
  return <TableEmptyBase icon={props.icon ?? "info"} {...props} />;
}

/** Data exists, but the current filters/search matched nothing — NEVER
 *  render the same as TableEmpty; always offer a way out. */
export function TableFilteredEmpty({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <TableEmptyBase
      icon="search"
      title="No results match your filters"
      description="Try removing a filter or broadening your search."
      action={{ label: "Clear all filters", onClick: onClearFilters }}
    />
  );
}

export function TableError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert">
      <TableEmptyBase
        icon="error"
        title="Couldn't load this data"
        description="Check your connection and try again."
        action={{ label: "Retry", onClick: onRetry }}
      />
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" style={{ padding: "var(--space-2) 0" }}>
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: "flex", gap: "var(--space-4)", alignItems: "center",
            height: "var(--row-height-default, 48px)", padding: "0 var(--pad-cell-x, 16px)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} style={{ height: 14, flex: c === 0 ? 2 : 1, minWidth: 40 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
