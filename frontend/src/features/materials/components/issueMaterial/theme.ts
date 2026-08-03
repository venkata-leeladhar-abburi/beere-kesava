// ── Design Tokens (matches MaterialsPage.tsx / WeaversPage.tsx) ─────────────
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
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Local weaver directory (mirrors WeaversPage.tsx) ─────────────────────────
export interface WeaverLite { id: string; name: string; village: string; initials: string; bg: string; status: "active" | "qc" | "idle"; looms: number; phone: string; }
export const WEAVERS: WeaverLite[] = [
  { id: "WV-001", name: "Ravi Kumar",   village: "Dharmavaram, AP",        initials: "RK", bg: "#5A3E6B", status: "active", looms: 3, phone: "98765 43210" },
  { id: "WV-002", name: "Padma Veni",   village: "Pochampally, Telangana", initials: "PV", bg: "#9B6B8A", status: "active", looms: 2, phone: "87654 38834" },
  { id: "WV-007", name: "Suresh Murti", village: "Venkatagiri, AP",        initials: "SM", bg: "#2D6B6B", status: "qc",     looms: 2, phone: "76549 99982" },
  { id: "WV-005", name: "Anand K.",     village: "Pochampally, Telangana", initials: "AK", bg: "#4A6B4A", status: "active", looms: 2, phone: "65438 77723" },
  { id: "WV-012", name: "Meena R.",     village: "Siddipet, Telangana",    initials: "MR", bg: "#9B6B8A", status: "active", looms: 1, phone: "54327 66614" },
  { id: "WV-018", name: "Lakshmi D.",   village: "Dharmavaram, AP",        initials: "LD", bg: "#2D7D6B", status: "qc",     looms: 2, phone: "43216 33341" },
  { id: "WV-024", name: "Venkat Rao",   village: "Venkatagiri, AP",        initials: "VR", bg: "#4A5E7A", status: "idle",   looms: 4, phone: "32105 11122" },
  { id: "WV-031", name: "Kamala B.",    village: "Pochampally, Telangana", initials: "KB", bg: "#7A2040", status: "active", looms: 3, phone: "21098 55589" },
];
export const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active",   color: T.green,   bg: "rgba(30,102,64,0.10)" },
  qc:     { label: "In QC",    color: T.antiqueGold, bg: "rgba(200,155,71,0.14)" },
  idle:   { label: "Idle",     color: T.taupe,    bg: "rgba(139,112,96,0.10)" },
};

// ── Local GRN batch directory (mirrors WorkerGRN.tsx format GRN-YYYY-MMM-###) ─
export interface GrnBatch { grnBatchId: string; vendor: string; dateReceived: string; materialType: "Warp" | "Resham" | "Jari"; availableQty: number; unit: string; }
export const INITIAL_GRN_BATCHES: GrnBatch[] = [
  { grnBatchId: "GRN-2026-JUN-001", vendor: "Sri Venkateswara Textiles", dateReceived: "01 Jun 2026", materialType: "Warp",   availableQty: 48, unit: "kg" },
  { grnBatchId: "GRN-2026-JUN-002", vendor: "Kanchipuram Silks",         dateReceived: "02 Jun 2026", materialType: "Resham", availableQty: 22, unit: "kg" },
  { grnBatchId: "GRN-2026-JUN-003", vendor: "Surat Zari Works",          dateReceived: "03 Jun 2026", materialType: "Jari",   availableQty: 40, unit: "Reels" },
  { grnBatchId: "GRN-2026-MAY-014", vendor: "Surat Zari Works",          dateReceived: "20 May 2026", materialType: "Jari",   availableQty: 12, unit: "Buns" },
  { grnBatchId: "GRN-2026-MAY-011", vendor: "Kanchipuram Silks",         dateReceived: "17 May 2026", materialType: "Resham", availableQty: 14, unit: "kg" },
  { grnBatchId: "GRN-2026-MAY-006", vendor: "Sri Venkateswara Textiles", dateReceived: "12 May 2026", materialType: "Warp",   availableQty: 30, unit: "kg" },
];

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
  grnBatchId: string;
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
  };
}
