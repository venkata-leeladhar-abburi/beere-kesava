#!/usr/bin/env bash
# Apply committed migrations (never generates or resets anything). Safe to
# re-run: already-applied migrations are skipped. Uses the session-mode
# connection because the pooled one (pgbouncer) can't run DDL.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .env ]; then set -a; source .env; set +a; fi
DATABASE_URL="${DIRECT_URL:?DIRECT_URL must be set}" CHECKPOINT_DISABLE=1 npx prisma migrate deploy
