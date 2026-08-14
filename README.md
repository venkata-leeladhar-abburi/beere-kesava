# Beere Kesava & Brothers Silks

Enterprise web application for managing silk saree manufacturing operations: artisan/weaver management, inventory, production batches, B2B/B2C sales, payments, and multi-portal staff workflows.

## Structure

- `backend/` — NestJS + Prisma + PostgreSQL API (deployed via `render.yaml`)
- `frontend/` — React 18 + TypeScript + Vite (deployed via `frontend/vercel.json`)
- `design-system/` — design tokens and UI guidelines
- `CODEBASE_DOCUMENTATION.md` — architecture and module reference

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DB connection and secrets
npm run db:push
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Docs

See [`CODEBASE_DOCUMENTATION.md`](./CODEBASE_DOCUMENTATION.md) for architecture details and [`guidelines/Guidelines.md`](./guidelines/Guidelines.md) for contribution conventions.
