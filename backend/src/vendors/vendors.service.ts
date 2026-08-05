import { Injectable, NotFoundException } from "@nestjs/common";
import { CreatePartyDto } from "../common/dto/create-party.dto";
import { ListPartyQueryDto } from "../common/dto/list-party-query.dto";
import { UpdatePartyDto } from "../common/dto/update-party.dto";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePartyDto) {
    return this.prisma.vendor.create({ data: dto });
  }

  async findAll(
    query: ListPartyQueryDto,
  ): Promise<PaginatedResult<Prisma.VendorGetPayload<object>>> {
    const where: Prisma.VendorWhereInput = {
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
      this.prisma.vendor.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${id} not found`);
    }
    return vendor;
  }

  async update(id: string, dto: UpdatePartyDto) {
    await this.findOne(id);
    return this.prisma.vendor.update({ where: { id }, data: dto });
  }
}
