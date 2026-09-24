import type { PrismaService } from "../prisma/prisma.service";

/**
 * Per-piece selling price of an external purchase line — cost plus the
 * line's sell-percent mark-up, rounded to paise. Shared by the scanner (which
 * prices the saree at the counter) and the sale notifications below.
 */
export function sellingPerPiece(price: number, sellPercent: number): number {
  return Math.round((price + (price * sellPercent) / 100) * 100) / 100;
}

/** Where a saree came from — the same three answers the admin bill prints. */
export interface SareeSource {
  kind: "weaver" | "factory" | "external";
  name: string;
  /** Loom number, or the supplier's invoice number. */
  detail: string | null;
}

export interface SareeDetails {
  sareeId: string;
  /** "CODE · Type", or the purchase line's free-text type. */
  sareeType: string | null;
  source: SareeSource | null;
  /** The saree's retail rate before any counter discount, when known. */
  retailPrice: number | null;
}

/**
 * Type, source and retail rate for a set of sarees, whichever way each one
 * entered the business: woven here (BatchSareeRow), bought from a supplier
 * (Saree + Purchase, or still only a PurchaseSareeLine), or a hand-registered
 * return (Saree alone). Anything unresolvable comes back with nulls rather
 * than failing — this only ever feeds a notification.
 */
export async function loadSareeDetails(
  prisma: PrismaService,
  sareeIds: string[],
): Promise<Map<string, SareeDetails>> {
  const out = new Map<string, SareeDetails>();
  if (sareeIds.length === 0) return out;

  const rows = await prisma.batchSareeRow.findMany({
    where: { sareeId: { in: sareeIds } },
    include: { weaver: true, factoryLoom: true, sareeType: true },
  });
  for (const row of rows) {
    const id = row.sareeId!;
    const loom = row.weaver ? id.match(/-L(\d+)-B/)?.[1] : undefined;
    out.set(id, {
      sareeId: id,
      sareeType: row.sareeType ? `${row.sareeType.code} · ${row.sareeType.type}` : row.sareeTypeCode,
      source: row.weaver
        ? { kind: "weaver", name: row.weaver.name, detail: loom ? `Loom ${loom}` : null }
        : row.factoryLoom
          ? { kind: "factory", name: `Factory Loom ${row.factoryLoom.code ?? row.factoryLoom.loomNumber}`, detail: null }
          : null,
      retailPrice: row.receivedSellingPrice
        ? Number(row.receivedSellingPrice)
        : row.sareeType
          ? Number(row.sareeType.retailPrice)
          : null,
    });
  }

  const rest = sareeIds.filter((id) => !out.has(id));
  if (rest.length === 0) return out;

  const sarees = await prisma.saree.findMany({
    where: { id: { in: rest } },
    include: { weaver: true, factoryLoom: true, sareeType: true, purchase: { include: { supplier: true } } },
  });
  const sareeById = new Map(sarees.map((s) => [s.id, s]));

  // External pieces are "{lineCode}-{pieceNo}"; the line carries the type
  // text and the price the piece sells at.
  const lineCodeOf = (id: string) => id.match(/^(.+)-(\d{2,})$/)?.[1];
  const lineCodes = [...new Set(rest.map(lineCodeOf).filter((c): c is string => !!c))];
  const lines = lineCodes.length
    ? await prisma.purchaseSareeLine.findMany({
        where: { code: { in: lineCodes } },
        include: { purchase: { include: { supplier: true } } },
      })
    : [];
  const lineByCode = new Map(lines.map((l) => [l.code, l]));

  for (const id of rest) {
    const saree = sareeById.get(id);
    const lineCode = lineCodeOf(id);
    const line = lineCode ? lineByCode.get(lineCode) : undefined;
    const purchase = saree?.purchase ?? line?.purchase ?? null;
    const supplierName = purchase?.supplier?.name ?? purchase?.supplierName ?? null;

    const source: SareeSource | null = supplierName
      ? { kind: "external", name: supplierName, detail: purchase?.invoiceNumber ? `Invoice ${purchase.invoiceNumber}` : null }
      : saree?.weaver
        ? { kind: "weaver", name: saree.weaver.name, detail: null }
        : saree?.factoryLoom
          ? { kind: "factory", name: `Factory Loom ${saree.factoryLoom.code ?? saree.factoryLoom.loomNumber}`, detail: null }
          : null;

    out.set(id, {
      sareeId: id,
      sareeType: saree?.sareeType
        ? `${saree.sareeType.code} · ${saree.sareeType.type}`
        : (line?.sareeType ?? saree?.sareeTypeCode ?? null),
      source,
      retailPrice: line
        ? sellingPerPiece(Number(line.price), Number(line.sellPercent))
        : saree?.sareeType
          ? Number(saree.sareeType.retailPrice)
          : null,
    });
  }
  return out;
}
