## What changed

<!-- One or two sentences. Link the design-system doc(s) this touches if any: design-system/0N-*.md -->

## Why

<!-- The problem this solves, or the phase/step it advances. -->

## Design-system checklist

- [ ] `cd frontend && npm run ratchet` run — no unexplained regressions in touched metrics
- [ ] `npm run check:contrast` and `npm run check:tokens` pass (if touching colors/tokens)
- [ ] New primitives/patterns use existing `shared/ui/**` components (`DataTable`, `Modal`, `DropdownMenu`, `Button`, etc.) rather than one-off markup
- [ ] No new raw `<table>`, `<button>`, `<input>`, `<select>`, or hand-rolled modal — see `design-system/03-PRIMITIVES.md` / `04-DATA-DISPLAY.md` / `05-OVERLAYS.md`
- [ ] Verified in the browser (not just typecheck/build) if the change is visually observable

## Test plan

<!-- How you verified this: tsc/build/lint output, screenshots, manual steps. -->
