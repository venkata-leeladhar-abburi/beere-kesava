// One-off backfill: reassigns every existing wholesale customer's `code` to the
// "<FirstName>-<globalSerial>" format (e.g. "Sree-1", "Shiva-2"), ordered by
// createdAt so earlier customers get lower serials. Also advances the "WHL"
// row in IdCounter so future creates continue the same sequence.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, CustomerType } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || "Customer";
}

async function main() {
  const wholesaleCustomers = await prisma.customer.findMany({
    where: { type: CustomerType.WHOLESALE },
    orderBy: { createdAt: "asc" },
  });

  let serial = 0;
  for (const customer of wholesaleCustomers) {
    serial += 1;
    const code = `${firstNameOf(customer.name)}-${serial}`;
    await prisma.customer.update({ where: { id: customer.id }, data: { code } });
    console.log(`${customer.id}  ${customer.name}  ->  ${code}`);
  }

  await prisma.$executeRaw`
    INSERT INTO "IdCounter" (prefix, value)
    VALUES ('WHL', ${serial})
    ON CONFLICT (prefix) DO UPDATE SET value = ${serial};
  `;

  console.log(`Backfilled ${wholesaleCustomers.length} wholesale customers. WHL counter set to ${serial}.`);
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
