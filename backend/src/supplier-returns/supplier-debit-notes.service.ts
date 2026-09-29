import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PaginatedResult } from "../common/pagination";
import { IdGeneratorService, businessSegment } from "../id-generator/id-generator.service";
import { Prisma, SupplierReturnStatus, UserRole } from "../generated/prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { returnedPieceSet } from "../purchases/returned-pieces";
import { CreateSupplierDebitNoteDto } from "./dto/create-supplier-debit-note.dto";
import { DecideSupplierDebitNoteDto } from "./dto/decide-supplier-debit-note.dto";
import { ListSupplierDebitNotesQueryDto } from "./dto/list-supplier-debit-notes-query.dto";

const userSelect = { select: { id: true, firstName: true, lastName: true } } as const;

const include = {
  purchase: true,
  supplier: true,
  requestedBy: userSelect,
  decidedBy: userSelect,
  requests: { include: { sareeLine: true }, orderBy: { id: "asc" } },
} satisfies Prisma.SupplierDebitNoteInclude;

export type SupplierDebitNoteWithRelations = Prisma.SupplierDebitNoteGetPayload<{
  include: typeof include;
}>;

/** APPROVED when every piece asked for was accepted, REJECTED when none were, PARTIALLY_APPROVED otherwise. */
export function decisionStatus(approved: number, requested: number): SupplierReturnStatus {
  if (approved <= 0) return SupplierReturnStatus.REJECTED;
  if (approved >= requested) return SupplierReturnStatus.APPROVED;
  return SupplierReturnStatus.PARTIALLY_APPROVED;
}

/**
 * Debit notes — the document raised when purchased sarees go back to their
 * supplier. Creating one raises a PENDING SupplierReturnRequest for each
 * purchase line it touches (so the existing per-line stock reservation keeps
 * working unchanged), and deciding one settles all of those lines together,
 * piece by piece.
 */
@Injectable()
export class SupplierDebitNotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateSupplierDebitNoteDto): Promise<SupplierDebitNoteWithRelations> {
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

    const lineIds = dto.lines.map((l) => l.sareeLineId);
    if (new Set(lineIds).size !== lineIds.length) {
      throw new BadRequestException("Each saree line may appear only once on a debit note.");
    }

    // Checked once up front so a bad request fails fast without burning
    // debit-note numbers, then again inside the transaction under a row lock
    // (see below) — that second check is the one that counts.
    await this.assertPiecesAvailable(this.prisma, dto);

    // Same fallback as SupplierReturnsService.create — the supplier's code,
    // or its name segment for suppliers that predate codes, never its UUID.
    const supplierSegment =
      purchase.supplier.code ?? businessSegment(purchase.supplier.name, "Supplier");
    const supplierId = purchase.supplierId;
    const id = await this.idGenerator.nextScoped("DN", supplierSegment);
    const requestIds: string[] = [];
    for (let i = 0; i < dto.lines.length; i++) {
      requestIds.push(await this.idGenerator.nextScoped("RR", supplierSegment));
    }

    const reason = dto.reason?.trim() || undefined;
    await this.prisma.$transaction(async (tx) => {
      // Lock the lines being returned from, then re-check. Without the lock
      // two notes raised at the same moment could both pass the check and
      // reserve the same pieces.
      await tx.$queryRaw`SELECT id FROM "PurchaseSareeLine" WHERE id IN (${Prisma.join(lineIds)}) FOR UPDATE`;
      await this.assertPiecesAvailable(tx, dto);

      await tx.supplierDebitNote.create({
        data: {
          id,
          purchaseId: dto.purchaseId,
          supplierId,
          reason,
          requestedById: dto.requestedById,
        },
      });
      for (const [i, entry] of dto.lines.entries()) {
        await tx.supplierReturnRequest.create({
          data: {
            id: requestIds[i],
            debitNoteId: id,
            purchaseId: dto.purchaseId,
            supplierId,
            sareeLineId: entry.sareeLineId,
            quantity: entry.pieceNos.length,
            pieceNos: [...entry.pieceNos].sort((a, b) => a - b),
            reason,
            requestedById: dto.requestedById,
          },
        });
      }
    });

    const quantity = dto.lines.reduce((sum, l) => sum + l.pieceNos.length, 0);

    await this.auditLog.recordAction({
      actorId: dto.requestedById,
      module: "SUPPLIER_RETURNS",
      action: `Raised debit note for ${quantity} piece(s) to ${purchase.supplier.name}`,
      entityType: "SupplierDebitNote",
      entityId: id,
      recordLabel: id,
    });

    // Pending pieces stay reserved against their lines until decided.
    await this.notifications.notifyRole(UserRole.ADMIN, "SUPPLIER_RETURN_RAISED", {
      supplierReturnId: id,
      debitNoteId: id,
      supplierName: purchase.supplier.name,
      quantity,
      reason: reason ?? null,
      purchaseId: dto.purchaseId,
    });

    return this.findOne(id);
  }

  /** Every picked piece exists on its line, is still with us, and isn't already on a pending return. */
  private async assertPiecesAvailable(
    client: Pick<Prisma.TransactionClient, "purchaseSareeLine" | "supplierReturnRequest">,
    dto: CreateSupplierDebitNoteDto,
  ): Promise<void> {
    const lineIds = dto.lines.map((l) => l.sareeLineId);
    const [sareeLines, pendingRequests] = await Promise.all([
      client.purchaseSareeLine.findMany({ where: { id: { in: lineIds } } }),
      client.supplierReturnRequest.findMany({
        where: { sareeLineId: { in: lineIds }, status: SupplierReturnStatus.PENDING },
        select: { sareeLineId: true, quantity: true, pieceNos: true },
      }),
    ]);
    const lineById = new Map(sareeLines.map((l) => [l.id, l]));

    for (const entry of dto.lines) {
      const line = lineById.get(entry.sareeLineId);
      if (!line || line.purchaseId !== dto.purchaseId) {
        throw new NotFoundException(
          `Saree line ${entry.sareeLineId} not found on purchase ${dto.purchaseId}`,
        );
      }
      const outOfRange = entry.pieceNos.find((n) => n > line.quantity);
      if (outOfRange !== undefined) {
        throw new BadRequestException(
          `Line ${line.code} has only ${line.quantity} piece(s) — there is no piece ${outOfRange}.`,
        );
      }
      const pending = pendingRequests.filter((r) => r.sareeLineId === line.id);
      const alreadyPending = pending.reduce((sum, r) => sum + r.quantity, 0);
      const available = line.quantity - line.returnedQuantity - alreadyPending;
      if (entry.pieceNos.length > available) {
        throw new BadRequestException(
          `Only ${available} piece(s) of line ${line.code} are available to return (quantity: ${line.quantity}, already returned: ${line.returnedQuantity}, pending: ${alreadyPending}).`,
        );
      }
      const returned = returnedPieceSet(
        line.quantity,
        line.returnedQuantity,
        line.returnedPieceNos,
      );
      const gone = entry.pieceNos.find((n) => returned.has(n));
      if (gone !== undefined) {
        throw new BadRequestException(
          `Piece ${gone} of line ${line.code} has already been returned.`,
        );
      }
      const pendingPieces = new Set(pending.flatMap((r) => r.pieceNos));
      const clash = entry.pieceNos.find((n) => pendingPieces.has(n));
      if (clash !== undefined) {
        throw new BadRequestException(
          `Piece ${clash} of line ${line.code} is already on a pending return.`,
        );
      }
    }
  }

  async findAll(
    query: ListSupplierDebitNotesQueryDto,
  ): Promise<PaginatedResult<SupplierDebitNoteWithRelations>> {
    const where: Prisma.SupplierDebitNoteWhereInput = {
      status: query.status,
      supplierId: query.supplierId,
      purchaseId: query.purchaseId,
    };

    const [items, total] = await Promise.all([
      this.prisma.supplierDebitNote.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        include,
      }),
      this.prisma.supplierDebitNote.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async findOne(id: string): Promise<SupplierDebitNoteWithRelations> {
    const note = await this.prisma.supplierDebitNote.findUnique({ where: { id }, include });
    if (!note) {
      throw new NotFoundException(`Debit note ${id} not found`);
    }
    return note;
  }

  /**
   * Settles every line of the note at once. Approved pieces leave the
   * purchase's stock exactly as a single approved return request does —
   * PurchaseSareeLine.returnedQuantity goes up and Purchase.sareeCount comes
   * down by the approved count — and refused pieces stay with us.
   */
  async decide(
    id: string,
    dto: DecideSupplierDebitNoteDto,
  ): Promise<SupplierDebitNoteWithRelations> {
    const note = await this.findOne(id);
    if (note.status !== SupplierReturnStatus.PENDING) {
      throw new BadRequestException(
        `Debit note must be PENDING to be decided (currently ${note.status})`,
      );
    }

    const decider = await this.prisma.user.findUnique({ where: { id: dto.decidedById } });
    if (!decider) {
      throw new NotFoundException(`User ${dto.decidedById} not found`);
    }

    const approvedByRequest = new Map<string, number[]>();
    for (const entry of dto.lines) {
      const request = note.requests.find((r) => r.id === entry.requestId);
      if (!request) {
        throw new BadRequestException(`Return line ${entry.requestId} is not on debit note ${id}.`);
      }
      if (approvedByRequest.has(entry.requestId)) {
        throw new BadRequestException(`Return line ${entry.requestId} was decided twice.`);
      }
      const asked = new Set(request.pieceNos);
      const stray = entry.approvedPieceNos.find((n) => !asked.has(n));
      if (stray !== undefined) {
        throw new BadRequestException(
          `Piece ${stray} was not requested on line ${request.sareeLine.code}.`,
        );
      }
      approvedByRequest.set(
        entry.requestId,
        [...entry.approvedPieceNos].sort((a, b) => a - b),
      );
    }

    const decidedAt = new Date();
    const pendingRequests = note.requests.filter((r) => r.status === SupplierReturnStatus.PENDING);
    const requestedTotal = pendingRequests.reduce((sum, r) => sum + r.quantity, 0);
    const approvedTotal = pendingRequests.reduce(
      (sum, r) => sum + (approvedByRequest.get(r.id)?.length ?? 0),
      0,
    );
    const status = decisionStatus(approvedTotal, requestedTotal);

    await this.prisma.$transaction(async (tx) => {
      // Claim the note first, and only if it is still PENDING. Two admins
      // deciding at once both passed the status check above; the row lock
      // this update takes makes the second one wait, find the note already
      // decided, and roll back — so stock can never be moved twice.
      const claimed = await tx.supplierDebitNote.updateMany({
        where: { id, status: SupplierReturnStatus.PENDING },
        data: { status, decidedById: dto.decidedById, decidedAt, decisionNote: dto.decisionNote },
      });
      if (claimed.count === 0) {
        throw new BadRequestException(`Debit note ${id} has already been decided or cancelled.`);
      }

      for (const request of pendingRequests) {
        const approvedPieceNos = approvedByRequest.get(request.id) ?? [];
        const approvedQuantity = approvedPieceNos.length;

        const settled = await tx.supplierReturnRequest.updateMany({
          where: { id: request.id, status: SupplierReturnStatus.PENDING },
          data: {
            status: decisionStatus(approvedQuantity, request.quantity),
            approvedQuantity,
            approvedPieceNos,
            decidedById: dto.decidedById,
            decidedAt,
            decisionNote: dto.decisionNote,
          },
        });
        if (settled.count === 0) {
          throw new BadRequestException(`Return line ${request.id} has already been decided.`);
        }

        if (approvedQuantity > 0) {
          // An atomic increment rather than read-then-write, so two notes
          // approved on the same line at once can't overwrite each other.
          const line = await tx.purchaseSareeLine.update({
            where: { id: request.sareeLineId },
            data: { returnedQuantity: { increment: approvedQuantity } },
          });
          if (line.returnedQuantity > line.quantity) {
            throw new BadRequestException(
              `Approving this would return ${line.returnedQuantity} of ${line.quantity} pieces on line ${line.code} — more than exist.`,
            );
          }
          const before = returnedPieceSet(
            line.quantity,
            line.returnedQuantity - approvedQuantity,
            line.returnedPieceNos,
          );
          const gone = approvedPieceNos.find((n) => before.has(n));
          if (gone !== undefined) {
            throw new BadRequestException(
              `Piece ${gone} of line ${line.code} has already been returned.`,
            );
          }
          await tx.purchaseSareeLine.update({
            where: { id: line.id },
            // Record which pieces went, so the saree list, barcode print,
            // scan and dispatch mark these exact pieces rather than the
            // first N of the line.
            data: {
              returnedPieceNos: [...new Set([...line.returnedPieceNos, ...approvedPieceNos])].sort(
                (a, b) => a - b,
              ),
            },
          });
          await tx.purchase.update({
            where: { id: line.purchaseId },
            data: { sareeCount: { decrement: approvedQuantity } },
          });
        }
      }
    });

    await this.auditLog.recordAction({
      actorId: dto.decidedById,
      module: "SUPPLIER_RETURNS",
      action: `Decided debit note to ${note.supplier.name}: ${approvedTotal} of ${requestedTotal} piece(s) approved`,
      entityType: "SupplierDebitNote",
      entityId: id,
      recordLabel: id,
      oldValue: note.status,
      newValue: status,
    });

    await this.notifications.notifyUser(note.requestedById, "SUPPLIER_RETURN_DECIDED", {
      supplierReturnId: id,
      debitNoteId: id,
      supplierName: note.supplier.name,
      quantity: requestedTotal,
      approvedQuantity: approvedTotal,
      decision: status,
      decisionNote: dto.decisionNote ?? null,
    });

    return this.findOne(id);
  }

  /**
   * Withdraws a note nobody has decided yet — by the person who raised it,
   * or an admin. Nothing ever left stock for a pending note, so this only
   * frees the pieces it had reserved.
   */
  async cancel(
    id: string,
    actor: { id: string; isAdmin: boolean },
    note?: string,
  ): Promise<SupplierDebitNoteWithRelations> {
    const existing = await this.findOne(id);
    if (existing.status !== SupplierReturnStatus.PENDING) {
      throw new BadRequestException(
        `Only a PENDING debit note can be cancelled (currently ${existing.status})`,
      );
    }
    if (!actor.isAdmin && existing.requestedById !== actor.id) {
      throw new ForbiddenException(
        "Only the person who raised this debit note, or an admin, can cancel it.",
      );
    }

    const decidedAt = new Date();
    const decisionNote = note?.trim() || undefined;
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.supplierDebitNote.updateMany({
        where: { id, status: SupplierReturnStatus.PENDING },
        data: {
          status: SupplierReturnStatus.CANCELLED,
          decidedById: actor.id,
          decidedAt,
          decisionNote,
        },
      });
      if (claimed.count === 0) {
        throw new BadRequestException(`Debit note ${id} has already been decided or cancelled.`);
      }
      await tx.supplierReturnRequest.updateMany({
        where: { debitNoteId: id, status: SupplierReturnStatus.PENDING },
        data: {
          status: SupplierReturnStatus.CANCELLED,
          approvedQuantity: 0,
          decidedById: actor.id,
          decidedAt,
          decisionNote,
        },
      });
    });

    await this.auditLog.recordAction({
      actorId: actor.id,
      module: "SUPPLIER_RETURNS",
      action: `Cancelled debit note to ${existing.supplier.name}`,
      entityType: "SupplierDebitNote",
      entityId: id,
      recordLabel: id,
      oldValue: existing.status,
      newValue: SupplierReturnStatus.CANCELLED,
    });

    return this.findOne(id);
  }
}
