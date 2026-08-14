import React from "react";
import { VendorStatus } from "../../types";

export const VENDOR_STATUS_CFG: Record<VendorStatus, { bg: string; color: string; label: string }> = {
  Paid:    { bg: "rgba(30,102,64,0.10)",   color: "#1E6640", label: "✓ Paid"    },
  Partial: { bg: "rgba(200,155,71,0.13)",  color: "#8B6018", label: "◑ Partial" },
  Pending: { bg: "rgba(74,107,138,0.10)",  color: "#2E5A8A", label: "⏱ Pending" },
  Overdue: { bg: "rgba(192,57,43,0.10)",   color: "#C0392B", label: "⚠ Overdue" },
};

export function VendorBadge({ status }: { status: VendorStatus }) {
  const c = VENDOR_STATUS_CFG[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 11px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: "nowrap" as const }}>
      {c.label}
    </span>
  );
}
