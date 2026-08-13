import React, { useState, useMemo } from "react";
import { Truck, Users, ShoppingBag, Clock, CheckCircle2, Trash2, FileText } from "lucide-react";
import { DispatchRecord } from "../../../finishing/contexts/FinishingContext";
import { T, F } from "../theme";
import { Button } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { SectionCard } from "../common/primitives";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";

// ── Dispatch History section ──────────────────────────────────────────────────
// Exported for the Worker Staff portal — same component, same markup, so the two
// screens cannot fall out of step.
export function DispatchHistorySection({ dispatches, firms, onResume, onDelete, onViewInvoice }: { dispatches: DispatchRecord[]; firms: { id: string; firmName: string }[]; onResume: (d: DispatchRecord) => void; onDelete?: (d: DispatchRecord) => void; onViewInvoice?: (d: DispatchRecord) => void; }) {
  const [tab, setTab] = useState<"all" | "shop" | "wholesale">("all");
  const rows = useMemo(() =>
    [...dispatches]
      .filter(d => tab === "all" || d.type === tab)
      .sort((a, b) => (b.id > a.id ? 1 : -1)),
  [dispatches, tab]);

  const TABS: { key: typeof tab; label: string; count: number }[] = [
    { key: "all",       label: "All",       count: dispatches.reduce((acc, d) => acc + d.sareeIds.length, 0) },
    { key: "shop",      label: "To Shop",   count: dispatches.filter(d => d.type === "shop").reduce((acc, d) => acc + d.sareeIds.length, 0) },
    { key: "wholesale", label: "Wholesale", count: dispatches.filter(d => d.type === "wholesale").reduce((acc, d) => acc + d.sareeIds.length, 0) },
  ];

  return (
    <SectionCard
      icon={Truck}
      title="Dispatch History"
      subtitle="Every dispatch sent out to shops and wholesale customers."
      actions={
        <div style={{ display: "flex", gap: 6 }}>
          {TABS.map(t => (
            <Button
              key={t.key}
              onClick={() => setTab(t.key)}
              variant={tab === t.key ? "secondary" : "tertiary"}
              size="sm"
              className={tab === t.key ? "rounded-full" : "rounded-full bg-white/10 text-[#FFFDF9] border-white/20"}
            >
              {t.label} <span style={{ fontFamily: F.mono, fontSize: 12 }}>({t.count})</span>
            </Button>
          ))}
        </div>
      }
    >
      <DataTableBody rows={rows} firms={firms} onResume={onResume} onDelete={onDelete} onViewInvoice={onViewInvoice} />
    </SectionCard>
  );
}

function DataTableBody({ rows, firms, onResume, onDelete, onViewInvoice }: { rows: DispatchRecord[]; firms: { id: string; firmName: string }[]; onResume: (d: DispatchRecord) => void; onDelete?: (d: DispatchRecord) => void; onViewInvoice?: (d: DispatchRecord) => void; }) {
  const pag = usePagination(rows, 25);
  const columns: ColumnDef<DispatchRecord>[] = [
    {
      id: "date", header: "Date", accessor: d => d.dispatchDate, width: 110,
      cell: (_v, d) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{d.dispatchDate}</span>,
    },
    {
      id: "type", header: "Type", accessor: d => d.type, width: 90,
      cell: (_v, d) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: d.type === "wholesale" ? "rgba(110,15,45,0.08)" : "rgba(200,155,71,0.14)", color: d.type === "wholesale" ? T.royalBurgundy : "#8B6018", border: `1px solid ${d.type === "wholesale" ? "rgba(110,15,45,0.18)" : "rgba(200,155,71,0.32)"}`, borderRadius: 999, padding: "2px 9px", fontFamily: F.ui, fontSize: 12, fontWeight: 700, textTransform: "capitalize" as const }}>
          {d.type === "wholesale" ? <Users size={10} /> : <ShoppingBag size={10} />}{d.type}
        </span>
      ),
    },
    {
      id: "destination", header: "Destination", accessor: d => d.customerName ?? "", priority: 1,
      cell: (_v, d) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{d.type === "wholesale" ? (d.customerName ?? "—") : "Shop / Showroom"}</span>,
    },
    {
      id: "lr", header: "LR / Transport", accessor: d => d.lrNumber, width: 130, priority: 3,
      cell: (_v, d) => (
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>{d.lrNumber || "—"}</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>{d.transportCompany || "—"}</div>
        </div>
      ),
    },
    {
      id: "invoice", header: "Invoice", accessor: d => d.invoiceNumber, width: 100, priority: 3,
      cell: (_v, d) => <span style={{ fontFamily: F.mono, fontSize: 12, color: d.invoiceNumber ? T.luxuryBrown : T.taupe }}>{d.invoiceNumber || "—"}</span>,
    },
    {
      id: "sarees", header: "Sarees", accessor: d => d.sareeIds.length, type: "number", width: 80,
      cell: (_v, d) => <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{d.sareeIds.length}</span>,
    },
    {
      id: "firm", header: "Firm", accessor: d => d.firmName, width: 110, priority: 3,
      cell: (_v, d) => {
        const firm = firms.find(f => f.id === d.firmId);
        return <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{d.firmName || firm?.firmName || "—"}</span>;
      },
    },
    {
      id: "status", header: "Status", accessor: d => (d.pendingTransport || d.pendingReceipt) ? "incomplete" : "complete", type: "status", width: 130,
      cell: (_v, d) => {
        const incomplete = d.pendingTransport || d.pendingReceipt;
        return incomplete ? (
          <Button
            onClick={() => onResume(d)}
            variant="secondary"
            size="sm"
            iconLeft={Clock}
            className="rounded-full bg-[rgba(200,155,71,0.14)] border-[rgba(200,155,71,0.32)] text-[#8B6018] hover:bg-[rgba(200,155,71,0.22)] whitespace-nowrap"
          >
            Complete Details
          </Button>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.green }}>
            <CheckCircle2 size={12} /> Complete
          </span>
        );
      },
    },
    {
      id: "actions", header: "Actions", accessor: () => null, type: "actions", width: 100, exportable: false,
      cell: (_v, d) => (
        <div style={{ display: "flex", gap: 8 }}>
          {onViewInvoice && (
            <button
              onClick={() => onViewInvoice(d)}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: T.luxuryBrown }}
              title="Invoice"
            >
              <FileText size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this dispatch? The sarees will be returned to 'Ready for Dispatch'.")) {
                  onDelete(d);
                }
              }}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: T.royalBurgundy }}
              title="Delete Dispatch"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
      <DataTable
        responsive
        columns={columns}
        data={pag.pageItems}
        getRowId={d => d.id}
        emptyTitle="No dispatches yet."
      />
      {rows.length > 0 && (
        <div style={{ padding: "0 14px" }}>
          <Pagination
            page={pag.page}
            pageCount={pag.pageCount}
            total={pag.total}
            pageSize={pag.pageSize}
            start={pag.start}
            onPageChange={pag.setPage}
            onPageSizeChange={pag.setPageSize}
            itemLabel="dispatches"
          />
        </div>
      )}
    </div>
  );
}
