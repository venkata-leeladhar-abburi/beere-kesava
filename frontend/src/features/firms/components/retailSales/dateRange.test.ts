import { describe, it, expect } from "vitest";
import { filterToRange, isoDay } from "./dateRange";
import { DEFAULT_DATE_FILTER, type DateFilterState } from "../../../../shared/ui/DateFilterBar";

const f = (over: Partial<DateFilterState>): DateFilterState => ({ ...DEFAULT_DATE_FILTER, ...over });

describe("filterToRange", () => {
  it("turns a single picked date into an inclusive same-day range", () => {
    // This is the case that made 'select any date' look broken.
    expect(filterToRange(f({ mode: "day", day: "2026-08-30" })))
      .toEqual({ from: "2026-08-30", to: "2026-08-30" });
  });

  it("passes an explicit range straight through", () => {
    expect(filterToRange(f({ mode: "range", from: "2026-08-01", to: "2026-08-31" })))
      .toEqual({ from: "2026-08-01", to: "2026-08-31" });
  });

  it("expands a month to its real first and last day", () => {
    expect(filterToRange(f({ mode: "month", month: "2026-02" })))
      .toEqual({ from: "2026-02-01", to: "2026-02-28" });
    // Leap year — the last day is computed, never assumed to be 28 or 30.
    expect(filterToRange(f({ mode: "month", month: "2024-02" })).to).toBe("2024-02-29");
  });

  it("expands a year to the whole calendar year", () => {
    expect(filterToRange(f({ mode: "year", year: "2026" })))
      .toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });

  it("returns no bounds for All Time or an incomplete selection", () => {
    expect(filterToRange(DEFAULT_DATE_FILTER)).toEqual({});
    expect(filterToRange(f({ mode: "day", day: "" }))).toEqual({});
    expect(filterToRange(f({ mode: "month", month: "" }))).toEqual({});
    expect(filterToRange(f({ mode: "year", year: "" }))).toEqual({});
  });

  it("keeps a half-open range half-open rather than inventing a bound", () => {
    expect(filterToRange(f({ mode: "range", from: "2026-08-01", to: "" })))
      .toEqual({ from: "2026-08-01", to: undefined });
  });
});

describe("isoDay", () => {
  it("uses local time, so a late-evening date keeps its own day", () => {
    // toISOString() would roll this to the 31st for anyone east of UTC.
    expect(isoDay(new Date(2026, 7, 30, 23, 30))).toBe("2026-08-30");
  });
});
