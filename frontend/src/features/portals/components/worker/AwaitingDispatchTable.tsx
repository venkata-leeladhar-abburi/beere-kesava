import React, { useMemo, useState } from "react";
import { Search, PackageCheck } from "lucide-react";
import type { FinishingReturn } from "@/features/finishing";
import { C, F } from "./tokens";
import { DataTable, type ColumnDef } from "@/shared/ui/data";
import { Pagination, usePagination } from "@/shared/ui/DataPagination";
import { EntityCode } from "@/shared/ui/domain";

function formatDate(value?: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const cellText: React.CSSProperties = { fontFamily: F.u, fontSize: 12, color: C.text, whiteSpace: "nowrap" };
const cellMuted: React.CSSProperties = { ...cellText, color: C.muted };

/**
 * Sarees that have come back from finishing and are not on any dispatch yet.
 * Was a grid of near-empty cards showing only a saree id; the same rows now
 * carry every field the queue is actually worked from — design, type, weaver,
 * batch, when it was finished and which quotation it belongs to — with search
 * and pagination, since this list runs to hundreds of pieces.
 */
export function AwaitingDispatchTable({ sarees, loading, error, onRetry }: {
  sarees: FinishingReturn[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? sarees.filter(s =>
          [s.sareeId, s.designCode, s.sareeType, s.sareeTypeCode, s.weaverName, s.batchId, s.quotationRef]
            .some(field => field?.toLowerCase().includes(q)))
      : sarees;
    // Longest-waiting first — that is the order the queue is worked in.
    return [...matched].sort((a, b) => (a.receivedDate ?? "").localeCompare(b.receivedDate ?? ""));
  }, [sarees, query]);

  const pag = usePagination(rows, 10);

  const columns: ColumnDef<FinishingReturn>[] = [
    {
      id: "sareeId", header: "Saree ID", accessor: s => s.sareeId, type: "code", width: 190, priority: 1,
      cell: (_v, s) => <EntityCode type="saree" value={s.sareeId} size="sm" />,
    },
    {
      id: "design", header: "Design", accessor: s => s.designCode, width: 130, priority: 2,
      cell: (_v, s) => s.designCode && s.designCode !== "—"
        ? <EntityCode type="design" value={s.designCode} size="sm" />
        : <span style={cellMuted}>—</span>,
    },
    {
      id: "type", header: "Saree Type", accessor: s => s.sareeType, width: 160, priority: 2,
      cell: (_v, s) => (
        <div>
          <div style={{ ...cellText, fontWeight: 600 }}>{s.sareeType}</div>
          {s.sareeTypeCode && s.sareeTypeCode !== s.sareeType && (
            <div style={{ ...cellMuted, fontSize: 11, marginTop: 1 }}>{s.sareeTypeCode}</div>
          )}
        </div>
      ),
    },
    {
      id: "weaver", header: "Weaver", accessor: s => s.weaverName, width: 150, priority: 2,
      cell: (_v, s) => <span style={cellText}>{s.weaverName}</span>,
    },
    {
      id: "batch", header: "Batch", accessor: s => s.batchId ?? "", width: 130, priority: 3,
      cell: (_v, s) => <span style={cellMuted}>{s.batchId || "—"}</span>,
    },
    {
      id: "finished", header: "Finished On", accessor: s => s.receivedDate, type: "date", width: 140, priority: 3,
      cell: (_v, s) => <span style={{ ...cellMuted, fontVariantNumeric: "tabular-nums" }}>{formatDate(s.receivedDate)}</span>,
    },
    {
      id: "quotation", header: "Quotation", accessor: s => s.quotationRef ?? "", width: 150, priority: 3,
      cell: (_v, s) => s.quotationRef
        ? <EntityCode type="quotation" value={s.quotationRef} size="sm" truncate />
        : <span style={cellMuted}>—</span>,
    },
    {
      id: "status", header: "Status", accessor: () => "Finished", type: "status", width: 130, priority: 2,
      cell: () => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.green, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.20)", borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>
          <PackageCheck size={12} /> Finished
        </span>
      ),
    },
  ];

  return (
    <div style={{ border: `1px solid ${C.bdr}`, borderRadius: 12, background: C.ivory, boxShadow: "0 2px 8px rgba(74,6,27,0.04)", overflow: "hidden" }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3">
        <div className="relative w-full sm:max-w-[320px]">
          <Search size={15} color={C.muted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search saree, design, weaver, batch…"
            aria-label="Search sarees awaiting dispatch"
            style={{ width: "100%", height: 38, paddingLeft: 34, paddingRight: 12, borderRadius: 10, border: `1px solid ${C.bdr}`, background: "#FFF", fontFamily: F.u, fontSize: 13, color: C.text, outline: "none" }}
          />
        </div>
        <div style={{ ...cellMuted, fontWeight: 600 }}>
          {rows.length} of {sarees.length} saree{sarees.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="w-full overflow-x-auto section-nav-scroll">
        <DataTable
          responsive
          columns={columns}
          data={pag.pageItems}
          getRowId={s => s.id}
          loading={loading}
          error={error}
          onRetry={onRetry}
          isFiltered={query.trim().length > 0}
          onClearFilters={() => setQuery("")}
          emptyTitle="No sarees awaiting dispatch."
          emptyDescription="Sarees appear here once finishing hands them back."
        />
      </div>

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
            itemLabel="sarees"
          />
        </div>
      )}
    </div>
  );
}
