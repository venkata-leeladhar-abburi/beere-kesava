import { Injectable, NotFoundException } from "@nestjs/common";
import { DispatchType, InvoiceStatus, OrderPaymentStatus, QcResult, ReportFrequency } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";

export interface CreateScheduleDto {
  reportName: string;
  frequency: ReportFrequency;
  format?: string;
  recipientEmail: string;
  actorId?: string;
}

export interface UpdateScheduleDto {
  reportName?: string;
  frequency?: ReportFrequency;
  format?: string;
  recipientEmail?: string;
  active?: boolean;
  actorId?: string;
}

export interface RecordDownloadDto {
  reportName: string;
  fileType?: string;
  downloadUrl?: string;
  downloadedById?: string;
  filtersUsed?: any;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async getOutstandingPayments() {
    const [invoices, bulkOrders] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] } },
        include: { customer: true },
        orderBy: { dueDate: "asc" },
      }),
      this.prisma.bulkOrder.findMany({
        where: { paymentStatus: { in: [OrderPaymentStatus.PENDING, OrderPaymentStatus.PARTIAL] } },
        include: { customer: true },
        orderBy: { dueDate: "asc" },
      }),
    ]);

    const invoiceRows = invoices.map((invoice) => ({
      source: "invoice" as const,
      id: invoice.id,
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      dueDate: invoice.dueDate ?? invoice.invoiceDate,
      total: Number(invoice.total),
      paid: Number(invoice.paid),
      outstanding: Number(invoice.total) - Number(invoice.paid),
      status: invoice.status,
    }));

    const bulkOrderRows = bulkOrders.map((order) => ({
      source: "bulk_order" as const,
      id: order.ref,
      customerId: order.customerId,
      customerName: order.customer.name,
      dueDate: order.dueDate,
      total: Number(order.amountDue),
      paid: Number(order.amountPaid),
      outstanding: Number(order.amountDue) - Number(order.amountPaid),
      status: order.paymentStatus,
    }));

    const rows = [...invoiceRows, ...bulkOrderRows].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    );

    return {
      items: rows,
      totalOutstanding: rows.reduce((sum, row) => sum + row.outstanding, 0),
      count: rows.length,
    };
  }

  async getProductionSummary() {
    const [totalSarees, qcCounts, finishingCounts] = await Promise.all([
      this.prisma.batchSareeRow.count({ where: { sareeId: { not: null } } }),
      this.prisma.qcRecord.groupBy({ by: ["result"], _count: { _all: true } }),
      this.prisma.finishingAssignment.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const qcByResult: Record<QcResult, number> = {
      [QcResult.PASSED]: 0,
      [QcResult.SEMI]: 0,
      [QcResult.DEFECTIVE]: 0,
    };
    for (const row of qcCounts) {
      qcByResult[row.result] = row._count._all;
    }

    return {
      totalSareesProduced: totalSarees,
      qcByResult,
      finishingByStatus: Object.fromEntries(
        finishingCounts.map((row) => [row.status, row._count._all]),
      ),
    };
  }

  async getSalesSummary() {
    const [retailAgg, wholesaleAgg] = await Promise.all([
      this.prisma.saleRecord.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
      this.prisma.dispatchRecord.aggregate({
        where: { type: DispatchType.WHOLESALE },
        _sum: { grandTotal: true },
        _count: { _all: true },
      }),
    ]);

    return {
      retail: {
        totalSales: Number(retailAgg._sum.amount ?? 0),
        count: retailAgg._count._all,
      },
      wholesale: {
        totalSales: Number(wholesaleAgg._sum.grandTotal ?? 0),
        count: wholesaleAgg._count._all,
      },
    };
  }

  // Scheduled Reports
  async listSchedules() {
    const items = await this.prisma.scheduledReport.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { items };
  }

  async createSchedule(dto: CreateScheduleDto) {
    const item = await this.prisma.scheduledReport.create({
      data: {
        reportName: dto.reportName,
        frequency: dto.frequency,
        format: dto.format || "PDF",
        recipientEmail: dto.recipientEmail,
      },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "REPORTS",
      action: `Created scheduled report "${item.reportName}" (${item.frequency})`,
      entityType: "ScheduledReport",
      entityId: item.id,
      recordLabel: item.reportName,
    });

    return item;
  }

  async updateSchedule(id: string, dto: UpdateScheduleDto) {
    const existing = await this.prisma.scheduledReport.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Scheduled report ${id} not found`);
    }

    const item = await this.prisma.scheduledReport.update({
      where: { id },
      data: {
        reportName: dto.reportName ?? undefined,
        frequency: dto.frequency ?? undefined,
        format: dto.format ?? undefined,
        recipientEmail: dto.recipientEmail ?? undefined,
        active: dto.active ?? undefined,
      },
    });

    const action =
      dto.active !== undefined && dto.active !== existing.active
        ? `${dto.active ? "Resumed" : "Paused"} scheduled report "${item.reportName}"`
        : `Updated scheduled report "${item.reportName}"`;

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "REPORTS",
      action,
      entityType: "ScheduledReport",
      entityId: item.id,
      recordLabel: item.reportName,
      oldValue: String(existing.active),
      newValue: String(item.active),
    });

    return item;
  }

  async deleteSchedule(id: string, actorId?: string) {
    const existing = await this.prisma.scheduledReport.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Scheduled report ${id} not found`);
    }

    await this.prisma.scheduledReport.delete({ where: { id } });

    await this.auditLog.recordAction({
      actorId,
      module: "REPORTS",
      action: `Deleted scheduled report "${existing.reportName}"`,
      entityType: "ScheduledReport",
      entityId: existing.id,
      recordLabel: existing.reportName,
      oldValue: existing.reportName,
      newValue: null,
    });

    return { success: true };
  }

  // Report Download History
  async listHistory(take?: number, skip?: number) {
    const [items, total] = await Promise.all([
      this.prisma.reportDownloadHistory.findMany({
        include: { downloadedBy: true },
        orderBy: { downloadedAt: "desc" },
        take: take ?? undefined,
        skip: skip ?? undefined,
      }),
      this.prisma.reportDownloadHistory.count(),
    ]);
    return { items, total };
  }

  async recordDownload(dto: RecordDownloadDto) {
    const item = await this.prisma.reportDownloadHistory.create({
      data: {
        reportName: dto.reportName,
        fileType: dto.fileType || "PDF",
        downloadUrl: dto.downloadUrl || null,
        downloadedById: dto.downloadedById || null,
        filtersUsed: dto.filtersUsed || undefined,
      },
    });
    return item;
  }
}
