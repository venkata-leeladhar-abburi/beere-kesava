import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { FinishingAssignmentStatus, Prisma, QcResult } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFinishingAssignmentDto } from "./dto/create-finishing-assignment.dto";
import { ListFinishingAssignmentsQueryDto } from "./dto/list-finishing-assignments-query.dto";
import { ReceiveFinishingReturnDto } from "./dto/receive-finishing-return.dto";

const include = {
  batchSareeRow: { include: { design: true, weaver: true, qcRecord: { select: { result: true } } } },
  finishingStaff: true,
} satisfies Prisma.FinishingAssignmentInclude;

@Injectable()
export class FinishingAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // Bulk-assigns one or more QC-passed sarees to a finishing staff member —
  // mirrors the frontend's "assign selected sarees" flow.
  async create(dto: CreateFinishingAssignmentDto) {
    const staff = await this.prisma.finishingStaff.findUnique({
      where: { id: dto.finishingStaffId },
    });
    if (!staff) {
      throw new NotFoundException(`Finishing staff ${dto.finishingStaffId} not found`);
    }
    const assigner = await this.prisma.user.findUnique({ where: { id: dto.assignedById } });
    if (!assigner) {
      throw new NotFoundException(`User ${dto.assignedById} not found`);
    }

    const rows = await this.prisma.batchSareeRow.findMany({
      where: { sareeId: { in: dto.sareeIds } },
      include: { qcRecord: true, finishingAssignment: true },
    });
    const foundIds = new Set(rows.map((r) => r.sareeId));
    const missing = dto.sareeIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Saree(s) not found: ${missing.join(", ")}`);
    }
    for (const row of rows) {
      if (!row.qcRecord || row.qcRecord.result !== QcResult.PASSED) {
        throw new BadRequestException(`Saree ${row.sareeId} has not passed QC`);
      }
      if (row.finishingAssignment) {
        throw new BadRequestException(`Saree ${row.sareeId} is already assigned to finishing`);
      }
    }

    await this.prisma.finishingAssignment.createMany({
      data: rows.map((row) => ({
        sareeId: row.sareeId!,
        designCode: row.designCode,
        sareeType: row.sareeTypeCode,
        finishingStaffId: dto.finishingStaffId,
        assignedById: dto.assignedById,
        quotationRef: dto.quotationRef,
      })),
    });

    const created = await this.prisma.finishingAssignment.findMany({
      where: { sareeId: { in: dto.sareeIds } },
      include,
    });

    await this.auditLog.recordAction({
      actorId: dto.assignedById,
      module: "FINISHING",
      action: `Assigned ${dto.sareeIds.length} saree(s) to finishing staff ${dto.finishingStaffId}`,
      entityType: "FinishingAssignment",
      entityId: dto.sareeIds.join(","),
      recordLabel: dto.sareeIds.join(", "),
    });

    return created;
  }

  async findAll(
    query: ListFinishingAssignmentsQueryDto,
  ): Promise<PaginatedResult<Prisma.FinishingAssignmentGetPayload<{ include: typeof include }>>> {
    const where: Prisma.FinishingAssignmentWhereInput = {
      status: query.status,
      finishingStaffId: query.finishingStaffId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.finishingAssignment.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { assignedDate: "desc" },
        include,
      }),
      this.prisma.finishingAssignment.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const assignment = await this.prisma.finishingAssignment.findUnique({
      where: { id },
      include,
    });
    if (!assignment) {
      throw new NotFoundException(`Finishing assignment ${id} not found`);
    }
    return assignment;
  }

  // Records the saree's return from finishing (perfect or damaged) — merges
  // the frontend's separate FinishingReturn concept onto this row, per the
  // schema's design (see project memory for the rationale).
  async receiveReturn(id: string, dto: ReceiveFinishingReturnDto) {
    const assignment = await this.findOne(id);
    if (assignment.status !== FinishingAssignmentStatus.AWAITING_RETURN) {
      throw new BadRequestException(
        `Assignment must be AWAITING_RETURN to record a return (currently ${assignment.status})`,
      );
    }

    // Feeds the Phase 5 inventory queue: a returned saree becomes dispatch-ready
    // (or flagged for review if damaged) — mirrors the frontend's InventoryRecord
    // derivation from FinishingReturn.
    await this.prisma.inventoryRecord.upsert({
      where: { sareeId: assignment.sareeId },
      create: {
        sareeId: assignment.sareeId,
        status:
          dto.condition === "DAMAGED" ? "DAMAGED_REVIEW_NEEDED" : "FINISHING_COMPLETE",
        rawType: "RETURN",
        batchId: assignment.batchSareeRow.batchId,
        quotationRef: assignment.quotationRef,
      },
      update: {
        status:
          dto.condition === "DAMAGED" ? "DAMAGED_REVIEW_NEEDED" : "FINISHING_COMPLETE",
      },
    });

    const updated = await this.prisma.finishingAssignment.update({
      where: { id },
      data: {
        status: FinishingAssignmentStatus.RETURNED,
        condition: dto.condition,
        damageType: dto.damageType,
        damageSeverity: dto.damageSeverity,
        damageNotes: dto.damageNotes,
        damagePhotoUrl: dto.damagePhotoUrl,
      },
      include,
    });

    // This saree may have been received from the generic "Receive Back"
    // queue rather than the quotation-specific one — either path must keep
    // the quotation's own tracking in sync, or its status/received-count
    // goes stale even though the saree is genuinely back.
    if (assignment.quotationRef) {
      await this.prisma.quotationSaree.updateMany({
        where: { quotationId: assignment.quotationRef, sareeId: assignment.sareeId },
        data: { finishingStatus: "RECEIVED" },
      });
      const remaining = await this.prisma.quotationSaree.count({
        where: { quotationId: assignment.quotationRef, finishingStatus: { not: "RECEIVED" } },
      });
      await this.prisma.quotation.update({
        where: { id: assignment.quotationRef },
        data: { status: remaining === 0 ? "RECEIVED" : "PARTIALLY_RECEIVED" },
      });
    }

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "FINISHING",
      action: `Recorded finishing return for saree ${assignment.sareeId} (${dto.condition})`,
      entityType: "FinishingAssignment",
      entityId: id,
      recordLabel: assignment.sareeId,
      oldValue: FinishingAssignmentStatus.AWAITING_RETURN,
      newValue: FinishingAssignmentStatus.RETURNED,
    });

    return updated;
  }
}
