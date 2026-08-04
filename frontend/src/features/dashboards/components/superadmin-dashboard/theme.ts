import type React from "react";

import { brand, fonts, semantic } from '@/design-system/tokens';
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS (mirroring BeereDashboard)
// ═══════════════════════════════════════════════════════════════════════════════
export const T = {
  silkCream: semantic.surface.canvas,
  warmIvory: semantic.surface.raised,
  royalBurgundy: brand.burgundy[900],
  darkBurgundy: "#3D0E1A",
  deepWine: brand.burgundy[950],
  antiqueGold: brand.gold[500],
  goldLight: "#E7C983",
  luxuryBrown: "#3B2314",
  ivoryCream: "#F7F2EA",
  pureWhite: "#FFFDF9",
  crimson: semantic.text.danger,
  mahogany: "#4A061B",
  gold: "#C89B47",
  deepBlack: "#3B2314",
  burgundy: "#3D2030",
  taupe: semantic.text.tertiary,
  warmCream: "#F5E8D0",
  green: semantic.text.success,
  borderDef: "rgba(110,15,45,0.10)",
  borderMed: "rgba(110,15,45,0.20)",
  borderGold: "rgba(200,155,71,0.22)",
  bgSuccess: "rgba(30,102,64,0.10)",
  bgWarning: "rgba(110,15,45,0.10)",
  bgAlert: "rgba(110,15,45,0.18)",
  bgGold: "rgba(200,155,71,0.15)",
  saGold: "#C4923A",
};

export const F = {
  display: fonts.display,
  ui: fonts.ui,
  mono: fonts.code,
};

export const NUM: React.CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
};

export const G = {
  hero: "linear-gradient(135deg, #4A061B 0%, #6E0F2D 45%, #C89B47 100%)",
  card: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
  gold: "linear-gradient(135deg, #C89B47 0%, #E7C983 100%)",
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
  saGold: "linear-gradient(135deg, #C4923A 0%, #E8A84A 100%)",
};

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const DARK_MAROON = "#3D1020";
