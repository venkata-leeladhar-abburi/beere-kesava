/**
 * One-off: dump every table in the public schema to a timestamped JSON backup,
 * then remove all data EXCEPT the User table, which is kept in full.
 * Run with: npx ts-node scripts/db-backup-and-wipe-except-users.ts
 *
 * Differs from db-backup-and-wipe-except-admins.ts only in that non-admin
 * logins (WORKER / WEAVER / SHOP / ACCOUNTANT) are kept too, so every portal
 * still has a sign-in for a mock trial.
 *
 * Kept: User (all roles), Permission, RolePermission (static RBAC config).
 *
 * Weaver is NOT truncated: User.linkedWeaverId is an FK to Weaver, so
 * TRUNCATE "Weaver" ... CASCADE would cascade into User and delete the very
 * rows this script exists to preserve. It is emptied with a plain DELETE
 * afterwards, once everything referencing it is already gone. Weaver logins
 * therefore survive with linkedWeaverId nulled and no roster record.
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

/** Never truncated: static RBAC config, plus the two handled explicitly below. */
const KEEP_TABLES = new Set(["Permission", "RolePermission", "User", "Weaver"]);

async function main() {
  const tables = (
    await prisma.$queryRawUnsafe<{ table_name: string }[]>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
         AND table_name NOT LIKE '\\_prisma%'
       ORDER BY table_name`,
    )
  ).map((r) => r.table_name);

  const backupDir = path.join(__dirname, "..", "db-backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `backup-${stamp}.json`);

  const dump: Record<string, unknown[]> = {};
  let totalRows = 0;
  for (const table of tables) {
    const rows = await prisma.$queryRawUnsafe<unknown[]>(`SELECT * FROM "${table}"`);
    dump[table] = rows;
    totalRows += rows.length;
    console.log(`  backed up ${table}: ${rows.length} rows`);
  }

  // Prisma returns bigint/Decimal for some columns; neither is JSON-serializable.
  fs.writeFileSync(
    backupFile,
    JSON.stringify(dump, (_k: string, v: unknown) => (typeof v === "bigint" ? v.toString() : v), 2),
  );
  const bytes = fs.statSync(backupFile).size;
  console.log(`\nBackup written to ${backupFile} (${totalRows} rows, ${bytes} bytes)\n`);

  // Refuse to wipe behind a backup that didn't actually land.
  if (bytes < 100) {
    throw new Error("Backup file looks empty — aborting before truncation.");
  }

  const truncatable = tables.filter((t) => !KEEP_TABLES.has(t));
  console.log(`Truncating ${truncatable.length} tables (keeping ${[...KEEP_TABLES].join(", ")})...`);
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${truncatable.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`,
  );

  // Drop the FK into Weaver before emptying it, then delete (not truncate) so
  // nothing cascades back into User.
  await prisma.$executeRawUnsafe(`UPDATE "User" SET "linkedWeaverId" = NULL;`);
  const weaversDeleted = await prisma.$executeRawUnsafe(`DELETE FROM "Weaver";`);
  console.log(`Deleted ${weaversDeleted} Weaver row(s).`);

  const kept = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log(`\nDone. All ${kept.length} user(s) kept:`);
  for (const u of kept) console.log(`  ${u.role}  ${u.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
