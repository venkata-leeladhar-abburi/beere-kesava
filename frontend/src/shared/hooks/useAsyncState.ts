/**
 * The standard shape a screen derives from a query/mutation result, so
 * "is this screen loading / errored / empty / filtered-empty" stops being
 * computed a different way in every file. Works with anything shaped like
 * React Query's result (or a legacy context exposing the same fields).
 */
export interface AsyncStateInput<T> {
  data: T | undefined;
  isLoading: boolean;
  error: unknown;
  /** Present when the caller has active filters/search applied. */
  isFiltered?: boolean;
}

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: unknown;
  /** Loaded successfully, but the collection has zero items. */
  empty: boolean;
  /** Loaded successfully, zero items, AND filters are active — render
   *  FilteredEmptyState instead of EmptyState; they must never look alike. */
  filteredEmpty: boolean;
}

function isEmptyCollection(data: unknown): boolean {
  if (Array.isArray(data)) return data.length === 0;
  if (data && typeof data === "object" && "items" in data) {
    const items = (data as { items?: unknown }).items;
    return Array.isArray(items) && items.length === 0;
  }
  return false;
}

export function useAsyncState<T>({
  data,
  isLoading,
  error,
  isFiltered = false,
}: AsyncStateInput<T>): AsyncState<T> {
  const empty = !isLoading && !error && isEmptyCollection(data);

  return {
    data,
    loading: isLoading,
    error,
    empty: empty && !isFiltered,
    filteredEmpty: empty && isFiltered,
  };
}
