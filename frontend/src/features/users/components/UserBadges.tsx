import React from "react";
import { ShieldCheck, ShieldHalf, type LucideIcon } from "lucide-react";
import { T, F, ROLE_COLORS, ACCESS_LEVEL_META, AccessLevel } from "./theme";

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// Production, Materials, Payments, Weavers, Customers, Vendors, and
// Suppliers pages.
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  id,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 6px 32px rgba(74,6,27,0.08)", overflow: "hidden" }}>
      <div style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={26} color="#FFFDF9" />
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>{title}</div>
            {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>{subtitle}</div>}
          </div>
        </div>
        {actions && <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>{actions}</div>}
      </div>
      <div style={{ padding: "24px 28px 28px" }}>
        {children}
      </div>
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
