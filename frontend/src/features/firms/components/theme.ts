// ─── Firms feature — shared design tokens ─────────────────────────────────────
import type { IncomeCategory, ExpenseCategory } from "../contexts/FirmsContext";

import { brand, fonts, semantic } from '@/design-system/tokens';
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
  crimson:       semantic.text.danger,
  crimsonBg:     "rgba(192,57,43,0.08)",
  borderDef:     "rgba(110,15,45,0.10)",
  borderMed:     "rgba(110,15,45,0.20)",
  borderGold:    "rgba(200,155,71,0.22)",
  bgGold:        "rgba(200,155,71,0.08)",
};

export const F = {
  display: fonts.display,
  ui:      fonts.ui,
  mono:    fonts.code,
};

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const INCOME_CATS: IncomeCategory[]   = ["Wholesale Sale", "Retail Sale", "Other"];
export const EXPENSE_CATS: ExpenseCategory[] = ["Weaver Payments", "Material Purchase", "Shop Maintenance", "Factory Maintenance", "Salaries", "Other"];

export const imgFirmsHero = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
