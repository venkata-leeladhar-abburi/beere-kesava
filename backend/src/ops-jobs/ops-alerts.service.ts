import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  BatchStatus,
  DispatchReceiptStatus,
  DispatchType,
  UserRole,
} from "../generated/prisma/client";
import { InventoryService } from "../inventory/inventory.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

/**
 * How long a SHOP consignment may sit unreceipted before it is treated as a
 * problem. Nothing in the schema records an expected transit time, so this is
 * a policy number rather than a derived one — change it here.
 */
const DISPATCH_UNCONFIRMED_DAYS = 3;

/**
 * Total sellable pieces on the shop floor below which the counter is warned
 * to ask for a consignment. Also a policy number: RawMaterialStock carries a
 * per-row reorderLevel, but finished shop stock has no equivalent column.
 */
const SHOP_STOCK_LOW_THRESHOLD = 20;

/**
 * The operational counterpart to OverduePaymentsService: things that become
 * problems by *not* happening, which therefore have no user action to hang a
 * notification off and can only be found by looking.
 */
@Injectable()
export class OpsAlertsService {
  private readonly logger = new Logger(OpsAlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scanOperationalAlerts() {
    const result = await this.runScan();
    this.logger.log(
      `Ops scan: ${result.overdueBatches} overdue batch(es), ${result.unconfirmedDispatches} unconfirmed dispatch(es), shop stock ${result.shopStockCount}`,
    );
    return result;
  }

  /** Exposed separately so it can be triggered manually via an endpoint, not just the cron. */
  async runScan() {
    const [overdueBatches, unconfirmedDispatches, shopStockCount] = await Promise.all([
      this.scanOverdueBatches(),
      this.scanUnconfirmedDispatches(),
      this.scanShopStock(),
    ]);

    return { overdueBatches, unconfirmedDispatches, shopStockCount };
  }

  /**
   * An ACTIVE batch past its own due date with rows still out at the looms.
   * Uses Batch.dueDate rather than a "nothing received in N days" heuristic —
   * the date the batch was actually promised for is already recorded, and it
   * is the one the office committed to.
   */
  private async scanOverdueBatches(): Promise<number> {
    const batches = await this.prisma.batch.findMany({
      where: {
        status: BatchStatus.ACTIVE,
        dueDate: { lt: new Date() },
        rows: { some: { receivedAt: null } },
      },
      select: {
        id: true,
        dueDate: true,
        totalCount: true,
        rows: { where: { receivedAt: null }, select: { serial: true } },
      },
    });

    for (const batch of batches) {
      await this.notifications.notifyRole(UserRole.ADMIN, "BATCH_DELIVERY_OVERDUE", {
        batchId: batch.id,
        dueDate: batch.dueDate,
        totalCount: batch.totalCount,
        pendingCount: batch.rows.length,
        daysOverdue: daysSince(batch.dueDate),
      });
    }

    return batches.length;
  }

  /** A consignment that left the factory but that the shop counter never receipted. */
  private async scanUnconfirmedDispatches(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DISPATCH_UNCONFIRMED_DAYS);

    const dispatches = await this.prisma.dispatchRecord.findMany({
      where: {
        type: DispatchType.SHOP,
        receiptStatus: { not: DispatchReceiptStatus.RECEIVED },
        dispatchDate: { lt: cutoff },
      },
      select: {
        id: true,
        challanNumber: true,
        lrNumber: true,
        dispatchDate: true,
        receiptStatus: true,
        _count: { select: { sarees: true } },
      },
    });

    for (const dispatch of dispatches) {
      await this.notifications.notifyRole(UserRole.ADMIN, "SHOP_DISPATCH_UNCONFIRMED", {
        dispatchId: dispatch.id,
        challanNumber: dispatch.challanNumber,
        lrNumber: dispatch.lrNumber,
        dispatchDate: dispatch.dispatchDate,
        receiptStatus: dispatch.receiptStatus,
        sareeCount: dispatch._count.sarees,
        daysSinceDispatch: daysSince(dispatch.dispatchDate),
      });
    }

    return dispatches.length;
  }

  /**
   * Read through InventoryService rather than counting rows here: what counts
   * as sellable shop stock (receipted, not sold, returns that came back) is
   * decided in exactly one place, and a second copy of that rule would drift.
   */
  private async scanShopStock(): Promise<number> {
    const stock = await this.inventory.findShopStock();
    const available = stock.filter((item) => item.status === "available").length;
    if (available > SHOP_STOCK_LOW_THRESHOLD) return available;

    const payload = {
      available,
      threshold: SHOP_STOCK_LOW_THRESHOLD,
    };
    await this.notifications.notifyRole(UserRole.SHOP, "SHOP_STOCK_LOW", payload);
    await this.notifications.notifyRole(UserRole.ADMIN, "SHOP_STOCK_LOW", payload);

    return available;
  }
}

function daysSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}
