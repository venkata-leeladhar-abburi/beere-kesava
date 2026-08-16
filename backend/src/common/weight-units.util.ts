/**
 * Weight-unit conversion for raw material quantities (Warp/Resham tracked in
 * KG or G; Jari additionally displayed in Reels/Buns per the architecture
 * doc's convention: 1 Reel = 230g, 1 Reel = 4 Buns = 57.5g each). Stock rows
 * and material-issue line items can each be entered in a different unit, so
 * any arithmetic across the two (e.g. deducting an issue from stock) must go
 * through grams first — never subtract raw quantities of mismatched units.
 */
const GRAMS_PER_REEL = 230;
const BUNS_PER_REEL = 4;

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
      return quantity * (GRAMS_PER_REEL / BUNS_PER_REEL);
    default:
      // Unrecognized unit — assume it's already grams rather than silently
      // mis-converting; callers should use one of the units above.
      return quantity;
  }
}

export function fromGrams(grams: number, unit: string): number {
  switch (unit.trim().toUpperCase()) {
    case "G":
    case "GRAM":
    case "GRAMS":
      return grams;
    case "KG":
      return grams / 1000;
    case "REEL":
    case "REELS":
      return grams / GRAMS_PER_REEL;
    case "BUN":
    case "BUNS":
      return grams / (GRAMS_PER_REEL / BUNS_PER_REEL);
    default:
      return grams;
  }
}
