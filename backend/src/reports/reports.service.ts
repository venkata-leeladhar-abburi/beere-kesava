import { Injectable } from "@nestjs/common";
import { DispatchType, InvoiceStatus, OrderPaymentStatus, QcResult } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
