import { useMemo, useState, type CSSProperties } from "react";
import { ChevronRight, Layers, Scale } from "lucide-react";
import { C, F } from "../tokens";
import { DataTable, ViewToggle, type ColumnDef } from "../../../../../shared/ui/data";
import { type FinishingTableRow } from "./FinishingSareeTable";
import { formatWeight } from "./sareeDetails";

export interface StaffGroup { name: string; rows: FinishingTableRow[]; }
export interface BatchGroup { id: string; rows: FinishingTableRow[]; }

// ── Table (default) / card grid for the Receive-back queue's grouping step.
// Used to be a hand-rolled div grid (FinishingGroupGrid's PersonGroupGrid /
// BatchGroupGrid). Both groupings now go through DataTable so the queue gets
// sortable columns, loading/empty states and a real table for free, with the
// original card look kept as the "Cards" view.

const AWAITING_PILL: CSSProperties = {
  fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#8D5802",
  background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.32)",
  borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(p => p[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function uniq(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((v): v is string => !!v && v !== "—")));
}

function facts(rows: FinishingTableRow[]) {
  const batches = uniq(rows.map(r => r.detail?.batchId ?? r.fallbackBatchId));
  const types = uniq(rows.map(r => r.detail?.sareeTypeCode ?? r.fallbackTypeCode));
  const looms = uniq(rows.map(r => r.detail?.loomLabel));
  const totalWeight = rows.reduce((sum, r) => sum + (r.detail?.weightG ?? 0), 0);
  return { batches, types, looms, totalWeight };
}

function FactsSummary({ rows }: { rows: FinishingTableRow[] }) {
  const { types, batches, looms, totalWeight } = facts(rows);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
      {types.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          <Layers size={11} color={C.muted} style={{ flexShrink: 0 }} />
          {types.slice(0, 3).map(t => (
            <span key={t} style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#845E04", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.28)", borderRadius: 999, padding: "1px 7px" }}>{t}</span>
          ))}
          {types.length > 3 && <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>+{types.length - 3}</span>}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontFamily: F.u, fontSize: 11, color: C.muted }}>
        {batches.length > 0 && <span>{batches.length} batch{batches.length === 1 ? "" : "es"}</span>}
        {looms.length > 0 && <span>· {looms.length === 1 ? looms[0] : `${looms.length} looms`}</span>}
        {totalWeight > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            · <Scale size={10} /> {formatWeight(totalWeight)}
          </span>
        )}
      </div>
    </div>
  );
}

function buildStaffColumns(): ColumnDef<StaffGroup>[] {
  return [
    {
      id: "name", header: "Finishing Staff", accessor: g => g.name, priority: 1, sortable: true,
      cell: (_v, g) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(100deg, #15603D 0%, #1F774E 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{initials(g.name)}</span>
          </div>
          <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
        </div>
      ),
    },
    {
      id: "code", header: "Weaver Code", priority: 2,
      accessor: g => g.rows.find(r => r.detail?.weaverCode)?.detail?.weaverCode ?? "",
      cell: v => v ? <span style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>{String(v)}</span> : <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>—</span>,
    },
    {
      id: "facts", header: "Batches / Types", priority: 3,
      accessor: g => facts(g.rows).types.join(", "),
      cell: (_v, g) => <FactsSummary rows={g.rows} />,
    },
    {
      id: "pending", header: "Awaiting", type: "number", priority: 2, sortable: true,
      accessor: g => g.rows.length,
      cell: v => <span style={AWAITING_PILL}>{String(v)} awaiting</span>,
    },
    {
      id: "actions", header: "", type: "actions", priority: 2, width: 40,
      accessor: () => null,
      cell: () => <ChevronRight size={15} color={C.muted} />,
    },
  ];
}

function buildBatchColumns(): ColumnDef<BatchGroup>[] {
  return [
    {
      id: "id", header: "Batch Group", accessor: g => g.id, priority: 1, sortable: true,
      cell: (_v, g) => <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.text }}>{g.id}</span>,
    },
    {
      id: "staff", header: "Finishing Staff", priority: 2,
      accessor: g => {
        const names = Array.from(new Set(g.rows.map(r => r.staffName).filter(Boolean) as string[]));
        return names.length === 1 ? names[0] : `${names.length} finishing staff`;
      },
      cell: (v) => <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{String(v)}</span>,
    },
    {
      id: "facts", header: "Batches / Types", priority: 3,
      accessor: g => facts(g.rows).types.join(", "),
      cell: (_v, g) => <FactsSummary rows={g.rows} />,
    },
    {
      id: "pending", header: "Awaiting", type: "number", priority: 2, sortable: true,
      accessor: g => g.rows.length,
      cell: v => <span style={AWAITING_PILL}>{String(v)} awaiting</span>,
    },
    {
      id: "actions", header: "", type: "actions", priority: 2, width: 40,
      accessor: () => null,
      cell: () => <ChevronRight size={15} color={C.muted} />,
    },
  ];
}

// ── Finishing-staff table/cards for the Receive-back queue.
export function ReceiveStaffGrid({ groups, onSelect }: {
  groups: StaffGroup[]; onSelect: (name: string) => void; isDesktop?: boolean; isTablet?: boolean;
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const columns = useMemo(() => buildStaffColumns(), []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>
      <DataTable
        columns={columns}
        data={groups}
        getRowId={g => g.name}
        view={viewMode}
        onRowClick={g => onSelect(g.name)}
        emptyTitle="No finishing staff yet"
      />
    </div>
  );
}

// ── Batch table/cards for the Receive-back queue.
export function ReceiveBatchGrid({ groups, onSelect }: {
  groups: BatchGroup[]; onSelect: (id: string) => void; isDesktop?: boolean; isTablet?: boolean;
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const columns = useMemo(() => buildBatchColumns(), []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>
      <DataTable
        columns={columns}
        data={groups}
        getRowId={g => g.id}
        view={viewMode}
        onRowClick={g => onSelect(g.id)}
        emptyTitle="No batches yet"
      />
    </div>
  );
}
