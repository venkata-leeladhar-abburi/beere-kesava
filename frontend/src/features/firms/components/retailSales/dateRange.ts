/**
 * DateFilterBar state → the `from`/`to` the retail-sale endpoints filter on.
 * ═══════════════════════════════════════════════════════════════════════════
 * Filtering happens on the SERVER: the sale list is capped by pageSize, so
 * filtering the already-fetched page would silently miss rows and quietly
 * understate the firm's revenue. Every DateFilterBar mode collapses to an
 * inclusive day range — "Specific Date" is simply the same day twice, which is
 * what makes picking a single date work at all.
 */
import type { DateFilterState } from "../../../../shared/ui/DateFilterBar";

/** `Date` → `YYYY-MM-DD` in LOCAL time — `toISOString()` shifts the day for
 *  anyone east of UTC, dropping a day's sales out of the filter. */
export function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function filterToRange(f: DateFilterState): { from?: string; to?: string } {
  switch (f.mode) {
    case "day":
      return f.day ? { from: f.day, to: f.day } : {};
    case "range":
      return { from: f.from || undefined, to: f.to || undefined };
    case "month": {
      if (!f.month) return {};
      const [y, m] = f.month.split("-").map(Number);
      if (!y || !m) return {};
      // Day 0 of the next month is the last day of this one.
      return { from: isoDay(new Date(y, m - 1, 1)), to: isoDay(new Date(y, m, 0)) };
    }
    case "year": {
      const y = Number(f.year);
      if (!y) return {};
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    }
    default:
      return {};
  }
}
