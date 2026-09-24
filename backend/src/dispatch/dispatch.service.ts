import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { DispatchType, Prisma, UserRole } from "../generated/prisma/client";
import { IdGeneratorService, businessSegment, financialYearCode } from "../id-generator/id-generator.service";
import { NotificationsService } from "../notifications/notifications.service";
import { loadSareeDetails } from "../sales/saree-details";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDispatchDto } from "./dto/create-dispatch.dto";
import { ListDispatchQueryDto } from "./dto/list-dispatch-query.dto";
import { UpdateDispatchDto } from "./dto/update-dispatch.dto";

const include = {
  sarees: true,
  customer: true,
  // Both were omitted before, so the Dispatch History table rendered "—" in
  // its Firm and Dispatched By columns for every row no matter what was stored.
  firm: { select: { id: true, firmName: true } },
  dispatchedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.DispatchRecordInclude;

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly idGenerator: IdGeneratorService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateDispatchDto) {
    // Attribution for the "Dispatched By" column. The id is only written when
    // it resolves to a real user — actorId can carry a stopgap placeholder,
    // and an unmatched value would fail the FK and reject the whole dispatch.
    const dispatchedById = dto.actorId
      ? (await this.prisma.user.findUnique({ where: { id: dto.actorId }, select: { id: true } }))?.id
      : undefined;

    let customer: { code: string | null; name: string; phone: string | null } | null = null;
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

      // QC gates dispatch: an uninspected or failed saree must not leave the
      // building, whichever way it is going. `qcPassed` is tri-state — null is
      // "never inspected", false is a recorded failure — so only an explicit
      // true passes, matching SalesService.create and ScanService.lookup.
      const notQcPassed = wovenRows.filter((r) => r.qcPassed !== true);
      if (notQcPassed.length > 0) {
        const failed = notQcPassed.filter((r) => r.qcPassed === false).map((r) => r.sareeId);
        const uninspected = notQcPassed.filter((r) => r.qcPassed === null).map((r) => r.sareeId);
        throw new BadRequestException(
          [
            failed.length > 0 ? `Saree(s) failed QC: ${failed.join(", ")}` : null,
            uninspected.length > 0 ? `Saree(s) not yet inspected: ${uninspected.join(", ")}` : null,
          ]
            .filter(Boolean)
            .join(". ") + ". They cannot be dispatched.",
        );
      }

      // Anything still unresolved may be a real saree too — one bought from
      // an external supplier, which lives in PurchaseSareeLine instead of
      // BatchSareeRow (see ScanService.lookupExternalPiece, same piece-id
      // convention: "{lineCode}-{pieceNo}"). Dispatching one of these used to
      // 404 outright, so it silently never left "With Us" no matter how many
      // times an operator picked it in Inventory and hit Dispatch.
      const stillMissing = unrecorded.filter((id) => !wovenById.has(id));
      const externalById = new Map<string, { batchId: null; bulkOrderRef: null }>();
      if (stillMissing.length > 0) {
        const parsed = stillMissing
          .map((sareeId) => {
            const m = sareeId.match(/^(.+)-(\d{2,})$/);
            return m ? { sareeId, lineCode: m[1], pieceNo: Number(m[2]) } : null;
          })
          .filter((p): p is { sareeId: string; lineCode: string; pieceNo: number } => p !== null);
        if (parsed.length > 0) {
          const lines = await this.prisma.purchaseSareeLine.findMany({
            where: { code: { in: parsed.map((p) => p.lineCode) } },
            select: {
              code: true, quantity: true, returnedQuantity: true, purchaseId: true,
              color: true, price: true, weight: true, sareeDate: true,
              purchase: { select: { date: true } },
            },
          });
          const lineByCode = new Map(lines.map((l) => [l.code, l]));
          // Saree rows for external purchases are only ever created here, on
          // demand at dispatch — Purchase + PurchaseSareeLine are the sole
          // record of a purchased piece up to this point (see the schema
          // comment on PurchaseSareeLine.code). Without one, this piece has
          // nowhere to be found once it reaches the shop: findShopStock reads
          // dispatched pieces off BatchSareeRow (woven) or Saree (everything
          // else), so a dispatched external piece with neither would silently
          // never appear in Shop Inventory.
          const sareesToCreate: Prisma.SareeCreateManyInput[] = [];
          for (const p of parsed) {
            const line = lineByCode.get(p.lineCode);
            if (!line || p.pieceNo < 1 || p.pieceNo > line.quantity) continue;
            if (p.pieceNo <= line.returnedQuantity) {
              throw new BadRequestException(
                `Saree ${p.sareeId} was returned to the supplier and cannot be dispatched`,
              );
            }
            externalById.set(p.sareeId, { batchId: null, bulkOrderRef: null });
            sareesToCreate.push({
              id: p.sareeId,
              origin: "EXTERNAL",
              purchaseId: line.purchaseId,
              color: line.color,
              costPrice: line.price,
              weightG: line.weight ? Number(line.weight.replace(/[^\d.]/g, "")) || null : null,
              qcDate: line.sareeDate ?? line.purchase.date,
              status: "UNSOLD",
            });
          }
          if (sareesToCreate.length > 0) {
            await this.prisma.saree.createMany({ data: sareesToCreate, skipDuplicates: true });
          }
        }
      }

      const missing = stillMissing.filter((id) => !externalById.has(id));
      if (missing.length > 0) {
        throw new NotFoundException(`Saree(s) not found in inventory: ${missing.join(", ")}`);
      }

      // Finishing does not gate dispatch (product decision — a saree can go to
      // shop or wholesale before finishing wraps up), but QC does, and every
      // woven row reaching this point has passed it. The on-demand
      // InventoryRecord is immediately overwritten to DISPATCHED below, so its
      // QC_PASSED starting status is only ever visible for the instant in
      // between — and it is now always true when it is written.
      await this.prisma.inventoryRecord.createMany({
        data: unrecorded.map((sareeId) => {
          const row = wovenById.get(sareeId);
          const ext = row ? null : externalById.get(sareeId)!;
          return {
            sareeId,
            status: "QC_PASSED" as const,
            rawType: "READY_SAREE" as const,
            batchId: row ? row.batchId : ext!.batchId,
            bulkOrderRef: row ? row.bulkOrderRef : ext!.bulkOrderRef,
          };
        }),
        skipDuplicates: true,
      });
    }

    const pricePerSaree = dto.pricePerSaree ?? 0;
    // The client's exact subtotal wins over the rounded average multiplied
    // back out — but only if the two agree to within that rounding, so a
    // stray total can never be booked against a different per-saree price.
    const averagedTotal = pricePerSaree * dto.sareeIds.length;
    if (dto.totalAmount !== undefined && dto.pricePerSaree !== undefined) {
      const tolerance = 0.5 * dto.sareeIds.length + 0.01;
      if (Math.abs(dto.totalAmount - averagedTotal) > tolerance) {
        throw new BadRequestException(
          `totalAmount ${dto.totalAmount} does not match ${dto.sareeIds.length} saree(s) at ${pricePerSaree} each`,
        );
      }
    }
    const totalAmount = dto.totalAmount ?? averagedTotal;
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
        dispatchedById,
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

    // The shop counter has to know a consignment is on its way before it can
    // receive it, so a SHOP dispatch is pushed to the shop's feed rather than
    // waiting to be spotted in the Incoming list.
    if (dto.type === DispatchType.SHOP) {
      await this.notifications.notifyRole(UserRole.SHOP, "SHOP_DISPATCH_INCOMING_STOCK", {
        dispatchId: created.id,
        challanNumber,
        lrNumber: dto.lrNumber ?? null,
        sareeCount: dto.sareeIds.length,
      });
    }

    // A wholesale dispatch to a customer IS the wholesale sale, so it goes to
    // the admin feed under Wholesale Sales with each saree's type and source.
    // Best-effort: the dispatch is already committed, so a failure building
    // the feed entry must not turn a successful dispatch into an error.
    if (dto.type === DispatchType.WHOLESALE) {
      try {
        const details = await loadSareeDetails(this.prisma, dto.sareeIds);
        await this.notifications.notifyRole(UserRole.ADMIN, "WHOLESALE_DISPATCH_RECORDED", {
          dispatchId: created.id,
          customerName: customer?.name ?? null,
          customerPhone: customer?.phone ?? null,
          invoiceNumber: invoiceNumber ?? null,
          sareeCount: dto.sareeIds.length,
          pricePerSaree,
          totalAmount,
          gstPct,
          grandTotal,
          lrNumber: dto.lrNumber ?? null,
          transportCompany: dto.transportCompany ?? null,
          bulkOrderRef: dto.bulkOrderRef ?? null,
          sarees: dto.sareeIds.map((id) => {
            const d = details.get(id);
            return { sareeId: id, sareeType: d?.sareeType ?? null, source: d?.source ?? null };
          }),
        });
      } catch (err) {
        this.logger.warn(`Wholesale dispatch ${created.id} saved but its notification failed: ${String(err)}`);
      }
    }

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
