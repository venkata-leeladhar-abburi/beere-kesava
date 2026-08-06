import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { ListCustomersQueryDto } from "./dto/list-customers-query.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateCustomerDto) {
    const { actorId, ...data } = dto;
    const customer = await this.prisma.customer.create({ data });

    await this.auditLog.recordAction({
      actorId,
      module: "CUSTOMERS",
      action: `Added customer ${customer.name}`,
      entityType: "Customer",
      entityId: customer.id,
      recordLabel: customer.name,
    });

    return customer;
  }

  async findAll(
    query: ListCustomersQueryDto,
  ): Promise<PaginatedResult<Prisma.CustomerGetPayload<object>>> {
    const where: Prisma.CustomerWhereInput = {
      type: query.type,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search } },
              { city: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const before = await this.findOne(id);
    const { actorId, ...data } = dto;
    const updated = await this.prisma.customer.update({ where: { id }, data });

    await this.auditLog.recordAction({
      actorId,
      module: "CUSTOMERS",
      action: `Updated customer ${before.name}`,
      entityType: "Customer",
      entityId: id,
      recordLabel: before.name,
    });

    return updated;
  }
}
