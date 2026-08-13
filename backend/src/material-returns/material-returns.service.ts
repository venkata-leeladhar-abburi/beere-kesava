import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { signatureFileToUrl } from "../common/storage/upload.config";
import { fromGrams, toGrams } from "../common/weight-units.util";
import { MaterialReturnStatus, MaterialIssueStatus, Prisma } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMaterialReturnDto } from "./dto/create-material-return.dto";
import { GetOutstandingQueryDto } from "./dto/get-outstanding-query.dto";
import { ListMaterialReturnsQueryDto } from "./dto/list-material-returns-query.dto";

const MRR_ID_PREFIX_BASE = "MRR";

const includeItems = { items: true } satisfies Prisma.MaterialReturnRecordInclude;

export interface OutstandingGroup {
  materialType: string;
  warpSubtype: string | null;
  jariType: string | null;
  jariGrade: string | null;
  jariColor: string | null;
  issuedGrams: number;
  returnedGrams: number;
  outstandingGrams: number;
}

function groupKey(item: { materialType: string; warpSubtype: string | null; jariType: string | null; jariGrade: string | null; jariColor: string | null }): string {
  return [item.materialType, item.warpSubtype, item.jariType, item.jariGrade, item.jariColor].join("|");
}

@Injectable()
export class MaterialReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateMaterialReturnDto) {
    if ((dto.weaverId && dto.factoryLoomId) || (!dto.weaverId && !dto.factoryLoomId)) {
      throw new BadRequestException("Provide exactly one of weaverId or factoryLoomId");
    }

    // Jari is always counted in Reels/Buns, never a weight unit — same rule
    // enforced on issue (see MaterialIssuesService.create).
    for (const item of dto.items) {
      if (item.materialType === "JARI" && !["REEL", "REELS", "BUN", "BUNS"].includes(item.unit.trim().toUpperCase())) {
        throw new BadRequestException(`Jari must be returned in Reels or Buns, not "${item.unit}"`);
      }
    }

    const receiver = await this.prisma.user.findUnique({ where: { id: dto.receivedById } });
    if (!receiver) {
      throw new NotFoundException(`User ${dto.receivedById} not found`);
    }
    if (dto.weaverId) {
      const weaver = await this.prisma.weaver.findUnique({ where: { id: dto.weaverId } });
      if (!weaver) {
        throw new NotFoundException(`Weaver ${dto.weaverId} not found`);
      }
    }
    if (dto.factoryLoomId) {
      const loom = await this.prisma.factoryLoom.findUnique({ where: { id: dto.factoryLoomId } });
      if (!loom) {
        throw new NotFoundException(`Factory loom ${dto.factoryLoomId} not found`);
      }
    }
    if (dto.batchId) {
      const batch = await this.prisma.batch.findUnique({ where: { id: dto.batchId } });
      if (!batch) {
        throw new NotFoundException(`Batch ${dto.batchId} not found`);
      }
    }

    const year = new Date().getFullYear();
    const id = await this.idGenerator.nextFormatted(`${MRR_ID_PREFIX_BASE}-${year}`);

    const record = await this.prisma.materialReturnRecord.create({
      data: {
        id,
        weaverId: dto.weaverId,
        factoryLoomId: dto.factoryLoomId,
        loomNumber: dto.loomNumber ? String(dto.loomNumber) : undefined,
        batchId: dto.batchId,
        receivedById: dto.receivedById,
        signatureMethod: dto.signatureMethod,
        deductionAmount: dto.deductionAmount,
        deductionReason: dto.deductionReason,
        notes: dto.notes,
        items: { create: dto.items },
      },
      include: includeItems,
    });

    // Restore returned material quantities back into RawMaterialStock — the
    // inverse of MaterialIssuesService.create's deduction.
    for (const item of dto.items) {
      const stock = await this.prisma.rawMaterialStock.findFirst({
        where: { materialType: item.materialType },
      });
      if (stock) {
        const stockGrams = toGrams(Number(stock.currentStock), stock.unit);
        const returnedGrams = toGrams(Number(item.quantity), item.unit);
        const newStock = fromGrams(stockGrams + returnedGrams, stock.unit);
        await this.prisma.rawMaterialStock.update({
          where: { id: stock.id },
          data: { currentStock: newStock },
        });
      }
    }

    return record;
  }

  async findAll(
    query: ListMaterialReturnsQueryDto,
  ): Promise<
    PaginatedResult<Prisma.MaterialReturnRecordGetPayload<{ include: typeof includeItems }>>
  > {
    const where: Prisma.MaterialReturnRecordWhereInput = {
      status: query.status,
      weaverId: query.weaverId,
      factoryLoomId: query.factoryLoomId,
      batchId: query.batchId,
    };

    const [items, total] = await Promise.all([
      this.prisma.materialReturnRecord.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { receivedAt: "desc" },
        include: includeItems,
      }),
      this.prisma.materialReturnRecord.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const record = await this.prisma.materialReturnRecord.findUnique({
      where: { id },
      include: includeItems,
    });
    if (!record) {
      throw new NotFoundException(`Material return ${id} not found`);
    }
    return record;
  }

  async sign(id: string, signature: Express.Multer.File) {
    const record = await this.findOne(id);
    if (record.status !== MaterialReturnStatus.PENDING_SIGNATURE) {
      throw new BadRequestException(
        `Material return must be PENDING_SIGNATURE to be signed (currently ${record.status})`,
      );
    }
    const updated = await this.prisma.materialReturnRecord.update({
      where: { id },
      data: {
        status: MaterialReturnStatus.APPROVED,
        signatureCaptured: true,
        signatureTimestamp: new Date(),
        signatureUrl: signatureFileToUrl(signature),
      },
      include: includeItems,
    });

    const recipient = record.weaverId
      ? (await this.prisma.weaver.findUnique({ where: { id: record.weaverId } }))?.name
      : record.factoryLoomId
        ? (await this.prisma.factoryLoom.findUnique({ where: { id: record.factoryLoomId } }))?.loomNumber
        : undefined;

    await this.auditLog.recordAction({
      actorId: record.receivedById,
      module: "MATERIALS",
      action: `Approved return ${id} from ${recipient ?? "recipient"}`,
      entityType: "MaterialReturnRecord",
      entityId: id,
    });

    return updated;
  }

  async cancel(id: string) {
    const record = await this.findOne(id);
    if (record.status === MaterialReturnStatus.APPROVED) {
      throw new BadRequestException("An approved material return cannot be cancelled");
    }
    return this.prisma.materialReturnRecord.update({
      where: { id },
      data: { status: MaterialReturnStatus.CANCELLED },
      include: includeItems,
    });
  }

  // Hard-deletes the record (items cascade) and reverses the stock that was
  // restored on create — mirrors MaterialIssuesService.remove's reversal.
  async remove(id: string) {
    const record = await this.findOne(id);

    for (const item of record.items) {
      const stock = await this.prisma.rawMaterialStock.findFirst({
        where: { materialType: item.materialType },
      });
      if (stock) {
        const stockGrams = toGrams(Number(stock.currentStock), stock.unit);
        const removedGrams = toGrams(Number(item.quantity), item.unit);
        const newStock = fromGrams(Math.max(0, stockGrams - removedGrams), stock.unit);
        await this.prisma.rawMaterialStock.update({
          where: { id: stock.id },
          data: { currentStock: newStock },
        });
      }
    }

    await this.prisma.materialReturnRecord.delete({ where: { id } });
  }

  // Issued (non-cancelled) minus already-approved-returned, grouped by
  // material line, in grams — the real backend counterpart to the frontend's
  // previously-mocked WeaverMaterialSummary calc.
  async getOutstanding(query: GetOutstandingQueryDto): Promise<OutstandingGroup[]> {
    if ((query.weaverId && query.factoryLoomId) || (!query.weaverId && !query.factoryLoomId)) {
      throw new BadRequestException("Provide exactly one of weaverId or factoryLoomId");
    }

    const recipientWhere = query.weaverId ? { weaverId: query.weaverId } : { factoryLoomId: query.factoryLoomId };

    const [issues, returns] = await Promise.all([
      this.prisma.materialIssueRecord.findMany({
        where: { ...recipientWhere, status: { not: MaterialIssueStatus.CANCELLED } },
        include: includeItems,
      }),
      this.prisma.materialReturnRecord.findMany({
        where: { ...recipientWhere, status: MaterialReturnStatus.APPROVED },
        include: includeItems,
      }),
    ]);

    const groups = new Map<string, OutstandingGroup>();

    for (const issue of issues) {
      for (const item of issue.items) {
        const key = groupKey(item);
        const grams = toGrams(Number(item.quantity), item.unit);
        const existing = groups.get(key);
        if (existing) {
          existing.issuedGrams += grams;
        } else {
          groups.set(key, {
            materialType: item.materialType,
            warpSubtype: item.warpSubtype,
            jariType: item.jariType,
            jariGrade: item.jariGrade,
            jariColor: item.jariColor,
            issuedGrams: grams,
            returnedGrams: 0,
            outstandingGrams: 0,
          });
        }
      }
    }

    for (const ret of returns) {
      for (const item of ret.items) {
        const key = groupKey(item);
        const grams = toGrams(Number(item.quantity), item.unit);
        const existing = groups.get(key);
        if (existing) {
          existing.returnedGrams += grams;
        } else {
          groups.set(key, {
            materialType: item.materialType,
            warpSubtype: item.warpSubtype,
            jariType: item.jariType,
            jariGrade: item.jariGrade,
            jariColor: item.jariColor,
            issuedGrams: 0,
            returnedGrams: grams,
            outstandingGrams: 0,
          });
        }
      }
    }

    return Array.from(groups.values())
      .map((g) => ({ ...g, outstandingGrams: g.issuedGrams - g.returnedGrams }))
      .filter((g) => g.outstandingGrams > 0)
      .sort((a, b) => b.outstandingGrams - a.outstandingGrams);
  }
}
