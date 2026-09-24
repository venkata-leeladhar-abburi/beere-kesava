/**
 * Puts past sales into the admin feed's Retail Sales and Wholesale Sales tabs.
 *
 * Those tabs only fill as sales happen, and until recently an external-
 * purchase saree raised no notification when sold at all — so the feed shows
 * the newest bill and none of the sales before it. This writes one
 * notification per past bill (and per wholesale dispatch invoice) for every
 * sale the live app never announced, dated to the sale and already read.
 *
 * Idempotent: rows it writes carry `payload.backfilled = true` and
 * `payload.backfillSource = "sales"`, and a re-run replaces only those. Sales
 * the live app announced are never touched or duplicated.
 *
 *   npx ts-node prisma/backfill-sale-notifications.ts           # dry run, writes nothing
 *   npx ts-node prisma/backfill-sale-notifications.ts --commit  # actually writes
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { NotificationTargetType, PrismaClient, UserRole } from "../src/generated/prisma/client";
import { planSaleNotifications } from "./sale-notification-plan";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const COMMIT = process.argv.includes("--commit");
const SOURCE = { path: ["backfillSource"], equals: "sales" } as const;

async function main() {
  const planned = await planSaleNotifications(prisma);

  console.table(
    planned.map((p) => {
      const payload = p.payload as { billRef?: string; invoiceNumber?: string; saleRef?: string; customerName?: string; sareeCount?: number; total?: number; grandTotal?: number; amount?: number };
      return {
        type: p.type,
        date: p.createdAt.toISOString().slice(0, 16).replace("T", " "),
        ref: payload.billRef ?? payload.invoiceNumber ?? payload.saleRef ?? "—",
        customer: payload.customerName ?? "—",
        sarees: payload.sareeCount ?? 1,
        amount: payload.total ?? payload.grandTotal ?? payload.amount ?? 0,
      };
    }),
  );
  // Every saree the bills above will list, so a dry run can be checked line by line.
  console.table(
    planned.flatMap((p) => {
      const payload = p.payload as { billRef?: string; lines?: Record<string, unknown>[] };
      return (payload.lines ?? []).map((l) => ({
        bill: payload.billRef,
        saree: l.sareeId,
        type: l.sareeType ?? "—",
        source: (l.source as { name?: string } | null)?.name ?? "—",
        rate: l.rate,
        discount: l.discount,
        paid: l.amount,
      }));
    }),
  );
  console.log(`\n${planned.length} notification(s) planned.`);

  if (!COMMIT) {
    console.log("Dry run — nothing written. Re-run with --commit to apply.");
    return;
  }

  const removed = await prisma.notification.deleteMany({ where: { payload: SOURCE } });
  if (removed.count > 0) console.log(`Removed ${removed.count} row(s) from a previous run.`);

  await prisma.notification.createMany({
    data: planned.map((p) => ({
      targetType: NotificationTargetType.ROLE,
      role: UserRole.ADMIN,
      type: p.type,
      payload: { ...p.payload, backfilled: true, backfillSource: "sales" },
      createdAt: p.createdAt,
      // Past sales are history, not news: they land read, so the unread
      // badge keeps meaning "something happened that you have not seen".
      readAt: new Date(),
    })),
  });
  console.log(`Wrote ${planned.length} notification(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
