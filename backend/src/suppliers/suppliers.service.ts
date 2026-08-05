import { Injectable, NotFoundException } from "@nestjs/common";
import { CreatePartyDto } from "../common/dto/create-party.dto";
import { ListPartyQueryDto } from "../common/dto/list-party-query.dto";
import { UpdatePartyDto } from "../common/dto/update-party.dto";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePartyDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async findAll(
    query: ListPartyQueryDto,
  ): Promise<PaginatedResult<Prisma.SupplierGetPayload<object>>> {
    const where: Prisma.SupplierWhereInput = {
      status: query.status,
      city: query.city,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { contactName: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${id} not found`);
    }
    return supplier;
  }

  async update(id: string, dto: UpdatePartyDto) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }
}
