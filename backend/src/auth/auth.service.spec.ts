import { HttpException, HttpStatus, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import {
  AccessLevel,
  UserRole,
  WhatsAppMessageStatus,
} from "../generated/prisma/client";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let prisma: any;
  let jwtService: any;
  let whatsapp: any;
  let auditLog: any;
  let geofence: any;
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      weaver: {
        findFirst: jest.fn(),
      },
      authSession: {
        create: jest.fn().mockResolvedValue({ id: "sess-1" }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      otpCode: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: "otp-1" }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn().mockReturnValue("signed.jwt.token") };
    whatsapp = {
      sendTemplate: jest.fn().mockResolvedValue({ status: WhatsAppMessageStatus.SENT }),
      sanitiseParam: jest.fn((v: string) => v),
    };
    auditLog = { record: jest.fn().mockResolvedValue({}), recordLogout: jest.fn().mockResolvedValue({}) };
    // Allows by default, as it does for a role carrying no policy row: these
    // cases are about the OTP flow, and the geofence has its own suite. The
    // handful of tests that care override `evaluate` themselves.
    geofence = {
      evaluate: jest.fn().mockResolvedValue({
        allowed: true,
        decision: "NOT_ENFORCED",
        mode: null,
        distanceMeters: null,
        nearestSiteLabel: null,
        message: null,
      }),
      auditFieldsFor: jest.fn().mockReturnValue({}),
    };
    service = new AuthService(prisma, jwtService, whatsapp, auditLog, geofence);
  });

  describe("requestOtp", () => {
    it("rejects an unregistered number without sending anything", async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.weaver.findFirst.mockResolvedValue(null);

      await expect(service.requestOtp({ phone: "9123456780" })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(whatsapp.sendTemplate).not.toHaveBeenCalled();
      expect(prisma.otpCode.create).not.toHaveBeenCalled();
    });

    it("issues a random 6-digit OTP, stores it hashed, and sends it via WhatsApp", async () => {
      prisma.user.findFirst.mockResolvedValue({ status: "ACTIVE", id: "u1", mobile: "9999999999" });

      const result = await service.requestOtp({ phone: "9999999999" });

      // The code must never be persisted in plain text.
      const stored = prisma.otpCode.create.mock.calls[0][0].data.code as string;
      expect(stored).not.toMatch(/^\d{6}$/);

      const sentCode = whatsapp.sendTemplate.mock.calls[0][0].templateParams[0] as string;
      expect(sentCode).toMatch(/^\d{6}$/);
      expect(await bcrypt.compare(sentCode, stored)).toBe(true);

      expect(whatsapp.sendTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ campaignName: "bk_login_otp", destination: "9999999999" }),
      );
      expect(result).toEqual(expect.objectContaining({ success: true, phone: "9999999999" }));
    });

    it("invalidates outstanding OTPs before issuing a new one", async () => {
      prisma.user.findFirst.mockResolvedValue({ status: "ACTIVE", id: "u1" });

      await service.requestOtp({ phone: "9999999999" });

      expect(prisma.otpCode.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phoneNumber: "9999999999", consumedAt: null },
          data: expect.objectContaining({ consumedAt: expect.any(Date) }),
        }),
      );
    });

    it("allows a resend immediately — no cooldown or per-hour cap", async () => {
      prisma.user.findFirst.mockResolvedValue({ status: "ACTIVE", id: "u1" });
      prisma.otpCode.findFirst.mockResolvedValue({ id: "otp-0", createdAt: new Date(), attempts: 0, updatedAt: new Date() });

      await expect(service.requestOtp({ phone: "9999999999" })).resolves.toBeDefined();
      expect(whatsapp.sendTemplate).toHaveBeenCalled();
    });

    it("consumes the OTP row and surfaces an error when the WhatsApp send fails", async () => {
      prisma.user.findFirst.mockResolvedValue({ status: "ACTIVE", id: "u1" });
      whatsapp.sendTemplate.mockResolvedValue({ status: WhatsAppMessageStatus.FAILED });

      await expect(service.requestOtp({ phone: "9999999999" })).rejects.toThrow(
        ServiceUnavailableException,
      );
      // An undeliverable code must not stay valid for later use.
      expect(prisma.otpCode.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "otp-1" },
          data: expect.objectContaining({ consumedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("verifyOtp", () => {
    const hashed = (code: string) => bcrypt.hashSync(code, 10);

    it("rejects when no OTP row was ever requested for the phone number", async () => {
      prisma.otpCode.findFirst.mockResolvedValue(null);

      await expect(service.verifyOtp({ phone: "9999999999", code: "123456" })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejects and does not consume an expired OTP", async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: "otp-1",
        code: hashed("123456"),
        expiresAt: new Date(Date.now() - 1000),
        attempts: 0,
      });

      await expect(service.verifyOtp({ phone: "9999999999", code: "123456" })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.otpCode.update).not.toHaveBeenCalled();
    });

    it("rejects once the attempt ceiling is reached", async () => {
      // `updatedAt` is what lockoutRemainingMinutes times the lockout from —
      // a row without it made this assert a TypeError rather than the refusal
      // the test name describes, so the ceiling was never actually covered.
      prisma.otpCode.findFirst.mockResolvedValue({
        id: "otp-1",
        code: hashed("123456"),
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 5,
        updatedAt: new Date(),
      });

      // A lockout is 429, not 401 — UnauthorizedException would also have
      // been satisfied by the TypeError this test used to throw.
      await expect(service.verifyOtp({ phone: "9999999999", code: "123456" })).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    });

    it("records a failed attempt to the login history, with the reason", async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: "otp-1",
        code: hashed("999999"),
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
        updatedAt: new Date(),
      });
      prisma.user.findFirst.mockResolvedValue({ status: "ACTIVE", id: "user-1" });

      await expect(
        service.verifyOtp({ phone: "9999999999", code: "123456" }, "Mozilla/5.0 (iPhone) Safari/605"),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "FAILED",
          userId: "user-1",
          device: "Safari on iPhone",
          failReason: expect.stringContaining("Incorrect OTP"),
        }),
      );
    });

    it("never lets an audit-write failure block a rejection", async () => {
      auditLog.record.mockRejectedValue(new Error("audit table unavailable"));
      // A locked-out row: 3 wrong guesses, the last one just now. This is the
      // branch that raises the bare 429 asserted below — a null row here would
      // take the "no OTP requested" path and throw 401 instead.
      prisma.otpCode.findFirst.mockResolvedValue({
        id: "otp-1",
        code: "hashed",
        attempts: 3,
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        consumedAt: null,
      });

      await expect(service.verifyOtp({ phone: "9999999999", code: "123456" })).rejects.toThrow(
        HttpException,
      );
      try {
        await service.verifyOtp({ phone: "9999999999", code: "123456" });
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it("increments attempts and rejects on a wrong code", async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: "otp-1",
        code: hashed("123456"),
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
      });

      await expect(service.verifyOtp({ phone: "9999999999", code: "000000" })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.otpCode.update).toHaveBeenCalledWith({
        where: { id: "otp-1" },
        data: { attempts: { increment: 1 } },
      });
    });

    it("denies the session when the phone resolves to neither a user nor a weaver", async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: "otp-1",
        code: hashed("123456"),
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
      });
      // The identity lookups — all empty.
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.weaver.findFirst.mockResolvedValue(null);

      // Regression guard: this path used to fall back to logging the caller in
      // as the SUPERADMIN, which would be a full-access backdoor now that real
      // OTPs are delivered to real phones.
      await expect(service.verifyOtp({ phone: "9123456780", code: "123456" })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("consumes the OTP and returns a signed token + user on success", async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: "otp-1",
        code: hashed("123456"),
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
      });
      prisma.user.findFirst
        // verifyOtp resolves the caller's role first, to judge the location
        // check against the portal the token will actually open.
        .mockResolvedValueOnce({ id: "u1", role: UserRole.ADMIN })
        .mockResolvedValueOnce({
          id: "u1",
          empId: "EMP-001",
          firstName: "Store",
          lastName: "Admin",
          email: "admin@beerekesava.com",
          role: UserRole.ADMIN,
          accessLevel: AccessLevel.FULL_ACCESS,
          status: "ACTIVE",
        });
      prisma.weaver.findFirst.mockResolvedValue(null);

      const result = await service.verifyOtp({ phone: "9999999999", code: "123456" });

      // The token names a fresh session row, which is what makes it revocable.
      expect(prisma.authSession.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: "u1" }) }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({ sid: "sess-1" }));

      expect(prisma.otpCode.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "otp-1" },
          data: expect.objectContaining({ consumedAt: expect.any(Date) }),
        }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ mobile: "9999999999", role: UserRole.ADMIN }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          token: "signed.jwt.token",
          user: expect.objectContaining({ id: "u1" }),
        }),
      );
    });
  });

  describe("deactivated accounts", () => {
    it("are refused an OTP, so no billable message is sent", async () => {
      prisma.user.findFirst.mockResolvedValue({ id: "u1", status: "INACTIVE" });

      await expect(service.requestOtp({ phone: "9999999999" })).rejects.toThrow(/deactivated/);
      expect(whatsapp.sendTemplate).not.toHaveBeenCalled();
    });

    it("cannot sign in with an OTP issued before they were switched off", async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: "otp-1",
        code: bcrypt.hashSync("123456", 10),
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
      });
      prisma.user.findFirst.mockResolvedValue({ id: "u1", role: UserRole.WORKER, status: "INACTIVE" });

      await expect(service.verifyOtp({ phone: "9999999999", code: "123456" })).rejects.toThrow(
        /deactivated/,
      );
      expect(prisma.authSession.create).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe("sessions", () => {
    it("switching portal keeps the same session", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        role: UserRole.ADMIN,
        additionalRoles: [UserRole.WORKER],
        accessLevel: AccessLevel.FULL_ACCESS,
        portalAccess: [],
        linkedWeaverId: null,
      });

      await service.switchRole(
        { id: "u1", sessionId: "sess-9", mobile: "9999999999", role: UserRole.ADMIN, name: "A" },
        UserRole.WORKER,
      );

      expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({ sid: "sess-9" }));
      expect(prisma.authSession.create).not.toHaveBeenCalled();
    });

    it("logout ends the session server-side", async () => {
      await service.logout({ id: "u1", sessionId: "sess-9", mobile: "9", role: UserRole.ADMIN, name: "A" });

      expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
        where: { id: "sess-9", revokedAt: null },
        data: { revokedAt: expect.any(Date), revokedReason: "LOGOUT" },
      });
      expect(auditLog.recordLogout).toHaveBeenCalledWith("u1", undefined);
    });
  });

  describe("account creation", () => {
    // Login used to recreate a SUPERADMIN and a placeholder ADMIN
    // (8888888888) whenever either was missing, so deleting them never stuck.
    it("never creates users, even when the number is unknown", async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.weaver.findFirst.mockResolvedValue(null);

      await expect(service.requestOtp({ phone: "8888888888" })).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });
});
