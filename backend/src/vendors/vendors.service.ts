import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { CreatePartyDto } from "../common/dto/create-party.dto";
import { ListPartyQueryDto } from "../common/dto/list-party-query.dto";
import { UpdatePartyDto } from "../common/dto/update-party.dto";
import { PaginatedResult } from "../common/pagination";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

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

    const [items, total] = await Promise.all([
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

  async remove(id: string) {
    const vendor = await this.findOne(id);

    try {
      await this.prisma.vendor.delete({ where: { id } });

      await this.auditLog.recordAction({
        module: "VENDORS",
        action: `Deleted vendor ${vendor.name}`,
        entityType: "Vendor",
        entityId: id,
        recordLabel: vendor.name,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictException(
          "This vendor has existing records (purchase orders, bills, payments, etc.) and can't be deleted. Deactivate it instead.",
        );
      }
      throw error;
    }
  }
}
