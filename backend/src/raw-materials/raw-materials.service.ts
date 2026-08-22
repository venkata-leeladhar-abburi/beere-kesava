import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { IdGeneratorService, businessSegment } from "../id-generator/id-generator.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { MaterialType } from "../generated/prisma/client";
import { fromGrams, toGrams } from "../common/weight-units.util";

export interface CreateGrnDto {
  vendorId: string;
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
    description?: string;
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
      include: {
        vendor: true,
        firm: true,
        items: true,
        receivedBy: true,
        // Surfaces which purchase order(s) this receipt was received
        // against, so a GRN's origin is traceable from the Issue Material
        // screen instead of just showing a bare receipt id.
        purchaseOrders: { select: { id: true, poNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // The Issue Material screen picks a GRN batch by (grnId, materialType) —
    // see MaterialIssueItem.grnBatchId, which is set to the GrnReceipt's id,
    // not a specific GrnItem. Sum what's already been issued against each
    // (grnId, materialType) pair so "available" reflects real remaining
    // stock instead of always showing the as-received quantity.
    const grnIds = grns.map((g) => g.id);
    const issuedItems = grnIds.length
      ? await this.prisma.materialIssueItem.findMany({
          where: {
            grnBatchId: { in: grnIds },
            issue: { status: { not: "CANCELLED" } },
          },
          select: { grnBatchId: true, materialType: true, quantity: true, unit: true },
        })
      : [];
    const issuedGramsByKey = new Map<string, number>();
    for (const item of issuedItems) {
      const key = `${item.grnBatchId}::${item.materialType}`;
      const grams = toGrams(Number(item.quantity), item.unit);
      issuedGramsByKey.set(key, (issuedGramsByKey.get(key) ?? 0) + grams);
    }

    const withAvailability = grns.map((grn) => ({
      ...grn,
      items: grn.items.map((item) => {
        const key = `${grn.id}::${item.materialType}`;
        const issuedGrams = issuedGramsByKey.get(key) ?? 0;
        const receivedGrams = toGrams(Number(item.quantity) - Number(item.rejectedQuantity), item.unit);
        const availableQuantity = Math.max(0, fromGrams(receivedGrams - issuedGrams, item.unit));
        return { ...item, issuedQuantity: fromGrams(issuedGrams, item.unit), availableQuantity };
      }),
    }));

    return { items: withAvailability };
  }

  async createGrn(dto: CreateGrnDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: dto.vendorId } });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${dto.vendorId} not found`);
    }

    // Jari is always counted in Reels/Buns, Warp/Resham always by weight —
    // mixing these up would silently corrupt stock totals (see
    // toGrams/fromGrams) and show a nonsense unit ("12 Reels remaining") on
    // the Issue Material screen for a material that should read in kg.
    for (const item of dto.items) {
      const unit = (item.unit || "KG").trim().toUpperCase();
      if (item.materialType === MaterialType.JARI) {
        if (!["REEL", "REELS", "BUN", "BUNS"].includes(unit)) {
          throw new BadRequestException(`Jari must be received in Reels or Buns, not "${item.unit}"`);
        }
      } else if (!["KG", "G", "GRAM", "GRAMS"].includes(unit)) {
        const label = item.materialType === MaterialType.WARP ? "Warp" : "Resham";
        throw new BadRequestException(`${label} must be received in KG or G, not "${item.unit}"`);
      }
    }

    const grnId = await this.idGenerator.nextScoped("GRN", vendor.code ?? businessSegment(vendor.name, "Vendor"));

    const grn = await this.prisma.$transaction(async (tx) => {
      const createdGrn = await tx.grnReceipt.create({
        data: {
          id: grnId,
          vendorId: dto.vendorId,
          firmId: dto.firmId || null,
          supplierName: dto.supplierName,
          invoiceNo: dto.invoiceNo || null,
          invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : null,
          notes: dto.notes || null,
          receivedById: dto.actorId || null,
          items: {
            // Structured id per material line — "{GRN id}-{position}" mirrors
            // the sequential-id convention used everywhere else (PO-xxx-NNN,
            // GRN-xxx-NNN, EMP-NNN), instead of the frontend previously
            // deriving a barcode label from a slice of the PO's raw uuid.
            create: dto.items.map((item, index) => ({
              itemCode: `${grnId}-${index + 1}`,
              materialType: item.materialType,
              name: item.name,
              description: item.description || null,
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
              vendorId: dto.vendorId,
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

