/**
 * Great-circle distance between two WGS-84 points, in metres.
 *
 * Haversine rather than the cheaper equirectangular approximation: the cost
 * difference is irrelevant at login rates, and haversine has no latitude at
 * which it quietly degrades. Earth is modelled as a sphere of mean radius,
 * which is off by up to ~0.3% against the true ellipsoid — about 30cm over a
 * 100m radius, far inside the GPS error this is compared against.
 */
const EARTH_RADIUS_M = 6_371_008.8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export function haversineMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLon = Math.sin(dLon / 2);

  const h =
    sinHalfDLat * sinHalfDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinHalfDLon * sinHalfDLon;

  // Math.min guards the rounding case where h creeps just past 1 for
  // antipodal points and asin would return NaN.
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * True when `point` is a usable position at all.
 *
 * (0, 0) is rejected on purpose. It is a real place in the Gulf of Guinea, and
 * it is also what a half-initialised client sends when it has no fix — the
 * second is overwhelmingly more likely than a saree firm operating from the
 * Atlantic, and treating it as a coordinate would put a null island reading
 * 6,000km from any site and log it as a genuine OUTSIDE.
 */
export function isUsableFix(point: { latitude?: number | null; longitude?: number | null }): boolean {
  const { latitude, longitude } = point;
  if (typeof latitude !== "number" || typeof longitude !== "number") return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  if (latitude === 0 && longitude === 0) return false;
  return true;
}
