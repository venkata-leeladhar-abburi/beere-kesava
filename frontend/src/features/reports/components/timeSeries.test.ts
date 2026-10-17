import { describe, expect, it } from "vitest";
import { buildSeries, pickBucket } from "./timeSeries";
import { resolvePeriod } from "./period";

const NOW = new Date(2026, 9, 17, 10, 30); // 17 Oct 2026

describe("pickBucket", () => {
  it("scales the bucket with the span", () => {
    expect(pickBucket(new Date(2026, 9, 17), new Date(2026, 9, 18))).toBe("hour");
    expect(pickBucket(new Date(2026, 9, 1), new Date(2026, 10, 1))).toBe("day");
    expect(pickBucket(new Date(2026, 9, 1), new Date(2027, 0, 1))).toBe("week");
    expect(pickBucket(new Date(2026, 0, 1), new Date(2027, 0, 1))).toBe("month");
  });
});

describe("buildSeries", () => {
  const sales = [
    { d: new Date(2026, 9, 1, 11), amt: 100 },
    { d: new Date(2026, 9, 1, 15), amt: 50 },
    { d: new Date(2026, 9, 17, 9), amt: 30 },
    { d: new Date(2026, 8, 1, 12), amt: 70 }, // prior: 1 Sep
    { d: new Date(2026, 8, 25), amt: 999 }, // after the cut-to-date prior window
  ];

  it("buckets the month by day, stops at today and lines the prior month up by day", () => {
    const { current, prior } = resolvePeriod("This Month", {}, NOW);
    const { points, bucket } = buildSeries({
      current,
      prior,
      currentItems: sales,
      priorItems: sales,
      dateOf: (s) => s.d,
      amountOf: (s) => s.amt,
      now: NOW,
    });
    expect(bucket).toBe("day");
    expect(points).toHaveLength(17); // 1–17 Oct, nothing drawn for the days still to come
    expect(points[0]).toEqual({ label: "1 Oct", current: 150, prior: 70 });
    expect(points[16]).toEqual({ label: "17 Oct", current: 30, prior: 0 });
    // 25 Sep falls outside the like-for-like prior window.
    expect(points.reduce((s, p) => s + (p.prior ?? 0), 0)).toBe(70);
  });

  it("runs All Time from the first record, by month, with no prior line", () => {
    const { points, bucket } = buildSeries({
      current: null,
      prior: null,
      currentItems: [{ d: new Date(2025, 10, 5) }, { d: new Date(2026, 9, 1) }],
      dateOf: (s) => s.d,
      now: NOW,
    });
    expect(bucket).toBe("month");
    expect(points[0]).toEqual({ label: "Nov '25", current: 1, prior: null });
    expect(points[points.length - 1]!.label).toBe("Oct '26");
    expect(points).toHaveLength(12);
  });

  it("returns nothing to draw for an empty All Time", () => {
    expect(
      buildSeries({ current: null, prior: null, currentItems: [], dateOf: () => null, now: NOW })
        .points
    ).toEqual([]);
  });
});
