/**
 * Runs once before the whole integration suite (see
 * jest-integration.config.js's `globalSetup`), not per test file — pushing
 * the schema and reseeding is a few seconds against a local Postgres, but
 * doing it per-file across dozens of controller specs would dominate the
 * run time for no benefit, since specs are written to use uniquely-prefixed
 * data (see test/utils/test-app.ts) rather than relying on a pristine table.
 *
 * `--force-reset` before push guarantees the schema itself can never drift
 * from what a fresh checkout would get, even if a previous local run left
 * stray tables from an older schema version.
 */
import { execFileSync } from "child_process";
import * as path from "path";
import * as dotenv from "dotenv";

const BACKEND_ROOT = path.join(__dirname, "..", "..");

export default function globalSetup(): void {
  const envPath = path.join(BACKEND_ROOT, ".env.test");
  const parsed = dotenv.config({ path: envPath }).parsed;
  if (!parsed?.DATABASE_URL) {
    throw new Error(
      `backend/.env.test not found or missing DATABASE_URL — integration tests need a ` +
        `disposable Postgres to run against (see test/README.md), and must never point at ` +
        `backend/.env's shared database.`,
    );
  }
  if (parsed.DATABASE_URL.includes("supabase.com") || parsed.DATABASE_URL.includes("pooler")) {
    throw new Error(
      "backend/.env.test's DATABASE_URL looks like the shared Supabase instance, not a " +
        "disposable local database. Refusing to run integration tests against it — they " +
        "create and delete real rows.",
    );
  }

  const env = {
    ...process.env,
    ...parsed,
    // Passed as an env var rather than ts-node's --compiler-options CLI flag:
    // that flag's JSON value goes through Windows's shell quoting when
    // execFileSync runs with shell:true, and cmd.exe strips the surrounding
    // quotes before ts-node ever sees the string, breaking JSON.parse. The
    // env var reaches ts-node unmangled.
    TS_NODE_COMPILER_OPTIONS: JSON.stringify({
      module: "commonjs",
      target: "ES2021",
      esModuleInterop: true,
    }),
  };

  const run = (args: string[]) =>
    execFileSync("npx", args, { cwd: BACKEND_ROOT, env, stdio: "inherit", shell: true });

  run(["prisma", "db", "push", "--force-reset", "--accept-data-loss"]);
  run(["ts-node", "prisma/seed.ts"]);
}
