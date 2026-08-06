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
   * Returns all sarees in the inventory queue as a rich StockItem array.
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
    const qcRows = await this.prisma.qcRecord.findMany({
      where: { result: { in: ["PASSED", "SEMI"] } },
      include: {
        batchSareeRow: {
          include: {
            weaver: true,
            factoryLoom: true,
            sareeType: true,
            design: true,
          },
        },
      },
      orderBy: { qcDate: "desc" },
    });

    return qcRows.map((qc) => {
      const row = qc.batchSareeRow;
      const isFactory =
        row.recipientType === "FACTORY_LOOM" || row.factoryLoomId != null;

      const source: StockSource = isFactory ? "factory" : "outsourced";

      const loomNumber =
        row.factoryLoom?.loomNumber ?? qc.loomNumber ?? null;

      return {
        sareeId: qc.sareeId,
        source,
        status: "available" as StockStatus, // sale/dispatch lookup deferred
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
        qcDate: qc.qcDate.toISOString(),
        saleRef: null,
        customer: null,
      };
    });
  }
}
