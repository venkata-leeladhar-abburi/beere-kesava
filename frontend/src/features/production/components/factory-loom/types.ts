import React from "react";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { T } from "./theme";
import type { StatusValueOf } from "@/lib/domain/status";

// ── Types ────────────────────────────────────────────────────────────────────
export interface LoomBatch {
  batchId: string; loomId: string; sareeCount: number; completedCount: number;
  dueDate: string; designCode: string; designName: string; orderRef: string;
  // Same batch-lifecycle vocabulary as BatchContext.tsx's BatchRecord.status —
  // left as a raw literal union rather than lib/domain/status.ts's
  // ProductionStatus because "active" has no PRODUCTION_STATUS equivalent
  // (that taxonomy's in-progress states are the granular warping/weaving/
  // finishing/qc-* stages, not a single coarse "active").
  status: "active" | "completed" | "draft"; startDate: string;
}
export interface LoomMaterial {
  batchId: string; loomId: string; mirId: string; date: string;
  materialType: "Warp" | "Resham" | "Jari"; description: string;
  quantity: number; unit: string; grnBatch: string; issuedBy: string;
}
export interface LoomSaree {
  sareeId: string; loomId: string; batchId: string; sareeType: string;
  // Per-saree progress on a loom, not a taxonomy match: "in-progress" doesn't
  // correspond to any single PRODUCTION_STATUS key (weaving/finishing/etc are
  // more granular than this field tracks), so kept as its own literal union.
  status: "complete" | "in-progress" | "pending";
  completedDate?: string; qualityStatus?: "pass" | "fail" | "pending";
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active:      { label: "Active",      color: T.green,       bg: "rgba(30,102,64,0.10)",  icon: React.createElement(CheckCircle2, { size: 12 }) },
  idle:        { label: "Idle",        color: T.antiqueGold, bg: "rgba(200,155,71,0.12)", icon: React.createElement(Clock, { size: 12 }) },
  maintenance: { label: "Maintenance", color: T.crimson,     bg: "rgba(192,57,43,0.10)",  icon: React.createElement(AlertTriangle, { size: 12 }) },
};

// A loom's own status vocabulary ("active" = currently weaving) maps onto
// the shared `condition` taxonomy (design-system/06-DOMAIN.md Part G.2 calls
// out ResourceCondition/Loom cards specifically) — "active" normalizes onto
// "in-use", the taxonomy's equivalent state; "idle"/"maintenance" match keys
// directly.
export const LOOM_STATUS_TO_CONDITION: Record<"active" | "idle" | "maintenance", StatusValueOf<"condition">> = {
  active: "in-use",
  idle: "idle",
  maintenance: "maintenance",
};
export const BATCH_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",    color: T.royalBurgundy, bg: "rgba(110,15,45,0.08)" },
  completed: { label: "Completed", color: T.green,         bg: "rgba(30,102,64,0.10)" },
  draft:     { label: "Draft",     color: T.taupe,         bg: "rgba(139,112,96,0.08)" },
};
export const MAT_TAG: Record<string, { col: string; bg: string }> = {
  Warp:   { col: T.royalBurgundy, bg: "rgba(110,15,45,0.08)" },
  Resham: { col: "#7A5E1C",       bg: "rgba(200,155,71,0.12)" },
  Jari:   { col: "#1E5E40",       bg: "rgba(30,102,64,0.10)" },
};
