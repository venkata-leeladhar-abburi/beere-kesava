import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Download, ClipboardCheck } from "lucide-react";
import { T, F } from "./tokens";
import { TypePill, SectionCard } from "./SharedUI";
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

const historyColumns: ColumnDef<HistoryRow>[] = [
  {
    id: "date", header: "Date & Time", accessor: row => row.date,
    cell: (_v, row) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{row.date}</span>,
  },
  {
    id: "type", header: "Type", accessor: row => row.type,
    cell: (_v, row) => <TypePill type={row.type} typeColor={T.royalBurgundy} />,
  },
  {
    id: "by", header: "Requested By", accessor: row => row.by, priority: 3,
    cell: (_v, row) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{row.by}</span>,
  },
  {
    id: "details", header: "Details", accessor: row => row.details, priority: 1,
    cell: (_v, row) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{row.details}</span>,
  },
  {
    id: "decision", header: "Decision", accessor: row => row.decision,
    cell: (_v, row) => (
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
    ),
  },
  {
    id: "notified", header: "Notified", accessor: () => "Sent", priority: 3,
    cell: () => (
      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 4 }}>
        <Check size={11} /> Sent
      </span>
    ),
  },
];

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
    <div style={{ padding: "40px 56px 0" }}>
    <SectionCard
      icon={ClipboardCheck}
      title="Approval History — All Past Decisions"
      subtitle="A permanent record of all approvals and rejections made in this portal."
      actions={
        <Button variant="secondary" size="sm" iconLeft={Download} className="bg-white/10 text-[#FFFDF9] border-white/20">
          Download History
        </Button>
      }
    >
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
        <DataTable<HistoryRow>
          responsive
          columns={historyColumns}
          data={filteredRows}
          getRowId={row => `${row.date}-${row.by}-${row.details}`}
          loading={isLoading}
          error={isError}
          emptyTitle="No approval decisions recorded for this filter yet."
        />
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
    </SectionCard>
    </div>
  );
}
