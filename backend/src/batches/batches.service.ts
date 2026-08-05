import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { BatchStatus, Prisma, RecipientType } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { AssignBatchRowDto } from "./dto/assign-batch-row.dto";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { ListBatchesQueryDto } from "./dto/list-batches-query.dto";

const BATCH_ID_PREFIX = "BATCH";

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateBatchDto) {
    const id = await this.idGenerator.nextFormatted(BATCH_ID_PREFIX);

    return this.prisma.batch.create({
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

    return this.prisma.batchSareeRow.update({
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
  }

  async finalize(id: string) {
    const batch = await this.findOne(id);
    if (batch.status !== BatchStatus.DRAFT) {
      throw new BadRequestException(
        `Batch must be DRAFT to be finalized (currently ${batch.status})`,
      );
    }
    return this.prisma.batch.update({
      where: { id },
      data: { status: BatchStatus.ACTIVE },
      include: { rows: { orderBy: { serial: "asc" } } },
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
