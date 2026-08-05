import { POItem } from "../contexts/POContext";

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
  taupe:         "#69635E",
  crimson:       "#C0392B",
  green:         "#1E6640",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};

export const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

export interface Vendor {
  id: string;
  name: string;
  city: string;
  type: string;
  phone: string;
  terms: string;
  gstCode: string;
  address: string;
  contactName: string;
}

// Real vendors are now fetched from GET /vendors (see shared/api/vendors.ts)
// and passed into POCreateModal/POVendorDetailsSection as props.

export type ExtItem = POItem & { _key: number; quantityGm: number };

export function emptyItem(): ExtItem {
  return {
    _key: Date.now() + Math.random(),
    materialType: "Warp",
    subtype: "",
    description: "",
    quantity: 0,
    quantityGm: 0,
    unit: "kg",
    pricePerUnit: 0,
    subtotal: 0,
  };
}
