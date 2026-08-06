import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
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
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateFinishingStaffDto) {
    const empId = await this.idGenerator.nextFormatted(FINISHING_STAFF_ID_PREFIX);
    const name = `${dto.firstName} ${dto.lastName}`.trim();
    const staff = await this.prisma.finishingStaff.create({
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

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "FINISHING",
      action: `Added finishing staff ${name}`,
      entityType: "FinishingStaff",
      entityId: staff.id,
      recordLabel: name,
    });

    return staff;
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
    const before = await this.findOne(id);
    const { actorId, ...data } = dto;
    const updated = await this.prisma.finishingStaff.update({ where: { id }, data });

    await this.auditLog.recordAction({
      actorId,
      module: "FINISHING",
      action: `Updated finishing staff ${before.firstName} ${before.lastName}`,
      entityType: "FinishingStaff",
      entityId: id,
      recordLabel: `${before.firstName} ${before.lastName}`,
    });

    return updated;
  }
}
