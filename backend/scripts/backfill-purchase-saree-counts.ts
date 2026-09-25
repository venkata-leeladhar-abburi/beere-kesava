// One-off backfill: recomputes every external purchase's stored `sareeCount`
// as pieces still with us (line quantity minus returnedQuantity, summed).
// Older rows drifted — create stored the netted count, edits and photo uploads
// stored the gross count, and approved supplier returns never touched it.
// Purchases with no saree lines are left alone. Pass --dry-run to only report.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { piecesWithUs } from "../src/purchases/purchases.service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const purchases = await prisma.purchase.findMany({
    select: { id: true, sareeCount: true, sareeLines: { select: { quantity: true, returnedQuantity: true } } },
  });

  let changed = 0;
  for (const p of purchases) {
    if (p.sareeLines.length === 0) continue;
    const next = piecesWithUs(p.sareeLines);
    if (next === p.sareeCount) continue;
    changed += 1;
    console.log(`${p.id}  ${p.sareeCount}  ->  ${next}`);
    if (!dryRun) await prisma.purchase.update({ where: { id: p.id }, data: { sareeCount: next } });
  }

  console.log(`${dryRun ? "[dry run] would fix" : "Fixed"} ${changed} of ${purchases.length} purchases.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
