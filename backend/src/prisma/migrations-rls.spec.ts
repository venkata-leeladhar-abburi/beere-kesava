import { readdirSync, readFileSync } from "fs";
import * as path from "path";

/**
 * Every table must have row-level security, or Supabase's Data API serves it
 * to anyone holding the public anon key (see
 * prisma/migrations/20261014_enable_rls). That migration covered the tables
 * that existed then; Prisma does not model RLS, so a table added afterwards
 * gets none unless its migration says so. This catches the omission in CI.
 */
const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "prisma", "migrations");
// The first migration written under this rule. Earlier ones are covered by
// the blanket enable_rls migration.
const FIRST_CHECKED = "20261014_auth_sessions";

const migrations = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name >= FIRST_CHECKED)
  .map((d) => d.name)
  .sort();

describe("migrations / row-level security", () => {
  it("finds the migrations it is meant to check", () => {
    expect(migrations).toContain(FIRST_CHECKED);
  });

  it.each(migrations)("%s enables RLS on every table it creates", (name) => {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, name, "migration.sql"), "utf8");
    const created = [...sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"([^"]+)"/gi)].map(
      (m) => m[1],
    );
    const missing = created.filter(
      (table) =>
        !new RegExp(
          `ALTER TABLE\\s+(?:public\\.)?"${table}"\\s+ENABLE ROW LEVEL SECURITY`,
          "i",
        ).test(sql),
    );
    // Fix: add `ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;` to the migration.
    expect(missing).toEqual([]);
  });
});
