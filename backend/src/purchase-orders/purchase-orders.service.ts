import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { fromGrams, toGrams } from "../common/weight-units.util";
import { Prisma, PurchaseOrderStatus, UserRole } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { NotificationsService } from "../notifications/notifications.service";
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
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreatePurchaseOrderDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${dto.vendorId} not found`);
    }

    // Scoped on vendor.code when present, falling back to the vendor's own
    // (always-unique) id — never to a name-derived slug, which several
    // vendors with similar/identical names (or several with no code) could
    // share, causing their PO numbers to collide/interleave.
    const poNumber = await this.idGenerator.nextScoped("PO", vendor.code ?? vendor.id);

    const po = await this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: dto.vendorId,
        firmId: dto.firmId ?? null,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        totalValue: dto.totalValue ?? 0,
        urgency: dto.urgency,
        createdById: dto.actorId,
        items: dto.items?.length
          ? {
              create: dto.items.map((item) => ({
                materialType: item.materialType,
                name: item.name,
                description: item.description ?? null,
                quantity: item.quantity,
                unit: item.unit ?? "KG",
                unitPrice: item.unitPrice ?? null,
                totalPrice:
                  item.unitPrice !== undefined ? item.quantity * item.unitPrice : null,
              })),
            }
          : undefined,
      },
      include: { vendor: true, items: true, createdBy: { select: { firstName: true, lastName: true } } },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "PURCHASE",
      action: `Created purchase order for ${vendor.name}`,
      entityType: "PurchaseOrder",
      entityId: po.id,
      recordLabel: poNumber,
    });

    // A PO sits at PENDING until superadmin approves it, so raising one is
    // an ask, not just a record.
    await this.notifications.notifyRole(UserRole.SUPERADMIN, "PURCHASE_ORDER_RAISED", {
      purchaseOrderId: po.id,
      poNumber,
      vendorName: vendor.name,
      totalValue: Number(po.totalValue),
      urgency: po.urgency,
      itemCount: po.items.length,
    });

    return po;
  }

  async findAll(
    query: ListPurchaseOrdersQueryDto,
  ) {
    const where: Prisma.PurchaseOrderWhereInput = {
      status: query.status,
      vendorId: query.vendorId,
    };

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: true,
          items: true,
          firm: { select: { id: true, firmName: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          // `items` here too — a PO raised without prices entered stays at
          // ₹0 forever otherwise, even once the real prices actually paid
          // are known from receiving it. The frontend falls back to these
          // once the PO's own line items show ₹0.
          grnReceipt: { include: { receivedBy: { select: { id: true, empId: true, firstName: true, lastName: true } }, items: true, firm: { select: { id: true, firmName: true } } } }
        },
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
      include: {
        vendor: true,
        items: true,
        firm: { select: { id: true, firmName: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        grnReceipt: { include: { receivedBy: { select: { id: true, empId: true, firstName: true, lastName: true } }, items: true, firm: { select: { id: true, firmName: true } } } },
      },
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

    const grnId =
      grnReceipt?.id ??
      (await this.idGenerator.nextScoped("GRN", po.vendor.code ?? po.vendor.id));
    const actualReceivedDate = dto.actualReceivedDate ? new Date(dto.actualReceivedDate) : new Date();

    // The firm is chosen when the order is raised, not when it's received —
    // carry it onto the receipt so Goods Receipt History can show it. Only
    // fills a blank; never overwrites a firm the receiving clerk set.
    if (grnReceipt && po.firmId && !grnReceipt.firmId) {
      await this.prisma.grnReceipt.update({
        where: { id: grnReceipt.id },
        data: { firmId: po.firmId },
      });
    }

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

    // Superadmin has no other reliable way to learn stock arrived — the PO
    // status change alone isn't visible without polling, so push it.
    await this.notifications.notifyRole(UserRole.SUPERADMIN, "po_stock_received", {
      purchaseOrderId: id,
      poNumber: po.poNumber,
      vendorName: updated.vendor.name,
      grnId,
    });

    await this.reportGrnQuantityMismatch(updated, grnReceipt?.id);

    return updated;
  }

  /**
   * Compare what was ordered against what actually turned up, line by line.
   *
   * Only lines the receiving screen explicitly paired (GrnItem.poItemId) are
   * checked — guessing the pairing from materialType + name is exactly what
   * that column exists to avoid, and a wrong guess here would raise a
   * discrepancy alert against a shipment that is fine. Quantities are
   * normalised through grams because a PO line ordered in KG is routinely
   * received in grams.
   */
  private async reportGrnQuantityMismatch(
    po: Prisma.PurchaseOrderGetPayload<{ include: { vendor: true; items: true } }>,
    grnReceiptId?: string,
  ) {
    if (!grnReceiptId) return;

    const grnItems = await this.prisma.grnItem.findMany({
      where: { grnId: grnReceiptId, poItemId: { not: null } },
      select: { poItemId: true, quantity: true, unit: true, rejectedQuantity: true },
    });
    if (grnItems.length === 0) return;

    const receivedByPoItem = new Map<string, number>();
    for (const item of grnItems) {
      // Rejected quantity physically arrived but was refused, so it does not
      // count towards fulfilling the order.
      const netGrams =
        toGrams(Number(item.quantity), item.unit) - toGrams(Number(item.rejectedQuantity), item.unit);
      receivedByPoItem.set(item.poItemId!, (receivedByPoItem.get(item.poItemId!) ?? 0) + netGrams);
    }

    const discrepancies = po.items
      .filter((poItem) => receivedByPoItem.has(poItem.id))
      .map((poItem) => {
        const orderedGrams = toGrams(Number(poItem.quantity), poItem.unit);
        const receivedGrams = receivedByPoItem.get(poItem.id)!;
        return {
          name: poItem.name,
          materialType: poItem.materialType,
          unit: poItem.unit,
          ordered: Number(poItem.quantity),
          received: Number(fromGrams(receivedGrams, poItem.unit).toFixed(3)),
          shortByGrams: Number((orderedGrams - receivedGrams).toFixed(3)),
        };
      })
      // Sub-gram differences are rounding, not a shortage.
      .filter((line) => Math.abs(line.shortByGrams) >= 1);

    if (discrepancies.length === 0) return;

    await this.notifications.notifyRole(UserRole.SUPERADMIN, "GRN_QUANTITY_MISMATCH", {
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      vendorName: po.vendor.name,
      lineCount: discrepancies.length,
      lines: discrepancies,
    });
    await this.notifications.notifyRole(UserRole.ACCOUNTANT, "GRN_QUANTITY_MISMATCH", {
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      vendorName: po.vendor.name,
      lineCount: discrepancies.length,
      lines: discrepancies,
    });
  }

  // Blocked (not cascaded) if a GRN receipt or vendor bill is already linked
  // — those are real financial/stock records and must be cleared explicitly
  // rather than silently disappearing with the PO.
  async remove(id: string, dto?: ActorOnlyDto) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { vendorBills: true },
    });
    if (!po) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }
    if (po.grnReceiptId) {
      throw new BadRequestException(
        "This purchase order already has a GRN receipt linked and can't be deleted.",
      );
    }
    if (po.vendorBills.length > 0) {
      throw new BadRequestException(
        "This purchase order already has vendor bills linked and can't be deleted.",
      );
    }

    await this.prisma.purchaseOrder.delete({ where: { id } });

    await this.auditLog.recordAction({
      actorId: dto?.actorId,
      module: "PURCHASE",
      action: `Deleted purchase order ${po.poNumber}`,
      entityType: "PurchaseOrder",
      entityId: id,
      recordLabel: po.poNumber,
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
