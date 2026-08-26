import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Download, ClipboardCheck, LayoutGrid, List } from "lucide-react";
import { T, F } from "./tokens";
import { TypePill, SectionCard } from "./SharedUI";
import { Button } from "../../../../shared/ui/primitives";
import { auditLogApi } from "../../../../shared/api/audit-log";
import { DataTable, exportTable, type ColumnDef } from "../../../../shared/ui/data";

const HIST_FILTERS = ["All History", "Purchase Orders", "Warp Requests", "Rate Changes", "Approved Only", "Rejected Only"];
const HIST_PERIODS = ["This Month", "Last 3 Months", "All Time"];

// GAP: only Purchase Order approve/reject actions currently write to the
// audit log with module "APPROVALS" (see backend/src/purchase-orders/
// purchase-orders.service.ts). Warp Requests and Rate Changes have no
// equivalent audit trail yet, so those filters will always show "no history"
// until that logging is added — this is a real gap, not a bug in this view.
type HistoryRow = {
  // Audit-log entry id — carried through purely so the card list has a stable
  // React key that survives filtering, instead of falling back to the index.
  _id: string;
  date: string;
  type: "Purchase Order";
  by: string;
  details: string;
  decision: "Approved" | "Rejected";
  _createdAt: string;
};

const historyColumns: ColumnDef<HistoryRow>[] = [
  {
    id: "date", header: "Date & Time", accessor: row => row.date,
    cell: (_v, row) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{row.date}</span>,
  },
  {
    id: "type", header: "Type", accessor: row => row.type,
    cell: (_v, row) => <TypePill type={row.type} typeColor={T.royalBurgundy} />,
  },
  {
    id: "by", header: "Requested By", accessor: row => row.by, priority: 3,
    cell: (_v, row) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, whiteSpace: "nowrap" }}>{row.by}</span>,
  },
  {
    id: "details", header: "Details", accessor: row => row.details, priority: 1,
    cell: (_v, row) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{row.details}</span>,
  },
  {
    id: "decision", header: "Decision", accessor: row => row.decision,
    cell: (_v, row) => (
      <span style={{
        background: row.decision === "Approved" ? T.greenBg : T.crimsonBg,
        color: row.decision === "Approved" ? T.green : T.crimson,
        borderRadius: 6, padding: "3px 10px",
        fontFamily: F.ui, fontSize: 12, fontWeight: 600,
        display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
      }}>
        {row.decision === "Approved" ? <Check size={11} /> : <X size={11} />}
        {row.decision}
      </span>
    ),
  },
  {
    id: "notified", header: "Notified", accessor: () => "Sent", priority: 3,
    cell: () => (
      <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
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
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const { data: actionsRes, isLoading, isError } = useQuery({
    queryKey: ["approval-history"],
    queryFn: () => auditLogApi.listActions({ module: "APPROVALS", pageSize: 200 }),
  });

  const rows: HistoryRow[] = React.useMemo(() => {
    const items = actionsRes?.items ?? [];
    return items
      .filter(a => a.entityType === "PurchaseOrder")
      .map(a => ({
        _id: a.id,
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
      out = out.filter(r => new Date(r._createdAt) >= cutoff);
    }
    return out;
  }, [rows, histFilter, histPeriod]);

  return (
    <div className="px-3 sm:px-4 md:px-7 xl:px-14" style={{ paddingTop: 24 }}>
    <SectionCard
      icon={ClipboardCheck}
      title="Approval History — All Past Decisions"
      subtitle="A permanent record of all approvals and rejections made in this portal."
      actions={
        <Button variant="secondary" size="sm" iconLeft={Download} onClick={() => exportTable({ columns: historyColumns, rows, filename: "approval-history" })} className="bg-white/10 text-[#FFFDF9] border-white/20 whitespace-nowrap">
          Download History
        </Button>
      }
    >
      {/* Controls Bar: Filters & View Toggle (Mobile Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {HIST_FILTERS.map(f => (
            <Button
              key={f}
              onClick={() => setHistFilter(f)}
              variant={histFilter === f ? "primary" : "secondary"} size="sm" className="rounded-full text-xs px-2.5 sm:px-3"
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Card / Table View Toggle (Mobile Only) */}
        <div className="flex md:hidden items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0 self-start sm:self-auto shadow-xs">
          <Button
            onClick={() => setViewMode("card")}
            variant="ghost"
            size="sm"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold transition-colors ${
              viewMode === "card"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                : "bg-white text-[#8B7060] hover:bg-[#F7F2EA]"
            }`}
          >
            <LayoutGrid size={14} /> Card View
          </Button>
          <Button
            onClick={() => setViewMode("table")}
            variant="ghost"
            size="sm"
            className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold transition-colors ${
              viewMode === "table"
                ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                : "bg-white text-[#8B7060] hover:bg-[#F7F2EA]"
            }`}
          >
            <List size={14} /> Table View
          </Button>
        </div>
      </div>

      {/* Period Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4">
        {HIST_PERIODS.map(p => (
          <Button
            key={p}
            onClick={() => setHistPeriod(p)}
            variant={histPeriod === p ? "primary" : "secondary"} size="sm" className="rounded-full text-xs px-2.5 sm:px-3"
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Mobile Card View (visible only on mobile when viewMode is 'card') */}
      <div className={viewMode === "card" ? "block md:hidden" : "hidden"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {isLoading && (
            <div className="col-span-full py-12 text-center text-xs text-[#8B7060]">
              Loading approval history...
            </div>
          )}
          {!isLoading && isError && (
            <div className="col-span-full py-12 text-center text-xs text-[#C0392B]">
              Failed to load approval history.
            </div>
          )}
          {!isLoading && !isError && filteredRows.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-[#8B7060] bg-white rounded-2xl border border-[#EBE3D5] p-8">
              No approval decisions recorded for this filter yet.
            </div>
          )}
          {!isLoading && !isError && filteredRows.map((row) => (
            <div key={row._id} className="bg-white rounded-2xl border border-[#EBE3D5] p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(44,24,16,0.06)] hover:shadow-md transition-shadow flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, lineHeight: 1.3 }}>
                    {row.details}
                  </span>
                  <span style={{
                    background: row.decision === "Approved" ? T.greenBg : T.crimsonBg,
                    color: row.decision === "Approved" ? T.green : T.crimson,
                    borderRadius: 999, padding: "3px 9px",
                    fontFamily: F.ui, fontSize: 11, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
                  }}>
                    {row.decision === "Approved" ? <Check size={11} /> : <X size={11} />}
                    {row.decision}
                  </span>
                </div>

                <div className="space-y-2 mt-3 pt-2.5 border-t border-[#EBE3D5]/60 text-xs">
                  <div className="flex justify-between items-center text-[#8B7060]">
                    <span style={{ fontFamily: F.ui, fontSize: 12 }}>Date & Time</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{row.date}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#8B7060]">
                    <span style={{ fontFamily: F.ui, fontSize: 12 }}>Type</span>
                    <TypePill type={row.type} typeColor={T.royalBurgundy} />
                  </div>
                  <div className="flex justify-between items-center text-[#8B7060]">
                    <span style={{ fontFamily: F.ui, fontSize: 12 }}>Requested By</span>
                    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{row.by}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#8B7060]">
                    <span style={{ fontFamily: F.ui, fontSize: 12 }}>Notified</span>
                    <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 4 }}>
                      <Check size={11} /> Sent
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table View (always visible on desktop, and on mobile when viewMode is 'table') */}
      <div className={viewMode === "table" ? "block" : "hidden md:block"}>
        <div className="bg-white rounded-2xl border border-[#EBE3D5] shadow-sm overflow-hidden w-full max-w-full">
          <div className="overflow-x-auto w-full max-w-full" style={{ WebkitOverflowScrolling: "touch" }}>
            <DataTable<HistoryRow>
              columns={historyColumns}
              data={filteredRows}
              getRowId={row => `${row.date}-${row.by}-${row.details}`}
              loading={isLoading}
              error={isError}
              emptyTitle="No approval decisions recorded for this filter yet."
            />
          </div>
        </div>
      </div>

      {/* Permanent record note */}
      <div style={{ textAlign: "right", marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>
        🔒 This history is permanent and cannot be edited or deleted.
      </div>
    </SectionCard>
    </div>
  );
}
