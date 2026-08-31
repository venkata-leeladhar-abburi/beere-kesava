/**
 * One-off backfill: link every pre-existing GrnItem to the PurchaseOrderItem
 * it was received against (`poItemId`).
 *
 * New receipts record this at the receiving desk, where the pairing is exact
 * (worker/WorkerGRN.tsx → raw-materials.service.ts#createGrn). Rows received
 * before the column existed have none, so consumers fall back to guessing the
 * pairing from materialType + name — and the receiving screen rewrites a
 * line's name to its subtype, so that guess puts the wrong receipt code and
 * the wrong recovered price against a material whenever one order carried two
 * lines of the same type.
 *
 * This reconstructs the link only where it is unambiguous:
 *
 *   1. Exact — one unclaimed ordered line of that material type whose name
 *      matches the receipt line's name or subtype.
 *   2. Sole candidate — exactly one unclaimed ordered line of that material
 *      type remains, so there is nothing else it could be.
 *
 * Anything still ambiguous is left null and reported, rather than guessed:
 * a wrong link is worse than no link, because downstream code trusts it.
 *
 * Safe to re-run: only fills rows where poItemId is still null.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();

async function main() {
  // Only receipts actually tied to an order can be linked at all; an ad-hoc
  // receipt legitimately has no ordered line behind it.
  const grns = await prisma.grnReceipt.findMany({
    include: {
      items: { orderBy: { id: "asc" } },
      purchaseOrders: { include: { items: { orderBy: { id: "asc" } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  let linked = 0;
  let ambiguous = 0;
  let alreadySet = 0;

  for (const grn of grns) {
    const poItems = grn.purchaseOrders.flatMap((po) => po.items);
    if (poItems.length === 0) continue;

    // Lines already linked (by this script on an earlier run, or at receipt
    // time) hold their ordered line — don't offer it to anything else.
    const claimed = new Set(grn.items.map((i) => i.poItemId).filter((id): id is string => !!id));

    for (const item of grn.items) {
      if (item.poItemId) {
        alreadySet++;
        continue;
      }

      const candidates = poItems.filter((p) => p.materialType === item.materialType && !claimed.has(p.id));

      const byName = candidates.filter(
        (p) => norm(p.name) === norm(item.name) || norm(p.description) === norm(item.description),
      );
      const match = byName.length === 1 ? byName[0] : candidates.length === 1 ? candidates[0] : null;

      if (!match) {
        if (candidates.length > 1) {
          ambiguous++;
          console.warn(
            `  ? ${item.itemCode ?? item.id} (${item.materialType} "${item.name}") — ` +
              `${candidates.length} possible ordered lines on ${grn.id}, left unlinked`,
          );
        }
        continue;
      }

      await prisma.grnItem.update({ where: { id: item.id }, data: { poItemId: match.id } });
      claimed.add(match.id);
      linked++;
    }
  }

  console.log(
    `Linked ${linked} GrnItem row(s) to their ordered line across ${grns.length} receipt(s). ` +
      `${alreadySet} already linked, ${ambiguous} left unlinked as ambiguous.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
