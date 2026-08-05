import React from "react";
import { motion } from "motion/react";

import { brand, fonts, semantic } from '@/design-system/tokens';
// ── Design Tokens ───────────────────────────────────────────────────────────
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

export function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay, ease: EASE }} style={style}>
      {children}
    </motion.div>
  );
}
