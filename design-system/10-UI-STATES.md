# Phase S — UI States
## Loading / Error / Empty / Access / Session / Network / Validation

> **This document is the single source of truth for the UI-states effort.**
> Written to be resumed from any Claude account, in any session, with zero
> prior context — same convention as `09-RESPONSIVE.md`. Read §0 and §1
> before touching a screen.
>
> Status ledger lives in §9. **Update the ledger in the same commit as the work.**

---

## §0 — SCOPE RULE (read this first, it is not optional)

**Add state handling. Change nothing else.**

This is a rollout, not a refactor. A commit that also "fixes while in there" cannot
be reviewed, cannot be reverted cleanly, and cannot be trusted when a regression
shows up later.

### Allowed in a Phase S commit

- Routing a query/mutation through `useAsyncState` (`shared/hooks/useAsyncState.ts`)
  and deleting the local `isLoading &&` branch it replaces.
- Passing `loading`/`error`/`onRetry`/`isFiltered`/`onClearFilters` to `DataTable`
  (`shared/ui/data/DataTable.tsx`) for a table that isn't wired to them yet.
- Swapping a hand-rolled loading/error/empty block for `LoadingState` /
  `ErrorState` / `EmptyState` / `FilteredEmptyState` (`shared/ui/state/`).
- Migrating a form from manual `useState` validation to `useAppForm` + a zod
  schema (`shared/forms/`).
- Wrapping a screen or region in `RequireRole` / `ErrorBoundary` where the
  screen currently has no guard/boundary of its own.
- Adding a `code`/`fields` case to a backend controller/service that was
  missing one (S0-style infra work only, not screen work).

### Forbidden in a Phase S commit

- Changing the happy-path appearance at any breakpoint. **The loaded, error-free
  state is the control group.** If the loaded render changes in any way, the
  diff is out of scope — revert it and log it in §10.
- Renaming, reordering props, "tidying" imports, reformatting untouched lines.
- Fixing bugs noticed in passing — log them in §10, don't fix them here.
- Changing business logic, copy, colours, or migrating a raw `<table>` onto
  `DataTable` (that is a `04-DATA-DISPLAY.md` migration, not a Phase S one).
- Writing a new error-copy string anywhere outside
  `shared/ui/state/errorMessages.ts`.

### The one-line test before every commit

> "With data loaded and no error, is this screen pixel-identical to `main`?"
> If the answer is anything other than a confident **yes**, the diff is out of scope.

---

## §1 — Session start protocol (do this every session, ~2 minutes)

```bash
cd frontend && git status && npx tsc --noEmit
cd ../backend && npx tsc --noEmit
```

1. `git status` on both — confirm a clean tree or a known in-progress Phase S commit.
   **Never commit files you did not touch this session.**
2. Read §9 (Status ledger) and pick the next unchecked screen in the
   lowest-numbered incomplete portal phase (S1 → S6, in order — S0 must be
   complete first, everything else depends on it).
3. Read §2 (the taxonomy) and §3 (the per-screen-type recipe) before touching
   a file — the recipes exist so work from different sessions looks identical.

### Session end protocol

```bash
cd frontend && npx tsc --noEmit && npm run lint && npm test -- --run && npm run build
cd ../backend && npx tsc --noEmit && npm run lint && npm test
```

`tsc` must exit 0 on both. `lint` must show **no new** warnings/errors against
the baseline (frontend: ~247 pre-existing warnings, 0 errors; backend: 0/0).
Tests must pass (frontend has 2 known-flaky `Select.test.tsx` cases unrelated
to Phase S — see `09-RESPONSIVE.md` conventions on pre-existing baselines).
Tick the boxes you completed in §9, with the date.

---

## §2 — The state taxonomy

Every screen must handle every state that applies to it. Not every state
applies to every screen (a static settings page has no "filtered-empty"); the
per-screen-type recipes in §3 say which apply where.

| State | Trigger | Component | Notes |
|---|---|---|---|
| Loading | query/mutation in flight | `LoadingState` (or `TableSkeleton` for tables) | Skeleton by default — reads as "arriving", not "broken" |
| Slow network | in-flight request past 4s | `SlowNetworkHint` | Global signal (`shared/api/requestActivity.ts`) — appears alongside the loading state, doesn't replace it |
| Error | query/mutation rejects | `ErrorState` (or `TableError`) | Copy comes from `errorMessages.ts`, keyed by `ErrorCode` — never a bespoke string |
| Empty | loaded, zero items, no filters active | `EmptyState` (or `TableEmpty`) | "Nothing has ever existed here" |
| Filtered-empty | loaded, zero items, filters active | `FilteredEmptyState` (or `TableFilteredEmpty`) | **Must never look like Empty** — offers "clear filters", not a generic message |
| Access denied | `FORBIDDEN_ROLE` / `FORBIDDEN_SCOPE` (403) | `AccessDeniedState`, or `RequireRole` at the route | Signed in, wrong permission — never a login bounce |
| Session expired | `AUTH_SESSION_EXPIRED` (401, token confirmed expired) | `SessionExpiredState` at `/session-expired` | Handled centrally in `shared/api/client.ts`; screens don't render this themselves |
| Offline | `navigator.onLine === false` | `OfflineBanner` (mounted once, app root) | Non-blocking — cached data stays visible |
| Field validation | zod client-side, or `VALIDATION_FAILED` with `fields` from the server | `FormField` error prop via `useAppForm` | Lands on the field, never a toast |
| Success (mutation) | mutation resolves | `sonner` toast | **Mutations toast, queries don't** — see §4 |

---

## §3 — Per-screen-type recipe

### Table / list page
1. Route the query through `useAsyncState`.
2. Pass `loading`, `error`, `onRetry`, `isFiltered`, `onClearFilters` to `DataTable`.
3. Confirm filtered-empty is real: apply a filter that matches nothing, confirm
   it does **not** look like the zero-data empty state.
4. Confirm the screen behaves for a role that lacks permission for it (link a
   test account, or temporarily force `FORBIDDEN_ROLE` via network throttling
   — see §5) — should show `AccessDeniedState`/`RequireRole`, not blank.

### Detail / profile page
1. Loading → `LoadingState variant="skeleton"` for the whole card while the
   primary fetch is in flight.
2. Not found (`NOT_FOUND`) → `EmptyState` with a "back to list" action, not a
   generic error.
3. Any nested table/list section follows the table recipe above.

### Form (create/edit)
1. `useAppForm({ schema })` — zod schema in `shared/forms/schemas/<feature>.ts`.
2. Every input wrapped in `FormField` — this is what wires `aria-invalid`/
   `aria-describedby` via `Field`'s existing context.
3. Submit button is `SubmitButton` (busy + disabled while submitting).
4. On a rejected mutation, call `form.applyServerError(error)` in `onError` —
   routes `ApiError.fields` onto the matching inputs; anything without a field
   match becomes a `root` error rendered once above the submit button.
5. Delete the form's old manual `useState` validation entirely — don't leave
   both patterns coexisting in one file.

### Dashboard / tab-switched page (`BeereDashboard.tsx` and portal home pages)
1. Each tab already renders inside an `ErrorBoundary variant="inline"
   resetKeys={[tab]}` (done for the two `BeereDashboard.tsx` Suspense blocks in
   S0 — confirm the same exists for other multi-tab portal shells before
   sweeping their individual tab pages).
2. Individual tab content otherwise follows the table/detail/form recipes.

### Wizard / multi-step flow (e.g. `NewSaleFlow.tsx`)
1. Each step's own async action follows the form or table recipe.
2. A failure on step N must not discard steps 1..N-1's already-entered data —
   confirm this explicitly; it's the easiest thing to break with the async
   rewrite.

---

## §4 — Toast policy

**Mutations toast. Queries don't.**

- A query failure is a content-region concern — render `ErrorState`/`TableError`
  in place, with retry. A toast for a background list refresh that silently
  fails is invisible if the user isn't looking at the corner, and intrusive if
  they are.
- A mutation (the user just clicked a button) succeeding or failing is an
  event, not a region's steady-state — that's what a toast is for.
  `queryClient`'s `MutationCache.onError` default already does this (see
  `lib/queryClient.ts`); a form using `useAppForm.applyServerError` supplies
  its own `onError` and opts out of the default toast in favour of field errors.
- Success toasts are for actions with **no other visible consequence** on
  screen (e.g. "Notification marked read" when the row already visually
  updated needs no toast; "Payment recorded" when the user is about to
  navigate away does).

---

## §5 — Verification, per screen

In the browser (preview tools), for every state the screen type's recipe lists:

- **Loading** — DevTools → Network → Slow 3G; confirm skeleton, then
  `SlowNetworkHint` after ~4s.
- **Error** — point `VITE_API_URL` at a dead port, or block the specific
  endpoint in DevTools; confirm `ErrorState`/`TableError` + working retry, and
  that **no toast fires** for a query failure.
- **Empty vs filtered-empty** — a filter matching nothing must render visibly
  differently from a genuinely empty resource.
- **Access denied** — sign in as a role without the permission; confirm
  `AccessDeniedState`/`RequireRole`, never a bounce to `/login`.
- **Session expired** — clear/expire the token (or wait out the 5-minute idle
  timeout); confirm `/session-expired` and that `returnTo` round-trips through
  re-login.
- **Offline** — DevTools → Network → Offline; confirm `OfflineBanner`, and that
  reconnecting triggers a refetch.
- **Validation** — submit empty, then submit values the backend itself
  rejects (not just the zod schema); confirm both land on the field.

---

## §6 — Baselines (measured before S0, `git rev 2be9d25`)

| Metric | Count |
|---|---|
| Files with `isLoading` | 59 |
| `useQuery(` call sites (files) | 106 |
| `useMutation(` call sites (files) | 24 |
| `TableSkeleton`/`TableEmpty`/`TableError` usage (files) | 4 / 3 / 5 |
| `zodResolver` usage | 0 |
| Backend controllers | 42 |
| Backend `ErrorCode` values | 11 (+2 client-only network codes) |

`npm run ratchet` (frontend) is being extended (§8) to report these live —
trust that over this table once it lands.

---

## §7 — Backend error contract (S0.1 — shipped)

- `backend/src/common/errors/error-codes.ts` — the `ErrorCode` union. Append-only;
  never rename or repurpose a value.
- `backend/src/common/errors/app-exception.ts` — `AppException` + typed
  subclasses (`NotFoundError`, `ForbiddenRoleError`, `ForbiddenScopeError`,
  `ConflictError`, `ValidationError`). Existing bare Nest exceptions
  (`NotFoundException`, etc.) keep working — `AllExceptionsFilter` assigns them
  a default code from their HTTP status via `defaultCodeForStatus`.
- `backend/src/common/errors/validation-exception.factory.ts` — wired into
  `ValidationPipe`'s `exceptionFactory` (`main.ts`); turns class-validator's
  error tree into `fields: { "dotted.path": string[] }` instead of one flat
  array, so a 12-field form can put each message on its own input.
- `jwt-auth.guard.ts` distinguishes `AUTH_SESSION_EXPIRED` (token confirmed
  expired — the frontend tears down the session and routes to
  `/session-expired`) from `AUTH_REQUIRED` (no/garbage token — routes to
  `/login`). Previously both were an identical 401.
- `notifications.controller.ts`/`.service.ts` — was already behind the global
  `JwtAuthGuard`/`PermissionsGuard` (registered as `APP_GUARD`s in
  `auth.module.ts`), so the "RBAC not applied" comment it carried was stale.
  What actually needed fixing: `findAll`/`markRead` trusted a client-supplied
  `userId`/`role` query param, so any signed-in user could read or mark-read
  another user's or role's notifications. Now scoped server-side to the
  caller's identity (ADMIN/SUPERADMIN keep full-catalog access, matching
  `PermissionsGuard`'s existing unconditional bypass for those two roles).
  `create` stays open to any authenticated user by design — portals raise
  notifications for other roles as normal operation (e.g. `ShopHome.tsx`
  notifying ADMIN of a sale).

---

## §8 — Frontend infrastructure (S0.2–S0.6 — shipped)

| Piece | File(s) |
|---|---|
| Error code contract (mirrors backend) | `shared/api/errors.ts` |
| Transport: timeout, classifiers, session-expiry routing | `shared/api/client.ts` |
| Slow-request signal | `shared/api/requestActivity.ts` |
| `useOnlineStatus`, `useSlowNetwork`, `useAsyncState` | `shared/hooks/` |
| Query retry/backoff policy + global error routing | `lib/queryClient.ts` |
| State shell + all state components | `shared/ui/state/` |
| Error copy map (the only place error strings live) | `shared/ui/state/errorMessages.ts` |
| Route guard (replaces 6 duplicated inline checks) | `app/guards/RequireRole.tsx` |
| `/session-expired` route + `returnTo` round-trip | `app/App.tsx`, `app/pages/LoginPage.tsx` |
| Per-tab crash isolation | `components/ErrorBoundary.tsx` (`resetKeys`, `variant="inline"`), wired into `features/dashboards/components/BeereDashboard.tsx` |
| Form contract | `shared/forms/` (`useAppForm`, `FormField`, `SubmitButton`) |
| `TableStates.tsx` refactored onto the shared shell | `shared/ui/data/TableStates.tsx` (behavior unchanged, now built on `StateView`) |

Not yet extended: `frontend/scripts/ratchet.mjs` doesn't report Phase-S metrics
yet (planned: `useQuery` sites without an `ErrorState`/`TableError` path, raw
`isLoading &&` renders, forms not on `useAppForm`). Flagged in §10 rather than
done blind — the ratchet script's existing metrics are hand-verified against
real greps in `09-RESPONSIVE.md`'s history and a Phase-S addition deserves the
same care, not a rushed regex.

---

## §9 — Status ledger

**S0 — Infrastructure: shipped** (this session, see §7/§8). Backend: `tsc`
clean, lint 0 errors, 86/86 tests passing. Frontend: `tsc` clean, lint 0
errors (247 pre-existing warnings, unchanged), test suite unchanged (2
pre-existing `Select.test.tsx` failures, confirmed present on unmodified
`main` — not caused by this work).

**All phases checked off as of 2026-08-25.** S1 — all 4 rows. S2 — 33/36
(3 are non-gaps, see below). S3 — all 9. S4 — all 6. S5 — all 8. S6 — all 4.
This closes the page-level ledger for the full S0–S6 rollout. What remains
is entirely tracked in §10 as "found, not fixed" — real, lower-priority gaps
(stat-tile error states with no retry, un-swept secondary sub-sections,
loading-unaware picker dropdowns) — not unchecked rows.
The 3 remaining are not gaps: 2 are static-mock-data pages with no fetch to
have a loading/error state for (`AllPurchasesPage.tsx`, `QcHistoryPage.tsx`),
and 1 (`NotificationsPage.tsx`) is deferred to S6 by design (it needs the
realtime/socket-state work S6 covers). **Every S2 screen with a real async
data source now has loading/error handling.** What's *not* yet done, tracked
in §10: several of the ~49 remaining files from the 62-file `<DataTable`
sweep are secondary sub-sections inside already-checked pages (Materials'
purchase/movement history, Payments' 6 other sub-sections, Reports' other ~5
sub-sections, etc.) — real gaps, just not blocking the page-level checkbox.
One row per screen; check off in the same commit that does the work.
"Recipe" = the §3 type. Screens are grouped by the file listing gathered
pre-S0 (`features/**/*Page.tsx` + portal screen components).

**Scope correction (2026-08-25):** the ~35 page-level rows below undercount
the real work. A repo-wide sweep for `<DataTable` calls missing
`loading`/`error` props found **62 files**, because most pages compose
several section components that each need their own review (data source,
filter defaults, retry function) — a page checked off here means its
*primary* table/section is wired, not that every nested section is. Where a
page's ledger row is checked, its note says which section(s) were covered.

### S1 — Auth + shell (4)
- [x] `features/auth/components/LoginPage.tsx` — form (2026-08-25, StepPhone already had proper loading/error handling; StepOTP had a real gap — `loading` state was set but never read, so the verify button gave no busy feedback during the real network call — fixed)
- [x] `app/layouts/*.tsx` (6 files, one PR) — dashboard/shell (2026-08-25, confirmed — all 6 already have both `RequireRole` (S0) and `ErrorBoundary` wrapping their `<Outlet />`, nothing to fix)
- [x] `app/pages/RoleSelectPage.tsx` — detail (2026-08-25, N/A — no async fetch, derives entirely from already-resolved AuthContext state; a static edge-case explainer page)
- [x] `features/scanning/components/MobileScanView.tsx` — detail (2026-08-25, real gap: a network/server failure and a genuine "no such saree" were both shown as "Couldn't find a saree with code X" with no retry — split into ErrorState (with retry) vs EmptyState)

### S2 — Admin / Superadmin tabs (~35)
- [x] `features/audit/components/AuditLogPage.tsx` — table (2026-08-25)
- [x] `features/bulk-orders/components/AllOrdersPage.tsx` — table (2026-08-25, previously no loading/error at all — a failed fetch showed "no orders match your filters", wrongly implying filters were the cause)
- [x] `features/bulk-orders/components/BulkOrderDetailPage.tsx` — detail (2026-08-25, N/A by inheritance — `order` prop already resolved by the parent page's gate; sarees/payments/quotations tabs derive synchronously, no independent fetch)
- [x] `features/customers/components/CustomersPage.tsx` — table (2026-08-25, wholesale + inactive sections; retail/analytics untouched — client-side mock data, no load-failure state possible)
- [x] `features/dashboards/components/superadmin-dashboard/SAOverviewPage.tsx` — dashboard (2026-08-25, reviewed — see §10 finding: stat tiles show "Error" text with no retry, not fixed this pass)
- [x] `features/design-library/components/DesignLibraryPage.tsx` — table (2026-08-25, dispatch history tab; extended DesignLibraryContext with isLoading/refetch)
- [x] `features/finishing/components/FinishingTrackingPage.tsx` — table (2026-08-25, real bug: retry button called `window.location.reload()` instead of refetching — fixed to use FinishingContext.refetch)
- [x] `features/firms/components/FirmsPage.tsx` — table (2026-08-25, Business Overview table)
- [x] `features/firms/components/FirmDetailPage.tsx` — detail (2026-08-25, real bug: `error` was destructured from useFirmActivity but never checked or rendered — a failed fetch showed an empty table forever)
- [x] `features/inventory/components/InventoryPage.tsx` — table (2026-08-25, DispatchHistorySection; extended FinishingContext with isLoading/refetch)
- [x] `features/inventory/components/AllStockPage.tsx` — table (2026-08-25, added retry + filtered-empty)
- [ ] `features/inventory/components/AllPurchasesPage.tsx` — table (N/A — entirely static mock data, `ALL_PURCHASES` array, no fetch to have a loading/error state for)
- [x] `features/inventory/components/ExternalPurchasesPage.tsx` — table (2026-08-25, PurchasesTable now takes loading/error/onRetry/onClearFilters — the last two existed but were unwired, `onClearFilters={() => {}}` was a dead stub)
- [x] `features/inventory/components/SupplierReturnsPage.tsx` — table (2026-08-25)
- [x] `features/materials/components/MaterialsPage.tsx` — table (2026-08-25, BatchesSection only — PurchaseHistorySection/MovementHistorySection not yet swept, both have multiple useQuery calls with no loading/error tracking at all)
- [x] `features/materials/components/IssueMaterialPage.tsx` — form (2026-08-25, IssuanceHistorySection card+table views; the issue form itself not yet on useAppForm)
- [x] `features/materials/components/ReturnMaterialPage.tsx` — form (2026-08-25, ReturnHistorySection card+table views; the return form itself not yet on useAppForm)
- [x] `features/payments/components/PaymentsPage.tsx` — table (2026-08-25, PaymentHistorySection; all 6 other sub-sections audited+fixed in the found-not-fixed cleanup pass — see §10)
- [x] `features/payments/components/OutstandingPage.tsx` — table (2026-08-25, single top-level gate covers all 5 tabs; extended SalesContext with isLoading/refetch)
- [x] `features/pricing/components/RatesPricingPage.tsx` — table/form (2026-08-25, all 3 sub-sections — MakingCharges/RateHistory/WholesaleTerms; WholesaleTerms previously had no error handling at all, only loading)
- [x] `features/production/components/ProductionPage.tsx` — table (2026-08-25, all 6 sub-sections now audited+fixed: ActiveBatchesSection, BulkOrdersSection (added full loading/error/empty gate — previously zero handling), DefectiveSareesSection (mobile card view was silently swallowing qcError, now shows ErrorState with real refetch), ProductionAnalyticsSection (already compliant), ProductionHistorySection (added isError/onRetry to the qc query + DataTable, previously error was untracked), MiscCards (N/A, no own data fetching); extended BatchContext with isLoading/refetch)
- [x] `features/production/components/ProductionHistoryPage.tsx` — table (2026-08-25, had no error handling at all — a failed QC/batch fetch just showed an empty table)
- [x] `features/production/components/BatchCreationPage.tsx` — form (2026-08-25, DraftsTab list; the new-batch form itself not yet on useAppForm)
- [x] `features/production/components/BatchTallyPage.tsx` — table (2026-08-25, fixed a real bug: loading batches showed "Batch X not found" indistinguishable from a genuinely missing batch)
- [x] `features/production/components/FactoryLoomPage.tsx` — table (2026-08-25)
- [x] `features/production/components/factory-loom/LoomDetailPage.tsx` — detail (2026-08-25, N/A by inheritance — receives already-resolved `loom`/`batches` props; the parent FactoryLoomPage gate covers it, no independent fetch of its own)
- [x] `features/purchasing/components/ApprovalsPage.tsx` — table (2026-08-25, added a loading gate — previously absent, so the page could flash "no pending approvals" before the 3 underlying queries resolved; extended POContext with isLoading/refetch)
- [ ] `features/qc/components/QcHistoryPage.tsx` — table (N/A — entirely static mock data, `QC_QUEUE` hardcoded array, no fetch to have a loading/error state for)
- [x] `features/reports/components/ReportsPage.tsx` — dashboard (2026-08-25, all report sub-sections now audited — 4 fixed initially (OverdueAlertsReport, ProfitLossReport, WholesaleSalesReport, WeaverPaymentReport), remaining 8 audited+mostly-fixed in the found-not-fixed cleanup pass — see §10; extended BulkOrderContext with isLoading/refetch)
- [x] `features/settings/components/LabelSettingsPage.tsx` — form (2026-08-25, had loading/error but no retry action — settings form itself not yet on useAppForm)
- [x] `features/suppliers/components/SuppliersPage.tsx` — table (2026-08-25, SupplierDirectorySection)
- [x] `features/users/components/AddUserPage.tsx` — table/form (2026-08-25, UserTable loading/error/filtered-empty; add-user form itself not yet on useAppForm)
- [x] `features/vendors/components/VendorsPage.tsx` — table (2026-08-25, VendorDirectorySection; converted silent useEffect fetch to exposed loading/error)
- [x] `features/weavers/components/WeaversPage.tsx` — table (2026-08-25, table view; card/list views in WeaverCardAndListViews.tsx audited — already fully compliant, no change needed)
- [x] `features/weavers/components/AllWeaversPage.tsx` — table (2026-08-25, had loading/error/filtered-empty already — just added retry)
- [x] `features/notifications/components/NotificationsPage.tsx` — see S6 (fixed there, row below)

### S3 — Worker portal (~10)
- [x] `features/portals/components/worker/WorkerHome.tsx` / `WorkerHomeDesktop.tsx` — dashboard (2026-08-25, reviewed — a stats-strip only, no table; underlying BatchContext/QcContext now expose isLoading. Retrofitting the shared PortalChrome.StatsStrip with a loading affordance is out of scope — it's shared with the Weaver portal too)
- [x] `features/portals/components/worker/WorkerGRN.tsx` — form (2026-08-25, GRNPODropdown now distinguishes loading/error/empty for the PO picker; the mutation itself already toasted correctly)
- [x] `features/portals/components/worker/WorkerQC.tsx` — table/form (2026-08-25, real gap: both queue empty-states said "All done!" regardless of whether data had actually loaded or failed — now gated on loading/error first)
- [x] `features/portals/components/worker/WorkerFinishing.tsx` — table (2026-08-25, all 4 sub-sections — SectionA, SectionBFiltered, SectionC, QuotationsSection — had correct empty-vs-filtered-empty copy already but zero loading/error handling; extended QcContext with isLoading/refetch along the way)
- [x] `features/portals/components/worker/WorkerDispatch.tsx` — table/form (2026-08-25, reuses the DispatchHistorySection already fixed in S2 — no independent gap)
- [x] `features/portals/components/worker/WorkerWeavers.tsx` — table (2026-08-25, reviewed — HistorySection's `liveRecords` is session-local state with no backend fetch, same pattern as WorkerGRN's history; N/A for loading/error)
- [x] `features/portals/components/worker/weavers/DesignPlanningPage.tsx` — table (N/A — static form with no data fetch)
- [x] `features/portals/components/worker/weavers/ReceiveSareesPage.tsx` — form (2026-08-25, reviewed — scan-driven flow with no list/table to gate; weaver-picker dropdown loading not wired, low-risk, logged in §10)
- [x] `features/portals/components/worker/weavers/WorkerIssueMaterialPage.tsx` — form (2026-08-25, reviewed — form with a weaver-picker dropdown only, no table; same low-risk dropdown-loading gap logged in §10)

### S4 — Weaver portal (~10)
- [x] `features/portals/components/weaver-portal/MyBatchesPage.tsx` — table (2026-08-25, real bug: the weaver-profile loading gate didn't wait for the batches fetch, so a batches load failure/delay showed "No active batches" / "No completed batches" indistinguishable from actually having none)
- [x] `features/portals/components/weaver-portal/BatchHistoryPage.tsx` — table (2026-08-25, same bug class as MyBatchesPage, same fix)
- [x] `features/portals/components/weaver-portal/ConfirmMaterialPage.tsx` — form (2026-08-25, same bug class — materials fetch wasn't part of the loading gate)
- [x] `features/portals/components/weaver-portal/PaymentLedgerPage.tsx` — table (2026-08-25, same bug class; extended WeaverPaymentsContext with isLoading/refetch)
- [x] `features/portals/components/weaver-portal/WarpRequestPage.tsx` — form (2026-08-25, warp-requests query had no loading/error handling at all)
- [x] `features/portals/components/weaver-portal/NotificationsPage.tsx` — see S6 (fixed there, row below)
- [x] `features/portals/components/weaver-portal/desktop/{BatchesSection,ConfirmSection,PaymentsSection,WarpSection}.tsx` — table/form (2026-08-25, all 4 desktop equivalents of the mobile pages above — BatchesSection already had a good error-vs-empty distinction with a comment explaining why, just missing loading + retry; the other 3 had neither)

### S5 — Shop-staff + Accountant (~12)
- [x] `features/portals/components/shop-staff/ShopHome.tsx` — dashboard (2026-08-25, recent-sales list; stat tiles show "Error" text with no retry, same class as SAOverviewPage/WorkerHome, logged not fixed)
- [x] `features/portals/components/shop-staff/ShopInventory.tsx` — table (2026-08-25, already had loading/error/empty distinguished — added retry)
- [x] `features/portals/components/shop-staff/NewSaleFlow.tsx` — wizard (2026-08-25, reviewed — submit/scan error path already solid; 2 convenience-browse lists (customer search, saree browse) have no loading state but degrade gracefully, logged not fixed)
- [x] `features/portals/components/shop-staff/ProcessReturn*.tsx` — wizard (2026-08-25, return-history list had zero loading/error/empty handling; fixed, threading through ProcessReturn.tsx's existing but previously-unused refetch)
- [x] `features/portals/components/shop-staff/SalesReport.tsx` — table (2026-08-25, both the returns list and top-customers list had zero loading/error handling)
- [x] `features/portals/components/shop-staff/CustomerProfiles.tsx` — table (2026-08-25, real gap: zero loading/error/empty handling at all before this)
- [x] `features/portals/components/shop-staff/desktop/{HomeSection,SaleSection,ReturnSection,CustomersSection,ReportsSection}.tsx` — table/form (2026-08-25, desktop mirrors of the mobile shop-staff pages above, same fixes applied; SaleSection is a thin wrapper over the already-fixed NewSaleFlow, no independent gap; ReturnSection wraps the already-fixed ProcessReturn, its own "no returns today" sidebar summary logged as the same low-risk stat-tile gap)
- [x] `features/dashboards/components/AccountantDashboard.tsx` — dashboard (2026-08-25, tab dispatcher over 9 already-S2-fixed pages; added the per-tab ErrorBoundary + resetKeys isolation BeereDashboard.tsx got in S0, which this shell was missing)

### S6 — Notifications + realtime (4)
- [x] `features/notifications/components/NotificationsPage.tsx` — table + socket state (2026-08-25, added retry + a live/reconnecting indicator in the dark hero header)
- [x] `features/portals/components/weaver-portal/NotificationsPage.tsx` — table + socket state (2026-08-25, N/A — this file is a bare re-export of the admin NotificationsPage above, same component, already fixed)
- [x] Socket connection indicator (connected/reconnecting/disconnected) — new, shared across both notification screens (2026-08-25, `useSocketStatus` hook + `SocketStatusBadge` component built in `shared/`; wired directly — with a dark-theme-appropriate inline variant — into the one real NotificationsPage screen, since the weaver-portal file is the same component)
- [x] `backend/src/notifications/notifications.gateway.ts` — confirm reconnect/room-rejoin behaviour matches the scoping added in S0.1 (2026-08-25, real security gap found and fixed — see §10)

### The 15 legacy contexts (not migrated in Phase S)
`features/*/contexts/*Context.tsx` (composed in `App.tsx`) keep their
imperative `useState` fetching — out of scope for a React Query migration
here. Each is made to expose `{loading, error, retry}` in the same shape
`useAsyncState` produces, so consuming screens use one contract regardless of
the data source. Track per-context in §10 as each is touched; there is no
separate checklist for this since it's incidental to whichever screen touches
that context first.

---

## §10 — Log: found-not-fixed, decisions, deviations

Append here rather than acting. This is what keeps §0's scope rule
survivable — noticing a problem and recording it is the correct response, not
fixing it here.

**Format:** `YYYY-MM-DD | phase | file | note`

| Date | Phase | File / area | Note |
|---|---|---|---|
| 2026-08-24 | S0 | `users.controller.ts` | The stale "RBAC guards intentionally not yet applied" comment this file and `notifications.controller.ts` both carried was **inaccurate for users.controller.ts** — it already has per-route `@RequirePermissions(...)` on every mutating endpoint. Comment left as-is on `users.controller.ts` (it correctly documents that file's own design); removed only from `notifications.controller.ts`, which is where the gap actually was. |
| 2026-08-24 | S0 | `frontend/scripts/ratchet.mjs` | Not extended with Phase-S metrics this session — flagged in §8 rather than added under time pressure. **Resolved 2026-08-25**: added 4 Phase 10 metrics — `useQuery sites w/o isError\|error` (destructuring-based proxy, baseline 75), `raw "isLoading &&" JSX renders` (hand-rolled loading UI instead of shared LoadingState, baseline 61), `toast.error inside useQuery onError` (policy violation per §S0.6 toast rule — mutations toast, queries don't; currently 0, already at target), `forms on useAppForm` (adoption metric, higher-is-better, target 5 tracking the known flagged forms — AddUserPage/BatchCreationPage/ReturnMaterialPage/IssueMaterialPage/LabelSettingsPage). Baselines are honest snapshots of current state, not the state at Phase S's start (that number was never captured) — same convention as this script's other custom/proxy metrics. |
| 2026-08-24 | S0 | (repo-wide) | Five files unrelated to Phase S (`backend/prisma/schema.prisma`, `backend/src/purchases/dto/create-purchase-saree-line.dto.ts`, three files under `frontend/src/features/suppliers/`) showed uncommitted changes during this session that this work did not make — apparently a concurrent session. Left untouched; not staged or committed by this effort. |
| 2026-08-25 | S2 | `CustomersContext.tsx`, `FirmsContext.tsx`, `SupplierContext.tsx`, `MaterialIssueContext.tsx`, `MaterialReturnContext.tsx` | **Pattern found across the legacy contexts, fixed where touched.** Each of these had a `useQuery` whose `isLoading`/`error` were computed but never included in the context's exposed value — so a failed initial fetch left the UI permanently on an empty table with no way to tell "no data" from "couldn't load". Extended each context's value + fallback with `isLoading`/`error`/`refetch` (some already had `isError`/`error`, just not `isLoading`/`refetch`). Not yet audited: the remaining ~10 of the 15 legacy contexts listed in the ledger's own "15 legacy contexts" section — same fix is likely needed there too. |
| 2026-08-25 | S2 | `VendorsPage.tsx` | **Found, fixed.** The vendor list was a bare `useEffect` + `.catch(() => setVendors([]))` — any load failure was silently indistinguishable from zero vendors, and no retry/backoff (bypassing the S0 queryClient policy entirely, since it wasn't on `useQuery` at all). Converted to expose `loading`/`error` state with a manual retry; left as local `useState` rather than migrating to `useQuery` since `handleSave`/`handleUpdate`/`handleDelete` mutate `vendors` locally in ways a full migration would need to re-verify — out of scope for a Phase S commit. |
| 2026-08-25 | S2 | `AuditLogPage.tsx` → `LoginHistorySection.tsx` | **Found, fixed.** Same silent-failure `useEffect` pattern as `VendorsPage.tsx`; this one converted cleanly to `useQuery` (no local mutation of the fetched list), so it now gets the S0 retry/backoff policy too. |
| 2026-08-25 | S2 | 62-file `<DataTable` sweep | Only ~13 of the 62 files found missing loading/error props were addressed this session (the ones backing the 10 checked ledger rows). The remaining ~49 are unfixed — grep for `<DataTable` and check the surrounding 800 chars for `loading` to regenerate the list. Most of the remaining files are payment/report/detail sub-tabs nested inside pages whose primary table is already fixed. |
| 2026-08-25 | S2 (batch 2) | `CustomersContext`/`FirmsContext`/`SupplierContext`/`MaterialIssueContext`/`MaterialReturnContext` (batch 1) + `FinishingContext`, `SalesContext`, `BatchContext` (batch 2) | Same missing-`isLoading`/`refetch` pattern found in 3 more legacy contexts this batch. All 8 of the app's ~15 legacy contexts with a real backend `useQuery` are now fixed; the remainder are either pure-local state or not yet audited (see the ledger's "15 legacy contexts" section — still not fully swept). |
| 2026-08-25 | S2 (batch 2) | `BatchTallyPage.tsx` | **Real bug, fixed.** `if (!b) return <"Batch not found">` didn't distinguish "the batch list is still loading" from "this batch genuinely doesn't exist" — on a slow connection, opening a batch's tally page showed a false "not found" for as long as the fetch took. Now gated on `useBatches()`'s `isLoading`/`isError` first. |
| 2026-08-25 | S2 (batch 2) | `ExternalPurchasesPage.tsx` → `PurchasesTable.tsx` | **Found, fixed.** `onClearFilters={() => {}}` was a dead no-op stub passed to `DataTable` — the "Clear all filters" button on a filtered-empty state did nothing. `ExternalPurchasesPage.tsx` already had a real `clearFilters` function computed but never wired through. |
| 2026-08-25 | S2 (batch 2) | `PaymentHistorySection.tsx`, `WholesaleTermsSection.tsx` | Both had a `useQuery`/multiple `useQuery`s with `isLoading` wired but **no `isError` handling at all** — a failed fetch left the screen showing an empty table indefinitely with no retry. Fixed. |
| 2026-08-25 | S2 (batch 3) | `POContext`, `BulkOrderContext`, `DesignLibraryContext` | Same missing-`isLoading`/`refetch` pattern, 3 more contexts. That's 11 of the ~15 legacy contexts now fixed — remaining ones not yet audited. |
| 2026-08-25 | S2 (batch 3) | `FinishingTrackingPage.tsx` | **Real bug, fixed.** The error state's retry button called `window.location.reload()` — a full page reload — instead of refetching the failed query. Works, but throws away any other in-progress UI state on the page for no reason once `FinishingContext.refetch` existed to do this properly. |
| 2026-08-25 | S2 (batch 3) | `FirmDetailPage.tsx` | **Real bug, fixed.** `const { documents, payments, isLoading, error } = useFirmActivity(...)` destructured `error` but never read it anywhere — a failed fetch just showed "No documents match the current filters" forever, indistinguishable from a real empty state. `useFirmActivity` also lacked `isError`/`refetch`; added both. |
| 2026-08-25 | S2 (batch 3) | `BatchTallyPage.tsx`, `LoomDetailPage.tsx`, `BulkOrderDetailPage.tsx` | Established the "done by inheritance" pattern for detail pages that take an already-resolved entity as a required prop with no independent fetch of their own — correct to check off once the parent list page's loading/error gate is confirmed to run before the detail page ever mounts. Worth remembering as a recipe note (§3) rather than re-deriving each time. |
| 2026-08-25 | S2 (batch 3) | `SAOverviewPage.tsx` | **Found, not fixed.** `useDashboardMetrics()`/`useDashboardAnalytics()` (shared with `BeereDashboard.tsx`'s admin overview) render `"Error"` as a stat-tile value on failure, with no retry — a dead end until the user manually reloads. Not fixed this pass: the stat-tile component (`LuxuryStatsCard`) has no error-slot design, and retrofitting one risks a visual change to the loaded state, which is out of Phase S's scope rule. Flag for a design-system pass on `LuxuryStatsCard` itself, not a Phase S screen fix. |
| 2026-08-25 | S2 (batch 3) | `MaterialsPage.tsx` → `PurchaseHistorySection.tsx`, `MovementHistorySection.tsx` | **Found, not fixed.** Both have multiple `useQuery` calls feeding a `<DataTable>` with zero loading/error tracking on any of them — same gap class as everything else in this document, just not reached this session. Higher priority than most remaining S2 items since Materials is one of the most-used admin screens. |
| 2026-08-25 | S3 | `QcContext` | Same missing-`isLoading`/`refetch` pattern as the ~11 other legacy contexts fixed in S2 batches 1–3. |
| 2026-08-25 | S3 | `WorkerQC.tsx` | **Real bug, fixed.** Both QC-queue empty states ("All done for this weaver!" / "All sarees inspected!") rendered unconditionally whenever the filtered list was empty — including while `useBatches()`/`useQc()` were still loading, or had failed outright. A worker opening the QC tab on a slow connection briefly saw "you're all done" before the real (non-empty) queue arrived. Now gated on loading/error first. |
| 2026-08-25 | S3 | `worker/weavers/ReceiveSareesPage.tsx`, `worker/weavers/WorkerIssueMaterialPage.tsx` | **Found, not fixed.** Both have a weaver-picker `<Select>` populated from an un-gated `useQuery` — during loading the dropdown is just empty, no "Loading weavers…" state (same class of gap fixed in `GRNPODropdown.tsx` this session, just not applied here). Low risk — a dropdown transiently empty for the ~1s a roster fetch takes is a minor rough edge, not a correctness bug — so left for a future pass rather than done under time pressure. |
| 2026-08-25 | S3 | `WorkerHome.tsx` / `WorkerHomeDesktop.tsx` | **Found, not fixed.** The stats strip's pending-count tiles read `0` while `useBatches()`/`useQc()` are still loading, same as any numeric summary — not misleading in the same way an empty *table* is (a `0` count reads as "nothing pending yet", not "you have no data"), so lower priority than the table-shaped gaps elsewhere in this document. Would need a change to the shared `PortalChrome.StatsStrip` component (used by both Worker and Weaver portals) to fix properly — flagged for whoever picks up S4, since it'll want the same fix there. |
| 2026-08-25 | S4 | `WeaverPaymentsContext` | Same missing-`isLoading`/`refetch` pattern as the ~12 other legacy contexts fixed across S2–S3. |
| 2026-08-25 | S4 | `MyBatchesPage.tsx`, `BatchHistoryPage.tsx`, `ConfirmMaterialPage.tsx`, `PaymentLedgerPage.tsx` | **Real bug, same shape, fixed in all 4.** Each page had a `weaverLoading`/`weaverError` gate for the *weaver-profile* lookup (`useCurrentWeaver()`) but never waited on the actual data query (`useBatches()`/`useMaterialIssue()`/`useWeaverPayments()`) before rendering. A worker's profile resolves near-instantly (it's already in the JWT), so in practice the batches/materials/payments fetch was still in flight when the gate cleared — every one of these screens could show "No active batches" / "No materials issued" / "No payment records" while the real data was still on its way. This is the S4 equivalent of the `WorkerQC.tsx` bug found in S3; worth checking for the same pattern in any future portal-detail page with a "resolve identity, then fetch its data" two-step. |
| 2026-08-25 | S4 | desktop `BatchesSection.tsx` | Already had a thoughtful error-vs-empty distinction with an explanatory comment ("never show the no-batches empty state on a load failure") — just missing `isLoading` and a retry action, both added. Good prior art for the copy/reasoning other sections should match. |
| 2026-08-25 | S4 | `PaymentLedgerPage.tsx` mobile — `chargesByType`/`failedSarees` sub-lists | Only the primary `myPayments` history table got the loading/error treatment on the desktop `PaymentsSection.tsx`; the two smaller sub-lists (making-charges breakdown, defective-saree list) on both mobile and desktop still read their empty state unconditionally. Lower priority — same class of gap as Materials'/Payments'/Reports' un-swept sub-sections from S2, not reached this session. |
| 2026-08-25 | S5 | `AccountantDashboard.tsx` | **Real gap, fixed.** This tab-switched dashboard (9 tabs, all already-fixed S2 pages) had a `<Suspense>` around the tab content but no `<ErrorBoundary>` — the exact gap `BeereDashboard.tsx` had closed in S0. Added the same `variant="inline" resetKeys={[active]}` wrapping. Worth checking any other multi-tab shell (portal home pages especially) for the same missing piece before assuming S0's fix propagated everywhere. |
| 2026-08-25 | S5 | Accidental full-file reformat, caught and reverted | Ran `prettier --write` on `AccountantDashboard.tsx` to clean up one manually-edited block's indentation; prettier reformatted the entire 450-line file instead (699-line diff) and broke several `// eslint-disable-next-line` pragmas by moving them out of adjacency with the specific import lines they were suppressing — surfaced as +18 new lint warnings. Caught immediately by the lint diff, reverted with `git checkout --`, and redid only the intended 3-line change by hand. Lesson for future sessions: don't run prettier on a file with single-line eslint-disable pragmas above multi-line statements — verify the diff size before trusting a formatter run, especially on a file this session didn't author from scratch. |
| 2026-08-25 | S5 | `ShopHome.tsx`/`HomeSection.tsx` (desktop) stat tiles | **Found, not fixed.** Same `"Error"`-with-no-retry stat-tile pattern as `SAOverviewPage.tsx` (S2) and `WorkerHome.tsx` (S3) — a third occurrence of the same underlying gap. Worth promoting from "log per-screen" to a single design-system ticket against whatever shared stat-tile component each of these three uses, rather than re-discovering it a fourth time in S6. |
| 2026-08-25 | S5 | `NewSaleFlow.tsx` — customer-search and saree-browse sub-lists | **Found, not fixed.** Both back a `<Select>`/browse-list off an un-gated `useQuery`, same shape as the `ReceiveSareesPage.tsx`/`WorkerIssueMaterialPage.tsx` dropdown gap logged in S3 — low risk, a transiently-empty picker during the ~1s a roster fetch takes, not a data-loss risk. Three occurrences of this same shape now (S3 ×2, S5 ×1) — also worth a single fix (e.g. a shared "loading-aware Select" wrapper) rather than three ad-hoc closes. |
| 2026-08-25 | S6 | `notifications.gateway.ts` | **Real security gap, found and fixed — goes beyond Phase S's normal scope, logged here because the S6 ledger item explicitly asked to check it.** The socket gateway's `"subscribe"` handler trusted a client-supplied `{ userId, role }` payload to decide which rooms to join — any authenticated socket could subscribe to `user:<anyone>` or `role:<any-role>` and receive that person's or role's live notifications, bypassing the scoping `NotificationsService` already enforces for the REST endpoints (S0.1). Fixed by verifying the socket's JWT on `handleConnection` (added `JwtModule` to `NotificationsModule`) and deriving room membership server-side from the verified payload, exactly mirroring `NotificationsService.scopeFor`'s admin-bypass logic. The `"subscribe"` event is kept as a no-op so old clients that still emit it don't error. Frontend's `connectNotificationsSocket` now sends the stored JWT via the socket.io `auth` option instead of a client-declared userId/role.

**Verified live (2026-08-25), all 4 cases pass:** ran both servers, logged in as the seeded `ADMIN` (8888888888) via the real UI, then drove `socket.io-client` directly from the page console against the running backend on :3000. (1) A socket authenticated with the logged-in admin's real JWT connects and receives `connected`. (2) A socket with a garbage token gets `auth_error: "Authentication required."` immediately followed by a server-initiated `disconnect` — confirmed via a second network call for a real `WORKER` JWT (`1234567890`) that this isn't a fluke of malformed input specifically. (3) **The security property that actually matters**: with the worker socket connected and listening, an admin-authenticated REST call (`POST /notifications`, `targetType: ROLE, role: ADMIN`) was made — the worker socket received *nothing*. (4) The same call repeated with the admin's own socket listening: it received the notification instantly. This is the exact cross-role leak the fix targets, confirmed closed both ways (blocked for the wrong role, still working for the right one). **Not covered by this pass**: the reconnect-after-token-refresh path specifically (killing an active connection mid-session, refreshing the token, confirming the auto-reconnect carries the new token) — the 4 cases above test fresh connections only, not the reconnect handshake. Worth a follow-up if long-lived sessions become a concern. |

### Found-not-fixed cleanup pass (2026-08-25)

Went back through every item this document had logged as "found, not fixed" and
closed the ones that were safe to close without touching a loaded-state
visual. Format matches the rows above; **resolved** items are marked as such
so a future session doesn't re-discover them as still-open.

| Date | Phase | File / area | Note |
|---|---|---|---|
| 2026-08-25 | cleanup | 15 legacy contexts — final audit | The two contexts never explicitly checked (`RatesContext.tsx`, `FinishingStaffContext.tsx`) are now accounted for: `RatesContext` was already fully compliant (`isLoading`/`isError`/`refreshRates`, just named differently — no change made). `FinishingStaffContext` had the same missing-`isLoading`/`isError`/`refetch` gap as the other 13 — fixed. **All 15 of the app's legacy contexts are now audited; 14 fixed, 1 already correct.** |
| 2026-08-25 | cleanup | `SAOverviewPage.tsx`, `WorkerHome.tsx`/`WorkerHomeDesktop.tsx`, `ShopHome.tsx`/`HomeSection.tsx` (desktop) — stat-tile `"Error"` gap | **Resolved, all 3 occurrences, with one shared mechanism instead of three ad-hoc ones.** Added an optional `onClick` to `PortalChrome.WorkerStat` (threaded through `StatsStrip`'s mapping into the `StatItem` it already supported) — a failing tile becomes clickable, its `sub` text changes to "Tap to retry", and the click calls the query's `refetch`. Zero visual change to the loaded state: the field is optional and only adds a pointer cursor/hover once a handler is actually passed. `useDashboardMetrics`/`useDashboardAnalytics` (shared by `SAOverviewPage`/`BeereDashboard`) gained combined `refetch` functions across their 4–7 sub-queries each, since neither exposed one before. |
| 2026-08-25 | cleanup | `worker/weavers/ReceiveSareesPage.tsx`, `worker/weavers/WorkerIssueMaterialPage.tsx`, `shop-staff/NewSaleFlow.tsx` (customer-search + saree-browse) — loading-unaware pickers | **Resolved, all 5 dropdown/list instances.** `ReceiveSareesPage`'s weaver `<Select>` now disables + shows a "Loading weavers…" placeholder while its roster query is in flight. `WorkerIssueMaterialPage`'s custom weaver-search dropdown and `NewSaleFlow`'s customer-search dropdown (via `CustomerSelectStep`) and saree-browse list (via `ScanSareeStep`) all gained a `*Loading` prop threaded from the parent's `useQuery` and a "Loading…" row in the dropdown panel instead of silently showing zero results. |
| 2026-08-25 | cleanup | `PaymentLedgerPage.tsx` (mobile + desktop `PaymentsSection.tsx`) — `chargesByType`/`failedSarees` (`defectiveRecords` on desktop) sub-lists | **Resolved.** Both sub-lists derive from `useQc()`, already loading-aware since S3 — just needed to consume it. Added `LoadingState`/`ErrorState` gates ahead of the existing empty-state branch, on both the mobile page and its desktop `PaymentsSection.tsx` mirror. |
| 2026-08-25 | cleanup | `MaterialsPage.tsx` → `PurchaseHistorySection.tsx`, `MovementHistorySection.tsx` | **Resolved — the highest-priority item left, per the S2-batch-3 note that flagged it.** `PurchaseHistorySection`'s 4 `useQuery`s (GRNs, POs, vendors, vendor payments) now combine into one `loading`/`error`/`onRetry` wired to its `<DataTable>`. `MovementHistorySection` renders as a timeline, not a `DataTable` — added the same combined-query loading/error gate ahead of its existing empty-state branch. |
| 2026-08-25 | cleanup | Payments' 6 sub-sections — full audit | **Resolved.** `FinancialSummarySection`, `WeaverMakingChargesSection`, `WholesaleCollectionsSection` were already fully compliant (loading/error/retry all wired) — no change needed. `VendorPaymentsSection` and `SupplierPaymentsSection` had a `<DataTable>` with no loading/error at all — fixed (the latter via `useSuppliers()`, already loading-aware since S2). `PaymentAnalyticsSection` had 3 states: its cash-flow chart was already fine, but the weaver-distribution chart and the invoice-compliance pie chart had zero loading/error tracking across 5 underlying queries — fixed both. |
| 2026-08-25 | cleanup | Reports' remaining sections — full audit | **Resolved.** `OutstandingPaymentsReport`, `SareeProductionReport`, `ScheduledReportsSection`, `DownloadHistorySection` were already fully compliant. `CustomerReport`, `RawMaterialReport`, `RetailSalesReport` all had `loading`/`error` on their `<DataTable>` but no `onRetry` — added retry wired to combined refetch across each report's 2–4 underlying queries. `LiveSummarySnapshot` (the 5-tile live-figures strip embedded above the tab content) showed an honest "—" during both loading and permanent failure, indistinguishable from each other and with no way to recover — added a compact "retry" line that appears only when a query has actually failed. **Every file under `features/reports/components/sections/` and `features/payments/components/**` is now audited — this closes the two largest groups of the original 62-file `<DataTable` sweep still open after S2–S6.** |
| 2026-08-25 | cleanup | Sweep script re-run — found unreliable | Re-ran the naive `<DataTable` + "loading in next 800 chars" grep to get an honest remaining count: it reported 53, but that number is **not trustworthy** — spot-checked `FactoryLoomPage.tsx` (fixed earlier this session) and it's a false positive: the loading/error gate happens *upstream* of the `<DataTable>` call (the table only renders once already excluded), so the prop is correctly absent, not missing. At least 10 of the 53 are the same false-positive shape (`RateHistorySection`, `MakingChargesSection`, `WholesaleTermsSection`, `FirmsPage`, `WeaverTableAndDirectory`, desktop `PaymentsSection`, `OverdueAlertsReport`, `WholesaleSalesReport`, `WeaverPaymentReport` are all confirmed-fixed files that reappeared in this list). **Do not treat 53 as a real number** — each file needs a human look (does the table have its own `loading`, or is it gated by a parent branch?) before it can be called a gap. A better sweep would check whether the component *containing* the `<DataTable>` ever conditions on an `isLoading`/`isError` from a query in the same file, not just whether `loading=` appears near the JSX. `frontend/scripts/ratchet.mjs` remains the right place to build that properly (flagged since S0) rather than a one-off script each session. |

---

## §11 — Related documents

- `design-system/00-ROADMAP.md` — the 8-phase design-system effort this extends
- `design-system/04-DATA-DISPLAY.md` — Part F, the 5 mandatory table states this builds on
- `design-system/08-GOVERNANCE.md` — enforcement conventions (ESLint countdown pattern) this follows
- `design-system/09-RESPONSIVE.md` — the sibling rollout this document's structure mirrors
- `shared/ui/state/errorMessages.ts` — the only file allowed to contain error copy
