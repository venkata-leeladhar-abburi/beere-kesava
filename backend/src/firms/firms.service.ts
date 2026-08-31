import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { FinancialEntryKind, Prisma, SalesChannel } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFinancialEntryDto } from "./dto/create-financial-entry.dto";
import { CreateFirmDto } from "./dto/create-firm.dto";
import { LinkRetailSalesDto } from "./dto/link-retail-sales.dto";
import { ListFinancialEntriesQueryDto } from "./dto/list-financial-entries-query.dto";
import { ListFirmRetailSalesQueryDto } from "./dto/list-firm-retail-sales-query.dto";
import { ListUnlinkedRetailSalesQueryDto } from "./dto/list-unlinked-retail-sales-query.dto";
import { ListFirmsQueryDto } from "./dto/list-firms-query.dto";
import { UpdateFinancialEntryDto } from "./dto/update-financial-entry.dto";
import { UpdateFirmDto } from "./dto/update-firm.dto";

const FIRM_ID_PREFIX = "FIRM";

@Injectable()
export class FirmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateFirmDto) {
    const id = await this.idGenerator.nextFormatted(FIRM_ID_PREFIX);
    return this.prisma.firm.create({ data: { id, ...dto } });
  }

  async findAll(
    query: ListFirmsQueryDto,
  ): Promise<PaginatedResult<Prisma.FirmGetPayload<object>>> {
    const where: Prisma.FirmWhereInput = query.search
      ? {
          OR: [
            { firmName: { contains: query.search, mode: "insensitive" } },
            { gstNumber: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.firm.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { firmName: "asc" },
      }),
      this.prisma.firm.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const firm = await this.prisma.firm.findUnique({ where: { id } });
    if (!firm) {
      throw new NotFoundException(`Firm ${id} not found`);
    }
    return firm;
  }

  async update(id: string, dto: UpdateFirmDto) {
    await this.findOne(id);
    return this.prisma.firm.update({ where: { id }, data: dto });
  }

  // No cascade/setNull declared on any of these relations (all default to
  // Restrict), so a direct `firm.delete()` on a firm with real activity
  // would surface as an opaque Prisma FK-constraint 500. Count everything
  // first and give the caller a clear reason instead.
  async remove(id: string) {
    await this.findOne(id);

    const [entries, quotations, dispatches, supplierPayments, weaverPayments, vendorPayments, invoicePayments, grnReceipts] =
      await Promise.all([
        this.prisma.firmFinancialEntry.count({ where: { firmId: id } }),
        this.prisma.quotation.count({ where: { firmId: id } }),
        this.prisma.dispatchRecord.count({ where: { firmId: id } }),
        this.prisma.supplierPayment.count({ where: { firmId: id } }),
        this.prisma.weaverPayment.count({ where: { firmId: id } }),
        this.prisma.vendorPayment.count({ where: { firmId: id } }),
        this.prisma.invoicePayment.count({ where: { firmId: id } }),
        this.prisma.grnReceipt.count({ where: { firmId: id } }),
      ]);
    const linkedRetailSales = await this.prisma.saleRecord.count({ where: { firmId: id } });

    const blockers: string[] = [];
    if (entries > 0) blockers.push(`${entries} financial entr${entries === 1 ? "y" : "ies"}`);
    if (quotations > 0) blockers.push(`${quotations} quotation${quotations === 1 ? "" : "s"}`);
    if (dispatches > 0) blockers.push(`${dispatches} dispatch record${dispatches === 1 ? "" : "s"}`);
    if (supplierPayments > 0) blockers.push(`${supplierPayments} supplier payment${supplierPayments === 1 ? "" : "s"}`);
    if (weaverPayments > 0) blockers.push(`${weaverPayments} weaver payment${weaverPayments === 1 ? "" : "s"}`);
    if (vendorPayments > 0) blockers.push(`${vendorPayments} vendor payment${vendorPayments === 1 ? "" : "s"}`);
    if (invoicePayments > 0) blockers.push(`${invoicePayments} invoice payment${invoicePayments === 1 ? "" : "s"}`);
    if (grnReceipts > 0) blockers.push(`${grnReceipts} GRN receipt${grnReceipts === 1 ? "" : "s"}`);
    if (linkedRetailSales > 0)
      blockers.push(
        `${linkedRetailSales} connected retail sale${linkedRetailSales === 1 ? "" : "s"}`,
      );

    if (blockers.length > 0) {
      throw new BadRequestException(
        `Cannot delete this firm — it has ${blockers.join(", ")} recorded against it.`,
      );
    }

    await this.prisma.firm.delete({ where: { id } });
  }

  async addEntry(firmId: string, dto: CreateFinancialEntryDto) {
    await this.findOne(firmId);
    return this.prisma.firmFinancialEntry.create({
      data: {
        firmId,
        kind: dto.kind,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        notes: dto.notes,
      },
    });
  }

  // Manual entries are hand-typed, so they are the one part of a firm's
  // ledger that can be wrong — a typo'd amount, or a row that duplicates a
  // payment now tracked automatically. Both need a way out; entries were
  // previously append-only with no correction path at all.
  private async findEntry(firmId: string, entryId: string) {
    const entry = await this.prisma.firmFinancialEntry.findUnique({ where: { id: entryId } });
    // Scoped to the firm in the path, so an entry id belonging to another
    // firm can't be edited through this firm's route.
    if (!entry || entry.firmId !== firmId) {
      throw new NotFoundException(`Financial entry ${entryId} not found on firm ${firmId}`);
    }
    return entry;
  }

  async updateEntry(firmId: string, entryId: string, dto: UpdateFinancialEntryDto) {
    await this.findEntry(firmId, entryId);
    return this.prisma.firmFinancialEntry.update({
      where: { id: entryId },
      data: {
        kind: dto.kind,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        notes: dto.notes,
      },
    });
  }

  async removeEntry(firmId: string, entryId: string) {
    await this.findEntry(firmId, entryId);
    await this.prisma.firmFinancialEntry.delete({ where: { id: entryId } });
  }

  async listEntries(
    firmId: string,
    query: ListFinancialEntriesQueryDto,
  ): Promise<PaginatedResult<Prisma.FirmFinancialEntryGetPayload<object>>> {
    await this.findOne(firmId);
    const where: Prisma.FirmFinancialEntryWhereInput = { firmId, kind: query.kind };

    const [items, total] = await Promise.all([
      this.prisma.firmFinancialEntry.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { date: "desc" },
      }),
      this.prisma.firmFinancialEntry.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }



  // ── The active retail-sales firm ────────────────────────────────────────────
  // Rather than an accountant ticking every counter sale, one firm is marked as
  // the retail firm and SalesService books new retail sales to it as they are
  // rung up. Manual link/unlink below stays available for corrections — the
  // automatic rule handles the normal case, not every case.

  /** The firm new retail sales are booked to, or null when none is set. */
  async getRetailSalesFirm() {
    return this.prisma.firm.findFirst({ where: { isRetailSalesFirm: true } });
  }

  /**
   * Make this firm the retail firm, and book every currently-unconnected
   * retail sale to it.
   *
   * Sales already booked to another firm are deliberately left alone: switching
   * the rule changes where FUTURE sales go, it does not rewrite closed books.
   * The flag swap and the backfill share one transaction so the system can
   * never end up with two active firms, or an active firm whose backfill
   * half-ran.
   */
  async setRetailSalesFirm(firmId: string, actorId?: string) {
    await this.findOne(firmId);

    const [, , backfilled] = await this.prisma.$transaction([
      // Clear the flag everywhere first — "at most one active firm" is an
      // invariant, and updateMany over the others is cheaper than reading them.
      this.prisma.firm.updateMany({
        where: { isRetailSalesFirm: true, id: { not: firmId } },
        data: { isRetailSalesFirm: false },
      }),
      this.prisma.firm.update({ where: { id: firmId }, data: { isRetailSalesFirm: true } }),
      this.prisma.saleRecord.updateMany({
        where: { channel: SalesChannel.RETAIL, firmId: null },
        data: {
          firmId,
          firmLinkedAt: new Date(),
          firmLinkedById: actorId ?? null,
          firmLinkedAuto: true,
          firmLinkNote: "Booked automatically when this firm was made the retail firm",
        },
      }),
    ]);

    return { firmId, backfilled: backfilled.count };
  }

  /**
   * Stop booking new retail sales automatically. Sales already booked keep
   * their firm — clearing the rule is not a reason to strip a firm's income.
   */
  async clearRetailSalesFirm() {
    const result = await this.prisma.firm.updateMany({
      where: { isRetailSalesFirm: true },
      data: { isRetailSalesFirm: false },
    });
    return { cleared: result.count };
  }

  // ── Retail sales connected to a firm ────────────────────────────────────────
  // A counter sale is recorded by shop staff with no idea which firm's books it
  // belongs in. An accountant makes that call afterwards from the Firms page,
  // which is why the link lives on SaleRecord (nullable) rather than being
  // captured at sale time. Once linked, FirmActivityService counts the sale as
  // realized income for the firm — no second, hand-typed ledger row, so the
  // number can never drift from the sale it came from.

  /** Everything a firm's Retail Sales tab shows for one row. */
  private static readonly SALE_INCLUDE = {
    customer: { select: { id: true, name: true, phone: true } },
    saree: { select: { id: true, color: true, weightG: true } },
    soldBy: { select: { id: true, firstName: true, lastName: true } },
    firmLinkedBy: { select: { id: true, firstName: true, lastName: true } },
    firm: { select: { id: true, firmName: true } },
  } satisfies Prisma.SaleRecordInclude;

  /** Date-window + free-text filter shared by both retail-sale listings. */
  private retailSaleWhere(query: {
    search?: string;
    from?: string;
    to?: string;
  }): Prisma.SaleRecordWhereInput {
    const where: Prisma.SaleRecordWhereInput = { channel: SalesChannel.RETAIL };

    if (query.from || query.to) {
      const date: Prisma.DateTimeFilter = {};
      if (query.from) {
        const from = new Date(query.from);
        if (Number.isNaN(from.getTime())) throw new BadRequestException("Invalid `from` date");
        date.gte = from;
      }
      if (query.to) {
        const to = new Date(query.to);
        if (Number.isNaN(to.getTime())) throw new BadRequestException("Invalid `to` date");
        // `to` is a calendar day, and sales carry a time — take the whole day.
        to.setHours(23, 59, 59, 999);
        date.lte = to;
      }
      where.date = date;
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { saleRef: { contains: search, mode: "insensitive" } },
        { sareeId: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    return where;
  }

  /** Retail sales already booked to this firm. */
  async listRetailSales(firmId: string, query: ListFirmRetailSalesQueryDto) {
    await this.findOne(firmId);
    const where: Prisma.SaleRecordWhereInput = { ...this.retailSaleWhere(query), firmId };

    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
    if (query.soldById) where.soldById = query.soldById;
    // "auto" and "manual" are the two halves of a boolean, so an unset
    // linkType (or "all") must not add a clause at all.
    if (query.linkType === "auto") where.firmLinkedAuto = true;
    if (query.linkType === "manual") where.firmLinkedAuto = false;

    const [items, total, totals] = await Promise.all([
      this.prisma.saleRecord.findMany({
        where,
        include: FirmsService.SALE_INCLUDE,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { date: "desc" },
      }),
      this.prisma.saleRecord.count({ where }),
      this.prisma.saleRecord.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      // Summed across the WHOLE filtered set, not just this page — the tab's
      // revenue tile must not change when the user turns the page.
      totalAmount: Number(totals._sum.amount ?? 0),
    };
  }

  /**
   * The values this firm's retail sales actually contain, for the tab's filter
   * dropdowns. Computed over the firm's whole history rather than the current
   * filter, so choosing one option never empties the others.
   */
  async getRetailSaleFilterOptions(firmId: string) {
    await this.findOne(firmId);
    const where: Prisma.SaleRecordWhereInput = { firmId, channel: SalesChannel.RETAIL };

    const [methods, staff] = await Promise.all([
      this.prisma.saleRecord.groupBy({
        by: ["paymentMethod"],
        where,
        _count: { _all: true },
      }),
      this.prisma.saleRecord.findMany({
        where: { ...where, soldById: { not: null } },
        distinct: ["soldById"],
        select: { soldBy: { select: { id: true, firstName: true, lastName: true } } },
      }),
    ]);

    return {
      paymentMethods: methods
        .filter((m) => m.paymentMethod)
        .map((m) => ({ value: m.paymentMethod as string, count: m._count._all }))
        .sort((a, b) => b.count - a.count),
      soldBy: staff
        .map((s) => s.soldBy)
        .filter((u): u is NonNullable<typeof u> => !!u)
        .map((u) => ({
          id: u.id,
          name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.id,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  /**
   * The pool to pick from when connecting sales. Unlinked by default; with
   * `includeLinked` the caller also sees sales sitting on another firm, each
   * carrying its current `firm` so the UI can warn before moving it.
   */
  async listConnectableRetailSales(query: ListUnlinkedRetailSalesQueryDto) {
    const where: Prisma.SaleRecordWhereInput = {
      ...this.retailSaleWhere(query),
      ...(query.includeLinked ? {} : { firmId: null }),
    };

    const [items, total] = await Promise.all([
      this.prisma.saleRecord.findMany({
        where,
        include: FirmsService.SALE_INCLUDE,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { date: "desc" },
      }),
      this.prisma.saleRecord.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  /**
   * Book the named sales to this firm. All-or-nothing: if any ref is unknown,
   * is not a retail sale, or is already on this firm, nothing is written —
   * a half-applied bulk link is worse than a rejected one.
   */
  async linkRetailSales(firmId: string, dto: LinkRetailSalesDto, actorId?: string) {
    await this.findOne(firmId);

    const saleRefs = Array.from(new Set(dto.saleRefs.map((r) => r.trim()).filter(Boolean)));
    if (saleRefs.length === 0) {
      throw new BadRequestException("No sale references supplied");
    }

    const sales = await this.prisma.saleRecord.findMany({
      where: { saleRef: { in: saleRefs } },
      select: { saleRef: true, channel: true, firmId: true },
    });

    const found = new Set(sales.map((s) => s.saleRef));
    const missing = saleRefs.filter((r) => !found.has(r));
    if (missing.length > 0) {
      throw new NotFoundException(`Sale(s) not found: ${missing.join(", ")}`);
    }

    const nonRetail = sales.filter((s) => s.channel !== SalesChannel.RETAIL);
    if (nonRetail.length > 0) {
      throw new BadRequestException(
        `Only retail sales can be connected to a firm — ${nonRetail
          .map((s) => s.saleRef)
          .join(", ")} ${nonRetail.length === 1 ? "is" : "are"} not retail.`,
      );
    }

    const alreadyHere = sales.filter((s) => s.firmId === firmId);
    if (alreadyHere.length > 0) {
      throw new BadRequestException(
        `Already connected to this firm: ${alreadyHere.map((s) => s.saleRef).join(", ")}`,
      );
    }

    // Sales sitting on a different firm are MOVED, not rejected — one sale
    // belongs to exactly one firm, and re-linking is how a mistake is fixed.
    const moved = sales.filter((s) => s.firmId && s.firmId !== firmId).length;

    await this.prisma.saleRecord.updateMany({
      where: { saleRef: { in: saleRefs } },
      data: {
        firmId,
        firmLinkedAt: new Date(),
        firmLinkedById: actorId ?? null,
        firmLinkedAuto: false,
        firmLinkNote: dto.note ?? null,
      },
    });

    return { firmId, linked: saleRefs.length, moved, saleRefs };
  }

  /** Disconnect one sale from this firm, leaving the sale itself untouched. */
  async unlinkRetailSale(firmId: string, saleRef: string) {
    await this.findOne(firmId);

    const sale = await this.prisma.saleRecord.findUnique({
      where: { saleRef },
      select: { saleRef: true, firmId: true },
    });
    // Scoped to the firm in the path, so a sale on another firm cannot be
    // disconnected through this firm's route.
    if (!sale || sale.firmId !== firmId) {
      throw new NotFoundException(`Sale ${saleRef} is not connected to firm ${firmId}`);
    }

    return this.prisma.saleRecord.update({
      where: { saleRef },
      data: { firmId: null, firmLinkedAt: null, firmLinkedById: null, firmLinkedAuto: false, firmLinkNote: null },
      include: FirmsService.SALE_INCLUDE,
    });
  }

  async getLedgerSummary(firmId: string) {
    await this.findOne(firmId);
    const entries = await this.prisma.firmFinancialEntry.groupBy({
      by: ["kind"],
      where: { firmId },
      _sum: { amount: true },
    });

    const totals: Record<FinancialEntryKind, number> = {
      [FinancialEntryKind.INCOME]: 0,
      [FinancialEntryKind.EXPENSE]: 0,
      [FinancialEntryKind.MISC]: 0,
    };
    for (const entry of entries) {
      totals[entry.kind] = Number(entry._sum.amount ?? 0);
    }

    return {
      firmId,
      income: totals[FinancialEntryKind.INCOME],
      expense: totals[FinancialEntryKind.EXPENSE],
      misc: totals[FinancialEntryKind.MISC],
      balance: totals[FinancialEntryKind.INCOME] - totals[FinancialEntryKind.EXPENSE],
    };
  }
}
