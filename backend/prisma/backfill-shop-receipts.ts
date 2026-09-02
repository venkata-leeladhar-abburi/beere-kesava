// One-off backfill for the shop-receiving feature. Shop stock is now gated on
// DispatchSaree.receiptStatus === RECEIVED, so every SHOP dispatch that
// predates receiving would otherwise vanish from the shop's inventory — those
// goods are demonstrably already on the shop floor (they have been sold from
// there), so they are marked received as of their own dispatch date.
//
// No ShopReceipt row is invented for them: nobody performed that receiving,
// and a fabricated SGR number in the history would be a lie. Their dispatches
// simply read RECEIVED with no receipt behind them, and so appear in neither
// the Incoming list nor the receipt history.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const dispatches = await prisma.dispatchRecord.findMany({
    where: { type: "SHOP", receiptStatus: "PENDING" },
    select: { id: true, dispatchDate: true },
  });

  for (const d of dispatches) {
    await prisma.dispatchSaree.updateMany({
      where: { dispatchId: d.id, receiptStatus: null },
      data: { receiptStatus: "RECEIVED", receivedAt: d.dispatchDate },
    });
    await prisma.dispatchRecord.update({
      where: { id: d.id },
      data: { receiptStatus: "RECEIVED" },
    });
    console.log(`Marked ${d.id} as received (legacy)`);
  }

  console.log(`Done. Backfilled ${dispatches.length} legacy SHOP dispatch(es).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
