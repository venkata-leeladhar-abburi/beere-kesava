import { UnauthorizedException } from "@nestjs/common";
import { AccessLevel, UserRole } from "../generated/prisma/client";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let prisma: any;
  let jwtService: any;
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
      otpCode: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn().mockReturnValue("signed.jwt.token") };
    service = new AuthService(prisma, jwtService);
  });

  describe("requestOtp", () => {
    it("always issues OTP '123456' and persists an OtpCode row when none exists yet", async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.weaver.findFirst.mockResolvedValue(null);
      prisma.otpCode.findFirst.mockResolvedValue(null);

      const result = await service.requestOtp({ phone: "9999999999" });

      expect(prisma.otpCode.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ code: "123456" }) }),
      );
      expect(result).toEqual(
        expect.objectContaining({ success: true, phone: "9999999999", exists: false }),
      );
    });

    it("resets attempts and refreshes expiry on an existing unconsumed OTP row instead of creating a duplicate", async () => {
      prisma.user.findFirst.mockResolvedValue({ id: "u1" });
      prisma.otpCode.findFirst.mockResolvedValue({ id: "otp-1" });

      await service.requestOtp({ phone: "9999999999" });

      expect(prisma.otpCode.create).not.toHaveBeenCalled();
      expect(prisma.otpCode.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "otp-1" },
          data: expect.objectContaining({ code: "123456", attempts: 0 }),
        }),
      );
    });
  });

  describe("verifyOtp", () => {
    it("rejects when no OTP row was ever requested for the phone number", async () => {
      prisma.otpCode.findFirst.mockResolvedValue(null);

      await expect(service.verifyOtp({ phone: "9999999999", code: "123456" })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("rejects and does not consume an expired OTP", async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: "otp-1",
        code: "123456",
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verifyOtp({ phone: "9999999999", code: "123456" })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.otpCode.update).not.toHaveBeenCalled();
    });

    it("increments attempts and rejects on a wrong code", async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: "otp-1",
        code: "123456",
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(service.verifyOtp({ phone: "9999999999", code: "000000" })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.otpCode.update).toHaveBeenCalledWith({
        where: { id: "otp-1" },
        data: { attempts: { increment: 1 } },
      });
    });

    it("consumes the OTP and returns a signed token + user on success", async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: "otp-1",
        code: "123456",
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.user.findFirst
        .mockResolvedValueOnce(null) // ensureDefaultUsers: superadmin lookup
        .mockResolvedValueOnce(null) // ensureDefaultUsers: admin lookup
        .mockResolvedValueOnce({
          id: "u1",
          firstName: "Store",
          lastName: "Admin",
          email: "admin@beerekesava.com",
          role: UserRole.ADMIN,
        });
      prisma.weaver.findFirst.mockResolvedValue(null);

      const result = await service.verifyOtp({ phone: "9999999999", code: "123456" });

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
        expect.objectContaining({ token: "signed.jwt.token", user: expect.objectContaining({ id: "u1" }) }),
      );
    });
  });

  describe("ensureDefaultUsers", () => {
    it("seeds SuperAdmin and Admin by mobile when neither exists", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await service.ensureDefaultUsers();

      expect(prisma.user.create).toHaveBeenCalledTimes(2);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mobile: "9999999999",
            role: UserRole.SUPERADMIN,
            accessLevel: AccessLevel.FULL_ACCESS,
          }),
        }),
      );
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mobile: "8888888888", role: UserRole.ADMIN }),
        }),
      );
    });

    it("does not reseed SuperAdmin/Admin when they already exist by mobile", async () => {
      prisma.user.findFirst.mockResolvedValue({ id: "existing" });

      await service.ensureDefaultUsers();

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("regression: a normal user created earlier with empId EMP-001 must not block the SuperAdmin seed (lookup is by mobile, not empId)", async () => {
      // Simulate: a regular user with empId "EMP-001" already exists, but no
      // user has mobile 9999999999 or 8888888888 yet.
      prisma.user.findFirst.mockResolvedValue(null);

      await service.ensureDefaultUsers();

      // The seed must look up existence by mobile only — it should never
      // query/filter by empId "EMP-001"/"EMP-002" (that was the historical bug).
      for (const call of prisma.user.findFirst.mock.calls) {
        expect(call[0]).toEqual({ where: { mobile: expect.any(String) } });
      }
      expect(prisma.user.create).toHaveBeenCalledTimes(2);
    });
  });
});
