import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditLogService } from "../audit-log/audit-log.service";
import { Prisma, QcResult } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { returnedPieceSet } from "../purchases/returned-pieces";

/**
 * Where a saree's inventory photo came from:
 *  - "inventory": set on the saree itself — BatchSareeRow.receivedPhotoUrl for
 *    a woven saree, PurchaseSareeLine.pieceImageUrls[n] for a purchased piece.
 *    This is what the Saree Photos page and the admin inventory table write.
 *  - "qc": no photo of its own yet, so the latest QC inspection photo stands
 *    in — the same fallback every inventory screen already applies.
 */
export type SareePhotoSource = "inventory" | "qc";

export interface SareePhotoRecord {
  sareeId: string;
  origin: "production" | "external";
  /** Where the saree is in its life, in words Worker Staff use. */
  stage: string;
  designCode: string | null;
  designName: string | null;
  sareeType: string | null;
  color: string | null;
  weightG: number | null;
  /** Production only. */
  batchId: string | null;
  maker: { kind: "weaver" | "loom"; label: string } | null;
  receivedAt: string | null;
  qc: { result: QcResult; date: string } | null;
  /** External purchase only. */
  purchase: {
    id: string;
    supplier: string | null;
    invoiceNumber: string | null;
    date: string;
    lineCode: string;
    pieceNo: number;
    lineQuantity: number;
    /** The purchase line's own photo — shared by every piece of the line, so it is not this piece's photo. */
    linePhotoUrl: string | null;
  } | null;
  photo: { url: string; source: SareePhotoSource } | null;
}

const productionSelect = {
  sareeId: true,
  batchId: true,
  recipientType: true,
  receivedAt: true,
  receivedColor: true,
  receivedWeight: true,
  receivedPhotoUrl: true,
  qcPassed: true,
  weaver: { select: { firstName: true, lastName: true } },
  factoryLoom: { select: { code: true, loomNumber: true } },
  design: { select: { code: true, name: true } },
  sareeType: { select: { type: true } },
  qcRecords: {
    orderBy: { qcDate: "desc" },
    take: 1,
    select: { result: true, qcDate: true, photoUrl: true },
  },
} satisfies Prisma.BatchSareeRowSelect;
type ProductionRow = Prisma.BatchSareeRowGetPayload<{ select: typeof productionSelect }>;

const lineInclude = {
  purchase: { select: { id: true, date: true, invoiceNumber: true, supplierName: true, supplier: { select: { name: true } } } },
} satisfies Prisma.PurchaseSareeLineInclude;
type LineRow = Prisma.PurchaseSareeLineGetPayload<{ include: typeof lineInclude }>;

type Resolved =
  | { kind: "production"; row: ProductionRow }
  | { kind: "external"; line: LineRow; pieceNo: number; sareeId: string };

/**
 * Photos of individual sarees for inventory — found by the code on the tag,
 * photographed by Worker Staff (or an admin from the inventory table).
 *
 * Deliberately has no column of its own: it writes the photo into the field
 * every inventory, QC, tally and sale screen already reads, so a saree
 * photographed here shows up everywhere without any of them changing.
 */
@Injectable()
export class SareePhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async lookup(rawCode: string): Promise<SareePhotoRecord> {
    return this.toRecord(await this.resolve(rawCode));
  }

  async setPhoto(rawCode: string, photoUrl: string, actorId?: string): Promise<SareePhotoRecord> {
    const found = await this.resolve(rawCode);
    const sareeId = found.kind === "production" ? found.row.sareeId! : found.sareeId;
    let previous: string | null;

    if (found.kind === "production") {
      previous = found.row.receivedPhotoUrl;
      await this.prisma.batchSareeRow.update({
        where: { sareeId },
        data: { receivedPhotoUrl: photoUrl },
      });
    } else {
      // Read-modify-write inside a transaction against the freshest array, so
      // two pieces of the same line photographed at once don't erase each other.
      previous = await this.prisma.$transaction(async (tx) => {
        const current = await tx.purchaseSareeLine.findUniqueOrThrow({
          where: { id: found.line.id },
          select: { pieceImageUrls: true, quantity: true },
        });
        const urls = Array.from({ length: Math.max(current.quantity, current.pieceImageUrls.length) }, (_, i) => current.pieceImageUrls[i] ?? "");
        const before = urls[found.pieceNo - 1] || null;
        urls[found.pieceNo - 1] = photoUrl;
        await tx.purchaseSareeLine.update({ where: { id: found.line.id }, data: { pieceImageUrls: urls } });
        return before;
      });
    }

    await this.auditLog.recordAction({
      actorId,
      module: "INVENTORY",
      action: previous ? `Replaced the photo of saree ${sareeId}` : `Added a photo for saree ${sareeId}`,
      entityType: found.kind === "production" ? "BatchSareeRow" : "PurchaseSareeLine",
      entityId: found.kind === "production" ? sareeId : found.line.id,
      recordLabel: sareeId,
      // Never log an inline base64 blob — it would bloat the audit feed by MBs.
      oldValue: previous && !previous.startsWith("data:") ? previous : null,
      newValue: photoUrl,
    });

    return this.lookup(sareeId);
  }

  /**
   * Turns a scanned or typed code into the saree it names. A woven saree is a
   * BatchSareeRow; anything else may be a purchased piece, whose code is the
   * purchase line's code plus a 2-digit piece number (pieceCodeFromLineCode on
   * the frontend). Matching is case-insensitive so a hand-typed code works.
   */
  private async resolve(rawCode: string): Promise<Resolved> {
    const code = normaliseCode(rawCode);
    if (!code) throw new NotFoundException("Enter or scan a saree ID.");

    const row =
      (await this.prisma.batchSareeRow.findUnique({ where: { sareeId: code }, select: productionSelect })) ??
      (await this.prisma.batchSareeRow.findFirst({
        where: { sareeId: { equals: code, mode: "insensitive" } },
        select: productionSelect,
      }));
    if (row?.sareeId) return { kind: "production", row };

    const pieceMatch = /^(.+)-(\d{1,3})$/.exec(code);
    if (pieceMatch) {
      const pieceNo = Number(pieceMatch[2]);
      const lines = (
        await this.prisma.purchaseSareeLine.findMany({
          where: { code: { equals: pieceMatch[1], mode: "insensitive" } },
          include: lineInclude,
        })
      ).filter((l) => pieceNo >= 1 && pieceNo <= l.quantity);
      if (lines.length > 1) {
        throw new ConflictException(`"${code}" matches more than one purchased saree — ask an admin to check the purchase codes.`);
      }
      if (lines.length === 1) {
        const line = lines[0];
        return { kind: "external", line, pieceNo, sareeId: `${line.code}-${String(pieceNo).padStart(2, "0")}` };
      }
    }

    throw new NotFoundException(`No saree found with ID "${code}". Check the code on the tag.`);
  }

  private toRecord(found: Resolved): SareePhotoRecord {
    if (found.kind === "production") {
      const { row } = found;
      const qc = row.qcRecords[0] ?? null;
      const ownPhoto = row.receivedPhotoUrl || null;
      const qcPhoto = qc?.photoUrl || null;
      return {
        sareeId: row.sareeId!,
        origin: "production",
        stage: productionStage(row),
        designCode: row.design?.code ?? null,
        designName: row.design?.name ?? null,
        sareeType: row.sareeType?.type ?? null,
        color: row.receivedColor ?? null,
        weightG: row.receivedWeight != null ? Number(row.receivedWeight) : null,
        batchId: row.batchId,
        maker: row.weaver
          ? { kind: "weaver", label: `${row.weaver.firstName} ${row.weaver.lastName}`.trim() }
          : row.factoryLoom
            ? { kind: "loom", label: row.factoryLoom.code ?? row.factoryLoom.loomNumber }
            : null,
        receivedAt: row.receivedAt?.toISOString() ?? null,
        qc: qc ? { result: qc.result, date: qc.qcDate.toISOString() } : null,
        purchase: null,
        photo: ownPhoto
          ? { url: ownPhoto, source: "inventory" }
          : qcPhoto
            ? { url: qcPhoto, source: "qc" }
            : null,
      };
    }

    const { line, pieceNo, sareeId } = found;
    const returned = returnedPieceSet(line.quantity, line.returnedQuantity, line.returnedPieceNos).has(pieceNo);
    const piecePhoto = line.pieceImageUrls[pieceNo - 1] || null;
    const weight = line.weight ? Number(line.weight.replace(/\s*g$/i, "")) : NaN;
    return {
      sareeId,
      origin: "external",
      stage: returned ? "Returned to supplier" : "Purchased stock",
      designCode: null,
      designName: null,
      sareeType: line.sareeType || null,
      color: line.color || null,
      weightG: Number.isFinite(weight) && weight > 0 ? weight : null,
      batchId: null,
      maker: null,
      receivedAt: null,
      qc: null,
      purchase: {
        id: line.purchase.id,
        supplier: line.purchase.supplier?.name ?? line.purchase.supplierName ?? null,
        invoiceNumber: line.purchase.invoiceNumber ?? null,
        date: line.purchase.date.toISOString(),
        lineCode: line.code,
        pieceNo,
        lineQuantity: line.quantity,
        linePhotoUrl: line.imageUrl || null,
      },
      photo: piecePhoto ? { url: piecePhoto, source: "inventory" } : null,
    };
  }
}

/** A scanned QR tag carries a URL ending in ?id=<code> — reduce it to the code. */
export function normaliseCode(raw: string): string {
  const trimmed = (raw ?? "").trim();
  const fromUrl = /[?&]id=([^&#\s]+)/i.exec(trimmed);
  let code = fromUrl ? fromUrl[1] : trimmed;
  try {
    code = decodeURIComponent(code);
  } catch {
    // A stray "%" in a hand-typed code — use it as typed.
  }
  return code.trim();
}

function productionStage(row: ProductionRow): string {
  const qc = row.qcRecords[0];
  if (row.qcPassed === true) return "QC passed";
  if (row.receivedAt) return "Received — awaiting QC";
  if (qc && qc.result !== QcResult.PASSED) return "Back with weaver for rework";
  return "Not yet received";
}
