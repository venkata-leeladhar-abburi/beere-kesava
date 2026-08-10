import React from "react";
import { T, F } from "../theme";
import {
  Select as DsSelect,
  SelectItem,
} from "../../../../../shared/ui/primitives";
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
