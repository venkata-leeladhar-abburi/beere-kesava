import React from "react";
import { CheckSquare, Square } from "lucide-react";
import { C, F } from "../tokens";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";
import { Pagination, usePagination } from "../../../../../shared/ui/DataPagination";
import { EntityCode } from "@/shared/ui/domain";
import { formatWeight, type SareeDetail } from "./sareeDetails";

// ── One saree table for both finishing queues ────────────────────────────────
// Assign and Receive-back used to render three stacked lines of text per saree
// (id / type / weaver) and nothing else — no loom, no design, no bulk order, no
// weight, no colour, and a saree type that printed its own code twice. Both now
// feed this table, so a worker sees the same complete row wherever they are.

export interface FinishingTableRow {
  /** Selection key — the saree id when assigning, the assignment id when receiving. */
  key: string;
  sareeId: string;
  detail?: SareeDetail;
  /** Used when the batch join hasn't resolved (batches still loading). */
  fallbackProducer?: string | null;
  fallbackTypeCode?: string | null;
  fallbackTypeName?: string | null;
  fallbackBatchId?: string | null;
  /** Finishing staff holding the saree — receive queue only. */
  staffName?: string | null;
  quotationRef?: string | null;
  date: string | null;
  status: { label: string; fg: string; bg: string; bd: string };
}

const chip = (fg: string, bg: string, bd: string): React.CSSProperties => ({
  fontFamily: F.u, fontSize: 12, fontWeight: 600, color: fg, background: bg,
  border: `1px solid ${bd}`, borderRadius: 8, padding: "3px 9px", whiteSpace: "nowrap",
});

const GOLD = chip("#845E04", "rgba(200,155,71,0.12)", "rgba(200,155,71,0.30)");
const WINE = chip(C.burg, "rgba(110,15,45,0.07)", "rgba(110,15,45,0.14)");

function Muted() {
  return <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>—</span>;
}

function producerOf(r: FinishingTableRow) {
  return r.detail?.producerName ?? (r.fallbackProducer && r.fallbackProducer !== "—" ? r.fallbackProducer : null);
}
function typeCodeOf(r: FinishingTableRow) {
  return r.detail?.sareeTypeCode ?? (r.fallbackTypeCode && r.fallbackTypeCode !== "—" ? r.fallbackTypeCode : null);
}
function typeNameOf(r: FinishingTableRow) {
  return r.detail?.sareeTypeName ?? (r.fallbackTypeName && r.fallbackTypeName !== "—" ? r.fallbackTypeName : null);
}
function batchOf(r: FinishingTableRow) {
  return r.detail?.batchId ?? (r.fallbackBatchId && r.fallbackBatchId !== "—" ? r.fallbackBatchId : null);
}

/** Everything a worker can search a saree by, flattened to one lowercase string. */
export function rowSearchText(r: FinishingTableRow): string {
  return [
    r.sareeId, producerOf(r), r.detail?.weaverCode, r.detail?.loomLabel,
    typeCodeOf(r), typeNameOf(r), batchOf(r), r.detail?.designCode,
    r.detail?.bulkOrderRef, r.detail?.color, r.staffName, r.quotationRef,
  ].filter(Boolean).join(" ").toLowerCase();
}

function buildColumns(
  showStaff: boolean,
  dateHeader: string,
  fmtDate: (v: string | null) => string,
): ColumnDef<FinishingTableRow>[] {
  const cols: ColumnDef<FinishingTableRow>[] = [
    {
      id: "sareeId", header: "Saree ID", accessor: r => r.sareeId, priority: 1, sortable: true,
      cell: (_v, r) => <EntityCode type="saree" value={r.sareeId} size="sm" copyable />,
    },
    {
      id: "producer", header: "Weaver / Loom", accessor: r => producerOf(r) ?? "", priority: 2, sortable: true,
      cell: (_v, r) => {
        const name = producerOf(r);
        if (!name) return <Muted />;
        return (
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, whiteSpace: "nowrap" }}>{name}</span>
            {r.detail?.weaverCode && (
              <span style={{ fontFamily: F.m, fontSize: 10, color: C.muted, whiteSpace: "nowrap" }}>{r.detail.weaverCode}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "loom", header: "Loom No.", accessor: r => r.detail?.loomLabel ?? "", priority: 3,
      cell: (_v, r) => r.detail?.loomLabel ? <span style={WINE}>{r.detail.loomLabel}</span> : <Muted />,
    },
    {
      id: "batch", header: "Batch", accessor: r => batchOf(r) ?? "", priority: 3, sortable: true,
      cell: (_v, r) => {
        const b = batchOf(r);
        return b ? <EntityCode type="batch" value={b} size="sm" /> : <Muted />;
      },
    },
    {
      id: "sareeType", header: "Saree Type", accessor: r => typeCodeOf(r) ?? typeNameOf(r) ?? "", priority: 3, sortable: true,
      cell: (_v, r) => {
        const code = typeCodeOf(r);
        const name = typeNameOf(r);
        if (!code && !name) return <Muted />;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
            {code && <span style={GOLD}>{code}</span>}
            {name && name.toLowerCase() !== (code ?? "").toLowerCase() && (
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{name}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "bulkOrder", header: "Bulk Order", accessor: r => r.detail?.bulkOrderRef ?? "", priority: 3,
      cell: (_v, r) => r.detail?.bulkOrderRef
        ? <span style={{ fontFamily: F.u, fontSize: 12, color: C.burg }}>{r.detail.bulkOrderRef}</span>
        : <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>General stock</span>,
    },
    {
      id: "weight", header: "Weight", accessor: r => r.detail?.weightG ?? 0, align: "end", priority: 3, sortable: true,
      cell: (_v, r) => (
        <span style={{ fontFamily: F.u, fontSize: 12, color: r.detail?.weightG != null ? C.text : C.muted, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {formatWeight(r.detail?.weightG)}
        </span>
      ),
    },
    {
      id: "color", header: "Colour", accessor: r => r.detail?.color ?? "", priority: 3,
      cell: (_v, r) => r.detail?.color
        ? <span style={{ fontFamily: F.u, fontSize: 12, color: C.text, whiteSpace: "nowrap" }}>{r.detail.color}</span>
        : <Muted />,
    },
  ];

  if (showStaff) {
    cols.push({
      id: "staff", header: "Finishing Staff", accessor: r => r.staffName ?? "", priority: 2, sortable: true,
      cell: (_v, r) => r.staffName
        ? <span style={{ fontFamily: F.u, fontSize: 13, color: C.text, whiteSpace: "nowrap" }}>{r.staffName}</span>
        : <Muted />,
    });
  }

  cols.push(
    {
      id: "date", header: dateHeader, accessor: r => r.date ?? "", priority: 3, sortable: true,
      cell: (_v, r) => (
        <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {fmtDate(r.date)}
        </span>
      ),
    },
    {
      id: "status", header: "Status", accessor: r => r.status.label, type: "status", priority: 1,
      cell: (_v, r) => (
        <span style={{ ...chip(r.status.fg, r.status.bg, r.status.bd), borderRadius: 999 }}>{r.status.label}</span>
      ),
    },
  );

  return cols;
}

/** Mobile card — the same fields as a table row, stacked. */
function SareeCard({ r, selected, onToggle, accent, fmtDate, dateHeader }: {
  r: FinishingTableRow; selected: boolean; onToggle: () => void; accent: string;
  fmtDate: (v: string | null) => string; dateHeader: string;
}) {
  const producer = producerOf(r);
  const code = typeCodeOf(r);
  const name = typeNameOf(r);
  const batch = batchOf(r);
  const facts: [string, React.ReactNode][] = [
    ["Weaver / Loom", producer ? `${producer}${r.detail?.weaverCode ? ` (${r.detail.weaverCode})` : ""}` : "—"],
    ["Loom No.", r.detail?.loomLabel ?? "—"],
    ["Batch", batch ?? "—"],
    ["Saree Type", [code, name && name.toLowerCase() !== (code ?? "").toLowerCase() ? name : null].filter(Boolean).join(" · ") || "—"],
    ["Bulk Order", r.detail?.bulkOrderRef ?? "General stock"],
    ["Weight", formatWeight(r.detail?.weightG)],
    ["Colour", r.detail?.color ?? "—"],
    ...(r.staffName ? ([["Finishing Staff", r.staffName]] as [string, React.ReactNode][]) : []),
    [dateHeader, fmtDate(r.date)],
  ];

  return (
    <div
      role="button" tabIndex={0} aria-pressed={selected}
      onClick={onToggle}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      style={{
        background: selected ? "linear-gradient(135deg,#FFFDF9 0%,#FDF6EA 100%)" : "#FFF",
        border: `1.5px solid ${selected ? accent : C.bdr}`,
        borderRadius: 16, padding: 13, cursor: "pointer",
        boxShadow: selected ? `0 4px 16px ${accent}22` : "0 2px 10px rgba(0,0,0,0.04)",
        transition: "all 0.18s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span style={{ color: selected ? accent : "rgba(110,15,45,0.28)", flexShrink: 0, display: "flex" }}>
            {selected ? <CheckSquare size={19} /> : <Square size={19} />}
          </span>
          <EntityCode type="saree" value={r.sareeId} size="sm" />
        </div>
        <span style={{ ...chip(r.status.fg, r.status.bg, r.status.bd), borderRadius: 999, fontSize: 11 }}>{r.status.label}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 10px", padding: "10px 12px", background: C.bg, borderRadius: 12, border: `1px solid ${C.bdr}` }}>
        {facts.map(([label, value]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <div style={{ fontFamily: F.u, fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
          </div>
        ))}
      </div>

      {r.quotationRef && (
        <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>Quotation</span>
          <span style={{ ...GOLD, borderRadius: 999, fontSize: 11 }}>{r.quotationRef}</span>
        </div>
      )}
    </div>
  );
}

export function FinishingSareeTable({
  rows, selected, onToggle, onSelectionChange, accent, dateHeader, fmtDate,
  showStaff = false, isMobile, emptyTitle, emptyDescription, isFiltered, onClearFilters,
  loading, error, onRetry,
}: {
  rows: FinishingTableRow[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onSelectionChange: (keys: Set<string>) => void;
  accent: string;
  dateHeader: string;
  fmtDate: (v: string | null) => string;
  showStaff?: boolean;
  isMobile?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  isFiltered?: boolean;
  onClearFilters?: () => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const pag = usePagination(rows, 10);

  const columns = React.useMemo(
    () => buildColumns(showStaff, dateHeader, fmtDate),
    [showStaff, dateHeader, fmtDate],
  );

  if (isMobile) {
    if (loading || error || rows.length === 0) {
      return (
        <DataTable
          columns={columns} data={rows} getRowId={r => r.key}
          loading={loading} error={error} onRetry={onRetry}
          isFiltered={isFiltered} onClearFilters={onClearFilters}
          emptyTitle={emptyTitle} emptyDescription={emptyDescription}
        />
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pag.pageItems.map(r => (
          <SareeCard key={r.key} r={r} selected={selected.has(r.key)} onToggle={() => onToggle(r.key)}
            accent={accent} fmtDate={fmtDate} dateHeader={dateHeader} />
        ))}
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
    );
  }

  return (
    <div data-pagination-target style={{ border: `1px solid ${C.bdr}`, borderRadius: 14, overflow: "hidden", background: "#FFF" }}>
      <div className="overflow-x-auto section-nav-scroll">
        <div className="min-w-[980px]">
          <DataTable
            columns={columns}
            data={pag.pageItems}
            getRowId={r => r.key}
            selectedIds={selected}
            onSelectionChange={onSelectionChange}
            onRowClick={r => onToggle(r.key)}
            rowClassName={r => (selected.has(r.key) ? "bk-finishing-row-selected" : undefined)}
            loading={loading}
            error={error}
            onRetry={onRetry}
            isFiltered={isFiltered}
            onClearFilters={onClearFilters}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            pagination={false}
          />
        </div>
      </div>
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
      <style>{`.bk-finishing-row-selected { background: ${accent}0D !important; }`}</style>
    </div>
  );
}

