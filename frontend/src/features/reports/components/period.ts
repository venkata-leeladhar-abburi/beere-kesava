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

/** What the current window is compared against. */
export type CompareMode = "previous" | "lastYear";

export const COMPARE_MODES: { key: CompareMode; label: string }[] = [
  { key: "previous", label: "Previous period" },
  { key: "lastYear", label: "Same period last year" },
];

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

export interface ResolvedPeriod {
  /** The whole selected window. Null for All Time / an incomplete custom range. */
  current: DateRange | null;
  /**
   * The window the current one is compared against. When the current window
   * is still in progress ("This Month" on the 17th) this covers only the same
   * number of days of the prior window, so 17 days are never measured against
   * a full 30.
   */
  prior: DateRange | null;
  /** True when `current` has not finished yet and the comparison is cut to date. */
  partial: boolean;
  /** The part of `current` the prior window lines up with — "1–17 Oct 2026". */
  compareLabel: string | null;
}

const DAY_MS = 86_400_000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** "2026-10-17" as a local calendar day — `new Date(iso)` reads it as UTC midnight. */
function parseDay(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : startOfDay(new Date(iso));
}

/** Calendar days between two midnights, immune to the DST hour. */
const dayDiff = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);

/** Same date `n` years away, clamped so 29 Feb lands on 28 Feb rather than 1 Mar. */
function shiftYears(d: Date, n: number): Date {
  const y = d.getFullYear() + n;
  const lastDay = new Date(y, d.getMonth() + 1, 0).getDate();
  return new Date(
    y,
    d.getMonth(),
    Math.min(d.getDate(), lastDay),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds()
  );
}

// Fixed month names: ICU builds disagree on en-IN's short September ("Sep" vs
// "Sept"), and these labels land in file names and spreadsheet cells.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const mon = (d: Date) => MONTHS[d.getMonth()]!;
const fmtDay = (d: Date) => `${d.getDate()} ${mon(d)} ${d.getFullYear()}`;
const fmtMonth = (d: Date) => `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

/**
 * A readable span for `[from, to)`: "17 Oct 2026", "1–17 Oct 2026",
 * "28 Sep – 17 Oct 2026" or "28 Dec 2025 – 3 Jan 2026".
 */
export function formatSpan(from: Date, toExclusive: Date): string {
  const last = addDays(toExclusive, -1);
  if (last < from) return fmtDay(from);
  const day = (d: Date) => d.getDate();
  if (from.getFullYear() !== last.getFullYear()) return `${fmtDay(from)} – ${fmtDay(last)}`;
  if (from.getMonth() !== last.getMonth()) {
    return `${day(from)} ${mon(from)} – ${day(last)} ${mon(last)} ${last.getFullYear()}`;
  }
  if (day(from) === day(last)) return fmtDay(from);
  return `${day(from)}–${day(last)} ${mon(last)} ${last.getFullYear()}`;
}

/** The calendar window for a selection, before any comparison is worked out. */
function currentWindow(
  period: PeriodKey,
  custom: CustomDates,
  now: Date
): { range: DateRange; previousFrom: Date } | null {
  const today = startOfDay(now);
  switch (period) {
    case "Today":
      return {
        range: { from: today, to: addDays(today, 1), label: fmtDay(today) },
        previousFrom: addDays(today, -1),
      };
    case "This Week": {
      // Weeks run Monday–Sunday.
      const from = addDays(today, -((today.getDay() + 6) % 7));
      return {
        range: { from, to: addDays(from, 7), label: `Week of ${fmtDay(from)}` },
        previousFrom: addDays(from, -7),
      };
    }
    case "This Month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        range: {
          from,
          to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          label: fmtMonth(from),
        },
        previousFrom: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      };
    }
    case "This Quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), q * 3, 1);
      return {
        range: {
          from,
          to: new Date(now.getFullYear(), q * 3 + 3, 1),
          label: `Q${q + 1} ${from.getFullYear()}`,
        },
        previousFrom: new Date(now.getFullYear(), q * 3 - 3, 1),
      };
    }
    case "This Year": {
      const from = new Date(now.getFullYear(), 0, 1);
      return {
        range: {
          from,
          to: new Date(now.getFullYear() + 1, 0, 1),
          label: String(from.getFullYear()),
        },
        previousFrom: new Date(now.getFullYear() - 1, 0, 1),
      };
    }
    case "Custom Dates": {
      const from = custom.from ? parseDay(custom.from) : null;
      const to = custom.to ? addDays(parseDay(custom.to), 1) : null;
      // An incomplete or invalid custom range is treated as All Time rather
      // than silently emptying every table on the page.
      if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from) return null;
      // Whole calendar months (1 Sep – 30 Sep) compare with the same number
      // of whole months before (all of August), not "the 30 days before".
      const months =
        from.getDate() === 1 && to.getDate() === 1
          ? (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
          : 0;
      return {
        range: { from, to, label: formatSpan(from, to) },
        previousFrom:
          months > 0
            ? new Date(from.getFullYear(), from.getMonth() - months, 1)
            : addDays(from, -dayDiff(from, to)),
      };
    }
    case "All Time":
    default:
      return null;
  }
}

/** The natural label for a whole prior window of the same kind as `period`. */
function wholePriorLabel(period: PeriodKey, from: Date, to: Date, mode: CompareMode): string {
  switch (period) {
    case "Today":
      return fmtDay(from);
    case "This Week":
      // A year back the same dates rarely start on a Monday.
      return mode === "lastYear" ? formatSpan(from, to) : `Week of ${fmtDay(from)}`;
    case "This Month":
      return fmtMonth(from);
    case "This Quarter":
      return `Q${Math.floor(from.getMonth() / 3) + 1} ${from.getFullYear()}`;
    case "This Year":
      return String(from.getFullYear());
    default:
      return formatSpan(from, to);
  }
}

/**
 * Resolves a period selection into its current window and the window it is
 * compared against. `null` means "no bound" — i.e. All Time, where there is
 * nothing to compare against either.
 */
export function resolvePeriod(
  period: PeriodKey,
  custom: CustomDates = {},
  now: Date = new Date(),
  compareMode: CompareMode = "previous"
): ResolvedPeriod {
  const win = currentWindow(period, custom, now);
  if (!win) return { current: null, prior: null, partial: false, compareLabel: null };
  const { range: current } = win;

  const priorFrom = compareMode === "lastYear" ? shiftYears(current.from, -1) : win.previousFrom;
  const priorEnd = compareMode === "lastYear" ? shiftYears(current.to, -1) : current.from;

  const partial = now >= current.from && now < current.to;
  if (!partial) {
    return {
      current,
      prior: {
        from: priorFrom,
        to: priorEnd,
        label: wholePriorLabel(period, priorFrom, priorEnd, compareMode),
      },
      partial: false,
      compareLabel: current.label,
    };
  }

  // In progress: compare like with like. "Today" is cut at the current time
  // of day; longer windows at the end of today's equivalent day, so the 17th
  // of this month lines up with the 17th of the last one.
  if (period === "Today") {
    const elapsed = now.getTime() - current.from.getTime();
    const priorTo = new Date(Math.min(priorFrom.getTime() + elapsed, priorEnd.getTime()));
    const till = `till ${fmtTime(now)}`;
    return {
      current,
      prior: { from: priorFrom, to: priorTo, label: `${fmtDay(priorFrom)}, ${till}` },
      partial: true,
      compareLabel: `${fmtDay(current.from)}, ${till}`,
    };
  }

  const elapsedDays = dayDiff(current.from, now) + 1;
  const cut = addDays(priorFrom, elapsedDays);
  const priorTo = cut < priorEnd ? cut : priorEnd;
  return {
    current,
    prior: { from: priorFrom, to: priorTo, label: formatSpan(priorFrom, priorTo) },
    partial: true,
    compareLabel: formatSpan(current.from, addDays(startOfDay(now), 1)),
  };
}

/** True when `value` (a Date, ISO string, or nullish) falls inside `range`. */
export function inRange(range: DateRange | null, value: string | Date | null | undefined): boolean {
  if (!range) return true; // All Time — everything is in scope.
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return false;
  return d >= range.from && d < range.to;
}

/** Local-date ISO (yyyy-mm-dd) — toISOString() would shift across the UTC boundary. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
