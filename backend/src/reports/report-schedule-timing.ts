import { ReportFrequency } from "../generated/prisma/client";

/**
 * Every scheduled report fires at a wall-clock time the office recognises,
 * so the dates shown in the UI are the dates the designer/admin actually
 * gets the file. India has no DST, so a fixed offset is exact — no tz
 * database needed, and no drift twice a year.
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const DEFAULT_DELIVERY_HOUR = 9;
export const DEFAULT_DELIVERY_MINUTE = 0;

export interface ScheduleTiming {
  frequency: ReportFrequency;
  /** Hour of day in IST, 0–23. */
  deliveryHour: number;
  /** Minute of hour, 0–59. */
  deliveryMinute: number;
  /**
   * Fixes the recurrence phase: WEEKLY repeats on this date's weekday,
   * MONTHLY on its day-of-month, QUARTERLY on its day-of-month every third
   * month counted from its month. Normally the schedule's createdAt.
   */
  anchor: Date;
}

/** Calendar fields of an instant, read in IST. */
function istParts(date: Date) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

/** Days in an IST calendar month. Month is 0-indexed and may overflow. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Builds the UTC instant for an IST calendar date at hour:minute. */
function istInstant(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0) - IST_OFFSET_MS);
}

function clampHour(value: number): number {
  return Number.isFinite(value) ? Math.min(23, Math.max(0, Math.trunc(value))) : DEFAULT_DELIVERY_HOUR;
}

function clampMinute(value: number): number {
  return Number.isFinite(value) ? Math.min(59, Math.max(0, Math.trunc(value))) : DEFAULT_DELIVERY_MINUTE;
}

/**
 * The next `count` delivery instants strictly after `from`, oldest first.
 *
 * Strictly after, not on-or-after: a report that has just been delivered at
 * 09:00 must not report 09:00 today as still upcoming, or the 15-minute poll
 * would send it again for the rest of the hour.
 */
export function listUpcomingRuns(timing: ScheduleTiming, count = 5, from: Date = new Date()): Date[] {
  const hour = clampHour(timing.deliveryHour);
  const minute = clampMinute(timing.deliveryMinute);
  const anchor = istParts(timing.anchor);
  const today = istParts(from);
  const runs: Date[] = [];

  if (timing.frequency === ReportFrequency.DAILY) {
    let candidate = istInstant(today.year, today.month, today.day, hour, minute);
    while (runs.length < count) {
      if (candidate.getTime() > from.getTime()) {
        runs.push(candidate);
      }
      candidate = new Date(candidate.getTime() + 24 * 60 * 60 * 1000);
    }
    return runs;
  }

  if (timing.frequency === ReportFrequency.WEEKLY) {
    // Days forward from today to the anchor's weekday (0 when it *is* today,
    // which the strictly-after test below then rejects if the time has passed).
    const offset = (anchor.weekday - today.weekday + 7) % 7;
    let candidate = istInstant(today.year, today.month, today.day + offset, hour, minute);
    while (runs.length < count) {
      if (candidate.getTime() > from.getTime()) {
        runs.push(candidate);
      }
      candidate = new Date(candidate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    return runs;
  }

  // MONTHLY and QUARTERLY differ only in stride. Both walk month indices
  // rather than adding milliseconds, so a 31st anchor lands on the 30th in
  // a 30-day month instead of spilling into the next one.
  const stride = timing.frequency === ReportFrequency.QUARTERLY ? 3 : 1;
  const absoluteAnchorMonth = anchor.year * 12 + anchor.month;
  const absoluteToday = today.year * 12 + today.month;
  // Snap to the first on-phase month that is not in the past.
  const phaseGap = ((absoluteAnchorMonth - absoluteToday) % stride + stride) % stride;
  let absoluteMonth = absoluteToday + phaseGap;

  while (runs.length < count) {
    const year = Math.floor(absoluteMonth / 12);
    const month = absoluteMonth % 12;
    const day = Math.min(anchor.day, daysInMonth(year, month));
    const candidate = istInstant(year, month, day, hour, minute);
    if (candidate.getTime() > from.getTime()) {
      runs.push(candidate);
    }
    absoluteMonth += stride;
  }

  return runs;
}

/** The single next delivery instant strictly after `from`. */
export function computeNextRunAt(timing: ScheduleTiming, from: Date = new Date()): Date {
  return listUpcomingRuns(timing, 1, from)[0];
}

/** "09:00" → { hour: 9, minute: 0 }. Falls back to the 09:00 default. */
export function parseDeliveryTime(value?: string | null): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? "").trim());
  if (!match) {
    return { hour: DEFAULT_DELIVERY_HOUR, minute: DEFAULT_DELIVERY_MINUTE };
  }
  return { hour: clampHour(Number(match[1])), minute: clampMinute(Number(match[2])) };
}
