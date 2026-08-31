import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ListGrnsQueryDto } from "./dto/list-grns-query.dto";
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
    // PurchaseOrderItem.id this line was received against. The receiving
    // screen walks the PO's lines one by one, so the pairing is known
    // exactly here — persisting it removes the need for downstream code to
    // re-guess it from materialType + name. Omitted for ad-hoc receipts.
    poItemId?: string;
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

  async listGrns(query: ListGrnsQueryDto = {}) {
    const createdAt =
      query.from || query.to
        ? { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) }
        : undefined;

    const grns = await this.prisma.grnReceipt.findMany({
      where: createdAt ? { createdAt } : undefined,
      ...(query.limit ? { take: query.limit } : {}),
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

    // Sum what's already been issued so "available" reflects real remaining
    // stock rather than the as-received quantity.
    //
    // Issuances made since MaterialIssueItem.grnItemId exists point at one
    // exact GrnItem line, so they're attributed to it directly. Older rows
    // only recorded (grnBatchId, materialType); those are still counted, but
    // spread across every line of that receipt sharing the material type —
    // the finest attribution their data supports.
    const grnIds = grns.map((g) => g.id);
    const issuedItems = grnIds.length
      ? await this.prisma.materialIssueItem.findMany({
          where: {
            grnBatchId: { in: grnIds },
            issue: { status: { not: "CANCELLED" } },
          },
          select: { grnBatchId: true, grnItemId: true, materialType: true, quantity: true, unit: true },
        })
      : [];

    const issuedGramsByItemId = new Map<string, number>();
    const legacyGramsByTypeKey = new Map<string, number>();
    for (const issued of issuedItems) {
      const grams = toGrams(Number(issued.quantity), issued.unit);
      if (issued.grnItemId) {
        issuedGramsByItemId.set(issued.grnItemId, (issuedGramsByItemId.get(issued.grnItemId) ?? 0) + grams);
      } else {
        const key = `${issued.grnBatchId}::${issued.materialType}`;
        legacyGramsByTypeKey.set(key, (legacyGramsByTypeKey.get(key) ?? 0) + grams);
      }
    }

    const withAvailability = grns.map((grn) => {
      // Legacy (un-attributed) issuances are divided evenly between the lines
      // of the same material type on this receipt, so the receipt's total
      // still reconciles even though the per-line split is an estimate.
      const lineCountByType = new Map<string, number>();
      for (const item of grn.items) {
        lineCountByType.set(item.materialType, (lineCountByType.get(item.materialType) ?? 0) + 1);
      }

      return {
        ...grn,
        items: grn.items.map((item) => {
          const legacyTotal = legacyGramsByTypeKey.get(`${grn.id}::${item.materialType}`) ?? 0;
          const legacyShare = legacyTotal / (lineCountByType.get(item.materialType) || 1);
          const issuedGrams = (issuedGramsByItemId.get(item.id) ?? 0) + legacyShare;
          const receivedGrams = toGrams(Number(item.quantity) - Number(item.rejectedQuantity), item.unit);
          const availableQuantity = Math.max(0, fromGrams(receivedGrams - issuedGrams, item.unit));
          return {
            ...item,
            receivedQuantity: fromGrams(receivedGrams, item.unit),
            issuedQuantity: fromGrams(issuedGrams, item.unit),
            availableQuantity,
          };
        }),
      };
    });

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

    // A wrong poItemId would satisfy the foreign key while quietly attaching
    // this delivery to another vendor's order — and every downstream screen
    // now trusts that link for receipt codes and prices. Check it belongs to
    // an order raised with this vendor before writing it.
    const poItemIds = [...new Set(dto.items.map((i) => i.poItemId).filter((id): id is string => !!id))];
    if (poItemIds.length > 0) {
      const valid = await this.prisma.purchaseOrderItem.findMany({
        where: { id: { in: poItemIds }, purchaseOrder: { vendorId: dto.vendorId } },
        select: { id: true },
      });
      const validIds = new Set(valid.map((i) => i.id));
      const stray = poItemIds.filter((id) => !validIds.has(id));
      if (stray.length > 0) {
        throw new BadRequestException(
          `Purchase order line(s) ${stray.join(", ")} do not belong to an order for this vendor`,
        );
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
              poItemId: item.poItemId || null,
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

