/**
 * Full JSON snapshot of every table in the public schema, written outside the
 * repository so a dump containing business data is never committed.
 *
 * Used as the pre-migration safety net for the business-ID rollout. pg_dump is
 * not installed on this machine, and the dataset is small enough that a
 * row-by-row JSON dump is a faithful, restorable substitute.
 *
 *   npx ts-node scripts/backup-db.ts
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Pool } from "pg";

// Schema-changing/administrative work uses the direct connection: the pooled
// one (pgbouncer) is unsuitable, same reason scripts/db-push.sh substitutes it.
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function main() {
  const { rows: tables } = await pool.query<{ table_name: string }>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const dump: Record<string, unknown[]> = {};
  let total = 0;
  for (const { table_name } of tables) {
    // Table names come from information_schema, not user input, but they are
    // still quoted — this schema uses case-sensitive identifiers ("Customer").
    const { rows } = await pool.query(`SELECT * FROM "${table_name}"`);
    dump[table_name] = rows;
    total += rows.length;
    console.log(`${table_name}: ${rows.length}`);
  }

  const dir = join(homedir(), "beere-kesava-backups");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = join(dir, `db-snapshot-${stamp}.json`);
  writeFileSync(file, JSON.stringify({ takenAt: new Date().toISOString(), tables: dump }, null, 2));

  console.log(`\n${tables.length} tables, ${total} rows`);
  console.log(`Written to ${file}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
