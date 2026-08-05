import React from "react";
import { ShieldCheck, ShieldHalf } from "lucide-react";
import { T, F, ROLE_COLORS, ACCESS_LEVEL_META, AccessLevel } from "./theme";

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 4, height: 22, borderRadius: 2, background: T.royalBurgundy, flexShrink: 0 }} />
        <span style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>{children}</span>
      </div>
      {action}
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role] ?? { bg: "rgba(139,112,96,0.10)", text: T.taupe, border: "rgba(139,112,96,0.15)" };
  return (
    <span style={{ display: "inline-block", background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" as const }}>
      {role}
    </span>
  );
}

export function AccessBadge({ level }: { level: AccessLevel }) {
  const m = ACCESS_LEVEL_META[level];
  const Icon = level === "Full Access" ? ShieldCheck : ShieldHalf;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" as const }}>
      <Icon size={11} /> {level}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: active ? T.greenBg : "rgba(139,112,96,0.09)", color: active ? T.green : T.taupe, border: `1px solid ${active ? "rgba(30,102,64,0.18)" : "rgba(139,112,96,0.15)"}`, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 12, fontWeight: 600 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? T.green : T.taupe, flexShrink: 0 }} />
      {status}
    </span>
  );
}
