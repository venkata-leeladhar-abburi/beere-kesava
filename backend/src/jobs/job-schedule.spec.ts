import { dueSlot, istParts } from "./job-schedule";

// 2026-10-14 06:00 UTC is 11:30 IST.
const utc = (iso: string) => new Date(iso);

describe("job schedule", () => {
  it("reads the clock in IST, including across UTC midnight", () => {
    expect(istParts(utc("2026-10-14T06:00:00Z"))).toEqual({
      date: "2026-10-14",
      minuteOfDay: 11 * 60 + 30,
    });
    // 20:00 UTC is 01:30 IST the next day.
    expect(istParts(utc("2026-10-14T20:00:00Z")).date).toBe("2026-10-15");
  });

  it("holds a daily job back until its start time, then keeps it due all day", () => {
    // overdue-payments starts at 06:30 IST = 01:00 UTC.
    expect(dueSlot("overdue-payments", utc("2026-10-14T00:59:00Z"))).toBeNull();
    expect(dueSlot("overdue-payments", utc("2026-10-14T01:00:00Z"))).toBe("2026-10-14");
    // Still the same slot late in the day: a run missed at 06:30 catches up.
    expect(dueSlot("overdue-payments", utc("2026-10-14T18:00:00Z"))).toBe("2026-10-14");
  });

  it("puts the 15-minute job in its quarter-hour slot", () => {
    // 03:44 UTC = 09:14 IST.
    expect(dueSlot("scheduled-reports", utc("2026-10-14T03:44:00Z"))).toBe("2026-10-14T09:00");
    expect(dueSlot("scheduled-reports", utc("2026-10-14T03:45:00Z"))).toBe("2026-10-14T09:15");
  });
});
