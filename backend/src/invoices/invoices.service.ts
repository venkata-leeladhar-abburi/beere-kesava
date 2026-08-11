import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { InvoiceStatus, Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { ListInvoicesQueryDto } from "./dto/list-invoices-query.dto";

const include = {
  customer: true,
  payments: { orderBy: { date: "desc" } },
} satisfies Prisma.InvoiceInclude;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateInvoiceDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }
    if (dto.dispatchId) {
      const existing = await this.prisma.invoice.findUnique({
        where: { dispatchId: dto.dispatchId },
      });
      if (existing) {
        return this.findOne(existing.id);
      }
    }

    const created = await this.prisma.invoice.create({
      data: {
        customerId: dto.customerId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        dispatchId: dto.dispatchId,
        total: dto.total,
      },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "SALES",
      action: `Created invoice for ${customer.name}`,
      entityType: "Invoice",
      entityId: created.id,
      recordLabel: `INV-${created.id.slice(0, 8).toUpperCase()}`,
      newValue: String(dto.total),
    });

    return this.findOne(created.id);
  }

  async findAll(
    query: ListInvoicesQueryDto,
  ): Promise<PaginatedResult<Prisma.InvoiceGetPayload<{ include: typeof include }>>> {
    const where: Prisma.InvoiceWhereInput = {
      status: query.status,
      customerId: query.customerId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { invoiceDate: "desc" },
        include,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  async recordPayment(invoiceId: string, dto: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException(`Invoice ${invoiceId} is already fully paid`);
    }

    const newPaid = Number(invoice.paid) + dto.amount;
    if (newPaid > Number(invoice.total)) {
      throw new BadRequestException(
        `Payment of ${dto.amount} exceeds the outstanding balance on invoice ${invoiceId}`,
      );
    }
    const newStatus =
      newPaid >= Number(invoice.total) ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

    await this.prisma.$transaction([
      this.prisma.invoicePayment.create({
        data: {
          invoiceId,
          amount: dto.amount,
          utr: dto.utr,
          method: dto.method,
          firmId: dto.firmId,
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { paid: newPaid, status: newStatus },
      }),
    ]);

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "SALES",
      action: `Recorded payment of ${dto.amount} on invoice`,
      entityType: "Invoice",
      entityId: invoiceId,
      recordLabel: `INV-${invoiceId.slice(0, 8).toUpperCase()}`,
      oldValue: String(invoice.paid),
      newValue: String(newPaid),
    });

    return this.findOne(invoiceId);
  }
}
