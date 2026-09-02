import React, { useMemo, useState } from "react";
import { ChevronRight, Package, Scale } from "lucide-react";
import { C, F } from "../tokens";
import { formatWeight, type SareeDetail } from "./sareeDetails";
import { type FinishingTableRow } from "./FinishingSareeTable";
import { DataTable, ViewToggle, type ColumnDef } from "../../../../../shared/ui/data";

// ── Grouping tables for both finishing queues ────────────────────────────────
// A card used to carry a name and a count and nothing else, which made the
// grouping tabs a guessing game. Each row now states the batches, saree types
// and total weight behind it, so the drill-down is an informed choice. Backed
// by the shared DataTable so a Table/Card toggle comes for free.

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(p => p[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function uniq(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((v): v is string => !!v && v !== "—")));
}

function detailOf(r: FinishingTableRow): Partial<SareeDetail> {
  return r.detail ?? {};
}

function typesOf(rows: FinishingTableRow[]) {
  return uniq(rows.map(r => r.detail?.sareeTypeCode ?? r.fallbackTypeCode));
}

function batchesOf(rows: FinishingTableRow[]) {
  return uniq(rows.map(r => r.detail?.batchId ?? r.fallbackBatchId));
}

function loomsOf(rows: FinishingTableRow[]) {
  return uniq(rows.map(r => detailOf(r).loomLabel));
}

function totalWeightOf(rows: FinishingTableRow[]) {
  return rows.reduce((sum, r) => sum + (r.detail?.weightG ?? 0), 0);
}

function TypePills({ rows }: { rows: FinishingTableRow[] }) {
  const types = typesOf(rows);
  if (types.length === 0) return <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>—</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
      {types.slice(0, 3).map(t => (
        <span key={t} style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#845E04", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.28)", borderRadius: 999, padding: "1px 7px" }}>{t}</span>
      ))}
      {types.length > 3 && <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>+{types.length - 3}</span>}
    </div>
  );
}

function Facts({ rows }: { rows: FinishingTableRow[] }) {
  const batches = batchesOf(rows);
  const looms = loomsOf(rows);
  const totalWeight = totalWeightOf(rows);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontFamily: F.u, fontSize: 11, color: C.muted }}>
      {batches.length > 0 && <span>{batches.length} batch{batches.length === 1 ? "" : "es"}</span>}
      {looms.length > 0 && <span>· {looms.length === 1 ? looms[0] : `${looms.length} looms`}</span>}
      {totalWeight > 0 && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
          · <Scale size={10} /> {formatWeight(totalWeight)}
        </span>
      )}
      {batches.length === 0 && looms.length === 0 && totalWeight === 0 && "—"}
    </div>
  );
}

const PILL = (fg: string, bg: string, bd: string): React.CSSProperties => ({
  fontFamily: F.u, fontSize: 12, fontWeight: 700, color: fg, background: bg,
  border: `1px solid ${bd}`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap",
});

interface PersonGroup { name: string; rows: FinishingTableRow[]; }
interface BatchGroupItem { id: string; rows: FinishingTableRow[]; }

function buildPersonColumns(gradient: string, badgeWord: string, badgeStyle: React.CSSProperties): ColumnDef<PersonGroup>[] {
  return [
    {
      id: "name",
      header: "Name",
      accessor: g => g.name,
      priority: 1,
      sortable: true,
      cell: (_v, g) => {
        const code = g.rows.find(r => r.detail?.weaverCode)?.detail?.weaverCode;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{initials(g.name)}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
              {code && <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{code}</div>}
            </div>
          </div>
        );
      },
    },
    {
      id: "types",
      header: "Saree Types",
      accessor: g => typesOf(g.rows).join(", "),
      priority: 2,
      cell: (_v, g) => <TypePills rows={g.rows} />,
    },
    {
      id: "facts",
      header: "Batches / Looms / Weight",
      accessor: g => `${batchesOf(g.rows).length} batches`,
      priority: 2,
      cell: (_v, g) => <Facts rows={g.rows} />,
    },
    {
      id: "count",
      header: "Ready",
      accessor: g => g.rows.length,
      type: "number",
      sortable: true,
      priority: 2,
      cell: (_v, g) => <span style={badgeStyle}>{g.rows.length} {badgeWord}</span>,
    },
    {
      id: "actions",
      header: "",
      type: "actions",
      accessor: () => null,
      priority: 3,
      exportable: false,
      cell: () => <ChevronRight size={15} color={C.muted} style={{ flexShrink: 0 }} />,
    },
  ];
}

function buildBatchColumns(
  badgeWord: string,
  badgeStyle: React.CSSProperties,
  secondaryLabel: (rows: FinishingTableRow[]) => string
): ColumnDef<BatchGroupItem>[] {
  return [
    {
      id: "id",
      header: "Batch",
      accessor: g => g.id,
      priority: 1,
      sortable: true,
      cell: (_v, g) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Package size={15} color="#8B6018" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.id}</div>
            <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{secondaryLabel(g.rows)}</div>
          </div>
        </div>
      ),
    },
    {
      id: "types",
      header: "Saree Types",
      accessor: g => typesOf(g.rows).join(", "),
      priority: 2,
      cell: (_v, g) => <TypePills rows={g.rows} />,
    },
    {
      id: "facts",
      header: "Batches / Looms / Weight",
      accessor: g => `${batchesOf(g.rows).length} batches`,
      priority: 2,
      cell: (_v, g) => <Facts rows={g.rows} />,
    },
    {
      id: "count",
      header: "Ready",
      accessor: g => g.rows.length,
      type: "number",
      sortable: true,
      priority: 2,
      cell: (_v, g) => <span style={badgeStyle}>{g.rows.length} {badgeWord}</span>,
    },
    {
      id: "actions",
      header: "",
      type: "actions",
      accessor: () => null,
      priority: 3,
      exportable: false,
      cell: () => <ChevronRight size={15} color={C.muted} style={{ flexShrink: 0 }} />,
    },
  ];
}

/** Grouped by whoever wove the saree (weaver or factory loom). */
export function PersonGroupGrid({ groups, onSelect, badgeWord, gradient, badgeStyle }: {
  groups: PersonGroup[];
  onSelect: (name: string) => void;
  isDesktop?: boolean; isTablet?: boolean;
  badgeWord: string;
  gradient: string;
  badgeStyle: React.CSSProperties;
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const columns = useMemo(() => buildPersonColumns(gradient, badgeWord, badgeStyle), [gradient, badgeWord, badgeStyle]);

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
        emptyTitle="No weavers yet"
      />
    </div>
  );
}

/** Grouped by production batch. */
export function BatchGroupGrid({ groups, onSelect, badgeWord, badgeStyle, secondaryLabel }: {
  groups: BatchGroupItem[];
  onSelect: (id: string) => void;
  isDesktop?: boolean; isTablet?: boolean;
  badgeWord: string;
  badgeStyle: React.CSSProperties;
  /** How the people line is described — "weaver" for assign, "staff" for receive. */
  secondaryLabel: (rows: FinishingTableRow[]) => string;
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const columns = useMemo(() => buildBatchColumns(badgeWord, badgeStyle, secondaryLabel), [badgeWord, badgeStyle, secondaryLabel]);

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

export const READY_PILL = PILL("#1F774E", "rgba(30,102,64,0.09)", "rgba(30,102,64,0.20)");
export const AWAITING_PILL = PILL("#8D5802", "rgba(200,155,71,0.14)", "rgba(200,155,71,0.32)");
