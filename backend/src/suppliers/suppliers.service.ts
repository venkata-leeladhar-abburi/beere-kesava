import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { ListPartyQueryDto } from "../common/dto/list-party-query.dto";
import { PaginatedResult } from "../common/pagination";
import { PartyStatus, Prisma, UserRole } from "../generated/prisma/client";
import { IdGeneratorService, businessSegment } from "../id-generator/id-generator.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { supplierPrefix } from "../saree-codes/saree-codes";
import { SareeCodesService } from "../saree-codes/saree-codes.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly idGenerator: IdGeneratorService,
    private readonly notifications: NotificationsService,
    private readonly sareeCodes: SareeCodesService,
  ) {}

  async create(dto: CreateSupplierDto) {
    await this.assertFirmExists(dto.firmId);
    // "<BusinessName>-NNN", e.g. "ShivaTraders-001" — the sequence is a single
    // counter shared across all suppliers, not per name.
    const code = await this.idGenerator.nextNamed("SUPPLIER", businessSegment(dto.name));
    const supplier = await this.prisma.supplier.create({ data: { ...dto, firmId: dto.firmId || null, code } });

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

  /** A firm link must point at a real firm — checked up front so a stale id
   *  reads as a clear 404 rather than a foreign-key failure. */
  private async assertFirmExists(firmId: string | null | undefined) {
    if (!firmId) return;
    const firm = await this.prisma.firm.findUnique({ where: { id: firmId }, select: { id: true } });
    if (!firm) {
      throw new NotFoundException(`Firm ${firmId} not found`);
    }
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${id} not found`);
    }
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const existing = await this.findOne(id);
    await this.assertFirmExists(dto.firmId);
    const data = { ...dto, ...(dto.firmId !== undefined ? { firmId: dto.firmId || null } : {}) };
    // The short name (or, without one, the name) is the first segment of
    // every saree code bought from this supplier and printed on its tags. When
    // that segment changes, the supplier's sarees are re-coded in the same
    // transaction — all of it saves, or none of it does.
    const prefixChanges =
      supplierPrefix(dto.name ?? existing.name, dto.shortName !== undefined ? dto.shortName : existing.shortName) !==
      supplierPrefix(existing.name, existing.shortName);
    const updated = prefixChanges
      ? await this.prisma.$transaction(
          async (tx) => {
            const supplier = await tx.supplier.update({ where: { id }, data });
            const purchases = await tx.purchase.findMany({ where: { supplierId: id }, select: { id: true } });
            await this.sareeCodes.recodePurchases(tx, purchases.map((p) => p.id));
            return supplier;
          },
          { timeout: 60_000 },
        )
      : await this.prisma.supplier.update({
          where: { id },
          // "" from a cleared picker means "not connected", same as null.
          data,
        });

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
