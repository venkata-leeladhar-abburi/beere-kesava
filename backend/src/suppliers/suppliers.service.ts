import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { CreatePartyDto } from "../common/dto/create-party.dto";
import { ListPartyQueryDto } from "../common/dto/list-party-query.dto";
import { UpdatePartyDto } from "../common/dto/update-party.dto";
import { PaginatedResult } from "../common/pagination";
import { PartyStatus, Prisma, UserRole } from "../generated/prisma/client";
import { IdGeneratorService, businessSegment } from "../id-generator/id-generator.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly idGenerator: IdGeneratorService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreatePartyDto) {
    // "<BusinessName>-NNN", e.g. "ShivaTraders-001" — the sequence is a single
    // counter shared across all suppliers, not per name.
    const code = await this.idGenerator.nextNamed("SUPPLIER", businessSegment(dto.name));
    const supplier = await this.prisma.supplier.create({ data: { ...dto, code } });

    // A new trading party is who the company's money and material now flow
    // through, so it is announced rather than left to be noticed in a list.
    await this.notifications.notifyRole(UserRole.ADMIN, "SUPPLIER_ADDED", {
      supplierId: supplier.id,
      code,
      name: supplier.name,
      contactName: supplier.contactName,
      city: supplier.city,
      phone: supplier.phone,
    });

    return supplier;
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

    const [items, total] = await Promise.all([
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
    const existing = await this.findOne(id);
    const updated = await this.prisma.supplier.update({ where: { id }, data: dto });

    // Only a real status transition is announced. update() is the generic
    // edit endpoint, so a phone-number correction that re-sends the same
    // status must not read as a deactivation.
    if (dto.status && dto.status !== existing.status) {
      await this.notifications.notifyRole(
        UserRole.ADMIN,
        dto.status === PartyStatus.ACTIVE ? "SUPPLIER_REACTIVATED" : "SUPPLIER_STATUS_CHANGED",
        {
          supplierId: id,
          code: updated.code,
          name: updated.name,
          previousStatus: existing.status,
          status: updated.status,
        },
      );
    }

    return updated;
  }

  async remove(id: string) {
    const supplier = await this.findOne(id);

    try {
      await this.prisma.supplier.delete({ where: { id } });

      await this.auditLog.recordAction({
        module: "SUPPLIERS",
        action: `Deleted supplier ${supplier.name}`,
        entityType: "Supplier",
        entityId: id,
        recordLabel: supplier.name,
      });

      await this.notifications.notifyRole(UserRole.ADMIN, "SUPPLIER_REMOVED", {
        supplierId: id,
        code: supplier.code,
        name: supplier.name,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictException(
          "This supplier has existing records (purchases, payments, etc.) and can't be deleted. Deactivate it instead.",
        );
      }
      throw error;
    }
  }
}
