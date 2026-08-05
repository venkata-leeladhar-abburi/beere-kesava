import { brand, fonts, semantic } from '@/design-system/tokens';
export const T = {
  silkCream: semantic.surface.canvas, warmIvory: "#FFFDF9", royalBurgundy: "#6E0F2D",
  deepWine: brand.burgundy[950], darkBurgundy: "#3D0E1A", antiqueGold: "#C89B47",
  goldLight: "#E7C983", luxuryBrown: "#3B2314", warmCream: "#F5E8D0",
  taupe: semantic.text.tertiary, green: "#1E6640", greenBg: "rgba(30,102,64,0.09)",
  greenMid: "#2D9158", crimson: "#C0392B", crimsonBg: "rgba(192,57,43,0.08)",
  borderDef: "rgba(110,15,45,0.10)", borderGold: "rgba(200,155,71,0.22)",
};
export const F = {
  display: fonts.display,
  ui: fonts.ui,
  mono: fonts.code,
};
export const EASE = [0.22, 1, 0.36, 1] as const;
export const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
