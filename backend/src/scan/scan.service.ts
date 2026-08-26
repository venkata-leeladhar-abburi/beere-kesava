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

    const [inventory, dispatches, sold] = await Promise.all([
      this.prisma.inventoryRecord.findUnique({ where: { sareeId } }),
      this.prisma.dispatchSaree.findMany({
        where: { sareeId },
        include: { dispatch: { select: { type: true, dispatchDate: true } } },
        orderBy: { dispatch: { dispatchDate: "desc" } },
      }),
      this.prisma.saleRecord.findFirst({ where: { sareeId } }),
    ]);
    const latestQc = row.qcRecords[0];

    // Where the saree physically is. A SHOP dispatch delivers it to the shop
    // floor — that is what *makes* it counter stock, not what removes it from
    // sale. A WHOLESALE dispatch is the opposite: those goods left the
    // business. Treating both as "dispatched" meant every saree the shop was
    // sent became unsellable the moment it arrived.
    const latestDispatch = dispatches[0]?.dispatch ?? null;
    const atShop = latestDispatch?.type === "SHOP";
    const goneToWholesale = latestDispatch?.type === "WHOLESALE";

    // NOT gated on finishing: a saree counts as saleable as soon as QC passes
    // and it has reached the shop, whether or not it separately went through
    // the finishing department.
    let saleEligible:
      | "PASSED"
      | "QC_NOT_PASSED"
      | "NOT_IN_SHOP"
      | "WHOLESALE_DISPATCHED"
      | "SOLD"
      | "DAMAGED_REVIEW_NEEDED";
    if (sold) {
      saleEligible = "SOLD";
    } else if (goneToWholesale) {
      saleEligible = "WHOLESALE_DISPATCHED";
    } else if (inventory?.status === "DAMAGED_REVIEW_NEEDED") {
      saleEligible = "DAMAGED_REVIEW_NEEDED";
    } else if (!row.qcPassed) {
      saleEligible = "QC_NOT_PASSED";
    } else if (!atShop) {
      saleEligible = "NOT_IN_SHOP";
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
      /** True once a SHOP dispatch has delivered this saree to the shop floor. */
      atShop,
      // Worker Staff's per-saree price entered at receipt — takes priority
      // over the saree type's shared SareeTypeRate.retailPrice when set.
      // Null for a saree received before this field existed.
      sellingPrice: row.receivedSellingPrice ? Number(row.receivedSellingPrice) : null,
    };
  }
}
