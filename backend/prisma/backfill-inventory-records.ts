// One-off backfill: some sarees were returned (via finishing receive or the
// quotation-receive flow) before the InventoryRecord-creation fix existed on
// those code paths, so they're stuck as RETURNED/RECEIVED with no
// InventoryRecord — dispatch 404s on them ("Saree(s) not found in
// inventory"). This creates the missing records so they become dispatchable.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const assignments = await prisma.finishingAssignment.findMany({
    where: { status: "RETURNED" },
    include: { batchSareeRow: { select: { batchId: true } } },
  });

  let created = 0;
  for (const a of assignments) {
    const existing = await prisma.inventoryRecord.findUnique({ where: { sareeId: a.sareeId } });
    if (existing) continue;
    await prisma.inventoryRecord.create({
      data: {
        sareeId: a.sareeId,
        status: a.condition === "DAMAGED" ? "DAMAGED_REVIEW_NEEDED" : "FINISHING_COMPLETE",
        rawType: "RETURN",
        batchId: a.batchSareeRow.batchId,
        quotationRef: a.quotationRef,
      },
    });
    created++;
    console.log(`Created InventoryRecord for ${a.sareeId}`);
  }

  console.log(`Done. Created ${created} missing InventoryRecord(s) out of ${assignments.length} returned assignment(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
