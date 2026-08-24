import React from "react";
import { Truck } from "lucide-react";
import { DispatchRecord } from "@/features/finishing";
import { Button, SearchInput, Select, SelectItem } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";

const T = {
  silkCream: "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  luxuryBrown: "#3B2314",
  taupe: "#69635E",
  greenBg: "rgba(30,102,64,0.09)",
  greenMid: "#2D9158",
  crimson: "#C0392B",
  crimsonBg: "rgba(192,57,43,0.08)",
  borderDef: "rgba(110,15,45,0.10)",
};
const F = {
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export interface LinkedSaree {
  id: string;
  designCode: string;
  sareeType: string;
  sareeTypeCode?: string;
  weaverName: string;
  batchId?: string;
  /** BatchSareeRow.serial within batchId — needed to target the tally endpoint. */
  serial?: number;
  // A bulk-order-specific fulfillment status, not a single lib/domain/status.ts
  // taxonomy: "QC Passed" reads as PRODUCTION_STATUS's qc-passed, but
  // "Dispatched"/"Damaged — Review Needed" read as INVENTORY_STATUS's
  // dispatched/damaged, and "Finishing complete" matches neither exactly.
  // Since the four values span two taxonomies rather than living in one,
  // this stays a local literal union (also relied on verbatim by the status
  // filter Select below) instead of being forced onto either.
  status: "QC Passed" | "Finishing complete" | "Dispatched" | "Damaged — Review Needed";
  date: string;
  quotationRef?: string;
  dispatch?: DispatchRecord;
}

function StatusPill({ status }: { status: LinkedSaree["status"] }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    "QC Passed": { bg: "rgba(200,155,71,0.14)", color: "#8B6018" },
    "Finishing complete": { bg: T.greenBg, color: T.greenMid },
    "Dispatched": { bg: "rgba(110,15,45,0.08)", color: T.royalBurgundy },
    "Damaged — Review Needed": { bg: T.crimsonBg, color: T.crimson },
  };
  const c = cfg[status] ?? cfg["QC Passed"];
  return <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" as const }}>{status}</span>;
}

interface BulkOrderSareesTabProps {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  batchFilter: string;
  setBatchFilter: (v: string) => void;
  dispatchFilter: string;
  setDispatchFilter: (v: string) => void;
  weaverFilter: string;
  setWeaverFilter: (v: string) => void;
  sareeTypeFilter: string;
  setSareeTypeFilter: (v: string) => void;
  batchOptions: string[];
  weaverOptions: string[];
  sareeTypeOptions: string[];
  filteredSarees: LinkedSaree[];
  setDispatchPanel: (d: DispatchRecord) => void;
}

export function BulkOrderSareesTab({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  batchFilter,
  setBatchFilter,
  dispatchFilter,
  setDispatchFilter,
  weaverFilter,
  setWeaverFilter,
  sareeTypeFilter,
  setSareeTypeFilter,
  batchOptions,
  weaverOptions,
  sareeTypeOptions,
  filteredSarees,
  setDispatchPanel,
}: BulkOrderSareesTabProps) {
  const columns: ColumnDef<LinkedSaree>[] = [
    {
      id: "id", header: "Saree ID", accessor: s => s.id, priority: 1,
      cell: (_v, s) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.royalBurgundy }}>{s.id}</span>,
    },
    {
      id: "design", header: "Design / Type", accessor: s => s.designCode,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{s.sareeTypeCode || s.designCode} · {s.sareeType}</span>,
    },
    {
      id: "weaver", header: "Weaver", accessor: s => s.weaverName,
      cell: (_v, s) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{s.weaverName}</span>,
    },
    {
      id: "batch", header: "Batch", accessor: s => s.batchId, priority: 3,
      cell: (_v, s) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.luxuryBrown }}>{s.batchId || "—"}</span>,
    },
    {
      id: "status", header: "Status", accessor: s => s.status, type: "status",
      cell: (_v, s) => <StatusPill status={s.status} />,
    },
    {
      id: "quotation", header: "Quotation", accessor: s => s.quotationRef, priority: 3,
      cell: (_v, s) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: s.quotationRef ? T.royalBurgundy : T.taupe }}>{s.quotationRef || "—"}</span>,
    },
    {
      id: "dispatch", header: "Dispatch", accessor: s => s.dispatch,
      cell: (_v, s) => (
        s.dispatch ? (
          <span style={{ display: "inline-block", background: T.greenBg, color: T.greenMid, borderRadius: 8 }}>
            <Button onClick={() => setDispatchPanel(s.dispatch!)} variant="tertiary" size="sm" iconLeft={Truck}>
              {s.dispatch.lrNumber || "View"}
            </Button>
          </span>
        ) : (
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Not dispatched</span>
        )
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[var(--border-default)] shadow-sm mb-5 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saree ID, design, or weaver…" />
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Select size="sm" containerClassName="w-auto shrink-0" className="w-auto font-medium" value={statusFilter} onValueChange={setStatusFilter}>
            {["All", "QC Passed", "Finishing complete", "Dispatched", "Damaged — Review Needed"].map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Statuses" : s}</SelectItem>)}
          </Select>
          <Select size="sm" containerClassName="w-auto shrink-0" className="w-auto font-medium" value={batchFilter} onValueChange={setBatchFilter}>
            {batchOptions.map(b => <SelectItem key={b} value={b}>{b === "All" ? "All Batches" : b}</SelectItem>)}
          </Select>
          <Select size="sm" containerClassName="w-auto shrink-0" className="w-auto font-medium" value={dispatchFilter} onValueChange={setDispatchFilter}>
            {["All", "Dispatched", "Not Dispatched"].map(s => <SelectItem key={s} value={s}>{s === "All" ? "All Dispatch" : s}</SelectItem>)}
          </Select>
          <Select size="sm" containerClassName="w-auto shrink-0" className="w-auto font-medium" value={weaverFilter} onValueChange={setWeaverFilter}>
            {weaverOptions.map(w => <SelectItem key={w} value={w}>{w === "All" ? "All Weavers" : w}</SelectItem>)}
          </Select>
          <Select size="sm" containerClassName="w-auto shrink-0" className="w-auto font-medium" value={sareeTypeFilter} onValueChange={setSareeTypeFilter}>
            {sareeTypeOptions.map(t => <SelectItem key={t} value={t}>{t === "All" ? "All Saree Types" : t}</SelectItem>)}
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--border-default)] overflow-x-auto shadow-sm">
        <div className="min-w-[700px]">
          <DataTable
            responsive={false}
            columns={columns}
            data={filteredSarees}
            getRowId={s => s.id}
            emptyTitle="No sarees match this filter"
          />
        </div>
      </div>
    </div>
  );
}
