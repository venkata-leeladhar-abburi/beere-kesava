import React from "react";
import { T, F } from "../theme";
import {
  Select as DsSelect,
  SelectItem,
  StatusPill as DsStatusPill,
  type StatusTone,
} from "../../../../../shared/ui/primitives";

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

const STATUS_TONE: Record<string, StatusTone> = {
  Paid: "success",
  Pending: "warning",
  Partial: "danger",
};

export function StatusPill({ status }: { status: string }) {
  return <DsStatusPill tone={STATUS_TONE[status] ?? "neutral"} label={status} />;
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
