/**
 * Today's date as YYYY-MM-DD, in the user's own timezone.
 *
 * `new Date().toISOString().split("T")[0]` is the UTC day, which in India is
 * still yesterday until 05:30 — a payment recorded at 2 a.m. defaulted to the
 * previous day's date.
 */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * A "YYYY-MM-DD" day as local midnight. `new Date("2026-10-24")` is UTC
 * midnight instead, which is the previous evening anywhere west of Greenwich.
 */
export function parseISODay(day: string): Date {
  const [y = 0, m = 1, d = 1] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * The calendar day ("YYYY-MM-DD") an API date stands for.
 *
 * Day-only fields (payment dates) are stored as that day's UTC midnight, so
 * their UTC date is the day itself in every timezone. Anything with a real
 * time of day (a record defaulted to `now()`) is an instant, and the day it
 * fell on is the user's local one.
 */
export function calendarDay(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value.slice(0, 10) : "";
  if (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  ) {
    return d.toISOString().slice(0, 10);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
