import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { IdGeneratorService, businessSegment } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { CreatePurchaseSareeLineDto } from "./dto/create-purchase-saree-line.dto";
import { ListPurchasesQueryDto } from "./dto/list-purchases-query.dto";
import { UpdatePurchaseDto } from "./dto/update-purchase.dto";

const EXT_PURCHASE_ID_PREFIX = "EXT";

const include = { supplier: true, sareeLines: true } satisfies Prisma.PurchaseInclude;

function lineData(l: CreatePurchaseSareeLineDto, idx: number) {
  const price = l.price;
  const sellPercent = l.sellPercent ?? 0;
  const quantity = l.quantity ?? 1;
  return {
    code: l.code || `LINE-${idx + 1}`,
    weight: l.weight,
    sareeDate: l.date ? new Date(l.date) : undefined,
    sareeType: l.sareeType,
    color: l.color,
    price,
    sellPercent,
    quantity,
    finalAmount: l.finalAmount ?? (price + (price * sellPercent) / 100) * quantity,
    notes: l.notes,
    imageUrl: l.imageUrl,
    returnedQuantity: Math.min(l.returnedQuantity ?? 0, quantity),
  };
}

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreatePurchaseDto) {
    let supplier: { code: string | null; name: string } | null = null;
    if (dto.supplierId) {
      supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
      if (!supplier) {
        throw new NotFoundException(`Supplier ${dto.supplierId} not found`);
      }
    } else if (!dto.supplierName) {
      throw new BadRequestException("Provide either supplierId or supplierName");
    }

    const sareeCount = dto.sareeCount ?? dto.sarees.reduce((sum, l) => sum + (l.quantity ?? 1), 0);
    // Scoped per supplier (registered or not) — an unregistered ("Other,
    // enter manually") supplier still gets its own independent sequence,
    // keyed off its free-text name rather than a real Tier-1 code.
    const supplierSegment = supplier
      ? supplier.code ?? businessSegment(supplier.name, "Supplier")
      : businessSegment(dto.supplierName!, "Supplier");
    const id = await this.idGenerator.nextScoped(EXT_PURCHASE_ID_PREFIX, supplierSegment);

    return this.prisma.purchase.create({
      data: {
        id,
        supplierId: dto.supplierId,
        supplierName: dto.supplierId ? undefined : dto.supplierName,
        location: dto.location,
        date: dto.date ? new Date(dto.date) : undefined,
        sareeCount,
        gstNumber: dto.gstNumber,
        invoiceNumber: dto.invoiceNumber,
        billAmount: dto.billAmount,
        status: dto.status,
        notes: dto.notes,
        invoiceFileName: dto.invoiceFileName,
        addedById: dto.addedById,
        sareeLines: { create: dto.sarees.map((l, idx) => lineData(l, idx)) },
      },
      include,
    });
  }

  async findAll(
    query: ListPurchasesQueryDto,
  ): Promise<PaginatedResult<Prisma.PurchaseGetPayload<{ include: typeof include }>>> {
    const where: Prisma.PurchaseWhereInput = {
      supplierId: query.supplierId,
      status: query.status,
    };

    const [items, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { date: "desc" },
        include,
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findUnique({ where: { id }, include });
    if (!purchase) {
      throw new NotFoundException(`Purchase ${id} not found`);
    }
    return purchase;
  }

  async update(id: string, dto: UpdatePurchaseDto) {
    await this.findOne(id);

    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
      if (!supplier) {
        throw new NotFoundException(`Supplier ${dto.supplierId} not found`);
      }
    }

    const sareeCount = dto.sarees
      ? dto.sarees.reduce((sum, l) => sum + (l.quantity ?? 1), 0)
      : dto.sareeCount;

    return this.prisma.$transaction(async (tx) => {
      if (dto.sarees) {
        // Full-replace: the edit form always resubmits its complete saree
        // table, so the simplest correct semantics is to clear and recreate
        // rather than diff line-by-line.
        await tx.purchaseSareeLine.deleteMany({ where: { purchaseId: id } });
      }
      return tx.purchase.update({
        where: { id },
        data: {
          supplierId: dto.supplierId,
          supplierName: dto.supplierId ? null : dto.supplierName,
          location: dto.location,
          date: dto.date ? new Date(dto.date) : undefined,
          sareeCount,
          gstNumber: dto.gstNumber,
          invoiceNumber: dto.invoiceNumber,
          billAmount: dto.billAmount,
          status: dto.status,
          notes: dto.notes,
          invoiceFileName: dto.invoiceFileName,
          ...(dto.sarees ? { sareeLines: { create: dto.sarees.map((l, idx) => lineData(l, idx)) } } : {}),
        },
        include,
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // sareeLines cascade with the purchase (onDelete: Cascade).
    await this.prisma.purchase.delete({ where: { id } });
  }
}
