import { describe, it, expect } from "vitest";
import { resolvePeriod, inRange, formatSpan } from "./period";

const NOW = new Date(2026, 7, 30); // 30 Aug 2026, 00:00
const MID_OCT = new Date(2026, 9, 17, 10, 30); // 17 Oct 2026, 10:30

describe("resolvePeriod", () => {
  it("bounds This Month to the calendar month", () => {
    const { current } = resolvePeriod("This Month", {}, NOW);
    expect(current!.from).toEqual(new Date(2026, 7, 1));
    expect(current!.to).toEqual(new Date(2026, 8, 1));
    expect(current!.label).toBe("August 2026");
  });

  it("compares a month in progress with the same days of the previous month", () => {
    const r = resolvePeriod("This Month", {}, MID_OCT);
    expect(r.partial).toBe(true);
    expect(r.prior!.from).toEqual(new Date(2026, 8, 1));
    expect(r.prior!.to).toEqual(new Date(2026, 8, 18)); // 1–17 Sep, end exclusive
    expect(r.prior!.label).toBe("1–17 Sep 2026");
    expect(r.compareLabel).toBe("1–17 Oct 2026");
  });

  it("never runs a cut-to-date prior window past the prior month's end", () => {
    // 31 March lines up with all of February, not 3 March.
    const r = resolvePeriod("This Month", {}, new Date(2026, 2, 31, 9));
    expect(r.prior!.from).toEqual(new Date(2026, 1, 1));
    expect(r.prior!.to).toEqual(new Date(2026, 2, 1));
  });

  it("compares a finished window with the whole previous one", () => {
    const r = resolvePeriod(
      "Custom Dates",
      { from: "2026-08-01", to: "2026-08-10" },
      new Date(2026, 9, 1)
    );
    expect(r.partial).toBe(false);
    expect(r.prior!.from).toEqual(new Date(2026, 6, 22)); // the 10 days before 1 Aug
    expect(r.prior!.to).toEqual(new Date(2026, 7, 1));
  });

  it("compares a custom range of whole months with the whole months before it", () => {
    const r = resolvePeriod("Custom Dates", { from: "2026-09-01", to: "2026-09-30" }, MID_OCT);
    expect(r.prior!.from).toEqual(new Date(2026, 7, 1));
    expect(r.prior!.to).toEqual(new Date(2026, 8, 1)); // all of August, 31 days
    // A rebuilt "This Month" download (stored as 1–31 Oct) lines up exactly as before.
    const rebuilt = resolvePeriod(
      "Custom Dates",
      { from: "2026-10-01", to: "2026-10-31" },
      MID_OCT
    );
    expect(rebuilt.prior!.label).toBe("1–17 Sep 2026");
  });

  it("compares with the same dates last year", () => {
    const r = resolvePeriod("This Month", {}, MID_OCT, "lastYear");
    expect(r.prior!.from).toEqual(new Date(2025, 9, 1));
    expect(r.prior!.to).toEqual(new Date(2025, 9, 18));
    expect(r.prior!.label).toBe("1–17 Oct 2025");
  });

  it("lands 29 Feb on 28 Feb when looking a year back", () => {
    const r = resolvePeriod("Today", {}, new Date(2028, 1, 29, 23, 59), "lastYear");
    expect(r.prior!.from).toEqual(new Date(2027, 1, 28));
  });

  it("cuts Today at the current time of day", () => {
    const r = resolvePeriod("Today", {}, MID_OCT);
    expect(r.prior!.from).toEqual(new Date(2026, 9, 16));
    expect(r.prior!.to).toEqual(new Date(2026, 9, 16, 10, 30));
    expect(r.prior!.label).toMatch(/^16 Oct 2026, till /);
  });

  it("runs weeks Monday to Sunday", () => {
    const { current } = resolvePeriod("This Week", {}, NOW); // a Sunday
    expect(current!.from).toEqual(new Date(2026, 7, 24));
    expect(current!.to).toEqual(new Date(2026, 7, 31));
  });

  it("puts August in Q3 and compares against the same days of Q2", () => {
    const { current, prior } = resolvePeriod("This Quarter", {}, NOW);
    expect(current!.label).toBe("Q3 2026");
    expect(prior!.from).toEqual(new Date(2026, 3, 1));
    // 1 Jul–30 Aug is 61 days, so the prior window is 1 Apr–31 May.
    expect(prior!.to).toEqual(new Date(2026, 5, 1));
  });

  it("has no bounds and nothing to compare for All Time", () => {
    expect(resolvePeriod("All Time", {}, NOW)).toEqual({
      current: null,
      prior: null,
      partial: false,
      compareLabel: null,
    });
  });

  it("treats an incomplete or reversed custom range as All Time rather than emptying the page", () => {
    expect(resolvePeriod("Custom Dates", { from: "2026-08-01" }, NOW).current).toBeNull();
    expect(
      resolvePeriod("Custom Dates", { from: "2026-08-10", to: "2026-08-01" }, NOW).current
    ).toBeNull();
  });

  it("makes a custom range inclusive of its end date", () => {
    const { current } = resolvePeriod(
      "Custom Dates",
      { from: "2026-08-01", to: "2026-08-10" },
      NOW
    );
    expect(inRange(current, new Date(2026, 7, 10, 18))).toBe(true);
    expect(inRange(current, new Date(2026, 7, 11))).toBe(false);
  });
});

describe("formatSpan", () => {
  it("reads naturally at every scale", () => {
    expect(formatSpan(new Date(2026, 9, 17), new Date(2026, 9, 18))).toBe("17 Oct 2026");
    expect(formatSpan(new Date(2026, 9, 1), new Date(2026, 9, 18))).toBe("1–17 Oct 2026");
    expect(formatSpan(new Date(2026, 8, 28), new Date(2026, 9, 18))).toBe("28 Sep – 17 Oct 2026");
    expect(formatSpan(new Date(2025, 11, 28), new Date(2026, 0, 4))).toBe(
      "28 Dec 2025 – 3 Jan 2026"
    );
  });
});

describe("inRange", () => {
  const { current } = resolvePeriod("This Month", {}, NOW);

  it("accepts everything when there is no range (All Time)", () => {
    expect(inRange(null, "1999-01-01")).toBe(true);
    expect(inRange(null, undefined)).toBe(true);
  });

  it("excludes missing and unparseable dates from a bounded range", () => {
    expect(inRange(current, undefined)).toBe(false);
    expect(inRange(current, "not a date")).toBe(false);
  });

  it("includes the first instant and excludes the upper bound", () => {
    expect(inRange(current, new Date(2026, 7, 1))).toBe(true);
    expect(inRange(current, new Date(2026, 8, 1))).toBe(false);
    expect(inRange(current, new Date(2026, 6, 31))).toBe(false);
  });
});
