import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "../common/pagination";
import { Prisma, QuotationSareeStatus, QuotationStatus } from "../generated/prisma/client";
import { IdGeneratorService } from "../id-generator/id-generator.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import { ListQuotationsQueryDto } from "./dto/list-quotations-query.dto";
import { ReceiveQuotationSareesDto } from "./dto/receive-quotation-sarees.dto";
import { AssignQuotationFinishingDto } from "./dto/assign-quotation-finishing.dto";

const QUOTATION_ID_PREFIX = "QUO";

const include = { 
  sarees: true, 
  customer: true, 
  bulkOrder: true,
  finishingAssignments: { include: { finishingStaff: true } } 
} satisfies Prisma.QuotationInclude;

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateQuotationDto) {
    const raisedBy = await this.prisma.user.findUnique({ where: { id: dto.raisedById } });
    if (!raisedBy) {
      throw new NotFoundException(`User ${dto.raisedById} not found`);
    }
    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
      if (!customer) {
        throw new NotFoundException(`Customer ${dto.customerId} not found`);
      }
    }

    // A quotation can only be raised for sarees that have actually passed
    // QC — PASSED is terminal (see BatchesService), so a single existence
    // check per sareeId is sufficient; no later record can revoke it.
    const passedRecords = await this.prisma.qcRecord.findMany({
      where: { sareeId: { in: dto.sarees.map((s) => s.sareeId) }, result: "PASSED" },
      select: { sareeId: true },
    });
    const passedIds = new Set(passedRecords.map((r) => r.sareeId));
    const notPassed = dto.sarees.map((s) => s.sareeId).filter((id) => !passedIds.has(id));
    if (notPassed.length > 0) {
      throw new BadRequestException(
        `Saree(s) have not passed QC and cannot be quoted: ${notPassed.join(", ")}`,
      );
    }

    const subtotal = dto.sarees.reduce((sum, s) => sum + s.price, 0);
    const gstPct = dto.applyGst ? (dto.gstPct ?? 0) : 0;
    const grandTotal = subtotal + (subtotal * gstPct) / 100;

    const quotationNumber = await this.idGenerator.nextFormatted(QUOTATION_ID_PREFIX);

    const quotation = await this.prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: dto.customerId,
        bulkOrderRef: dto.bulkOrderRef,
        applyGst: dto.applyGst ?? false,
        gstPct: dto.applyGst ? dto.gstPct : undefined,
        subtotal,
        grandTotal,
        firmId: dto.firmId,
        raisedById: dto.raisedById,
      },
    });

    await this.prisma.quotationSaree.createMany({
      data: dto.sarees.map((s) => ({ quotationId: quotation.id, sareeId: s.sareeId, price: s.price })),
    });

    return this.findOne(quotation.id);
  }

  async findAll(
    query: ListQuotationsQueryDto,
  ): Promise<PaginatedResult<Prisma.QuotationGetPayload<{ include: typeof include }>>> {
    const where: Prisma.QuotationWhereInput = {
      status: query.status,
      customerId: query.customerId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quotation.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { quotationDate: "desc" },
        include,
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const quotation = await this.prisma.quotation.findUnique({ where: { id }, include });
    if (!quotation) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }
    return quotation;
  }

  // Marks a subset (or all) of the quotation's sarees as in-finishing,
  // and creates FinishingAssignment records for them.
  async assignFinishing(id: string, dto: AssignQuotationFinishingDto) {
    const quotation = await this.findOne(id);
    if (quotation.status !== QuotationStatus.RAISED && quotation.status !== QuotationStatus.IN_FINISHING) {
      throw new BadRequestException(
        `Quotation must be RAISED or IN_FINISHING to assign finishing (currently ${quotation.status})`,
      );
    }

    const staff = await this.prisma.finishingStaff.findUnique({ where: { id: dto.staffId } });
    if (!staff) {
      throw new NotFoundException(`Finishing Staff ${dto.staffId} not found`);
    }

    const ids = new Set(quotation.sarees.map((s) => s.sareeId));
    const missing = dto.sareeIds.filter((sareeId) => !ids.has(sareeId));
    if (missing.length > 0) {
      throw new BadRequestException(`Saree(s) not on this quotation: ${missing.join(", ")}`);
    }

    await this.prisma.$transaction([
      this.prisma.quotationSaree.updateMany({
        where: { quotationId: id, sareeId: { in: dto.sareeIds } },
        data: { finishingStatus: QuotationSareeStatus.IN_FINISHING },
      }),
      this.prisma.finishingAssignment.createMany({
        data: dto.sareeIds.map((sareeId) => ({
          sareeId,
          finishingStaffId: dto.staffId,
          assignedById: dto.assignedById,
          quotationRef: id,
          status: "AWAITING_RETURN",
        })),
        skipDuplicates: true,
      }),
      this.prisma.quotation.update({
        where: { id },
        data: { status: QuotationStatus.IN_FINISHING },
      }),
    ]);
    return this.findOne(id);
  }

  // Marks a subset (or all) of the quotation's sarees as received, then
  // recomputes the quotation-level status: RECEIVED once every saree is in,
  // PARTIALLY_RECEIVED otherwise.
  async receive(id: string, dto: ReceiveQuotationSareesDto) {
    const quotation = await this.findOne(id);
    const ids = new Set(quotation.sarees.map((s) => s.sareeId));
    const missing = dto.sareeIds.filter((sareeId) => !ids.has(sareeId));
    if (missing.length > 0) {
      throw new BadRequestException(`Saree(s) not on this quotation: ${missing.join(", ")}`);
    }

    // A saree returned through the quotation-receive flow must become
    // dispatch-ready the same way a plain (non-quotation) return does via
    // FinishingAssignmentsService.receiveReturn — otherwise it never reaches
    // the Inventory dispatch queue. No damage-reporting UI exists on this
    // flow yet, so every quotation return is treated as PERFECT condition.
    const rows = await this.prisma.batchSareeRow.findMany({
      where: { sareeId: { in: dto.sareeIds } },
      select: { sareeId: true, batchId: true },
    });
    const batchIdBySareeId = new Map(rows.map((r) => [r.sareeId, r.batchId]));

    await this.prisma.$transaction([
      this.prisma.quotationSaree.updateMany({
        where: { quotationId: id, sareeId: { in: dto.sareeIds } },
        data: { finishingStatus: QuotationSareeStatus.RECEIVED },
      }),
      this.prisma.finishingAssignment.updateMany({
        where: { quotationRef: id, sareeId: { in: dto.sareeIds }, status: "AWAITING_RETURN" },
        data: { status: "RETURNED" },
      }),
      ...dto.sareeIds.map((sareeId) =>
        this.prisma.inventoryRecord.upsert({
          where: { sareeId },
          create: {
            sareeId,
            status: "FINISHING_COMPLETE",
            rawType: "RETURN",
            batchId: batchIdBySareeId.get(sareeId),
            quotationRef: id,
          },
          update: { status: "FINISHING_COMPLETE" },
        }),
      ),
    ]);

    const remaining = await this.prisma.quotationSaree.count({
      where: { quotationId: id, finishingStatus: { not: QuotationSareeStatus.RECEIVED } },
    });

    await this.prisma.quotation.update({
      where: { id },
      data: {
        status: remaining === 0 ? QuotationStatus.RECEIVED : QuotationStatus.PARTIALLY_RECEIVED,
      },
    });

    return this.findOne(id);
  }

  // Every saree on the quotation must be back from finishing before it can
  // leave the building — mirrors the plain-dispatch rule in DispatchService
  // (InventoryRecord.status must be FINISHING_COMPLETE), applied here at the
  // quotation level instead of per-saree.
  async dispatch(id: string) {
    const quotation = await this.findOne(id);
    if (quotation.status !== QuotationStatus.RECEIVED) {
      throw new BadRequestException(
        `Quotation must be RECEIVED (all sarees back from finishing) to dispatch (currently ${quotation.status})`,
      );
    }
    await this.prisma.quotation.update({
      where: { id },
      data: { status: QuotationStatus.DISPATCHED },
    });
    return this.findOne(id);
  }
}
