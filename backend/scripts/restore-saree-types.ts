/**
 * One-off: restore the SareeTypeRate rows lost in the db-backup-and-wipe-
 * except-admin-weaver run, from that run's own backup JSON.
 * Run with: npx ts-node scripts/restore-saree-types.ts
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

interface BackedUpSareeTypeRate {
  code: string;
  type: string;
  description: string | null;
  makingCharge: string;
  retailPrice: string;
  wholesalePrice: string;
  stdWeightG: string;
  warpWeightG: string;
  reshamWeightG: string;
  jariWeightG: string;
}

async function main() {
  const backupFile = path.join(
    __dirname, "..", "db-backups", "backup-2026-08-10T15-41-57-611Z.json",
  );
  const dump = JSON.parse(fs.readFileSync(backupFile, "utf8")) as {
    SareeTypeRate: BackedUpSareeTypeRate[];
  };

  for (const rate of dump.SareeTypeRate) {
    await prisma.sareeTypeRate.upsert({
      where: { code: rate.code },
      create: {
        code: rate.code,
        type: rate.type,
        description: rate.description,
        makingCharge: rate.makingCharge,
        retailPrice: rate.retailPrice,
        wholesalePrice: rate.wholesalePrice,
        stdWeightG: rate.stdWeightG,
        warpWeightG: rate.warpWeightG,
        reshamWeightG: rate.reshamWeightG,
        jariWeightG: rate.jariWeightG,
      },
      update: {},
    });
    console.log(`  restored ${rate.code} — ${rate.type}`);
  }

  console.log(`\nDone. Restored ${dump.SareeTypeRate.length} saree type(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
