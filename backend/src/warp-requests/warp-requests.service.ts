import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { WarpRequestStatus } from "../generated/prisma/client";

export interface CreateWarpRequestDto {
  weaverId: string;
  loomNumber?: string;
  warpType: string;
  lengthMeters: number;
  color?: string;
  notes?: string;
}

@Injectable()
export class WarpRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(status?: WarpRequestStatus, weaverId?: string) {
    const items = await this.prisma.warpRequest.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(weaverId ? { weaverId } : {}),
      },
      include: { weaver: true, decidedBy: true },
      orderBy: { requestedAt: "desc" },
    });
    return { items };
  }

  async create(dto: CreateWarpRequestDto) {
    const id = await this.idGenerator.nextFormatted("WR-2026");
    const item = await this.prisma.warpRequest.create({
      data: {
        id,
        weaverId: dto.weaverId,
        loomNumber: dto.loomNumber || null,
        warpType: dto.warpType,
        lengthMeters: dto.lengthMeters,
        color: dto.color || null,
        notes: dto.notes || null,
      },
      include: { weaver: true },
    });

    await this.auditLog.recordAction({
      module: "WARP_REQUESTS",
      action: `Requested ${dto.lengthMeters}m ${dto.warpType} warp for ${item.weaver.name}`,
      entityType: "WarpRequest",
      entityId: item.id,
      recordLabel: item.id,
    });

    return item;
  }

  async approve(id: string, decidedById?: string) {
    const existing = await this.prisma.warpRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Warp request ${id} not found`);

    const item = await this.prisma.warpRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        decidedAt: new Date(),
        decidedById: decidedById || null,
      },
      include: { weaver: true, decidedBy: true },
    });

    await this.auditLog.recordAction({
      actorId: decidedById,
      module: "WARP_REQUESTS",
      action: `Approved warp request ${item.id} for ${item.weaver.name}`,
      entityType: "WarpRequest",
      entityId: item.id,
      recordLabel: item.id,
      oldValue: existing.status,
      newValue: "APPROVED",
    });

    return item;
  }

  async reject(id: string, decidedById?: string, notes?: string) {
    const existing = await this.prisma.warpRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Warp request ${id} not found`);

    const item = await this.prisma.warpRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        decidedAt: new Date(),
        decidedById: decidedById || null,
        notes: notes || existing.notes,
      },
      include: { weaver: true, decidedBy: true },
    });

    await this.auditLog.recordAction({
      actorId: decidedById,
      module: "WARP_REQUESTS",
      action: `Rejected warp request ${item.id} for ${item.weaver.name}`,
      entityType: "WarpRequest",
      entityId: item.id,
      recordLabel: item.id,
      oldValue: existing.status,
      newValue: "REJECTED",
    });

    return item;
  }
}
