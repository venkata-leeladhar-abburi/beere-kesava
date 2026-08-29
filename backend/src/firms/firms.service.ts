import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { FinancialEntryKind, Prisma } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFinancialEntryDto } from "./dto/create-financial-entry.dto";
import { CreateFirmDto } from "./dto/create-firm.dto";
import { ListFinancialEntriesQueryDto } from "./dto/list-financial-entries-query.dto";
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

    const blockers: string[] = [];
    if (entries > 0) blockers.push(`${entries} financial entr${entries === 1 ? "y" : "ies"}`);
    if (quotations > 0) blockers.push(`${quotations} quotation${quotations === 1 ? "" : "s"}`);
    if (dispatches > 0) blockers.push(`${dispatches} dispatch record${dispatches === 1 ? "" : "s"}`);
    if (supplierPayments > 0) blockers.push(`${supplierPayments} supplier payment${supplierPayments === 1 ? "" : "s"}`);
    if (weaverPayments > 0) blockers.push(`${weaverPayments} weaver payment${weaverPayments === 1 ? "" : "s"}`);
    if (vendorPayments > 0) blockers.push(`${vendorPayments} vendor payment${vendorPayments === 1 ? "" : "s"}`);
    if (invoicePayments > 0) blockers.push(`${invoicePayments} invoice payment${invoicePayments === 1 ? "" : "s"}`);
    if (grnReceipts > 0) blockers.push(`${grnReceipts} GRN receipt${grnReceipts === 1 ? "" : "s"}`);

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
