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
        // dispatch.dispatchedBy and dispatch.sarees are the only source an
        // Invoice has for "who raised this" and "how many sarees it covers"
        // — Invoice itself carries neither.
        include: { customer: true, dispatch: { include: { dispatchedBy: true, sarees: true } } },
        orderBy: { dueDate: "asc" },
      }),
      this.prisma.bulkOrder.findMany({
        where: { paymentStatus: { in: [OrderPaymentStatus.PENDING, OrderPaymentStatus.PARTIAL] } },
        include: { customer: true, createdBy: true },
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
      // Who: the wholesale dispatch this invoice was raised for — an
      // invoice with no linked dispatch (raised standalone) has no actor
      // recorded anywhere in the schema, so this is "—" rather than a guess.
      raisedBy: invoice.dispatch?.dispatchedBy
        ? `${invoice.dispatch.dispatchedBy.firstName} ${invoice.dispatch.dispatchedBy.lastName}`.trim()
        : "—",
      // At what time: when the invoice itself was actually raised, not the
      // due date (dueDate stays below — a payment deadline, not a "when").
      raisedAt: invoice.invoiceDate,
      dueDate: invoice.dueDate ?? invoice.invoiceDate,
      // How many: sarees covered by this invoice's dispatch, when there is one.
      quantity: invoice.dispatch?.sarees.length ?? null,
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
      raisedBy: order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}`.trim() : "—",
      raisedAt: order.createdDate,
      dueDate: order.dueDate,
      quantity: order.total,
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
    const [totalSarees, qcCounts, finishingCounts, sarees] = await Promise.all([
      this.getProducedSareeCount(),
      this.prisma.qcRecord.groupBy({ by: ["result"], _count: { _all: true } }),
      this.prisma.finishingAssignment.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.saree.findMany({
        include: { weaver: true, factoryLoom: true, design: true, sareeType: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const qcByResult: Record<QcResult, number> = {
      [QcResult.PASSED]: 0,
      [QcResult.SEMI]: 0,
      [QcResult.DEFECTIVE]: 0,
    };
    for (const row of qcCounts) {
      qcByResult[row.result] = row._count._all;
    }

    // Every produced saree, full record — foreign keys shown as our own
    // human-facing codes (weaver.code, factoryLoom.code) rather than raw
    // uuids; batchId/purchaseId are already business keys (BATCH-2026-NNN,
    // EXT-2026-NNN) so those pass through as-is.
    const sareeRows = sarees.map((saree) => ({
      sareeId: saree.id,
      origin: saree.origin,
      weaverCode: saree.weaver?.code ?? "—",
      factoryLoomCode: saree.factoryLoom?.code ?? "—",
      purchaseId: saree.purchaseId ?? "—",
      batchId: saree.batchId ?? "—",
      designCode: saree.designCode ?? "—",
      designName: saree.design?.name ?? "—",
      sareeTypeCode: saree.sareeTypeCode ?? "—",
      weightG: saree.weightG != null ? Number(saree.weightG) : null,
      costPrice: saree.costPrice != null ? Number(saree.costPrice) : null,
      color: saree.color ?? "—",
      sourceName: saree.sourceName ?? "—",
      qcDate: saree.qcDate,
      status: saree.status,
      createdAt: saree.createdAt,
    }));

    return {
      totalSareesProduced: totalSarees,
      qcByResult,
      finishingByStatus: Object.fromEntries(
        finishingCounts.map((row) => [row.status, row._count._all]),
      ),
      sarees: sareeRows,
    };
  }

  // Every row needs who handled it, what it was, when, and how many — a bare
  // aggregate total told none of that (product feedback after the report
  // used to just say "₹X, N sales" with no way to trace a single one of
  // them back to a person or a date).
  async getSalesSummary() {
    const [retailSales, wholesaleDispatches] = await Promise.all([
      this.prisma.saleRecord.findMany({
        include: { customer: true, soldBy: true },
        orderBy: { date: "desc" },
      }),
      this.prisma.dispatchRecord.findMany({
        where: { type: DispatchType.WHOLESALE },
        include: { customer: true, dispatchedBy: true, sarees: true },
        orderBy: { dispatchDate: "desc" },
      }),
    ]);

    const retailRows = retailSales.map((sale) => ({
      saleRef: sale.saleRef,
      soldBy: sale.soldBy ? `${sale.soldBy.firstName} ${sale.soldBy.lastName}`.trim() : "—",
      soldAt: sale.date,
      customerName: sale.customer.name,
      sareeId: sale.sareeId,
      // A retail sale is always exactly one saree — the count column exists
      // so this reads the same shape as the wholesale rows below, where a
      // dispatch legitimately covers more than one.
      quantity: 1,
      amount: Number(sale.amount),
    }));

    const wholesaleRows = wholesaleDispatches.map((dispatch) => ({
      dispatchId: dispatch.id,
      dispatchedBy: dispatch.dispatchedBy
        ? `${dispatch.dispatchedBy.firstName} ${dispatch.dispatchedBy.lastName}`.trim()
        : "—",
      dispatchedAt: dispatch.dispatchDate,
      customerName: dispatch.customer?.name ?? "—",
      quantity: dispatch.sarees.length,
      amount: Number(dispatch.grandTotal),
    }));

    // Flat, not nested under retail/wholesale: buildReportWorkbook only
    // looks one level deep for arrays-of-records to turn into table sheets
    // — a value that's itself an object (retail: { rows: [...], ... }) would
    // fall through to the Summary sheet as one JSON-stringified cell instead
    // of a real table. Top-level arrays become their own sheet; top-level
    // scalars land together on Summary.
    return {
      retailSales: retailRows,
      retailTotalSales: retailRows.reduce((sum, r) => sum + r.amount, 0),
      retailCount: retailRows.length,
      wholesaleSales: wholesaleRows,
      wholesaleTotalSales: wholesaleRows.reduce((sum, r) => sum + r.amount, 0),
      wholesaleTotalQuantity: wholesaleRows.reduce((sum, r) => sum + r.quantity, 0),
      wholesaleCount: wholesaleRows.length,
    };
  }

  /** Retail-only version of getSalesSummary — used by the "Retail Sales
   *  Report" schedule so its workbook doesn't also carry wholesale rows
   *  under the same sheet set (that's what made a "Wholesale Sales Report"
   *  delivery look identical to a Retail one — both handlers called
   *  getSalesSummary and got the combined retail+wholesale shape back). */
  async getRetailSalesReport() {
    const retailSales = await this.prisma.saleRecord.findMany({
      include: { customer: true, soldBy: true },
      orderBy: { date: "desc" },
    });

    const rows = retailSales.map((sale) => ({
      saleRef: sale.saleRef,
      soldBy: sale.soldBy ? `${sale.soldBy.firstName} ${sale.soldBy.lastName}`.trim() : "—",
      soldAt: sale.date,
      customerName: sale.customer.name,
      sareeId: sale.sareeId,
      quantity: 1,
      amount: Number(sale.amount),
    }));

    return {
      retailSales: rows,
      totalSales: rows.reduce((sum, r) => sum + r.amount, 0),
      totalQuantity: rows.length,
      count: rows.length,
      periodStart: rows.length ? rows[rows.length - 1].soldAt : null,
      periodEnd: rows.length ? rows[0].soldAt : null,
    };
  }

  /** Wholesale-only version of getSalesSummary — see getRetailSalesReport
   *  for why this exists as a separate method rather than reusing the
   *  combined one. */
  async getWholesaleSalesReport() {
    const dispatches = await this.prisma.dispatchRecord.findMany({
      where: { type: DispatchType.WHOLESALE },
      include: { customer: true, dispatchedBy: true, firm: true, sarees: true },
      orderBy: { dispatchDate: "desc" },
    });

    // dispatchId shown as our own human-facing reference (invoice number,
    // falling back to the delivery challan number) rather than the raw
    // uuid primary key — DispatchRecord.id has no business-key format of
    // its own, unlike Batch/Purchase/GRN ids.
    const rows = dispatches.map((dispatch) => ({
      dispatchId: dispatch.invoiceNumber ?? dispatch.challanNumber ?? dispatch.id,
      dispatchedBy: dispatch.dispatchedBy
        ? `${dispatch.dispatchedBy.firstName} ${dispatch.dispatchedBy.lastName}`.trim()
        : "—",
      dispatchedAt: dispatch.dispatchDate,
      customerName: dispatch.customer?.name ?? "—",
      quantity: dispatch.sarees.length,
      amount: Number(dispatch.grandTotal),
      invoiceNumber: dispatch.invoiceNumber ?? "—",
      invoiceDate: dispatch.invoiceDate,
      challanNumber: dispatch.challanNumber ?? "—",
      pricePerSaree: dispatch.pricePerSaree != null ? Number(dispatch.pricePerSaree) : null,
      totalAmount: Number(dispatch.totalAmount),
      gstPct: dispatch.gstPct != null ? Number(dispatch.gstPct) : null,
      grandTotal: Number(dispatch.grandTotal),
      firmName: dispatch.firm?.firmName ?? "—",
      lrNumber: dispatch.lrNumber ?? "—",
      transportCompany: dispatch.transportCompany ?? "—",
      vehicleNumber: dispatch.vehicleNumber ?? "—",
      driverName: dispatch.driverName ?? "—",
      expectedDelivery: dispatch.expectedDelivery,
      paymentDueDate: dispatch.paymentDueDate,
      bulkOrderRef: dispatch.bulkOrderRef ?? "—",
      quotationRef: dispatch.quotationRef ?? "—",
      notes: dispatch.notes ?? dispatch.specialInstructions ?? "—",
    }));

    return {
      wholesaleSales: rows,
      totalSales: rows.reduce((sum, r) => sum + r.amount, 0),
      totalQuantity: rows.reduce((sum, r) => sum + r.quantity, 0),
      count: rows.length,
      periodStart: rows.length ? rows[rows.length - 1].dispatchedAt : null,
      periodEnd: rows.length ? rows[0].dispatchedAt : null,
    };
  }

  /** Every raw-material delivery — who received it, from which vendor, when,
   *  and how much of each material. */
  async getRawMaterialReport() {
    const receipts = await this.prisma.grnReceipt.findMany({
      include: { vendor: true, receivedBy: true, items: true },
      orderBy: { receivedDate: "desc" },
    });

    const rows = receipts.flatMap((receipt) =>
      receipt.items.map((item) => ({
        grnId: receipt.id,
        vendorName: receipt.vendor?.name ?? receipt.supplierName,
        receivedBy: receipt.receivedBy
          ? `${receipt.receivedBy.firstName} ${receipt.receivedBy.lastName}`.trim()
          : "—",
        receivedAt: receipt.receivedDate,
        materialType: item.materialType,
        materialName: item.name,
        quantity: Number(item.quantity),
        unit: item.unit,
        totalPrice: Number(item.totalPrice),
      })),
    );

    return {
      materialReceipts: rows,
      totalReceipts: receipts.length,
      totalLineItems: rows.length,
      totalSpend: rows.reduce((sum, r) => sum + r.totalPrice, 0),
    };
  }

  /** Every payment made to a weaver — who recorded it, which weaver, when,
   *  and for how many sarees. */
  async getWeaverPaymentReport() {
    const payments = await this.prisma.weaverPayment.findMany({
      include: { weaver: true, recordedBy: true },
      orderBy: { paymentDate: "desc" },
    });

    const rows = payments.map((payment) => ({
      paymentId: payment.id,
      weaverName: payment.weaver.name,
      recordedBy: payment.recordedBy
        ? `${payment.recordedBy.firstName} ${payment.recordedBy.lastName}`.trim()
        : "—",
      paidAt: payment.paymentDate,
      // How many: the sarees this payment covers, when recorded — null for
      // a general/advance payment not tied to a specific saree count.
      quantity: payment.noOfSarees,
      amount: Number(payment.amountPaid),
      deduction: payment.deduction != null ? Number(payment.deduction) : 0,
    }));

    return {
      weaverPayments: rows,
      totalPayments: rows.length,
      totalPaid: rows.reduce((sum, r) => sum + r.amount, 0),
      totalDeducted: rows.reduce((sum, r) => sum + r.deduction, 0),
    };
  }

  /** Every registered customer — who they are, what type, when they joined,
   *  and how many orders/how much they've actually bought. */
  async getCustomerReport() {
    const customers = await this.prisma.customer.findMany({
      include: {
        invoices: { select: { total: true, invoiceDate: true } },
        dispatchRecords: { where: { type: DispatchType.WHOLESALE }, select: { grandTotal: true, dispatchDate: true } },
        bulkOrders: { select: { amountDue: true, amountPaid: true, createdDate: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = customers.map((customer) => {
      const orderDates = [
        ...customer.invoices.map((i) => i.invoiceDate),
        ...customer.dispatchRecords.map((d) => d.dispatchDate),
        ...customer.bulkOrders.map((b) => b.createdDate),
      ];
      const lastOrderAt = orderDates.length > 0
        ? new Date(Math.max(...orderDates.map((d) => d.getTime())))
        : null;
      const totalSpend =
        customer.invoices.reduce((sum, i) => sum + Number(i.total), 0) +
        customer.dispatchRecords.reduce((sum, d) => sum + Number(d.grandTotal), 0) +
        customer.bulkOrders.reduce((sum, b) => sum + Number(b.amountPaid), 0);
      const quantity = customer.invoices.length + customer.dispatchRecords.length + customer.bulkOrders.length;

      return {
        customerCode: customer.code ?? customer.id,
        customerName: customer.name,
        type: customer.type,
        city: customer.city ?? "—",
        joinedAt: customer.createdAt,
        lastOrderAt,
        quantity,
        totalSpend,
      };
    });

    return {
      customers: rows,
      totalCustomers: rows.length,
      totalOrders: rows.reduce((sum, r) => sum + r.quantity, 0),
      totalRevenue: rows.reduce((sum, r) => sum + r.totalSpend, 0),
    };
  }

  /** Revenue (retail + wholesale) against cost (raw material + weaver
   *  payments) as one line per source, so "who/what/when/how much" is
   *  traceable the same way the other reports are, not just a net figure. */
  async getProfitAndLossReport() {
    const [retailAgg, wholesaleAgg, materialAgg, receiptDateAgg, weaverAgg] = await Promise.all([
      this.prisma.saleRecord.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        _min: { date: true },
        _max: { date: true },
      }),
      this.prisma.dispatchRecord.aggregate({
        where: { type: DispatchType.WHOLESALE },
        _sum: { grandTotal: true },
        _count: { _all: true },
        _min: { dispatchDate: true },
        _max: { dispatchDate: true },
      }),
      // Item-level totals: GrnItem carries the price, not a date of its own.
      this.prisma.grnItem.aggregate({ _sum: { totalPrice: true }, _count: { _all: true } }),
      // The date range those items were received on lives on the parent
      // receipt instead, so it's a separate aggregate.
      this.prisma.grnReceipt.aggregate({ _min: { receivedDate: true }, _max: { receivedDate: true } }),
      this.prisma.weaverPayment.aggregate({
        _sum: { amountPaid: true },
        _count: { _all: true },
        _min: { paymentDate: true },
        _max: { paymentDate: true },
      }),
    ]);

    const retailRevenue = Number(retailAgg._sum.amount ?? 0);
    const wholesaleRevenue = Number(wholesaleAgg._sum.grandTotal ?? 0);
    const materialCost = Number(materialAgg._sum.totalPrice ?? 0);
    const weaverCost = Number(weaverAgg._sum.amountPaid ?? 0);
    const totalRevenue = retailRevenue + wholesaleRevenue;
    const totalCost = materialCost + weaverCost;

    // Each line covers "from this time to this time" — the earliest and
    // latest record date backing that line's figure — not just a bare total.
    const lines = [
      {
        source: "Retail sales",
        type: "Revenue" as const,
        quantity: retailAgg._count._all,
        amount: retailRevenue,
        periodStart: retailAgg._min.date,
        periodEnd: retailAgg._max.date,
      },
      {
        source: "Wholesale dispatches",
        type: "Revenue" as const,
        quantity: wholesaleAgg._count._all,
        amount: wholesaleRevenue,
        periodStart: wholesaleAgg._min.dispatchDate,
        periodEnd: wholesaleAgg._max.dispatchDate,
      },
      {
        source: "Raw material purchases",
        type: "Cost" as const,
        quantity: materialAgg._count._all,
        amount: materialCost,
        periodStart: receiptDateAgg._min.receivedDate,
        periodEnd: receiptDateAgg._max.receivedDate,
      },
      {
        source: "Weaver payments",
        type: "Cost" as const,
        quantity: weaverAgg._count._all,
        amount: weaverCost,
        periodStart: weaverAgg._min.paymentDate,
        periodEnd: weaverAgg._max.paymentDate,
      },
    ];

    const allStarts = lines.map((l) => l.periodStart).filter((d): d is Date => d != null);
    const allEnds = lines.map((l) => l.periodEnd).filter((d): d is Date => d != null);
    const netProfit = totalRevenue - totalCost;
    const result = netProfit >= 0 ? ("Profit" as const) : ("Loss" as const);
    const resultAmount = Math.abs(netProfit);
    const reportPeriodStart = allStarts.length ? new Date(Math.min(...allStarts.map((d) => d.getTime()))) : null;
    const reportPeriodEnd = allEnds.length ? new Date(Math.max(...allEnds.map((d) => d.getTime()))) : null;

    // Its own table, separate from the revenue/cost lines — not appended as
    // an extra row mixed in with them.
    const netResult = [
      {
        source: result === "Profit" ? "NET RESULT — PROFIT" : "NET RESULT — LOSS",
        type: result,
        quantity: lines.reduce((sum, l) => sum + l.quantity, 0),
        amount: resultAmount,
        periodStart: reportPeriodStart,
        periodEnd: reportPeriodEnd,
      },
    ];

    return {
      lines,
      netResult,
      totalRevenue,
      totalCost,
      netProfit,
      // Spelled out plainly rather than making the reader infer it from the
      // sign of netProfit — "Profit" with the amount, or "Loss" with the
      // amount, never a bare positive/negative number.
      result,
      resultAmount,
      resultSummary:
        result === "Profit"
          ? `Profit of ₹${netProfit.toLocaleString("en-IN")}`
          : `Loss of ₹${resultAmount.toLocaleString("en-IN")}`,
      // What fraction of revenue was kept as profit (or lost as a shortfall
      // beyond it, if negative) — the standard "how healthy is this" figure.
      profitMarginPct: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : null,
      // The overall span the whole report covers, across every line.
      reportPeriodStart,
      reportPeriodEnd,
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
