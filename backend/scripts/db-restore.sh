#!/usr/bin/env bash
# Restores a backup made by scripts/db-backup.sh.
#
#   RESTORE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres \
#   BACKUP_PASSPHRASE=... \
#   scripts/db-restore.sh <file.dump.enc> [--into-supabase]
#
# Replaces every table in the target's "public" schema with the backup's.
# Restore into a scratch database first and check it there; see
# docs/DEPLOY_RUNBOOK.md for the full procedure. A Supabase target is refused
# unless --into-supabase is passed, so the live database is never overwritten
# by a mistyped variable.
set -euo pipefail

file="${1:?usage: db-restore.sh <file.dump.enc> [--into-supabase]}"
: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL must be set}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE must be set}"

if [[ "$RESTORE_DATABASE_URL" == *supabase* && "${2:-}" != "--into-supabase" ]]; then
  echo "RESTORE_DATABASE_URL points at Supabase. Pass --into-supabase if that is really intended." >&2
  exit 1
fi

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE -in "$file" -out "$tmp"

pg_restore --dbname="$RESTORE_DATABASE_URL" --clean --if-exists --no-owner --no-privileges \
  --single-transaction --exit-on-error "$tmp"

# Row counts of the tables that matter most, as a first sanity check.
psql "$RESTORE_DATABASE_URL" --no-psqlrc --quiet --tuples-only --command "
  select 'User', count(*) from \"User\"
  union all select 'Weaver', count(*) from \"Weaver\"
  union all select 'Saree', count(*) from \"Saree\"
  union all select 'Invoice', count(*) from \"Invoice\"
  union all select 'SaleRecord', count(*) from \"SaleRecord\"
  union all select '_prisma_migrations', count(*) from _prisma_migrations;"
