import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Download } from "lucide-react";
import { T, F } from "./tokens";
import { TypePill } from "./SharedUI";
import { Button } from "../../../../shared/ui/primitives";
import { auditLogApi } from "../../../../shared/api/audit-log";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

const HIST_FILTERS = ["All History", "Purchase Orders", "Warp Requests", "Rate Changes", "Approved Only", "Rejected Only"];
const HIST_PERIODS = ["This Month", "Last 3 Months", "All Time"];

// GAP: only Purchase Order approve/reject actions currently write to the
// audit log with module "APPROVALS" (see backend/src/purchase-orders/
// purchase-orders.service.ts). Warp Requests and Rate Changes have no
// equivalent audit trail yet, so those filters will always show "no history"
// until that logging is added — this is a real gap, not a bug in this view.
type HistoryRow = {
  date: string;
  type: "Purchase Order";
  by: string;
  details: string;
  decision: "Approved" | "Rejected";
};

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

// ─── 5. APPROVAL HISTORY ─────────────────────────────────────────────────────
export function HistorySection({
  histFilter,
  setHistFilter,
  histPeriod,
  setHistPeriod,
}: {
  histFilter: string;
  setHistFilter: (v: string) => void;
  histPeriod: string;
  setHistPeriod: (v: string) => void;
}) {
  const { data: actionsRes, isLoading, isError } = useQuery({
    queryKey: ["approval-history"],
    queryFn: () => auditLogApi.listActions({ module: "APPROVALS", pageSize: 200 }),
  });

  const rows: HistoryRow[] = React.useMemo(() => {
    const items = actionsRes?.items ?? [];
    return items
      .filter(a => a.entityType === "PurchaseOrder")
      .map(a => ({
        date: new Date(a.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        type: "Purchase Order" as const,
        by: a.user ? `${a.user.firstName} ${a.user.lastName}` : "System",
        details: a.action,
        decision: (a.newValue === "APPROVED" ? "Approved" : "Rejected") as "Approved" | "Rejected",
        _createdAt: a.createdAt,
      }));
  }, [actionsRes]);

  const filteredRows = React.useMemo(() => {
    let out = rows;
    if (histFilter === "Purchase Orders") out = out.filter(r => r.type === "Purchase Order");
    else if (histFilter === "Warp Requests" || histFilter === "Rate Changes") out = [];
    else if (histFilter === "Approved Only") out = out.filter(r => r.decision === "Approved");
    else if (histFilter === "Rejected Only") out = out.filter(r => r.decision === "Rejected");

    if (histPeriod !== "All Time") {
      const cutoff = histPeriod === "This Month" ? monthsAgo(1) : monthsAgo(3);
      out = out.filter(r => new Date((r as any)._createdAt) >= cutoff);
    }
    return out;
  }, [rows, histFilter, histPeriod]);

  return (
    <div style={{ padding: "48px 56px" }}>
      {/* Section title row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 4, height: 24, background: T.royalBurgundy, borderRadius: 2 }} />
          <span style={{ fontFamily: F.ui, fontSize: 18, fontWeight: 600, color: T.luxuryBrown }}>
            Approval History — All Past Decisions
          </span>
        </div>
        <Button variant="link" size="sm" iconLeft={Download}>
          Download History →
        </Button>
      </div>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 20, marginLeft: 16 }}>
        A permanent record of all approvals and rejections made in this portal.
      </p>

      {/* Filter pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {HIST_FILTERS.map(f => (
          <Button
            key={f}
            onClick={() => setHistFilter(f)}
            variant={histFilter === f ? "primary" : "secondary"} size="sm" className="rounded-full"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Period pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {HIST_PERIODS.map(p => (
          <Button
            key={p}
            onClick={() => setHistPeriod(p)}
            variant={histPeriod === p ? "primary" : "secondary"} size="sm" className="rounded-full"
          >
            {p}
          </Button>
        ))}
      </div>

      {/* History table */}
      <div style={{
        background: "#FFF", borderRadius: 16,
        border: "1px solid " + T.borderDef,
        boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
        overflow: "hidden",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "200px 140px 130px 1fr 120px 90px",
          background: T.cream,
          borderBottom: "1px solid " + T.borderDef,
          padding: "10px 20px",
          gap: 8,
        }}>
          {["Date & Time", "Type", "Requested By", "Details", "Decision", "Notified"].map(h => (
            <span key={h} style={{
              fontFamily: F.mono, fontSize: 12, color: T.taupe,
              textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600,
            }}>
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            Loading approval history…
          </div>
        ) : isError ? (
          <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.crimson }}>
            Failed to load approval history. Please try again.
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
            No approval decisions recorded for this filter yet.
          </div>
        ) : (
          filteredRows.map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "200px 140px 130px 1fr 120px 90px",
                padding: "13px 20px",
                gap: 8,
                borderBottom: i < filteredRows.length - 1 ? "1px solid " + T.borderDef : "none",
                background: i % 2 === 0 ? "#FFF" : T.warmIvory,
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{row.date}</span>
              <TypePill type={row.type} typeColor={T.royalBurgundy} />
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{row.by}</span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{row.details}</span>
              <span style={{
                background: row.decision === "Approved" ? T.greenBg : T.crimsonBg,
                color: row.decision === "Approved" ? T.green : T.crimson,
                borderRadius: 6, padding: "3px 10px",
                fontFamily: F.ui, fontSize: 12, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                {row.decision === "Approved" ? <Check size={11} /> : <X size={11} />}
                {row.decision}
              </span>
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={11} /> Sent
              </span>
            </div>
          ))
        )}
      </div>

      {/* Permanent record note */}
      <div style={{ textAlign: "right", marginTop: 10, fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
        🔒 This history is permanent and cannot be edited or deleted.
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20, alignItems: "center" }}>
        {["Previous", "1", "2", "3", "Next"].map((p, i) => (
          <Button
            key={i}
            variant={p === "1" ? "primary" : "secondary"} size="sm"
          >
            {p}
          </Button>
        ))}
      </div>
    </div>
  );
}
