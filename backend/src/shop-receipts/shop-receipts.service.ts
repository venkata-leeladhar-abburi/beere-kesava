import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import {
  DispatchReceiptStatus,
  Prisma,
  ShopReceiptItemStatus,
  UserRole,
} from "../generated/prisma/client";
import { IdGeneratorService, financialYearCode } from "../id-generator/id-generator.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateShopReceiptDto } from "./dto/create-shop-receipt.dto";
import { ListShopReceiptsQueryDto } from "./dto/list-shop-receipts-query.dto";

const receiptInclude = {
  items: true,
  receivedBy: { select: { id: true, firstName: true, lastName: true } },
  dispatch: {
    select: {
      id: true,
      dispatchDate: true,
      challanNumber: true,
      lrNumber: true,
      transportCompany: true,
      vehicleNumber: true,
      driverName: true,
      receiptStatus: true,
      dispatchedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.ShopReceiptInclude;

const pendingInclude = {
  sarees: true,
  dispatchedBy: { select: { id: true, firstName: true, lastName: true } },
  receipts: { select: { id: true, code: true, receivedAt: true } },
} satisfies Prisma.DispatchRecordInclude;

@Injectable()
export class ShopReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly idGenerator: IdGeneratorService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Consignments the shop counter still has to act on: every SHOP dispatch not
   * yet fully received. A partially received one stays here so the pieces that
   * were short on the first pass can be received when they turn up.
   */
  async findPendingDispatches() {
    return this.prisma.dispatchRecord.findMany({
      where: {
        type: "SHOP",
        receiptStatus: { in: [DispatchReceiptStatus.PENDING, DispatchReceiptStatus.PARTIALLY_RECEIVED] },
      },
      orderBy: { dispatchDate: "desc" },
      include: pendingInclude,
    });
  }

  async findAll(
    query: ListShopReceiptsQueryDto,
  ): Promise<PaginatedResult<Prisma.ShopReceiptGetPayload<{ include: typeof receiptInclude }>>> {
    const where: Prisma.ShopReceiptWhereInput = { dispatchId: query.dispatchId };

    const [items, total] = await Promise.all([
      this.prisma.shopReceipt.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { receivedAt: "desc" },
        include: receiptInclude,
      }),
      this.prisma.shopReceipt.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const receipt = await this.prisma.shopReceipt.findUnique({ where: { id }, include: receiptInclude });
    if (!receipt) throw new NotFoundException(`Shop receipt ${id} not found`);
    return receipt;
  }

  /**
   * Records one receiving session against a SHOP dispatch and allocates its
   * receipt number (SGR-<FY>-NNN, server-side like every other business id).
   *
   * Only pieces actually on the consignment can be receipted, and a piece
   * already marked RECEIVED is not receipted twice — a second receipt against the
   * same dispatch exists to resolve what was short the first time, not to
   * re-confirm what already arrived.
   */
  async create(dto: CreateShopReceiptDto, user?: AuthenticatedUser) {
    const dispatch = await this.prisma.dispatchRecord.findUnique({
      where: { id: dto.dispatchId },
      include: { sarees: true },
    });
    if (!dispatch) throw new NotFoundException(`Dispatch ${dto.dispatchId} not found`);
    if (dispatch.type !== "SHOP") {
      throw new BadRequestException("Only a SHOP dispatch is received by the shop counter");
    }
    if (dispatch.receiptStatus === DispatchReceiptStatus.RECEIVED) {
      throw new BadRequestException("This consignment has already been fully received");
    }

    const onDispatch = new Map(dispatch.sarees.map((s) => [s.sareeId, s]));
    const seen = new Set<string>();
    for (const item of dto.items) {
      const line = onDispatch.get(item.sareeId);
      if (!line) {
        throw new BadRequestException(`Saree ${item.sareeId} is not on this dispatch`);
      }
      if (seen.has(item.sareeId)) {
        throw new BadRequestException(`Saree ${item.sareeId} appears twice on this receipt`);
      }
      seen.add(item.sareeId);
      if (line.receiptStatus === ShopReceiptItemStatus.RECEIVED) {
        throw new BadRequestException(`Saree ${item.sareeId} has already been received`);
      }
      // A discrepancy without a reason is unusable to the admin who has to
      // chase it, so the reason is required at the point of entry.
      if (item.status !== ShopReceiptItemStatus.RECEIVED && !item.remarks?.trim()) {
        throw new BadRequestException(`Saree ${item.sareeId} is marked ${item.status} — a remark is required`);
      }
    }

    // Attribution, resolved the same way DispatchService.create resolves
    // dispatchedById: only written when it matches a real user, so a stale
    // token subject can never fail the FK and reject the whole receipt.
    const receivedById = user?.id
      ? (await this.prisma.user.findUnique({ where: { id: user.id }, select: { id: true } }))?.id
      : undefined;

    // SGR, not GRN: the GRN prefix already belongs to the vendor goods
    // receipts raised against a purchase order (PurchaseOrdersService,
    // RawMaterialsService), which are scoped to the vendor and shaped
    // GRN-<Vendor>-NNN. Two shapes behind one prefix would make a code
    // unparseable, so the shop's own goods receipt gets its own prefix,
    // scoped to the financial year exactly as the challan it receives is.
    const code = await this.idGenerator.nextScoped("SGR", financialYearCode());

    const receipt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shopReceipt.create({
        data: {
          code,
          dispatchId: dispatch.id,
          receivedById,
          notes: dto.notes,
          items: {
            create: dto.items.map((i) => ({
              sareeId: i.sareeId,
              status: i.status,
              remarks: i.remarks?.trim() || null,
            })),
          },
        },
      });

      const receivedAt = new Date();
      for (const item of dto.items) {
        await tx.dispatchSaree.update({
          where: { dispatchId_sareeId: { dispatchId: dispatch.id, sareeId: item.sareeId } },
          data: { receiptStatus: item.status, receivedAt },
        });
      }

      // A missing piece never reached the shop, so it must not stay marked
      // DISPATCHED-and-therefore-shop-stock; a damaged one needs the admin to
      // look at it before it can be sold. Received pieces keep DISPATCHED —
      // that is the status shop stock is built on.
      const damaged = dto.items.filter((i) => i.status === ShopReceiptItemStatus.DAMAGED).map((i) => i.sareeId);
      if (damaged.length) {
        await tx.inventoryRecord.updateMany({
          where: { sareeId: { in: damaged } },
          data: { status: "DAMAGED_REVIEW_NEEDED" },
        });
      }

      // Fully received once no line on the consignment is still awaiting a
      // verdict and nothing is outstanding as MISSING. A damaged piece has
      // been physically received, so it does not hold the consignment open.
      const lines = await tx.dispatchSaree.findMany({
        where: { dispatchId: dispatch.id },
        select: { receiptStatus: true },
      });
      const settled = lines.every(
        (l) => l.receiptStatus === ShopReceiptItemStatus.RECEIVED || l.receiptStatus === ShopReceiptItemStatus.DAMAGED,
      );
      await tx.dispatchRecord.update({
        where: { id: dispatch.id },
        data: {
          receiptStatus: settled ? DispatchReceiptStatus.RECEIVED : DispatchReceiptStatus.PARTIALLY_RECEIVED,
        },
      });

      return created;
    });

    const counts = {
      received: dto.items.filter((i) => i.status === ShopReceiptItemStatus.RECEIVED).length,
      damaged: dto.items.filter((i) => i.status === ShopReceiptItemStatus.DAMAGED).length,
      missing: dto.items.filter((i) => i.status === ShopReceiptItemStatus.MISSING).length,
    };

    await this.auditLog.recordAction({
      actorId: user?.id,
      module: "SHOP_RECEIPT",
      action:
        `Received ${counts.received} saree(s) on ${code}` +
        (counts.damaged || counts.missing
          ? ` (${counts.damaged} damaged, ${counts.missing} missing)`
          : ""),
      entityType: "ShopReceipt",
      entityId: receipt.id,
      recordLabel: code,
    });

    // A shortage is the owners' problem to chase, so it is pushed rather than
    // left to be noticed in a table.
    //
    // Targeted at ADMIN alone deliberately — this reaches superadmins too, and
    // a second SUPERADMIN row would only be a duplicate both roles then see
    // twice. Superadmins get it on both paths already: the live socket joins
    // an admin or superadmin to every role room
    // (NotificationsGateway.handleConnection), and the REST feed is unscoped
    // for both roles (NotificationsService.scopeFor).
    if (counts.damaged || counts.missing) {
      await this.notifications.notifyRole(UserRole.ADMIN, "SHOP_RECEIPT_DISCREPANCY_ALERT", {
        receiptId: receipt.id,
        code,
        dispatchId: dispatch.id,
        challanNumber: dispatch.challanNumber,
        ...counts,
      });
    } else {
      // Closes the loop on SHOP_DISPATCH_INCOMING_STOCK: without this the
      // office can see a consignment leave but never see it land.
      await this.notifications.notifyRole(UserRole.ADMIN, "SHOP_DISPATCH_RECEIVED", {
        receiptId: receipt.id,
        code,
        dispatchId: dispatch.id,
        challanNumber: dispatch.challanNumber,
        ...counts,
      });
    }

    return this.findOne(receipt.id);
  }
}
