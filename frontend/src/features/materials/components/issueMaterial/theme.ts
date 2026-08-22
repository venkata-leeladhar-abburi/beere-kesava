import { brand, fonts, semantic } from '@/design-system/tokens';
// ── Design Tokens (matches MaterialsPage.tsx / WeaversPage.tsx) ─────────────
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
  crimson:       semantic.text.danger,
  green:         semantic.text.success,
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
};
export const F = {
  display: fonts.display,
  ui:      fonts.ui,
  mono:    fonts.code,
};
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Local weaver directory (mirrors WeaversPage.tsx) ─────────────────────────
export interface WeaverLite {
  /** Weaver.id (UUID) — the FK used when issuing, never shown to staff. */
  id: string;
  /** Human-facing weaver ID (e.g. "Swarna-003") — this is what the UI displays. */
  code: string;
  name: string; village: string; initials: string; bg: string; status: "active" | "qc" | "idle"; looms: number; phone: string;
}
export const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active",   color: T.green,   bg: "rgba(30,102,64,0.10)" },
  qc:     { label: "In QC",    color: T.antiqueGold, bg: "rgba(200,155,71,0.14)" },
  idle:   { label: "Idle",     color: T.taupe,    bg: "rgba(139,112,96,0.10)" },
};

// ── GRN directory, shaped as the receipt hierarchy the UI actually needs ─────
// One GrnReceipt (e.g. "GRN-SreeVignesh-004-002") carries several material
// lines, each with its own structured code ("…-002-1", "…-002-2"). Material is
// issued from one specific line, so the selector picks a line, not a receipt.

/** One material line within a GRN receipt. */
export interface GrnLine {
  /** GrnItem.id (UUID) — what the backend deducts against. */
  id: string;
  /** Structured per-line code shown to staff and printed on the batch label (e.g. "GRN-SreeVignesh-004-002-1"). */
  itemCode: string;
  materialType: "Warp" | "Resham" | "Jari";
  /** Short material name from the receipt (e.g. "Cotton/Silk"). */
  name: string;
  /** Colour/grade/quality notes carried over from the purchase order. */
  description: string;
  /** Quantity that originally entered stock (received minus rejected). */
  receivedQty: number;
  /** Already issued out of this line. */
  issuedQty: number;
  /** Still on hand for this line. */
  availableQty: number;
  unit: string;
}

/** A GRN receipt and every material line on it. */
export interface GrnBatch {
  grnBatchId: string;
  vendor: string;
  dateReceived: string;
  /** Purchase order this GRN was received against, if any — null for ad-hoc "Add New Stock" receipts. */
  poNumber: string | null;
  firmName: string | null;
  lines: GrnLine[];
}
export const INITIAL_GRN_BATCHES: GrnBatch[] = [];

export const RESHAM_COLORS = [
  { name: "Gold",         hex: "#C4923A" },
  { name: "Silver/White", hex: "#D8D2C4" },
  { name: "Red",          hex: "#B22222" },
  { name: "Maroon",       hex: "#6E0F2D" },
  { name: "Green",        hex: "#1E6640" },
  { name: "Blue",         hex: "#1565C0" },
];
export const JARI_COLORS = [
  { name: "Gold",   hex: "#C4923A" },
  { name: "Silver", hex: "#9E9E9E" },
  { name: "Copper", hex: "#B87333" },
  { name: "Pink",   hex: "#E91E8C" },
  { name: "Blue",   hex: "#1565C0" },
  { name: "Green",  hex: "#1E6640" },
];

export interface MaterialRowState {
  uid: string;
  materialType: "Warp" | "Resham" | "Jari";
  warpSubtype: "Resham Warp" | "Jari Warp";
  description: string;
  quantity: string;
  quantityGm: string;
  jariType: "Polyester" | "Silk Fast";
  jariGrade: "1G" | "2G" | "3G" | "4G" | "5G";
  jariColor: string;
  jariUnit: "Reels" | "Buns";
  warpReshamUnit: "kg" | "g";
  /** The GRN receipt the selected line belongs to. */
  grnBatchId: string;
  /** GrnItem.id of the specific line being issued from — "" until one is picked. */
  grnItemId: string;
}

export function emptyRow(): MaterialRowState {
  return {
    uid: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    materialType: "Warp",
    warpSubtype: "Resham Warp",
    description: "",
    quantity: "",
    quantityGm: "",
    jariType: "Polyester",
    jariGrade: "2G",
    jariColor: "Gold",
    jariUnit: "Reels",
    warpReshamUnit: "kg",
    grnBatchId: "",
    grnItemId: "",
  };
}
