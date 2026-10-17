// Trend-chart buckets for the selected period, with the prior period lined up
// bucket for bucket so the two can be drawn on one axis.
//
// The trend charts used to bucket by day-of-month ("Week 1 (1–7)") whatever
// the period was, so "This Year" or "All Time" folded every month onto the
// same four bars, and the "prior" line was simply the four weeks before the
// last four that happened to have data.

import type { DateRange } from "./period";

export type Bucket = "hour" | "day" | "week" | "month";

export interface SeriesPoint {
  label: string;
  current: number;
  /** Null when not comparing. */
  prior: number | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Bucket size that keeps a chart readable: hours for a day, days up to ~6 weeks, then weeks, then months. */
export function pickBucket(from: Date, to: Date): Bucket {
  const days = (to.getTime() - from.getTime()) / DAY_MS;
  if (days <= 1.01) return "hour";
  if (days <= 45) return "day";
  if (days <= 190) return "week";
  return "month";
}

/** Start of bucket `i` counted from `origin`, in calendar steps (DST-safe). */
function bucketStart(origin: Date, bucket: Bucket, i: number): Date {
  switch (bucket) {
    case "hour":
      return new Date(
        origin.getFullYear(),
        origin.getMonth(),
        origin.getDate(),
        origin.getHours() + i
      );
    case "day":
      return new Date(origin.getFullYear(), origin.getMonth(), origin.getDate() + i);
    case "week":
      return new Date(origin.getFullYear(), origin.getMonth(), origin.getDate() + i * 7);
    case "month":
      return new Date(origin.getFullYear(), origin.getMonth() + i, 1);
  }
}

function bucketLabel(start: Date, end: Date, bucket: Bucket): string {
  switch (bucket) {
    case "hour":
      return `${String(start.getHours()).padStart(2, "0")}:00`;
    case "day":
      return `${start.getDate()} ${MONTHS[start.getMonth()]}`;
    case "week": {
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
      return start.getMonth() === last.getMonth()
        ? `${start.getDate()}–${last.getDate()} ${MONTHS[last.getMonth()]}`
        : `${start.getDate()} ${MONTHS[start.getMonth()]}–${last.getDate()} ${MONTHS[last.getMonth()]}`;
    }
    case "month":
      return `${MONTHS[start.getMonth()]} '${String(start.getFullYear()).slice(2)}`;
  }
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Sums `amountOf` (default: a count) per bucket across the current window (cut at today, so the
 * rest of an unfinished month is not drawn as a collapse to zero) and, when
 * `prior` is given, across the prior window bucket-for-bucket.
 *
 * With no current window (All Time) the axis runs from the earliest item to
 * today.
 */
export function buildSeries<T>(opts: {
  current: DateRange | null;
  prior: DateRange | null;
  currentItems: readonly T[];
  priorItems?: readonly T[];
  dateOf: (item: T) => string | Date | null | undefined;
  /** Not `valueOf`: that name is inherited from Object.prototype and would
   *  shadow the destructuring default. */
  amountOf?: (item: T) => number;
  now?: Date;
}): { points: SeriesPoint[]; bucket: Bucket } {
  const { current, prior, currentItems, priorItems = [], dateOf, amountOf = () => 1 } = opts;
  const now = opts.now ?? new Date();
  const tomorrow = new Date(startOfDay(now).getTime() + DAY_MS);

  let from: Date;
  let to: Date;
  if (current) {
    from = current.from;
    to = current.to < tomorrow ? current.to : tomorrow;
    if (to <= from) to = current.to; // a window wholly in the future
  } else {
    const dates = currentItems.map((i) => toDate(dateOf(i))).filter((d): d is Date => !!d);
    if (dates.length === 0) return { points: [], bucket: "month" };
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    from = startOfDay(min);
    to = tomorrow;
  }

  let bucket = pickBucket(from, to);
  // Month buckets always begin on the 1st so labels read as calendar months.
  let origin = bucket === "month" ? new Date(from.getFullYear(), from.getMonth(), 1) : from;
  const starts: Date[] = [];
  for (let i = 0; i < 400; i++) {
    const s = bucketStart(origin, bucket, i);
    if (s >= to) break;
    starts.push(s);
  }
  if (starts.length === 0) {
    bucket = "day";
    origin = from;
    starts.push(from);
  }
  const ends = starts.map((_, i) => bucketStart(origin, bucket, i + 1));

  const indexIn = (d: Date, baseOrigin: Date): number => {
    if (d < baseOrigin) return -1;
    let lo = 0;
    let hi = starts.length - 1;
    // Binary search over the bucket starts derived from `baseOrigin`.
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const s = bucketStart(baseOrigin, bucket, mid);
      const e = bucketStart(baseOrigin, bucket, mid + 1);
      if (d < s) hi = mid - 1;
      else if (d >= e) lo = mid + 1;
      else return mid;
    }
    return -1;
  };

  const cur = starts.map(() => 0);
  for (const item of currentItems) {
    const d = toDate(dateOf(item));
    if (!d) continue;
    const i = indexIn(d, origin);
    if (i >= 0 && d < to) cur[i]! += amountOf(item);
  }

  let pri: number[] | null = null;
  if (prior) {
    const priorOrigin =
      bucket === "month"
        ? new Date(prior.from.getFullYear(), prior.from.getMonth(), 1)
        : prior.from;
    pri = starts.map(() => 0);
    for (const item of priorItems) {
      const d = toDate(dateOf(item));
      if (!d || d < prior.from || d >= prior.to) continue;
      const i = indexIn(d, priorOrigin);
      if (i >= 0) pri[i]! += amountOf(item);
    }
  }

  return {
    bucket,
    points: starts.map((s, i) => ({
      label: bucketLabel(s, ends[i]!, bucket),
      current: Math.round(cur[i]! * 100) / 100,
      prior: pri ? Math.round(pri[i]! * 100) / 100 : null,
    })),
  };
}

/** "per day", "per week"… for chart subtitles. */
export function bucketPhrase(bucket: Bucket): string {
  return { hour: "by hour", day: "by day", week: "by week", month: "by month" }[bucket];
}
