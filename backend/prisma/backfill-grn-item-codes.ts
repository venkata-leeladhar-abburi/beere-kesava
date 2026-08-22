/**
 * One-off backfill: give every pre-existing GrnItem a structured `itemCode`
 * ("{grnId}-{position}", e.g. "GRN-SreeVignesh-004-002-1").
 *
 * New receipts get this at creation time (raw-materials.service.ts#createGrn);
 * rows received before that field existed have none, which left them showing a
 * bare receipt id on the Issue Material screen while Receive Stock showed the
 * per-line code — the "GRN ids don't match between pages" problem.
 *
 * Safe to re-run: only fills rows where itemCode is still null.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const grns = await prisma.grnReceipt.findMany({
    include: { items: { orderBy: { id: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  let filled = 0;
  for (const grn of grns) {
    for (const [index, item] of grn.items.entries()) {
      if (item.itemCode) continue;
      await prisma.grnItem.update({
        where: { id: item.id },
        data: { itemCode: `${grn.id}-${index + 1}` },
      });
      filled++;
    }
  }

  console.log(`Backfilled ${filled} GrnItem itemCode value(s) across ${grns.length} receipt(s).`);
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
