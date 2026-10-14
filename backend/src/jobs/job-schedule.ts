/**
 * When each scheduled job is due, and which "slot" a run belongs to.
 *
 * Render's free plan sleeps the server after ~15 idle minutes, so a timer
 * inside the process (the old @Cron decorators) silently skipped any run that
 * fell while it slept. Jobs are instead checked on every tick, from the
 * server's own 15-minute timer and from a GitHub Actions schedule that also
 * wakes the server. A daily job is due from its start time until it has
 * succeeded that day, so a run missed overnight happens on the first tick
 * after the server wakes.
 *
 * All times are India Standard Time: the business runs on it, and the old
 * crons (1 AM and 2 AM UTC on Render) already meant 06:30 and 07:30 IST.
 */

export type JobName = "overdue-payments" | "ops-alerts" | "scheduled-reports" | "watchdog";

type JobSpec =
  | { kind: "daily"; /** IST "HH:MM" from which the day's run is due. */ from: string }
  | { kind: "every-15-minutes" };

export const JOBS: Record<JobName, JobSpec> = {
  "overdue-payments": { kind: "daily", from: "06:30" },
  "ops-alerts": { kind: "daily", from: "07:30" },
  "scheduled-reports": { kind: "every-15-minutes" },
  // Last, so it can see whether the morning jobs above actually ran.
  watchdog: { kind: "daily", from: "09:00" },
};

/** Run order within a tick. */
export const JOB_ORDER: JobName[] = [
  "overdue-payments",
  "ops-alerts",
  "scheduled-reports",
  "watchdog",
];

const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;

/** The IST calendar date and minute of the day for an instant. */
export function istParts(now: Date): { date: string; minuteOfDay: number } {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return {
    date: ist.toISOString().slice(0, 10),
    minuteOfDay: ist.getUTCHours() * 60 + ist.getUTCMinutes(),
  };
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * The slot a run at `now` would fill, or null when the job is not due yet.
 * A daily job's slot is the IST date; a 15-minute job's is the date plus the
 * quarter hour, e.g. "2026-10-14T09:15".
 */
export function dueSlot(job: JobName, now: Date): string | null {
  const spec = JOBS[job];
  const { date, minuteOfDay } = istParts(now);
  if (spec.kind === "daily") {
    return minuteOfDay >= minutesOf(spec.from) ? date : null;
  }
  const quarter = Math.floor(minuteOfDay / 15) * 15;
  const hh = String(Math.floor(quarter / 60)).padStart(2, "0");
  const mm = String(quarter % 60).padStart(2, "0");
  return `${date}T${hh}:${mm}`;
}
