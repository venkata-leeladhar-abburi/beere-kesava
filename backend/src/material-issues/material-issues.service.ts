import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { signatureFileToUrl } from "../common/storage/upload.config";
import { fromGrams, toGrams } from "../common/weight-units.util";
import { MaterialIssueStatus, Prisma } from "../generated/prisma/client";
import { IdGeneratorService, businessSegment, nameSegment } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMaterialIssueDto } from "./dto/create-material-issue.dto";
import { ListMaterialIssuesQueryDto } from "./dto/list-material-issues-query.dto";

const MIR_ID_PREFIX_BASE = "MIR";

// issuedBy trimmed to just name — surfaced on the frontend as "Issued by
// [name]" so every material issue record shows who created it.
const includeItems = {
  // grnItem carries the structured per-line code/description shown on Receive
  // Stock — including it here is what keeps the GRN ids the Issue Material
  // screen displays identical to the ones on the receiving side.
  items: {
    include: {
      grnItem: {
        select: { id: true, itemCode: true, name: true, description: true, quantity: true, unit: true },
      },
    },
  },
  issuedBy: { select: { firstName: true, lastName: true } },
  // The human-facing weaver code (e.g. "Wea-003") — the history table used to
  // print the raw UUID because nothing else was selected here.
  weaver: { select: { code: true, name: true } },
} satisfies Prisma.MaterialIssueRecordInclude;

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

    // Refuse to issue more of a GRN line than it actually has left. Without
    // this the UI's "remaining" figure is advisory only and stock can go
    // negative on the server.
    await this.assertGrnLinesHaveStock(dto.items);

    const issuer = await this.prisma.user.findUnique({ where: { id: dto.issuedById } });
    if (!issuer) {
      throw new NotFoundException(`User ${dto.issuedById} not found`);
    }
    let weaver: { code: string | null; firstName: string } | null = null;
    if (dto.weaverId) {
      weaver = await this.prisma.weaver.findUnique({ where: { id: dto.weaverId } });
      if (!weaver) {
        throw new NotFoundException(`Weaver ${dto.weaverId} not found`);
      }
    }
    let loom: { code: string | null; loomNumber: string } | null = null;
    if (dto.factoryLoomId) {
      loom = await this.prisma.factoryLoom.findUnique({ where: { id: dto.factoryLoomId } });
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
    if (dto.warpRequestId) {
      const warpRequest = await this.prisma.warpRequest.findUnique({ where: { id: dto.warpRequestId } });
      if (!warpRequest) {
        throw new NotFoundException(`Warp request ${dto.warpRequestId} not found`);
      }
      if (warpRequest.status !== "APPROVED") {
        throw new BadRequestException(
          `Warp request ${dto.warpRequestId} is not approved (status: ${warpRequest.status})`,
        );
      }
      if (dto.weaverId && warpRequest.weaverId !== dto.weaverId) {
        throw new BadRequestException(
          `Warp request ${dto.warpRequestId} belongs to a different weaver`,
        );
      }
    }

    const parentCode = weaver
      ? weaver.code ?? nameSegment(weaver.firstName, "Weaver")
      : loom!.code ?? businessSegment(loom!.loomNumber, "Loom");
    const id = await this.idGenerator.nextScoped(MIR_ID_PREFIX_BASE, parentCode);

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
        warpRequestId: dto.warpRequestId,
        items: { create: dto.items },
      },
      include: includeItems,
    });

    // Pulls the request out of the Issue Material page's "Approved Warp
    // Requests" queue now that it's been fulfilled.
    if (dto.warpRequestId) {
      await this.prisma.warpRequest.update({
        where: { id: dto.warpRequestId },
        data: { status: "ISSUED" },
      });
    }

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

    const [items, total] = await Promise.all([
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

  /**
   * Rejects the issuance if any line asks for more than its GRN line has
   * left. Quantities are compared in grams so a line received in kg can be
   * issued in g (or Reels vs Buns) without a false shortfall.
   */
  private async assertGrnLinesHaveStock(
    items: { grnItemId?: string; quantity: number; unit: string }[],
  ): Promise<void> {
    // Several lines of one issuance can draw from the same GRN line — check
    // the combined request, not each line in isolation.
    const requestedGramsByItemId = new Map<string, number>();
    for (const item of items) {
      if (!item.grnItemId) continue;
      const grams = toGrams(Number(item.quantity), item.unit);
      requestedGramsByItemId.set(
        item.grnItemId,
        (requestedGramsByItemId.get(item.grnItemId) ?? 0) + grams,
      );
    }
    if (requestedGramsByItemId.size === 0) return;

    const grnItemIds = [...requestedGramsByItemId.keys()];
    const grnItems = await this.prisma.grnItem.findMany({
      where: { id: { in: grnItemIds } },
      select: { id: true, itemCode: true, quantity: true, rejectedQuantity: true, unit: true },
    });

    const alreadyIssued = await this.prisma.materialIssueItem.findMany({
      where: { grnItemId: { in: grnItemIds }, issue: { status: { not: "CANCELLED" } } },
      select: { grnItemId: true, quantity: true, unit: true },
    });
    const issuedGramsByItemId = new Map<string, number>();
    for (const issued of alreadyIssued) {
      if (!issued.grnItemId) continue;
      issuedGramsByItemId.set(
        issued.grnItemId,
        (issuedGramsByItemId.get(issued.grnItemId) ?? 0) + toGrams(Number(issued.quantity), issued.unit),
      );
    }

    for (const [grnItemId, requestedGrams] of requestedGramsByItemId) {
      const grnItem = grnItems.find((g) => g.id === grnItemId);
      if (!grnItem) {
        throw new NotFoundException(`GRN item ${grnItemId} not found`);
      }
      const receivedGrams = toGrams(
        Number(grnItem.quantity) - Number(grnItem.rejectedQuantity),
        grnItem.unit,
      );
      const availableGrams = receivedGrams - (issuedGramsByItemId.get(grnItemId) ?? 0);
      if (requestedGrams > availableGrams) {
        const label = grnItem.itemCode ?? grnItemId;
        const available = fromGrams(Math.max(0, availableGrams), grnItem.unit);
        const requested = fromGrams(requestedGrams, grnItem.unit);
        throw new BadRequestException(
          `${label} only has ${available} ${grnItem.unit} left — cannot issue ${requested} ${grnItem.unit}.`,
        );
      }
    }
  }
}
