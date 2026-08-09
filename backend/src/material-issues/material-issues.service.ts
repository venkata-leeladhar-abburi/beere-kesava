import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { signatureFileToUrl } from "../common/storage/upload.config";
import { fromGrams, toGrams } from "../common/weight-units.util";
import { MaterialIssueStatus, Prisma } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMaterialIssueDto } from "./dto/create-material-issue.dto";
import { ListMaterialIssuesQueryDto } from "./dto/list-material-issues-query.dto";

const MIR_ID_PREFIX_BASE = "MIR";

const includeItems = { items: true } satisfies Prisma.MaterialIssueRecordInclude;

@Injectable()
export class MaterialIssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateMaterialIssueDto) {
    if ((dto.weaverId && dto.factoryLoomId) || (!dto.weaverId && !dto.factoryLoomId)) {
      throw new BadRequestException("Provide exactly one of weaverId or factoryLoomId");
    }

    // Jari is always counted in Reels/Buns, never a weight unit — grams/kg
    // would silently corrupt the "Issued to Weavers" reel/bun totals.
    for (const item of dto.items) {
      if (item.materialType === "JARI" && !["REEL", "REELS", "BUN", "BUNS"].includes(item.unit.trim().toUpperCase())) {
        throw new BadRequestException(`Jari must be issued in Reels or Buns, not "${item.unit}"`);
      }
    }

    const issuer = await this.prisma.user.findUnique({ where: { id: dto.issuedById } });
    if (!issuer) {
      throw new NotFoundException(`User ${dto.issuedById} not found`);
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
    const id = await this.idGenerator.nextFormatted(`${MIR_ID_PREFIX_BASE}-${year}`);

    const record = await this.prisma.materialIssueRecord.create({
      data: {
        id,
        weaverId: dto.weaverId,
        factoryLoomId: dto.factoryLoomId,
        loomNumber: dto.loomNumber ? String(dto.loomNumber) : undefined,
        batchId: dto.batchId,
        issuedById: dto.issuedById,
        signatureMethod: dto.signatureMethod,
        notes: dto.notes,
        items: { create: dto.items },
      },
      include: includeItems,
    });

    // Deduct issued material quantities from RawMaterialStock
    for (const item of dto.items) {
      const stock = await this.prisma.rawMaterialStock.findFirst({
        where: { materialType: item.materialType },
      });
      if (stock) {
        // Stock and issue-item quantities can be entered in different units
        // (e.g. Jari stock in KG, issued in grams) — always convert through
        // grams before subtracting, never raw quantities.
        const stockGrams = toGrams(Number(stock.currentStock), stock.unit);
        const issuedGrams = toGrams(Number(item.quantity), item.unit);
        const newStockGrams = Math.max(0, stockGrams - issuedGrams);
        const newStock = fromGrams(newStockGrams, stock.unit);
        await this.prisma.rawMaterialStock.update({
          where: { id: stock.id },
          data: { currentStock: newStock },
        });
      }
    }

    return record;
  }

  async findAll(
    query: ListMaterialIssuesQueryDto,
  ): Promise<
    PaginatedResult<Prisma.MaterialIssueRecordGetPayload<{ include: typeof includeItems }>>
  > {
    const where: Prisma.MaterialIssueRecordWhereInput = {
      status: query.status,
      weaverId: query.weaverId,
      batchId: query.batchId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.materialIssueRecord.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { issuedAt: "desc" },
        include: includeItems,
      }),
      this.prisma.materialIssueRecord.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const record = await this.prisma.materialIssueRecord.findUnique({
      where: { id },
      include: includeItems,
    });
    if (!record) {
      throw new NotFoundException(`Material issue ${id} not found`);
    }
    return record;
  }

  async sign(id: string, signature: Express.Multer.File) {
    const record = await this.findOne(id);
    if (record.status !== MaterialIssueStatus.PENDING_SIGNATURE) {
      throw new BadRequestException(
        `Material issue must be PENDING_SIGNATURE to be signed (currently ${record.status})`,
      );
    }
    return this.prisma.materialIssueRecord.update({
      where: { id },
      data: {
        status: MaterialIssueStatus.SIGNED,
        signatureCaptured: true,
        signatureTimestamp: new Date(),
        signatureUrl: signatureFileToUrl(signature),
      },
      include: includeItems,
    });
  }

  async cancel(id: string) {
    const record = await this.findOne(id);
    if (record.status === MaterialIssueStatus.SIGNED) {
      throw new BadRequestException("A signed material issue cannot be cancelled");
    }
    return this.prisma.materialIssueRecord.update({
      where: { id },
      data: { status: MaterialIssueStatus.CANCELLED },
      include: includeItems,
    });
  }

  // Hard-deletes the record (items cascade) and restores the stock that was
  // deducted on create — otherwise deleting a wrong/test issue would leave
  // that material permanently under-counted in RawMaterialStock.
  async remove(id: string) {
    const record = await this.findOne(id);

    for (const item of record.items) {
      const stock = await this.prisma.rawMaterialStock.findFirst({
        where: { materialType: item.materialType },
      });
      if (stock) {
        const stockGrams = toGrams(Number(stock.currentStock), stock.unit);
        const restoredGrams = toGrams(Number(item.quantity), item.unit);
        const newStock = fromGrams(stockGrams + restoredGrams, stock.unit);
        await this.prisma.rawMaterialStock.update({
          where: { id: stock.id },
          data: { currentStock: newStock },
        });
      }
    }

    await this.prisma.materialIssueRecord.delete({ where: { id } });
  }
}
