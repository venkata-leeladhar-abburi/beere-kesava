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
import { RegisterReturnedSareeDto } from "./dto/register-returned-saree.dto";

const saleInclude = {
  saree: true,
  customer: true,
} satisfies Prisma.SaleRecordInclude;

const returnInclude = {
  saree: true,
} satisfies Prisma.ReturnRecordInclude;

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
      throw new NotFoundException(`Saree ${dto.sareeId} not found`);
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
      this.prisma.saleRecord.findFirst({ where: { sareeId: dto.sareeId } }),
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
      throw new BadRequestException(`Saree ${dto.sareeId} has already been sold`);
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
   * Registers a wholesale return whose piece was never in the system: creates the
   * Saree from the operator's description under the tag id they attached, records
   * the return against it, and puts it into shop stock — all in one transaction so
   * a half-registered piece can never exist. createReturn() below handles the
   * normal case, where the saree was sold by us and already has a record.
   */
  async registerReturnedSaree(dto: RegisterReturnedSareeDto) {
    const existing = await this.prisma.saree.findUnique({ where: { id: dto.sareeId } });
    if (existing) {
      throw new ConflictException(
        `Saree ${dto.sareeId} already exists — use a tag id that is not already in use.`,
      );
    }

    // Master-data links are resolved up front and rejected when unknown, rather
    // than silently dropped: the operator's description is the only record of
    // this piece, so quietly discarding part of it would lose real information.
    let designCode: string | undefined;
    if (dto.designCode?.trim()) {
      const design = await this.prisma.designLibrary.findUnique({
        where: { code: dto.designCode.trim() },
      });
      if (!design) {
        throw new BadRequestException(`Design code ${dto.designCode} is not in the design library.`);
      }
      designCode = design.code;
    }

    let sareeTypeCode: string | undefined;
    if (dto.sareeType?.trim()) {
      const sareeType = await this.prisma.sareeTypeRate.findFirst({
        where: { type: { equals: dto.sareeType.trim(), mode: "insensitive" } },
      });
      if (!sareeType) {
        throw new BadRequestException(`Saree type "${dto.sareeType}" is not a configured saree type.`);
      }
      sareeTypeCode = sareeType.code;
    }

    // "RR-<Customer>-NNN" — this untracked path has no registered Customer to
    // read a type from (sourceName is free text, whoever handed the piece
    // back), so it always reads as a business name, matching the wholesale
    // flow this registration form is built for.
    const returnRef = await this.idGenerator.nextNamed("RET", businessSegment(dto.sourceName, "Return"));

    await this.prisma.$transaction([
      this.prisma.saree.create({
        data: {
          id: dto.sareeId,
          origin: SareeOrigin.EXTERNAL,
          designCode,
          sareeTypeCode,
          weightG: dto.weightG,
          costPrice: dto.costPrice,
          color: dto.color?.trim() || undefined,
          sourceName: dto.sourceName.trim(),
          // Restocked on arrival, so it is immediately sellable.
          status: SareeStatus.UNSOLD,
        },
      }),
      this.prisma.returnRecord.create({
        data: {
          returnRef,
          sareeId: dto.sareeId,
          reason: dto.reason,
          refundAmount: dto.costPrice,
          restocked: true,
          photoUrl: dto.photoUrl,
        },
      }),
      // FINISHING_COMPLETE is what InventoryService.findAll() treats as
      // available stock; rawType RETURN marks how it entered.
      this.prisma.inventoryRecord.create({
        data: { sareeId: dto.sareeId, status: "FINISHING_COMPLETE", rawType: "RETURN" },
      }),
    ]);

    await this.auditLog.recordAction({
      actorId: dto.actorId,
      module: "SALES",
      action: `Registered wholesale return ${returnRef} as new saree ${dto.sareeId} from ${dto.sourceName}`,
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
