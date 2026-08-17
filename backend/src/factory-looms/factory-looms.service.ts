import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFactoryLoomDto } from "./dto/create-factory-loom.dto";
import { ListFactoryLoomsQueryDto } from "./dto/list-factory-looms-query.dto";
import { UpdateFactoryLoomDto } from "./dto/update-factory-loom.dto";

@Injectable()
export class FactoryLoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateFactoryLoomDto) {
    const existing = await this.prisma.factoryLoom.findUnique({
      where: { loomNumber: dto.loomNumber },
    });
    if (existing) {
      throw new ConflictException(`A factory loom with number ${dto.loomNumber} already exists`);
    }
    // "Loom-NNN" — the operator-entered loomNumber ("BKB-F-06") stays a
    // separate field; this is the sequential id shown wherever the loom is
    // referenced elsewhere (material issue/return, design dispatch).
    const code = await this.idGenerator.nextNamed("LOOM", "Loom");
    return this.prisma.factoryLoom.create({ data: { ...dto, code } });
  }

  async findAll(
    query: ListFactoryLoomsQueryDto,
  ): Promise<PaginatedResult<Prisma.FactoryLoomGetPayload<object>>> {
    const where: Prisma.FactoryLoomWhereInput = { status: query.status };

    const [items, total] = await Promise.all([
      this.prisma.factoryLoom.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { loomNumber: "asc" },
      }),
      this.prisma.factoryLoom.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const loom = await this.prisma.factoryLoom.findUnique({ where: { id } });
    if (!loom) {
      throw new NotFoundException(`Factory loom ${id} not found`);
    }
    return loom;
  }

  async update(id: string, dto: UpdateFactoryLoomDto) {
    await this.findOne(id);
    return this.prisma.factoryLoom.update({ where: { id }, data: dto });
  }
}
