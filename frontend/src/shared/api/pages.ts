// Walks a paginated list endpoint to the end.
//
// Several report screens totalled money and counts over a single capped page
// (100–500 rows), so once a list outgrew it the oldest records silently fell
// out of every figure. Anything that sums or counts across a whole list must
// read it through this.

export interface Page<T> {
  items: T[];
  total: number;
}

/**
 * Fetches page 1 (for the total), then the remaining pages in parallel.
 * A record created between page fetches shifts later pages by one, so the
 * same row can arrive twice — `key` drops the repeat. `maxPages` is a safety
 * stop, not an expected limit.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<Page<T>>,
  pageSize: number,
  opts: { key?: (item: T) => string; maxPages?: number } = {}
): Promise<T[]> {
  const { key, maxPages = 50 } = opts;
  const first = await fetchPage(1);
  const pages = Math.min(Math.ceil(first.total / pageSize), maxPages);
  const rest =
    pages > 1
      ? await Promise.all(Array.from({ length: pages - 1 }, (_, i) => fetchPage(i + 2)))
      : [];
  const all = [first, ...rest].flatMap((p) => p.items);
  if (!key) return all;
  const seen = new Set<string>();
  return all.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
