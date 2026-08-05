

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

export const imgHeaderBg = "https://images.unsplash.com/photo-1588140686379-1b76a52103dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
import { imgBKLogo, imgSareeFooter } from "../../shared/constants/weaverImages";
export { imgBKLogo, imgSareeFooter };
import { useBulkOrders } from "../bulk-orders/contexts/BulkOrderContext";
import { BulkOrder } from "../production/components/ProductionPage";
export { useBulkOrders };
export type { BulkOrder };
import { useFirms } from "../firms/contexts/FirmsContext";
export { useFirms };
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../shared/ui/DateFilterBar";
import { brand, fonts, semantic } from '@/design-system/tokens';
export { DateFilterBar, DEFAULT_DATE_FILTER, matchesDateFilter };
export type { DateFilterState };
