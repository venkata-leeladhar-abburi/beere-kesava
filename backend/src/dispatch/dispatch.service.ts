import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { DispatchType, Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDispatchDto } from "./dto/create-dispatch.dto";
import { ListDispatchQueryDto } from "./dto/list-dispatch-query.dto";
import { UpdateDispatchDto } from "./dto/update-dispatch.dto";

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
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : undefined,
        specialInstructions: dto.specialInstructions,
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

  // Fills in transport/receipt details that were skipped at dispatch time
  // (ResumeDispatchModal's "Complete Details" flow) — previously a
  // client-only optimistic patch with no backend endpoint at all, so it
  // never survived a reload.
  async update(id: string, dto: UpdateDispatchDto) {
    await this.findOne(id);

    const updated = await this.prisma.dispatchRecord.update({
      where: { id },
      data: {
        lrNumber: dto.lrNumber,
        transportCompany: dto.transportCompany,
        vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName,
        dispatchDate: dto.dispatchDate ? new Date(dto.dispatchDate) : undefined,
        notes: dto.notes,
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : undefined,
        specialInstructions: dto.specialInstructions,
        pendingTransport: dto.pendingTransport,
        pendingReceipt: dto.pendingReceipt,
      },
    });

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "DISPATCH",
      action: `Updated dispatch record ${id}`,
      entityType: "DispatchRecord",
      entityId: id,
      recordLabel: updated.lrNumber ?? updated.invoiceNumber ?? id,
    });

    return this.findOne(id);
  }

  async remove(id: string, actorId: string) {
    const record = await this.findOne(id);
    const sareeIds = record.sarees.map((s) => s.sareeId);

    // Revert inventory status for all associated sarees
    if (sareeIds.length > 0) {
      await this.prisma.inventoryRecord.updateMany({
        where: { sareeId: { in: sareeIds } },
        data: { status: "FINISHING_COMPLETE" },
      });
    }

    // A dispatch raised from a quotation moves that quotation to DISPATCHED
    // (QuotationsService.dispatch) — deleting the dispatch without undoing
    // that leaves the quotation permanently stuck showing "dispatched" (and
    // its bulk order's Quotations tab with it) even though there's no longer
    // a real dispatch record backing that state.
    if (record.quotationRef) {
      await this.prisma.quotation.update({
        where: { id: record.quotationRef },
        data: { status: "RECEIVED" },
      });
    }

    await this.prisma.dispatchRecord.delete({ where: { id } });

    await this.auditLog.recordAction({
      actorId,
      module: "DISPATCH",
      action: `Deleted dispatch record (${record.sarees.length} sarees)`,
      entityType: "DispatchRecord",
      entityId: id,
      recordLabel: record.lrNumber ?? record.invoiceNumber ?? id,
    });

    return { success: true };
  }
}
