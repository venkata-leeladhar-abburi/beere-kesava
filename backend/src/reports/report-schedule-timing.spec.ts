import { ReportFrequency } from "../generated/prisma/client";
import { computeNextRunAt, listUpcomingRuns, parseDeliveryTime } from "./report-schedule-timing";

/** An IST wall-clock moment as a UTC instant. IST is UTC+5:30 year-round. */
function ist(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - 5.5 * 60 * 60 * 1000);
}

/** "2026-09-07 09:00" in IST, for readable assertions. */
function asIst(date: Date): string {
  const shifted = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())} ` +
    `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`
  );
}

describe("report-schedule-timing", () => {
  describe("parseDeliveryTime", () => {
    it("reads HH:mm", () => {
      expect(parseDeliveryTime("18:45")).toEqual({ hour: 18, minute: 45 });
    });

    it("falls back to 09:00 for anything unreadable", () => {
      expect(parseDeliveryTime(undefined)).toEqual({ hour: 9, minute: 0 });
      expect(parseDeliveryTime("not a time")).toEqual({ hour: 9, minute: 0 });
    });

    it("clamps out-of-range values instead of producing a rolled-over date", () => {
      expect(parseDeliveryTime("99:99")).toEqual({ hour: 23, minute: 59 });
    });
  });

  describe("DAILY", () => {
    const timing = {
      frequency: ReportFrequency.DAILY,
      deliveryHour: 9,
      deliveryMinute: 0,
      anchor: ist(2026, 8, 30, 14, 12),
    };

    it("returns today's slot when it is still ahead", () => {
      expect(asIst(computeNextRunAt(timing, ist(2026, 8, 30, 6, 0)))).toBe("2026-08-30 09:00");
    });

    it("skips to tomorrow once today's slot has passed", () => {
      expect(asIst(computeNextRunAt(timing, ist(2026, 8, 30, 9, 5)))).toBe("2026-08-31 09:00");
    });

    it("treats the exact slot as already delivered, so the poll cannot re-send", () => {
      expect(asIst(computeNextRunAt(timing, ist(2026, 8, 30, 9, 0)))).toBe("2026-08-31 09:00");
    });
  });

  describe("WEEKLY", () => {
    // 2026-08-30 is a Sunday; the schedule therefore repeats on Sundays.
    const timing = {
      frequency: ReportFrequency.WEEKLY,
      deliveryHour: 9,
      deliveryMinute: 0,
      anchor: ist(2026, 8, 30, 14, 12),
    };

    it("keeps the anchor's weekday, seven days apart", () => {
      const runs = listUpcomingRuns(timing, 3, ist(2026, 9, 1, 10, 0));
      expect(runs.map(asIst)).toEqual(["2026-09-06 09:00", "2026-09-13 09:00", "2026-09-20 09:00"]);
    });

    it("uses today when today is the anchor weekday and the slot is ahead", () => {
      expect(asIst(computeNextRunAt(timing, ist(2026, 9, 6, 7, 0)))).toBe("2026-09-06 09:00");
    });
  });

  describe("MONTHLY", () => {
    it("keeps the anchor's day-of-month", () => {
      const runs = listUpcomingRuns(
        {
          frequency: ReportFrequency.MONTHLY,
          deliveryHour: 10,
          deliveryMinute: 30,
          anchor: ist(2026, 1, 15),
        },
        3,
        ist(2026, 8, 30),
      );
      expect(runs.map(asIst)).toEqual(["2026-09-15 10:30", "2026-10-15 10:30", "2026-11-15 10:30"]);
    });

    it("clamps a 31st anchor into short months instead of spilling over", () => {
      const runs = listUpcomingRuns(
        {
          frequency: ReportFrequency.MONTHLY,
          deliveryHour: 9,
          deliveryMinute: 0,
          anchor: ist(2026, 1, 31),
        },
        3,
        ist(2026, 1, 31, 12, 0),
      );
      expect(runs.map(asIst)).toEqual(["2026-02-28 09:00", "2026-03-31 09:00", "2026-04-30 09:00"]);
    });
  });

  describe("QUARTERLY", () => {
    it("advances three months at a time, in phase with the anchor month", () => {
      const runs = listUpcomingRuns(
        {
          frequency: ReportFrequency.QUARTERLY,
          deliveryHour: 9,
          deliveryMinute: 0,
          anchor: ist(2026, 2, 10),
        },
        3,
        ist(2026, 8, 30),
      );
      expect(runs.map(asIst)).toEqual(["2026-11-10 09:00", "2027-02-10 09:00", "2027-05-10 09:00"]);
    });
  });

  it("returns strictly future instants, in ascending order", () => {
    const from = ist(2026, 8, 30, 9, 0);
    const runs = listUpcomingRuns(
      { frequency: ReportFrequency.DAILY, deliveryHour: 9, deliveryMinute: 0, anchor: from },
      5,
      from,
    );
    expect(runs).toHaveLength(5);
    runs.forEach((run) => expect(run.getTime()).toBeGreaterThan(from.getTime()));
    for (let i = 1; i < runs.length; i += 1) {
      expect(runs[i].getTime()).toBeGreaterThan(runs[i - 1].getTime());
    }
  });
});
