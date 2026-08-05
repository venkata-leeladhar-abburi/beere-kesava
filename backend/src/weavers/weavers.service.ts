import { Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWeaverDto } from "./dto/create-weaver.dto";
import { ListWeaversQueryDto } from "./dto/list-weavers-query.dto";
import { UpdateWeaverDto } from "./dto/update-weaver.dto";

@Injectable()
export class WeaversService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateWeaverDto) {
    const name = `${dto.firstName} ${dto.lastName}`.trim();
    const initials = (dto.initials ?? dto.firstName).toUpperCase().slice(0, 10);

    return this.prisma.weaver.create({
      data: {
        name,
        firstName: dto.firstName,
        lastName: dto.lastName,
        initials,
        village: dto.village,
        cluster: dto.cluster,
        looms: dto.looms ?? 0,
        photoUrl: dto.photoUrl,
        email: dto.email,
        phone: dto.phone,
        bankName: dto.bankName,
        accountNo: dto.accountNo,
        ifsc: dto.ifsc,
      },
    });
  }

  async findAll(
    query: ListWeaversQueryDto,
  ): Promise<PaginatedResult<Prisma.WeaverGetPayload<object>>> {
    const where: Prisma.WeaverWhereInput = {
      status: query.status,
      village: query.village,
      cluster: query.cluster,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.weaver.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.weaver.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const weaver = await this.prisma.weaver.findUnique({ where: { id } });
    if (!weaver) {
      throw new NotFoundException(`Weaver ${id} not found`);
    }
    return weaver;
  }

  async update(id: string, dto: UpdateWeaverDto) {
    await this.findOne(id);
    return this.prisma.weaver.update({ where: { id }, data: dto });
  }
}
