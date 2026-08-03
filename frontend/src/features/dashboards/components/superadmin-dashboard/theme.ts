import type React from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS (mirroring BeereDashboard)
// ═══════════════════════════════════════════════════════════════════════════════
export const T = {
  silkCream: "#F7F2EA",
  warmIvory: "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  darkBurgundy: "#3D0E1A",
  deepWine: "#4A061B",
  antiqueGold: "#C89B47",
  goldLight: "#E7C983",
  luxuryBrown: "#3B2314",
  ivoryCream: "#F7F2EA",
  pureWhite: "#FFFDF9",
  crimson: "#C0392B",
  mahogany: "#4A061B",
  gold: "#C89B47",
  deepBlack: "#3B2314",
  burgundy: "#3D2030",
  taupe: "#8B7060",
  warmCream: "#F5E8D0",
  green: "#1E6640",
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
  display: "'Plus Jakarta Sans', sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
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
