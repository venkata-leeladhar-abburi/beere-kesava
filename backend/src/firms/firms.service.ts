import { Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { FinancialEntryKind, Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFinancialEntryDto } from "./dto/create-financial-entry.dto";
import { CreateFirmDto } from "./dto/create-firm.dto";
import { ListFinancialEntriesQueryDto } from "./dto/list-financial-entries-query.dto";
import { ListFirmsQueryDto } from "./dto/list-firms-query.dto";
import { UpdateFirmDto } from "./dto/update-firm.dto";

@Injectable()
export class FirmsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFirmDto) {
    return this.prisma.firm.create({ data: dto });
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
