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
      include: {
        // Newest first — a saree accumulates one record per rework round, and
        // only the latest one describes its current state.
        qcRecords: { orderBy: { qcDate: "desc" }, take: 1 },
        sareeType: true,
      },
    });
    if (!row) {
      throw new NotFoundException(`Saree ${dto.sareeId} not found`);
    }
    const latestQc = row.qcRecords[0];
    if (latestQc) {
      // PASSED is terminal — the saree moves on to finishing.
      // Both SEMI and DEFECTIVE send the saree back to the weaver for rework.
      if (latestQc.result === QcResult.PASSED) {
        throw new BadRequestException(`Saree ${dto.sareeId} has already been QC-inspected`);
      }
      // A SEMI verdict clears receivedAt (see below) so the saree re-enters
      // the receive queue. Re-inspecting before it has physically come back
      // would just be re-recording a verdict on a saree that isn't here.
      if (!row.receivedAt) {
        throw new BadRequestException(
          `Saree ${dto.sareeId} is awaiting rework — receive it back from the weaver before inspecting it again`,
        );
      }
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

    // Falls back to the row's actual receipt date so a SEMI round keeps a
    // record of when that saree came in — receivedAt itself is cleared below.
    const receivedDate = dto.receivedDaysAgo
      ? new Date(Date.now() - dto.receivedDaysAgo * 24 * 60 * 60 * 1000)
      : (row.receivedAt ?? new Date());

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
        // Only a clean PASSED counts as "QC passed" — SEMI and DEFECTIVE
        // both fall short of that everywhere this flag is read (finishing
        // eligibility, weaver "produced" stats, batch progress, etc.).
        //
        // SEMI and DEFECTIVE additionally go back to the weaver for rework, so the
        // receipt is undone: with receivedAt cleared the saree drops out of
        // the QC queue and reappears in Worker Staff's receive queue, to be
        // received (and re-inspected) again once the weaver returns it. The
        // original receipt details stay on the QcRecord above.
        data:
          dto.result === QcResult.SEMI || dto.result === QcResult.DEFECTIVE
            ? {
                qcPassed: false,
                receivedAt: null,
                receivedWeight: null,
                receivedColor: null,
                receivedPhotoUrl: null,
              }
            : { qcPassed: dto.result === QcResult.PASSED },
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

  // Returns the *current* verdict for a saree — the newest record, since a
  // saree can carry several after SEMI-rework rounds.
  async findOne(sareeId: string, weaverScope?: string) {
    const record = await this.prisma.qcRecord.findFirst({
      where: { sareeId },
      orderBy: { qcDate: "desc" },
    });
    if (!record) {
      throw new NotFoundException(`QC record for ${sareeId} not found`);
    }
    if (weaverScope && record.weaverId !== weaverScope) {
      throw new ForbiddenException(`QC record for ${sareeId} does not belong to you`);
    }
    return record;
  }

  // Sarees that fully passed QC and have no finishing assignment yet — the
  // "ready for finishing" queue (frontend's ReadySaree list, derived rather
  // than stored per the schema's design). Semi and defective sarees are
  // excluded — only a clean PASSED result may go to finishing.
  async findReadyForFinishing() {
    return this.prisma.qcRecord.findMany({
      where: {
        result: QcResult.PASSED,
        batchSareeRow: { finishingAssignment: null },
      },
      include: {
        batchSareeRow: { include: { design: true, sareeType: true, weaver: true } },
      },
      orderBy: { qcDate: "asc" },
    });
  }
}
