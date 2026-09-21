import { GeofenceDecision, GeofenceMode, UserRole } from "../generated/prisma/client";
import { GeofenceService } from "./geofence.service";

const SITE = {
  id: "site-1",
  label: "Dharmavaram factory",
  latitude: 14.422606,
  longitude: 77.726799,
  radiusMeters: 100,
  maxAccuracyMeters: 75,
  active: true,
};

// ~6.6m from the centre — the far corner the client pinned.
const ON_SITE = { latitude: 14.422657, longitude: 77.72683, accuracyMeters: 20 };
// ~1.1km north: comfortably outside, and a realistic "logged in from home".
const OFF_SITE = { latitude: 14.432606, longitude: 77.726799, accuracyMeters: 20 };

function makeService(
  overrides: {
    policy?: { role: UserRole; enforced: boolean; mode: GeofenceMode } | null;
    sites?: (typeof SITE)[];
    exemption?: { id: string } | null;
  } = {},
) {
  const prisma = {
    geofenceRolePolicy: {
      findUnique: jest.fn().mockResolvedValue(
        overrides.policy === undefined
          ? { role: UserRole.WORKER, enforced: true, mode: GeofenceMode.ENFORCE }
          : overrides.policy,
      ),
    },
    geofenceSite: { findMany: jest.fn().mockResolvedValue(overrides.sites ?? [SITE]) },
    geofenceExemption: { findFirst: jest.fn().mockResolvedValue(overrides.exemption ?? null) },
  };
  return { service: new GeofenceService(prisma as never), prisma };
}

describe("GeofenceService.evaluate", () => {
  it("allows a role with no policy row without ever looking at a position", async () => {
    const { service, prisma } = makeService({ policy: null });
    const result = await service.evaluate({ role: UserRole.SUPERADMIN, userId: "u1" });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe(GeofenceDecision.NOT_ENFORCED);
    // The important half: an unrestricted role is not asked where it is, so
    // no location is read and none is available to record.
    expect(prisma.geofenceSite.findMany).not.toHaveBeenCalled();
    expect(result.distanceMeters).toBeNull();
  });

  it("allows a role whose policy is switched off", async () => {
    const { service } = makeService({
      policy: { role: UserRole.SHOP, enforced: false, mode: GeofenceMode.ENFORCE },
    });
    expect((await service.evaluate({ role: UserRole.SHOP, fix: OFF_SITE })).allowed).toBe(true);
  });

  it("allows a fix inside the radius", async () => {
    const { service } = makeService();
    const result = await service.evaluate({ role: UserRole.WORKER, fix: ON_SITE });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe(GeofenceDecision.ALLOWED);
    expect(result.distanceMeters).toBeLessThan(10);
    expect(result.message).toBeNull();
  });

  it("blocks a fix outside the radius and says how far away it is", async () => {
    const { service } = makeService();
    const result = await service.evaluate({ role: UserRole.WORKER, fix: OFF_SITE });

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe(GeofenceDecision.OUTSIDE);
    expect(result.distanceMeters).toBeGreaterThan(1000);
    expect(result.message).toContain("1.1 km");
  });

  it("rejects a wildly imprecise fix even when it lands inside the circle", async () => {
    // The spoofing-adjacent case: a +/-400m reading centred on the factory
    // proves nothing, and believing it would let anyone with a weak signal in.
    const { service } = makeService();
    const result = await service.evaluate({
      role: UserRole.WORKER,
      fix: { ...ON_SITE, accuracyMeters: 400 },
    });

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe(GeofenceDecision.INACCURATE);
    expect(result.message).toContain("400 metres");
  });

  it("treats a missing position as UNAVAILABLE, not as outside", async () => {
    const { service } = makeService();
    const result = await service.evaluate({ role: UserRole.WORKER, fix: null });

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe(GeofenceDecision.UNAVAILABLE);
    expect(result.distanceMeters).toBeNull();
  });

  it("treats null island as a missing fix rather than a point in the Atlantic", async () => {
    const { service } = makeService();
    const result = await service.evaluate({
      role: UserRole.WORKER,
      fix: { latitude: 0, longitude: 0, accuracyMeters: 10 },
    });
    expect(result.decision).toBe(GeofenceDecision.UNAVAILABLE);
  });

  it("records the decision but allows the login in OBSERVE mode", async () => {
    const { service } = makeService({
      policy: { role: UserRole.WORKER, enforced: true, mode: GeofenceMode.OBSERVE },
    });
    const result = await service.evaluate({ role: UserRole.WORKER, fix: OFF_SITE });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe(GeofenceDecision.OUTSIDE);
    expect(result.distanceMeters).toBeGreaterThan(1000);
    // Nothing is shown to a user who was not actually stopped.
    expect(result.message).toBeNull();
  });

  it("fails open when no site has been configured yet", async () => {
    const { service } = makeService({ sites: [] });
    const result = await service.evaluate({ role: UserRole.WORKER, fix: OFF_SITE });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe(GeofenceDecision.NO_SITE_CONFIGURED);
  });

  it("lets an unexpired exemption through from anywhere", async () => {
    const { service } = makeService({ exemption: { id: "ex-1" } });
    const result = await service.evaluate({ role: UserRole.WORKER, userId: "u1", fix: OFF_SITE });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe(GeofenceDecision.EXEMPT);
  });

  it("picks the nearest site when several are active", async () => {
    const far = { ...SITE, id: "site-2", label: "Shop", latitude: 14.5, longitude: 77.8 };
    const { service } = makeService({ sites: [far, SITE] });
    const result = await service.evaluate({ role: UserRole.WORKER, fix: ON_SITE });

    expect(result.decision).toBe(GeofenceDecision.ALLOWED);
    expect(result.nearestSiteLabel).toBe("Dharmavaram factory");
  });
});

describe("GeofenceService.auditFieldsFor", () => {
  it("keeps the position and the verdict together for the login history", async () => {
    const { service } = makeService();
    const fix = OFF_SITE;
    const evaluation = await service.evaluate({ role: UserRole.WORKER, fix });

    expect(service.auditFieldsFor(evaluation, fix)).toEqual({
      latitude: OFF_SITE.latitude,
      longitude: OFF_SITE.longitude,
      accuracyMeters: 20,
      distanceMeters: evaluation.distanceMeters,
      geofenceDecision: GeofenceDecision.OUTSIDE,
      geofenceMode: GeofenceMode.ENFORCE,
    });
  });

  it("writes nulls rather than an unusable coordinate", async () => {
    const { service } = makeService();
    const evaluation = await service.evaluate({ role: UserRole.WORKER, fix: null });

    expect(service.auditFieldsFor(evaluation, null)).toMatchObject({
      latitude: null,
      longitude: null,
      accuracyMeters: null,
      distanceMeters: null,
    });
  });
});
