// One-off backfill: re-derives every registered supplier's purchase statuses
// now that general supplier payments (paid against no particular purchase)
// settle that supplier's purchases oldest-first (src/purchases/supplier-
// allocation.ts). Before that, a supplier paid in full still had every
// purchase stuck at Pending. Going forward, recording a payment or changing
// a purchase re-derives the statuses itself.
// Same rule as PurchasesService.recomputeSupplierStatuses: a hand-set status
// with nothing paid against it is only ever moved to PAID.
// Reports only by default — pass --apply to write.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { paymentStatusFor } from "../src/purchases/purchases.service";
import { loadSupplierAllocation } from "../src/purchases/supplier-allocation";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const apply = process.argv.includes("--apply");

async function main() {
  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true } });
  const allocation = await loadSupplierAllocation(prisma as never, suppliers.map((s) => s.id));
  const rows = await prisma.purchase.findMany({
    where: { id: { in: allocation.purchases.map((p) => p.id) } },
    select: {
      id: true,
      status: true,
      billAmount: true,
      sareeLines: { select: { price: true, quantity: true, returnedQuantity: true } },
    },
  });
  const slices = new Map<string, number>();
  for (const a of allocation.allocations) slices.set(a.purchaseId, (slices.get(a.purchaseId) ?? 0) + 1);

  let changed = 0;
  for (const row of rows) {
    const paid = allocation.paidByPurchase.get(row.id) ?? 0;
    const next = paymentStatusFor(row.billAmount, row.sareeLines, paid, slices.get(row.id) ?? 0);
    if (!next || next === row.status) continue;
    changed += 1;
    console.log(`${row.id}  bill ${Number(row.billAmount).toFixed(2)}  paid ${paid.toFixed(2)}  ${row.status}  ->  ${next}`);
    if (apply) await prisma.purchase.update({ where: { id: row.id }, data: { status: next } });
  }

  console.log(`${apply ? "Updated" : "[dry run] would update"} ${changed} of ${rows.length} purchases.`);
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
