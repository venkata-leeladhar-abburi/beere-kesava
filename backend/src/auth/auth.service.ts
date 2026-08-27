import { randomInt } from "crypto";
import {
  HttpException,
  HttpStatus,
  Injectable,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsAppService } from "../whatsapp/whatsapp.service";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { OtpInspectorService } from "./testing/otp-inspector.service";
import { UserRole, AccessLevel, WhatsAppMessageKind, WhatsAppMessageStatus } from "../generated/prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly whatsapp: WhatsAppService,
    // Only actually provided when isE2eTestModeEnabled() (see auth.module.ts);
    // @Optional() means this resolves to undefined everywhere else, so every
    // call site below is a no-op in production.
    @Optional() private readonly otpInspector?: OtpInspectorService,
  ) {}

  private cleanPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }

  private readonly otpTtlMs = 5 * 60 * 1000;
  private readonly maxOtpAttempts = 5;
  private readonly resendCooldownMs = 60 * 1000;
  private readonly maxOtpRequestsPerHour = 5;

  private generateOtp(): string {
    // crypto.randomInt is uniform; an OTP is a login credential and must
    // never be generated with Math.random.
    return String(randomInt(100_000, 1_000_000));
  }

  async requestOtp(dto: RequestOtpDto) {
    const phone = this.cleanPhone(dto.phone);

    // Seed default SuperAdmin and Admin if requested or missing
    await this.ensureDefaultUsers();

    const user = await this.prisma.user.findFirst({
      where: { mobile: { contains: phone } },
    });
    const weaver = !user
      ? await this.prisma.weaver.findFirst({ where: { phone: { contains: phone } } })
      : null;

    // Only registered numbers get an OTP — sending to unknown numbers burns
    // billable authentication conversations and is an open relay for abuse.
    if (!user && !weaver) {
      throw new UnauthorizedException("This mobile number is not registered.");
    }

    // Resend throttle: one OTP per 60s, max 5 per hour per number.
    const recent = await this.prisma.otpCode.findMany({
      where: {
        phoneNumber: phone,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (recent[0] && Date.now() - recent[0].createdAt.getTime() < this.resendCooldownMs) {
      throw new HttpException(
        "Please wait a minute before requesting another OTP.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (recent.length >= this.maxOtpRequestsPerHour) {
      throw new HttpException(
        "Too many OTP requests. Please try again in an hour.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.otpTtlMs);

    // Invalidate any outstanding OTPs, then issue exactly one. Updating an
    // existing row in place would leave stale rows usable if two requests race.
    await this.prisma.otpCode.updateMany({
      where: { phoneNumber: phone, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    // Recorded before hashing so an E2E test can retrieve it via
    // GET /auth/testing/otp — the database only ever stores the bcrypt hash.
    this.otpInspector?.record(phone, code);

    const hashedCode = await bcrypt.hash(code, 10);
    const otpRow = await this.prisma.otpCode.create({
      data: { phoneNumber: phone, code: hashedCode, expiresAt },
    });

    const result = await this.whatsapp.sendTemplate({
      campaignName: "bk_login_otp",
      destination: phone,
      recipientName: user ? `${user.firstName} ${user.lastName}` : (weaver?.name ?? "Customer"),
      templateParams: [code],
      // Same code again for the template's copy-code button — Meta rejects
      // the message outright if the button component has no parameter.
      copyCode: code,
      kind: WhatsAppMessageKind.OTP,
    });

    if (result.status === WhatsAppMessageStatus.FAILED) {
      await this.prisma.otpCode.update({
        where: { id: otpRow.id },
        data: { consumedAt: new Date() },
      });
      throw new ServiceUnavailableException(
        "Could not send the OTP on WhatsApp. Please try again shortly.",
      );
    }

    return {
      success: true,
      message: "OTP sent on WhatsApp",
      phone,
      exists: true,
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

    if (otpRow.attempts >= this.maxOtpAttempts) {
      throw new UnauthorizedException("Too many incorrect attempts. Please request a new OTP.");
    }

    const matches = await bcrypt.compare(dto.code, otpRow.code);
    if (!matches) {
      await this.prisma.otpCode.update({
        where: { id: otpRow.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException("Invalid OTP code.");
    }

    await this.prisma.otpCode.update({
      where: { id: otpRow.id },
      data: { consumedAt: new Date() },
    });

    await this.ensureDefaultUsers();

    const user = await this.prisma.user.findFirst({
      where: { mobile: { contains: phone } },
    });

    let role = user?.role || UserRole.ADMIN;
    let userId = user?.id;
    let name = user ? `${user.firstName} ${user.lastName}` : "";
    let email = user?.email || "";
    let accessLevel: AccessLevel = user?.accessLevel || AccessLevel.FULL_ACCESS;
    let empId = user?.empId ?? null;
    let dateAdded: Date | null = user?.dateAdded ?? null;
    // Distinct from `userId`: the real Weaver.id for WEAVER-role sessions,
    // used by weaver-portal pages to scope data (batches/payments/etc are
    // FK'd to Weaver.id, not User.id). `userId`/JWT `sub` stays the actual
    // User.id so permission overrides/audit trail keep working correctly —
    // never overload it with the Weaver id.
    let weaverId: string | null = user?.linkedWeaverId ?? null;

    if (!user) {
      const weaver = await this.prisma.weaver.findFirst({
        where: { phone: { contains: phone } },
      });

      // requestOtp already rejects unregistered numbers, so this can only
      // fail to resolve if the weaver/user was deleted between request and
      // verify. There is no "fall back to SuperAdmin" branch here anymore —
      // an unresolved identity means the session is denied, full stop.
      if (!weaver) {
        throw new UnauthorizedException("Account not found for this phone number.");
      }

      role = UserRole.WEAVER;
      userId = weaver.id;
      name = weaver.name;
      email = weaver.email;
      accessLevel = AccessLevel.FULL_ACCESS;
      empId = weaver.code;
      dateAdded = weaver.createdAt;
      // No User row at all in this fallback path — the Weaver's own id
      // doubles as both the session identity and the weaver-portal id.
      weaverId = weaver.id;
    }

    // weaverId must travel in the token, not just the response body: every
    // weaver-scoped backend query (batches, payments, ...) filters on
    // Weaver.id, which is NOT the same value as `sub` (User.id).
    const payload = {
      sub: userId,
      mobile: phone,
      role,
      name,
      accessLevel,
      weaverId,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: userId,
        weaverId,
        empId,
        name,
        email,
        mobile: phone,
        role,
        accessLevel,
        dateAdded,
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
      where: { mobile: "9392757489" },
    });
    if (!superAdmin) {
      await this.prisma.user.create({
        data: {
          empId: "SEED-SUPERADMIN",
          firstName: "Super",
          lastName: "Admin",
          mobile: "9392757489",
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
