import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRateDto } from "./dto/create-rate.dto";
import { ListRatesQueryDto } from "./dto/list-rates-query.dto";
import { UpdateRateDto } from "./dto/update-rate.dto";

@Injectable()
export class RatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateRateDto) {
    const existing = await this.prisma.sareeTypeRate.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`A rate with code ${dto.code} already exists`);
    }
    const { actorId, ...data } = dto;
    const rate = await this.prisma.sareeTypeRate.create({ data });

    await this.auditLog.recordAction({
      actorId,
      module: "RATES",
      action: `Added rate ${rate.code}`,
      entityType: "SareeTypeRate",
      entityId: rate.code,
      recordLabel: rate.code,
    });

    return rate;
  }

  async findAll(
    query: ListRatesQueryDto,
  ): Promise<PaginatedResult<Prisma.SareeTypeRateGetPayload<object>>> {
    const where: Prisma.SareeTypeRateWhereInput = query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: "insensitive" } },
            { type: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.sareeTypeRate.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { code: "asc" },
      }),
      this.prisma.sareeTypeRate.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(code: string) {
    const rate = await this.prisma.sareeTypeRate.findUnique({ where: { code } });
    if (!rate) {
      throw new NotFoundException(`Rate ${code} not found`);
    }
    return rate;
  }

  async update(code: string, dto: UpdateRateDto) {
    await this.findOne(code);
    const { actorId, ...data } = dto;
    const updated = await this.prisma.sareeTypeRate.update({ where: { code }, data });

    await this.auditLog.recordAction({
      actorId,
      module: "RATES",
      action: `Updated rate ${code}`,
      entityType: "SareeTypeRate",
      entityId: code,
      recordLabel: code,
    });

    return updated;
  }
}
