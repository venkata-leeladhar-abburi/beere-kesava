import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Write a mutation's response straight into the list cache so the change is on
 * screen immediately, instead of only after the invalidated refetch lands.
 *
 * The database is a remote pooler, so every round trip costs real time: the
 * old `onSuccess: () => invalidateQueries(...)` pattern meant a create/edit
 * showed nothing until a second GET completed. These helpers close that gap.
 * They are always paired with — never a replacement for — the existing
 * invalidate: the seeded row is a fast, approximate view that the refetch then
 * reconciles against server truth.
 *
 * The subtlety these wrap is that a list row is frequently *not* the same
 * shape as what the write endpoint returns. `POST /customers` hands back the
 * raw Customer row, while `GET /customers` decorates every row with
 * `totalPurchases` / `totalSpend` / `lastPurchaseDate` computed off
 * SaleRecord. Assigning the response over the cached row would blank those
 * fields until the refetch arrived — a visible flicker of wrong numbers,
 * which is worse than the delay this is meant to fix. So `upsertInList`
 * *merges* onto the existing row, and inserts take an explicit `seed` for the
 * fields the write endpoint does not return.
 */

/**
 * Invalidate every query whose key's first segment contains `term`.
 *
 * `invalidateQueries({ queryKey: [...] })` matches by prefix, which is exact
 * enough to miss siblings that describe the same data under a differently
 * spelled root — weavers alone are cached under `["weavers", "list"]`,
 * `["weavers-list"]`, `["weavers-table-payments"]`,
 * `["payments-weavers-roster"]` and more. Hand-listing those goes stale the
 * moment someone adds a screen: the weaver mutations were invalidating four
 * keys (`weavers-directory`, `weavers-table-roster`, `weavers-card-roster`,
 * `weavers-page-roster`) that no query has ever used, so registering, editing
 * or deleting a weaver refreshed nothing at all and the roster only caught up
 * on a full page reload.
 *
 * Matching on the substring instead is deliberately broad: over-refetching a
 * related list is cheap and self-correcting, while missing one shows the user
 * stale data indefinitely.
 */
export function invalidateQueriesMentioning(queryClient: QueryClient, term: string): void {
  void queryClient.invalidateQueries({
    predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].includes(term),
  });
}

/** Minimum a record needs to be addressable in a cached list. */
export interface Identifiable {
  id: string;
}

/**
 * Merge `item` into the cached array at `key`, matching on `id`.
 *
 * An existing row is updated field-by-field (`{ ...existing, ...item }`), so
 * list-only computed fields absent from a write response survive untouched.
 * A row not already present is inserted, with `seed` supplying those computed
 * fields — for a freshly created record their true values are the empty ones
 * (zero purchases, no last visit), which the caller states explicitly rather
 * than leaving `undefined` to reach the UI.
 *
 * `position` controls where an insert lands; it should mirror the list
 * query's own `orderBy`. Most lists here are newest-first, hence the default.
 *
 * No-ops when the query has no cached data — there is nothing on screen to
 * update, and seeding a list the user has not loaded would invent a
 * single-row cache that the next render mistakes for a complete result.
 */
export function upsertInList<T extends Identifiable>(
  queryClient: QueryClient,
  key: QueryKey,
  item: Partial<T> & Identifiable,
  options: { seed?: Partial<T>; position?: "start" | "end" } = {},
): void {
  const { seed, position = "start" } = options;

  queryClient.setQueryData<T[]>(key, (current) => {
    if (!current) return current;

    const index = current.findIndex((row) => row.id === item.id);
    if (index === -1) {
      const inserted = { ...seed, ...item } as T;
      return position === "start" ? [inserted, ...current] : [...current, inserted];
    }

    const next = current.slice();
    next[index] = { ...current[index], ...item };
    return next;
  });
}

/**
 * Drop the row with `id` from the cached array at `key`.
 *
 * Deletes are the one case where the write response carries no replacement
 * data, so removing the row locally is the only way to make it disappear
 * before the refetch. Safe to run against a delete that the server later
 * rejects: the paired invalidate restores the row from server truth.
 */
export function removeFromList<T extends Identifiable>(
  queryClient: QueryClient,
  key: QueryKey,
  id: string,
): void {
  queryClient.setQueryData<T[]>(key, (current) =>
    current ? current.filter((row) => row.id !== id) : current,
  );
}

/**
 * Apply `patch` to every cached row at `key` that `match` selects.
 *
 * The `id`-keyed helpers above cover records whose identity field is literally
 * `id`. Plenty here are not: batches are keyed by `batchId`, purchase orders
 * by `poNumber`, and some updates target a row *inside* a record (tallying one
 * saree within a batch) rather than the record itself. This takes the
 * predicate and the transform directly so those cases don't have to
 * contort into an `id` shape they don't have.
 *
 * `patch` may be a partial (merged onto the row) or a function returning the
 * replacement row, for updates that need to read the current value.
 */
export function patchListItems<T>(
  queryClient: QueryClient,
  key: QueryKey,
  match: (row: T) => boolean,
  patch: Partial<T> | ((row: T) => T),
): void {
  queryClient.setQueryData<T[]>(key, (current) =>
    current?.map((row) => {
      if (!match(row)) return row;
      return typeof patch === "function" ? patch(row) : { ...row, ...patch };
    }),
  );
}

/**
 * Drop every cached row at `key` that `match` selects — the predicate form of
 * `removeFromList`, for records not keyed by `id`.
 */
export function removeFromListWhere<T>(
  queryClient: QueryClient,
  key: QueryKey,
  match: (row: T) => boolean,
): void {
  queryClient.setQueryData<T[]>(key, (current) => current?.filter((row) => !match(row)));
}

/** The list envelope returned by the paginated endpoints. */
interface ListEnvelope<T> {
  items: T[];
  total?: number;
}

/**
 * Drop matching rows from a cached *envelope* (`{ items, total }`) rather than
 * a bare array.
 *
 * Some screens cache the endpoint's response as-is instead of unwrapping
 * `.items` in the queryFn, so the array-shaped helpers above don't fit. `total`
 * is decremented along with the removal where present, since it usually drives
 * a visible count next to the list.
 */
export function removeFromEnvelopeWhere<T>(
  queryClient: QueryClient,
  key: QueryKey,
  match: (row: T) => boolean,
): void {
  queryClient.setQueryData<ListEnvelope<T>>(key, (current) => {
    if (!current) return current;
    const items = current.items.filter((row) => !match(row));
    const removed = current.items.length - items.length;
    return {
      ...current,
      items,
      ...(current.total === undefined ? {} : { total: Math.max(0, current.total - removed) }),
    };
  });
}

/**
 * Apply `patch` to matching rows inside a cached envelope — the envelope
 * counterpart to `patchListItems`.
 */
export function patchEnvelopeItems<T>(
  queryClient: QueryClient,
  key: QueryKey,
  match: (row: T) => boolean,
  patch: Partial<T> | ((row: T) => T),
): void {
  queryClient.setQueryData<ListEnvelope<T>>(key, (current) =>
    current
      ? {
          ...current,
          items: current.items.map((row) => {
            if (!match(row)) return row;
            return typeof patch === "function" ? patch(row) : { ...row, ...patch };
          }),
        }
      : current,
  );
}

/**
 * Add `items` to the front of a cached envelope's `items`, bumping `total`.
 * The envelope counterpart to `prependToList`.
 */
export function prependToEnvelope<T>(queryClient: QueryClient, key: QueryKey, items: T[]): void {
  if (items.length === 0) return;
  queryClient.setQueryData<ListEnvelope<T>>(key, (current) =>
    current
      ? {
          ...current,
          items: [...items, ...current.items],
          ...(current.total === undefined ? {} : { total: current.total + items.length }),
        }
      : current,
  );
}

/**
 * Prepend `item` to the cached array at `key` without matching on `id`.
 *
 * For append-only logs (issue records, movement history, payment entries)
 * where each write is a new entry and there is no existing row to merge with.
 */
export function prependToList<T>(queryClient: QueryClient, key: QueryKey, item: T): void {
  prependAllToList(queryClient, key, [item]);
}

/**
 * Prepend several entries at once, preserving their order relative to each
 * other. For the flows that submit a batch of rows in one action (a run of
 * weaver payments, several warp requests) and would otherwise need a loop that
 * silently reverses them.
 */
export function prependAllToList<T>(queryClient: QueryClient, key: QueryKey, items: T[]): void {
  if (items.length === 0) return;
  queryClient.setQueryData<T[]>(key, (current) => (current ? [...items, ...current] : current));
}
