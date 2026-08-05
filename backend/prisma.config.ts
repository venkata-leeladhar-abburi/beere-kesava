/// <reference types="node" />
// Prisma 7 no longer allows `url`/`directUrl` in schema.prisma's datasource
// block (CLI-time connection info lives here instead); at runtime PrismaClient
// connects via the pg driver adapter in src/prisma/prisma.service.ts, not this
// file. @prisma/config's Datasource type only supports { url, shadowDatabaseUrl }
// — there is no directUrl here. The db:push/db:seed scripts substitute
// DATABASE_URL=$DIRECT_URL at the shell level for schema-changing commands,
// since the pooled connection (pgbouncer, port 6543) doesn't support them.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
