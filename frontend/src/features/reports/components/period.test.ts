import { describe, it, expect } from "vitest";
import { resolvePeriod, inRange } from "./period";

const NOW = new Date(2026, 7, 30); // 30 Aug 2026

describe("resolvePeriod", () => {
  it("bounds This Month to the calendar month and compares against the previous one", () => {
    const { current, prior } = resolvePeriod("This Month", {}, NOW);
    expect(current!.from).toEqual(new Date(2026, 7, 1));
    expect(current!.to).toEqual(new Date(2026, 8, 1));
    expect(prior!.from).toEqual(new Date(2026, 6, 1));
    expect(prior!.to).toEqual(new Date(2026, 7, 1));
  });

  it("runs weeks Monday to Sunday", () => {
    const { current } = resolvePeriod("This Week", {}, NOW); // a Sunday
    expect(current!.from).toEqual(new Date(2026, 7, 24));
    expect(current!.to).toEqual(new Date(2026, 7, 31));
  });

  it("puts August in Q3 and compares against Q2", () => {
    const { current, prior } = resolvePeriod("This Quarter", {}, NOW);
    expect(current!.label).toBe("Q3 2026");
    expect(prior!.label).toBe("Q2 2026");
  });

  it("has no bounds and nothing to compare for All Time", () => {
    expect(resolvePeriod("All Time", {}, NOW)).toEqual({ current: null, prior: null });
  });

  it("treats an incomplete or reversed custom range as All Time rather than emptying the page", () => {
    expect(resolvePeriod("Custom Dates", { from: "2026-08-01" }, NOW).current).toBeNull();
    expect(resolvePeriod("Custom Dates", { from: "2026-08-10", to: "2026-08-01" }, NOW).current).toBeNull();
  });

  it("makes a custom range inclusive of its end date, with an equally long prior window", () => {
    const { current, prior } = resolvePeriod("Custom Dates", { from: "2026-08-01", to: "2026-08-10" }, NOW);
    expect(inRange(current, "2026-08-10T18:00:00Z")).toBe(true);
    expect(inRange(current, "2026-08-11T00:00:00")).toBe(false);
    expect(prior!.from).toEqual(new Date(2026, 6, 22)); // the 10 days before 1 Aug
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
