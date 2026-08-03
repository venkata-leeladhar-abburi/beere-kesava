// ─── Firms feature — shared design tokens ─────────────────────────────────────
import type { IncomeCategory, ExpenseCategory } from "../contexts/FirmsContext";

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
  green:         "#1E6640",
  greenBg:       "rgba(30,102,64,0.09)",
  crimson:       "#C0392B",
  crimsonBg:     "rgba(192,57,43,0.08)",
  borderDef:     "rgba(110,15,45,0.10)",
  borderMed:     "rgba(110,15,45,0.20)",
  borderGold:    "rgba(200,155,71,0.22)",
  bgGold:        "rgba(200,155,71,0.08)",
};

export const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const INCOME_CATS: IncomeCategory[]   = ["Wholesale Sale", "Retail Sale", "Other"];
export const EXPENSE_CATS: ExpenseCategory[] = ["Weaver Payments", "Material Purchase", "Shop Maintenance", "Factory Maintenance", "Salaries", "Other"];

export const imgFirmsHero = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
