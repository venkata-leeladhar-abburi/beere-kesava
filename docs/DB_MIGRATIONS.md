# Database migrations

Schema changes ship as committed Prisma migrations (`backend/prisma/migrations`).
`prisma db push` is retired — it can drop data with no history or rollback.

## One-time baseline (per existing database: staging first, then production)
1. Back up the database (Supabase dashboard or `pg_dump`) and test-restore it.
2. `cd backend && npm run db:baseline`
   Records `0_init` as applied in `_prisma_migrations`. Runs no schema SQL and
   changes no data.
3. Verify: `DATABASE_URL=$DIRECT_URL npx prisma migrate status` → "Database schema is up to date".
   Then check drift is empty:
   `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`

## Making a change
1. Edit `schema.prisma`.
2. On a dev/staging DB: `npm run db:migrate:dev -- --name <what_changed>`.
3. Read the generated SQL. Any `DROP`/`ALTER ... TYPE` needs expand/contract:
   add new → backfill → switch code → drop in a later release.
4. Commit the migration folder with the code change.
5. Deploy runs `npm run db:migrate:deploy` (applies only pending migrations).

## Rules
- Never edit or delete an applied migration; add a new one.
- Never run `migrate dev` or `migrate reset` against production.
