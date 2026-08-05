import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFactoryLoomDto } from "./dto/create-factory-loom.dto";
import { ListFactoryLoomsQueryDto } from "./dto/list-factory-looms-query.dto";
import { UpdateFactoryLoomDto } from "./dto/update-factory-loom.dto";

@Injectable()
export class FactoryLoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFactoryLoomDto) {
    const existing = await this.prisma.factoryLoom.findUnique({
      where: { loomNumber: dto.loomNumber },
    });
    if (existing) {
      throw new ConflictException(`A factory loom with number ${dto.loomNumber} already exists`);
    }
    return this.prisma.factoryLoom.create({ data: dto });
  }

  async findAll(
    query: ListFactoryLoomsQueryDto,
  ): Promise<PaginatedResult<Prisma.FactoryLoomGetPayload<object>>> {
    const where: Prisma.FactoryLoomWhereInput = { status: query.status };

    const [items, total] = await this.prisma.$transaction([
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
