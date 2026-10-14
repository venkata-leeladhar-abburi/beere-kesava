#!/usr/bin/env bash
# Encrypted logical backup of the app's data (the "public" schema).
#
#   BACKUP_DATABASE_URL=postgresql://...:5432/postgres \
#   BACKUP_PASSPHRASE=... \
#   scripts/db-backup.sh <output-dir>
#
# Writes <output-dir>/bk-<UTC timestamp>.dump.enc and prints its path. The
# dump is pg_dump's custom format (compressed, restorable table by table),
# encrypted with AES-256 under BACKUP_PASSPHRASE. Encryption is not optional:
# the file holds every customer, phone number and invoice, and it is stored in
# an object bucket. Restore with scripts/db-restore.sh.
#
# Use the session-mode connection (port 5432, DIRECT_URL); the transaction
# pooler (6543) cannot run pg_dump. Needs pg_dump at least as new as the
# server, and openssl.
set -euo pipefail

out_dir="${1:?usage: db-backup.sh <output-dir>}"
: "${BACKUP_DATABASE_URL:?BACKUP_DATABASE_URL must be set}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE must be set}"

mkdir -p "$out_dir"
file="$out_dir/bk-$(date -u +%Y%m%dT%H%M%SZ).dump.enc"

# --no-owner/--no-privileges: Supabase's roles do not exist in a scratch
# restore target. pipefail makes a pg_dump failure fail the whole pipeline,
# so a truncated dump is never written out as if it were good.
pg_dump --dbname="$BACKUP_DATABASE_URL" --schema=public --format=custom \
  --no-owner --no-privileges --compress=9 \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE -out "$file"

# An encrypted empty stream is 32 bytes; a real dump is never that small.
size=$(wc -c < "$file" | tr -d ' ')
if [ "$size" -lt 1024 ]; then
  echo "Backup is only $size bytes; refusing to treat it as good." >&2
  exit 1
fi
echo "$file"
