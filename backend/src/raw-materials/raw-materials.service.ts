import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { MaterialType } from "../generated/prisma/client";
import { fromGrams, toGrams } from "../common/weight-units.util";

export interface CreateGrnDto {
  vendorId?: string;
  // Which of the company's legal firms this purchase belongs to. Optional —
  // left null shows as unattributed rather than a fabricated firm name.
  firmId?: string;
  supplierName: string;
  invoiceNo?: string;
  invoiceDate?: string;
  notes?: string;
  actorId?: string;
  items: {
    materialType: MaterialType;
    name: string;
    grade?: string;
    color?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    rejectedQuantity?: number;
  }[];
}

@Injectable()
export class RawMaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listStock() {
    const stock = await this.prisma.rawMaterialStock.findMany({
      include: { vendor: true },
      orderBy: { name: "asc" },
    });
    return { items: stock };
  }

  async listGrns() {
    const grns = await this.prisma.grnReceipt.findMany({
      include: { vendor: true, firm: true, items: true },
      orderBy: { createdAt: "desc" },
    });
    return { items: grns };
  }

  async createGrn(dto: CreateGrnDto) {
    // Jari is always counted in Reels/Buns, never a weight unit — grams/kg
    // would silently corrupt reel/bun stock totals (see toGrams/fromGrams).
    for (const item of dto.items) {
      const unit = (item.unit || "KG").trim().toUpperCase();
      if (item.materialType === MaterialType.JARI && !["REEL", "REELS", "BUN", "BUNS"].includes(unit)) {
        throw new BadRequestException(`Jari must be received in Reels or Buns, not "${item.unit}"`);
      }
    }

    const grnId = await this.idGenerator.nextFormatted("GRN-2026");

    const grn = await this.prisma.$transaction(async (tx) => {
      const createdGrn = await tx.grnReceipt.create({
        data: {
          id: grnId,
          vendorId: dto.vendorId || null,
          firmId: dto.firmId || null,
          supplierName: dto.supplierName,
          invoiceNo: dto.invoiceNo || null,
          invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : null,
          notes: dto.notes || null,
          items: {
            create: dto.items.map((item) => ({
              materialType: item.materialType,
              name: item.name,
              grade: item.grade || null,
              color: item.color || null,
              quantity: item.quantity,
              unit: item.unit || "KG",
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              rejectedQuantity: item.rejectedQuantity ?? 0,
            })),
          },
        },
        include: { items: true, vendor: true, firm: true },
      });

      // Increment / update stock levels — only the accepted portion of each
      // delivery counts towards usable stock; rejected quantity is tracked
      // on the GrnItem for vendor quality reporting but never added.
      for (const item of dto.items) {
        const acceptedQuantity = item.quantity - (item.rejectedQuantity ?? 0);
        const existing = await tx.rawMaterialStock.findFirst({
          where: {
            materialType: item.materialType,
            name: item.name,
            grade: item.grade || null,
            color: item.color || null,
          },
        });

        if (existing) {
          // Convert through grams before adding — the GRN line item's unit
          // (item.unit) and the existing stock row's unit (existing.unit)
          // aren't guaranteed to match.
          const existingGrams = toGrams(Number(existing.currentStock), existing.unit);
          const receivedGrams = toGrams(acceptedQuantity, item.unit || "KG");
          const newStock = fromGrams(existingGrams + receivedGrams, existing.unit);
          await tx.rawMaterialStock.update({
            where: { id: existing.id },
            data: {
              currentStock: newStock,
            },
          });
        } else {
          await tx.rawMaterialStock.create({
            data: {
              materialType: item.materialType,
              name: item.name,
              grade: item.grade || null,
              color: item.color || null,
              unit: item.unit || "KG",
              currentStock: acceptedQuantity,
              vendorId: dto.vendorId || null,
            },
          });
        }
      }

      return createdGrn;
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "MATERIALS",
      action: `Received GRN ${grn.id} from ${dto.supplierName}`,
      entityType: "GrnReceipt",
      entityId: grn.id,
      recordLabel: grn.id,
    });

    return grn;
  }

  async updateReorderLevels(thresholds: { id: string; reorderLevel: number }[]) {
    await this.prisma.$transaction(
      thresholds.map((t) =>
        this.prisma.rawMaterialStock.update({
          where: { id: t.id },
          data: { reorderLevel: t.reorderLevel },
        }),
      ),
    );
    return { success: true };
  }
}

