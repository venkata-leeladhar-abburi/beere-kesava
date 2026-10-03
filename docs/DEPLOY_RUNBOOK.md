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

## Restore drill (quarterly)
Restore the latest backup into a scratch database, run `npx prisma migrate status` and spot-check row counts of users, sarees, invoices.

## Monitoring
Set `SENTRY_DSN` (backend) and `VITE_SENTRY_DSN` (frontend build) to enable error tracking. Point an uptime monitor (UptimeRobot/BetterStack) at `GET /health`. Every response carries `X-Request-Id`; quote it when searching logs.

## Load test
`k6 run backend/loadtest/health.js` against staging, never production.
