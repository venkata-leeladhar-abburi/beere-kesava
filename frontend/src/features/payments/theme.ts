import { brand, fonts, semantic } from "@/design-system/tokens";
import { imgBKLogo, imgSareeFooter } from "../../shared/constants/weaverImages";

// NOTE: Do not add cross-feature or hook re-exports here (e.g.
// @/features/bulk-orders, @/features/firms, shared/ui/DateFilterBar).
// This module is imported at module-evaluation time by primitives whose
// top-level constants depend on T/F; re-exporting hooks from here creates
// circular imports (theme -> bulk-orders -> payments -> theme) and crashes
// with "Cannot access 'T' before initialization". Import those directly.

// ── Design Tokens ─────────────────────────────────────────────────────────────
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
  green:         semantic.text.success,
  greenBg:       "rgba(30,102,64,0.09)",
  greenMid:      "#2D9158",
  crimson:       semantic.text.danger,
  crimsonBg:     "rgba(192,57,43,0.08)",
  orange:        "#E67E22",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};

export const F = {
  display: fonts.display,
  ui:      fonts.ui,
  mono:    fonts.code,
};

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export { imgBKLogo, imgSareeFooter };
