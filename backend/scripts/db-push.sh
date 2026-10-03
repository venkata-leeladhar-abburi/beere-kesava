#!/usr/bin/env bash
# Retired: `prisma db push` can drop columns/data with no history or rollback.
# Schema changes now go through migrations — see backend/prisma/migrations and
# docs/DB_MIGRATIONS.md. Set ALLOW_DB_PUSH=1 to use it on a throwaway local DB.
set -euo pipefail
if [ "${ALLOW_DB_PUSH:-}" != "1" ]; then
  echo "db push is disabled. Use: npm run db:migrate:dev -- --name <change>" >&2
  exit 1
fi
cd "$(dirname "$0")/.."
set -a
source <(tr -d '\015' < .env)
set +a
DATABASE_URL="$DIRECT_URL" CHECKPOINT_DISABLE=1 npx prisma db push
