# Deploy, rollback and restore runbook

## Before every deploy
1. CI green on `main`.
2. If the schema changed: a migration folder is committed (CI checks this) and was rehearsed on staging — see DB_MIGRATIONS.md.
3. Take a manual DB backup if the migration drops/alters anything.

## Deploy
Render builds, runs `npm run db:migrate:deploy` (paid plans: `preDeployCommand`; free plan: run it by hand first), then starts the app. `/health` gates the switch-over.

## Rollback
- **Code only:** Render → Deploys → redeploy the previous successful deploy.
- **With a migration:** migrations are additive (expand/contract), so the previous code keeps working against the new schema. Never roll the schema back by hand; ship a corrective migration.
- **Data damage:** restore from Supabase point-in-time recovery into a *new* project, verify, then copy back the affected rows.

## Backups
`.github/workflows/backup.yml` runs nightly at 03:00 IST: an encrypted dump of
the `public` schema goes to R2 under `backups/db/` (30 days kept), and that
same file is restored into a throwaway Postgres in the same run. A green run
means last night's backup restores. Its secrets are listed at the top of the
workflow. Keep a copy of `BACKUP_PASSPHRASE` outside GitHub: without it no
backup can be decrypted.

## Restoring a backup
1. Download the file you want from R2 (`backups/db/bk-<timestamp>.dump.enc`).
2. Restore into a scratch database first, never straight into production:
   ```
   docker run -d --name scratch -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:17
   RESTORE_DATABASE_URL=postgresql://postgres:postgres@localhost:55432/postgres \
   BACKUP_PASSPHRASE=... backend/scripts/db-restore.sh bk-<timestamp>.dump.enc
   ```
   It prints row counts for the main tables. Look at the data you care about.
3. Data damage: copy the affected rows from the scratch database back. Total
   loss: restore into the production database itself (the script refuses a
   Supabase URL unless you add `--into-supabase`), then `npm run db:status`.

## Scheduled jobs
`.github/workflows/scheduler.yml` calls `POST /jobs/tick` every 10 minutes,
and the server also ticks itself every 15. Each job runs once per slot
(`JobRun` table): overdue-payment scan from 06:30 IST, ops alerts from 07:30,
scheduled reports every 15 minutes, health check from 09:00. A job missed while
the server slept runs on the next tick; a failed one is retried up to 3 times
and raised under Notifications > System Alerts. Setup: set the same
`JOBS_TRIGGER_SECRET` on Render and as a GitHub secret.

## Monitoring
Set `SENTRY_DSN` (backend) and `VITE_SENTRY_DSN` (frontend build) to enable error tracking. Point an uptime monitor (UptimeRobot/BetterStack) at `GET /health`. Every response carries `X-Request-Id`; quote it when searching logs.

## Load test
`k6 run backend/loadtest/health.js` against staging, never production.

## Sessions and cookie mode

Every token names an `AuthSession` row, and the backend re-reads that row and
the account behind it on every request (`backend/src/auth/session.ts`). An
admin can sign a device out from **Users → Manage Access → Signed-in
Devices**, and deactivating an account ends all of its sessions.

**First deploy of this change:** run `npm run db:migrate:deploy` (it adds the
`AuthSession` table) *before* the backend deploy. Tokens issued before it carry
no session, so every user signs in once more; they land on the "signed out"
screen, not an error.

**Moving the token into an httpOnly cookie** (`VITE_AUTH_MODE=cookie`) needs the
app and the API on the same site, because browsers (Safari always) withhold the
cookie between unrelated domains such as `*.vercel.app` and `*.onrender.com`:

1. Add custom domains, e.g. `app.example.com` on Vercel and `api.example.com` on Render.
2. Render: set `CORS_ORIGIN=https://app.example.com` (exact, no trailing slash).
3. Vercel: set `VITE_API_URL=https://api.example.com` and `VITE_AUTH_MODE=cookie`,
   then trigger a fresh build (both are build-time).
4. Sign in on an iPhone and an Android phone and check the Network tab: no
   `token` in the verify-otp response, and a `bk_session` cookie on the API host.

Rolling back is unsetting `VITE_AUTH_MODE` and rebuilding; the backend serves
both modes.
