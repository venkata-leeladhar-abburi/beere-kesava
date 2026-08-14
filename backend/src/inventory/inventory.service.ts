import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type StockSource = "factory" | "outsourced" | "external";
export type StockStatus = "available" | "sold" | "wholesale";

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
}
