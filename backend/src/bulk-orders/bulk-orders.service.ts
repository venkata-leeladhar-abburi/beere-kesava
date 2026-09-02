import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma, UserRole } from "../generated/prisma/client";
import { IdGeneratorService, businessSegment } from "../id-generator/id-generator.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { ActorOnlyDto } from "./dto/actor-only.dto";
import { CreateBulkOrderDto } from "./dto/create-bulk-order.dto";
import { ListBulkOrdersQueryDto } from "./dto/list-bulk-orders-query.dto";
import { UpdateBulkOrderDto } from "./dto/update-bulk-order.dto";

const ORDER_ID_PREFIX_BASE = "ORD";

const bulkOrderInclude = {
  customer: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.BulkOrderInclude;

@Injectable()
export class BulkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateBulkOrderDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    const ref = await this.idGenerator.nextScoped(
      ORDER_ID_PREFIX_BASE,
      customer.code ?? businessSegment(customer.name, "Customer"),
    );

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
        createdById: dto.actorId,
      },
      include: bulkOrderInclude,
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "BULK_ORDERS",
      action: `Created bulk order ${ref}`,
      entityType: "BulkOrder",
      entityId: ref,
      recordLabel: ref,
    });

    // Both floors need this one: production has to be planned against the
    // due date, and accounts has to bill it.
    const placedPayload = {
      bulkOrderRef: ref,
      customerName: customer.name,
      total: Number(order.total),
      dueDate: order.dueDate,
      designCode: order.designCode,
    };
    await this.notifications.notifyRole(UserRole.ADMIN, "BULK_ORDER_PLACED", placedPayload);
    await this.notifications.notifyRole(UserRole.ACCOUNTANT, "BULK_ORDER_PLACED", placedPayload);

    return order;
  }

  async findAll(
    query: ListBulkOrdersQueryDto,
  ): Promise<
    PaginatedResult<Prisma.BulkOrderGetPayload<{ include: typeof bulkOrderInclude }>>
  > {
    const where: Prisma.BulkOrderWhereInput = {
      status: query.status,
      customerId: query.customerId,
    };

    const [items, total] = await Promise.all([
      this.prisma.bulkOrder.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdDate: "desc" },
        include: bulkOrderInclude,
      }),
      this.prisma.bulkOrder.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(ref: string) {
    const order = await this.prisma.bulkOrder.findUnique({
      where: { ref },
      include: bulkOrderInclude,
    });
    if (!order) {
      throw new NotFoundException(`Bulk order ${ref} not found`);
    }
    return order;
  }

  async update(ref: string, dto: UpdateBulkOrderDto) {
    const existing = await this.findOne(ref);
    const { actorId, ...rest } = dto;
    const updated = await this.prisma.bulkOrder.update({
      where: { ref },
      data: {
        ...rest,
        talliedDate: dto.tallied ? new Date() : undefined,
      },
      include: bulkOrderInclude,
    });

    await this.auditLog.recordAction({
      actorId,
      module: "BULK_ORDERS",
      action: `Updated bulk order ${ref}`,
      entityType: "BulkOrder",
      entityId: ref,
      recordLabel: ref,
    });

    // update() is the generic edit endpoint, so money is picked out of it by
    // comparing against what was there before — a status-only or count-only
    // edit must not announce a payment that never happened.
    const paidBefore = Number(existing.amountPaid);
    const paidNow = Number(updated.amountPaid);
    if (paidNow > paidBefore) {
      await this.notifications.notifyRole(UserRole.ACCOUNTANT, "BULK_ORDER_PAYMENT_RECEIVED", {
        bulkOrderRef: ref,
        customerName: updated.customer.name,
        amount: paidNow - paidBefore,
        amountPaid: paidNow,
        amountDue: Number(updated.amountDue),
        paymentStatus: updated.paymentStatus,
      });
    }

    return updated;
  }

  // Batches, quotations, dispatches, and inventory records are their own
  // real, independent records — deleting the order shouldn't delete them
  // too, just unlink them from an order that no longer exists (their
  // bulkOrderRef FK is nullable for exactly this). Done in one transaction
  // so a failure partway through rolls back rather than leaving some
  // records unlinked and others still pointing at a deleted ref.
  async remove(ref: string, dto?: ActorOnlyDto) {
    await this.findOne(ref);

    await this.prisma.$transaction([
      this.prisma.batchSareeRow.updateMany({ where: { bulkOrderRef: ref }, data: { bulkOrderRef: null } }),
      this.prisma.quotation.updateMany({ where: { bulkOrderRef: ref }, data: { bulkOrderRef: null } }),
      this.prisma.dispatchRecord.updateMany({ where: { bulkOrderRef: ref }, data: { bulkOrderRef: null } }),
      this.prisma.inventoryRecord.updateMany({ where: { bulkOrderRef: ref }, data: { bulkOrderRef: null } }),
      this.prisma.bulkOrder.delete({ where: { ref } }),
    ]);

    await this.auditLog.recordAction({
      actorId: dto?.actorId,
      module: "BULK_ORDERS",
      action: `Deleted bulk order ${ref}`,
      entityType: "BulkOrder",
      entityId: ref,
      recordLabel: ref,
    });
  }
}
