import { Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFinishingStaffDto } from "./dto/create-finishing-staff.dto";
import { ListFinishingStaffQueryDto } from "./dto/list-finishing-staff-query.dto";
import { UpdateFinishingStaffDto } from "./dto/update-finishing-staff.dto";

const FINISHING_STAFF_ID_PREFIX = "FIN";

@Injectable()
export class FinishingStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateFinishingStaffDto) {
    const empId = await this.idGenerator.nextFormatted(FINISHING_STAFF_ID_PREFIX);
    return this.prisma.finishingStaff.create({
      data: {
        empId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        mobile: dto.mobile,
        email: dto.email,
        specialisation: dto.specialisation,
        notes: dto.notes,
      },
    });
  }

  async findAll(
    query: ListFinishingStaffQueryDto,
  ): Promise<PaginatedResult<Prisma.FinishingStaffGetPayload<object>>> {
    const where: Prisma.FinishingStaffWhereInput = {
      status: query.status,
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { empId: { contains: query.search, mode: "insensitive" } },
              { mobile: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.finishingStaff.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.finishingStaff.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const staff = await this.prisma.finishingStaff.findUnique({ where: { id } });
    if (!staff) {
      throw new NotFoundException(`Finishing staff ${id} not found`);
    }
    return staff;
  }

  async update(id: string, dto: UpdateFinishingStaffDto) {
    await this.findOne(id);
    return this.prisma.finishingStaff.update({ where: { id }, data: dto });
  }
}
