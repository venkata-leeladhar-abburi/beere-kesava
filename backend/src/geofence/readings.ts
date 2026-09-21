import { GeofenceDecision } from "../generated/prisma/client";

/** One recorded sign-in attempt, reduced to what the summary needs. */
export interface ReadingRow {
  distanceMeters: number | null;
  accuracyMeters: number | null;
  decision: GeofenceDecision | null;
}

export interface DistanceBucket {
  label: string;
  /** Inclusive lower bound in metres; null for the "no usable fix" bucket. */
  fromMeters: number | null;
  /** Exclusive upper bound, null for the open-ended top bucket. */
  toMeters: number | null;
  count: number;
}

export interface ReadingsSummary {
  total: number;
  /** Fixes that landed inside the configured radius. */
  insideRadius: number;
  outside: number;
  inaccurate: number;
  unavailable: number;
  /**
   * The number this whole screen exists to produce: how many of these logins
   * ENFORCE would have turned away. Counted from the decision the geofence
   * actually recorded, not recomputed here, so an OBSERVE row reports exactly
   * what enforcement would have done at the time.
   */
  wouldBeRefusedIfEnforced: number;
  /** Median distance of the fixes that produced one; null when none did. */
  medianDistanceMeters: number | null;
  /** Median reported error radius; the honest read on whether GPS works here. */
  medianAccuracyMeters: number | null;
}

// Fixed metre bands rather than multiples of the radius: the radius is the
// thing under review, so bucketing by it would move the goalposts with every
// change and make two readings impossible to compare.
const BANDS: { label: string; fromMeters: number; toMeters: number | null }[] = [
  { label: "Within 25 m", fromMeters: 0, toMeters: 25 },
  { label: "25–50 m", fromMeters: 25, toMeters: 50 },
  { label: "50–100 m", fromMeters: 50, toMeters: 100 },
  { label: "100–250 m", fromMeters: 100, toMeters: 250 },
  { label: "250 m – 1 km", fromMeters: 250, toMeters: 1000 },
  { label: "Over 1 km", fromMeters: 1000, toMeters: null },
];

const REFUSING_DECISIONS: GeofenceDecision[] = [
  GeofenceDecision.OUTSIDE,
  GeofenceDecision.INACCURATE,
  GeofenceDecision.UNAVAILABLE,
];

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return Math.round(value * 10) / 10;
}

export function summariseReadings(rows: ReadingRow[], radiusMeters: number) {
  const distances = rows
    .map((row) => row.distanceMeters)
    .filter((value): value is number => typeof value === "number");
  const accuracies = rows
    .map((row) => row.accuracyMeters)
    .filter((value): value is number => typeof value === "number");

  const buckets: DistanceBucket[] = BANDS.map((band) => ({
    ...band,
    count: distances.filter(
      (distance) => distance >= band.fromMeters && (band.toMeters === null || distance < band.toMeters),
    ).length,
  }));

  // Kept as its own bucket rather than folded into the top band. "The phone
  // could not say where it was" and "the phone said 2km away" are different
  // problems with different fixes, and averaging them together hides both.
  buckets.push({
    label: "No usable fix",
    fromMeters: null,
    toMeters: null,
    count: rows.length - distances.length,
  });

  const countOf = (decision: GeofenceDecision) =>
    rows.filter((row) => row.decision === decision).length;

  const summary: ReadingsSummary = {
    total: rows.length,
    insideRadius: distances.filter((distance) => distance <= radiusMeters).length,
    outside: countOf(GeofenceDecision.OUTSIDE),
    inaccurate: countOf(GeofenceDecision.INACCURATE),
    unavailable: countOf(GeofenceDecision.UNAVAILABLE),
    wouldBeRefusedIfEnforced: rows.filter(
      (row) => row.decision !== null && REFUSING_DECISIONS.includes(row.decision),
    ).length,
    medianDistanceMeters: median(distances),
    medianAccuracyMeters: median(accuracies),
  };

  return { summary, buckets };
}
