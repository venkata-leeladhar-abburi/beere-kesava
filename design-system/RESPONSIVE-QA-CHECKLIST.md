# Responsive QA Checklist — Device Matrix (Phase R8)

> Companion to `design-system/09-RESPONSIVE.md` §7/§8 (R8 — QA, device matrix,
> governance). Linked from that document's §11.
>
> **Status: this is an unexecuted deliverable, not a completed walkthrough.**
> No browser session ran through this checklist this session — see
> `09-RESPONSIVE.md` §7.1 for why (Superadmin login has never succeeded via
> browser automation in this repo, and browser-preview access has been
> blocked/stuck for the entire rollout). This document exists so a future
> session (or a human with a real browser) can execute it in one pass instead
> of re-deriving what to check.

## How to use this

For each portal, load a representative page at each width below (use browser
devtools device toolbar, or `resize_window` if using an automated browser
tool) and walk the six checks. Check a box only after actually looking at the
rendered page — do not check boxes from reading the code.

**Widths:** 320px · 375px · 414px · 768px · 1024px · 1280px
(320/375/414 = phone tier, per §3.1's `mobile <768`; 768/1024 = tablet tier,
`768–1279`; 1280 = desktop, the control group per §0 — it must look identical
to `main` at this width and is included here as the negative-control check,
not because it needs new verification.)

**The six checks, every width, every portal:**

1. **Nav collapses correctly** — the portal's mobile nav (drawer/tab bar/
   bottom nav — see `09-RESPONSIVE.md` §2 "Per-portal mobile islands") appears
   below 768px and the desktop nav appears at 1280px, with no dead zone where
   neither is usable.
2. **No horizontal scroll / overflow** — the page as a whole never scrolls
   sideways (§3.6). Wide content (tables, ledgers) scrolls only inside its own
   container, not the page.
3. **Tables render as cards below 768px** — any `<DataTable responsive>`
   shows a `CardList` (title + 4–6 fields + tappable actions) under `md`, not
   a squeezed table (§3.4, §6).
4. **Modals become bottom sheets** — any `<Modal>` opened at this width is a
   full-width bottom sheet below `md` (§2, `Modal.tsx`), and its internal
   grids are single-column below `md` (§7 R2 recipe) while multi-column at
   `md`+.
5. **Hero + stats pattern doesn't overlap** — on pages with the dark
   hero-header + floating `StatsStrip`/`MetricsBar` pattern, the stats card
   never covers hero text, even if the hero paragraph wraps to extra lines at
   this width (the out-of-band 2026-08-13 fix, `09-RESPONSIVE.md` §9).
6. **Forms are usable** — form fields don't overflow their container, labels
   aren't clipped, and (on any full-page form using it) `MobileFormActionBar`
   is visible and tappable below 768px, hidden at `md`+ (§7 R5).

Touch targets: while on any width ≤414px, spot-check that nav items and row
actions are ≥44×44px (§3.5) — this is the specific open item flagged in
`09-RESPONSIVE.md` §9/§10 for Admin's `MobileNavDrawer.tsx` and Superadmin's
`SAMobileNav.tsx` (`!py-[11px]`, estimated ~42px, unconfirmed).

---

## Admin — `features/dashboards/components/beere-dashboard/`

Representative pages: dashboard home, a table-heavy page (e.g. Customers or
Payments — DataTable-based), a page with a modal (e.g. Users → Edit).

| Width | Nav | No h-scroll | Tables→cards | Modals=sheet | Hero+stats | Forms usable | Touch targets (≤414 only) |
|---|---|---|---|---|---|---|---|
| 320px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 375px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 414px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 768px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |
| 1024px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |
| 1280px (control — must match `main`) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |

## Superadmin — `features/dashboards/components/superadmin-dashboard/`

Representative pages: `SAOverviewPage.tsx` (hero+stats, noted as a known gap —
see below), `SAWeaverSection.tsx`.

**Known blocker:** login (9999999999) has never succeeded via browser
automation (§7.1). If this still blocks the session, log it and move on
per §7.1's instruction — do not burn the session retrying.

**Known pre-flagged gap to specifically re-check:** `SAOverviewPage.tsx`'s
`SAHero()` uses a fixed `width: "50%"` / fixed `padding: "0 56px"` instead of
the standard hero pattern (§9 "Found, not fixed"). Confirm whether this is
still squeezed at 320–414px.

| Width | Nav | No h-scroll | Tables→cards | Modals=sheet | Hero+stats | Forms usable | Touch targets (≤414 only) |
|---|---|---|---|---|---|---|---|
| 320px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 375px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 414px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 768px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |
| 1024px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |
| 1280px (control — must match `main`) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |

## Weaver — `features/portals/components/weaver-portal/`

Representative pages: `MobileWeaverPortal.tsx` home, `PaymentLedgerPage.tsx`
(note: the 6-column ledger table intentionally uses `overflow-x: auto` +
`minWidth: 640` per §9 R3 — confirm that stays *inside* its own container and
doesn't drag the page), a modal (e.g. `NewWeaverModal.tsx`).

| Width | Nav | No h-scroll | Tables→cards | Modals=sheet | Hero+stats | Forms usable | Touch targets (≤414 only) |
|---|---|---|---|---|---|---|---|
| 320px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 375px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 414px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 768px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |
| 1024px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |
| 1280px (control — must match `main`) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |

## Worker — `features/portals/components/worker/`

Representative pages: `WorkerHome.tsx`, `WorkerGRN.tsx` (has per-item cards
flagged for future Phase 4 migration — confirm current state is at least not
broken), `WorkerQCInspectionScreen.tsx`.

**Known real bug, not a layout issue (§9/§10):** the mobile `TABS` badge
counts ("6"/"2") are hardcoded literals, not live data. Not a QA-checklist
item — don't file it as a responsive regression, it's a pre-logged
data-correctness bug.

**Credentials:** per §7.1, Worker credentials were never obtained in this
rollout. Try Admin's "Add New User" page first to find a Worker login before
assuming this portal is unreachable.

| Width | Nav | No h-scroll | Tables→cards | Modals=sheet | Hero+stats | Forms usable | Touch targets (≤414 only) |
|---|---|---|---|---|---|---|---|
| 320px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 375px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 414px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 768px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |
| 1024px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |
| 1280px (control — must match `main`) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |

## Shop staff — `features/portals/components/shop-staff/`

Representative pages: sale flow (`NewSaleFlow.tsx`), a return flow
(`ProcessReturn*.tsx`), `CustomerProfiles.tsx` (has a modal).

**Credentials:** same note as Worker — never obtained this rollout, try
Admin's "Add New User" page first.

| Width | Nav | No h-scroll | Tables→cards | Modals=sheet | Hero+stats | Forms usable | Touch targets (≤414 only) |
|---|---|---|---|---|---|---|---|
| 320px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 375px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 414px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 768px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |
| 1024px | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |
| 1280px (control — must match `main`) | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | n/a |

---

## If a regression is found

Follow §0/§10 of `09-RESPONSIVE.md`: fix only the responsive issue itself
(don't "fix while you're in there"), verify the fix is inert at ≥1280px, and
log the finding in `09-RESPONSIVE.md` §10 with date/phase/file/note even if
you also fix it in the same session.
