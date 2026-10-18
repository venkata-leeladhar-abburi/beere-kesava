// One-off backfill: re-derives the payment status of every external purchase
// that has sarees returned to its supplier, now that approved returns are
// credited off the bill (creditedAmount). Before that, a purchase whose
// returns covered what was left to pay stayed PARTIAL / PENDING; going
// forward, approving a return re-derives the status itself.
// Uses the same rule as PurchasesService.recomputeStatus (paymentStatusFor),
// so a hand-set status with no linked payments is only ever moved to PAID.
// Reports only by default — pass --apply to write.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { creditedAmount, paymentStatusFor } from "../src/purchases/purchases.service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const apply = process.argv.includes("--apply");

async function main() {
  const purchases = await prisma.purchase.findMany({
    where: { sareeLines: { some: { returnedQuantity: { gt: 0 } } } },
    select: {
      id: true,
      billAmount: true,
      status: true,
      sareeLines: { select: { price: true, quantity: true, returnedQuantity: true } },
      payments: { select: { amount: true } },
    },
  });

  let changed = 0;
  for (const p of purchases) {
    const paid = p.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const next = paymentStatusFor(p.billAmount, p.sareeLines, paid, p.payments.length);
    if (!next || next === p.status) continue;
    changed += 1;
    const credit = creditedAmount(p.billAmount, p.sareeLines);
    console.log(
      `${p.id}  bill ${Number(p.billAmount).toFixed(2)}  credit ${credit.toFixed(2)}  paid ${paid.toFixed(2)}  ${p.status}  ->  ${next}`,
    );
    if (apply) await prisma.purchase.update({ where: { id: p.id }, data: { status: next } });
  }

  console.log(
    `${apply ? "Updated" : "[dry run] would update"} ${changed} of ${purchases.length} purchases with returned sarees.`,
  );
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
