import React from "react";
import { ChevronLeft } from "lucide-react";
import { C, F } from "../tokens";

export type WeaversPage = "menu" | "design" | "issue" | "receive";
export type IssueSource = "own" | "outsourced" | null;

export interface ReceivedSareeLog {
  id: string; weaver: string; wcode: string; batch: string;
  weight: string; date: string; color: string; status: "Passed QC" | "Defective" | "Pending QC";
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
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
        <ChevronLeft size={18} color="rgba(255,255,255,0.85)" />
      </button>
      <span style={{ fontFamily: F.d, fontSize: 14, fontWeight: 600, color: "#FFF", flex: 1 }}>{title}</span>
    </div>
  );
}
