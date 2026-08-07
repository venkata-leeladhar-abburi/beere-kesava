import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma, VendorBillStatus } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVendorBillDto } from "./dto/create-vendor-bill.dto";
import { ListVendorBillsQueryDto } from "./dto/list-vendor-bills-query.dto";

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

    const [items, total] = await this.prisma.$transaction([
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
