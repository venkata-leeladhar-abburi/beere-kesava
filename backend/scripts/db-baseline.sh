#!/usr/bin/env bash
# ONE-TIME: tell an existing database that 0_init is already applied.
# Writes a row to _prisma_migrations only — runs NO schema SQL, touches no data.
# Run once per database (staging first, then production).
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source .env
set +a
DATABASE_URL="$DIRECT_URL" CHECKPOINT_DISABLE=1 npx prisma migrate resolve --applied 0_init
