import { createContext } from "react";
import type { CSSProperties } from "react";

import { brand, fonts, semantic } from '@/design-system/tokens';
// ─── Design tokens ────────────────────────────────────────────────────────────
export const T = {
  silkCream:     semantic.surface.canvas,
  warmIvory:     semantic.surface.raised,
  royalBurgundy: brand.burgundy[900],
  deepWine:      brand.burgundy[950],
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   brand.gold[500],
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         semantic.text.tertiary,
  crimson:       semantic.text.danger,
  green:         semantic.text.success,
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};

export const F = {
  display: fonts.display,
  ui:      fonts.ui,
  mono:    fonts.code,
};

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const G_GOLD = "linear-gradient(135deg,#C89B47,#E7C983)";
export const G_CARD = "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)";
export const NUM: CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1, "lnum" 1' };

/** Shared isMobile/px so every extracted section can read layout without prop drilling. */
export const MobileCtx = createContext({ isMobile: false, px: 56 });
