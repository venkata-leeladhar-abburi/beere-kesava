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
    if (dto.loomNumber) {
      const existing = await this.prisma.factoryLoom.findUnique({
        where: { loomNumber: dto.loomNumber },
      });
      if (existing) {
        throw new ConflictException(`A factory loom with number ${dto.loomNumber} already exists`);
      }
    }

    // The display code continues the LOOM sequence — the loom after Loom-002
    // is Loom-003. Nobody types a loom number any more, so when one isn't
    // supplied the (unique) loomNumber column just carries the same code
    // rather than a second, differently-shaped identifier.
    const code = await this.idGenerator.nextNamed("LOOM", "Loom");
    let finalLoomNumber = dto.loomNumber ?? code;
    // Guard the unique column against a legacy row that already typed this
    // exact label in by hand — take the next free code instead of failing.
    while (
      !dto.loomNumber &&
      (await this.prisma.factoryLoom.findUnique({ where: { loomNumber: finalLoomNumber } }))
    ) {
      finalLoomNumber = await this.idGenerator.nextNamed("LOOM", "Loom");
    }

    return this.prisma.factoryLoom.create({
      data: { ...dto, loomNumber: finalLoomNumber, code: dto.loomNumber ? code : finalLoomNumber },
    });
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
