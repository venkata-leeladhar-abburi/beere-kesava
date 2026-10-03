#!/usr/bin/env bash
# Create + apply a new migration against a DEV/STAGING database. Never point
# this at production — production only ever runs `migrate deploy`.
# Usage: npm run db:migrate:dev -- --name add_something
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source <(tr -d '\015' < .env)
set +a
DATABASE_URL="$DIRECT_URL" CHECKPOINT_DISABLE=1 npx prisma migrate dev "$@"
