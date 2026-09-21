import { GeofenceDecision } from "../generated/prisma/client";
import { summariseReadings, type ReadingRow } from "./readings";

const row = (
  distanceMeters: number | null,
  decision: GeofenceDecision | null,
  accuracyMeters: number | null = 20,
): ReadingRow => ({ distanceMeters, decision, accuracyMeters });

describe("summariseReadings", () => {
  it("counts what enforcement would have refused, from the recorded decision", () => {
    // Not recomputed from distance: an OBSERVE row must report exactly what
    // ENFORCE would have done at the time, including the accuracy rejection
    // that has nothing to do with how far away the person was.
    const rows = [
      row(6.6, GeofenceDecision.ALLOWED),
      row(12, GeofenceDecision.ALLOWED),
      row(1113, GeofenceDecision.OUTSIDE),
      row(40, GeofenceDecision.INACCURATE, 400),
      row(null, GeofenceDecision.UNAVAILABLE, null),
    ];

    const { summary } = summariseReadings(rows, 100);

    expect(summary.total).toBe(5);
    expect(summary.wouldBeRefusedIfEnforced).toBe(3);
    expect(summary.outside).toBe(1);
    expect(summary.inaccurate).toBe(1);
    expect(summary.unavailable).toBe(1);
  });

  it("counts a fix inside the radius even when it was refused for imprecision", () => {
    // 40m is inside 100m, so insideRadius counts it; the refusal is reported
    // separately. Conflating the two would make the radius look wrong when
    // the real problem is the signal.
    const { summary } = summariseReadings([row(40, GeofenceDecision.INACCURATE, 400)], 100);

    expect(summary.insideRadius).toBe(1);
    expect(summary.wouldBeRefusedIfEnforced).toBe(1);
  });

  it("keeps missing fixes out of the distance bands", () => {
    const rows = [row(10, GeofenceDecision.ALLOWED), row(null, GeofenceDecision.UNAVAILABLE, null)];
    const { buckets } = summariseReadings(rows, 100);

    expect(buckets.find((b) => b.label === "Within 25 m")?.count).toBe(1);
    expect(buckets.find((b) => b.label === "No usable fix")?.count).toBe(1);
    // Every row lands in exactly one bucket.
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(rows.length);
  });

  it("puts a distance on the band boundary in the upper band", () => {
    const { buckets } = summariseReadings([row(25, GeofenceDecision.ALLOWED)], 100);

    expect(buckets.find((b) => b.label === "Within 25 m")?.count).toBe(0);
    expect(buckets.find((b) => b.label === "25–50 m")?.count).toBe(1);
  });

  it("treats a distance exactly on the radius as inside, as the geofence does", () => {
    const { summary } = summariseReadings([row(100, GeofenceDecision.ALLOWED)], 100);
    expect(summary.insideRadius).toBe(1);
  });

  it("reports medians, which a couple of wild outliers cannot drag", () => {
    const rows = [
      row(10, GeofenceDecision.ALLOWED, 15),
      row(20, GeofenceDecision.ALLOWED, 20),
      row(30, GeofenceDecision.ALLOWED, 25),
      row(9000, GeofenceDecision.OUTSIDE, 800),
    ];

    const { summary } = summariseReadings(rows, 100);

    expect(summary.medianDistanceMeters).toBe(25);
    expect(summary.medianAccuracyMeters).toBe(22.5);
  });

  it("handles a period with no logins at all", () => {
    const { summary, buckets } = summariseReadings([], 100);

    expect(summary.total).toBe(0);
    expect(summary.wouldBeRefusedIfEnforced).toBe(0);
    expect(summary.medianDistanceMeters).toBeNull();
    expect(summary.medianAccuracyMeters).toBeNull();
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });
});
