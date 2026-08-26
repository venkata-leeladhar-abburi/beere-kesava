import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client";
import { ResilientPool } from "./src/prisma/resilient-pool";

// Inject BELOW ResilientPool so its retry logic is what handles the failure.
let armed = 0;
const realQuery = Pool.prototype.query;
(Pool.prototype as any).query = function (...args: any[]) {
  const text = (typeof args[0] === "string" ? args[0] : args[0]?.text) ?? "";
  if (armed > 0 && /^\s*SELECT/i.test(text)) { armed--; console.log("    [inject drop]", text.slice(0, 45).replace(/\s+/g, " ")); return Promise.reject(new Error("Connection terminated unexpectedly")); }
  const t = Date.now();
  const p = realQuery.apply(this, args as any) as Promise<any>;
  return p.then((r) => { console.log(`    [sql ${Date.now() - t}ms]`, text.slice(0, 45).replace(/\s+/g, " ")); return r; },
                (e) => { console.log(`    [sql ERR ${Date.now() - t}ms]`, e.message, "|", text.slice(0, 45).replace(/\s+/g, " ")); throw e; });
};

const pool = new ResilientPool({
  connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 15,
  idleTimeoutMillis: 5_000, connectionTimeoutMillis: 10_000, keepAlive: true, keepAliveInitialDelayMillis: 10_000,
  onRetry: (e, a) => console.log(`    [ResilientPool retry ${a}] ${e.message}`),
});
pool.on("error", (e) => console.log("    [pool idle error]", e.message));
const prisma = new PrismaClient({ adapter: new PrismaPg(pool), transactionOptions: { timeout: 20_000, maxWait: 20_000 } });
const run = () => Promise.all([
  prisma.designDispatch.findMany({ skip: 0, take: 10, orderBy: { sentAt: "desc" } }).then((r) => r.length + " rows"),
  prisma.designDispatch.count(),
]);
const withTimeout = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error(`TIMEOUT ${ms}ms`)), ms))]);
(async () => {
  await prisma.$connect();
  for (const [label, n] of [["baseline", 0], ["1 drop", 1], ["2 drops", 2], ["3 drops (> maxRetries)", 3]] as [string, number][]) {
    armed = n; const t = Date.now();
    console.log(`\n${label}:`);
    try { console.log(`  => OK`, JSON.stringify(await withTimeout(run(), 20_000)), `${Date.now() - t}ms`); }
    catch (e: any) { console.log(`  => ERROR ${e.message} ${Date.now() - t}ms`); }
  }
  await prisma.$disconnect(); await pool.end(); process.exit(0);
})();
