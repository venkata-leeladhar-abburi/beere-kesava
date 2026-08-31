import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";
import { ResilientPool } from "./resilient-pool";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger;
  private pool: Pool;

  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>("DATABASE_URL");
    // Supabase requires TLS; a local Postgres (used by the integration suite,
    // see test/utils/test-app.ts) generally isn't built with SSL support at
    // all and rejects the handshake outright. Honour the standard
    // `sslmode=disable` in the URL rather than forcing TLS unconditionally,
    // which previously made it impossible to point this app at any local
    // database.
    const sslDisabled = /[?&]sslmode=disable/.test(connectionString);
    // Declared before super() so the pool can log through it; assigned to the
    // field below, since `this` is unavailable until super() returns.
    const logger = new Logger(PrismaService.name);
    const pool = new ResilientPool({
      connectionString,
      ssl: sslDisabled ? false : { rejectUnauthorized: false },
      max: 15,
      // The database is a remote Supabase pooler (ap-south-1): opening a
      // connection costs a TCP + TLS + auth handshake, measured at 350-450ms
      // from a dev machine. Recycling idle clients after 5s meant that in
      // normal interactive use — where a user acts every 10-30s — *every*
      // request paid that handshake again, so each screen took ~400ms longer
      // than it had to before showing data.
      //
      // Holding connections for a minute instead removes that tax (measured:
      // 451ms -> 85ms for a query after a 6s idle gap). The reason 5s was
      // chosen originally — pgbouncer dropping idle sockets out from under
      // pg.Pool — is handled properly by TCP keepalives below (a connection
      // idle for 55s still answers in ~40ms) with ResilientPool's read replay
      // as the backstop for the rare drop that slips through.
      idleTimeoutMillis: 60_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
      // Probes start after 5s of silence, well inside the window in which the
      // pooler would otherwise consider the socket idle and close it.
      keepAliveInitialDelayMillis: 5_000,
      // Recycling idle clients still leaves a race: a connection can be checked
      // out in the instant between pgbouncer sending FIN and Node handling it,
      // and the in-flight query dies with "Connection terminated unexpectedly".
      // Reads are replayed on a fresh connection rather than 500ing the request.
      onRetry: (err, attempt) =>
        logger.warn(`Retrying read after dropped connection (attempt ${attempt}): ${err.message}`),
    });
    super({
      adapter: new PrismaPg(pool),
      // The remote Supabase pooler can be slow to respond after being idle
      // (free-tier projects cold-start), so the 5s Prisma default is too
      // tight for the $transaction([...]) batches used across services
      // (e.g. findMany + count) — bump both so a slow-but-live connection
      // doesn't 500 the request. maxWait in particular governs how long the
      // client waits to acquire a pooled connection just to *begin* the
      // transaction — 10s wasn't enough under pooler contention ("Unable to
      // start a transaction in the given time"), so it's bumped further.
      transactionOptions: { timeout: 20_000, maxWait: 20_000 },
    });
    this.logger = logger;
    this.pool = pool;
    // node-postgres emits 'error' on the Pool when an *idle* client is
    // dropped by the server (exactly the pgbouncer-closed-connection case
    // above). Without a listener here, that's an unhandled EventEmitter
    // error and can crash the process instead of just failing the next
    // query, which gets a fresh connection from the pool.
    this.pool.on("error", (err) => {
      this.logger.warn(`Idle Postgres client error (pool will recover): ${err.message}`);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
