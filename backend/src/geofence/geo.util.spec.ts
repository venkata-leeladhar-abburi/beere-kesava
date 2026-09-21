import { haversineMeters, isUsableFix } from "./geo.util";

// The pins the client sent from the Dharmavaram premises. Three of the four
// "corners" came back byte-identical and the fourth sat 0.22m from the centre,
// so the only real span these give is centre -> corner, ~6.6m. That number is
// asserted below because it is the evidence the 100m radius rests on: if a
// later survey moves it, this test should fail and be re-read, not updated.
const CENTRE = { latitude: 14.422606, longitude: 77.726799 };
const CORNER = { latitude: 14.422657, longitude: 77.72683 };

describe("haversineMeters", () => {
  it("is zero for the same point", () => {
    expect(haversineMeters(CENTRE, CENTRE)).toBe(0);
  });

  it("measures the client's centre-to-corner span at about 6.6m", () => {
    expect(haversineMeters(CENTRE, CORNER)).toBeCloseTo(6.6, 0);
  });

  it("is symmetric", () => {
    expect(haversineMeters(CENTRE, CORNER)).toBeCloseTo(haversineMeters(CORNER, CENTRE), 9);
  });

  it("matches a known one-degree-of-latitude separation", () => {
    // One degree of latitude is ~111.2km everywhere, which is the easiest
    // independent check that the formula is not out by a constant factor.
    const d = haversineMeters({ latitude: 14, longitude: 77 }, { latitude: 15, longitude: 77 });
    expect(d / 1000).toBeCloseTo(111.2, 0);
  });

  it("accounts for longitude lines converging away from the equator", () => {
    // A degree of longitude is ~111.3km at the equator but only ~107.8km at
    // 14.42N. An equirectangular shortcut would report both the same.
    const atEquator = haversineMeters({ latitude: 0, longitude: 77 }, { latitude: 0, longitude: 78 });
    const atSite = haversineMeters({ latitude: 14.4226, longitude: 77 }, { latitude: 14.4226, longitude: 78 });
    expect(atSite).toBeLessThan(atEquator);
    expect(atSite / 1000).toBeCloseTo(107.8, 0);
  });

  it("puts a point just outside a 100m radius on the far side of the line", () => {
    // 0.001 degrees of latitude is ~111m — comfortably past a 100m radius.
    const d = haversineMeters(CENTRE, { latitude: CENTRE.latitude + 0.001, longitude: CENTRE.longitude });
    expect(d).toBeGreaterThan(100);
    expect(d).toBeCloseTo(111, 0);
  });
});

describe("isUsableFix", () => {
  it("accepts the site pin", () => {
    expect(isUsableFix(CENTRE)).toBe(true);
  });

  it("rejects null island, which is a missing fix far more often than a real place", () => {
    expect(isUsableFix({ latitude: 0, longitude: 0 })).toBe(false);
  });

  it("accepts a genuine zero on one axis only", () => {
    expect(isUsableFix({ latitude: 0, longitude: 77.7 })).toBe(true);
  });

  it("rejects missing, non-finite and out-of-range values", () => {
    expect(isUsableFix({})).toBe(false);
    expect(isUsableFix({ latitude: null, longitude: null })).toBe(false);
    expect(isUsableFix({ latitude: NaN, longitude: 77 })).toBe(false);
    expect(isUsableFix({ latitude: 91, longitude: 77 })).toBe(false);
    expect(isUsableFix({ latitude: 14, longitude: 181 })).toBe(false);
  });
});
