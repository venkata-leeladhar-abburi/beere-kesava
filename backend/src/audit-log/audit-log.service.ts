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
   * Records one login-lifecycle event. Called by the auth module once it exists
   * (JWT/OTP login is still deferred project-wide — see users.controller.ts's
   * RBAC-guard notes for the same reason). No other module should call this.
   */
  record(params: { userId?: string; status: AuditStatus; device?: string; duration?: number; failReason?: string }) {
    return this.prisma.auditLog.create({ data: params });
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
    const where: Prisma.ActionLogWhereInput = { userId: query.userId, module: query.module };

    const [items, total] = await this.prisma.$transaction([
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

    const [items, total] = await this.prisma.$transaction([
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
