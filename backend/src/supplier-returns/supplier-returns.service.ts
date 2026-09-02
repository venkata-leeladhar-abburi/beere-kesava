import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { IdGeneratorService, businessSegment } from "../id-generator/id-generator.service";
import { Prisma, SupplierReturnStatus, UserRole } from "../generated/prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSupplierReturnRequestDto } from "./dto/create-supplier-return-request.dto";
import { DecideSupplierReturnRequestDto } from "./dto/decide-supplier-return-request.dto";
import { ListSupplierReturnRequestsQueryDto } from "./dto/list-supplier-return-requests-query.dto";

const include = {
  purchase: true,
  supplier: true,
  sareeLine: true,
  requestedBy: { select: { id: true, firstName: true, lastName: true } },
  decidedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.SupplierReturnRequestInclude;

@Injectable()
export class SupplierReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateSupplierReturnRequestDto) {
    const requester = await this.prisma.user.findUnique({ where: { id: dto.requestedById } });
    if (!requester) {
      throw new NotFoundException(`User ${dto.requestedById} not found`);
    }

    const purchase = await this.prisma.purchase.findUnique({
      where: { id: dto.purchaseId },
      include: { supplier: true },
    });
    if (!purchase) {
      throw new NotFoundException(`Purchase ${dto.purchaseId} not found`);
    }
    if (!purchase.supplierId || !purchase.supplier) {
      throw new BadRequestException(
        `Purchase ${dto.purchaseId} has no registered supplier — returns can only be requested for purchases from a registered supplier.`,
      );
    }

    const sareeLine = await this.prisma.purchaseSareeLine.findUnique({ where: { id: dto.sareeLineId } });
    if (!sareeLine || sareeLine.purchaseId !== dto.purchaseId) {
      throw new NotFoundException(`Saree line ${dto.sareeLineId} not found on purchase ${dto.purchaseId}`);
    }

    // Pending requests reserve stock against the line so two return requests
    // can't both claim the same pieces before either is decided.
    const pendingAgg = await this.prisma.supplierReturnRequest.aggregate({
      where: { sareeLineId: dto.sareeLineId, status: SupplierReturnStatus.PENDING },
      _sum: { quantity: true },
    });
    const alreadyReturned = sareeLine.returnedQuantity;
    const alreadyPending = pendingAgg._sum.quantity ?? 0;
    const available = sareeLine.quantity - alreadyReturned - alreadyPending;
    if (dto.quantity > available) {
      throw new BadRequestException(
        `Only ${available} piece(s) of this line are available to return (quantity: ${sareeLine.quantity}, already returned: ${alreadyReturned}, pending: ${alreadyPending}).`,
      );
    }

    // Falls back to the supplier's name segment, not its UUID: every other
    // scoping service reads `code ?? businessSegment(name)`, and a raw UUID
    // here produced ids like "RR-7141a9e5-2b1c-…-002" that no code parser
    // could split. Suppliers created since SuppliersService started minting
    // codes always take the first branch; the fallback only covers rows that
    // predate it. Existing RR- ids keep their UUID form — they are primary
    // keys, so they are not rewritten.
    const supplierSegment =
      purchase.supplier.code ?? businessSegment(purchase.supplier.name, "Supplier");
    const id = await this.idGenerator.nextScoped("RR", supplierSegment);

    const request = await this.prisma.supplierReturnRequest.create({
      data: {
        id,
        purchaseId: dto.purchaseId,
        supplierId: purchase.supplierId,
        sareeLineId: dto.sareeLineId,
        quantity: dto.quantity,
        reason: dto.reason,
        requestedById: dto.requestedById,
      },
      include,
    });

    await this.auditLog.recordAction({
      actorId: dto.requestedById,
      module: "SUPPLIER_RETURNS",
      action: `Requested return of ${dto.quantity} piece(s) to ${purchase.supplier.name}`,
      entityType: "SupplierReturnRequest",
      entityId: id,
      recordLabel: id,
    });

    // Pending requests hold stock reserved against the line, so an
    // undecided one quietly blocks pieces from being sold.
    await this.notifications.notifyRole(UserRole.ADMIN, "SUPPLIER_RETURN_RAISED", {
      supplierReturnId: id,
      supplierName: purchase.supplier.name,
      quantity: dto.quantity,
      reason: dto.reason ?? null,
      purchaseId: dto.purchaseId,
    });

    return request;
  }

  async findAll(
    query: ListSupplierReturnRequestsQueryDto,
  ): Promise<PaginatedResult<Prisma.SupplierReturnRequestGetPayload<{ include: typeof include }>>> {
    const where: Prisma.SupplierReturnRequestWhereInput = {
      status: query.status,
      supplierId: query.supplierId,
      purchaseId: query.purchaseId,
    };

    const [items, total] = await Promise.all([
      this.prisma.supplierReturnRequest.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        include,
      }),
      this.prisma.supplierReturnRequest.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string) {
    const request = await this.prisma.supplierReturnRequest.findUnique({ where: { id }, include });
    if (!request) {
      throw new NotFoundException(`Supplier return request ${id} not found`);
    }
    return request;
  }

  /**
   * Approving moves the pieces out of the purchase's available stock —
   * PurchaseSareeLine.returnedQuantity is what the External Purchases saree
   * list already reads to mark a piece "Returned" (see expandSareePieces on
   * the frontend), so incrementing it here is what makes the pieces disappear
   * from that list; the request itself, now APPROVED, is the permanent record
   * in the Supplier Returns section. Rejecting leaves the line untouched.
   */
  async decide(id: string, dto: DecideSupplierReturnRequestDto) {
    const request = await this.findOne(id);
    if (request.status !== SupplierReturnStatus.PENDING) {
      throw new BadRequestException(
        `Supplier return request must be PENDING to be decided (currently ${request.status})`,
      );
    }

    const decider = await this.prisma.user.findUnique({ where: { id: dto.decidedById } });
    if (!decider) {
      throw new NotFoundException(`User ${dto.decidedById} not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.decision === SupplierReturnStatus.APPROVED) {
        const line = await tx.purchaseSareeLine.findUnique({ where: { id: request.sareeLineId } });
        if (!line) {
          throw new NotFoundException(`Saree line ${request.sareeLineId} not found`);
        }
        const nextReturned = line.returnedQuantity + request.quantity;
        if (nextReturned > line.quantity) {
          throw new BadRequestException(
            `Approving this would return ${nextReturned} of ${line.quantity} pieces on the line — more than exist.`,
          );
        }
        await tx.purchaseSareeLine.update({
          where: { id: request.sareeLineId },
          data: { returnedQuantity: nextReturned },
        });
      }

      return tx.supplierReturnRequest.update({
        where: { id },
        data: {
          status: dto.decision,
          decidedById: dto.decidedById,
          decidedAt: new Date(),
          decisionNote: dto.decisionNote,
        },
        include,
      });
    });

    await this.auditLog.recordAction({
      actorId: dto.decidedById,
      module: "SUPPLIER_RETURNS",
      action: `${dto.decision === SupplierReturnStatus.APPROVED ? "Approved" : "Rejected"} return request to ${request.supplier.name}`,
      entityType: "SupplierReturnRequest",
      entityId: id,
      recordLabel: id,
      oldValue: request.status,
      newValue: dto.decision,
    });

    await this.notifications.notifyUser(request.requestedById, "SUPPLIER_RETURN_DECIDED", {
      supplierReturnId: id,
      supplierName: request.supplier.name,
      quantity: request.quantity,
      decision: dto.decision,
      decisionNote: dto.decisionNote ?? null,
    });

    return updated;
  }
}
