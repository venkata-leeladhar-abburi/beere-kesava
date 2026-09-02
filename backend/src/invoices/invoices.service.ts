import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { CustomerType, InvoiceStatus, Prisma, UserRole } from "../generated/prisma/client";
import { IdGeneratorService, businessSegment } from "../id-generator/id-generator.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { ListInvoicesQueryDto } from "./dto/list-invoices-query.dto";

const include = {
  customer: true,
  payments: {
    orderBy: { date: "desc" },
    include: { recordedBy: { select: { id: true, firstName: true, lastName: true, role: true } } },
  },
} satisfies Prisma.InvoiceInclude;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateInvoiceDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }
    if (customer.type !== CustomerType.WHOLESALE) {
      throw new BadRequestException(`Invoices can only be raised for wholesale customers (${customer.name} is retail)`);
    }
    if (dto.dispatchId) {
      const existing = await this.prisma.invoice.findUnique({
        where: { dispatchId: dto.dispatchId },
      });
      if (existing) {
        return this.findOne(existing.id);
      }
    }

    const code = await this.idGenerator.nextScoped("INV", customer.code ?? businessSegment(customer.name, "Customer"));

    const created = await this.prisma.invoice.create({
      data: {
        code,
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
      recordLabel: code,
      newValue: String(dto.total),
    });

    await this.notifications.notifyRole(UserRole.ACCOUNTANT, "INVOICE_CREATED", {
      invoiceId: created.id,
      invoiceNumber: code,
      customerName: customer.name,
      total: Number(dto.total),
      dueDate: created.dueDate,
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

    const [items, total] = await Promise.all([
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
          recordedById: dto.actorId,
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
      recordLabel: invoice.code ?? invoiceId,
      oldValue: String(invoice.paid),
      newValue: String(newPaid),
    });

    // Settling in full is the event people actually wait for, so it is a
    // distinct card rather than another part-payment line in the feed.
    await this.notifications.notifyRole(
      UserRole.ACCOUNTANT,
      newStatus === InvoiceStatus.PAID ? "INVOICE_PAID" : "INVOICE_PAYMENT_RECEIVED",
      {
        invoiceId,
        invoiceNumber: invoice.code,
        amount: dto.amount,
        paid: newPaid,
        total: Number(invoice.total),
        outstanding: Number(invoice.total) - newPaid,
      },
    );

    return this.findOne(invoiceId);
  }
}
