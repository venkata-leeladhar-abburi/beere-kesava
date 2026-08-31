import { fromGrams, toGrams } from "./weight-units.util";
import { MaterialType, Prisma } from "../generated/prisma/client";

/** The fields both incoming DTO items and persisted record items share. */
export type StockMovementLine = {
  materialType: MaterialType;
  quantity: Prisma.Decimal | number;
  unit: string;
};

/**
 * Resolve the stock row for a material and express `quantity` in that row's
 * own unit.
 *
 * Only `id` and `unit` are read — neither is touched by a concurrent writer —
 * so the amount to move never depends on the value being mutated. Stock and
 * movement quantities are often entered in different units (Jari stock in KG,
 * issued in grams), so the delta always converts through grams.
 */
async function resolveDelta(tx: Prisma.TransactionClient, line: StockMovementLine) {
  const stock = await tx.rawMaterialStock.findFirst({
    where: { materialType: line.materialType },
    select: { id: true, unit: true },
  });
  if (!stock) return null;
  return { id: stock.id, delta: fromGrams(toGrams(Number(line.quantity), line.unit), stock.unit) };
}

/**
 * Take issued quantities out of RawMaterialStock.
 *
 * Applied as an atomic `decrement` rather than read-subtract-write: two
 * issues of the same material used to read the same starting value, and the
 * second write silently discarded the first, drifting stock upward with no
 * trace of the loss.
 */
export async function deductStock(
  tx: Prisma.TransactionClient,
  items: StockMovementLine[],
): Promise<void> {
  for (const line of items) {
    const resolved = await resolveDelta(tx, line);
    if (!resolved) continue;

    // Guarded so stock can never be driven negative by a concurrent issue.
    const { count } = await tx.rawMaterialStock.updateMany({
      where: { id: resolved.id, currentStock: { gte: resolved.delta } },
      data: { currentStock: { decrement: resolved.delta } },
    });

    // Guard didn't match: the row holds less than was issued. Preserve the
    // previous clamp-at-zero behaviour rather than leaving it negative.
    if (count === 0) {
      await tx.rawMaterialStock.update({
        where: { id: resolved.id },
        data: { currentStock: 0 },
      });
    }
  }
}

/**
 * Put quantities back into RawMaterialStock — the inverse of `deductStock`,
 * atomic for the same reason.
 */
export async function restoreStock(
  tx: Prisma.TransactionClient,
  items: StockMovementLine[],
): Promise<void> {
  for (const line of items) {
    const resolved = await resolveDelta(tx, line);
    if (!resolved) continue;
    await tx.rawMaterialStock.update({
      where: { id: resolved.id },
      data: { currentStock: { increment: resolved.delta } },
    });
  }
}
