import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import {
  Prisma,
  SalesChannel,
  SareeOrigin,
  SareeStatus,
  UserRole,
  WhatsAppMessageKind,
} from "../generated/prisma/client";
import { IdGeneratorService, businessSegment, nameSegment } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsAppService } from "../whatsapp/whatsapp.service";
import { CreateReturnDto } from "./dto/create-return.dto";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { ListReturnQueryDto } from "./dto/list-return-query.dto";
import { ListSaleQueryDto } from "./dto/list-sale-query.dto";
import { RegisterDispatchedReturnsDto } from "./dto/register-dispatched-returns.dto";
import { RegisterReturnedSareeDto } from "./dto/register-returned-saree.dto";
import {
  RegisterReturnedSareeItemDto,
  RegisterReturnedSareesDto,
} from "./dto/register-returned-sarees.dto";

const saleInclude = {
  saree: { include: { sareeType: true } },
  customer: true,
  soldBy: { select: { id: true, firstName: true, lastName: true, role: true } },
} satisfies Prisma.SaleRecordInclude;

const returnInclude = {
  saree: true,
} satisfies Prisma.ReturnRecordInclude;

/** One returned saree as the shop's Inventory screen shows it. */
export interface ReturnStockItem {
  returnRef: string;
  sareeId: string;
  /** Which bucket it belongs in — decided by whether we have the original sale. */
  category: "retail" | "wholesale";
  returnDate: string;
  reason: string | null;
  refundAmount: number | null;
  photoUrl: string | null;
  /** True once it has been sent into sellable stock. */
  inInventory: boolean;
  /** The customer who brought it back, or the vendor who sent it. */
  source: string | null;
  saleRef: string | null;
  saleDate: string | null;
  designCode: string | null;
  sareeTypeCode: string | null;
  sareeTypeLabel: string | null;
  color: string | null;
  weightG: number | null;
  costPrice: number | null;
  retailPrice: number | null;
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  async createSale(dto: CreateSaleDto) {
    // The real production pipeline (BatchSareeRow → QcRecord) never writes a
    // `Saree` row — that table only exists to satisfy SaleRecord/ReturnRecord's
    // FK. So availability is decided the same way InventoryService.findAll()
    // decides it: a clean QC pass, not already dispatched, not already sold,
    // not flagged for damage review — NOT gated on finishing/InventoryRecord
    // status, since a saree counts as "in stock" the moment QC passes.
    const row = await this.prisma.batchSareeRow.findUnique({ where: { sareeId: dto.sareeId } });
    if (!row) {
      // A wholesale return was never woven here, so it has no BatchSareeRow at
      // all — it exists only as a hand-registered Saree. Once it has been sent
      // into inventory it is ordinary shop stock and must be sellable, so it
      // takes its own path rather than failing the woven-saree checks below.
      const registered = await this.prisma.saree.findUnique({ where: { id: dto.sareeId } });
      if (!registered) {
        throw new NotFoundException(`Saree ${dto.sareeId} not found`);
      }
      return this.sellRegisteredSaree(dto, registered);
    }
    if (!row.qcPassed) {
      throw new BadRequestException(`Saree ${dto.sareeId} has not passed QC yet`);
    }
    const [dispatches, alreadySold, inventory] = await Promise.all([
      this.prisma.dispatchSaree.findMany({
        where: { sareeId: dto.sareeId },
        include: { dispatch: { select: { type: true, dispatchDate: true } } },
        orderBy: { dispatch: { dispatchDate: "desc" } },
      }),
      this.prisma.saleRecord.findFirst({ where: { sareeId: dto.sareeId }, orderBy: { date: "desc" } }),
      this.prisma.inventoryRecord.findUnique({ where: { sareeId: dto.sareeId } }),
    ]);
    // A SHOP dispatch is what puts the saree on the shop floor, so it is a
    // precondition of a counter sale rather than a bar to one; only a
    // WHOLESALE dispatch takes the goods out of the business. Blocking on any
    // dispatch at all made every saree unsellable the moment it reached the
    // shop it was sent to.
    const latestDispatch = dispatches[0]?.dispatch ?? null;
    if (latestDispatch?.type === "WHOLESALE") {
      throw new BadRequestException(
        `Saree ${dto.sareeId} has already been dispatched to a wholesale customer`,
      );
    }
    if (dto.channel === SalesChannel.RETAIL && latestDispatch?.type !== "SHOP") {
      throw new BadRequestException(
        `Saree ${dto.sareeId} has not been dispatched to the shop yet — it cannot be sold at the counter`,
      );
    }
    if (alreadySold) {
      // A piece we sold, took back and put on the shelf again is sellable a
      // second time — the bar is only a sale that nothing has undone since.
      const latestReturn = await this.prisma.returnRecord.findFirst({
        where: { sareeId: dto.sareeId },
        orderBy: { createdAt: "desc" },
      });
      const backOnShelf = latestReturn?.restocked === true && latestReturn.createdAt > alreadySold.date;
      if (!backOnShelf) {
        throw new BadRequestException(`Saree ${dto.sareeId} has already been sold`);
      }
    }
    if (inventory?.status === "DAMAGED_REVIEW_NEEDED") {
      throw new BadRequestException(`Saree ${dto.sareeId} is flagged for damage review`);
    }
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }
    const expectedType = dto.channel === SalesChannel.WHOLESALE ? "WHOLESALE" : "RETAIL";
    if (customer.type !== expectedType) {
      throw new BadRequestException(
        `${dto.channel === SalesChannel.WHOLESALE ? "Wholesale" : "Retail"} sales require a ${expectedType.toLowerCase()} customer (${customer.name} is ${customer.type.toLowerCase()})`,
      );
    }

    // "RETAIL-<Customer>-NNN", scoped per customer; wholesale sales mirror the
    // same shape ("WHOLESALE-<Customer>-NNN") since no separate format was
    // ever specified for that channel.
    const salePrefix = dto.channel === SalesChannel.WHOLESALE ? "WHOLESALE" : "RETAIL";
    const saleSegment =
      dto.channel === SalesChannel.WHOLESALE
        ? customer.code ?? businessSegment(customer.name, "Customer")
        : customer.code ?? nameSegment(customer.name, "Customer");
    const saleRef = await this.idGenerator.nextScoped(salePrefix, saleSegment);
    const sareeStatus = dto.channel === SalesChannel.WHOLESALE ? "WHOLESALE" : "RETAIL";

    await this.prisma.$transaction([
      // Upsert rather than update: this is the first time this sareeId ever
      // touches the `Saree` table, so the row doesn't exist yet.
      this.prisma.saree.upsert({
        where: { id: dto.sareeId },
        create: {
          id: dto.sareeId,
          origin: row.recipientType === "FACTORY_LOOM" || row.factoryLoomId ? "FACTORY_LOOM" : "WEAVER",
          weaverId: row.weaverId,
          factoryLoomId: row.factoryLoomId,
          batchId: row.batchId,
          designCode: row.designCode,
          sareeTypeCode: row.sareeTypeCode,
          status: sareeStatus,
        },
        update: { status: sareeStatus },
      }),
      this.prisma.saleRecord.create({
        data: {
          saleRef,
          sareeId: dto.sareeId,
          channel: dto.channel,
          customerId: dto.customerId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          paymentRef: dto.paymentRef,
          soldById: dto.actorId,
        },
      }),
      // Pulls the saree out of the shop-stock browse list
      // (InventoryService.findAll excludes it via the SaleRecord check above
      // regardless, but this keeps InventoryRecord.status accurate for
      // anything else that reads it). Upsert: a saree that was never sent
      // through finishing has no InventoryRecord row yet.
      this.prisma.inventoryRecord.upsert({
        where: { sareeId: dto.sareeId },
        create: { sareeId: dto.sareeId, status: "SOLD", rawType: "READY_SAREE", batchId: row.batchId },
        update: { status: "SOLD" },
      }),
    ]);

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "SALES",
      action: `Recorded sale ${saleRef} of saree ${dto.sareeId} (${dto.channel})`,
      entityType: "SaleRecord",
      entityId: saleRef,
      recordLabel: saleRef,
      newValue: String(dto.amount),
    });

    const sale = await this.findOneSale(saleRef);

    // Fire-and-forget: a WhatsApp outage must never fail or roll back a sale.
    // sendTemplate persists its own failures to WhatsAppMessage, so a failed
    // notification is recoverable/retryable rather than lost.
    void this.notifySuperAdminsOfSale(sale, dto.actorId).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Retail bill WhatsApp notify failed for ${saleRef}: ${message}`);
    });

    return sale;
  }

  /**
   * Sells a piece that entered stock as a wholesale return: it has a `Saree`
   * row and nothing else — no batch, no QC record, no dispatch — so the woven
   * pipeline's checks in createSale cannot apply to it. The one gate that does
   * apply is the same one the shop sees: it must have been sent to inventory,
   * which is exactly what UNSOLD means for a registered return.
   */
  private async sellRegisteredSaree(
    dto: CreateSaleDto,
    saree: Prisma.SareeGetPayload<object>,
  ) {
    if (saree.status !== SareeStatus.UNSOLD) {
      throw new BadRequestException(
        saree.status === SareeStatus.RETURNED
          ? `Saree ${dto.sareeId} is a return still waiting to be sent to inventory`
          : `Saree ${dto.sareeId} has already been sold`,
      );
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }
    const expectedType = dto.channel === SalesChannel.WHOLESALE ? "WHOLESALE" : "RETAIL";
    if (customer.type !== expectedType) {
      throw new BadRequestException(
        `${dto.channel === SalesChannel.WHOLESALE ? "Wholesale" : "Retail"} sales require a ${expectedType.toLowerCase()} customer (${customer.name} is ${customer.type.toLowerCase()})`,
      );
    }

    const salePrefix = dto.channel === SalesChannel.WHOLESALE ? "WHOLESALE" : "RETAIL";
    const saleSegment =
      dto.channel === SalesChannel.WHOLESALE
        ? customer.code ?? businessSegment(customer.name, "Customer")
        : customer.code ?? nameSegment(customer.name, "Customer");
    const saleRef = await this.idGenerator.nextScoped(salePrefix, saleSegment);
    const sareeStatus = dto.channel === SalesChannel.WHOLESALE ? "WHOLESALE" : "RETAIL";

    await this.prisma.$transaction([
      this.prisma.saree.update({ where: { id: dto.sareeId }, data: { status: sareeStatus } }),
      this.prisma.saleRecord.create({
        data: {
          saleRef,
          sareeId: dto.sareeId,
          channel: dto.channel,
          customerId: dto.customerId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          paymentRef: dto.paymentRef,
          soldById: dto.actorId,
        },
      }),
      this.prisma.inventoryRecord.upsert({
        where: { sareeId: dto.sareeId },
        create: { sareeId: dto.sareeId, status: "SOLD", rawType: "RETURN" },
        update: { status: "SOLD" },
      }),
    ]);

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "SALES",
      action: `Recorded sale ${saleRef} of returned saree ${dto.sareeId} (${dto.channel})`,
      entityType: "SaleRecord",
      entityId: saleRef,
      recordLabel: saleRef,
      newValue: String(dto.amount),
    });

    const sale = await this.findOneSale(saleRef);
    void this.notifySuperAdminsOfSale(sale, dto.actorId).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Retail bill WhatsApp notify failed for ${saleRef}: ${message}`);
    });
    return sale;
  }

  /**
   * Pushes a bill summary to every SUPERADMIN on WhatsApp after a retail sale.
   * Wholesale sales are excluded — those go through the dispatch/invoice flow
   * and would double up on notifications.
   */
  private async notifySuperAdminsOfSale(
    sale: Prisma.SaleRecordGetPayload<{ include: typeof saleInclude }>,
    actorId?: string,
  ): Promise<void> {
    if (sale.channel !== SalesChannel.RETAIL) {
      return;
    }

    const [recipients, actor] = await Promise.all([
      this.prisma.user.findMany({ where: { role: UserRole.SUPERADMIN, status: "ACTIVE" } }),
      actorId ? this.prisma.user.findUnique({ where: { id: actorId } }) : Promise.resolve(null),
    ]);

    const staffName = actor ? `${actor.firstName} ${actor.lastName}` : "Shop Staff";

    for (const admin of recipients) {
      if (!admin.mobile) continue;
      await this.whatsapp.sendTemplate({
        campaignName: "bk_retail_bill",
        destination: admin.mobile,
        recipientName: `${admin.firstName} ${admin.lastName}`,
        templateParams: [
          "Beere Kesava Silks",
          sale.saleRef,
          this.whatsapp.sanitiseParam(sale.customer.name),
          "1",
          Number(sale.amount).toFixed(2),
          "—",
          this.whatsapp.sanitiseParam(staffName),
        ],
        kind: WhatsAppMessageKind.RETAIL_BILL,
        relatedType: "SaleRecord",
        relatedId: sale.saleRef,
        sentById: actorId,
      });
    }
  }

  async findAllSales(
    query: ListSaleQueryDto,
  ): Promise<PaginatedResult<Prisma.SaleRecordGetPayload<{ include: typeof saleInclude }>>> {
    const where: Prisma.SaleRecordWhereInput = { channel: query.channel };

    const [items, total] = await Promise.all([
      this.prisma.saleRecord.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { date: "desc" },
        include: saleInclude,
      }),
      this.prisma.saleRecord.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOneSale(saleRef: string) {
    const record = await this.prisma.saleRecord.findUnique({
      where: { saleRef },
      include: saleInclude,
    });
    if (!record) {
      throw new NotFoundException(`Sale ${saleRef} not found`);
    }
    return record;
  }

  /**
   * Registers a wholesale return consignment whose pieces were never in the
   * system: each arrives with no barcode, so it is created from the operator's
   * description under the tag id they physically attached, and a return is
   * booked against it. The whole consignment is one transaction, so a
   * half-registered batch can never exist.
   *
   * The pieces land HELD, not in stock: Saree.status RETURNED, ReturnRecord
   * .restocked false and no InventoryRecord at all. Only
   * `sendReturnToInventory` below makes a returned piece sellable — that is the
   * explicit decision the shop makes after inspecting it.
   *
   * createReturn() handles the other case, where we sold the saree ourselves.
   */
  async registerReturnedSarees(dto: RegisterReturnedSareesDto) {
    const ids = dto.items.map((i) => i.sareeId?.trim()).filter((id): id is string => !!id);
    const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
    if (duplicate) {
      throw new BadRequestException(`Tag id ${duplicate} is used twice in this consignment.`);
    }
    if (ids.length) {
      const clash = await this.prisma.saree.findFirst({ where: { id: { in: ids } } });
      if (clash) {
        throw new ConflictException(
          `Saree ${clash.id} already exists — use a tag id that is not already in use.`,
        );
      }
    }

    const sourceName = dto.sourceName.trim();
    const prepared: {
      sareeId: string;
      returnRef: string;
      reason: string;
      sareeTypeCode?: string;
      item: RegisterReturnedSareeItemDto;
    }[] = [];

    for (const item of dto.items) {
      const tagId = item.sareeId?.trim();

      // Resolved up front and rejected when unknown rather than silently
      // dropped: the operator's description is the only record of this piece.
      // When there is no physical tag, the saree type is also what the
      // generated id is built from, so it stops being optional.
      let sareeTypeCode: string | undefined;
      const typed = item.sareeType?.trim();
      if (typed) {
        const sareeType = await this.prisma.sareeTypeRate.findFirst({
          where: {
            OR: [
              { code: { equals: typed, mode: "insensitive" } },
              { type: { equals: typed, mode: "insensitive" } },
            ],
          },
        });
        if (!sareeType) {
          throw new BadRequestException(`Saree type "${item.sareeType}" is not a configured saree type.`);
        }
        sareeTypeCode = sareeType.code;
      } else if (!tagId) {
        throw new BadRequestException(
          "A saree with no tag id needs a saree type — it is used to generate an id.",
        );
      }

      // "<Vendor>-NNN" — this untracked path has no registered Customer to read
      // a type from, so it always reads as a business name, matching the
      // wholesale flow this registration form is built for.
      const returnRef = await this.idGenerator.nextNamed("RET", businessSegment(sourceName, "Return"));

      // No physical tag to read: mint a clean id of our own — "NR" (not in
      // records) plus the saree type and vendor, so it stays legible in
      // inventory even though nothing is stuck on the piece.
      const sareeId = tagId
        ?? await this.idGenerator.nextNamed(
          "SAREE_NR",
          `NR-${sareeTypeCode}-${businessSegment(sourceName, "Return")}`,
        );

      const note = item.reasonNote?.trim();
      prepared.push({
        sareeId,
        returnRef,
        reason: note ? `${item.reason} — ${note}` : item.reason,
        sareeTypeCode,
        item,
      });
    }

    await this.prisma.$transaction(
      prepared.flatMap((p) => [
        this.prisma.saree.create({
          data: {
            id: p.sareeId,
            origin: SareeOrigin.EXTERNAL,
            sareeTypeCode: p.sareeTypeCode,
            weightG: p.item.weightG,
            costPrice: p.item.costPrice,
            color: p.item.color?.trim() || undefined,
            sourceName,
            // Held for inspection — not sellable until sent to inventory.
            status: SareeStatus.RETURNED,
          },
        }),
        this.prisma.returnRecord.create({
          data: {
            returnRef: p.returnRef,
            sareeId: p.sareeId,
            reason: p.reason,
            refundAmount: p.item.costPrice,
            restocked: false,
            photoUrl: p.item.photoUrl,
          },
        }),
      ]),
    );

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "SALES",
      action: `Registered wholesale return of ${prepared.length} saree(s) from ${sourceName} (${prepared.map((p) => p.returnRef).join(", ")})`,
      entityType: "ReturnRecord",
      entityId: prepared[0].returnRef,
      recordLabel: prepared[0].returnRef,
    });

    return Promise.all(prepared.map((p) => this.findOneReturn(p.returnRef)));
  }

  /** Single-piece wholesale return — the bulk path with one item. */
  async registerReturnedSaree(dto: RegisterReturnedSareeDto) {
    const [record] = await this.registerReturnedSarees({
      actorId: dto.actorId,
      sourceName: dto.sourceName,
      items: [
        {
          sareeId: dto.sareeId,
          reason: dto.reason,
          weightG: dto.weightG,
          costPrice: dto.costPrice,
          sareeType: dto.sareeType,
          color: dto.color,
          photoUrl: dto.photoUrl,
        },
      ],
    });
    return record;
  }

  /**
   * A wholesale buyer sending back part of a consignment we dispatched to them.
   *
   * This is the third return path, and it exists because the other two cannot
   * cover it. `createReturn` needs a SaleRecord, and a WHOLESALE dispatch does
   * not write one — dispatching is a goods movement, the invoice is raised
   * separately — so a dispatched saree is not "sold" as far as that method is
   * concerned. `registerReturnedSarees` is for pieces with no prior record at
   * all, and creates the Saree row itself, so it would collide on a saree we
   * already have. Here the saree exists and the dispatch is the proof of where
   * it went, so the DispatchRecord takes the place of the sale.
   *
   * Pieces land HELD, exactly like every other return: Saree.status RETURNED
   * and ReturnRecord.restocked false. `sendReturnToInventory` is still the only
   * thing that puts one back on the shelf.
   */
  async registerDispatchedReturns(dto: RegisterDispatchedReturnsDto) {
    const ids = dto.items.map((i) => i.sareeId.trim());
    const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
    if (duplicate) {
      throw new BadRequestException(`Saree ${duplicate} is listed twice on this return.`);
    }

    const dispatch = await this.prisma.dispatchRecord.findUnique({
      where: { id: dto.dispatchId },
      include: { sarees: true, customer: true },
    });
    if (!dispatch) {
      throw new NotFoundException(`Dispatch ${dto.dispatchId} not found`);
    }
    if (dispatch.type !== "WHOLESALE") {
      throw new BadRequestException(
        "Only a wholesale dispatch can be returned this way — a shop dispatch is our own stock moving between our own premises.",
      );
    }
    if (!dispatch.customer) {
      throw new BadRequestException(
        `Dispatch ${dto.dispatchId} has no wholesale customer on it, so there is nobody to credit the return to.`,
      );
    }

    const onDispatch = new Set(dispatch.sarees.map((s) => s.sareeId));
    const notOnDispatch = ids.filter((id) => !onDispatch.has(id));
    if (notOnDispatch.length > 0) {
      throw new BadRequestException(
        `Saree(s) were not on this dispatch: ${notOnDispatch.join(", ")}`,
      );
    }

    // A piece already sitting in the returns pile must not be returned twice.
    // An older return that has since been restocked is fine — the piece went
    // back out and has come back again.
    const openReturns = await this.prisma.returnRecord.findMany({
      where: { sareeId: { in: ids }, restocked: false },
      select: { sareeId: true, returnRef: true },
    });
    if (openReturns.length > 0) {
      throw new BadRequestException(
        `Already returned and awaiting a decision: ` +
          openReturns.map((r) => `${r.sareeId} (${r.returnRef})`).join(", "),
      );
    }

    // What the buyer is credited per piece, unless the operator overrode it.
    const pricePerSaree =
      dispatch.pricePerSaree != null ? Number(dispatch.pricePerSaree) : 0;

    const prepared: {
      sareeId: string;
      returnRef: string;
      reason: string;
      refundAmount: number;
      photoUrl?: string;
    }[] = [];
    for (const item of dto.items) {
      // "<Business>-NNN" — a wholesale buyer, so the ref reads as the business
      // name, matching how invoices and quotations are numbered for them.
      const returnRef = await this.idGenerator.nextNamed(
        "RET",
        businessSegment(dispatch.customer.name, "Return"),
      );
      const note = item.reasonNote?.trim();
      prepared.push({
        sareeId: item.sareeId.trim(),
        returnRef,
        reason: note ? `${item.reason} — ${note}` : item.reason,
        refundAmount: item.refundAmount ?? pricePerSaree,
        photoUrl: item.photoUrl,
      });
    }

    await this.prisma.$transaction(
      prepared.flatMap((p) => [
        this.prisma.returnRecord.create({
          data: {
            returnRef: p.returnRef,
            sareeId: p.sareeId,
            reason: p.reason,
            refundAmount: p.refundAmount,
            restocked: false,
            photoUrl: p.photoUrl,
          },
        }),
        this.prisma.saree.update({
          where: { id: p.sareeId },
          data: { status: SareeStatus.RETURNED },
        }),
      ]),
    );

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "SALES",
      action:
        `Recorded ${prepared.length} wholesale return(s) from ${dispatch.customer.name} ` +
        `off dispatch ${dispatch.invoiceNumber ?? dispatch.lrNumber ?? dispatch.id}`,
      entityType: "DispatchRecord",
      entityId: dispatch.id,
      recordLabel: dispatch.invoiceNumber ?? dispatch.lrNumber ?? dispatch.id,
    });

    return Promise.all(prepared.map((p) => this.findOneReturn(p.returnRef)));
  }

  /**
   * The one action that turns a held return into sellable stock: flips the
   * ReturnRecord to restocked, the Saree back to UNSOLD, and writes the
   * InventoryRecord that `InventoryService` reads as available shop stock.
   * Idempotent — sending an already-restocked return through again is a no-op
   * rather than an error, since two staff can press the button at once.
   */
  async sendReturnToInventory(returnRef: string, actorId?: string) {
    const record = await this.prisma.returnRecord.findUnique({
      where: { returnRef },
      include: { saree: true },
    });
    if (!record) {
      throw new NotFoundException(`Return ${returnRef} not found`);
    }
    if (record.restocked) {
      return this.findOneReturn(returnRef);
    }

    await this.prisma.$transaction([
      this.prisma.returnRecord.update({ where: { returnRef }, data: { restocked: true } }),
      this.prisma.saree.update({ where: { id: record.sareeId }, data: { status: SareeStatus.UNSOLD } }),
      // FINISHING_COMPLETE is what InventoryService treats as available stock;
      // rawType RETURN records how the piece entered.
      this.prisma.inventoryRecord.upsert({
        where: { sareeId: record.sareeId },
        create: { sareeId: record.sareeId, status: "FINISHING_COMPLETE", rawType: "RETURN" },
        update: { status: "FINISHING_COMPLETE", rawType: "RETURN" },
      }),
    ]);

    await this.auditLog.recordAction({
      actorId,
      module: "SALES",
      action: `Sent returned saree ${record.sareeId} (${returnRef}) into shop inventory`,
      entityType: "ReturnRecord",
      entityId: returnRef,
      recordLabel: returnRef,
    });

    return this.findOneReturn(returnRef);
  }


  async createReturn(dto: CreateReturnDto) {
    const saree = await this.prisma.saree.findUnique({ where: { id: dto.sareeId } });
    if (!saree) {
      throw new NotFoundException(`Saree ${dto.sareeId} not found`);
    }
    if (saree.status !== "RETAIL" && saree.status !== "WHOLESALE") {
      throw new BadRequestException(`Saree ${dto.sareeId} was not sold (status: ${saree.status})`);
    }

    // "RR-<Customer>-NNN" — the customer is whoever this saree's most recent
    // sale was to; SaleRecord.customerId is required, so a sold saree always
    // has one. Wholesale reads as the business name, retail as a first name,
    // mirroring how Quotation/Invoice/SaleRecord segments are chosen.
    const sale = await this.prisma.saleRecord.findFirst({
      where: { sareeId: dto.sareeId },
      orderBy: { date: "desc" },
      include: { customer: true },
    });
    if (!sale) {
      throw new NotFoundException(`No sale record found for saree ${dto.sareeId} — cannot determine the returning customer`);
    }
    const segment =
      sale.customer.type === "WHOLESALE"
        ? businessSegment(sale.customer.name, "Return")
        : nameSegment(sale.customer.name, "Return");
    const returnRef = await this.idGenerator.nextNamed("RET", segment);
    const restocked = dto.restocked ?? false;

    await this.prisma.$transaction([
      this.prisma.returnRecord.create({
        data: {
          returnRef,
          sareeId: dto.sareeId,
          reason: dto.reason,
          refundAmount: dto.refundAmount,
          restocked,
          photoUrl: dto.photoUrl,
        },
      }),
      this.prisma.saree.update({
        where: { id: dto.sareeId },
        data: { status: restocked ? "UNSOLD" : "RETURNED" },
      }),
      // Only a restock puts it back in the shop-stock browse list — an
      // unrestocked return (e.g. damaged) stays out of InventoryService.findAll().
      // Upsert, not update: a saree sold before InventoryRecord tracking
      // existed (or one whose record was never created) has no row yet.
      ...(restocked
        ? [
            this.prisma.inventoryRecord.upsert({
              where: { sareeId: dto.sareeId },
              create: { sareeId: dto.sareeId, status: "FINISHING_COMPLETE", rawType: "RETURN" },
              update: { status: "FINISHING_COMPLETE" },
            }),
          ]
        : []),
    ]);

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "SALES",
      action: `Recorded return ${returnRef} of saree ${dto.sareeId}`,
      entityType: "ReturnRecord",
      entityId: returnRef,
      recordLabel: returnRef,
    });

    return this.findOneReturn(returnRef);
  }

  /**
   * Every returned saree with enough detail for the shop to act on it: which
   * bucket it belongs in (a piece we sold and took back vs. a wholesale
   * consignment sent back to us), who it came from, what it looks like, and
   * whether it has been sent into sellable stock yet.
   *
   * The shop's Inventory screen reads this to show returns as their own
   * categorised stock, separate from dispatched stock, with the
   * "send to inventory" action attached to the ones still held.
   */
  async listReturnStock(): Promise<ReturnStockItem[]> {
    const returns = await this.prisma.returnRecord.findMany({
      orderBy: { createdAt: "desc" },
      include: { saree: { include: { sareeType: true } } },
    });
    if (returns.length === 0) {
      return [];
    }

    // A retail return is one where we have the original sale; a wholesale
    // return is a piece registered by hand with no sale behind it.
    const sales = await this.prisma.saleRecord.findMany({
      where: { sareeId: { in: returns.map((r) => r.sareeId) } },
      orderBy: { date: "desc" },
      include: { customer: { select: { name: true } } },
    });
    const saleBySaree = new Map<string, (typeof sales)[number]>();
    for (const sale of sales) {
      if (!saleBySaree.has(sale.sareeId)) saleBySaree.set(sale.sareeId, sale);
    }

    // A piece returned off a WHOLESALE dispatch has no sale behind it — the
    // dispatch is what says who had it. Without this the buyer's name came out
    // as "—" for every such return, since Saree.sourceName is only set on the
    // hand-registered (untracked) path.
    const wholesaleDispatches = await this.prisma.dispatchSaree.findMany({
      where: {
        sareeId: { in: returns.map((r) => r.sareeId) },
        dispatch: { type: "WHOLESALE" },
      },
      orderBy: { dispatch: { dispatchDate: "desc" } },
      include: { dispatch: { include: { customer: { select: { name: true } } } } },
    });
    const buyerBySaree = new Map<string, string>();
    for (const d of wholesaleDispatches) {
      const name = d.dispatch.customer?.name;
      if (name && !buyerBySaree.has(d.sareeId)) buyerBySaree.set(d.sareeId, name);
    }

    return returns.map((r): ReturnStockItem => {
      const sale = saleBySaree.get(r.sareeId) ?? null;
      const saree = r.saree;
      return {
        returnRef: r.returnRef,
        sareeId: r.sareeId,
        category: sale ? "retail" : "wholesale",
        returnDate: r.createdAt.toISOString(),
        reason: r.reason,
        refundAmount: r.refundAmount != null ? Number(r.refundAmount) : null,
        photoUrl: r.photoUrl,
        inInventory: r.restocked,
        source: sale?.customer?.name ?? saree.sourceName ?? buyerBySaree.get(r.sareeId) ?? null,
        saleRef: sale?.saleRef ?? null,
        saleDate: sale?.date.toISOString() ?? null,
        designCode: saree.designCode,
        sareeTypeCode: saree.sareeTypeCode,
        sareeTypeLabel: saree.sareeType ? saree.sareeType.type : null,
        color: saree.color,
        weightG: saree.weightG != null ? Number(saree.weightG) : null,
        costPrice: saree.costPrice != null ? Number(saree.costPrice) : null,
        retailPrice: saree.sareeType ? Number(saree.sareeType.retailPrice) : null,
      };
    });
  }

  async findAllReturns(
    query: ListReturnQueryDto,
  ): Promise<PaginatedResult<Prisma.ReturnRecordGetPayload<{ include: typeof returnInclude }>>> {
    const [items, total] = await Promise.all([
      this.prisma.returnRecord.findMany({
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        include: returnInclude,
      }),
      this.prisma.returnRecord.count(),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOneReturn(returnRef: string) {
    const record = await this.prisma.returnRecord.findUnique({
      where: { returnRef },
      include: returnInclude,
    });
    if (!record) {
      throw new NotFoundException(`Return ${returnRef} not found`);
    }
    return record;
  }
}
