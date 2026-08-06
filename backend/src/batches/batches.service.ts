import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { BatchStatus, Prisma, RecipientType } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { ActorOnlyDto } from "./dto/actor-only.dto";
import { AssignBatchRowDto } from "./dto/assign-batch-row.dto";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { ListBatchesQueryDto } from "./dto/list-batches-query.dto";

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

  async findAll(
    query: ListBatchesQueryDto,
  ): Promise<PaginatedResult<Prisma.BatchGetPayload<{ include: { rows: true } }>>> {
    const where: Prisma.BatchWhereInput = { status: query.status };

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

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: { rows: { orderBy: { serial: "asc" } } },
    });
    if (!batch) {
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

    const design = await this.prisma.designLibrary.findUnique({ where: { code: dto.designCode } });
    if (!design) {
      throw new NotFoundException(`Design ${dto.designCode} not found`);
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
