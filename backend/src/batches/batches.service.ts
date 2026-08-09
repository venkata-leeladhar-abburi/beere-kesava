import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { BatchStatus, Prisma, RecipientType } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { ActorOnlyDto } from "./dto/actor-only.dto";
import { AssignBatchRowDto } from "./dto/assign-batch-row.dto";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { ListBatchesQueryDto } from "./dto/list-batches-query.dto";
import { ReceiveBatchRowDto } from "./dto/receive-batch-row.dto";

const BATCH_ID_PREFIX = "BATCH";

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateBatchDto) {
    const id = await this.idGenerator.nextFormatted(BATCH_ID_PREFIX);

    const batch = await this.prisma.batch.create({
      data: {
        id,
        totalCount: dto.totalCount,
        dueDate: new Date(dto.dueDate),
        rows: {
          // Rows start fully unassigned — matches the real draft-batch
          // workflow, where each row is assigned a recipient/design/type
          // individually afterward via assignRow().
          create: Array.from({ length: dto.totalCount }, (_, i) => ({ serial: i + 1 })),
        },
      },
      include: { rows: { orderBy: { serial: "asc" } } },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "BATCHES",
      action: `Created batch ${batch.id}`,
      entityType: "Batch",
      entityId: batch.id,
      recordLabel: batch.id,
    });

    return batch;
  }

  // `weaverId` is passed by the controller only when the caller's role is
  // WEAVER, forcing results down to batches that have at least one row
  // assigned to that weaver — a WEAVER token must never see other weavers'
  // batch data.
  async findAll(
    query: ListBatchesQueryDto,
    weaverId?: string,
  ): Promise<PaginatedResult<Prisma.BatchGetPayload<{ include: { rows: true } }>>> {
    const where: Prisma.BatchWhereInput = {
      status: query.status,
      ...(weaverId ? { rows: { some: { weaverId } } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.batch.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        include: { rows: { orderBy: { serial: "asc" } } },
      }),
      this.prisma.batch.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string, weaverId?: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: { rows: { orderBy: { serial: "asc" } } },
    });
    if (!batch) {
      throw new NotFoundException(`Batch ${id} not found`);
    }
    if (weaverId && !batch.rows.some((row) => row.weaverId === weaverId)) {
      // A WEAVER token requested a batch with no rows of theirs in it —
      // treat it the same as not found rather than leaking its existence.
      throw new NotFoundException(`Batch ${id} not found`);
    }
    return batch;
  }

  async assignRow(batchId: string, serial: number, dto: AssignBatchRowDto) {
    await this.findOne(batchId);

    const row = await this.prisma.batchSareeRow.findUnique({
      where: { batchId_serial: { batchId, serial } },
    });
    if (!row) {
      throw new NotFoundException(`Row ${serial} not found in batch ${batchId}`);
    }

    if (dto.recipientType === RecipientType.WEAVER) {
      if (!dto.weaverId || dto.factoryLoomId) {
        throw new BadRequestException(
          "recipientType WEAVER requires exactly weaverId (not factoryLoomId)",
        );
      }
    } else if (!dto.factoryLoomId || dto.weaverId) {
      throw new BadRequestException(
        "recipientType FACTORY_LOOM requires exactly factoryLoomId (not weaverId)",
      );
    }

    if (dto.designCode) {
      const design = await this.prisma.designLibrary.findUnique({ where: { code: dto.designCode } });
      if (!design) {
        throw new NotFoundException(`Design ${dto.designCode} not found`);
      }
    }
    const sareeType = await this.prisma.sareeTypeRate.findUnique({
      where: { code: dto.sareeTypeCode },
    });
    if (!sareeType) {
      throw new NotFoundException(`Saree type ${dto.sareeTypeCode} not found`);
    }

    const sareeId = await this.buildSareeId(dto, serial);

    const updatedRow = await this.prisma.batchSareeRow.update({
      where: { batchId_serial: { batchId, serial } },
      data: {
        sareeId,
        recipientType: dto.recipientType,
        weaverId: dto.weaverId,
        factoryLoomId: dto.factoryLoomId,
        designCode: dto.designCode,
        sareeTypeCode: dto.sareeTypeCode,
        bulkOrderRef: dto.bulkOrderRef,
      },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "BATCHES",
      action: `Assigned row ${serial} of batch ${batchId} to ${sareeId}`,
      entityType: "BatchSareeRow",
      entityId: `${batchId}-${serial}`,
      recordLabel: sareeId,
    });

    return updatedRow;
  }

  async receiveRow(batchId: string, serial: number, dto: ReceiveBatchRowDto) {
    await this.findOne(batchId);

    const row = await this.prisma.batchSareeRow.findUnique({
      where: { batchId_serial: { batchId, serial } },
    });
    if (!row) {
      throw new NotFoundException(`Row ${serial} not found in batch ${batchId}`);
    }
    if (!row.sareeId) {
      throw new BadRequestException(`Row ${serial} of batch ${batchId} has not been assigned yet`);
    }
    if (row.receivedAt) {
      throw new ConflictException(`Row ${serial} of batch ${batchId} was already received`);
    }

    const updatedRow = await this.prisma.batchSareeRow.update({
      where: { batchId_serial: { batchId, serial } },
      data: {
        receivedAt: new Date(),
        receivedWeight: dto.weight,
        receivedColor: dto.color,
        receivedPhotoUrl: dto.photoUrl,
      },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "BATCHES",
      action: `Received saree ${row.sareeId} (row ${serial} of batch ${batchId})`,
      entityType: "BatchSareeRow",
      entityId: `${batchId}-${serial}`,
      recordLabel: row.sareeId,
    });

    return updatedRow;
  }

  async finalize(id: string, dto?: ActorOnlyDto) {
    const batch = await this.findOne(id);
    if (batch.status !== BatchStatus.DRAFT) {
      throw new BadRequestException(
        `Batch must be DRAFT to be finalized (currently ${batch.status})`,
      );
    }
    const updated = await this.prisma.batch.update({
      where: { id },
      data: { status: BatchStatus.ACTIVE },
      include: { rows: { orderBy: { serial: "asc" } } },
    });

    await this.auditLog.recordAction({
      actorId: dto?.actorId,
      module: "BATCHES",
      action: `Finalized batch ${id}`,
      entityType: "Batch",
      entityId: id,
      recordLabel: id,
      oldValue: BatchStatus.DRAFT,
      newValue: BatchStatus.ACTIVE,
    });

    return updated;
  }

  // Deletes a batch and every record hanging off it, so re-creating a batch
  // from scratch doesn't get blocked by leftover QC/finishing/material/
  // inventory rows from a previous run. BatchSareeRow itself cascades with
  // the batch automatically; everything else here has a Restrict FK to
  // either the batch or one of its saree rows, so it must be cleared
  // explicitly (in one transaction, so a failure partway through rolls back
  // rather than leaving orphaned records).
  async remove(id: string, dto?: ActorOnlyDto) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: { rows: { select: { sareeId: true } } },
    });
    if (!batch) {
      throw new NotFoundException(`Batch ${id} not found`);
    }
    const sareeIds = batch.rows.map((r) => r.sareeId).filter((s): s is string => !!s);

    await this.prisma.$transaction([
      this.prisma.finishingAssignment.deleteMany({ where: { sareeId: { in: sareeIds } } }),
      this.prisma.qcRecord.deleteMany({
        where: { OR: [{ batchId: id }, { sareeId: { in: sareeIds } }] },
      }),
      this.prisma.materialIssueRecord.deleteMany({ where: { batchId: id } }),
      this.prisma.inventoryRecord.deleteMany({
        where: { OR: [{ batchId: id }, { sareeId: { in: sareeIds } }] },
      }),
      this.prisma.saree.deleteMany({ where: { batchId: id } }),
      this.prisma.batch.delete({ where: { id } }),
    ]);

    await this.auditLog.recordAction({
      actorId: dto?.actorId,
      module: "BATCHES",
      action: `Deleted batch ${id} and its associated QC/finishing/material/inventory records`,
      entityType: "Batch",
      entityId: id,
      recordLabel: id,
    });
  }

  // Matches the frontend's generateSareeId(weaverName, loom, seq) convention:
  // weaver -> {FIRSTNAME}-L{loom}-{seq3}; factory loom -> {loomNumber}-{seq3}.
  private async buildSareeId(dto: AssignBatchRowDto, serial: number): Promise<string> {
    const seq3 = String(serial).padStart(3, "0");

    if (dto.recipientType === RecipientType.WEAVER) {
      const weaver = await this.prisma.weaver.findUnique({ where: { id: dto.weaverId } });
      if (!weaver) {
        throw new NotFoundException(`Weaver ${dto.weaverId} not found`);
      }
      const loomNumber = dto.loomNumber ?? 1;
      return `${weaver.firstName.toUpperCase()}-L${loomNumber}-${seq3}`;
    }

    const factoryLoom = await this.prisma.factoryLoom.findUnique({
      where: { id: dto.factoryLoomId },
    });
    if (!factoryLoom) {
      throw new NotFoundException(`Factory loom ${dto.factoryLoomId} not found`);
    }
    return `${factoryLoom.loomNumber}-${seq3}`;
  }
}
