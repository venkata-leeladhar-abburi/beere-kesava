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

export const VENDORS: Vendor[] = [
  { id: "VEN-014", name: "Sri Venkateswara Textiles", city: "Ongole, AP",       type: "Warp", phone: "+91 94440 12345", terms: "Net 30", gstCode: "37AAACS1234F1Z1", address: "12, Trunk Road, Ongole, Andhra Pradesh - 523001", contactName: "Ravi Kumar" },
  { id: "VEN-022", name: "Lakshmi Thread House",      city: "Chennai, TN",      type: "Warp / Resham", phone: "+91 98888 22222", terms: "Net 15", gstCode: "33AABCL4444G1Z2", address: "82, Pondy Bazaar, T. Nagar, Chennai, Tamil Nadu - 600017", contactName: "Suresh Babu" },
  { id: "VEN-005", name: "Kanchipuram Silks",         city: "Kanchipuram, TN",  type: "Resham", phone: "+91 99999 55555", terms: "Net 45", gstCode: "33BBBBK5555H1Z3", address: "15, Gandhi Road, Kanchipuram, Tamil Nadu - 631501", contactName: "Murugan R." },
  { id: "VEN-041", name: "Mysore Silk Co.",           city: "Mysore, KA",       type: "Resham / Warp", phone: "+91 91111 33333", terms: "Net 30", gstCode: "29CCCCM3333I1Z4", address: "44, MG Road, Mysore, Karnataka - 570001", contactName: "Anand Prakash" },
  { id: "VEN-009", name: "Surat Zari Works",          city: "Surat, GJ",        type: "Jari", phone: "+91 93333 77777", terms: "Net 60", gstCode: "24DDDDZ7777J1Z5", address: "102, Ring Road, Surat, Gujarat - 395002", contactName: "Hardik Shah" },
  { id: "VEN-019", name: "Varanasi Zari House",       city: "Varanasi, UP",     type: "Jari", phone: "+91 95555 99999", terms: "Advance", gstCode: "09EEEEV9999K1Z6", address: "55, Dashashwamedh Ghat Road, Varanasi, UP - 221001", contactName: "Rakesh Tiwari" },
];

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
