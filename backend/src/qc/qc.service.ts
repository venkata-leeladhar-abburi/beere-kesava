import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma, QcResult } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQcRecordDto } from "./dto/create-qc-record.dto";
import { ListQcQueryDto } from "./dto/list-qc-query.dto";

// Mirrors the frontend's computeQcPayment exactly (QcContext.tsx):
// - passed    -> deduction 0, payable = makingCharge
// - semi      -> deduction = semiDeduction clamped to [0, makingCharge], payable = makingCharge - deduction
// - defective -> deduction = makingCharge, payable = 0
function computeQcPayment(
  result: QcResult,
  makingCharge: number,
  semiDeduction = 0,
): { deduction: number; payable: number } {
  if (result === QcResult.DEFECTIVE) {
    return { deduction: makingCharge, payable: 0 };
  }
  if (result === QcResult.SEMI) {
    const deduction = Math.min(Math.max(semiDeduction, 0), makingCharge);
    return { deduction, payable: makingCharge - deduction };
  }
  return { deduction: 0, payable: makingCharge };
}

@Injectable()
export class QcService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateQcRecordDto) {
    const row = await this.prisma.batchSareeRow.findUnique({
      where: { sareeId: dto.sareeId },
      include: { qcRecord: true, sareeType: true },
    });
    if (!row) {
      throw new NotFoundException(`Saree ${dto.sareeId} not found`);
    }
    if (row.qcRecord) {
      throw new BadRequestException(`Saree ${dto.sareeId} has already been QC-inspected`);
    }
    if (!row.sareeTypeCode || !row.sareeType) {
      throw new BadRequestException(`Saree ${dto.sareeId} has no saree type assigned yet`);
    }
    if (!row.recipientType || (!row.weaverId && !row.factoryLoomId)) {
      throw new BadRequestException(`Saree ${dto.sareeId} has no weaver/factory loom assigned yet`);
    }

    const inspector = await this.prisma.user.findUnique({ where: { id: dto.inspectedById } });
    if (!inspector) {
      throw new NotFoundException(`User ${dto.inspectedById} not found`);
    }

    const makingCharge = Number(row.sareeType.makingCharge);
    const { deduction, payable } = computeQcPayment(dto.result, makingCharge, dto.semiDeduction);

    const receivedDate = dto.receivedDaysAgo
      ? new Date(Date.now() - dto.receivedDaysAgo * 24 * 60 * 60 * 1000)
      : new Date();

    const [record] = await this.prisma.$transaction([
      this.prisma.qcRecord.create({
        data: {
          sareeId: dto.sareeId,
          weaverId: row.weaverId,
          factoryLoomId: row.factoryLoomId,
          batchId: row.batchId,
          result: dto.result,
          defects: dto.defects ?? [],
          makingCharge,
          deduction,
          payable,
          receivedDate,
          notes: dto.notes,
          photoUrl: dto.photoUrl,
          inspectedById: dto.inspectedById,
        },
      }),
      this.prisma.batchSareeRow.update({
        where: { sareeId: dto.sareeId },
        data: { qcPassed: dto.result !== QcResult.DEFECTIVE },
      }),
    ]);

    await this.auditLog.recordAction({
      actorId: dto.inspectedById,
      module: "QC",
      action: `Recorded QC result ${dto.result} for saree ${dto.sareeId}`,
      entityType: "QcRecord",
      entityId: dto.sareeId,
      recordLabel: dto.sareeId,
      newValue: dto.result,
    });

    return record;
  }

  // `weaverScope`, when present (a WEAVER caller), always wins over
  // `query.weaverId` — a weaver must never be able to page through another
  // weaver's records just by passing a different id in the query string.
  async findAll(
    query: ListQcQueryDto,
    weaverScope?: string,
  ): Promise<PaginatedResult<Prisma.QcRecordGetPayload<object>>> {
    const where: Prisma.QcRecordWhereInput = {
      result: query.result,
      weaverId: weaverScope ?? query.weaverId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.qcRecord.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { qcDate: "desc" },
      }),
      this.prisma.qcRecord.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(sareeId: string, weaverScope?: string) {
    const record = await this.prisma.qcRecord.findUnique({ where: { sareeId } });
    if (!record) {
      throw new NotFoundException(`QC record for ${sareeId} not found`);
    }
    if (weaverScope && record.weaverId !== weaverScope) {
      throw new ForbiddenException(`QC record for ${sareeId} does not belong to you`);
    }
    return record;
  }

  // Sarees that passed/semi-passed QC and have no finishing assignment yet —
  // the "ready for finishing" queue (frontend's ReadySaree list, derived
  // rather than stored per the schema's design).
  async findReadyForFinishing() {
    return this.prisma.qcRecord.findMany({
      where: {
        result: { in: [QcResult.PASSED, QcResult.SEMI] },
        batchSareeRow: { finishingAssignment: null },
      },
      include: {
        batchSareeRow: { include: { design: true, sareeType: true, weaver: true } },
      },
      orderBy: { qcDate: "asc" },
    });
  }
}
