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
  /** Weaver UUID — identity for QC payloads, never displayed. */
  wcode: string;
  /** Human-facing weaver code ("Ramarao-001") — the only weaver id shown in the UI. */
  weaverCode?: string;
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
  /** The underlying QC record's own id — use this as the React list key.
   * `id` below is the saree code shown to the user, and repeats across a
   * saree's inspection history (fail, rework, re-inspect). */
  recordId: string;
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
  /** The underlying QC record's own id — use this as the React list key.
   * `id` below is the saree code shown to the user, and repeats across a
   * saree's inspection history (fail, rework, re-inspect). */
  recordId: string;
  id: string;
  weaver: string;
  sareeType: string;
  date: string;
  payable: string;
  isoDate: string;
  /** Who performed this QC check — same field already carried by the
   * defective/semi log, just previously dropped when building this one. */
  inspectedBy?: string;
}

// NOTE: the QUEUE and DEFECTIVE_LOG fixtures that used to live here held
// named weavers, real weaver UUIDs and invented QC deductions, and had no
// importers — WorkerQC.tsx reads live rows from context instead.


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
