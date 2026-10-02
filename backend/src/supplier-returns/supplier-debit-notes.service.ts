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
import { SareeCodesService } from "../saree-codes/saree-codes.service";
import { returnedPieceSet } from "../purchases/returned-pieces";
import { CreateSupplierDebitNoteDto } from "./dto/create-supplier-debit-note.dto";
import { DecideSupplierDebitNoteDto } from "./dto/decide-supplier-debit-note.dto";
import { ListSupplierDebitNotesQueryDto } from "./dto/list-supplier-debit-notes-query.dto";

/** Where one physical piece stands with respect to going back to its supplier. */
export type ReturnablePieceStatus = "AVAILABLE" | "PENDING" | "RETURNED";

export interface ReturnablePiece {
  pieceNo: number;
  /** LINECODE-NN, the code printed on the piece's tag. */
  code: string;
  status: ReturnablePieceStatus;
  /** The pending debit note holding this piece, when there is one. */
  debitNoteId: string | null;
  imageUrl: string | null;
}

export interface ReturnableLine {
  lineId: string;
  lineCode: string;
  sareeType: string | null;
  color: string | null;
  weight: string | null;
  /** Buying price per piece, in rupees. */
  price: number;
  quantity: number;
  imageUrl: string | null;
  sareeDate: Date | null;
  purchase: { id: string; invoiceNumber: string | null; gstNumber: string | null; date: Date };
  /** Null for a purchase from an unregistered supplier — those can't be returned. */
  supplier: { id: string; name: string; code: string | null; city: string | null; phone: string | null } | null;
  supplierName: string | null;
  pieces: ReturnablePiece[];
  /** Set when the query named one exact piece (a scanned tag). */
  matchedPieceNo: number | null;
  /** How the query hit this line — an exact tag/line scan ranks above a text match. */
  match: "PIECE" | "LINE" | "SEARCH";
}

/** Two-digit piece suffix — mirrors the frontend's pieceCodeFromLineCode. */
export const pieceCode = (lineCode: string, pieceNo: number) =>
  `${lineCode}-${String(pieceNo).padStart(2, "0")}`;

/** Lines returned by a free-text lookup — enough to pick from, small enough to render. */
const LOOKUP_LIMIT = 25;

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
    private readonly sareeCodes: SareeCodesService,
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

  /**
   * Finds sarees to send back, from whatever the user has in hand: a scanned
   * or typed piece tag (RAVI-34-001-03), a whole line code (RAVI-34-001), or
   * free text matched against invoice number, supplier, saree type and
   * colour. Every piece of each matching line comes back with its status, so
   * the screen can show what is still with us before anything is picked.
   */
  async lookupReturnable(rawQuery: string): Promise<ReturnableLine[]> {
    const q = rawQuery.trim();
    if (q.length < 2) return [];

    // A scanned QR tag carries a URL ending in ?id=<code> — reduce it to the code.
    const fromUrl = /[?&]id=([^&#\s]+)/i.exec(q);
    // …and a code from a tag printed before a re-code, to its current one.
    const code = await this.sareeCodes.resolve(decodeURIComponent(fromUrl ? fromUrl[1] : q).trim());

    const lineInclude = { purchase: { include: { supplier: true } } } satisfies Prisma.PurchaseSareeLineInclude;
    type LineRow = Prisma.PurchaseSareeLineGetPayload<{ include: typeof lineInclude }>;
    const found: { line: LineRow; match: ReturnableLine["match"]; pieceNo: number | null }[] = [];
    const seen = new Set<string>();
    const add = (line: LineRow, match: ReturnableLine["match"], pieceNo: number | null) => {
      if (seen.has(line.id)) return;
      seen.add(line.id);
      found.push({ line, match, pieceNo });
    };

    // 1. A piece tag: the line code plus a numeric suffix.
    const pieceMatch = /^(.+)-(\d{1,3})$/.exec(code);
    if (pieceMatch) {
      const lines = await this.prisma.purchaseSareeLine.findMany({
        where: { code: { equals: pieceMatch[1], mode: "insensitive" } },
        include: lineInclude,
      });
      const n = Number(pieceMatch[2]);
      for (const line of lines) if (n >= 1 && n <= line.quantity) add(line, "PIECE", n);
    }

    // 2. A whole line code.
    const exactLines = await this.prisma.purchaseSareeLine.findMany({
      where: { code: { equals: code, mode: "insensitive" } },
      include: lineInclude,
    });
    for (const line of exactLines) add(line, "LINE", null);

    // 3. Free text — only when nothing matched exactly, so a clean scan
    //    doesn't drag in look-alike codes.
    if (found.length === 0) {
      const contains = { contains: code, mode: "insensitive" as const };
      const lines = await this.prisma.purchaseSareeLine.findMany({
        where: {
          OR: [
            { code: contains },
            { sareeType: contains },
            { color: contains },
            { purchase: { invoiceNumber: contains } },
            { purchase: { id: contains } },
            { purchase: { supplierName: contains } },
            { purchase: { supplier: { name: contains } } },
            { purchase: { supplier: { code: contains } } },
          ],
        },
        include: lineInclude,
        orderBy: [{ purchase: { date: "desc" } }, { code: "asc" }],
        take: LOOKUP_LIMIT,
      });
      for (const line of lines) add(line, "SEARCH", null);
    }

    if (found.length === 0) return [];

    const pending = await this.prisma.supplierReturnRequest.findMany({
      where: { sareeLineId: { in: found.map((f) => f.line.id) }, status: SupplierReturnStatus.PENDING },
      select: { sareeLineId: true, quantity: true, pieceNos: true, debitNoteId: true, id: true },
    });

    return found.map(({ line, match, pieceNo }) => {
      const returned = returnedPieceSet(line.quantity, line.returnedQuantity, line.returnedPieceNos);
      const heldBy = new Map<number, string | null>();
      const linePending = pending.filter((r) => r.sareeLineId === line.id);
      for (const r of linePending) for (const n of r.pieceNos) heldBy.set(n, r.debitNoteId ?? r.id);
      // Legacy requests name no pieces — reserve that many from the lowest
      // positions still free, the same convention returnedPieceSet uses.
      for (const r of linePending.filter((p) => p.pieceNos.length === 0)) {
        let left = r.quantity;
        for (let n = 1; left > 0 && n <= line.quantity; n++) {
          if (returned.has(n) || heldBy.has(n)) continue;
          heldBy.set(n, r.debitNoteId ?? r.id);
          left--;
        }
      }

      const pieces: ReturnablePiece[] = [];
      for (let n = 1; n <= line.quantity; n++) {
        const status: ReturnablePieceStatus = returned.has(n) ? "RETURNED" : heldBy.has(n) ? "PENDING" : "AVAILABLE";
        pieces.push({
          pieceNo: n,
          code: pieceCode(line.code, n),
          status,
          debitNoteId: status === "PENDING" ? heldBy.get(n) ?? null : null,
          imageUrl: line.pieceImageUrls[n - 1] || null,
        });
      }

      const s = line.purchase.supplier;
      return {
        lineId: line.id,
        lineCode: line.code,
        sareeType: line.sareeType,
        color: line.color,
        weight: line.weight,
        price: Number(line.price),
        quantity: line.quantity,
        imageUrl: line.imageUrl,
        sareeDate: line.sareeDate,
        purchase: {
          id: line.purchase.id,
          invoiceNumber: line.purchase.invoiceNumber,
          gstNumber: line.purchase.gstNumber,
          date: line.purchase.date,
        },
        supplier: s ? { id: s.id, name: s.name, code: s.code, city: s.city, phone: s.phone } : null,
        supplierName: s?.name ?? line.purchase.supplierName,
        pieces,
        matchedPieceNo: pieceNo,
        match,
      };
    });
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
