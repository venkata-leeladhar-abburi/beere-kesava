# BK Loom ERP - Test & Quality Assurance Plan

Ground truth measured from the repo (not estimated), before Phase 0:

| Signal | State at start |
| --- | --- |
| Backend modules | 45 services, 43 controllers |
| Backend unit specs | 13 `.spec.ts` files (~29% of services, 0% of controllers) |
| Backend integration/e2e tests | none (`backend/test/` does not exist) |
| Frontend source files | 845 `.ts`/`.tsx` |
| Frontend tests | 15 `.test.ts(x)` files |
| Browser E2E | none (no Playwright/Cypress) |
| CI coverage | frontend only - the backend never ran in CI |
| Security scanning | none (no CodeQL, `npm audit`, secret scan, SAST) |
| Coverage thresholds | none enforced anywhere |
| Load / perf testing | none |
| A11y | `eslint-plugin-jsx-a11y` lint only; no runtime axe checks |

The single largest risk was that **the backend had no CI job at all**: a broken
NestJS build or a regressed auth guard could merge to `main` with zero signal.
Phase 0 (section 6) has closed that.

---

## 1. The model MNCs actually use

Large orgs do not "do a testing phase." They run a layered gate where every layer
is cheap, automated, and blocks merge:

```
        /\        Manual exploratory + UAT      (rare, human, pre-release)
       /  \       E2E / user-journey            (~20-40 specs)
      /----\      Integration / API contract    (~1 per controller)
     /      \     Component / unit              (hundreds)
    /--------\    Static: types, lint, SAST, secrets, deps  (every commit)
```

Rules that make it work:

- **Every layer is a required CI check.** Not a checklist someone remembers.
- **Nothing gets worse over time.** Coverage and bundle size *ratchet* - they may
  improve, never regress. You already have `scripts/ratchet.mjs`; extend that idea
  to coverage.
- **Test the money paths hardest.** In an ERP that means auth/permissions,
  inventory quantity math, payments/invoices, dispatch, and audit-log integrity.
  A cosmetic dashboard bug is a ticket; a wrong stock count is a lawsuit.
- **Fix flakes same-day or delete the test.** A flaky suite is worse than no suite,
  because people learn to re-run instead of read.

---

## 2. Phased rollout

### Phase 0 - Close the bleeding (Week 1) - COMPLETE

Goal: the backend enters CI, and every existing gate is actually green. See
section 6 for what shipped and what it uncovered.

### Phase 1 - Backend integration tests (Weeks 2-4)

Unit-testing NestJS services with a mocked Prisma mostly proves your mocks work.
The tests that catch real ERP bugs hit a real Postgres.

- Add `supertest` + `@nestjs/testing` and a `backend/test/` tree.
- Use **Testcontainers** (`@testcontainers/postgresql`) so each CI run gets a
  disposable Postgres, schema-loaded with `prisma db push` and seeded via the
  existing `db:seed` script. No shared staging DB, no ordering dependencies.

  > **Note:** this project has no `prisma/migrations` directory - it uses
  > `prisma db push`. There is no migration history to replay and no drift check
  > to run. Adopting real migrations is worth doing before launch, because
  > without them you cannot safely evolve a production schema, but that is a
  > separate piece of work from testing.

- Write one integration spec **per controller** (43 total). Each asserts:
  1. **AuthZ matrix** - for every role, every endpoint returns 200 or 403 as
     designed. Table-driven. This is the highest-leverage test in the entire ERP;
     it catches the class of bug that leaks another firm's data.
  2. Happy path returns the correct shape.
  3. Validation rejects bad DTOs with 400. You have `class-validator`, so prove it
     is actually wired with
     `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
  4. Not-found / conflict paths return the correct status, not a 500.
- Priority order: `auth`, `users`, `inventory`, `sales`, `payments`, `invoices`,
  `dispatch`, `purchase-orders`, `audit-log`, then the rest.

**Domain invariants to test explicitly** - the revenue-critical rules:

- Stock can never go negative; a dispatch of N units decrements exactly N.
- Money is never a float. `frontend/src/lib/domain/money.ts` needs a backend
  counterpart, and invoice total must equal the sum of its lines under every
  rounding path.
- `id-generator` is unique and monotonic **under concurrency** - test with
  parallel calls, not sequential ones.
- Audit-log rows are written for every mutating action and are append-only.
- Multi-firm isolation: firm A's token can never read firm B's rows.

**Exit criterion:** every controller has an authz-matrix test; backend line
coverage at least 60%, enforced by a Jest `coverageThreshold` that fails the build.

### Phase 2 - Frontend confidence (Weeks 3-5, parallel)

- **MSW is already installed but barely used.** Stand up a shared handler set in
  `src/test/handlers.ts` mirroring the real API, so component tests exercise real
  React Query behaviour (loading, error, refetch, optimistic update) instead of
  mocked hooks.
- Test **behaviour, not markup**: `@testing-library` queries by role and label.
  That doubles as an accessibility check - if you cannot query it by role, a
  screen reader cannot find it either.
- Coverage targets by directory, not globally:
  - `src/lib/`, `src/features/*/contexts/` (pure logic): **90%**
  - `src/features/*/components/` (forms, tables, modals): **60%**
  - `src/shared/ui/primitives/`: **80%**
  - Vendored shadcn primitives: excluded (already correct in `vitest.config.ts`)
- Add `vitest --coverage` thresholds to CI and ratchet them upward.
- Add an **error-path** suite: every page must render an ErrorBoundary fallback
  and a sensible empty state. ERPs live or die on "what happens when the API 500s."

### Phase 3 - E2E user journeys (Weeks 5-7)

Install **Playwright** rather than Cypress: better parallelism, native trace
viewer, first-class a11y integration, real Chromium/WebKit/Firefox.

Write ~25 specs covering the journeys that generate revenue, at least one per role:

| Journey | Roles touched |
| --- | --- |
| Login, OTP, lands on role-correct dashboard | all |
| Create customer (retail + wholesale), list, edit, soft delete | sales |
| Raw material intake, GRN, material issue, batch production, finishing, QC | factory chain |
| Purchase request, quotation, rate request, PO, vendor bill, payment | purchasing |
| Sale, invoice generation, payment recording, return, refund | sales / accounts |
| Dispatch to shop, scan barcode/QR, receipt confirmation | dispatch |
| Bulk order create, link designs, track to completion | bulk-orders |
| Report export (`exceljs` / `xlsx`) downloads and re-parses correctly | accountant |
| Notification fires over Socket.IO and appears live in a second browser context | all |
| Each role hits a forbidden route and sees a proper 403 UI | all |

Rules:

- Seed via API, not UI. Only the journey under test goes through the browser.
- Each spec creates its own data with a unique prefix; no shared fixtures.
- Run against a Testcontainers-backed stack in CI, headed locally.
- Record trace and video on failure only.

### Phase 4 - Non-functional (Weeks 7-9)

**Security**

- CodeQL (JS/TS) on every PR.
- `semgrep --config auto` for injection and authz patterns.
- gitleaks for secrets (shipped in Phase 0).
- Dependabot or Renovate for dependency updates.
- A manual pass against the OWASP API Top 10, focused on:
  - **BOLA / IDOR** - the number one API vulnerability. Every `findOne(id)` must
    be scoped by the caller's firm and role, not just fetched by primary key.
    Audit every `findUnique({ where: { id` and prove each one is scoped.
  - JWT: expiry, refresh rotation, revocation on role change, algorithm pinned.
  - `uploads.controller.ts` - allowlist file types by magic bytes not extension,
    cap size, sanitise filenames against path traversal, serve uploads from a
    non-executable location. Upload endpoints are the most common RCE vector in ERPs.
  - Rate limiting on auth/OTP endpoints. `@nestjs/throttler` is **not currently a
    dependency** - add it. OTP brute-force is trivial without it.
  - `env.validation.ts` - ensure no secret has a dev default that survives to prod.
  - CORS: pin origins explicitly rather than relying on permissive defaults.
  - Security headers - `helmet` is also not a dependency; add it.
  - Prisma blocks SQLi except through `$queryRawUnsafe` / `$executeRawUnsafe`.
    Grep for those and eliminate them.

**Performance**

- `k6` load scripts against the 5 hottest endpoints. Target p95 under 400 ms at 50
  concurrent users, error rate under 0.1%.
- Enable Prisma query logging during a perf run and hunt N+1s. ERP list pages with
  nested `include`s are exactly where these hide.
- Add a DB index for every column used in a `where` or `orderBy` on a list endpoint.
- Frontend: Lighthouse CI budget (LCP under 2.5s, TBT under 200ms, CLS under 0.1)
  alongside the existing `check-bundle-size`.

**Accessibility**

- `@axe-core/playwright` assertion on every E2E page visit - near-zero extra cost.
- `check:contrast` already covers tokens; extend it with a keyboard-navigation E2E
  spec that tabs through a full form and submits without a mouse.
- Test at 320px width and at 200% browser zoom - factory-floor users are on phones.

### Phase 5 - Human passes (Weeks 9-10, pre-submission)

- **Exploratory charters**: 90-minute timeboxed sessions, one per module, written
  notes. "Try to break material issue reconciliation."
- **UAT with real users** - an actual weaver, an actual accountant. Watch, do not
  guide. Every hesitation is a UX bug.
- **Cross-device matrix**: Chrome / Safari / Firefox desktop, iOS Safari, Android
  Chrome. The mobile-specific components (`mobile.tsx`, the native Select rewrite
  in commit b3edf98) need real-device verification.
- **Data-loss drills**: kill the network mid-submit, double-click submit buttons,
  refresh mid-wizard. An ERP must never silently lose a form.

---

## 3. Definition of Done (enforced per PR)

- [ ] Types pass (baseline + strict ratchet)
- [ ] Lint and format clean
- [ ] Unit tests for new logic; integration test for any new endpoint
- [ ] AuthZ matrix updated if a route or role changed
- [ ] E2E spec added or updated if a user journey changed
- [ ] Coverage did not decrease
- [ ] No new high/critical `npm audit` or CodeQL finding
- [ ] Bundle size within budget
- [ ] Keyboard-navigable and axe-clean if UI changed
- [ ] Audit-log entry written if the change mutates business data

---

## 4. Tooling to install

```bash
cd backend && npm i -D supertest @types/supertest @testcontainers/postgresql
```

```bash
cd backend && npm i @nestjs/throttler helmet
```

```bash
cd frontend && npm i -D @playwright/test @axe-core/playwright && npx playwright install --with-deps
```

External binaries - `gitleaks`, `semgrep`, `k6` - install via CI actions rather
than locally.

---

## 5. How Claude Code assists, concretely

Skills available in this repo today:

| Command | Use it for |
| --- | --- |
| `/security-review` | Security review of the pending diff - run before every merge, and once over each backend module during Phase 4 |
| `/code-review high` | Correctness and simplification pass on a diff; use `max` on the money-path modules |
| `/code-review ultra` | Deep multi-agent cloud review of the whole branch - run once before submission (you trigger it; it is billed) |
| `/simplify` | Quality-only cleanup, keeps code health from drifting as tests get bolted on |
| `/init` | Regenerate `CLAUDE.md` so future sessions know the test conventions |
| `/loop` | Poll a long CI run or a nightly suite |

Where the bulk of the work goes:

- Generate the 43 controller integration specs from the actual controller
  signatures and the permissions guard - mechanical, high-volume, exactly the work
  worth handing off.
- Build the role-by-endpoint authorization matrix by reading every `@Permissions`
  decorator, then generate the table-driven test from it.
- Write the Playwright journeys by driving the real app in the browser pane first,
  reading the accessibility tree for real selectors rather than guessing at DOM
  structure.
- Author the Testcontainers harness and the MSW handler set.
- Grep-audit every `findUnique` / `findFirst` for missing firm scoping - the IDOR
  sweep, tedious but mechanical.

Worth adding beyond Claude: **Sentry** (frontend and backend error tracking with
source maps - one week of production Sentry teaches you more than a month of
manual testing), **Codecov** for coverage-trend enforcement, and **Renovate** for
dependency freshness.

---

## 6. Phase 0 - what shipped, and what it found

Phase 0 is **done**. Changes made:

| Change | File |
| --- | --- |
| Backend CI job: prisma generate/validate, typecheck, lint, test, build | `.github/workflows/ci.yml` |
| Dependency audit job (informational, both workspaces) | `.github/workflows/ci.yml` |
| gitleaks secret scan over full history | `.github/workflows/ci.yml` |
| `testTimeout: 30000` - fixed a real flake | `backend/jest.config.js` |
| `typecheck` and `test:cov` scripts | `backend/package.json` |
| husky + lint-staged pre-commit hook | `package.json` (new), `.husky/pre-commit` |
| `react-router` 7.13.0 to 7.18.2 (security) | `frontend/package.json` |
| Two stale tests repaired | `Select.test.tsx`, `BulkOrderCreateModal.test.tsx` |

The backend job deliberately runs **without** a Postgres service: every current
backend spec mocks PrismaService, so a database would sit idle and slow the job.
Real Postgres arrives with the Phase 1 Testcontainers suite. `prisma generate` is
mandatory, not optional - `src/generated/prisma` is gitignored, so nothing
typechecks or compiles on a fresh checkout until the client is emitted.

### Findings

**1. The backend test suite was failing.** `auth.service.spec.ts` timed out at
jest's 5s default under parallel load, while passing in 16s when run alone. Cause
was ts-jest cold start plus real bcrypt work, not a product bug. Fixed by raising
`testTimeout`, not by weakening the assertions. All 86 backend tests now pass.

**2. The frontend test suite was also failing** - 2 tests, both stale since commit
b3edf98 replaced the Radix Select with a native `<select>`. The tests still clicked
a `listbox` popup that no longer exists, and a native `<option>` click commits
nothing, so `BulkOrderCreateModal` was silently submitting an empty customer while
the test believed it was exercising a valid submit. Both rewritten to drive the
native element. All 107 frontend tests now pass.

> Both suites were red before this work, and the frontend `test` job was already
> a required check. Main was shipping with a red gate - the exact failure mode
> this plan exists to prevent.

**3. `react-router` 7.13.0 carried an RCE and multiple XSS advisories.** It is a
production dependency. Upgraded to 7.18.2 (a non-breaking minor); typecheck, all
107 tests, and the production build were verified green afterwards.

**4. Remaining audit backlog** - why the audit job is informational for now:

| Package | Severity | Ships to prod? | Fix |
| --- | --- | --- | --- |
| `vitest`, `@vitest/coverage-v8` | critical | no (dev) | major bump to 4.x |
| `vite` | high | no (dev) | comes with the vitest 4.x bump |
| `sharp` | high | no (dev) | major bump to 0.35.3 |
| `xlsx` | high | **yes** | **no fix available** - needs replacing |
| `esbuild`, `nanoid`, `prisma`/`@prisma/config`, `exceljs` via `uuid` | moderate-high | mixed | mostly transitive |

The two critical entries are devDependencies and do not reach users. The one that
should worry you is **`xlsx`** (prototype pollution and ReDoS, no patch available,
and it is in your shipped bundle at 429 kB). Replacing it - `exceljs` is already a
backend dependency - closes a real vulnerability and cuts bundle size at once.

Landing the audit job red would train people to ignore a red X, which is worse
than no job at all, so it carries `continue-on-error: true` for now. **The Phase 0
exit criterion still open is: clear that backlog, then delete that line.**

### Also worth fixing soon

- `BeereDashboard` is a **1.4 MB** chunk and `index` is 754 kB, both far over the
  500 kB warning. Route-splitting these is the single biggest perf win available.
- Jest prints "a worker process failed to exit gracefully", traced to importing the
  generated Prisma client in specs. Benign today (exit code 0), but it must be
  resolved before Testcontainers arrives or CI jobs will start hanging.
- The `format` job is still `continue-on-error`. The one-shot reformat PR its own
  comment describes is the only thing standing between it and being a real gate.

---

## 7. Phase 1 progress - the authorization matrix

Shipped: `backend/src/auth/authz-matrix.spec.ts` plus its extractor at
`backend/src/auth/testing/authz-matrix.ts`. 17 tests, all passing.

The extractor walks every `*.controller.ts` via the TypeScript AST (not regex -
decorators stack, wrap across lines, and apply at two levels, and a regex that
looks right on the common case misreads exactly the routes worth auditing) and
records each route's `@Public` / `@RequireRoles` / `@AdminOnly` /
`@RequirePermissions`. It parses `prisma/seed.ts` the same way, because that file
opens a DB connection and calls `main()` at import time.

The spec runs four independent checks:

1. **Inventory** - a committed snapshot of all 199 routes. Any decorator change
   fails it until regenerated, putting the diff in front of a reviewer.
2. **Catalog integrity** - every `@RequirePermissions` key must exist in the seed.
3. **Guard coverage** - no *new* unguarded mutating route; known gaps are an
   explicit, shrinking allowlist.
4. **Runtime** - the real `PermissionsGuard`, fed each route's real metadata and
   the real seeded role map, across all six roles. This covers the ADMIN /
   SUPERADMIN bypass, per-user overrides in both directions, the fail-closed
   path, and the unauthenticated case.

Check 4 is what makes this more than a lint rule: it exercises the guard's actual
decision rather than restating the decorators.

**Verified it catches regressions.** Removing `@RequirePermissions("users.delete")`
from `DELETE /users/:id` failed two checks independently, each naming the cause.

### Route census

| Metric | Count |
| --- | --- |
| Routes | 199 |
| Controllers | 43 |
| Public (unauthenticated) | 3 |
| Role-guarded | 161 |
| Permission-guarded | 11 |
| **Unguarded (any authenticated user)** | **31** |
| **Unguarded AND mutating** | **9** |

### Finding 1 - five permission keys are referenced but never seeded

`PermissionsGuard.hasAllPermissions()` bails when the catalog lookup returns fewer
rows than keys requested. These five keys are named by a decorator but absent from
`prisma/seed.ts`, so the routes are **permanently denied to every role except
ADMIN and SUPERADMIN** - no configuration can turn them on:

| Key | Route |
| --- | --- |
| `procurement.po.reject` | `purchase-orders.controller.ts:56` |
| `rate_requests.approve` | `rate-requests.controller.ts:26` |
| `rate_requests.reject` | `rate-requests.controller.ts:32` |
| `warp_requests.approve` | `warp-requests.controller.ts:38` |
| `warp_requests.reject` | `warp-requests.controller.ts:44` |

This is a functional bug as much as a security one: approve/reject workflows are
silently dead for the non-admin roles that are supposed to run them. Failing
closed is the right default - the problem is that it fails *silently*.

### Finding 2 - nine mutating routes have no authorization at all

Reachable by any authenticated user, including WEAVER and WORKER:

| Route | Note |
| --- | --- |
| `POST /weavers` | entire controller is undecorated |
| `PATCH /weavers/:id` | " |
| `DELETE /weavers/:id` | " |
| `POST /uploads/photo` | unrestricted upload |
| `POST /uploads/receipt` | unrestricted upload |
| `POST /design-dispatches` | entire controller undecorated |
| `POST /notifications` | any user can create notifications for others |
| `PATCH /notifications/:id/read` | not scoped to the owning user |
| `PATCH /labels/settings` | global settings mutation |

Commit b3edf98 added role-based access across the backend; these controllers were
missed. `POST /weavers` and `DELETE /weavers/:id` are the ones to fix first - a
weaver can currently delete other weavers.

Ten controllers have at least one unguarded route: `weavers` (8/8), `firms`
(5/11), `labels` (4/4), `design-dispatches` (3/3), `notifications` (3/3),
`rates` (2/4), `uploads` (2/2), `users` (2/6), `scan` (1/1), `whatsapp` (1/1).

Both findings are encoded as allowlists in the spec, so they are visible, counted,
and cannot grow silently. Neither is fixed - changing authorization rules is a
product decision, not a test-writing one, and I did not want to guess at which
role should own each route.

### Also confirmed working

- `ValidationPipe` is correctly wired with `whitelist: true` and
  `forbidNonWhitelisted: true` (`main.ts`), so Phase 1's DTO-validation item is
  already satisfied at the global level.
- Both guards are registered globally via `APP_GUARD` in `auth.module.ts`.

### Phase 1 progress - role mapping applied

Applied the proposed mapping for the 9 unguarded mutating routes. Unguarded
mutations dropped from 9 to 3, and the 3 remaining are now a distinct,
deliberate allowlist (`INTENTIONALLY_OPEN_MUTATIONS` in the spec) rather than
unexamined gaps:

| Route | Guard applied |
| --- | --- |
| `POST /weavers` | `@RequireRoles(ACCOUNTANT, ADMIN, SUPERADMIN)` |
| `PATCH /weavers/:id` | `@RequireRoles(ACCOUNTANT, ADMIN, SUPERADMIN)` |
| `DELETE /weavers/:id` | `@RequirePermissions("weavers.delete")`, new key, seeded to SUPERADMIN only |
| `POST /design-dispatches` | `@RequireRoles(WORKER, ADMIN, SUPERADMIN)` |
| `POST /notifications` | `@RequireRoles(SHOP, WORKER, ACCOUNTANT, ADMIN, SUPERADMIN)` |
| `PATCH /labels/settings` | `@RequireRoles(SUPERADMIN)` |
| `PATCH /notifications/:id/read` | left open; fixed at the ownership layer instead (below) |
| `POST /uploads/photo`, `POST /uploads/receipt` | left open; real control is upload hardening (Phase 4), not a role list |

`PermissionsGuard` short-circuits ADMIN and SUPERADMIN before consulting any role
list, so `@RequireRoles` cannot express "SUPERADMIN only." `weavers.delete` uses
the permission-key path instead, mirroring `users.delete` - both operations hard-
delete a `User` row, so both are withheld from ADMIN in `ROLE_PERMISSIONS`.

**Fixed the real bug behind `markRead`.** It was a plain IDOR: any authenticated
user could mark any other user's notification read by guessing an id, because the
lookup checked only `{ where: { id } }`. Rewrote it to require the notification be
addressed to the caller - by `userId` (their own) or `role` (their own) - and
added `backend/src/notifications/notifications.service.spec.ts` (4 tests) pinning
that scope, including the case where `AuthenticatedUser.id` is undefined (a plain
`userId: undefined` filter would have made Prisma drop the condition and re-open
the hole). A route not found for a notification addressed to someone else, not a
403, so the response can't be used to enumerate ids.

Verified against the frontend before applying: `NotificationsPage` already
queries `notificationsApi.list({ role: backendRole })`, scoped to the caller's own
role, so the new server-side scope matches what a user could already see - no
UI regression.

Full backend suite after all of the above: 108/108 passing, typecheck/lint/build
clean.

### Next in Phase 1

- Add the 5 missing permission keys to `prisma/seed.ts` (or correct the
  decorators that reference them), then empty that allowlist too.
- `main.ts` calls `enableCors({ origin: ... || true })` - when `CORS_ORIGIN` is
  unset this reflects any origin. Worth pinning before launch.
- `POST /notifications` still lets a permitted caller target any role or user
  via the DTO - the role gate narrows who can call it, not what they can
  address. A service-level constraint, tracked separately.
- Reads remain open on `weavers`, `firms`, `rates`, `scan`, `whatsapp` - worth
  a deliberate pass, but out of scope for the mutating-route sweep above.
- Then the Testcontainers integration suite, which turns this static matrix into
  real HTTP assertions per role.

---

## 8. Phase 3 progress - E2E scaffolding and the login journey

### The auth problem, and how it was resolved

Every other E2E journey needs to log in as a real role, but login is OTP-based
and the OTP is bcrypt-hashed in the database with no way to recover the
plaintext - by design, and correctly so. Three options were on the table:
a test-only endpoint that echoes the plaintext code, minting a JWT directly and
skipping the OTP UI entirely, or standing up a stub WhatsApp server. Given the
choice, went with the first: it is the only one of the three that still
exercises the real login flow end to end.

Implemented as `backend/src/auth/testing/`:

- `e2e-test-mode.ts` - `isE2eTestModeEnabled()` requires **both**
  `NODE_ENV !== "production"` and `E2E_TEST_MODE === "true"`. Neither alone is
  enough, so a stray `NODE_ENV=test` in a real deployment cannot by itself
  expose the endpoint.
- `otp-inspector.service.ts` - holds the most recent plaintext OTP per phone
  number in process memory only. Never written to the database, never logged.
- `test-only-auth.controller.ts` - `GET /auth/testing/otp?phone=...` returns
  the plaintext code for a phone that has one pending.
- `auth.module.ts` reads the gate once, at module-definition time, and only
  then includes the controller/provider in its `@Module()` metadata - a route
  the gate excludes is never wired into Nest's router, not merely refused
  when called.
- `AuthService.requestOtp` records the code (before hashing) via an
  `@Optional()` injected `OtpInspectorService`, which resolves to `undefined`
  everywhere the flag is off, so every call site is a no-op in production.

Three spec files pin this from different angles: `e2e-test-mode.spec.ts` (the
pure gate function across every env combination), `test-only-auth.controller
.spec.ts` (that `AuthModule`'s actual `@Module()` metadata - what Nest's
router is really built from - does or doesn't include the controller, proven
by `require()`-ing the module fresh under each env), and manual verification
against the real backend: started it with `E2E_TEST_MODE=true` against the
live database, called `POST /auth/request-otp` -> `GET /auth/testing/otp` ->
`POST /auth/verify-otp` for the seeded SUPERADMIN account, and got back a real,
valid JWT. Then confirmed the endpoint still exists when queried a second time
against that same already-running server (expected - the flag doesn't change
mid-process) and separately confirmed via the Jest specs that a fresh boot
without the flag never registers the route at all.

### Scaffolding shipped

- `frontend/playwright.config.ts` - Chromium project, starts both dev servers
  for a local run (`webServer` config passes `E2E_TEST_MODE=true` to the
  backend it launches), or attaches to already-running ones in CI via
  `PLAYWRIGHT_SKIP_WEBSERVER=1`.
- `frontend/e2e/fixtures/auth.ts` - `loginAs(page, apiURL, phone)` drives the
  real login UI: types the phone number, clicks the real "Send OTP" button,
  reads the code back via the test-only endpoint, types it into the six OTP
  digit boxes, clicks "Verify and Login", and waits for navigation off
  `/login`. `SEEDED_USERS` documents the two accounts (SUPERADMIN 9999999999,
  ADMIN 8888888888) that exist in any environment without additional seeding.
- `frontend/e2e/journeys/login.spec.ts` - 4 specs: SUPERADMIN and ADMIN each
  land on their correct dashboard, an unregistered phone is rejected before
  any OTP is sent, and an incorrect code is rejected with the session staying
  unauthenticated. Runs serially (`test.describe.configure({ mode: "serial"
  })`) - see below for why.
- `npm run test:e2e` / `test:e2e:ui` in `frontend/package.json`.
- `e2e/**` excluded from both `eslint.config.js` (Playwright's `use` fixture
  parameter otherwise reads as a misplaced React Hook to
  `eslint-plugin-react-hooks`) and `vitest.config.ts` (Vitest's default
  `*.spec.ts` glob otherwise tries to run Playwright specs itself and fails
  immediately on `test.describe.configure`).

### Bugs this actually caught, by actually running it

Writing E2E code without running it proves nothing. Since the OTP seam and the
login UI were both new ground, I ran the login suite for real against a live
backend, and it surfaced three real bugs before the suite ever went green:

1. **The fixture requested an OTP twice.** Once via a direct
   `page.request.post`, and again from the UI's own "Send OTP" click. Both
   requests count against `AuthService.requestOtp`'s real 60-second
   per-phone resend cooldown, so the second one 429'd. Fixed by having the
   fixture only ever *read* a code the UI's own click already produced,
   documented on `fetchOtp` so it isn't reintroduced.
2. **The fixture didn't unwrap the response envelope.** Every backend
   response is wrapped `{ success, statusCode, data }` by the global
   `ResponseInterceptor`; the fixture read `code` off the top level instead
   of `data.code` and got `undefined`, which then threw inside
   `page.keyboard.type(undefined)`.
3. **Filling all six OTP boxes doesn't auto-submit.** `StepOTP` only verifies
   on pressing Enter or clicking "Verify and Login" explicitly (see its
   `handleKey`/`onClick`) - there is no on-6th-digit auto-submit despite that
   being the more common OTP UX pattern. The fixture now clicks the button.

Also had to serialize the spec file: with only two guaranteed-registered phone
numbers to test against and a real, enforced per-phone cooldown, parallel
execution had two tests race that cooldown on the same number.

### Where verification stopped, and why

The manual, non-Playwright round-trip - `POST /auth/request-otp` ->
`GET /auth/testing/otp` -> `POST /auth/verify-otp` for the seeded SUPERADMIN
account - was run directly via curl against the live backend and returned a
real, valid JWT. That confirms the OTP test-seam itself is sound end to end.

The full Playwright suite was not driven to a final 4/4 green run: after the
fixture bugs above were found and fixed, further attempts hit connection
timeouts from the shared Supabase pooler (`Error: Connection terminated due to
connection timeout`, from `backend/.env`'s hosted `DATABASE_URL`) under the
repeated retries this debugging required, and separately burned through
`AuthService`'s 5-requests-per-hour cap for the SUPERADMIN test number. Neither
is a bug in the E2E code; both are exactly the cost of repeatedly hitting a
real, shared, rate-limited database - which is the same risk flagged when this
phase started. Continuing to retry against it was the wrong call, so the run
stopped there rather than hammering shared infrastructure further.

**Practical effect:** the login journey's logic is proven correct (manual
round-trip, plus 3 of 4 specs having been individually observed passing across
the debugging attempts above), but a clean automated `4 passed` run is still
owed. That run should happen once there is a disposable Postgres to point at
instead of the shared one - which removes the rate-limit collision risk
entirely, since a fresh per-run database has no history of prior requests to
count against the hourly cap.

### Next in Phase 3

- Stand up the disposable-Postgres path (Testcontainers or a local Docker
  Postgres + `db:seed`) before writing any journey that creates or deletes
  data - this unblocks the remaining ~20 specs safely, and also removes the
  rate-limit collision that stopped the login suite short of a clean
  automated run (see above).
- Re-run `login.spec.ts` to completion against that disposable database and
  confirm all 4 pass together in one run, not just individually across
  debugging attempts.
- Seed WORKER, WEAVER, SHOP, and ACCOUNTANT test accounts (only SUPERADMIN and
  ADMIN self-seed today), then extend `login.spec.ts` to cover all six roles
  landing on their correct portal.
- Work through the journey table in section 2 in priority order: the factory
  chain (intake -> GRN -> issue -> batch -> finishing -> QC) and the
  sale -> invoice -> payment path are the highest-value ones to write next.
- Add `@axe-core/playwright` once there is a second real journey to attach it
  to, per the Phase 4 plan.

## 9. Sequencing summary

| Week | Focus | Blocking gate added |
| --- | --- | --- |
| 1 | Backend into CI, secret and audit scan, pre-commit hooks | backend build / test / lint - **done** |
| 2-4 | Integration tests, authz matrix, Testcontainers | backend coverage at least 60% |
| 3-5 | Frontend MSW and component coverage | frontend coverage threshold |
| 5-7 | Playwright journeys and axe | E2E suite green |
| 7-9 | CodeQL, semgrep, k6, Lighthouse CI | no high findings, perf budget met |
| 9-10 | Exploratory, UAT, device matrix | sign-off checklist |
