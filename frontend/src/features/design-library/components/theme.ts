import React from "react";
import { brand, fonts, semantic } from '@/design-system/tokens';
// ─── Design Library feature — shared design tokens ────────────────────────────


export const T = {
  silkCream:    semantic.surface.canvas,
  warmIvory:    semantic.surface.raised,
  royalBurgundy:brand.burgundy[900],
  deepWine:     brand.burgundy[950],
  darkBurgundy: "#3D0E1A",
  antiqueGold:  brand.gold[500],
  goldLight:    "#E7C983",
  luxuryBrown:  "#3B2314",
  warmCream:    "#F5E8D0",
  taupe:        semantic.text.tertiary,
  green:        semantic.text.success,
  borderDef:    "rgba(110,15,45,0.10)",
  borderGold:   "rgba(200,155,71,0.22)",
};

export const F = {
  display: fonts.display,
  ui:      fonts.ui,
  mono:    fonts.code,
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
  { id: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", name: "Padma Veni", initials: "PV", looms: 3 },
  { id: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", name: "Ravi Kumar", initials: "RK", looms: 5 },
  { id: "11278a51-a26d-4eaa-adbf-bedbfa7fdf46", name: "Suresh Murti", initials: "SM", looms: 2 },
];
