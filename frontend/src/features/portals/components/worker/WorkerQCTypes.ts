import React from "react";
import { Scissors, Palette, Sparkles, Scale, Ruler, HelpCircle } from "lucide-react";
import { brand, fonts, semantic } from "@/design-system/tokens";

/** Same design-system re-export as worker/tokens.ts — see the note there. */
export const T = {
  bg:       semantic.surface.canvas,
  card:     semantic.surface.raised,
  burg:     brand.burgundy[900],
  wine:     brand.burgundy[950],
  gold:     brand.gold[500],
  goldL:    "#E7C983",
  brown:    semantic.text.primary,
  green:    semantic.text.success,
  crim:     semantic.text.danger,
  muted:    semantic.text.tertiary,
  bdr:      "rgba(110,15,45,0.10)",
  bdrMed:   "rgba(110,15,45,0.20)",
  cream:    "#F5E8D0",
  inp:      semantic.surface.raised,
  bgGold:   "rgba(200,155,71,0.15)",
  bgGreen:  "rgba(30,102,64,0.10)",
  bgCrim:   "rgba(110,15,45,0.10)",
  gradHero: `linear-gradient(100deg, ${brand.burgundy[950]} 0%, ${brand.burgundy[900]} 100%)`,
  shadow:   "0 2px 12px rgba(74,6,27,0.07)",
  shadowLg: "0 6px 32px rgba(74,6,27,0.12)",
};

export const F = {
  d: fonts.display,
  u: fonts.ui,
  m: fonts.code,
};

export const baseCard: React.CSSProperties = {
  background: T.card,
  border: `1px solid ${T.bdr}`,
  borderRadius: 16,
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
  isoDate?: string;
}

export type InspectionResult = "defective" | "semi_approved" | null;

export interface DefectiveLogItem {
  id: string;
  weaver: string;
  defects: string[];
  date: string;
  deduction: string;
  isoDate?: string;
  result?: "defective" | "semi";
  sareeType?: string;
  batchId?: string | null;
  makingCharge?: string;
  payable?: string;
  notes?: string;
  photoUrl?: string | null;
  inspectedBy?: string;
  receivedDate?: string;
}

export interface PassedLogItem {
  id: string;
  weaver: string;
  sareeType: string;
  date: string;
  payable: string;
  isoDate: string;
}

export const QUEUE: SareeItem[] = [
  { id: "PADMA-L1-004", batch: "BATCH-086", source: "outsourced", weaver: "Padma Veni",   wcode: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", design: "BKB-045 · Self Brocade",     weight: 842,  std: 850, submitted: "2 hrs ago" },
  { id: "RAVI-L2-008",  batch: "BATCH-089", source: "outsourced", weaver: "Ravi Kumar",   wcode: "b5f9178c-b1b9-4871-a7c3-0d68a462d57a", design: "BKB-031 · Heavy Zari",       weight: 918,  std: 900, submitted: "4 hrs ago" },
  { id: "BKB-L3-002",   batch: "BATCH-OWN", source: "own",        weaver: "Loom 3",       wcode: "",       design: "BKB-022 · Kanjivaram",       weight: 774,  std: 800, submitted: "Yesterday" },
  { id: "SURESH-L2-003",batch: "BATCH-081", source: "outsourced", weaver: "Suresh Murti", wcode: "11278a51-a26d-4eaa-adbf-bedbfa7fdf46", design: "BKB-038 · Gadwal Cotton",    weight: 856,  std: 850, submitted: "Yesterday" },
  { id: "PADMA-L1-005", batch: "BATCH-086", source: "outsourced", weaver: "Padma Veni",   wcode: "8937070a-ea63-43f3-9cb4-dcbcfd362ff7", design: "BKB-045 · Self Brocade",     weight: 848,  std: 850, submitted: "Yesterday" },
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
