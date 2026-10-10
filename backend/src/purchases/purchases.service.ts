import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma, PurchaseDiscountType, PurchasePaymentStatus, SupplierReturnStatus } from "../generated/prisma/client";
import { IdGeneratorService, businessSegment } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { SareeCodesService } from "../saree-codes/saree-codes.service";
import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { CreatePurchaseSareeLineDto } from "./dto/create-purchase-saree-line.dto";
import { ListPurchasesQueryDto } from "./dto/list-purchases-query.dto";
import { UpdatePurchaseDto } from "./dto/update-purchase.dto";

const EXT_PURCHASE_ID_PREFIX = "EXT";

const firmSelect = { select: { id: true, firmName: true } } as const;
const include = { supplier: true, sareeLines: true, firm: firmSelect } satisfies Prisma.PurchaseInclude;
// "summary" list view (see ListPurchasesQueryDto.view) — keeps sareeLines
// (callers like the External Purchases table derive buying/selling/profit
// totals from price/sellPercent/quantity per line) but excludes the
// base64 imageUrl/pieceImageUrls columns, which are what actually blow up
// response size and stall past the frontend's request timeout. Callers that
// need photos fetch the single purchase (GET /purchases/:id, always "full").
const summarySareeLineSelect = {
  id: true, purchaseId: true, code: true, weight: true, sareeDate: true,
  sareeType: true, color: true, price: true, sellPercent: true, quantity: true,
  finalAmount: true, notes: true, returnedQuantity: true, returnedPieceNos: true,
} satisfies Prisma.PurchaseSareeLineSelect;
const summaryInclude = {
  supplier: true,
  firm: firmSelect,
  sareeLines: { select: summarySareeLineSelect },
} satisfies Prisma.PurchaseInclude;

/** Pieces still with us across a purchase's lines — bought minus returned to
 * the supplier. This is the one meaning of Purchase.sareeCount; the frontend's
 * table, drawer and barcode print all count the same way. */
export function piecesWithUs(lines: { quantity?: number; returnedQuantity?: number }[]): number {
  return lines.reduce((sum, l) => {
    const qty = l.quantity ?? 1;
    return sum + Math.max(0, qty - Math.min(l.returnedQuantity ?? 0, qty));
  }, 0);
}

/** Rounds a rupee figure to whole paise. */
function toPaise(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface PurchaseBill {
  subtotal: number;
  discountType: PurchaseDiscountType | null;
  discountValue: number;
  discountAmount: number;
  gstPercent: number;
  gstAmount: number;
  billAmount: number;
}

/**
 * What a purchase costs us, from its saree lines:
 *   subtotal  = buying price x quantity, across every line
 *   discount  = % of subtotal, or a flat rupee amount (never more than subtotal)
 *   GST       = gstPercent of (subtotal - discount)
 *   bill      = subtotal - discount + GST
 * The subtotal uses the full quantity bought, not what's left after returns —
 * the supplier's invoice doesn't shrink when a piece goes back. Selling
 * price / markup is deliberately not involved: the discount only changes
 * what we pay, never a saree's own cost or selling price.
 * Mirrored on the frontend by computePurchaseBill (supplier-types.ts).
 */
export function computeBill(
  lines: { price: number | Prisma.Decimal; quantity?: number | null }[],
  discountType: PurchaseDiscountType | null | undefined,
  discountValue: number | null | undefined,
  gstPercent: number | null | undefined,
): PurchaseBill {
  const subtotal = toPaise(
    lines.reduce((sum, l) => sum + Number(l.price) * (l.quantity && l.quantity > 0 ? l.quantity : 1), 0),
  );
  const value = Math.max(0, Number(discountValue) || 0);
  const type = value > 0 && discountType ? discountType : null;
  if (type === PurchaseDiscountType.PERCENT && value > 100) {
    throw new BadRequestException("Discount percentage can't be more than 100%");
  }
  if (type === PurchaseDiscountType.AMOUNT && value > subtotal) {
    throw new BadRequestException("Discount amount can't be more than the sarees' total");
  }
  const discountAmount =
    type === PurchaseDiscountType.PERCENT
      ? toPaise((subtotal * value) / 100)
      : type === PurchaseDiscountType.AMOUNT
        ? toPaise(value)
        : 0;
  const taxable = toPaise(subtotal - discountAmount);
  const gst = Math.max(0, Number(gstPercent) || 0);
  const gstAmount = toPaise((taxable * gst) / 100);
  return {
    subtotal,
    discountType: type,
    discountValue: type ? value : 0,
    discountAmount,
    gstPercent: gst,
    gstAmount,
    billAmount: toPaise(taxable + gstAmount),
  };
}

function lineData(l: CreatePurchaseSareeLineDto, idx: number) {
  const price = l.price;
  const sellPercent = l.sellPercent ?? 0;
  const quantity = l.quantity ?? 1;
  return {
    code: l.code || `LINE-${idx + 1}`,
    weight: l.weight,
    sareeDate: l.date ? new Date(l.date) : undefined,
    sareeType: l.sareeType,
    color: l.color,
    price,
    sellPercent,
    quantity,
    finalAmount: l.finalAmount ?? (price + (price * sellPercent) / 100) * quantity,
    notes: l.notes,
    imageUrl: l.imageUrl,
    pieceImageUrls: l.pieceImageUrls ?? [],
    returnedQuantity: Math.min(l.returnedQuantity ?? 0, quantity),
    returnedPieceNos: (l.returnedPieceNos ?? []).filter((n) => n >= 1 && n <= quantity),
  };
}

type StoredLine = { id: string; code: string; returnedQuantity: number; returnedPieceNos: number[] };

export interface LinePlan {
  kept: { existing: StoredLine; line: CreatePurchaseSareeLineDto; idx: number }[];
  created: { line: CreatePurchaseSareeLineDto; idx: number }[];
  removedIds: string[];
  /** The submitted lines with each kept line's stored returned count/pieces. */
  effective: CreatePurchaseSareeLineDto[];
}

/**
 * Matches the lines an edit submits against the stored ones: by `id` when
 * the client sent it, otherwise by line code (each code appears once per
 * purchase). Unmatched submitted lines are new; unmatched stored lines were
 * removed.
 */
export function planLineChanges(stored: StoredLine[], submitted: CreatePurchaseSareeLineDto[]): LinePlan {
  const unmatched = new Map(stored.map((l) => [l.id, l]));
  const kept: LinePlan["kept"] = [];
  const created: LinePlan["created"] = [];
  const effective: CreatePurchaseSareeLineDto[] = [];

  submitted.forEach((line, idx) => {
    let match = line.id ? unmatched.get(line.id) : undefined;
    if (!match && line.code) {
      match = [...unmatched.values()].find((l) => l.code === line.code);
    }
    if (match) {
      unmatched.delete(match.id);
      kept.push({ existing: match, line, idx });
      effective.push({ ...line, returnedQuantity: match.returnedQuantity, returnedPieceNos: match.returnedPieceNos });
    } else {
      created.push({ line, idx });
      effective.push(line);
    }
  });

  return { kept, created, removedIds: [...unmatched.keys()], effective };
}

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly sareeCodes: SareeCodesService,
  ) {}

  async create(dto: CreatePurchaseDto) {
    let supplier: { code: string | null; name: string } | null = null;
    if (dto.supplierId) {
      supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
      if (!supplier) {
        throw new NotFoundException(`Supplier ${dto.supplierId} not found`);
      }
    } else if (!dto.supplierName) {
      throw new BadRequestException("Provide either supplierId or supplierName");
    }
    await this.assertFirmExists(dto.firmId);

    const sareeCount = dto.sarees.length > 0 ? piecesWithUs(dto.sarees) : (dto.sareeCount ?? 0);
    // Scoped per supplier (registered or not) — an unregistered ("Other,
    // enter manually") supplier still gets its own independent sequence,
    // keyed off its free-text name rather than a real Tier-1 code.
    const supplierSegment = supplier
      ? supplier.code ?? businessSegment(supplier.name, "Supplier")
      : businessSegment(dto.supplierName!, "Supplier");
    const bill = computeBill(dto.sarees, dto.discountType, dto.discountValue, dto.gstPercent);
    const id = await this.idGenerator.nextScoped(EXT_PURCHASE_ID_PREFIX, supplierSegment);

    // The form builds new line codes from the supplier short name it has
    // loaded; recodePurchases normalises them against what's stored now (a
    // stale cached short name would otherwise mint a mismatched code) and
    // retires any alias that pointed at one of these codes.
    return this.prisma.$transaction(async (tx) => {
      await tx.purchase.create({
        data: {
          id,
          supplierId: dto.supplierId,
          supplierName: dto.supplierId ? undefined : dto.supplierName,
          location: dto.location,
          firmId: dto.firmId,
          date: dto.date ? new Date(dto.date) : undefined,
          sareeCount,
          gstNumber: dto.gstNumber,
          invoiceNumber: dto.invoiceNumber,
          ...bill,
          // A new purchase has nothing paid against it yet; payments recorded
          // later move it to PARTIAL / PAID (recomputeStatus).
          status: PurchasePaymentStatus.PENDING,
          notes: dto.notes,
          invoiceFileName: dto.invoiceFileName,
          invoiceFileUrl: dto.invoiceFileUrl,
          addedById: dto.addedById,
          sareeLines: { create: dto.sarees.map((l, idx) => lineData(l, idx)) },
        },
      });
      await this.sareeCodes.recodePurchases(tx, [id]);
      return tx.purchase.findUniqueOrThrow({ where: { id }, include });
    });
  }

  async findAll(
    query: ListPurchasesQueryDto,
  ): Promise<PaginatedResult<Prisma.PurchaseGetPayload<{ include: typeof include }>>> {
    const where: Prisma.PurchaseWhereInput = {
      supplierId: query.supplierId,
      status: query.status,
      firmId: query.firmId,
    };
    const summary = query.view === "summary";

    const [items, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { date: "desc" },
        include: summary ? summaryInclude : include,
      }),
      this.prisma.purchase.count({ where }),
    ]);

    // "summary" sareeLines are missing imageUrl/pieceImageUrls (see
    // summarySareeLineSelect) — filled in with empty placeholders so the
    // response shape matches "full" and BackendPurchase.sareeLines can stay
    // a plain (non-optional) array on the frontend.
    const shaped = summary
      ? items.map((item) => ({
          ...item,
          sareeLines: item.sareeLines.map((l) => ({ ...l, imageUrl: null, pieceImageUrls: [] as string[] })),
        }))
      : (items as Prisma.PurchaseGetPayload<{ include: typeof include }>[]);

    return { items: shaped, total, page: query.page, pageSize: query.pageSize };
  }

  private async assertFirmExists(firmId: string) {
    const firm = await this.prisma.firm.findUnique({ where: { id: firmId }, select: { id: true } });
    if (!firm) {
      throw new NotFoundException(`Firm ${firmId} not found`);
    }
  }

  /**
   * A purchase is paid only by the firm it is booked to, so its firm can't
   * move out from under payments already made: once a different firm has paid
   * against it, the books would show one firm owing and another paying.
   */
  private async assertFirmChangeAllowed(purchaseId: string, firmId: string) {
    await this.assertFirmExists(firmId);
    const paidElsewhere = await this.prisma.supplierPayment.findFirst({
      where: { purchaseId, firmId: { not: null }, NOT: { firmId } },
      select: { firm: { select: { firmName: true } } },
    });
    if (paidElsewhere) {
      throw new BadRequestException(
        `Can't change the firm — ${paidElsewhere.firm?.firmName ?? "another firm"} has already paid against this purchase.`,
      );
    }
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findUnique({ where: { id }, include });
    if (!purchase) {
      throw new NotFoundException(`Purchase ${id} not found`);
    }
    return purchase;
  }

  /**
   * Writes a planLineChanges result: removed lines are deleted (refused if
   * any return was ever raised against them), kept lines are updated in
   * place. New lines are created by the caller alongside the purchase update.
   */
  private async applyLineChanges(tx: Prisma.TransactionClient, purchaseId: string, plan: LinePlan) {
    if (plan.removedIds.length > 0) {
      const withReturns = await tx.supplierReturnRequest.findMany({
        where: { sareeLineId: { in: plan.removedIds } },
        select: { sareeLine: { select: { code: true } } },
        distinct: ["sareeLineId"],
      });
      if (withReturns.length > 0) {
        throw new BadRequestException(
          `Can't remove ${withReturns.map((r) => r.sareeLine.code).join(", ")} — sarees on it have been returned to the supplier or are on a debit note.`,
        );
      }
      await tx.purchaseSareeLine.deleteMany({ where: { id: { in: plan.removedIds }, purchaseId } });
    }

    if (plan.kept.length > 0) {
      const pending = await tx.supplierReturnRequest.findMany({
        where: { sareeLineId: { in: plan.kept.map((k) => k.existing.id) }, status: SupplierReturnStatus.PENDING },
        select: { sareeLineId: true, quantity: true },
      });
      for (const { existing, line, idx } of plan.kept) {
        const data = lineData(line, idx);
        const onHold =
          existing.returnedQuantity +
          pending.filter((r) => r.sareeLineId === existing.id).reduce((sum, r) => sum + r.quantity, 0);
        if (data.quantity < onHold) {
          throw new BadRequestException(
            `${existing.code} can't go below ${onHold} piece(s) — that many are returned or awaiting a return decision.`,
          );
        }
        await tx.purchaseSareeLine.update({
          where: { id: existing.id },
          // The stored code stays: a saved line is only ever re-coded by
          // SareeCodesService, which also moves every record of its pieces.
          // Writing the form's code here would rename the line alone and
          // orphan its sales, dispatches and stock.
          data: {
            ...data,
            code: existing.code,
            returnedQuantity: existing.returnedQuantity,
            returnedPieceNos: existing.returnedPieceNos,
          },
        });
      }
    }
  }

  async update(id: string, dto: UpdatePurchaseDto) {
    const existing = await this.findOne(id);

    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
      if (!supplier) {
        throw new NotFoundException(`Supplier ${dto.supplierId} not found`);
      }
    }
    if (dto.firmId && dto.firmId !== existing.firmId) {
      await this.assertFirmChangeAllowed(id, dto.firmId);
    }

    // Lines are matched to the stored ones and updated in place (see
    // planLineChanges) rather than deleted and recreated — return requests
    // and debit notes point at a line's id, so recreating it both broke those
    // links and was refused outright by the database once a return existed.
    // Returned counts stay whatever the server holds: they only ever move
    // through Supplier Returns, never through this form.
    const linePlan = dto.sarees ? planLineChanges(existing.sareeLines, dto.sarees) : undefined;
    const effectiveLines = linePlan?.effective;

    const sareeCount = effectiveLines ? piecesWithUs(effectiveLines) : dto.sareeCount;

    // The bill is recalculated when the form sends its pricing (discount /
    // GST), or when the lines change on a purchase whose bill is already
    // calculated. A pre-existing purchase with a hand-typed bill (subtotal
    // null) keeps that bill through line-only edits — a photo upload or a
    // return must not silently rewrite what we owe.
    const pricingSent =
      dto.discountType !== undefined || dto.discountValue !== undefined || dto.gstPercent !== undefined;
    const recalcBill = pricingSent || (!!dto.sarees && existing.subtotal !== null);
    const bill = recalcBill
      ? computeBill(
          effectiveLines ?? existing.sareeLines,
          dto.discountType !== undefined ? dto.discountType : existing.discountType,
          dto.discountValue ?? Number(existing.discountValue),
          dto.gstPercent ?? Number(existing.gstPercent),
        )
      : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (linePlan) {
        await this.applyLineChanges(tx, id, linePlan);
      }
      await tx.purchase.update({
        where: { id },
        data: {
          supplierId: dto.supplierId,
          supplierName: dto.supplierId ? null : dto.supplierName,
          location: dto.location,
          // "" is never a valid firm; an omitted or blank value leaves it as is.
          firmId: dto.firmId || undefined,
          date: dto.date ? new Date(dto.date) : undefined,
          sareeCount,
          gstNumber: dto.gstNumber,
          invoiceNumber: dto.invoiceNumber,
          ...(bill ?? {}),
          notes: dto.notes,
          invoiceFileName: dto.invoiceFileName,
          invoiceFileUrl: dto.invoiceFileUrl,
          ...(linePlan && linePlan.created.length > 0
            ? { sareeLines: { create: linePlan.created.map(({ line, idx }) => lineData(line, idx)) } }
            : {}),
        },
      });
      // A changed invoice number or supplier re-codes this purchase's sarees
      // everywhere they're recorded (see SareeCodesService), in this same
      // transaction.
      await this.sareeCodes.recodePurchases(tx, [id]);
      return tx.purchase.findUniqueOrThrow({ where: { id }, include });
    });

    // A changed bill moves the line between paid and owed: payments already
    // linked to this purchase stay exactly as recorded, only the
    // PENDING / PARTIAL / PAID status is re-derived against the new total.
    // Older purchases whose status was set by hand have no linked payments
    // to derive from — their status is left as it was.
    const linkedPayments = bill && Number(existing.billAmount) !== bill.billAmount
      ? await this.prisma.supplierPayment.count({ where: { purchaseId: id } })
      : 0;
    if (linkedPayments > 0) {
      await this.recomputeStatus(id);
      return this.findOne(id);
    }
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    // sareeLines cascade with the purchase (onDelete: Cascade).
    await this.prisma.purchase.delete({ where: { id } });
  }

  /**
   * Derives and persists a purchase's payment status from the sum of
   * SupplierPayments linked to it vs its billAmount — mirrors
   * VendorBillsService.recomputeStatus. Called whenever a supplier payment
   * against a purchase is created, so status is never a manual/approval
   * step; it always reflects what has actually been paid.
   */
  async recomputeStatus(purchaseId: string): Promise<void> {
    const purchase = await this.prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (!purchase) {
      throw new NotFoundException(`Purchase ${purchaseId} not found`);
    }

    const paidAggregate = await this.prisma.supplierPayment.aggregate({
      where: { purchaseId },
      _sum: { amount: true },
    });
    const paidTotal = Number(paidAggregate._sum.amount || 0);
    const billAmount = Number(purchase.billAmount);

    let status: PurchasePaymentStatus;
    if (paidTotal >= billAmount) {
      status = PurchasePaymentStatus.PAID;
    } else if (paidTotal > 0) {
      status = PurchasePaymentStatus.PARTIAL;
    } else {
      status = PurchasePaymentStatus.PENDING;
    }

    if (status !== purchase.status) {
      await this.prisma.purchase.update({ where: { id: purchaseId }, data: { status } });
    }
  }
}
