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

    // OTP validation - fixed to 123456
    if (dto.code !== "123456") {
      throw new UnauthorizedException("Invalid OTP code. Please use 123456.");
    }

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
    // Seed SuperAdmin if not existing
    const superAdmin = await this.prisma.user.findFirst({
      where: { OR: [{ mobile: "9999999999" }, { empId: "EMP-001" }] },
    });
    if (!superAdmin) {
      await this.prisma.user.create({
        data: {
          empId: "EMP-001",
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
      where: { OR: [{ mobile: "8888888888" }, { empId: "EMP-002" }] },
    });
    if (!admin) {
      await this.prisma.user.create({
        data: {
          empId: "EMP-002",
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
