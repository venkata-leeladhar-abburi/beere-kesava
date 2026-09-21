import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentFix, isGeolocationSupported } from "./geolocation";

const getCurrentPosition = vi.fn();

function installGeolocation() {
  Object.defineProperty(globalThis.navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });
}

function removeGeolocation() {
  Reflect.deleteProperty(globalThis.navigator as unknown as Record<string, unknown>, "geolocation");
}

describe("getCurrentFix", () => {
  beforeEach(() => {
    getCurrentPosition.mockReset();
    installGeolocation();
  });

  it("returns the coordinates and the fix's own error radius", async () => {
    getCurrentPosition.mockImplementation((onSuccess: PositionCallback) =>
      onSuccess({
        coords: { latitude: 14.422606, longitude: 77.726799, accuracy: 18.4 },
      } as GeolocationPosition),
    );

    await expect(getCurrentFix()).resolves.toEqual({
      latitude: 14.422606,
      longitude: 77.726799,
      accuracyMeters: 18.4,
    });
  });

  it("never accepts a cached position", async () => {
    // The regression this test exists for: with any maximumAge above zero the
    // browser may return a fix taken hours earlier somewhere else, so someone
    // who was at the factory this morning would pass the check from home.
    getCurrentPosition.mockImplementation((onSuccess: PositionCallback) =>
      onSuccess({ coords: { latitude: 1, longitude: 1, accuracy: 1 } } as GeolocationPosition),
    );

    await getCurrentFix();

    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ maximumAge: 0, enableHighAccuracy: true }),
    );
  });

  it("resolves with null when the user denies permission", async () => {
    getCurrentPosition.mockImplementation((_ok: PositionCallback, onError: PositionErrorCallback) =>
      onError({ code: 1, message: "User denied Geolocation" } as GeolocationPositionError),
    );

    await expect(getCurrentFix()).resolves.toBeNull();
  });

  it("resolves with null on a timeout rather than hanging the sign-in", async () => {
    getCurrentPosition.mockImplementation((_ok: PositionCallback, onError: PositionErrorCallback) =>
      onError({ code: 3, message: "Timeout expired" } as GeolocationPositionError),
    );

    await expect(getCurrentFix()).resolves.toBeNull();
  });

  it("resolves with null where the browser has no geolocation at all", async () => {
    removeGeolocation();
    expect(isGeolocationSupported()).toBe(false);
    await expect(getCurrentFix()).resolves.toBeNull();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});
