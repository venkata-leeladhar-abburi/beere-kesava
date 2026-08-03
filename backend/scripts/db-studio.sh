#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source .env
set +a
DATABASE_URL="$DIRECT_URL" CHECKPOINT_DISABLE=1 npx prisma studio
