import React from "react";
import { ChevronLeft } from "lucide-react";
import { C, F } from "../tokens";
import { IconButton } from "../../../../../shared/ui/primitives";

export type WeaversPage = "menu" | "design" | "issue" | "receive";
export type IssueSource = "own" | "outsourced" | null;

// status is a genuine PRODUCTION_STATUS match (Passed QC → qc-passed, Pending QC →
// qc-pending, Defective → qc-failed — see HistorySection.tsx's HISTORY_STATUS_TO_PRODUCTION,
// which already renders this via <StatusPill taxonomy="production">). Left as raw strings
// here rather than retyped to ProductionStatus because WorkerWeavers.tsx and
// HistorySection.tsx both compare/lookup against these exact literals and are outside
// this pass's file list — retyping needs a follow-up touching those two call sites too.
export interface ReceivedSareeLog {
  id: string; weaver: string; wcode: string; batch: string;
  weight: string; date: string; color: string; status: "Passed QC" | "Defective" | "Pending QC";
  /** Photo captured at receipt (data URL or hosted URL) — shown as a thumbnail in Received History. */
  photoUrl?: string | null;
  /** Which loom (weaver's own, 1..N) this saree was woven on, when known. */
  loomNumber?: number | string | null;
  sareeType?: string | null;
  bulkOrder?: string | null;
  /** Full name of the Worker Staff who physically received this saree, when known. */
  receivedBy?: string | null;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 5 }}>{children}</div>;
}

export function SectionLabel({ step, title }: { step: number; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 16px 8px" }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 700, color: "#FFF" }}>{step}</span>
      </div>
      <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.burg }}>{title}</span>
    </div>
  );
}

export function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ height: 48, background: C.burg, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
      <IconButton icon={ChevronLeft} label="Back" variant="ghost" onClick={onBack} className="text-white/85" />
      <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 600, color: "#FFF", flex: 1 }}>{title}</span>
    </div>
  );
}
