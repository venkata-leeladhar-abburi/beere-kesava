import { GeofenceDecision, GeofenceMode, UserRole, WhatsAppMessageStatus } from "../generated/prisma/client";
import { AuthService } from "./auth.service";

/**
 * The geofence's own decision table is covered in
 * geofence/geofence.service.spec.ts. This file covers the wiring: that the
 * auth flow asks, that it asks about the right role, and above all what it
 * does NOT do to a user it turns away.
 */

const BLOCKED = {
  allowed: false,
  decision: GeofenceDecision.OUTSIDE,
  mode: GeofenceMode.ENFORCE,
  distanceMeters: 1113.2,
  nearestSiteLabel: "Dharmavaram factory",
  message: "You appear to be about 1.1 km from Dharmavaram factory.",
};

const ALLOWED = {
  allowed: true,
  decision: GeofenceDecision.ALLOWED,
  mode: GeofenceMode.ENFORCE,
  distanceMeters: 6.6,
  nearestSiteLabel: "Dharmavaram factory",
  message: null,
};

const OFF_SITE = { latitude: 14.432606, longitude: 77.726799, accuracyMeters: 20 };

function setup() {
  const prisma: any = {
    user: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    weaver: { findFirst: jest.fn().mockResolvedValue(null) },
    otpCode: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: "otp-1" }),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const jwtService: any = { sign: jest.fn().mockReturnValue("signed.jwt.token") };
  const whatsapp: any = {
    sendTemplate: jest.fn().mockResolvedValue({ status: WhatsAppMessageStatus.SENT }),
    sanitiseParam: jest.fn((v: string) => v),
  };
  const auditLog: any = { record: jest.fn().mockResolvedValue({}), recordLogout: jest.fn().mockResolvedValue({}) };
  const geofence: any = {
    evaluate: jest.fn().mockResolvedValue(ALLOWED),
    auditFieldsFor: jest.fn().mockReturnValue({
      latitude: OFF_SITE.latitude,
      longitude: OFF_SITE.longitude,
      accuracyMeters: 20,
      distanceMeters: 1113.2,
      geofenceDecision: GeofenceDecision.OUTSIDE,
      geofenceMode: GeofenceMode.ENFORCE,
    }),
  };
  const service = new AuthService(prisma, jwtService, whatsapp, auditLog, geofence);
  // ensureDefaultUsers() does its own user.create calls on every entry point;
  // stubbed out so the assertions below are about the flow under test.
  jest.spyOn(service, "ensureDefaultUsers").mockResolvedValue();
  return { service, prisma, jwtService, whatsapp, auditLog, geofence };
}

describe("requestOtp location check", () => {
  it("does not send a billable OTP to someone who will be refused", async () => {
    const { service, prisma, whatsapp, geofence } = setup();
    prisma.user.findFirst.mockResolvedValue({ id: "u1", mobile: "9999999999", role: UserRole.WORKER });
    geofence.evaluate.mockResolvedValue(BLOCKED);

    await expect(service.requestOtp({ phone: "9999999999", ...OFF_SITE })).rejects.toMatchObject({
      response: { code: "GEOFENCE_BLOCKED" },
    });

    expect(whatsapp.sendTemplate).not.toHaveBeenCalled();
    expect(prisma.otpCode.create).not.toHaveBeenCalled();
  });

  it("judges the request against the caller's own role", async () => {
    const { service, prisma, geofence } = setup();
    prisma.user.findFirst.mockResolvedValue({ id: "u1", mobile: "9999999999", role: UserRole.ACCOUNTANT });

    await service.requestOtp({ phone: "9999999999", ...OFF_SITE });

    expect(geofence.evaluate).toHaveBeenCalledWith({
      role: UserRole.ACCOUNTANT,
      userId: "u1",
      fix: OFF_SITE,
    });
  });

  it("sends no coordinates at all when the client supplied none", async () => {
    const { service, prisma, geofence } = setup();
    prisma.user.findFirst.mockResolvedValue({ id: "u1", mobile: "9999999999", role: UserRole.ADMIN });

    await service.requestOtp({ phone: "9999999999" });

    expect(geofence.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({ fix: null, role: UserRole.ADMIN }),
    );
  });
});

describe("verifyOtp location check", () => {
  it("refuses before touching the OTP, so a turned-away user keeps their code and their attempts", async () => {
    // The point of ordering the check first. Being in the wrong place is not a
    // wrong guess, and must not cost one of the three the account has.
    const { service, prisma, geofence } = setup();
    prisma.user.findFirst.mockResolvedValue({ id: "u1", role: UserRole.WEAVER });
    geofence.evaluate.mockResolvedValue(BLOCKED);

    await expect(
      service.verifyOtp({ phone: "9999999999", code: "123456", ...OFF_SITE }),
    ).rejects.toMatchObject({ response: { code: "GEOFENCE_BLOCKED" } });

    expect(prisma.otpCode.findFirst).not.toHaveBeenCalled();
    expect(prisma.otpCode.update).not.toHaveBeenCalled();
    expect(prisma.otpCode.updateMany).not.toHaveBeenCalled();
  });

  it("records the refusal to the login history with its position", async () => {
    const { service, prisma, auditLog, geofence } = setup();
    prisma.user.findFirst.mockResolvedValue({ id: "u1", role: UserRole.WORKER });
    geofence.evaluate.mockResolvedValue(BLOCKED);

    await expect(
      service.verifyOtp({ phone: "9999999999", code: "123456", ...OFF_SITE }),
    ).rejects.toBeDefined();

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "FAILED",
        userId: "u1",
        failReason: "Location check failed (OUTSIDE)",
        distanceMeters: 1113.2,
        geofenceDecision: GeofenceDecision.OUTSIDE,
        geofenceMode: GeofenceMode.ENFORCE,
      }),
    );
  });

  it("surfaces the server's own wording, which carries the distance", async () => {
    const { service, prisma, geofence } = setup();
    prisma.user.findFirst.mockResolvedValue({ id: "u1", role: UserRole.WORKER });
    geofence.evaluate.mockResolvedValue(BLOCKED);

    await expect(
      service.verifyOtp({ phone: "9999999999", code: "123456", ...OFF_SITE }),
    ).rejects.toMatchObject({ response: { message: BLOCKED.message } });
  });

  it("lets an unregistered number fall through to the normal rejection", async () => {
    // No identity means no role to judge, so the geofence stays out of it and
    // the existing "no OTP was requested" path still owns the error.
    const { service, prisma, geofence } = setup();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.weaver.findFirst.mockResolvedValue(null);
    prisma.otpCode.findFirst.mockResolvedValue(null);

    await expect(service.verifyOtp({ phone: "9123456780", code: "123456" })).rejects.toThrow(
      /No OTP was requested/,
    );
    expect(geofence.evaluate).not.toHaveBeenCalled();
  });
});

describe("switchRole location check", () => {
  const admin = {
    id: "u1",
    mobile: "9999999999",
    role: UserRole.ADMIN,
    name: "A",
    accessLevel: "FULL_ACCESS",
    weaverId: null,
  } as never;

  it("closes the side door from an unrestricted portal into a geofenced one", async () => {
    const { service, prisma, geofence } = setup();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      role: UserRole.ADMIN,
      additionalRoles: [UserRole.WORKER],
      portalAccess: [],
      linkedWeaverId: null,
    });
    geofence.evaluate.mockResolvedValue(BLOCKED);

    await expect(service.switchRole(admin, UserRole.WORKER, OFF_SITE)).rejects.toMatchObject({
      response: { code: "GEOFENCE_BLOCKED" },
    });
  });

  it("judges the target portal, not the one the token was issued for", async () => {
    const { service, prisma, geofence } = setup();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      role: UserRole.ADMIN,
      additionalRoles: [UserRole.WORKER],
      portalAccess: [],
      linkedWeaverId: null,
    });

    await service.switchRole(admin, UserRole.WORKER, OFF_SITE);

    expect(geofence.evaluate).toHaveBeenCalledWith({
      role: UserRole.WORKER,
      userId: "u1",
      fix: OFF_SITE,
    });
  });

  it("still refuses a portal that is not assigned, without consulting the geofence", async () => {
    const { service, prisma, geofence } = setup();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      role: UserRole.ADMIN,
      additionalRoles: [],
      portalAccess: [],
      linkedWeaverId: null,
    });

    await expect(service.switchRole(admin, UserRole.WEAVER, OFF_SITE)).rejects.toThrow(
      /not assigned/,
    );
    expect(geofence.evaluate).not.toHaveBeenCalled();
  });
});
