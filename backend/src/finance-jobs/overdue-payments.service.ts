import { Injectable } from "@nestjs/common";
import {
  InvoiceStatus,
  NotificationTargetType,
  OrderPaymentStatus,
  UserRole,
} from "../generated/prisma/client";
import { fromPaise, toPaise } from "../common/money.util";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

/** Days past its due date before an unpaid invoice or bulk order counts as overdue. */
export const OVERDUE_THRESHOLD_DAYS = 45;

@Injectable()
export class OverduePaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Run daily by the job scheduler (src/jobs), or by hand from FinanceJobsController. */
  async runScan() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - OVERDUE_THRESHOLD_DAYS);

    const overdueInvoiceWhere = {
      status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
      dueDate: { lt: cutoff },
    };

    // Only the columns the notification payload needs — these rows used to be
    // loaded whole, and this set only grows as invoices age.
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: overdueInvoiceWhere,
      select: { id: true, code: true, customerId: true, dueDate: true, total: true, paid: true },
    });

    // One statement for the whole set instead of an UPDATE per row.
    await this.prisma.invoice.updateMany({
      where: overdueInvoiceWhere,
      data: { status: InvoiceStatus.OVERDUE },
    });

    // Notifications stay per-row: NotificationsService.create also pushes the
    // row over the websocket gateway, which a createMany would skip.
    for (const invoice of overdueInvoices) {
      await this.notificationsService.create({
        targetType: NotificationTargetType.ROLE,
        role: UserRole.ACCOUNTANT,
        type: "invoice_overdue",
        payload: {
          invoiceId: invoice.id,
          // The card renders as "Invoice Overdue — <number>"; without the
          // human-facing code it could only show a uuid.
          invoiceNumber: invoice.code,
          customerId: invoice.customerId,
          dueDate: invoice.dueDate,
          outstanding: fromPaise(toPaise(invoice.total) - toPaise(invoice.paid)),
        },
      });
    }

    const overdueBulkOrders = await this.prisma.bulkOrder.findMany({
      where: {
        paymentStatus: { in: [OrderPaymentStatus.PENDING, OrderPaymentStatus.PARTIAL] },
        dueDate: { lt: cutoff },
      },
      select: { ref: true, customerId: true, dueDate: true, amountDue: true, amountPaid: true },
    });

    for (const order of overdueBulkOrders) {
      await this.notificationsService.create({
        targetType: NotificationTargetType.ROLE,
        role: UserRole.ACCOUNTANT,
        type: "bulk_order_payment_overdue",
        payload: {
          bulkOrderRef: order.ref,
          customerId: order.customerId,
          dueDate: order.dueDate,
          outstanding: fromPaise(toPaise(order.amountDue) - toPaise(order.amountPaid)),
        },
      });
    }

    return {
      invoicesFlagged: overdueInvoices.length,
      bulkOrdersFlagged: overdueBulkOrders.length,
    };
  }
}
