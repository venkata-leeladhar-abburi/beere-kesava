import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { AdminOnly } from "../auth/decorators/require-roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { NotFoundError } from "../common/errors";
import { AuditStatus, GeofenceMode, UserRole } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateGeofenceExemptionDto,
  CreateGeofenceSiteDto,
  ListReadingsQueryDto,
  UpdateGeofenceSiteDto,
  UpsertGeofencePolicyDto,
} from "./dto/geofence-admin.dto";
import { summariseReadings } from "./readings";

/**
 * Administration of the location restriction. Every route is Admin/Superadmin
 * only — which is also what makes this the break-glass path: those two roles
 * are never geofenced, so whoever can reach these routes can always reach
 * them, including from off site when a bad radius has locked everyone else
 * out. That property is deliberate; do not geofence this controller.
 */
@AdminOnly()
@Controller("geofence")
export class GeofenceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("sites")
  listSites() {
    return this.prisma.geofenceSite.findMany({ orderBy: { createdAt: "asc" } });
  }

  @Post("sites")
  createSite(@Body() dto: CreateGeofenceSiteDto) {
    return this.prisma.geofenceSite.create({ data: dto });
  }

  @Patch("sites/:id")
  async updateSite(@Param("id") id: string, @Body() dto: UpdateGeofenceSiteDto) {
    const existing = await this.prisma.geofenceSite.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Geofence site", id);
    return this.prisma.geofenceSite.update({ where: { id }, data: dto });
  }

  @Delete("sites/:id")
  async deleteSite(@Param("id") id: string) {
    const existing = await this.prisma.geofenceSite.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Geofence site", id);
    await this.prisma.geofenceSite.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Every role, including the ones with no policy row, so the screen can show
   * "not restricted" as a real state rather than an absence. ADMIN and
   * SUPERADMIN are reported but cannot be switched on — see upsertPolicy.
   */
  @Get("policies")
  async listPolicies() {
    const rows = await this.prisma.geofenceRolePolicy.findMany();
    const byRole = new Map(rows.map((row) => [row.role, row]));
    return Object.values(UserRole).map((role) => ({
      role,
      enforced: byRole.get(role)?.enforced ?? false,
      mode: byRole.get(role)?.mode ?? GeofenceMode.OBSERVE,
      lockedUnrestricted: role === UserRole.ADMIN || role === UserRole.SUPERADMIN,
    }));
  }

  @Put("policies/:role")
  async upsertPolicy(@Param("role") role: UserRole, @Body() dto: UpsertGeofencePolicyDto) {
    if (!Object.values(UserRole).includes(role)) {
      throw new NotFoundError("Role", role);
    }
    // Refused rather than merely discouraged. Geofencing the admin roles
    // removes the only way back in when a misconfigured site locks the
    // business out, and the person making that mistake is by definition on
    // site and would not see it fail.
    if (role === UserRole.ADMIN || role === UserRole.SUPERADMIN) {
      throw new NotFoundError("Geofence policy", role);
    }
    return this.prisma.geofenceRolePolicy.upsert({
      where: { role },
      create: { role, ...dto },
      update: dto,
    });
  }

  /** Unexpired exemptions only — a lapsed one is history, not configuration. */
  @Get("exemptions")
  listExemptions() {
    return this.prisma.geofenceExemption.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: "asc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, empId: true, role: true } },
        grantedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  @Post("exemptions")
  async createExemption(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateGeofenceExemptionDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundError("User", dto.userId);
    return this.prisma.geofenceExemption.create({
      data: {
        userId: dto.userId,
        reason: dto.reason,
        expiresAt: new Date(dto.expiresAt),
        grantedById: actor.id ?? null,
      },
    });
  }

  /**
   * What the geofence has actually been seeing.
   *
   * The point of OBSERVE mode: these rows are the evidence a radius gets set
   * from. Only sign-ins that were judged are returned — a row with no
   * decision belongs to an unrestricted role, which is never asked for a
   * position and has nothing to report.
   */
  @Get("readings")
  async readings(@Query() query: ListReadingsQueryDto) {
    const days = query.days ?? 30;
    const limit = query.limit ?? 100;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.auditLog.findMany({
      where: {
        createdAt: { gte: since },
        geofenceDecision: { not: null },
        ...(query.role ? { user: { role: query.role } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        status: true,
        device: true,
        failReason: true,
        latitude: true,
        longitude: true,
        accuracyMeters: true,
        distanceMeters: true,
        geofenceDecision: true,
        geofenceMode: true,
        user: { select: { id: true, firstName: true, lastName: true, empId: true, role: true } },
      },
    });

    // The radius these readings are being judged against. Falls back to the
    // schema default when no site exists, so the summary still renders rather
    // than dividing by an absent configuration.
    const site = await this.prisma.geofenceSite.findFirst({ where: { active: true } });
    const radiusMeters = site?.radiusMeters ?? 100;

    const { summary, buckets } = summariseReadings(
      rows.map((row) => ({
        distanceMeters: row.distanceMeters,
        accuracyMeters: row.accuracyMeters,
        decision: row.geofenceDecision,
      })),
      radiusMeters,
    );

    return {
      days,
      radiusMeters,
      siteLabel: site?.label ?? null,
      summary,
      buckets,
      rows: rows.map((row) => ({
        id: row.id,
        at: row.createdAt,
        signedIn: row.status === AuditStatus.LOGIN,
        staffName: row.user ? `${row.user.firstName} ${row.user.lastName}` : null,
        empId: row.user?.empId ?? null,
        role: row.user?.role ?? null,
        device: row.device,
        failReason: row.failReason,
        latitude: row.latitude,
        longitude: row.longitude,
        accuracyMeters: row.accuracyMeters,
        distanceMeters: row.distanceMeters,
        decision: row.geofenceDecision,
        mode: row.geofenceMode,
      })),
    };
  }

  @Delete("exemptions/:id")
  async revokeExemption(@Param("id") id: string) {
    const existing = await this.prisma.geofenceExemption.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Geofence exemption", id);
    await this.prisma.geofenceExemption.delete({ where: { id } });
    return { ok: true };
  }
}
