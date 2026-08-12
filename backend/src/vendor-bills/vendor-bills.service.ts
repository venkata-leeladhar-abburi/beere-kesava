import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma, VendorBillStatus } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVendorBillDto } from "./dto/create-vendor-bill.dto";
import { ListVendorBillsQueryDto } from "./dto/list-vendor-bills-query.dto";
import { UpdateVendorBillDto } from "./dto/update-vendor-bill.dto";

@Injectable()
export class VendorBillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateVendorBillDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${dto.vendorId} not found`);
    }

    if (dto.poId) {
      const po = await this.prisma.purchaseOrder.findUnique({ where: { id: dto.poId } });
      if (!po) {
        throw new NotFoundException(`Purchase order ${dto.poId} not found`);
      }
    }

    const bill = await this.prisma.vendorBill.create({
      data: {
        vendorId: dto.vendorId,
        poId: dto.poId,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        description: dto.description,
      },
      include: { vendor: true, purchaseOrder: true },
    });

    if (dto.poId && dto.materialAmounts?.length) {
      await this.applyMaterialAmounts(dto.poId, dto.materialAmounts);
    }

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "PAYMENTS",
      action: `Raised bill of ${dto.amount} for vendor ${vendor.name}`,
      entityType: "VendorBill",
      entityId: bill.id,
      recordLabel: vendor.name,
      newValue: String(dto.amount),
    });

    return bill;
  }

  // Entry aid only (see CreateVendorBillDto.materialAmounts) — validates
  // each item actually belongs to this PO before writing, so a bad itemId
  // can't silently touch some other PO's line.
  private async applyMaterialAmounts(
    poId: string,
    materialAmounts: { itemId: string; amount: number }[],
  ): Promise<void> {
    const items = await this.prisma.purchaseOrderItem.findMany({
      where: { id: { in: materialAmounts.map((m) => m.itemId) }, purchaseOrderId: poId },
      select: { id: true },
    });
    const validIds = new Set(items.map((i) => i.id));

    await this.prisma.$transaction(
      materialAmounts
        .filter((m) => validIds.has(m.itemId))
        .map((m) =>
          this.prisma.purchaseOrderItem.update({
            where: { id: m.itemId },
            data: { invoicedAmount: m.amount },
          }),
        ),
    );
  }

  async findAll(
    query: ListVendorBillsQueryDto,
  ): Promise<
    PaginatedResult<
      Prisma.VendorBillGetPayload<{ include: { vendor: true; purchaseOrder: true } }>
    >
  > {
    const where: Prisma.VendorBillWhereInput = {
      vendorId: query.vendorId,
      status: query.status,
    };

    const [items, total] = await Promise.all([
      this.prisma.vendorBill.findMany({
        where,
        include: { vendor: true, purchaseOrder: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.vendorBill.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const bill = await this.prisma.vendorBill.findUnique({
      where: { id },
      include: { vendor: true, purchaseOrder: true, payments: true },
    });
    if (!bill) {
      throw new NotFoundException(`Vendor bill ${id} not found`);
    }
    return bill;
  }

  // Edits the one bill already raised against a PO, rather than the caller
  // creating a second bill for the same PO — the admin's "invoice amount"
  // for a PO is meant to be a single, correctable figure. Re-derives status
  // afterward since changing the amount can flip PAID/PARTIAL either way.
  async update(id: string, dto: UpdateVendorBillDto) {
    const existing = await this.findOne(id);
    const { actorId, ...data } = dto;

    const updated = await this.prisma.vendorBill.update({
      where: { id },
      data: {
        amount: data.amount,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        description: data.description,
      },
      include: { vendor: true, purchaseOrder: true },
    });

    if (existing.poId && data.materialAmounts?.length) {
      await this.applyMaterialAmounts(existing.poId, data.materialAmounts);
    }

    await this.recomputeStatus(id);

    await this.auditLog.recordAction({
      actorId,
      module: "PAYMENTS",
      action: `Updated bill for vendor ${existing.vendor.name}`,
      entityType: "VendorBill",
      entityId: id,
      recordLabel: existing.vendor.name,
      oldValue: String(existing.amount),
      newValue: data.amount !== undefined ? String(data.amount) : undefined,
    });

    return this.findOne(updated.id);
  }

  /**
   * Derives and persists a bill's status from the sum of payments linked to
   * it vs its amount. There is no manual status-set endpoint — this is the
   * single source of truth, called whenever a payment against a bill is
   * created. OVERDUE is reserved for bills still unpaid past their due date.
   */
  async recomputeStatus(billId: string): Promise<void> {
    const bill = await this.prisma.vendorBill.findUnique({ where: { id: billId } });
    if (!bill) {
      throw new NotFoundException(`Vendor bill ${billId} not found`);
    }

    const paidAggregate = await this.prisma.vendorPayment.aggregate({
      where: { billId },
      _sum: { amount: true },
    });
    const paidTotal = Number(paidAggregate._sum.amount || 0);
    const billAmount = Number(bill.amount);

    let status: VendorBillStatus;
    if (paidTotal >= billAmount) {
      status = VendorBillStatus.PAID;
    } else if (paidTotal > 0) {
      status = VendorBillStatus.PARTIAL;
    } else if (bill.dueDate && bill.dueDate.getTime() < Date.now()) {
      status = VendorBillStatus.OVERDUE;
    } else {
      status = VendorBillStatus.PENDING;
    }

    if (status !== bill.status) {
      await this.prisma.vendorBill.update({ where: { id: billId }, data: { status } });
    }
  }
}
