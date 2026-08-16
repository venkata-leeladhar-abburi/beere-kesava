import React from "react";
import type { LucideIcon } from "lucide-react";
import { T, F } from "../theme";
import {
  Select as DsSelect,
  SelectItem,
} from "../../../../../shared/ui/primitives";

// Section banner card — dark maroon gradient header (icon + title + subtitle
// + actions) atop a white padded body, matching the pattern used across the
// rest of the app.
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
      <div className="p-4 sm:p-7" style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)` }}>
        <div className="flex items-start gap-3.5 sm:gap-4 w-full">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <Icon size={24} color="#FFFDF9" />
          </div>
          <div className="flex flex-col items-start gap-3 flex-1 min-w-0">
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px", lineHeight: 1.2 }}>{title}</div>
              {subtitle && <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.70)", marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
            </div>
            {actions && <div className="flex items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto flex-nowrap min-w-0 pt-0.5">{actions}</div>}
          </div>
        </div>
      </div>
      <div className="p-2.5 sm:p-5 md:p-6 pb-2.5 sm:pb-4">
        {children}
      </div>
    </div>
  );
}
import { StatusPill as DomainStatusPill } from "../../../../../shared/ui/domain";
import type { StatusValueOf } from "../../../../../lib/domain/status";

export function Select({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <DsSelect value={value} onValueChange={onChange}>
      {options.map((o) => (
        <SelectItem key={o} value={o}>{o}</SelectItem>
      ))}
    </DsSelect>
  );
}

// "Paid" | "Pending" | "Partial" (external purchase payment status) —
// normalized onto the shared payment taxonomy (lib/domain/status.ts)
// per design-system/06-DOMAIN.md Part D.
const STATUS_KEY: Record<string, StatusValueOf<"payment">> = {
  Paid: "paid",
  Pending: "unpaid",
  Partial: "partial",
};

export function StatusPill({ status }: { status: string }) {
  return <DomainStatusPill taxonomy="payment" status={STATUS_KEY[status] ?? "unpaid"} />;
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 8,
  border: `1px solid ${T.borderDef}`,
  background: "#FFF8F0",
  fontFamily: F.ui,
  fontSize: 13,
  padding: "0 12px",
  color: T.luxuryBrown,
  outline: "none",
  boxSizing: "border-box",
};

export const labelStyle: React.CSSProperties = {
  fontFamily: F.ui,
  fontWeight: 600,
  fontSize: 12,
  color: T.luxuryBrown,
  display: "block",
  marginBottom: 6,
};
