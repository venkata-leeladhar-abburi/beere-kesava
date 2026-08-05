import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDesignDto } from "./dto/create-design.dto";
import { DispatchDesignDto } from "./dto/dispatch-design.dto";
import { ListDesignsQueryDto } from "./dto/list-designs-query.dto";
import { UpdateDesignDto } from "./dto/update-design.dto";

@Injectable()
export class DesignLibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDesignDto) {
    const existing = await this.prisma.designLibrary.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`A design with code ${dto.code} already exists`);
    }
    return this.prisma.designLibrary.create({ data: dto });
  }

  async findAll(
    query: ListDesignsQueryDto,
  ): Promise<PaginatedResult<Prisma.DesignLibraryGetPayload<object>>> {
    const where: Prisma.DesignLibraryWhereInput = {
      typeCode: query.typeCode,
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: "insensitive" } },
              { name: { contains: query.search, mode: "insensitive" } },
              { typeName: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.designLibrary.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.designLibrary.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(code: string) {
    const design = await this.prisma.designLibrary.findUnique({ where: { code } });
    if (!design) {
      throw new NotFoundException(`Design ${code} not found`);
    }
    return design;
  }

  async update(code: string, dto: UpdateDesignDto) {
    await this.findOne(code);
    return this.prisma.designLibrary.update({ where: { code }, data: dto });
  }

  async dispatch(code: string, dto: DispatchDesignDto) {
    await this.findOne(code);
    const weaver = await this.prisma.weaver.findUnique({ where: { id: dto.weaverId } });
    if (!weaver) {
      throw new NotFoundException(`Weaver ${dto.weaverId} not found`);
    }
    return this.prisma.designLibrary.update({
      where: { code },
      data: { weaverId: dto.weaverId, notesForWeaver: dto.notesForWeaver },
    });
  }
}
