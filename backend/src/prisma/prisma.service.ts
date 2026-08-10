import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>("DATABASE_URL");
    const pool = new Pool({ 
      connectionString,
      max: 50, // Increased to handle high concurrent requests from frontend
    });
    super({
      adapter: new PrismaPg(pool),
      // The remote Supabase pooler can be slow to respond after being idle
      // (free-tier projects cold-start), so the 5s Prisma default is too
      // tight for the $transaction([...]) batches used across services
      // (e.g. findMany + count) — bump both so a slow-but-live connection
      // doesn't 500 the request.
      transactionOptions: { timeout: 20_000, maxWait: 10_000 },
    });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
