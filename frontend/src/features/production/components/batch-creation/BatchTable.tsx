import {
  Users, Tag, ShoppingBag, Trash2 as Trash, Factory, ArrowUpNarrowWide as SortAscending,
} from "lucide-react";
import { SareeRow } from "../../contexts/BatchContext";
import { T, F, rowComplete, Pip, EmptyCell } from "./constants";
import type { ActivePicker } from "./types";
import type { WeaverOption, LoomOption } from "../useBatchFormHandlers";
import { pipColor } from "./PickerModals";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

// ── Status dot per row ────────────────────────────────────────────────────────
function StatusDot({ row }: { row: SareeRow }) {
  const complete = rowComplete(row);
  const empty = !row.weaverId && !row.factoryLoomId && !row.sareeTypeCode;
  const color = complete ? T.green : empty ? T.taupe : T.amber;
  const title = complete ? "Complete" : empty ? "Not started" : "Partially filled";
  return <div title={title} style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

export function BatchTable({
  rows, displayRows, selected, toggleAll: _toggleAll, toggleRow, allSelected: _allSelected,
  sortBy, setSortBy, searchFilter, setSearchFilter, weaverFilter, setWeaverFilter,
  sareeTypeFilter, setSareeTypeFilter, orderFilter, setOrderFilter,
  weaverOptions, orderOptions, sareeTypeOptions,
  completeRows, incompleteRows, setPicker, removeSelected, batchId,
  issueRecords, bulkOrders,
  setViewSareeRow, setViewFactoryLoom, setViewWeaver, setViewBulkOrder,
  setLoomPickerRow, openSareeTypeCard, weavers, looms,
}: {
  weavers: WeaverOption[];
  looms: LoomOption[];
  rows: SareeRow[];
  displayRows: SareeRow[];
  selected: Set<number>;
  toggleAll: () => void;
  toggleRow: (serial: number) => void;
  allSelected: boolean;
  sortBy: "serial" | "weaver" | "factoryLoom";
  setSortBy: (v: "serial" | "weaver" | "factoryLoom") => void;
  searchFilter: string;
  setSearchFilter: (v: string) => void;
  weaverFilter: string;
  setWeaverFilter: (v: string) => void;
  sareeTypeFilter: string;
  setSareeTypeFilter: (v: string) => void;
  orderFilter: string;
  setOrderFilter: (v: string) => void;
  weaverOptions: (string | undefined)[];
  orderOptions: (string | undefined)[];
  sareeTypeOptions: (string | undefined)[];
  completeRows: SareeRow[];
  incompleteRows: SareeRow[];
  setPicker: (p: ActivePicker) => void;
  removeSelected: () => void;
  batchId: string;
  issueRecords: any[];
  bulkOrders: any[];
  setViewSareeRow: (r: SareeRow) => void;
  setViewFactoryLoom: (l: LoomOption) => void;
  setViewWeaver: (w: WeaverOption) => void;
  setViewBulkOrder: (o: any) => void;
  setLoomPickerRow: (r: SareeRow) => void;
  openSareeTypeCard: (code: string) => void;
}) {
  function handleSelectionChange(next: Set<string>) {
    displayRows.forEach(row => {
      const now = next.has(String(row.serial));
      const was = selected.has(row.serial);
      if (now !== was) toggleRow(row.serial);
    });
  }

  const columns: ColumnDef<SareeRow>[] = [
    { id: "serial", header: "#", accessor: r => r.serial, cell: v => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, width: 40, display: "inline-block" }}>{v as number}</span> },
    {
      id: "sareeId", header: "Saree ID", accessor: r => r.sareeId,
      cell: (_v, row) => (
        <div style={{ minWidth: 120 }}>
          {row.sareeId ? (
            <Button onClick={() => setViewSareeRow(row)} variant="link"
              className="font-code text-xs font-bold text-[#6E0F2D] bg-[rgba(110,15,45,0.08)] rounded-[6px] px-[9px] py-[3px] no-underline hover:no-underline">
              {row.sareeId}
            </Button>
          ) : (
            <span style={{ color: "rgba(139,112,96,0.4)", fontSize: 12 }}>— assign weaver</span>
          )}
        </div>
      ),
    },
    {
      id: "weaverLoom", header: "Weaver / Factory Loom", accessor: r => r.weaverId || r.factoryLoomId,
      cell: (_v, row) => {
        const weaverForRow = row.weaverId ? weavers.find(x => x.id === row.weaverId) : undefined;
        return (
          <div style={{ minWidth: 150 }}>
            {row.recipientType === "factoryLoom" && row.factoryLoomId ? (
              <Button onClick={() => {
                const l = looms.find(x => x.id === row.factoryLoomId);
                if (l) setViewFactoryLoom(l);
              }}
                variant="link" className="flex items-center gap-[7px] p-0 no-underline hover:no-underline">
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Factory size={12} color={T.royalBurgundy} />
                </div>
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, textDecoration: "underline", textDecorationColor: "rgba(110,15,45,0.2)" }}>{row.factoryLoomNumber}</span>
              </Button>
            ) : row.weaverId ? (
              <Button onClick={() => { if (weaverForRow) setViewWeaver(weaverForRow); }}
                variant="link" className="flex items-center gap-[7px] p-0 no-underline hover:no-underline" disabled={!weaverForRow}>
                <Pip initials={weaverForRow?.initials ?? row.weaverInitials ?? "?"} bg={pipColor(row.weaverId)} size={22} />
                <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, textDecoration: weaverForRow ? "underline" : "none", textDecorationColor: "rgba(110,15,45,0.2)" }}>
                  {weaverForRow?.name ?? row.weaverName ?? row.weaverId}
                </span>
              </Button>
            ) : <EmptyCell />}
          </div>
        );
      },
    },
    {
      id: "loomNo", header: "Loom No.", accessor: r => r.weaverLoom,
      cell: (_v, row) => (
        <div style={{ minWidth: 90 }}>
          {row.recipientType === "factoryLoom" ? (
            <EmptyCell />
          ) : row.weaverId ? (
            <Button onClick={() => setLoomPickerRow(row)}
              variant="link" className="font-code text-xs font-bold text-[#C89B47] bg-[rgba(200,155,71,0.08)] border border-[rgba(200,155,71,0.22)] rounded-[6px] px-[9px] py-[3px] no-underline hover:no-underline">
              {row.weaverLoom ? `Loom ${row.weaverLoom}` : "— select loom"}
            </Button>
          ) : <EmptyCell />}
        </div>
      ),
    },
    {
      id: "sareeType", header: "Saree Type", accessor: r => r.sareeTypeCode,
      cell: (_v, row) => (
        <div style={{ minWidth: 110 }}>
          {row.sareeTypeCode ? (
            <Button onClick={() => openSareeTypeCard(row.sareeTypeCode!)}
              variant="link" className="font-code text-xs font-bold text-[#8B6018] bg-[rgba(200,155,71,0.12)] border border-[rgba(200,155,71,0.30)] rounded-[6px] px-[9px] py-[3px] no-underline hover:no-underline">
              {row.sareeTypeCode}
            </Button>
          ) : <EmptyCell />}
        </div>
      ),
    },
    {
      id: "bulkOrder", header: "Bulk Order", accessor: r => r.bulkOrderLabel,
      cell: (_v, row) => (
        <div style={{ minWidth: 140 }}>
          {row.bulkOrderLabel ? (
            <Button onClick={() => {
              const bo = bulkOrders.find(x => x.ref === row.bulkOrderRef);
              if (bo) setViewBulkOrder(bo);
            }}
              variant="link" className={`p-0 text-xs font-semibold ${row.bulkOrderRef ? "text-[#6E0F2D]" : "text-[#1E6640]"}`}>
              {row.bulkOrderLabel}
            </Button>
          ) : <EmptyCell />}
        </div>
      ),
    },
    {
      id: "materials", header: "Materials Given", accessor: () => null,
      mergeKey: row => row.weaverId || row.factoryLoomId || null,
      cell: (_v, row) => {
        const materialsSummary = (row.weaverId || row.factoryLoomId)
          ? issueRecords
              .filter(r => r.batchId === batchId && r.status !== "cancelled" && (
                row.weaverId ? r.weaverId === row.weaverId : r.factoryLoomId === row.factoryLoomId
              ))
              .flatMap(r => r.materials)
              .reduce((acc: Record<string, { qty: number; unit: string }>, m: any) => {
                if (!acc[m.materialType]) acc[m.materialType] = { qty: 0, unit: m.unit };
                acc[m.materialType].qty += m.quantity;
                return acc;
              }, {})
          : null;
        const materialsText = materialsSummary && Object.keys(materialsSummary).length > 0
          ? Object.entries(materialsSummary).map(([type, v]: [string, any]) => `${type}: ${v.qty}${v.unit}`).join(", ")
          : null;
        return (
          <div style={{ minWidth: 170 }}>
            {materialsText ? (
              <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{materialsText}</span>
            ) : <EmptyCell />}
          </div>
        );
      },
    },
    { id: "status", header: "", align: "end", accessor: () => null, cell: (_v, row) => <StatusDot row={row} /> },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(74,6,27,0.05)", marginBottom: 20 }}>

      {/* Table header + action bar */}
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>
            {rows.length} Sarees
          </div>
          <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(30,102,64,0.08)", color: T.green, border: "1px solid rgba(30,102,64,0.20)", borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>
            {completeRows.length} complete
          </span>
          {incompleteRows.length > 0 && (
            <span style={{ fontFamily: F.ui, fontSize: 12, background: "rgba(183,121,31,0.10)", color: T.amber, border: "1px solid rgba(183,121,31,0.25)", borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>
              {incompleteRows.length} incomplete
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
            <SortAscending size={14} color={T.taupe} />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Sort by</span>
            <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)} size="sm" className="h-[30px] w-auto min-w-[130px]">
              <SelectItem value="serial">Default (#)</SelectItem>
              <SelectItem value="weaver">Weaver</SelectItem>
              <SelectItem value="factoryLoom">Factory Loom</SelectItem>
            </Select>
          </div>
        </div>
        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{selected.size} selected</span>
            {([
              { key: "weaver",     icon: Users,       label: "Assign Weaver" },
              { key: "bulkorder",  icon: ShoppingBag, label: "Assign Bulk Order" },
              { key: "factoryloom", icon: Factory,     label: "Assign Factory Loom" },
              { key: "design",     icon: Tag,          label: "Assign Design Code" },
              { key: "saretype",   icon: Tag,          label: "Assign Saree Type" },
            ] as const).map(a => (
              <Button key={a.key} onClick={() => setPicker(a.key as ActivePicker)} variant="primary" size="sm" iconLeft={a.icon}>
                {a.label}
              </Button>
            ))}
            <Button onClick={removeSelected} variant="danger-subtle" size="sm" iconLeft={Trash}>
              Remove Row(s)
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ padding: "12px 24px 16px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <SearchInput value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="Search Saree ID, Weaver..." className="flex-1 min-w-[200px]" />
        <Select value={weaverFilter} onValueChange={setWeaverFilter} size="sm" className="w-auto min-w-[140px]">
          {weaverOptions.map(w => <SelectItem key={w as string} value={w as string}>{w === "All" ? "All Weavers" : w as string}</SelectItem>)}
        </Select>
        <Select value={sareeTypeFilter} onValueChange={setSareeTypeFilter} size="sm" className="w-auto min-w-[140px]">
          {sareeTypeOptions.map(w => <SelectItem key={w as string} value={w as string}>{w === "All" ? "All Saree Types" : w as string}</SelectItem>)}
        </Select>
        <Select value={orderFilter} onValueChange={setOrderFilter} size="sm" className="w-auto min-w-[140px]">
          {orderOptions.map(o => <SelectItem key={o as string} value={o as string}>{o === "All" ? "All Orders" : o as string}</SelectItem>)}
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={displayRows}
        getRowId={row => String(row.serial)}
        selectedIds={new Set(Array.from(selected).map(String))}
        onSelectionChange={handleSelectionChange}
        rowClassName={row => selected.has(row.serial)
          ? "bg-[rgba(110,15,45,0.04)]"
          : displayRows.indexOf(row) % 2 === 0 ? "bg-white" : "bg-[rgba(247,242,234,0.5)]"}
      />
    </div>
  );
}
