export const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

export const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#69635E",
  green:         "#1E6640",
  greenBg:       "rgba(30,102,64,0.09)",
  crimson:       "#C0392B",
  crimsonBg:     "rgba(192,57,43,0.08)",
  blue:          "#2C4A8B",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
  cream:         "#F0E8D0",
};

export const ROLE_COLORS: Record<string, { circle: string; badge: string; text: string; initial: string }> = {
  "SUPERADMIN":      { circle: "#C89B47", badge: "rgba(200,155,71,0.15)",  text: "#7A5E1C", initial: "SA" },
  "ADMIN":           { circle: "#6E0F2D", badge: "rgba(110,15,45,0.10)",   text: "#6E0F2D", initial: "AD" },
  "WORKER STAFF":    { circle: "#1E6640", badge: "rgba(30,102,64,0.10)",   text: "#1E6640", initial: "WS" },
  "FINISHING STAFF": { circle: "#2C4A8B", badge: "rgba(44,74,139,0.10)",   text: "#2C4A8B", initial: "FS" },
  "SHOP STAFF":      { circle: "#2C1810", badge: "rgba(44,24,16,0.10)",    text: "#2C1810", initial: "SS" },
};
