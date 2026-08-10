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

    const inventory = await this.prisma.inventoryRecord.findUnique({ where: { sareeId } });
    const latestQc = row.qcRecords[0];

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
    };
  }
}
