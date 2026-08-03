import React from "react";
import { Scissors, Palette, Sparkles, Scale, Ruler, HelpCircle } from "lucide-react";

export const T = {
  bg:       "#FAFAF8",
  card:     "#FFFFFF",
  burg:     "#6E0F2D",
  wine:     "#4A061B",
  gold:     "#C89B47",
  goldL:    "#E7C983",
  brown:    "#3B2314",
  green:    "#1E6640",
  crim:     "#C0392B",
  muted:    "#8B7060",
  bdr:      "rgba(110,15,45,0.10)",
  bdrMed:   "rgba(110,15,45,0.18)",
  cream:    "#F5E8D0",
  inp:      "#FFF8E7",
  bgGold:   "rgba(200,155,71,0.10)",
  bgGreen:  "rgba(30,102,64,0.09)",
  bgCrim:   "rgba(192,57,43,0.08)",
  gradHero: "linear-gradient(135deg, #4A061B 0%, #6E0F2D 55%, #8B1A30 100%)",
  shadow:   "0 2px 12px rgba(74,6,27,0.07)",
  shadowLg: "0 8px 32px rgba(74,6,27,0.12)",
};

export const F = {
  d: "'Plus Jakarta Sans', sans-serif",
  u: "'Inter', sans-serif",
  m: "'JetBrains Mono', monospace",
};

export const baseCard: React.CSSProperties = {
  background: T.card,
  border: `1px solid ${T.bdr}`,
  borderRadius: 12,
  boxShadow: T.shadow,
};

export interface SareeItem {
  id: string;
  batch: string;
  source: "outsourced" | "own" | string;
  weaver: string;
  wcode: string;
  design: string;
  weight: number;
  std: number;
  submitted: string;
  bulkOrderLabel?: string;
  bulkOrderRef?: string;
  sareeTypeCode?: string;
  loomNumber?: number | null;
}

export type InspectionResult = "defective" | "semi_approved" | null;

export interface DefectiveLogItem {
  id: string;
  weaver: string;
  defects: string[];
  date: string;
  deduction: string;
}

export const QUEUE: SareeItem[] = [
  { id: "PADMA-L1-004", batch: "BATCH-086", source: "outsourced", weaver: "Padma Veni",   wcode: "WV-002", design: "BKB-045 · Self Brocade",     weight: 842,  std: 850, submitted: "2 hrs ago" },
  { id: "RAVI-L2-008",  batch: "BATCH-089", source: "outsourced", weaver: "Ravi Kumar",   wcode: "WV-001", design: "BKB-031 · Heavy Zari",       weight: 918,  std: 900, submitted: "4 hrs ago" },
  { id: "BKB-L3-002",   batch: "BATCH-OWN", source: "own",        weaver: "Loom 3",       wcode: "",       design: "BKB-022 · Kanjivaram",       weight: 774,  std: 800, submitted: "Yesterday" },
  { id: "SURESH-L2-003",batch: "BATCH-081", source: "outsourced", weaver: "Suresh Murti", wcode: "WV-007", design: "BKB-038 · Gadwal Cotton",    weight: 856,  std: 850, submitted: "Yesterday" },
  { id: "PADMA-L1-005", batch: "BATCH-086", source: "outsourced", weaver: "Padma Veni",   wcode: "WV-002", design: "BKB-045 · Self Brocade",     weight: 848,  std: 850, submitted: "Yesterday" },
  { id: "BKB-L1-004",   batch: "BATCH-OWN", source: "own",        weaver: "Loom 1",       wcode: "",       design: "BKB-019 · Mysore Crepe",     weight: 1048, std: 1000, submitted: "2 days ago" },
];

export const DEFECTIVE_LOG: DefectiveLogItem[] = [
  { id: "RAVI-L2-005",  weaver: "Ravi Kumar",  defects: ["Thread Break", "Design Error"], date: "12 Jun", deduction: "₹450" },
  { id: "BKB-L2-001",   weaver: "Loom 2",       defects: ["Weight Problem"],               date: "11 Jun", deduction: "₹220" },
  { id: "PADMA-L1-002", weaver: "Padma Veni",   defects: ["Jari Issue"],                   date: "11 Jun", deduction: "₹380" },
];

export const DEFECT_TYPES: { label: string; Icon: React.ElementType }[] = [
  { label: "Thread Break",       Icon: Scissors   },
  { label: "Design Error",       Icon: Palette    },
  { label: "Jari Issue",         Icon: Sparkles   },
  { label: "Weight Problem",     Icon: Scale      },
  { label: "Measurement Error",  Icon: Ruler      },
  { label: "Other",              Icon: HelpCircle },
];

export function variance(w: number, std: number) {
  const d = w - std;
  return { d, ok: Math.abs(d) <= 50 };
}

export function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

export function splitDesignField(design: string): { code: string; typeName: string } {
  const idx = design.indexOf("·");
  if (idx === -1) return { code: design.trim(), typeName: "" };
  return { code: design.slice(0, idx).trim(), typeName: design.slice(idx + 1).trim() };
}
