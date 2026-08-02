import { createContext } from "react";
import type { CSSProperties } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
export const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  crimson:       "#C0392B",
  green:         "#1E6640",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};

export const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const G_GOLD = "linear-gradient(135deg,#C89B47,#E7C983)";
export const G_CARD = "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)";
export const NUM: CSSProperties = { fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum" 1, "lnum" 1' };

/** Shared isMobile/px so every extracted section can read layout without prop drilling. */
export const MobileCtx = createContext({ isMobile: false, px: 56 });
