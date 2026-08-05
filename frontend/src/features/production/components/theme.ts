import { brand, fonts, semantic } from '@/design-system/tokens';
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
  blueGray:      "#4A6B8A",
  darkFinish:    "#2C1810",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};

export const F = {
  display: fonts.display,
  ui:      fonts.ui,
  mono:    fonts.code,
};

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const G = {
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  card:   "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
};
