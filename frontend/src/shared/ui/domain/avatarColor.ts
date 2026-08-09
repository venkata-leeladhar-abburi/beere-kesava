/**
 * Deterministic avatar fallback palette — design-system/06-DOMAIN.md Part G.3.
 * Replaces the arbitrary hand-picked set (`#9B6B8A`, `#5A3E6B`, `#2D6B6B`,
 * `#4A6B4A`) with 8 colours drawn from the Phase 1 ramps at the -800 step,
 * all ≥7:1 against white initials. `teal-800` and `violet-800` aren't full
 * Phase 1 ramp tokens (only single chart accents exist — `--chart-5`/`-7`,
 * different values), so those two are the spec's literal hex below; the
 * other six already have ramp tokens.
 */
export const AVATAR_COLORS = [
  "var(--bk-burgundy-800)", // #872D44
  "#045588", // blue-800
  "#015E5E", // teal-800   — no ramp token yet
  "#5F4080", // violet-800 — no ramp token yet
  "var(--bk-green-800)", // #15603D
  "var(--bk-amber-800)", // #724701
  "var(--bk-red-800)", // #8C2B26
  "var(--bk-neutral-800)", // #322D28
] as const;

export function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  return Math.abs(hash);
}

/** Deterministic colour for a given name — the same name always resolves to
 *  the same colour, spread evenly across the 8-colour set. */
export function avatarColorFor(name: string): string {
  return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
}
