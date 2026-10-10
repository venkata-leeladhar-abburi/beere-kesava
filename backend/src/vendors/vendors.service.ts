import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { ListPartyQueryDto } from "../common/dto/list-party-query.dto";
import { PaginatedResult } from "../common/pagination";
import { normalizeMobile } from "../common/phone.util";
import { PartyStatus, Prisma, UserRole } from "../generated/prisma/client";
import { IdGeneratorService, businessSegment } from "../id-generator/id-generator.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVendorDto } from "./dto/create-vendor.dto";
import { UpdateVendorDto } from "./dto/update-vendor.dto";

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly idGenerator: IdGeneratorService,
    private readonly notifications: NotificationsService,
  ) {}

  // Nothing in the schema stops the same vendor being added twice (`code` is
  // unique, but it is generated per-create), so a double-submitted Add Vendor
  // form used to land two identical rows. Phone is the vendor's real identity
  // — matched on the normalised last 10 digits, since "+91…" and bare forms
  // are the same number — with an exact name match as the fallback for
  // vendors recorded without one.
  private async assertNotDuplicate(dto: CreateVendorDto) {
    const phone = dto.phone ? normalizeMobile(dto.phone) : "";
    const existing = await this.prisma.vendor.findFirst({
      where: phone
        ? { phone: { endsWith: phone } }
        : { name: { equals: dto.name, mode: "insensitive" } },
      select: { name: true, code: true },
    });
    if (existing) {
      throw new ConflictException(
        `Vendor "${existing.name}"${existing.code ? ` (${existing.code})` : ""} already exists with these details.`,
      );
    }
  }

  /** A default firm must point at a real firm — checked up front so a stale id
   *  reads as a clear 404 rather than a foreign-key failure. */
  private async assertFirmExists(firmId: string | null | undefined) {
    if (!firmId) return;
    const firm = await this.prisma.firm.findUnique({ where: { id: firmId }, select: { id: true } });
    if (!firm) {
      throw new NotFoundException(`Firm ${firmId} not found`);
    }
  }

  async create(dto: CreateVendorDto) {
    await this.assertNotDuplicate(dto);
    await this.assertFirmExists(dto.firmId);
    // "<BusinessName>-NNN", e.g. "ShivaTraders-001" — the sequence is a single
    // counter shared across all vendors, not per name.
    const code = await this.idGenerator.nextNamed("VENDOR", businessSegment(dto.name));
    const vendor = await this.prisma.vendor.create({ data: { ...dto, firmId: dto.firmId || null, code } });

    // A new trading party is who the company's money and material now flow
    // through, so it is announced rather than left to be noticed in a list.
    await this.notifications.notifyRole(UserRole.ADMIN, "VENDOR_ADDED", {
      vendorId: vendor.id,
      code,
      name: vendor.name,
      contactName: vendor.contactName,
      city: vendor.city,
      phone: vendor.phone,
    });

    return vendor;
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

  async update(id: string, dto: UpdateVendorDto) {
    const existing = await this.findOne(id);
    await this.assertFirmExists(dto.firmId);
    const updated = await this.prisma.vendor.update({
      where: { id },
      // "" from a cleared picker means "no default firm", same as null.
      data: { ...dto, ...(dto.firmId !== undefined ? { firmId: dto.firmId || null } : {}) },
    });

    // Only a real status transition is announced. update() is the generic
    // edit endpoint, so a phone-number correction that re-sends the same
    // status must not read as a deactivation.
    if (dto.status && dto.status !== existing.status) {
      await this.notifications.notifyRole(
        UserRole.ADMIN,
        dto.status === PartyStatus.ACTIVE ? "VENDOR_REACTIVATED" : "VENDOR_STATUS_CHANGED",
        {
          vendorId: id,
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

      await this.notifications.notifyRole(UserRole.ADMIN, "VENDOR_REMOVED", {
        vendorId: id,
        code: vendor.code,
        name: vendor.name,
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
