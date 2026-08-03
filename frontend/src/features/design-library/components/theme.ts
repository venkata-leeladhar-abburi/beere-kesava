import React from "react";
// ─── Design Library feature — shared design tokens ────────────────────────────


export const T = {
  silkCream:    "#F7F2EA",
  warmIvory:    "#FFFDF9",
  royalBurgundy:"#6E0F2D",
  deepWine:     "#4A061B",
  darkBurgundy: "#3D0E1A",
  antiqueGold:  "#C89B47",
  goldLight:    "#E7C983",
  luxuryBrown:  "#3B2314",
  warmCream:    "#F5E8D0",
  taupe:        "#8B7060",
  green:        "#1E6640",
  borderDef:    "rgba(110,15,45,0.10)",
  borderGold:   "rgba(200,155,71,0.22)",
};

export const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

export const G = {
  button: "linear-gradient(135deg, #6E0F2D 0%, #4A061B 100%)",
};

export const fieldStyle: React.CSSProperties = {
  width: "100%", height: 44, padding: "0 14px",
  fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown,
  background: T.warmIvory, border: `1.5px solid ${T.borderDef}`,
  borderRadius: 10, outline: "none", boxSizing: "border-box",
};

export const labelStyle: React.CSSProperties = {
  fontFamily: F.ui, fontSize: 12, fontWeight: 700,
  color: T.luxuryBrown, display: "block", marginBottom: 6,
};

export const DESIGN_FILTERS = ["All Designs", "Currently in Production", "Completed Designs", "Has Design Graph", "No Graph Uploaded"];
export const SAREE_TYPES = [
  { code: "HZ-003", name: "Heavy Zari" },
  { code: "SB-001", name: "Self Brocade" },
  { code: "PS-002", name: "Plain Silk" },
  { code: "BS-004", name: "Bridal Special" },
  { code: "LC-005", name: "Light Cotton" },
];

export const WEAVERS_LIST = [
  { id: "WV-002", name: "Padma Veni", initials: "PV", looms: 3 },
  { id: "WV-001", name: "Ravi Kumar", initials: "RK", looms: 5 },
  { id: "WV-007", name: "Suresh Murti", initials: "SM", looms: 2 },
];
