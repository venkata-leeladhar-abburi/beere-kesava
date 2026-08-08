// Mirrors backend/src/common/weight-units.util.ts — keep both in sync.
// Jari is always displayed in Reels/Buns, never KG/G, regardless of which
// unit it was originally recorded in (a GRN or stock row might store it as
// KG). 1 Reel = 230g, 1 Bun = 4 Reels = 920g.
const GRAMS_PER_REEL = 230;
const REELS_PER_BUN = 4;

export function toGrams(quantity: number, unit: string): number {
  switch (unit.trim().toUpperCase()) {
    case "G":
    case "GRAM":
    case "GRAMS":
      return quantity;
    case "KG":
      return quantity * 1000;
    case "REEL":
    case "REELS":
      return quantity * GRAMS_PER_REEL;
    case "BUN":
    case "BUNS":
      return quantity * REELS_PER_BUN * GRAMS_PER_REEL;
    default:
      return quantity;
  }
}

export function gramsToReels(grams: number): number {
  return grams / GRAMS_PER_REEL;
}

/** Converts a Jari quantity (in its own recorded unit) to a whole-reels count for display. */
export function jariToReels(quantity: number, unit: string): number {
  return Math.round(gramsToReels(toGrams(quantity, unit)));
}

/** "3 Buns 2 Reels" style label from a whole-reels count. */
export function formatBunsReels(reels: number): string {
  const buns = Math.floor(reels / REELS_PER_BUN);
  const rem = reels % REELS_PER_BUN;
  return rem > 0 ? `${buns} Bun${buns !== 1 ? "s" : ""} ${rem} Reel${rem !== 1 ? "s" : ""}` : `${buns} Bun${buns !== 1 ? "s" : ""}`;
}
