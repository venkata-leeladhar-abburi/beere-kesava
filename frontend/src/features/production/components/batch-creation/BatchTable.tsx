import React from "react";
import {
  Users, Tag, ShoppingBag, Trash2 as Trash, Factory, ArrowUpNarrowWide as SortAscending,
  Send as PaperPlaneTilt,
} from "lucide-react";
import { SareeRow } from "../../contexts/BatchContext";
import { DispatchRecord } from "../../../design-library/contexts/DesignLibraryContext";
import { T, F, th, td, rowComplete, Pip, EmptyCell } from "./constants";
import type { ActivePicker } from "./types";
import type { WeaverOption, LoomOption } from "../useBatchFormHandlers";
import { pipColor } from "./PickerModals";
import { Button, Checkbox, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";

// ── Status dot per row ────────────────────────────────────────────────────────
function StatusDot({ row }: { row: SareeRow }) {
  const complete = rowComplete(row);
  const empty = !row.weaverId && !row.factoryLoomId && !row.sareeTypeCode;
  const color = complete ? T.green : empty ? T.taupe : T.amber;
  const title = complete ? "Complete" : empty ? "Not started" : "Partially filled";
  return <div title={title} style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

export function BatchTable({
  rows, displayRows, selected, toggleAll, toggleRow, allSelected,
  sortBy, setSortBy, searchFilter, setSearchFilter, weaverFilter, setWeaverFilter,
  sareeTypeFilter, setSareeTypeFilter, orderFilter, setOrderFilter,
  weaverOptions, orderOptions, sareeTypeOptions,
  completeRows, incompleteRows, setPicker, removeSelected, batchId,
  dispatches, issueRecords, bulkOrders,
  setViewSareeRow, setViewFactoryLoom, setViewWeaver, setViewDispatches, setViewBulkOrder,
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
  dispatches: DispatchRecord[];
  issueRecords: any[];
  bulkOrders: any[];
  setViewSareeRow: (r: SareeRow) => void;
  setViewFactoryLoom: (l: LoomOption) => void;
  setViewWeaver: (w: WeaverOption) => void;
  setViewDispatches: (v: { weaverName: string; records: DispatchRecord[] } | null) => void;
  setViewBulkOrder: (o: any) => void;
  setLoomPickerRow: (r: SareeRow) => void;
  openSareeTypeCard: (code: string) => void;
}) {
  // ── Merge "Materials Given" cell across consecutive rows for the same weaver/factory loom
  const materialsCellSpan: Record<number, number> = {}; // serial -> rowSpan (only set for the first row of a run)
  {
    let i = 0;
    while (i < displayRows.length) {
      const key = displayRows[i].weaverId || displayRows[i].factoryLoomId || null;
      let span = 1;
      if (key) {
        while (i + span < displayRows.length && (displayRows[i + span].weaverId || displayRows[i + span].factoryLoomId) === key) {
          span++;
        }
      }
      materialsCellSpan[displayRows[i].serial] = span;
      i += span;
    }
  }

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
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ background: T.warmCream }}>
              <th style={th}>
                <Checkbox checked={allSelected} onCheckedChange={() => toggleAll()} aria-label="Select all rows" />
              </th>
              {["#", "Saree ID", "Weaver / Factory Loom", "Design Dispatch", "Loom No.", "Saree Type", "Bulk Order", "Materials Given", ""].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, idx) => {
              const isSelected = selected.has(row.serial);
              const weaverForRow = row.weaverId ? weavers.find(x => x.id === row.weaverId) : undefined;
              const rowDispatches = row.weaverId
                ? dispatches.filter(d => d.recipientType === "weaver" && d.recipientId === row.weaverId && d.batches.includes(batchId))
                : [];
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
                <tr key={row.serial}
                  style={{ background: isSelected ? "rgba(110,15,45,0.04)" : idx % 2 === 0 ? "#fff" : "rgba(247,242,234,0.5)", borderBottom: `1px solid ${T.borderDef}` }}>
                  <td style={td}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(row.serial)} aria-label={`Select row ${row.serial}`} />
                  </td>
                  <td style={{ ...td, fontFamily: F.mono, fontSize: 12, color: T.taupe, width: 40 }}>{row.serial}</td>
                  <td style={{ ...td, minWidth: 120 }}>
                    {row.sareeId ? (
                      <Button onClick={() => setViewSareeRow(row)} variant="link"
                        className="font-code text-xs font-bold text-[#6E0F2D] bg-[rgba(110,15,45,0.08)] rounded-[6px] px-[9px] py-[3px] no-underline hover:no-underline">
                        {row.sareeId}
                      </Button>
                    ) : (
                      <span style={{ color: "rgba(139,112,96,0.4)", fontSize: 12 }}>— assign weaver</span>
                    )}
                  </td>
                  <td style={{ ...td, minWidth: 150 }}>
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
                    ) : row.weaverName ? (
                      <Button onClick={() => { if (weaverForRow) setViewWeaver(weaverForRow); }}
                        variant="link" className="flex items-center gap-[7px] p-0 no-underline hover:no-underline">
                        <Pip initials={row.weaverInitials!} bg={row.weaverId ? pipColor(row.weaverId) : T.taupe} size={22} />
                        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, textDecoration: "underline", textDecorationColor: "rgba(110,15,45,0.2)" }}>{row.weaverName}</span>
                      </Button>
                    ) : <EmptyCell />}
                  </td>
                  <td style={{ ...td, minWidth: 130 }}>
                    {rowDispatches.length > 0 ? (
                      <Button onClick={() => setViewDispatches({ weaverName: row.weaverName!, records: rowDispatches })}
                        variant="link" className="font-sans text-xs font-bold text-[#6E0F2D] bg-[rgba(110,15,45,0.08)] rounded-[6px] px-[9px] py-[3px] no-underline hover:no-underline">
                        <PaperPlaneTilt size={12} /> {rowDispatches.length} Dispatch{rowDispatches.length > 1 ? "es" : ""}
                      </Button>
                    ) : <EmptyCell />}
                  </td>
                  <td style={{ ...td, minWidth: 90 }}>
                    {row.recipientType === "factoryLoom" ? (
                      <EmptyCell />
                    ) : row.weaverId ? (
                      <Button onClick={() => setLoomPickerRow(row)}
                        variant="link" className="font-code text-xs font-bold text-[#C89B47] bg-[rgba(200,155,71,0.08)] border border-[rgba(200,155,71,0.22)] rounded-[6px] px-[9px] py-[3px] no-underline hover:no-underline">
                        {row.weaverLoom ? `Loom ${row.weaverLoom}` : "— select loom"}
                      </Button>
                    ) : <EmptyCell />}
                  </td>

                  <td style={{ ...td, minWidth: 110 }}>
                    {row.sareeTypeCode ? (
                      <Button onClick={() => openSareeTypeCard(row.sareeTypeCode!)}
                        variant="link" className="font-code text-xs font-bold text-[#8B6018] bg-[rgba(200,155,71,0.12)] border border-[rgba(200,155,71,0.30)] rounded-[6px] px-[9px] py-[3px] no-underline hover:no-underline">
                        {row.sareeTypeCode}
                      </Button>
                    ) : <EmptyCell />}
                  </td>
                  <td style={{ ...td, minWidth: 140 }}>
                    {row.bulkOrderLabel ? (
                      <Button onClick={() => {
                        const bo = bulkOrders.find(x => x.ref === row.bulkOrderRef);
                        if (bo) setViewBulkOrder(bo);
                      }}
                        variant="link" className={`p-0 text-xs font-semibold ${row.bulkOrderRef ? "text-[#6E0F2D]" : "text-[#1E6640]"}`}>
                        {row.bulkOrderLabel}
                      </Button>
                    ) : <EmptyCell />}
                  </td>
                  {materialsCellSpan[row.serial] !== undefined && (
                    <td style={{ ...td, minWidth: 170, verticalAlign: "middle" }} rowSpan={materialsCellSpan[row.serial]}>
                      {materialsText ? (
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown }}>{materialsText}</span>
                      ) : <EmptyCell />}
                    </td>
                  )}
                  <td style={{ ...td, width: 24 }}>
                    <StatusDot row={row} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
