// ═══════════════════════════════════════════════════════════════════════════
// JARI UNITS — stored canonically as reels; 1 reel = 4 buns = 230 grams
// ═══════════════════════════════════════════════════════════════════════════
export const JARI_BUNS_PER_REEL = 4;
export const JARI_GRAMS_PER_REEL = 230;
export type JariUnit = "reels" | "buns";

export function jariToReels(value: number, unit: JariUnit): number {
  return unit === "reels" ? value : value / JARI_BUNS_PER_REEL;
}
export function jariFromReels(reels: number, unit: JariUnit): number {
  return unit === "reels" ? reels : reels * JARI_BUNS_PER_REEL;
}
export function jariGrams(reels: number): number {
  return reels * JARI_GRAMS_PER_REEL;
}
/** Trim trailing zeros so 8.50 → "8.5" and 16.00 → "16". */
export function trimNum(n: number, dp = 2): string {
  return parseFloat(n.toFixed(dp)).toString();
}
