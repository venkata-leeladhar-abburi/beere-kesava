import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LineRename, mergeAliases, planLineRenames, splitPieceCode, supplierPrefix } from "./saree-codes";

type Client = Prisma.TransactionClient | PrismaService;

/**
 * Every table that stores an external-purchase piece code ("{line}-{piece}")
 * as text. SaleRecord and ReturnRecord also hold it, but through a foreign
 * key to Saree.id declared ON UPDATE CASCADE, so re-coding Saree carries
 * them along. Historical text (ActionLog messages, Notification payloads)
 * is deliberately left as written — it records what the code was then.
 */
const PIECE_COLUMNS: { table: string; column: string; externalOnly?: boolean }[] = [
  { table: "Saree", column: "id", externalOnly: true },
  { table: "InventoryRecord", column: "sareeId" },
  { table: "DispatchSaree", column: "sareeId" },
  { table: "ShopReceiptItem", column: "sareeId" },
  { table: "QuotationSaree", column: "sareeId" },
];

export interface RecodeResult extends LineRename {
  purchaseId: string;
}

/**
 * Keeps external-purchase saree codes in step with what they're built from.
 *
 * A line code is "{supplier short name}-{invoice number}-{serial}" and every
 * physical piece's id is that plus "-{piece}". Both are printed as the
 * barcode on the tag. When the short name or the invoice number is edited,
 * the codes are rebuilt and written to every table holding them, in the same
 * transaction as the edit — and the old line code is kept as an alias, so a
 * tag printed before the change still scans to the same saree until it's
 * reprinted.
 */
@Injectable()
export class SareeCodesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The current code for a scanned or typed one: itself, unless it's a line
   * or piece code that has since been re-coded. Case-insensitive fallback
   * for codes typed by hand.
   */
  async resolve(raw: string, client: Client = this.prisma): Promise<string> {
    const [resolved] = await this.resolveMany([raw], client);
    return resolved;
  }

  async resolveMany(raws: string[], client: Client = this.prisma): Promise<string[]> {
    const codes = raws.map((r) => (r ?? "").trim());
    const candidates = new Set<string>();
    for (const c of codes) {
      if (!c) continue;
      for (const v of new Set([c, c.toUpperCase()])) {
        candidates.add(v);
        const piece = splitPieceCode(v);
        if (piece) candidates.add(piece.lineCode);
      }
    }
    if (candidates.size === 0) return codes;
    const aliases = await client.sareeCodeAlias.findMany({ where: { oldCode: { in: [...candidates] } } });
    if (aliases.length === 0) return codes;
    const byOld = new Map(aliases.map((a) => [a.oldCode, a.newCode]));
    return codes.map((c) => {
      for (const v of new Set([c, c.toUpperCase()])) {
        const whole = byOld.get(v);
        if (whole) return whole;
        const piece = splitPieceCode(v);
        const line = piece && byOld.get(piece.lineCode);
        if (piece && line) return `${line}-${piece.pieceSuffix}`;
      }
      return c;
    });
  }

  /**
   * The renames re-coding these purchases would make, without making them.
   */
  async planPurchases(client: Client, purchaseIds: string[] | "all"): Promise<RecodeResult[]> {
    const purchases = await client.purchase.findMany({
      where: purchaseIds === "all" ? {} : { id: { in: purchaseIds } },
      select: {
        id: true,
        invoiceNumber: true,
        supplierName: true,
        supplier: { select: { name: true, shortName: true } },
        sareeLines: { select: { id: true, code: true } },
      },
    });
    return purchases.flatMap((p) => {
      const prefix = supplierPrefix(p.supplier?.name ?? p.supplierName, p.supplier?.shortName);
      return planLineRenames(p.sareeLines, prefix, p.invoiceNumber).map((r) => ({ ...r, purchaseId: p.id }));
    });
  }

  /**
   * Re-codes the given purchases' lines to match their current supplier short
   * name and invoice number. Must run inside the transaction that made the
   * change, so the edit and the re-code land (or fail) together. Refuses —
   * rolling the whole edit back — if a new code would clash with a line
   * that isn't being re-coded.
   */
  async recodePurchases(tx: Prisma.TransactionClient, purchaseIds: string[] | "all"): Promise<RecodeResult[]> {
    const renames = await this.planPurchases(tx, purchaseIds);
    if (renames.length > 0) {
      await this.assertNoClash(tx, renames);
      // Two hops through codes nothing else can hold, so a swap (purchase A
      // takes B's invoice number while B takes A's) never trips a unique
      // constraint half way.
      const token = randomUUID().slice(0, 8);
      const tmp = (r: RecodeResult) => `~RECODE~${token}~${r.id}`;
      await this.rewrite(tx, renames.map((r) => ({ id: r.id, from: r.oldCode, to: tmp(r) })));
      await this.rewrite(tx, renames.map((r) => ({ id: r.id, from: tmp(r), to: r.newCode })));
    }
    await this.updateAliases(tx, renames, purchaseIds);
    return renames;
  }

  private async assertNoClash(tx: Prisma.TransactionClient, renames: RecodeResult[]) {
    const seen = new Map<string, RecodeResult>();
    for (const r of renames) {
      const other = seen.get(r.newCode);
      if (other) {
        throw new BadRequestException(
          `This change would give two saree lines the same code ${r.newCode} (purchases ${other.purchaseId} and ${r.purchaseId}). ` +
            `Give one of those purchases a different invoice number first.`,
        );
      }
      seen.set(r.newCode, r);
    }
    const clash = await tx.purchaseSareeLine.findFirst({
      where: { code: { in: [...seen.keys()] }, id: { notIn: renames.map((r) => r.id) } },
      select: { code: true, purchaseId: true },
    });
    if (clash) {
      throw new BadRequestException(
        `This change would re-code sarees to ${clash.code}, which purchase ${clash.purchaseId} already uses. ` +
          `Use a different short name or invoice number.`,
      );
    }
  }

  /** Moves line codes, and every piece code under them, from → to. */
  private async rewrite(tx: Prisma.TransactionClient, moves: { id: string; from: string; to: string }[]) {
    const lineValues = Prisma.join(moves.map((m) => Prisma.sql`(${m.id}::text, ${m.to}::text)`));
    await tx.$executeRaw`
      UPDATE "PurchaseSareeLine" AS l SET "code" = m.code
      FROM (VALUES ${lineValues}) AS m(id, code)
      WHERE l."id" = m.id`;

    const pieceValues = Prisma.join(moves.map((m) => Prisma.sql`(${m.from}::text, ${m.to}::text)`));
    for (const { table, column, externalOnly } of PIECE_COLUMNS) {
      const t = Prisma.raw(`"${table}"`);
      const c = Prisma.raw(`"${column}"`);
      const onlyExternal = externalOnly ? Prisma.sql`AND x."origin" = 'EXTERNAL'` : Prisma.empty;
      // A piece of line L is exactly "L-<digits>": the prefix must match up to
      // and including the dash, and only digits may follow.
      await tx.$executeRaw`
        UPDATE ${t} AS x SET ${c} = m.to_code || substr(x.${c}, length(m.from_code) + 1)
        FROM (VALUES ${pieceValues}) AS m(from_code, to_code)
        WHERE left(x.${c}, length(m.from_code) + 1) = m.from_code || '-'
          AND substr(x.${c}, length(m.from_code) + 2) ~ '^[0-9]+$'
          ${onlyExternal}`;
    }
  }

  /**
   * Records old → new for every renamed line, flattens chains, and drops any
   * alias whose old code now belongs to a live line again — a live code
   * always means that line, never an alias.
   */
  private async updateAliases(
    tx: Prisma.TransactionClient,
    renames: RecodeResult[],
    purchaseIds: string[] | "all",
  ) {
    const live = await tx.purchaseSareeLine.findMany({
      where: purchaseIds === "all" ? {} : { purchaseId: { in: purchaseIds } },
      select: { code: true },
    });
    const liveCodes = new Set(live.map((l) => l.code));
    const touched = [...new Set([...renames.map((r) => r.oldCode), ...liveCodes])];
    if (touched.length === 0) return;
    const existing = await tx.sareeCodeAlias.findMany({
      where: { OR: [{ newCode: { in: renames.map((r) => r.oldCode) } }, { oldCode: { in: touched } }] },
    });
    const { upsert, remove } = mergeAliases(existing, renames, liveCodes);
    if (remove.length > 0) await tx.sareeCodeAlias.deleteMany({ where: { oldCode: { in: remove } } });
    for (const a of upsert) {
      await tx.sareeCodeAlias.upsert({
        where: { oldCode: a.oldCode },
        create: a,
        update: { newCode: a.newCode },
      });
    }
  }
}
