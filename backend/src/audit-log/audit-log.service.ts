import { Injectable } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { AuditStatus, Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
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
