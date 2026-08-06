import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { RateRequestStatus } from "../generated/prisma/client";

export interface CreateRateRequestDto {
  sareeTypeCode: string;
  newMakingCharge: number;
  newRetailPrice: number;
  newWholesalePrice: number;
  reason?: string;
  requestedById: string;
}

@Injectable()
export class RateRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(status?: RateRequestStatus) {
    const items = await this.prisma.rateChangeRequest.findMany({
      where: status ? { status } : undefined,
      include: { sareeType: true, requestedBy: true, decidedBy: true },
      orderBy: { createdAt: "desc" },
    });
    return { items };
  }

  async create(dto: CreateRateRequestDto) {
    const sareeType = await this.prisma.sareeTypeRate.findUnique({
      where: { code: dto.sareeTypeCode },
    });
    if (!sareeType) throw new NotFoundException(`Saree type ${dto.sareeTypeCode} not found`);

    const id = await this.idGenerator.nextFormatted("RCR-2026");
    const item = await this.prisma.rateChangeRequest.create({
      data: {
        id,
        sareeTypeCode: dto.sareeTypeCode,
        oldMakingCharge: sareeType.makingCharge,
        newMakingCharge: dto.newMakingCharge,
        oldRetailPrice: sareeType.retailPrice,
        newRetailPrice: dto.newRetailPrice,
        oldWholesalePrice: sareeType.wholesalePrice,
        newWholesalePrice: dto.newWholesalePrice,
        reason: dto.reason || null,
        requestedById: dto.requestedById,
      },
      include: { sareeType: true, requestedBy: true },
    });

    await this.auditLog.recordAction({
      actorId: dto.requestedById,
      module: "RATE_REQUESTS",
      action: `Requested rate change for ${dto.sareeTypeCode}`,
      entityType: "RateChangeRequest",
      entityId: item.id,
      recordLabel: item.id,
    });

    return item;
  }

  async approve(id: string, decidedById?: string) {
    const existing = await this.prisma.rateChangeRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Rate change request ${id} not found`);

    const item = await this.prisma.$transaction(async (tx) => {
      // 1. Update request status
      const updatedReq = await tx.rateChangeRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          decidedAt: new Date(),
          decidedById: decidedById || null,
        },
        include: { sareeType: true, requestedBy: true, decidedBy: true },
      });

      // 2. Update SareeTypeRate master catalog
      await tx.sareeTypeRate.update({
        where: { code: existing.sareeTypeCode },
        data: {
          makingCharge: existing.newMakingCharge,
          retailPrice: existing.newRetailPrice,
          wholesalePrice: existing.newWholesalePrice,
        },
      });

      return updatedReq;
    });

    await this.auditLog.recordAction({
      actorId: decidedById,
      module: "RATE_REQUESTS",
      action: `Approved rate change for ${existing.sareeTypeCode}`,
      entityType: "RateChangeRequest",
      entityId: item.id,
      recordLabel: item.id,
      oldValue: existing.status,
      newValue: "APPROVED",
    });

    return item;
  }

  async reject(id: string, decidedById?: string, reason?: string) {
    const existing = await this.prisma.rateChangeRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Rate change request ${id} not found`);

    const item = await this.prisma.rateChangeRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        decidedAt: new Date(),
        decidedById: decidedById || null,
        reason: reason || existing.reason,
      },
      include: { sareeType: true, requestedBy: true, decidedBy: true },
    });

    await this.auditLog.recordAction({
      actorId: decidedById,
      module: "RATE_REQUESTS",
      action: `Rejected rate change for ${existing.sareeTypeCode}`,
      entityType: "RateChangeRequest",
      entityId: item.id,
      recordLabel: item.id,
      oldValue: existing.status,
      newValue: "REJECTED",
    });

    return item;
  }
}
