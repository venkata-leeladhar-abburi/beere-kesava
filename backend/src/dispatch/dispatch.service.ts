import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { DispatchType, Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDispatchDto } from "./dto/create-dispatch.dto";
import { ListDispatchQueryDto } from "./dto/list-dispatch-query.dto";

const include = {
  sarees: true,
  customer: true,
} satisfies Prisma.DispatchRecordInclude;

@Injectable()
export class DispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateDispatchDto) {
    if (dto.type === DispatchType.WHOLESALE && dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException(`Customer ${dto.customerId} not found`);
      }
    }

    const records = await this.prisma.inventoryRecord.findMany({
      where: { sareeId: { in: dto.sareeIds } },
    });
    const foundIds = new Set(records.map((r) => r.sareeId));
    const missing = dto.sareeIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Saree(s) not found in inventory: ${missing.join(", ")}`);
    }
    for (const record of records) {
      if (record.status !== "FINISHING_COMPLETE") {
        throw new BadRequestException(
          `Saree ${record.sareeId} is not ready for dispatch (status: ${record.status})`,
        );
      }
    }

    const pricePerSaree = dto.pricePerSaree ?? 0;
    const totalAmount = pricePerSaree * dto.sareeIds.length;
    const gstPct = dto.gstPct ?? 0;
    const grandTotal = totalAmount + (totalAmount * gstPct) / 100;

    const created = await this.prisma.dispatchRecord.create({
      data: {
        type: dto.type,
        lrNumber: dto.lrNumber,
        transportCompany: dto.transportCompany,
        vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName,
        customerId: dto.customerId,
        invoiceNumber: dto.invoiceNumber,
        invoiceDate: dto.invoiceNumber ? new Date() : undefined,
        pricePerSaree: dto.pricePerSaree,
        totalAmount,
        gstPct: dto.gstPct,
        grandTotal,
        firmId: dto.firmId,
        paymentDueDate: dto.paymentDueDate ? new Date(dto.paymentDueDate) : undefined,
        bulkOrderRef: dto.bulkOrderRef,
        quotationRef: dto.quotationRef,
        pendingTransport: dto.pendingTransport ?? false,
        pendingReceipt: dto.pendingReceipt ?? false,
        notes: dto.notes,
      },
    });

    await this.prisma.dispatchSaree.createMany({
      data: dto.sareeIds.map((sareeId) => ({ dispatchId: created.id, sareeId })),
    });
    await this.prisma.inventoryRecord.updateMany({
      where: { sareeId: { in: dto.sareeIds } },
      data: { status: "DISPATCHED" },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "DISPATCH",
      action: `Dispatched ${dto.sareeIds.length} saree(s) (${dto.type})`,
      entityType: "DispatchRecord",
      entityId: created.id,
      recordLabel: dto.lrNumber ?? dto.invoiceNumber ?? created.id,
    });

    return this.findOne(created.id);
  }

  async findAll(
    query: ListDispatchQueryDto,
  ): Promise<PaginatedResult<Prisma.DispatchRecordGetPayload<{ include: typeof include }>>> {
    const where: Prisma.DispatchRecordWhereInput = { type: query.type };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.dispatchRecord.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { dispatchDate: "desc" },
        include,
      }),
      this.prisma.dispatchRecord.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const record = await this.prisma.dispatchRecord.findUnique({ where: { id }, include });
    if (!record) {
      throw new NotFoundException(`Dispatch ${id} not found`);
    }
    return record;
  }
}
