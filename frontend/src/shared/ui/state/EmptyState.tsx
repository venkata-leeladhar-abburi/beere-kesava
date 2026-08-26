import { StateView, type StateAction } from "./StateView";
import type { IconName } from "../primitives/icons";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: StateAction;
  compact?: boolean;
}

/** No data has ever existed here — the non-table equivalent of TableEmpty. */
export function EmptyState({ icon = "info", title, description, action, compact }: EmptyStateProps) {
  return <StateView icon={icon} title={title} description={description} action={action} compact={compact} />;
}

/** Data exists, current filters matched nothing. Never render identically to EmptyState. */
export function FilteredEmptyState({ onClearFilters, compact }: { onClearFilters: () => void; compact?: boolean }) {
  return (
    <StateView
      icon="search"
      title="No results match your filters"
      description="Try removing a filter or broadening your search."
      action={{ label: "Clear all filters", onClick: onClearFilters }}
      compact={compact}
    />
  );
}
