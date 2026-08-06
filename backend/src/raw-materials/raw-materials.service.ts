import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { MaterialType } from "../generated/prisma/client";

export interface CreateGrnDto {
  vendorId?: string;
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
      include: { vendor: true, items: true },
      orderBy: { createdAt: "desc" },
    });
    return { items: grns };
  }

  async createGrn(dto: CreateGrnDto) {
    const grnId = await this.idGenerator.nextFormatted("GRN-2026");

    const grn = await this.prisma.$transaction(async (tx) => {
      const createdGrn = await tx.grnReceipt.create({
        data: {
          id: grnId,
          vendorId: dto.vendorId || null,
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
            })),
          },
        },
        include: { items: true, vendor: true },
      });

      // Increment / update stock levels
      for (const item of dto.items) {
        const existing = await tx.rawMaterialStock.findFirst({
          where: {
            materialType: item.materialType,
            name: item.name,
            grade: item.grade || null,
            color: item.color || null,
          },
        });

        if (existing) {
          await tx.rawMaterialStock.update({
            where: { id: existing.id },
            data: {
              currentStock: { increment: item.quantity },
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
              currentStock: item.quantity,
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
}
