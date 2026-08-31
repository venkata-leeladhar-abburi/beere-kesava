import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DispatchType, InvoiceStatus, OrderPaymentStatus, Prisma, QcResult, ReportFrequency } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { computeNextRunAt, listUpcomingRuns, parseDeliveryTime } from "./report-schedule-timing";

export interface CreateScheduleDto {
  reportName: string;
  frequency: ReportFrequency;
  format?: string;
  /** WhatsApp number the workbook is delivered to. */
  recipientPhone: string;
  /** "HH:mm" in IST. Defaults to 09:00 when absent or unparseable. */
  deliveryTime?: string;
  actorId?: string;
}

export interface UpdateScheduleDto {
  reportName?: string;
  frequency?: ReportFrequency;
  format?: string;
  recipientPhone?: string;
  deliveryTime?: string;
  active?: boolean;
  actorId?: string;
}

/** How many future delivery dates the UI previews per schedule. */
const UPCOMING_RUNS_PREVIEW_COUNT = 5;

export interface RecordDownloadDto {
  reportName: string;
  fileType?: string;
  downloadUrl?: string;
  downloadedById?: string;
  filtersUsed?: Prisma.InputJsonValue;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // "Produced" = QC-passed OR finished via the Raise Quotation receive flow
  // (FinishingAssignment.status RETURNED) — either milestone alone counts a
  // saree as produced. Deduplicated by saree ID since a saree can satisfy
  // both. Single source of truth so every admin-overview metric agrees.
  private async getProducedSareeCount(): Promise<number> {
    const [qcPassedRows, returnedAssignments] = await Promise.all([
      this.prisma.batchSareeRow.findMany({ where: { qcPassed: true }, select: { sareeId: true } }),
      this.prisma.finishingAssignment.findMany({ where: { status: "RETURNED" }, select: { sareeId: true } }),
    ]);
    const producedIds = new Set<string>();
    qcPassedRows.forEach((r) => r.sareeId && producedIds.add(r.sareeId));
    returnedAssignments.forEach((r) => producedIds.add(r.sareeId));
    return producedIds.size;
  }

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
      // invoice.id is the internal UUID FK — invoice.code (e.g.
      // "INV-CUST001-003") is the human-facing id shown everywhere else.
      // Legacy rows predating Invoice.code fall back to the UUID rather
      // than showing blank.
      id: invoice.code ?? invoice.id,
      customerCode: invoice.customer.code ?? invoice.customerId,
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
      customerCode: order.customer.code ?? order.customerId,
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
      this.getProducedSareeCount(),
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

  async getDashboardMetrics() {
    const [
      activeWeavers,
      totalSareesProduced,
      invoiceTotals,
      overdueCount,
      readyForSale,
      dispatchedCount,
    ] = await Promise.all([
      this.prisma.weaver.count({ where: { status: "ACTIVE" } }),
      this.getProducedSareeCount(),
      this.prisma.invoice.aggregate({
        where: { status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] } },
        _sum: { total: true, paid: true },
      }),
      this.prisma.invoice.count({ where: { status: InvoiceStatus.OVERDUE } }),
      this.prisma.batchSareeRow.count({ where: { qcPassed: true } }),
      this.prisma.dispatchRecord.count(),
    ]);

    const totalInvoiced = Number(invoiceTotals._sum.total ?? 0);
    const totalPaid = Number(invoiceTotals._sum.paid ?? 0);

    return {
      activeWeavers,
      totalSareesProduced,
      totalOutstanding: Math.max(0, totalInvoiced - totalPaid),
      overdueCount,
      readyForSale,
      dispatchedCount,
    };
  }

  async getProductionAnalytics() {
    const [
      activeBatchCount,
      activeBatchWeavers,
      activeWeaversTotal,
      activeBatchDesigns,
      designLibraryTotal,
      overdueInvoiceCount,
      invoiceTotals,
      invoicePaymentTotals,
      rawMaterialStockTotal,
      dispatchTotal,
      inStockSareesTotal,
    ] = await Promise.all([
      this.prisma.batch.count({ where: { status: "ACTIVE" } }),
      this.prisma.batchSareeRow.findMany({
        where: { batch: { status: "ACTIVE" }, weaverId: { not: null } },
        select: { weaverId: true },
        distinct: ["weaverId"],
      }),
      this.prisma.weaver.count({ where: { status: "ACTIVE" } }),
      this.prisma.batchSareeRow.findMany({
        where: { designCode: { not: null } },
        select: { designCode: true },
        distinct: ["designCode"],
      }),
      this.prisma.designLibrary.count(),
      this.prisma.invoice.count({ where: { status: InvoiceStatus.OVERDUE } }),
      this.prisma.invoice.aggregate({ _sum: { total: true, paid: true } }),
      this.prisma.invoicePayment.aggregate({ _sum: { amount: true } }),
      this.prisma.rawMaterialStock.aggregate({ _sum: { currentStock: true } }),
      this.prisma.dispatchRecord.count(),
      this.prisma.batchSareeRow.count({ where: { qcPassed: true } }),
    ]);

    const totalInvoiced = Number(invoiceTotals._sum.total ?? 0);
    const totalPaid = Number(invoicePaymentTotals._sum.amount ?? 0);
    const paymentsCollectedPct =
      totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

    const weaversWorking = Math.max(activeBatchWeavers.length, activeWeaversTotal);
    const designCodes = Math.max(activeBatchDesigns.length, designLibraryTotal);
    const rawMaterialStockKg = Number(rawMaterialStockTotal._sum.currentStock ?? 0);

    return {
      activeBatchesCount: activeBatchCount,
      weaversWorkingCount: weaversWorking,
      designCodesCount: designCodes,
      overdueInvoicesCount: overdueInvoiceCount,
      paymentsCollectedPct,
      rawMaterialStockKg,
      dispatchCount: dispatchTotal,
      inStockSareesCount: inStockSareesTotal,
    };
  }

  async listSchedules() {
    const rows = await this.prisma.scheduledReport.findMany({
      orderBy: { createdAt: "desc" },
    });

    // The upcoming dates are derived here rather than in the browser so the
    // calendar the admin reads and the clock the scheduler obeys can never
    // disagree — one implementation, one timezone.
    const now = new Date();
    const items = rows.map((row) => ({
      ...row,
      upcomingRuns: row.active
        ? listUpcomingRuns(
            {
              frequency: row.frequency,
              deliveryHour: row.deliveryHour,
              deliveryMinute: row.deliveryMinute,
              anchor: row.createdAt,
            },
            UPCOMING_RUNS_PREVIEW_COUNT,
            now,
          ).map((date) => date.toISOString())
        : [],
    }));

    return { items };
  }

  /**
   * Dates a not-yet-saved schedule would fire on, for the "when will this
   * arrive?" preview in the Add Schedule form.
   */
  previewUpcomingRuns(frequency: ReportFrequency, deliveryTime?: string, count?: number) {
    if (!Object.values(ReportFrequency).includes(frequency)) {
      throw new BadRequestException(`Unknown report frequency "${frequency}"`);
    }
    const { hour, minute } = parseDeliveryTime(deliveryTime);
    const now = new Date();
    const runs = listUpcomingRuns(
      { frequency, deliveryHour: hour, deliveryMinute: minute, anchor: now },
      Math.min(Math.max(count ?? UPCOMING_RUNS_PREVIEW_COUNT, 1), 12),
      now,
    );
    return { runs: runs.map((date) => date.toISOString()) };
  }

  async createSchedule(dto: CreateScheduleDto) {
    const recipientPhone = normalisePhoneInput(dto.recipientPhone);
    if (!recipientPhone) {
      throw new BadRequestException("A valid 10-digit recipient WhatsApp number is required");
    }

    const { hour, minute } = parseDeliveryTime(dto.deliveryTime);
    const createdAt = new Date();

    const item = await this.prisma.scheduledReport.create({
      data: {
        reportName: dto.reportName,
        frequency: dto.frequency,
        format: dto.format || "XLSX",
        recipientPhone,
        deliveryHour: hour,
        deliveryMinute: minute,
        createdAt,
        // Stored up front so the scheduler never has to guess, and so the
        // first delivery lands at the chosen time rather than on the next
        // poll after creation.
        nextRunAt: computeNextRunAt(
          { frequency: dto.frequency, deliveryHour: hour, deliveryMinute: minute, anchor: createdAt },
          createdAt,
        ),
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

    let recipientPhone: string | undefined;
    if (dto.recipientPhone !== undefined) {
      const cleaned = normalisePhoneInput(dto.recipientPhone);
      if (!cleaned) {
        throw new BadRequestException("A valid 10-digit recipient WhatsApp number is required");
      }
      recipientPhone = cleaned;
    }

    // Any change to frequency or time moves every future delivery, so the
    // stored nextRunAt is recomputed rather than left pointing at a slot the
    // schedule no longer keeps. Resuming a paused schedule does the same:
    // its nextRunAt may be long past, and firing immediately on resume would
    // send a report nobody asked for at that moment.
    const frequency = dto.frequency ?? existing.frequency;
    const { hour, minute } =
      dto.deliveryTime !== undefined
        ? parseDeliveryTime(dto.deliveryTime)
        : { hour: existing.deliveryHour, minute: existing.deliveryMinute };
    const timingChanged =
      frequency !== existing.frequency || hour !== existing.deliveryHour || minute !== existing.deliveryMinute;
    const resumed = dto.active === true && !existing.active;

    const item = await this.prisma.scheduledReport.update({
      where: { id },
      data: {
        reportName: dto.reportName ?? undefined,
        frequency: dto.frequency ?? undefined,
        format: dto.format ?? undefined,
        recipientPhone: recipientPhone ?? undefined,
        deliveryHour: dto.deliveryTime !== undefined ? hour : undefined,
        deliveryMinute: dto.deliveryTime !== undefined ? minute : undefined,
        active: dto.active ?? undefined,
        nextRunAt:
          timingChanged || resumed
            ? computeNextRunAt({
                frequency,
                deliveryHour: hour,
                deliveryMinute: minute,
                anchor: existing.createdAt,
              })
            : undefined,
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

/**
 * Accepts what an admin actually types — spaces, dashes, "+91", a leading 0 —
 * and stores the bare 10-digit number the rest of the app keeps (see
 * AuthService.cleanPhone). Returns null when it cannot be read as one, so the
 * caller can reject rather than persist a number AiSensy will bounce.
 */
function normalisePhoneInput(raw: string | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}
