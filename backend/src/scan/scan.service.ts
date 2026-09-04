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

    // A scanned code with no matching production row (BatchSareeRow) may
    // still be a real saree — one bought from an external supplier, which
    // lives in PurchaseSareeLine instead. Try that before giving up.
    if (!row) return this.lookupExternalPiece(sareeId);

    const [inventory, dispatches, latestSale, latestReturn] = await Promise.all([
      this.prisma.inventoryRecord.findUnique({ where: { sareeId } }),
      this.prisma.dispatchSaree.findMany({
        where: { sareeId },
        include: { dispatch: { select: { type: true, dispatchDate: true } } },
        orderBy: { dispatch: { dispatchDate: "desc" } },
      }),
      this.prisma.saleRecord.findFirst({ where: { sareeId }, orderBy: { date: "desc" } }),
      this.prisma.returnRecord.findFirst({ where: { sareeId }, orderBy: { createdAt: "desc" } }),
    ]);
    const latestQc = row.qcRecords[0];

    // The weaver's own loom digit isn't a DB column — it's encoded in the
    // sareeId itself ({FIRSTNAME}-L{loom}-B{batch}-{seq}), same convention
    // batches.service.ts writes it with and BatchContext.tsx parses it back
    // with on the frontend.
    const weaverLoomMatch = row.weaver ? sareeId.match(/-L(\d+)-B/) : null;

    // A saree counts as SOLD only if its most recent sale hasn't since been
    // returned — a return after the sale date puts it back in sellable stock.
    const sold = !!latestSale && (!latestReturn || latestSale.date > latestReturn.createdAt);

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
      origin: "production" as const,
      batchId: row.batchId,
      recipientType: row.recipientType,
      weaver: row.weaver
        ? { id: row.weaver.id, name: row.weaver.name, loomNumber: weaverLoomMatch ? Number(weaverLoomMatch[1]) : null }
        : null,
      factoryLoom: row.factoryLoom
        ? { id: row.factoryLoom.id, code: row.factoryLoom.code, loomNumber: row.factoryLoom.loomNumber }
        : null,
      design: row.design ? { code: row.design.code, name: row.design.name } : null,
      sareeType: row.sareeType ? { code: row.sareeType.code, type: row.sareeType.type } : null,
      // Worker Staff's Receive Sarees entry — same source the printed tag uses.
      weight: row.receivedWeight ? Number(row.receivedWeight) : null,
      color: row.receivedColor ?? null,
      receivedDate: row.receivedAt,
      batchDate: row.batch.createdAt,
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
      // External-purchase-only fields — always null for a production saree.
      supplier: null,
      invoiceNumber: null,
      serial: null,
      costPrice: null,
    };
  }

  /**
   * A physical external-purchase piece's id is `{lineCode}-{pieceNo}`
   * (buildSareePieceCode/pieceCodeFromLineCode on the frontend) — the line
   * code itself is `{lineCode}-{serial}` where the serial is the purchase's
   * per-line sequence number. Strip the trailing 2-digit piece number to get
   * back to the PurchaseSareeLine.code this piece belongs to.
   */
  private async lookupExternalPiece(sareeId: string) {
    const pieceMatch = sareeId.match(/^(.+)-(\d{2,})$/);
    const lineCode = pieceMatch?.[1];
    const pieceNo = pieceMatch ? Number(pieceMatch[2]) : null;

    const line = lineCode
      ? await this.prisma.purchaseSareeLine.findFirst({
          where: { code: lineCode },
          include: { purchase: { include: { supplier: true } } },
        })
      : null;

    if (!line || pieceNo === null || pieceNo < 1 || pieceNo > line.quantity) {
      throw new NotFoundException(`No saree found for scanned code "${sareeId}"`);
    }

    const serialMatch = lineCode!.match(/-(\d{3,4})$/);
    // A piece already sent back to the supplier is the first
    // `returnedQuantity` positions of the line (frontend's expandSareePieces
    // convention) — not available stock, whichever way this ends up used.
    const returned = pieceNo <= line.returnedQuantity;

    return {
      sareeId,
      origin: "external" as const,
      batchId: null,
      recipientType: null,
      weaver: null,
      factoryLoom: null,
      design: null,
      sareeType: line.sareeType ? { code: null, type: line.sareeType } : null,
      weight: line.weight ? Number(line.weight.replace(/g$/i, "")) || null : null,
      color: line.color ?? null,
      receivedDate: line.purchase.date,
      batchDate: line.purchase.date,
      qc: null,
      finishing: null,
      inventoryStatus: returned ? "RETURNED_TO_SUPPLIER" : null,
      saleEligibility: returned ? ("DAMAGED_REVIEW_NEEDED" as const) : ("PASSED" as const),
      atShop: !returned,
      sellingPrice: Number(line.finalAmount),
      supplier: line.purchase.supplier
        ? { id: line.purchase.supplier.id, name: line.purchase.supplier.name, shortName: line.purchase.supplier.initials }
        : line.purchase.supplierName
          ? { id: null, name: line.purchase.supplierName, shortName: null }
          : null,
      invoiceNumber: line.purchase.invoiceNumber ?? null,
      serial: serialMatch ? serialMatch[1] : null,
      costPrice: Number(line.price),
    };
  }
}
