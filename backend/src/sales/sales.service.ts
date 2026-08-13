import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { Prisma, SalesChannel } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReturnDto } from "./dto/create-return.dto";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { ListReturnQueryDto } from "./dto/list-return-query.dto";
import { ListSaleQueryDto } from "./dto/list-sale-query.dto";

const saleInclude = {
  saree: true,
  customer: true,
} satisfies Prisma.SaleRecordInclude;

const returnInclude = {
  saree: true,
} satisfies Prisma.ReturnRecordInclude;

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
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
    const [dispatched, alreadySold, inventory] = await Promise.all([
      this.prisma.dispatchSaree.findFirst({ where: { sareeId: dto.sareeId } }),
      this.prisma.saleRecord.findFirst({ where: { sareeId: dto.sareeId } }),
      this.prisma.inventoryRecord.findUnique({ where: { sareeId: dto.sareeId } }),
    ]);
    if (dispatched) {
      throw new BadRequestException(`Saree ${dto.sareeId} has already been dispatched`);
    }
    if (alreadySold) {
      throw new BadRequestException(`Saree ${dto.sareeId} has already been sold`);
    }
    if (inventory?.status === "DAMAGED_REVIEW_NEEDED") {
      throw new BadRequestException(`Saree ${dto.sareeId} is flagged for damage review`);
    }
    if (dto.channel === SalesChannel.WHOLESALE && dto.customerId) {
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
      if (!customer) {
        throw new NotFoundException(`Customer ${dto.customerId} not found`);
      }
    }

    const saleRef = await this.idGenerator.nextFormatted("SALE");
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

    return this.findOneSale(saleRef);
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

  async createReturn(dto: CreateReturnDto) {
    const saree = await this.prisma.saree.findUnique({ where: { id: dto.sareeId } });
    if (!saree) {
      throw new NotFoundException(`Saree ${dto.sareeId} not found`);
    }
    if (saree.status !== "RETAIL" && saree.status !== "WHOLESALE") {
      throw new BadRequestException(`Saree ${dto.sareeId} was not sold (status: ${saree.status})`);
    }

    const returnRef = await this.idGenerator.nextFormatted("RET");
    const restocked = dto.restocked ?? false;

    await this.prisma.$transaction([
      this.prisma.returnRecord.create({
        data: {
          returnRef,
          sareeId: dto.sareeId,
          reason: dto.reason,
          refundAmount: dto.refundAmount,
          restocked,
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
