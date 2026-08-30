import { Injectable } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { AuditStatus, Prisma, UserRole } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListActionLogQueryDto } from "./dto/list-action-log-query.dto";
import { ListAuditLogQueryDto } from "./dto/list-audit-log-query.dto";

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records one login-lifecycle event. Written by the auth module on
   * verify-otp and logout. No other module should call this.
   */
  record(params: { userId?: string; status: AuditStatus; device?: string; duration?: number; failReason?: string }) {
    return this.prisma.auditLog.create({ data: params });
  }

  /**
   * Closes the session opened by this user's most recent LOGIN, recording a
   * LOGOUT with the minutes elapsed.
   *
   * Duration is stored in whole minutes because that is the unit
   * `formatDuration` on the Login History screen reads it in. A session shorter
   * than a minute rounds to 0, which renders as "0 minutes" — accurate, and
   * better than inventing a floor.
   *
   * Never throws: logging out must succeed even when the audit write cannot,
   * so a failure here is swallowed rather than surfaced to the user.
   */
  async recordLogout(userId: string, device?: string) {
    try {
      // AuditLog.userId is an FK to User. A weaver-fallback session carries a
      // Weaver.id instead, so writing it would violate that FK — checked up
      // front rather than left to the catch below, which exists for real
      // failures, not for an expected case.
      const exists = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!exists) return null;

      const lastLogin = await this.prisma.auditLog.findFirst({
        where: { userId, status: AuditStatus.LOGIN },
        orderBy: { createdAt: "desc" },
      });

      // A LOGOUT already newer than that LOGIN means the session was closed
      // before — don't pair the same login twice.
      const alreadyClosed = lastLogin
        ? await this.prisma.auditLog.findFirst({
            where: { userId, status: AuditStatus.LOGOUT, createdAt: { gt: lastLogin.createdAt } },
          })
        : null;

      const duration =
        lastLogin && !alreadyClosed
          ? Math.max(0, Math.round((Date.now() - lastLogin.createdAt.getTime()) / 60_000))
          : undefined;

      return await this.record({ userId, status: AuditStatus.LOGOUT, device, duration });
    } catch {
      return null;
    }
  }

  /**
   * Records one generic "action feed" entry (create/update/approve/etc. on any
   * business entity). This is a SEPARATE model/table from the login-only
   * AuditLog above — do not conflate the two.
   *
   * No auth/req.user exists yet project-wide, so callers pass an explicit
   * `actorId` (same stopgap pattern as PurchaseRequest.requestedById). When
   * no actorId is supplied (or the id doesn't resolve to a user), the entry
   * is still written with a placeholder role so the feed doesn't silently
   * drop write activity — userId is simply left null in that case.
   */
  async recordAction(params: {
    actorId?: string;
    module: string;
    action: string;
    entityType?: string;
    entityId?: string;
    recordLabel?: string;
    oldValue?: string | null;
    newValue?: string | null;
  }) {
    let userId: string | undefined;
    let role: UserRole = UserRole.ADMIN;

    if (params.actorId) {
      const actor = await this.prisma.user.findUnique({ where: { id: params.actorId } });
      if (actor) {
        userId = actor.id;
        role = actor.role;
      }
    }

    return this.prisma.actionLog.create({
      data: {
        userId,
        role,
        module: params.module,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        recordLabel: params.recordLabel,
        oldValue: params.oldValue ?? undefined,
        newValue: params.newValue ?? undefined,
      },
    });
  }

  async findAllActions(
    query: ListActionLogQueryDto,
  ): Promise<PaginatedResult<Prisma.ActionLogGetPayload<{ include: { user: true } }>>> {
    // `modules` (a portal's whole module set) wins over the single `module`
    // filter when both are present.
    const where: Prisma.ActionLogWhereInput = {
      userId: query.userId,
      module: query.modules?.length ? { in: query.modules } : query.module,
    };

    const [items, total] = await Promise.all([
      this.prisma.actionLog.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }),
      this.prisma.actionLog.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findAll(
    query: ListAuditLogQueryDto,
  ): Promise<PaginatedResult<Prisma.AuditLogGetPayload<{ include: { user: true } }>>> {
    const where: Prisma.AuditLogWhereInput = { userId: query.userId, status: query.status };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }
}
