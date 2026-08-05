import { Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { ListPurchasesQueryDto } from "./dto/list-purchases-query.dto";
import { UpdatePurchaseDto } from "./dto/update-purchase.dto";

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePurchaseDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${dto.supplierId} not found`);
    }
    return this.prisma.purchase.create({
      data: {
        supplierId: dto.supplierId,
        sareeCount: dto.sareeCount,
        gstNumber: dto.gstNumber,
        invoiceNumber: dto.invoiceNumber,
        billAmount: dto.billAmount,
      },
    });
  }

  async findAll(
    query: ListPurchasesQueryDto,
  ): Promise<PaginatedResult<Prisma.PurchaseGetPayload<{ include: { supplier: true } }>>> {
    const where: Prisma.PurchaseWhereInput = {
      supplierId: query.supplierId,
      status: query.status,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { date: "desc" },
        include: { supplier: true },
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: { supplier: true },
    });
    if (!purchase) {
      throw new NotFoundException(`Purchase ${id} not found`);
    }
    return purchase;
  }

  async update(id: string, dto: UpdatePurchaseDto) {
    await this.findOne(id);
    return this.prisma.purchase.update({ where: { id }, data: dto });
  }
}
