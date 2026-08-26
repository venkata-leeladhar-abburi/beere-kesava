import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type StockSource = "factory" | "outsourced" | "external";
export type StockStatus = "available" | "sold" | "wholesale";

/** The SHOP dispatch that physically put a saree on the shop floor. */
export interface ShopDispatchInfo {
  dispatchId: string;
  dispatchDate: string;
  lrNumber: string | null;
  transportCompany: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  notes: string | null;
  pendingTransport: boolean;
  pendingReceipt: boolean;
}

export interface StockItem {
  sareeId: string;
  source: StockSource;
  status: StockStatus;
  // Weaver / loom
  weaverName: string | null;
  weaverId: string | null;
  loomNumber: string | null;
  // Design / type
  designCode: string | null;
  sareeTypeCode: string | null;
  sareeTypeLabel: string | null;
  // QC timing (ISO string)
  qcDate: string;
  // Sale / dispatch — wired when a SaleRecord row exists (future)
  saleRef: string | null;
  customer: string | null;
}

/**
 * One saree standing on the shop floor. Same fields the admin inventory shows,
 * plus the dispatch that delivered it — the shop portal groups and filters its
 * stock by consignment, so that has to travel with each saree.
 */
export interface ShopStockItem extends StockItem {
  /** Retail price: the per-saree price entered at receipt, else the type rate. */
  retailPrice: number | null;
  dispatch: ShopDispatchInfo;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns every QC-passed saree that hasn't left the shop yet — i.e.
   * `qcPassed: true` (a clean PASSED verdict — see QcService, SEMI/DEFECTIVE
   * never set this), minus anything already dispatched or already sold.
   * Deliberately NOT gated on finishing/InventoryRecord status — a saree is
   * "in stock" as soon as QC passes, whether or not it's separately gone
   * through the finishing department.
   *   - DispatchSaree row exists → already sent out (excluded)
   *   - SaleRecord row exists → already sold (excluded, see SalesService.createSale)
   *   - InventoryRecord.status === DAMAGED_REVIEW_NEEDED → not sellable (excluded)
   *
   * Scope — woven sarees only (outsourced/factory). External-purchase sarees
   * (Purchase records) are not yet joined here; they'll be added once the
   * purchase → inventory flow is fully persisted.
   *
   * Fields deliberately omitted (not in DB yet):
   *   - weight (no weightG column on BatchSareeRow yet — show "—" on frontend)
   *   - assignedBy / assignedAt (no actor-tracking on InventoryRecord yet)
   */
  async findAll(): Promise<StockItem[]> {
    const rows = await this.prisma.batchSareeRow.findMany({
      where: { qcPassed: true, sareeId: { not: null } },
      include: {
        weaver: true,
        factoryLoom: true,
        sareeType: true,
        design: true,
        qcRecords: { orderBy: { qcDate: "desc" }, take: 1 },
      },
    });
    if (rows.length === 0) {
      return [];
    }
    const sareeIds = rows.map((r) => r.sareeId!);

    const [dispatched, sold, inventoryRecords] = await Promise.all([
      this.prisma.dispatchSaree.findMany({
        where: { sareeId: { in: sareeIds } },
        select: { sareeId: true },
      }),
      this.prisma.saleRecord.findMany({
        where: { sareeId: { in: sareeIds } },
        select: { sareeId: true },
      }),
      this.prisma.inventoryRecord.findMany({
        where: { sareeId: { in: sareeIds }, status: "DAMAGED_REVIEW_NEEDED" },
        select: { sareeId: true },
      }),
    ]);
    const excluded = new Set([
      ...dispatched.map((d) => d.sareeId),
      ...sold.map((s) => s.sareeId),
      ...inventoryRecords.map((i) => i.sareeId),
    ]);

    return rows
      .filter((row) => !excluded.has(row.sareeId!))
      .map((row): StockItem => {
        const isFactory =
          row.recipientType === "FACTORY_LOOM" || row.factoryLoomId != null;
        const source: StockSource = isFactory ? "factory" : "outsourced";
        const latestQc = row.qcRecords[0];
        const loomNumber = row.factoryLoom?.loomNumber ?? latestQc?.loomNumber ?? null;

        return {
          sareeId: row.sareeId!,
          source,
          status: "available",
          weaverName: row.weaver
            ? `${row.weaver.firstName} ${row.weaver.lastName}`.trim()
            : null,
          weaverId: row.weaverId ?? null,
          loomNumber,
          designCode: row.designCode ?? null,
          sareeTypeCode: row.sareeTypeCode ?? null,
          sareeTypeLabel: row.sareeType
            ? `${row.sareeTypeCode} · ${row.sareeType.type}`
            : row.sareeTypeCode ?? null,
          qcDate: (latestQc?.qcDate ?? row.createdAt).toISOString(),
          saleRef: null,
          customer: null,
        };
      })
      .sort((a, b) => new Date(b.qcDate).getTime() - new Date(a.qcDate).getTime());
  }

  /**
   * Stock standing in the shop: every saree delivered by a SHOP dispatch that
   * has not since been sold. This is deliberately the mirror image of
   * `findAll()` — that one lists what is still in the factory and drops a saree
   * the moment it is dispatched, which is exactly the moment it becomes the
   * shop's to sell. The shop portal's Inventory tab and the New Sale picker
   * both read this, so the counter can only ever sell what was actually sent
   * to it.
   *
   * A WHOLESALE dispatch is not shop stock — those goods left the business.
   */
  async findShopStock(): Promise<ShopStockItem[]> {
    const consignments = await this.prisma.dispatchSaree.findMany({
      where: { dispatch: { type: "SHOP" } },
      include: { dispatch: true },
      orderBy: { dispatch: { dispatchDate: "desc" } },
    });
    if (consignments.length === 0) {
      return [];
    }

    // A saree can appear on more than one SHOP dispatch if an earlier one was
    // corrected and re-sent — the most recent delivery is the one that counts.
    const latestBySaree = new Map<string, (typeof consignments)[number]>();
    for (const c of consignments) {
      if (!latestBySaree.has(c.sareeId)) {
        latestBySaree.set(c.sareeId, c);
      }
    }
    const sareeIds = [...latestBySaree.keys()];

    const [rows, sold] = await Promise.all([
      this.prisma.batchSareeRow.findMany({
        where: { sareeId: { in: sareeIds } },
        include: {
          weaver: true,
          factoryLoom: true,
          sareeType: true,
          design: true,
          qcRecords: { orderBy: { qcDate: "desc" }, take: 1 },
        },
      }),
      this.prisma.saleRecord.findMany({
        where: { sareeId: { in: sareeIds } },
        select: { sareeId: true, saleRef: true, customer: { select: { name: true } } },
      }),
    ]);
    const soldBySaree = new Map(sold.map((s) => [s.sareeId, s]));
    const rowBySaree = new Map(rows.map((r) => [r.sareeId!, r]));

    return sareeIds
      // A saree dispatched to the shop but with no woven row behind it has
      // nothing to display; skip rather than emit a card full of dashes.
      .filter((id) => rowBySaree.has(id))
      .map((sareeId): ShopStockItem => {
        const row = rowBySaree.get(sareeId)!;
        const consignment = latestBySaree.get(sareeId)!;
        const dispatch = consignment.dispatch;
        const sale = soldBySaree.get(sareeId);
        const latestQc = row.qcRecords[0];
        const isFactory =
          row.recipientType === "FACTORY_LOOM" || row.factoryLoomId != null;

        return {
          sareeId,
          source: isFactory ? "factory" : "outsourced",
          status: sale ? "sold" : "available",
          weaverName: row.weaver
            ? `${row.weaver.firstName} ${row.weaver.lastName}`.trim()
            : null,
          weaverId: row.weaverId ?? null,
          loomNumber: row.factoryLoom?.loomNumber ?? latestQc?.loomNumber ?? null,
          designCode: row.designCode ?? null,
          sareeTypeCode: row.sareeTypeCode ?? null,
          sareeTypeLabel: row.sareeType
            ? `${row.sareeTypeCode} · ${row.sareeType.type}`
            : row.sareeTypeCode ?? null,
          qcDate: (latestQc?.qcDate ?? row.createdAt).toISOString(),
          saleRef: sale?.saleRef ?? null,
          customer: sale?.customer?.name ?? null,
          retailPrice: row.receivedSellingPrice
            ? Number(row.receivedSellingPrice)
            : row.sareeType
              ? Number(row.sareeType.retailPrice)
              : null,
          dispatch: {
            dispatchId: dispatch.id,
            dispatchDate: dispatch.dispatchDate.toISOString(),
            lrNumber: dispatch.lrNumber,
            transportCompany: dispatch.transportCompany,
            vehicleNumber: dispatch.vehicleNumber,
            driverName: dispatch.driverName,
            notes: dispatch.notes,
            pendingTransport: dispatch.pendingTransport,
            pendingReceipt: dispatch.pendingReceipt,
          },
        };
      });
  }
}
