import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma, PurchaseOrderStatus } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { ActorOnlyDto } from "./dto/actor-only.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { ListPurchaseOrdersQueryDto } from "./dto/list-purchase-orders-query.dto";
import { ReceiveGrnDto } from "./dto/receive-grn.dto";
import { RejectPurchaseOrderDto } from "./dto/reject-purchase-order.dto";

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreatePurchaseOrderDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${dto.vendorId} not found`);
    }

    const year = new Date().getFullYear();
    const poNumber = await this.idGenerator.nextFormatted(`PO-${year}`);

    const po = await this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: dto.vendorId,
        deliveryDate: dto.deliveryDate,
        totalValue: dto.totalValue ?? 0,
        urgency: dto.urgency,
        items: dto.items?.length
          ? {
              create: dto.items.map((item) => ({
                materialType: item.materialType,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit ?? "KG",
                unitPrice: item.unitPrice ?? null,
                totalPrice:
                  item.unitPrice !== undefined ? item.quantity * item.unitPrice : null,
              })),
            }
          : undefined,
      },
      include: { vendor: true, items: true },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "PURCHASE",
      action: `Created purchase order for ${vendor.name}`,
      entityType: "PurchaseOrder",
      entityId: po.id,
      recordLabel: poNumber,
    });

    return po;
  }

  async findAll(
    query: ListPurchaseOrdersQueryDto,
  ): Promise<PaginatedResult<Prisma.PurchaseOrderGetPayload<{ include: { vendor: true } }>>> {
    const where: Prisma.PurchaseOrderWhereInput = {
      status: query.status,
      vendorId: query.vendorId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        include: { vendor: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { vendor: true },
    });
    if (!po) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }
    return po;
  }

  async approve(id: string, dto: ActorOnlyDto) {
    const po = await this.findOne(id);
    this.assertStatus(po.status, PurchaseOrderStatus.PENDING, "approved");
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.APPROVED },
      include: { vendor: true },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "APPROVALS",
      action: `Approved purchase order ${po.poNumber}`,
      entityType: "PurchaseOrder",
      entityId: id,
      recordLabel: po.poNumber,
      oldValue: PurchaseOrderStatus.PENDING,
      newValue: PurchaseOrderStatus.APPROVED,
    });

    return updated;
  }

  async reject(id: string, dto: RejectPurchaseOrderDto) {
    const po = await this.findOne(id);
    this.assertStatus(po.status, PurchaseOrderStatus.PENDING, "rejected");
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.REJECTED, rejectionReason: dto.reason },
      include: { vendor: true },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "APPROVALS",
      action: `Rejected purchase order ${po.poNumber}`,
      entityType: "PurchaseOrder",
      entityId: id,
      recordLabel: po.poNumber,
      oldValue: PurchaseOrderStatus.PENDING,
      newValue: PurchaseOrderStatus.REJECTED,
    });

    return updated;
  }

  async receiveGrn(id: string, dto: ReceiveGrnDto) {
    const po = await this.findOne(id);
    this.assertStatus(po.status, PurchaseOrderStatus.APPROVED, "received against a GRN");

    // If the receiving clerk already logged the material receipt via
    // POST /materials/grn, link the real GrnReceipt here. Otherwise fall back
    // to a display-only code so existing callers keep working.
    let grnReceipt = null;
    if (dto.grnReceiptId) {
      grnReceipt = await this.prisma.grnReceipt.findUnique({ where: { id: dto.grnReceiptId } });
      if (!grnReceipt) {
        throw new NotFoundException(`GRN receipt ${dto.grnReceiptId} not found`);
      }
    }

    const year = new Date().getFullYear();
    const grnId = grnReceipt?.id ?? (await this.idGenerator.nextFormatted(`GRN-${year}`));
    const actualReceivedDate = dto.actualReceivedDate ? new Date(dto.actualReceivedDate) : new Date();

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.RECEIVED,
        grnId,
        grnReceiptId: grnReceipt?.id,
        actualReceivedDate,
      },
      include: { vendor: true, items: true, grnReceipt: true },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "PURCHASE",
      action: `Received GRN for purchase order ${po.poNumber}`,
      entityType: "PurchaseOrder",
      entityId: id,
      recordLabel: po.poNumber,
      newValue: grnId,
    });

    return updated;
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
