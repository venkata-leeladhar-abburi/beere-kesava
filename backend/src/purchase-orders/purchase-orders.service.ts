import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma, PurchaseOrderStatus } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { ListPurchaseOrdersQueryDto } from "./dto/list-purchase-orders-query.dto";

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreatePurchaseOrderDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${dto.vendorId} not found`);
    }

    const year = new Date().getFullYear();
    const poNumber = await this.idGenerator.nextFormatted(`PO-${year}`);

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: dto.vendorId,
        deliveryDate: dto.deliveryDate,
        totalValue: dto.totalValue,
        urgency: dto.urgency,
      },
    });
  }

  async findAll(
    query: ListPurchaseOrdersQueryDto,
  ): Promise<PaginatedResult<Prisma.PurchaseOrderGetPayload<object>>> {
    const where: Prisma.PurchaseOrderWhereInput = {
      status: query.status,
      vendorId: query.vendorId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }
    return po;
  }

  async approve(id: string) {
    const po = await this.findOne(id);
    this.assertStatus(po.status, PurchaseOrderStatus.PENDING, "approved");
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.APPROVED },
    });
  }

  async reject(id: string) {
    const po = await this.findOne(id);
    this.assertStatus(po.status, PurchaseOrderStatus.PENDING, "rejected");
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.REJECTED },
    });
  }

  async receiveGrn(id: string) {
    const po = await this.findOne(id);
    this.assertStatus(po.status, PurchaseOrderStatus.APPROVED, "received against a GRN");

    const year = new Date().getFullYear();
    const grnId = await this.idGenerator.nextFormatted(`GRN-${year}`);

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.RECEIVED, grnId },
    });
  }

  private assertStatus(
    current: PurchaseOrderStatus,
    required: PurchaseOrderStatus,
    action: string,
  ): void {
    if (current !== required) {
      throw new BadRequestException(
        `Purchase order must be ${required} to be ${action} (currently ${current})`,
      );
    }
  }
}
