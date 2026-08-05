import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRateDto } from "./dto/create-rate.dto";
import { ListRatesQueryDto } from "./dto/list-rates-query.dto";
import { UpdateRateDto } from "./dto/update-rate.dto";

@Injectable()
export class RatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRateDto) {
    const existing = await this.prisma.sareeTypeRate.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`A rate with code ${dto.code} already exists`);
    }
    return this.prisma.sareeTypeRate.create({ data: dto });
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

    const [items, total] = await this.prisma.$transaction([
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
    return this.prisma.sareeTypeRate.update({ where: { code }, data: dto });
  }
}
