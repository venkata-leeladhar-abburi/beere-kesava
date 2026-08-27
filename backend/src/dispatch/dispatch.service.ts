import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { DispatchType, Prisma } from "../generated/prisma/client";
import { IdGeneratorService, businessSegment, financialYearCode } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDispatchDto } from "./dto/create-dispatch.dto";
import { ListDispatchQueryDto } from "./dto/list-dispatch-query.dto";
import { UpdateDispatchDto } from "./dto/update-dispatch.dto";

const include = {
  sarees: true,
  customer: true,
  dispatchedBy: true,
} satisfies Prisma.DispatchRecordInclude;

@Injectable()
export class DispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateDispatchDto) {
    let customer: { code: string | null; name: string } | null = null;
    if (dto.type === DispatchType.WHOLESALE && dto.customerId) {
      customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException(`Customer ${dto.customerId} not found`);
      }
    }

    const records = await this.prisma.inventoryRecord.findMany({
      where: { sareeId: { in: dto.sareeIds } },
    });
    // Finishing no longer gates dispatch (product decision — a saree can be
    // sent to shop or wholesale before finishing wraps up); only sarees
    // already dispatched, sold, or flagged for damage review are blocked.
    const notDispatchable: string[] = ["DISPATCHED", "SOLD", "DAMAGED_REVIEW_NEEDED"];
    for (const record of records) {
      if (notDispatchable.includes(record.status)) {
        throw new BadRequestException(
          `Saree ${record.sareeId} is not ready for dispatch (status: ${record.status})`,
        );
      }
    }

    // An InventoryRecord is only written when a saree passes through finishing,
    // a quotation or a sale (see FinishingAssignmentsService.receiveReturn) —
    // so a saree that went straight from QC to the shop has none, and requiring
    // one here made every such dispatch 404. Since finishing no longer gates
    // dispatch, the woven row is the real source of truth: if it exists and QC
    // passed it, the inventory row is opened here on demand.
    const foundIds = new Set(records.map((r) => r.sareeId));
    const unrecorded = dto.sareeIds.filter((id) => !foundIds.has(id));
    if (unrecorded.length > 0) {
      const wovenRows = await this.prisma.batchSareeRow.findMany({
        where: { sareeId: { in: unrecorded } },
        select: { sareeId: true, batchId: true, bulkOrderRef: true, qcPassed: true },
      });
      const wovenById = new Map(wovenRows.map((r) => [r.sareeId!, r]));

      const missing = unrecorded.filter((id) => !wovenById.has(id));
      if (missing.length > 0) {
        throw new NotFoundException(`Saree(s) not found in inventory: ${missing.join(", ")}`);
      }
      const notQcPassed = unrecorded.filter((id) => !wovenById.get(id)!.qcPassed);
      if (notQcPassed.length > 0) {
        throw new BadRequestException(
          `Saree(s) have not passed QC and cannot be dispatched: ${notQcPassed.join(", ")}`,
        );
      }

      await this.prisma.inventoryRecord.createMany({
        data: unrecorded.map((sareeId) => {
          const row = wovenById.get(sareeId)!;
          return {
            sareeId,
            status: "QC_PASSED" as const,
            rawType: "READY_SAREE" as const,
            batchId: row.batchId,
            bulkOrderRef: row.bulkOrderRef,
          };
        }),
        skipDuplicates: true,
      });
    }

    const pricePerSaree = dto.pricePerSaree ?? 0;
    const totalAmount = pricePerSaree * dto.sareeIds.length;
    const gstPct = dto.gstPct ?? 0;
    const grandTotal = totalAmount + (totalAmount * gstPct) / 100;

    // GST invoice numbers must be sequential and collision-free, so they are
    // allocated here rather than accepted from the client (which previously
    // sent `INV-2026-<last 3 digits of Date.now()>` — effectively random,
    // non-monotonic, and colliding for invoices raised in the same second).
    // Scoped per customer, matching the real Invoice.code format
    // (InvoicesService.create) — raiseInvoice is a wholesale-only field (see
    // CreateDispatchDto), so a customer is always resolved by this point.
    if (dto.raiseInvoice && !customer) {
      throw new BadRequestException("raiseInvoice requires a wholesale customerId");
    }
    const invoiceNumber = dto.raiseInvoice
      ? await this.idGenerator.nextScoped("INV", customer!.code ?? businessSegment(customer!.name, "Customer"))
      : undefined;

    // A SHOP dispatch bills nobody, so it raises a Delivery Challan rather than
    // a tax invoice. Its number is allocated here for the same reason invoice
    // numbers are — sequential and collision-free per financial year, never
    // invented client-side. Scoped to the FY so the series restarts each April.
    const challanNumber =
      dto.type === DispatchType.SHOP
        ? await this.idGenerator.nextScoped("DC", financialYearCode())
        : undefined;

    const created = await this.prisma.dispatchRecord.create({
      data: {
        type: dto.type,
        dispatchDate: dto.dispatchDate ? new Date(dto.dispatchDate) : undefined,
        lrNumber: dto.lrNumber,
        transportCompany: dto.transportCompany,
        vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName,
        customerId: dto.customerId,
        invoiceNumber,
        invoiceDate: invoiceNumber ? new Date() : undefined,
        challanNumber,
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
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : undefined,
        specialInstructions: dto.specialInstructions,
        dispatchedById: dto.actorId,
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
      recordLabel: dto.lrNumber ?? invoiceNumber ?? challanNumber ?? created.id,
    });

    return this.findOne(created.id);
  }

  async findAll(
    query: ListDispatchQueryDto,
  ): Promise<PaginatedResult<Prisma.DispatchRecordGetPayload<{ include: typeof include }>>> {
    const where: Prisma.DispatchRecordWhereInput = { type: query.type };

    const [items, total] = await Promise.all([
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
        receiptUrl: dto.receiptUrl,
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

    // Revert inventory status for all associated sarees. Not a blanket
    // FINISHING_COMPLETE: a saree can now be dispatched straight from QC
    // without ever entering finishing, and marking those "finishing complete"
    // on undo invented a step they never went through.
    if (sareeIds.length > 0) {
      const finished = await this.prisma.finishingAssignment.findMany({
        where: { sareeId: { in: sareeIds }, status: "RETURNED" },
        select: { sareeId: true },
      });
      const finishedIds = finished.map((f) => f.sareeId);
      const qcOnlyIds = sareeIds.filter((id) => !finishedIds.includes(id));

      if (finishedIds.length > 0) {
        await this.prisma.inventoryRecord.updateMany({
          where: { sareeId: { in: finishedIds } },
          data: { status: "FINISHING_COMPLETE" },
        });
      }
      if (qcOnlyIds.length > 0) {
        await this.prisma.inventoryRecord.updateMany({
          where: { sareeId: { in: qcOnlyIds } },
          data: { status: "QC_PASSED" },
        });
      }
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
