import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // Unified "inventory queue" view — QC-passed sarees still awaiting finishing
  // ("QC_PASSED", derived live, not persisted) plus persisted InventoryRecord
  // rows written once a saree returns from finishing (finishing complete /
  // damaged / dispatched). Mirrors the frontend's useInventoryPageState merge
  // of ReadySaree + FinishingReturn into one InventoryRecord-shaped list.
  async findAll() {
    const [readyForFinishing, persisted] = await Promise.all([
      this.prisma.qcRecord.findMany({
        where: {
          result: { in: ["PASSED", "SEMI"] },
          batchSareeRow: { finishingAssignment: null },
        },
        include: { batchSareeRow: { include: { design: true, sareeType: true } } },
        orderBy: { qcDate: "asc" },
      }),
      this.prisma.inventoryRecord.findMany({
        include: { bulkOrder: true, batch: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const readyRecords = readyForFinishing.map((qc) => ({
      sareeId: qc.sareeId,
      status: "QC_PASSED" as const,
      rawType: "READY_SAREE" as const,
      designCode: qc.batchSareeRow.designCode,
      sareeType: qc.batchSareeRow.sareeTypeCode,
      batchId: qc.batchId,
      bulkOrderRef: null,
      quotationRef: null,
      updatedAt: qc.qcDate,
    }));

    return [...readyRecords, ...persisted];
  }
}
