/**
 * One-off: restore the Firm rows lost in the db-backup-and-wipe-except-
 * admin-weaver run, from that run's own backup JSON. Keeps original ids so
 * anything still referencing a Firm by FK lines up.
 * Run with: npx ts-node scripts/restore-firms.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

interface BackedUpFirm {
  id: string;
  firmName: string;
  gstNumber: string | null;
  address: string | null;
  purchaseAmount: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  bankName: string | null;
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  createdAt: string;
}

async function main() {
  const backupFile = path.join(
    __dirname, "..", "db-backups", "backup-2026-08-10T15-41-57-611Z.json",
  );
  const dump = JSON.parse(fs.readFileSync(backupFile, "utf8")) as { Firm: BackedUpFirm[] };

  for (const firm of dump.Firm) {
    await prisma.firm.upsert({
      where: { id: firm.id },
      create: {
        id: firm.id,
        firmName: firm.firmName,
        gstNumber: firm.gstNumber,
        address: firm.address,
        purchaseAmount: firm.purchaseAmount,
        accountNumber: firm.accountNumber,
        ifscCode: firm.ifscCode,
        bankName: firm.bankName,
        contactPersonName: firm.contactPersonName,
        contactPersonPhone: firm.contactPersonPhone,
        createdAt: new Date(firm.createdAt),
      },
      update: {},
    });
    console.log(`  restored ${firm.id} — ${firm.firmName}`);
  }

  console.log(`\nDone. Restored ${dump.Firm.length} firm(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
