import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
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
    const pool = new Pool({
      connectionString,
      ssl: sslDisabled ? false : { rejectUnauthorized: false },
      max: 15,
      // Supabase's pooler (pgbouncer) can silently drop idle connections on
      // its own schedule (~10-15s). Proactively recycling them after 5s ensures
      // pg.Pool discards idle clients before Supabase drops the remote socket.
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
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
