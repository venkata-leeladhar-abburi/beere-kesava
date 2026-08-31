import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  InvoiceStatus,
  NotificationTargetType,
  OrderPaymentStatus,
  UserRole,
} from "../generated/prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

const OVERDUE_THRESHOLD_DAYS = 45;

@Injectable()
export class OverduePaymentsService {
  private readonly logger = new Logger(OverduePaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async scanOverduePayments() {
    const result = await this.runScan();
    this.logger.log(
      `Day-45 overdue scan: ${result.invoicesFlagged} invoices flagged, ${result.bulkOrdersFlagged} bulk orders flagged`,
    );
    return result;
  }

  /** Exposed separately so it can be triggered manually via an endpoint, not just the cron. */
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
      select: { id: true, customerId: true, dueDate: true, total: true, paid: true },
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
          customerId: invoice.customerId,
          dueDate: invoice.dueDate,
          outstanding: Number(invoice.total) - Number(invoice.paid),
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
          outstanding: Number(order.amountDue) - Number(order.amountPaid),
        },
      });
    }

    return {
      invoicesFlagged: overdueInvoices.length,
      bulkOrdersFlagged: overdueBulkOrders.length,
    };
  }
}
