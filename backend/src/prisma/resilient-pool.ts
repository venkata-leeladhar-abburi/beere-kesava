import { Pool, PoolConfig } from "pg";

/**
 * Errors that mean "the socket died", not "the query was rejected". Supabase's
 * pgbouncer closes pooled connections on its own schedule; pg.Pool hands out
 * idle clients without health-checking them, so a client can be checked out in
 * the window between the remote FIN arriving and Node processing the 'end'
 * event. The query then fails with "Connection terminated unexpectedly" even
 * though the database is perfectly healthy.
 */
const TRANSIENT_CODES = new Set(["ECONNRESET", "EPIPE", "ETIMEDOUT", "ENOTFOUND", "57P01"]);
const TRANSIENT_MESSAGES = [
  "connection terminated",
  "connection ended unexpectedly",
  "server has closed the connection",
  "socket hang up",
  "client has encountered a connection error",
];

function isTransientConnectionError(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  if (e.code && TRANSIENT_CODES.has(e.code)) return true;
  const message = (e.message ?? "").toLowerCase();
  return TRANSIENT_MESSAGES.some((fragment) => message.includes(fragment));
}

function sqlTextOf(query: unknown): string {
  if (typeof query === "string") return query;
  if (query && typeof query === "object" && typeof (query as { text?: unknown }).text === "string") {
    return (query as { text: string }).text;
  }
  return "";
}

/**
 * A dead socket gives no way to know whether the statement reached the server
 * before the connection dropped, so only replay statements that are safe to run
 * twice. Reads are; INSERT/UPDATE/DELETE are not, and are surfaced as errors.
 */
function isReplayable(sql: string): boolean {
  return /^\s*(?:--[^\n]*\n|\/\*[\s\S]*?\*\/|\s)*(?:select|with)\b/i.test(sql);
}

export interface ResilientPoolConfig extends PoolConfig {
  /** Extra attempts after the first failure. Defaults to 2. */
  maxRetries?: number;
  onRetry?: (err: Error, attempt: number) => void;
}

/**
 * pg.Pool that transparently replays read queries dropped by a dead pooled
 * connection. The retry happens below @prisma/adapter-pg, which calls
 * `pool.query()` for every non-transactional statement, so every Prisma read
 * gets it without any change at the call sites.
 */
export class ResilientPool extends Pool {
  private readonly maxRetries: number;
  private readonly onRetry?: (err: Error, attempt: number) => void;

  constructor(config: ResilientPoolConfig) {
    const { maxRetries = 2, onRetry, ...poolConfig } = config;
    super(poolConfig);
    this.maxRetries = maxRetries;
    this.onRetry = onRetry;
  }

  // `any` here mirrors pg's own eight-overload `query` signature; the arguments
  // are forwarded untouched, so nothing is lost by not restating them.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  query(...args: any[]): any {
    const usesCallback = typeof args[args.length - 1] === "function";
    if (usesCallback || !isReplayable(sqlTextOf(args[0]))) {
      return super.query(...(args as [any]));
    }
    return this.queryWithRetry(args);
  }

  private async queryWithRetry(args: any[]): Promise<any> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await super.query(...(args as [any]));
      } catch (err) {
        if (attempt >= this.maxRetries || !isTransientConnectionError(err)) throw err;
        this.onRetry?.(err as Error, attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** attempt));
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
