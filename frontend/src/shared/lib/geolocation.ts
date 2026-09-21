/**
 * Reading the device's position for the sign-in location check.
 *
 * The backend decides whether a position is acceptable; this module's only
 * job is to obtain one honestly, or to report that it could not. It never
 * decides anything itself and never sends a "user is on site" claim — that
 * would be a boolean anyone could flip in devtools.
 */

export interface LocationFix {
  latitude: number;
  longitude: number;
  /** The fix's own error radius in metres (GeolocationCoordinates.accuracy). */
  accuracyMeters: number;
}

/** Long enough for a cold GPS fix indoors, short enough not to feel hung. */
const FIX_TIMEOUT_MS = 15_000;

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/**
 * Resolves with a position, or with null when one cannot be obtained —
 * permission denied, no location hardware, or a timeout.
 *
 * Null rather than a rejection because all three outcomes are the same thing
 * to the caller ("we have no position to send"), and the backend already
 * words the refusal. Distinguishing them here would only duplicate that copy
 * in a second place, where it could drift.
 */
export function getCurrentFix(): Promise<LocationFix | null> {
  if (!isGeolocationSupported()) return Promise.resolve(null);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        }),
      () => resolve(null),
      {
        // Ask the GPS rather than accept a network-derived guess. Slower, and
        // the difference between placing someone in the building and placing
        // them in the district.
        enableHighAccuracy: true,
        timeout: FIX_TIMEOUT_MS,
        // The single most important option here. Without it the browser is
        // free to hand back a cached position from earlier in the day —
        // someone who was at the factory this morning would pass the check
        // from home this evening, on a fix taken hours ago and miles away.
        maximumAge: 0,
      },
    );
  });
}
