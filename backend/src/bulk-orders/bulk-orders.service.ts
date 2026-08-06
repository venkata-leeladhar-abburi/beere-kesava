import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBulkOrderDto } from "./dto/create-bulk-order.dto";
import { ListBulkOrdersQueryDto } from "./dto/list-bulk-orders-query.dto";
import { UpdateBulkOrderDto } from "./dto/update-bulk-order.dto";

const ORDER_ID_PREFIX_BASE = "ORD";

@Injectable()
export class BulkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateBulkOrderDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    const year = new Date().getFullYear();
    const ref = await this.idGenerator.nextFormatted(`${ORDER_ID_PREFIX_BASE}-${year}`);

    const order = await this.prisma.bulkOrder.create({
      data: {
        ref,
        customerId: dto.customerId,
        dueDate: new Date(dto.dueDate),
        sareeTypeCode: dto.sareeTypeCode,
        designCode: dto.designCode,
        total: dto.total,
        amountDue: dto.amountDue,
        gstCode: dto.gstCode,
        address: dto.address,
        phone: dto.phone,
        visitingCardUrl: dto.visitingCardUrl,
        photoUrls: dto.photoUrls ?? [],
      },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "BULK_ORDERS",
      action: `Created bulk order ${ref}`,
      entityType: "BulkOrder",
      entityId: ref,
      recordLabel: ref,
    });

    return order;
  }

  async findAll(
    query: ListBulkOrdersQueryDto,
  ): Promise<PaginatedResult<Prisma.BulkOrderGetPayload<{ include: { customer: true } }>>> {
    const where: Prisma.BulkOrderWhereInput = {
      status: query.status,
      customerId: query.customerId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.bulkOrder.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdDate: "desc" },
        include: { customer: true },
      }),
      this.prisma.bulkOrder.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(ref: string) {
    const order = await this.prisma.bulkOrder.findUnique({
      where: { ref },
      include: { customer: true },
    });
    if (!order) {
      throw new NotFoundException(`Bulk order ${ref} not found`);
    }
    return order;
  }

  async update(ref: string, dto: UpdateBulkOrderDto) {
    await this.findOne(ref);
    const { actorId, ...rest } = dto;
    const updated = await this.prisma.bulkOrder.update({
      where: { ref },
      data: {
        ...rest,
        talliedDate: dto.tallied ? new Date() : undefined,
      },
      include: { customer: true },
    });

    await this.auditLog.recordAction({
      actorId,
      module: "BULK_ORDERS",
      action: `Updated bulk order ${ref}`,
      entityType: "BulkOrder",
      entityId: ref,
      recordLabel: ref,
    });

    return updated;
  }
}
