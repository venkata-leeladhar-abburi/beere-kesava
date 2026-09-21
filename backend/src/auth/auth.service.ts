import { randomInt } from "crypto";
import {
  HttpException,
  HttpStatus,
  ForbiddenException,
  Injectable,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { AuditLogService } from "../audit-log/audit-log.service";
import { deviceLabel } from "../audit-log/device-label";
import { normalizeMobile } from "../common/phone.util";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsAppService } from "../whatsapp/whatsapp.service";
import { GeofenceService, type LocationFix } from "../geofence/geofence.service";
import { GeofenceBlockedError } from "../common/errors";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import type { AuthenticatedUser } from "./strategies/jwt.strategy";
import { OtpInspectorService } from "./testing/otp-inspector.service";
import { accessLevelFor } from "../users/portal-access";
import { AuditStatus, UserRole, AccessLevel, WhatsAppMessageKind, WhatsAppMessageStatus } from "../generated/prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly whatsapp: WhatsAppService,
    private readonly auditLog: AuditLogService,
    private readonly geofence: GeofenceService,
    // Only actually provided when isE2eTestModeEnabled() (see auth.module.ts);
    // @Optional() means this resolves to undefined everywhere else, so every
    // call site below is a no-op in production.
    @Optional() private readonly otpInspector?: OtpInspectorService,
  ) {}

  private cleanPhone(phone: string): string {
    return normalizeMobile(phone);
  }

  /** The position half of a sign-in dto, or null when the client sent none. */
  private fixFrom(dto: LocationFix): LocationFix | null {
    return dto.latitude == null || dto.longitude == null
      ? null
      : { latitude: dto.latitude, longitude: dto.longitude, accuracyMeters: dto.accuracyMeters };
  }

  /**
   * Which portal a token issued for this phone number will open, which is the
   * role the geofence has to be judged against.
   *
   * The PRIMARY role only. Someone holding both ADMIN and WORKER lands in the
   * admin portal and so is not geofenced at sign-in — switching into the
   * worker portal afterwards is re-checked by switchRole(), which is where
   * that side door is closed.
   */
  private async identityForPhone(phone: string): Promise<{ role: UserRole; userId?: string } | null> {
    const user = await this.prisma.user.findFirst({
      where: { mobile: { contains: phone } },
      select: { id: true, role: true },
    });
    if (user) return { role: user.role, userId: user.id };
    const weaver = await this.prisma.weaver.findFirst({
      where: { phone: { contains: phone } },
      select: { id: true },
    });
    // A weaver with no User row has no AuditLog-referenceable id, so only the
    // role travels — exemptions are granted against User rows.
    return weaver ? { role: UserRole.WEAVER } : null;
  }

  private readonly otpTtlMs = 5 * 60 * 1000;
  private readonly maxOtpAttempts = 3;
  // How long a phone number is locked out of both verifying and requesting a
  // new OTP after its 3rd wrong guess — timed from that wrong guess itself
  // (OtpCode.updatedAt), not from when the OTP was first issued.
  private readonly wrongAttemptLockoutMs = 30 * 60 * 1000;

  private lockoutRemainingMinutes(lockedRow: { attempts: number; updatedAt: Date }): number | null {
    if (lockedRow.attempts < this.maxOtpAttempts) return null;
    const elapsed = Date.now() - lockedRow.updatedAt.getTime();
    if (elapsed >= this.wrongAttemptLockoutMs) return null;
    return Math.ceil((this.wrongAttemptLockoutMs - elapsed) / 60_000);
  }

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

    // Refused here as well as at verify so a person who cannot sign in never
    // receives a code: each OTP is a billable WhatsApp authentication
    // conversation. This check is skippable by calling verify directly, which
    // is why verifyOtp repeats it rather than trusting this one.
    const identity = user ? { role: user.role, userId: user.id } : { role: UserRole.WEAVER };
    const requestFix = this.fixFrom(dto);
    const requestVerdict = await this.geofence.evaluate({ ...identity, fix: requestFix });
    if (!requestVerdict.allowed) {
      throw new GeofenceBlockedError(requestVerdict.message!);
    }

    // No resend throttle: an OTP can be requested as often as the caller
    // likes. The 60s cooldown and the 5-per-hour cap were removed on request.
    //
    // The wrong-guess lockout below is a different control and is kept: it
    // stops a number that has burned its 3 verify attempts from routing
    // around the lockout by asking for a fresh code.
    const lastOtp = await this.prisma.otpCode.findFirst({
      where: { phoneNumber: phone },
      orderBy: { createdAt: "desc" },
    });
    const lockoutMinutes = lastOtp ? this.lockoutRemainingMinutes(lastOtp) : null;
    if (lockoutMinutes !== null) {
      throw new HttpException(
        `Too many incorrect attempts. Please try again in ${lockoutMinutes} minute${lockoutMinutes === 1 ? "" : "s"}.`,
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

  /**
   * Every outcome of this method is recorded to the login history — success
   * and each distinct failure alike. A security log that only records
   * successes is the one that cannot answer the question it exists for
   * ("was anyone trying to get in?").
   *
   * `userAgent` is optional so existing callers and the unit tests are
   * unaffected; the controller passes the real header.
   */
  async verifyOtp(dto: VerifyOtpDto, userAgent?: string) {
    const phone = this.cleanPhone(dto.phone);
    const device = deviceLabel(userAgent);
    const fix = this.fixFrom(dto);

    // The authoritative location check, and deliberately the FIRST thing that
    // happens — ahead of reading the OTP row, comparing the code or touching
    // the attempt counter. Someone refused for being off site should not also
    // lose the code they were sent or burn one of their three guesses on a
    // rejection that had nothing to do with the code they typed.
    //
    // requestOtp ran the same check, and that is not redundant: this endpoint
    // is reachable on its own, so the earlier call is a courtesy and this one
    // is the control.
    const identity = await this.identityForPhone(phone);
    const geofence = identity
      ? await this.geofence.evaluate({ role: identity.role, userId: identity.userId, fix })
      : null;
    // Recorded on EVERY outcome below, not just refusals. An allowed login
    // carrying its distance and accuracy is the entire point of OBSERVE mode:
    // it is the evidence the radius gets tuned from.
    const geoFields = geofence ? this.geofence.auditFieldsFor(geofence, fix) : {};

    // Best-effort: an audit write must never turn a good login into a 500, or
    // mask the real reason a bad one was rejected.
    const audit = async (
      status: AuditStatus,
      params: { userId?: string; failReason?: string; duration?: number } = {},
    ) => {
      try {
        await this.auditLog.record({ status, device, ...geoFields, ...params });
      } catch {
        /* login history is observability, not a precondition for signing in */
      }
    };

    if (geofence && !geofence.allowed) {
      await audit(AuditStatus.FAILED, {
        userId: identity?.userId,
        failReason: `Location check failed (${geofence.decision})`,
      });
      throw new GeofenceBlockedError(geofence.message!);
    }

    // Resolved lazily so a failed attempt can still be attributed to the
    // account someone was trying to get into.
    const attemptedUserId = async () =>
      (await this.prisma.user.findFirst({ where: { mobile: { contains: phone } }, select: { id: true } }))?.id;

    const otpRow = await this.prisma.otpCode.findFirst({
      where: { phoneNumber: phone, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRow) {
      await audit(AuditStatus.FAILED, {
        userId: await attemptedUserId(),
        failReason: "No OTP was requested for this phone number",
      });
      throw new UnauthorizedException("No OTP was requested for this phone number.");
    }

    if (otpRow.expiresAt < new Date()) {
      await audit(AuditStatus.FAILED, {
        userId: await attemptedUserId(),
        failReason: "OTP had expired",
      });
      throw new UnauthorizedException("OTP has expired. Please request a new one.");
    }

    const lockoutMinutes = this.lockoutRemainingMinutes(otpRow);
    if (lockoutMinutes !== null) {
      await audit(AuditStatus.FAILED, {
        userId: await attemptedUserId(),
        failReason: `Locked out after ${this.maxOtpAttempts} incorrect attempts`,
      });
      throw new HttpException(
        `Too many incorrect attempts. Please try again in ${lockoutMinutes} minute${lockoutMinutes === 1 ? "" : "s"}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const matches = await bcrypt.compare(dto.code, otpRow.code);
    if (!matches) {
      await this.prisma.otpCode.update({
        where: { id: otpRow.id },
        data: { attempts: { increment: 1 } },
      });
      await audit(AuditStatus.FAILED, {
        userId: await attemptedUserId(),
        failReason: `Incorrect OTP (attempt ${otpRow.attempts + 1} of ${this.maxOtpAttempts})`,
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
      include: { portalAccess: true },
    });

    let role = user?.role || UserRole.ADMIN;
    let roles: UserRole[] = user ? this.rolesOf(user) : [role];
    let userId = user?.id;
    let name = user ? `${user.firstName} ${user.lastName}` : "";
    let email = user?.email || "";
    // Per-portal, not per-person: `role` here is the portal this token opens.
    let accessLevel: AccessLevel = user ? accessLevelFor(user, role) : AccessLevel.FULL_ACCESS;
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
        await audit(AuditStatus.FAILED, { failReason: "Account not found for this phone number" });
        throw new UnauthorizedException("Account not found for this phone number.");
      }

      role = UserRole.WEAVER;
      roles = [UserRole.WEAVER];
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

    // Only User rows can be referenced: the weaver fallback path above sets
    // `userId` to a Weaver.id, which is not a valid AuditLog.userId FK.
    await audit(AuditStatus.LOGIN, { userId: user?.id });

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
        roles,
        accessLevel,
        dateAdded,
      },
    };
  }

  /** Primary role first, then any extra portals, without duplicates. */
  private rolesOf(user: { role: UserRole; additionalRoles?: UserRole[] | null }): UserRole[] {
    return [...new Set([user.role, ...(user.additionalRoles ?? [])])];
  }

  /**
   * Re-issues the caller's token for another of their assigned portals.
   * Roles are re-read from the database, never trusted from the old token,
   * so a portal an admin has since removed can no longer be switched into.
   */
  async switchRole(current: AuthenticatedUser, target: UserRole, fix?: LocationFix | null) {
    const user = current.id
      ? await this.prisma.user.findUnique({ where: { id: current.id }, include: { portalAccess: true } })
      : null;
    // Weaver-only sessions (no User row) have exactly one portal.
    const roles = user ? this.rolesOf(user) : [current.role];
    if (!roles.includes(target)) {
      throw new ForbiddenException("That portal is not assigned to your account.");
    }

    // Checked against the TARGET portal, which is the whole reason this is
    // here: an admin is not geofenced, so without this they could sign in
    // from anywhere and then switch into a geofenced portal — walking through
    // the restriction by the side door rather than the front one.
    const verdict = await this.geofence.evaluate({ role: target, userId: user?.id, fix });
    if (!verdict.allowed) {
      throw new GeofenceBlockedError(verdict.message!);
    }

    const payload = {
      sub: current.id,
      mobile: current.mobile,
      role: target,
      name: current.name,
      // The target portal's level, not the one the old token was issued for.
      accessLevel: user ? accessLevelFor(user, target) : current.accessLevel,
      weaverId: user ? user.linkedWeaverId : (current.weaverId ?? null),
    };
    // accessLevel travels back too: the client caches it for MoneyValue /
    // DownloadAccess, and it is per-portal, so it changes with the switch.
    return {
      token: this.jwtService.sign(payload),
      role: target,
      roles,
      accessLevel: payload.accessLevel,
    };
  }

  /**
   * Closes the caller's session in the login history.
   *
   * Logging out is otherwise entirely client-side (the token is simply
   * dropped), so without this the history would only ever contain LOGIN rows
   * and every session would read as "Ongoing" forever.
   */
  async logout(userId: string | undefined, userAgent?: string) {
    // Undefined for a session with no User row behind it — see
    // AuthenticatedUser.id, which carries a Weaver.id on the weaver fallback
    // path. Those never produced a LOGIN row either, so there is nothing to
    // close and nothing to record.
    if (userId) {
      await this.auditLog.recordLogout(userId, deviceLabel(userAgent));
    }
    return { ok: true };
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

