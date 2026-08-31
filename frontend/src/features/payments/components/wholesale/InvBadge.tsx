import { F } from "../../theme";
import { InvoiceStatus } from "../../types";

export const INV_STATUS_CFG: Record<InvoiceStatus, { bg: string; color: string; label: string }> = {
  Paid:    { bg: "rgba(30,102,64,0.10)",   color: "#1E6640", label: "✓ Paid"                              },
  Partial: { bg: "rgba(200,155,71,0.13)",  color: "#8B6018", label: "◑ Partial"                           },
  Pending: { bg: "rgba(74,107,138,0.10)",  color: "#2E5A8A", label: "⏱ Awaiting Payment — Within Terms"   },
  Overdue: { bg: "rgba(192,57,43,0.10)",   color: "#C0392B", label: "🔴 Overdue — Immediate Action Needed" },
};

export function InvBadge({ status }: { status: InvoiceStatus }) {
  const c = INV_STATUS_CFG[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: "nowrap" as const }}>
      {c.label}
    </span>
  );
}
