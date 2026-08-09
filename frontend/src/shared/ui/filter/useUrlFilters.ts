/**
 * useUrlFilters — design-system/05-OVERLAYS.md Part J.
 * ═══════════════════════════════════════════════════════════════════════════
 * Lives the filter-bar's state in the URL (`?status=production&city=Chennai`)
 * instead of a pile of local useState calls — bookmarkable, shareable,
 * survives refresh, and makes browser back/forward work. Same
 * read/write-searchParams shape as nav/Tabs.tsx's `useTabsUrlState`,
 * generalized to a whole object of filter keys at once.
 *
 * A key is omitted from the URL whenever its value equals its default —
 * ?tab=all is never written, only the filters actually applied are.
 */
import * as React from "react";
import { useSearchParams } from "react-router";

export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = { ...defaults };
  for (const key in defaults) {
    const v = searchParams.get(key);
    if (v !== null) filters[key] = v as T[typeof key];
  }

  const setFilter = React.useCallback(
    (key: keyof T, value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value === defaults[key]) params.delete(key as string);
      else params.set(key as string, value);
      setSearchParams(params, { replace: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, setSearchParams]
  );

  const clearAll = React.useCallback(() => {
    const params = new URLSearchParams(searchParams);
    for (const key in defaults) params.delete(key as string);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams]);

  const activeKeys = (Object.keys(defaults) as (keyof T)[]).filter(k => filters[k] !== defaults[k]);

  return { filters, setFilter, clearAll, activeKeys, activeCount: activeKeys.length };
}
