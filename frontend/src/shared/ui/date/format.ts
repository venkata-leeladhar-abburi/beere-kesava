/**
 * Date formatting & typed-entry parsing — design-system/05-OVERLAYS.md Part K.1/K.4.
 * ═══════════════════════════════════════════════════════════════════════════
 * One format set, app-wide. Never `MM/DD/YYYY` — always spell the month so
 * Indian vs. US day/month order is never ambiguous.
 */
import { format as fnsFormat, isValid, parseISO, addDays, addWeeks, addMonths, addYears, startOfDay, differenceInCalendarDays } from "date-fns";

export const DATE_FORMATS = {
  cell: "d MMM yyyy",
  compact: "dd/MM/yy",
  withTime: "d MMM, h:mm a",
  long: "d MMMM yyyy",
  month: "MMM yyyy",
  iso: "yyyy-MM-dd",
} as const;

export function formatDate(date: Date | null | undefined, variant: keyof typeof DATE_FORMATS = "cell"): string {
  if (!date || !isValid(date)) return "";
  return fnsFormat(date, DATE_FORMATS[variant]);
}

/** `2 days ago`, `Today`, `Yesterday`, `in 3 days` — falls back to `cell` format beyond 7 days. */
export function formatRelative(date: Date | null | undefined, reference: Date = new Date()): string {
  if (!date || !isValid(date)) return "";
  const diff = differenceInCalendarDays(startOfDay(date), startOfDay(reference));
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  if (diff < 0 && diff >= -6) return `${-diff} days ago`;
  if (diff > 0 && diff <= 6) return `in ${diff} days`;
  return formatDate(date, "cell");
}

/** `1 Apr – 30 Jun 2026` or, same month, `1 – 30 Jun 2026`. */
export function formatRange(from: Date | null | undefined, to: Date | null | undefined): string {
  if (!from || !isValid(from)) return "";
  if (!to || !isValid(to)) return formatDate(from, "cell");
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
  const sameYear = from.getFullYear() === to.getFullYear();
  if (sameMonth) return `${fnsFormat(from, "d")} – ${fnsFormat(to, "d MMM yyyy")}`;
  if (sameYear) return `${fnsFormat(from, "d MMM")} – ${fnsFormat(to, "d MMM yyyy")}`;
  return `${fnsFormat(from, "d MMM yyyy")} – ${fnsFormat(to, "d MMM yyyy")}`;
}

/** Indian financial year: 1 April – 31 March. */
export function getFinancialYear(date: Date = new Date()): { start: Date; end: Date; label: string } {
  const year = date.getMonth() >= 3 /* April */ ? date.getFullYear() : date.getFullYear() - 1;
  const start = new Date(year, 3, 1);
  const end = new Date(year + 1, 2, 31);
  return { start, end, label: `FY ${year}–${String(year + 1).slice(2)}` };
}

const MONTH_PREFIXES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Typed-entry parser — `12/6/26`, `12 Jun 2026`, `2026-06-12`, `today`,
 * `tomorrow`, `yesterday`, `+7d` / `-2w` / `+1m` / `+1y`. Returns `null` on
 * anything unparseable so the caller can surface a Field error rather than
 * silently reverting.
 */
export function parseTypedDate(input: string, reference: Date = new Date()): Date | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;

  if (s === "today") return startOfDay(reference);
  if (s === "tomorrow") return startOfDay(addDays(reference, 1));
  if (s === "yesterday") return startOfDay(addDays(reference, -1));

  const relative = s.match(/^([+-]\d+)\s*([dwmy])$/);
  if (relative) {
    const n = parseInt(relative[1], 10);
    const base = startOfDay(reference);
    switch (relative[2]) {
      case "d": return addDays(base, n);
      case "w": return addWeeks(base, n);
      case "m": return addMonths(base, n);
      case "y": return addYears(base, n);
    }
  }

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = parseISO(s);
    return isValid(d) ? d : null;
  }

  // Day-first (Indian convention): 12/6/26, 12/06/2026, 12-6-26
  const slash = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const day = parseInt(slash[1], 10);
    const month = parseInt(slash[2], 10);
    const year = slash[3].length === 2 ? 2000 + parseInt(slash[3], 10) : parseInt(slash[3], 10);
    const d = new Date(year, month - 1, day);
    return isValid(d) && d.getMonth() === month - 1 && d.getDate() === day ? d : null;
  }

  // `12 jun 2026` / `12 june 2026`
  const named = s.match(/^(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})$/);
  if (named) {
    const day = parseInt(named[1], 10);
    const monthIdx = MONTH_PREFIXES.findIndex(m => named[2].startsWith(m));
    if (monthIdx === -1) return null;
    const d = new Date(parseInt(named[3], 10), monthIdx, day);
    return isValid(d) && d.getMonth() === monthIdx && d.getDate() === day ? d : null;
  }

  return null;
}
