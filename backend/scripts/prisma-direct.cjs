#!/usr/bin/env node
// Runs `prisma <args>` against DIRECT_URL (session-mode connection — the pooled
// one can't run DDL). Plain Node so it works the same in PowerShell, cmd and
// bash, and dotenv handles a CRLF .env.
// Usage: node scripts/prisma-direct.cjs migrate deploy
const path = require("path");
const { spawnSync } = require("child_process");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const direct = process.env.DIRECT_URL;
if (!direct) {
  console.error("DIRECT_URL must be set (in backend/.env or the environment).");
  process.exit(1);
}
const result = spawnSync("npx", ["prisma", ...process.argv.slice(2)], {
  cwd: path.join(__dirname, ".."),
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, DATABASE_URL: direct, CHECKPOINT_DISABLE: "1" },
});
process.exit(result.status ?? 1);
