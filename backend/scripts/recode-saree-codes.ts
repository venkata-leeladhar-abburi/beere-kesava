// One-off correction: re-codes every external-purchase saree line whose code
// no longer matches its supplier's current short name and its purchase's
// invoice number — codes used to be frozen at first save, so edits made
// before SareeCodesService existed left them stale. Uses the same service
// the app now runs on every edit: each line's pieces move in every table that
// holds them (stock, dispatches, shop receipts, quotations, and sales/returns
// via Saree's ON UPDATE CASCADE), all in one transaction, and every old code
// is kept as an alias so tags already printed still scan.
//
// Prints the plan only. Pass --apply to write it.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SareeCodesService } from "../src/saree-codes/saree-codes.service";
import type { PrismaService } from "../src/prisma/prisma.service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const apply = process.argv.includes("--apply");
const service = new SareeCodesService(prisma as unknown as PrismaService);

async function main() {
  const plan = await service.planPurchases(prisma, "all");
  const lines = await prisma.purchaseSareeLine.findMany({
    where: { id: { in: plan.map((p) => p.id) } },
    select: { id: true, quantity: true },
  });
  const qty = new Map(lines.map((l) => [l.id, l.quantity]));
  for (const r of plan) console.log(`${r.purchaseId}  ${r.oldCode}  ->  ${r.newCode}  (${qty.get(r.id) ?? 0} pcs)`);
  const pieces = plan.reduce((sum, r) => sum + (qty.get(r.id) ?? 0), 0);
  console.log(`${plan.length} line(s), ${pieces} piece(s) to re-code.`);

  if (!apply) {
    console.log("[dry run] nothing written. Re-run with --apply to write.");
    return;
  }
  const done = await prisma.$transaction((tx) => service.recodePurchases(tx, "all"), { timeout: 120_000 });
  const aliases = await prisma.sareeCodeAlias.count();
  console.log(`Re-coded ${done.length} line(s). ${aliases} alias(es) on record.`);
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
