import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ScanService {
  constructor(private readonly prisma: PrismaService) {}

  async lookup(sareeId: string) {
    const row = await this.prisma.batchSareeRow.findUnique({
      where: { sareeId },
      include: {
        batch: true,
        weaver: true,
        factoryLoom: true,
        design: true,
        sareeType: true,
        // Newest first — after a SEMI-rework round a saree has several QC
        // records and only the latest is its current verdict.
        qcRecords: { orderBy: { qcDate: "desc" }, take: 1 },
        finishingAssignment: { include: { finishingStaff: true } },
      },
    });

    if (!row) {
      throw new NotFoundException(`No saree found for scanned code "${sareeId}"`);
    }

    const [inventory, dispatched, sold] = await Promise.all([
      this.prisma.inventoryRecord.findUnique({ where: { sareeId } }),
      this.prisma.dispatchSaree.findFirst({ where: { sareeId } }),
      this.prisma.saleRecord.findFirst({ where: { sareeId } }),
    ]);
    const latestQc = row.qcRecords[0];

    // Same eligibility rule as InventoryService.findAll() / SalesService.createSale
    // — a clean QC pass, not dispatched, not already sold, not damaged.
    // NOT gated on finishing: a saree counts as "in stock" as soon as QC
    // passes, whether or not it's separately gone through finishing.
    let saleEligible: "PASSED" | "QC_NOT_PASSED" | "DISPATCHED" | "SOLD" | "DAMAGED_REVIEW_NEEDED";
    if (dispatched) {
      saleEligible = "DISPATCHED";
    } else if (sold) {
      saleEligible = "SOLD";
    } else if (inventory?.status === "DAMAGED_REVIEW_NEEDED") {
      saleEligible = "DAMAGED_REVIEW_NEEDED";
    } else if (!row.qcPassed) {
      saleEligible = "QC_NOT_PASSED";
    } else {
      saleEligible = "PASSED";
    }

    return {
      sareeId,
      batchId: row.batchId,
      recipientType: row.recipientType,
      weaver: row.weaver ? { id: row.weaver.id, name: row.weaver.name } : null,
      factoryLoom: row.factoryLoom
        ? { id: row.factoryLoom.id, loomNumber: row.factoryLoom.loomNumber }
        : null,
      design: row.design ? { code: row.design.code, name: row.design.name } : null,
      sareeType: row.sareeType ? { code: row.sareeType.code, type: row.sareeType.type } : null,
      qc: latestQc
        ? { result: latestQc.result, payable: latestQc.payable, date: latestQc.qcDate }
        : null,
      finishing: row.finishingAssignment
        ? {
            status: row.finishingAssignment.status,
            staffName: row.finishingAssignment.finishingStaff
              ? `${row.finishingAssignment.finishingStaff.firstName} ${row.finishingAssignment.finishingStaff.lastName}`
              : null,
            condition: row.finishingAssignment.condition,
          }
        : null,
      inventoryStatus: inventory?.status ?? null,
      saleEligibility: saleEligible,
      // Worker Staff's per-saree price entered at receipt — takes priority
      // over the saree type's shared SareeTypeRate.retailPrice when set.
      // Null for a saree received before this field existed.
      sellingPrice: row.receivedSellingPrice ? Number(row.receivedSellingPrice) : null,
    };
  }
}
