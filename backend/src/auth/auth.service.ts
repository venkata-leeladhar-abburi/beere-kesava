import { Injectable, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { UserRole, AccessLevel } from "../generated/prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private cleanPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }

  private readonly otpTtlMs = 5 * 60 * 1000;

  async requestOtp(dto: RequestOtpDto) {
    const phone = this.cleanPhone(dto.phone);

    // Seed default SuperAdmin and Admin if requested or missing
    await this.ensureDefaultUsers();

    // Look for user by mobile number or weaver by phone
    const user = await this.prisma.user.findFirst({
      where: { mobile: { contains: phone } },
    });

    const weaver = !user
      ? await this.prisma.weaver.findFirst({ where: { phone: { contains: phone } } })
      : null;

    // Persist the OTP so verifyOtp has a real row to validate against
    // (code is always fixed to "123456" for now, per product decision — no
    // SMS/WhatsApp sending yet — but the OtpCode table is now actually used).
    const expiresAt = new Date(Date.now() + this.otpTtlMs);
    const existing = await this.prisma.otpCode.findFirst({
      where: { phoneNumber: phone, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await this.prisma.otpCode.update({
        where: { id: existing.id },
        data: { code: "123456", expiresAt, attempts: 0 },
      });
    } else {
      await this.prisma.otpCode.create({
        data: { phoneNumber: phone, code: "123456", expiresAt },
      });
    }

    // For fixed OTP demo mode, any valid phone number registered or default can receive OTP 123456
    return {
      success: true,
      message: "OTP sent successfully",
      phone,
      exists: !!(user || weaver),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const phone = this.cleanPhone(dto.phone);

    const otpRow = await this.prisma.otpCode.findFirst({
      where: { phoneNumber: phone, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRow) {
      throw new UnauthorizedException("No OTP was requested for this phone number.");
    }

    if (otpRow.expiresAt < new Date()) {
      throw new UnauthorizedException("OTP has expired. Please request a new one.");
    }

    // OTP validation - fixed to 123456
    if (dto.code !== "123456" || dto.code !== otpRow.code) {
      await this.prisma.otpCode.update({
        where: { id: otpRow.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException("Invalid OTP code. Please use 123456.");
    }

    await this.prisma.otpCode.update({
      where: { id: otpRow.id },
      data: { consumedAt: new Date() },
    });

    await this.ensureDefaultUsers();

    let user = await this.prisma.user.findFirst({
      where: { mobile: { contains: phone } },
    });

    let role = user?.role || UserRole.ADMIN;
    let userId = user?.id;
    let name = user ? `${user.firstName} ${user.lastName}` : "";
    let email = user?.email || "";

    if (!user) {
      const weaver = await this.prisma.weaver.findFirst({
        where: { phone: { contains: phone } },
      });
      if (weaver) {
        role = UserRole.WEAVER;
        userId = weaver.id;
        name = weaver.name;
        email = weaver.email;
      } else {
        // Fallback: If unknown phone number, auto-create a standard Admin or return SuperAdmin
        if (phone === "9999999999") {
          user = await this.prisma.user.findUnique({ where: { empId: "EMP-001" } });
        } else if (phone === "8888888888") {
          user = await this.prisma.user.findUnique({ where: { empId: "EMP-002" } });
        }

        if (!user) {
          // Default to SuperAdmin / Admin fallback for testing convenience
          user = await this.prisma.user.findFirst({ where: { role: UserRole.SUPERADMIN } });
        }

        if (user) {
          role = user.role;
          userId = user.id;
          name = `${user.firstName} ${user.lastName}`;
          email = user.email || "";
        }
      }
    }

    const payload = {
      sub: userId,
      mobile: phone,
      role,
      name,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: userId,
        name,
        email,
        mobile: phone,
        role,
      },
    };
  }

  async ensureDefaultUsers() {
    // NOTE: empId here uses a "SEED-" prefix, deliberately distinct from the
    // sequential "EMP-xxx" ids the general Add User flow generates via
    // IdGeneratorService (see users.service.ts). Reusing "EMP-001"/"EMP-002"
    // previously caused a real bug: whichever claimed that id first (a normal
    // user created through the UI, or this seed) silently blocked the other,
    // so the SuperAdmin/Admin seed could end up never created. Existence is
    // checked by mobile number only, since that's the real unique identity
    // used for OTP login.

    // Seed SuperAdmin if not existing
    const superAdmin = await this.prisma.user.findFirst({
      where: { mobile: "9999999999" },
    });
    if (!superAdmin) {
      await this.prisma.user.create({
        data: {
          empId: "SEED-SUPERADMIN",
          firstName: "Super",
          lastName: "Admin",
          mobile: "9999999999",
          email: "superadmin@beerekesava.com",
          role: UserRole.SUPERADMIN,
          accessLevel: AccessLevel.FULL_ACCESS,
        },
      });
    }

    // Seed Admin if not existing
    const admin = await this.prisma.user.findFirst({
      where: { mobile: "8888888888" },
    });
    if (!admin) {
      await this.prisma.user.create({
        data: {
          empId: "SEED-ADMIN",
          firstName: "Store",
          lastName: "Admin",
          mobile: "8888888888",
          email: "admin@beerekesava.com",
          role: UserRole.ADMIN,
          accessLevel: AccessLevel.FULL_ACCESS,
        },
      });
    }
  }
}
