// Shared period model for the Reports page.
//
// The period selector in the tab bar used to be pure decoration: it held a
// string in ReportsPage state that nothing downstream read, while every chart
// and table aggregated all-time data under a hard-coded "May 2026" banner.
// This module turns the selection into a real date window that each section
// filters its own rows against, plus the matching prior window for the
// "compare period" toggle.

export const PERIODS = [
  "Today",
  "This Week",
  "This Month",
  "This Quarter",
  "This Year",
  "Custom Dates",
  "All Time",
] as const;

export type PeriodKey = (typeof PERIODS)[number];

export interface DateRange {
  from: Date;
  /** Exclusive upper bound — comparisons are `from <= d < to`. */
  to: Date;
  label: string;
}

export interface CustomDates {
  from?: string;
  to?: string;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const fmtDay = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtMonth = (d: Date) => d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

/**
 * Resolves a period selection into its current window and the equally-long
 * window immediately before it. `null` means "no bound" — i.e. All Time, where
 * there is nothing to compare against either.
 */
export function resolvePeriod(
  period: PeriodKey,
  custom: CustomDates = {},
  now: Date = new Date(),
): { current: DateRange | null; prior: DateRange | null } {
  const today = startOfDay(now);

  switch (period) {
    case "Today": {
      const current = { from: today, to: addDays(today, 1), label: fmtDay(today) };
      const priorFrom = addDays(today, -1);
      return { current, prior: { from: priorFrom, to: today, label: fmtDay(priorFrom) } };
    }
    case "This Week": {
      // Weeks run Monday–Sunday.
      const from = addDays(today, -((today.getDay() + 6) % 7));
      const to = addDays(from, 7);
      const priorFrom = addDays(from, -7);
      return {
        current: { from, to, label: `Week of ${fmtDay(from)}` },
        prior: { from: priorFrom, to: from, label: `Week of ${fmtDay(priorFrom)}` },
      };
    }
    case "This Month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const priorFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        current: { from, to, label: fmtMonth(from) },
        prior: { from: priorFrom, to: from, label: fmtMonth(priorFrom) },
      };
    }
    case "This Quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), q * 3, 1);
      const to = new Date(now.getFullYear(), q * 3 + 3, 1);
      const priorFrom = new Date(now.getFullYear(), q * 3 - 3, 1);
      return {
        current: { from, to, label: `Q${q + 1} ${from.getFullYear()}` },
        prior: { from: priorFrom, to: from, label: `Q${((q + 3) % 4) + 1} ${priorFrom.getFullYear()}` },
      };
    }
    case "This Year": {
      const from = new Date(now.getFullYear(), 0, 1);
      const to = new Date(now.getFullYear() + 1, 0, 1);
      const priorFrom = new Date(now.getFullYear() - 1, 0, 1);
      return {
        current: { from, to, label: String(from.getFullYear()) },
        prior: { from: priorFrom, to: from, label: String(priorFrom.getFullYear()) },
      };
    }
    case "Custom Dates": {
      const from = custom.from ? startOfDay(new Date(custom.from)) : null;
      const to = custom.to ? addDays(startOfDay(new Date(custom.to)), 1) : null;
      // An incomplete or invalid custom range is treated as All Time rather
      // than silently emptying every table on the page.
      if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from) {
        return { current: null, prior: null };
      }
      const span = to.getTime() - from.getTime();
      const priorFrom = new Date(from.getTime() - span);
      return {
        current: { from, to, label: `${fmtDay(from)} – ${fmtDay(addDays(to, -1))}` },
        prior: { from: priorFrom, to: from, label: `${fmtDay(priorFrom)} – ${fmtDay(addDays(from, -1))}` },
      };
    }
    case "All Time":
    default:
      return { current: null, prior: null };
  }
}

/** True when `value` (a Date, ISO string, or nullish) falls inside `range`. */
export function inRange(range: DateRange | null, value: string | Date | null | undefined): boolean {
  if (!range) return true; // All Time — everything is in scope.
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return false;
  return d >= range.from && d < range.to;
}
