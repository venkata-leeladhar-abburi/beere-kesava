import React from "react";
import {
  Users, Tag, ShoppingBag, Trash2 as Trash, Factory, ArrowUpNarrowWide as SortAscending, Table2, PackageCheck,
} from "lucide-react";
import { SareeRow } from "../../contexts/BatchContext";
import { T, F, th, td, rowComplete, Pip, EmptyCell } from "./constants";
import type { ActivePicker } from "./types";
import type { WeaverOption, LoomOption } from "../useBatchFormHandlers";
import { pipColor } from "./PickerModals";
import { Button, Checkbox, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { SectionCard } from "../common/primitives";
import type { MaterialIssueRecord } from "@/features/materials";
import type { BulkOrder } from "@/features/bulk-orders";

// ── Status dot per row ────────────────────────────────────────────────────────
function StatusDot({ row }: { row: SareeRow }) {
  const complete = rowComplete(row);
  const empty = !row.weaverId && !row.factoryLoomId && !row.sareeTypeCode;
  const color = complete ? T.green : empty ? T.taupe : T.amber;
  const title = complete ? "Complete" : empty ? "Not started" : "Partially filled";
  return <div title={title} style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

// ── Materials Given panel ───────────────────────────────────────────────────
// Rendered once per weaver+loom (or factory loom), not once per saree row —
// a card grid rather than a table cell, so a group's materials appear a
// single time no matter how many sarees that loom is weaving in this batch.
function MaterialsGivenPanel({
  rows, issueRecords, batchId, weavers,
}: {
  rows: SareeRow[];
  issueRecords: MaterialIssueRecord[];
  batchId: string;
  weavers: WeaverOption[];
}) {
  const groupKey = (row: SareeRow) =>
    row.weaverId ? `w::${row.weaverId}::${row.weaverLoom ?? ""}` : row.factoryLoomId ? `f::${row.factoryLoomId}` : null;

  const groups: SareeRow[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const key = groupKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    groups.push(row);
  }

  if (groups.length === 0) {
    return (
      <div style={{ padding: "18px 4px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
        Assign a weaver or factory loom to a saree to see materials issued here.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
      {groups.map(row => {
        const weaverForRow = row.weaverId ? weavers.find(x => x.id === row.weaverId) : undefined;
        const records = issueRecords
          .filter(r => r.batchId === batchId && r.status !== "cancelled" && (
            row.weaverId
              ? r.weaverId === row.weaverId && r.loomNumber === row.weaverLoom
              : r.factoryLoomId === row.factoryLoomId
          ))
          .sort((a, b) => a.issuedAt.localeCompare(b.issuedAt));

        return (
          <div key={groupKey(row)} style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Header: who / which loom */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 12, borderBottom: `1px solid ${T.borderDef}` }}>
              {row.weaverId ? (
                <>
                  <Pip initials={weaverForRow?.initials ?? row.weaverInitials ?? "?"} bg={pipColor(row.weaverId)} size={30} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {weaverForRow?.name ?? row.weaverName ?? row.weaverId}
                    </span>
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>{row.weaverId}</span>
                  </div>
                  {row.weaverLoom && (
                    <span style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.antiqueGold, background: "rgba(200,155,71,0.1)", border: "1px solid rgba(200,155,71,0.22)", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap" }}>
                      Loom {row.weaverLoom}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Factory size={15} color={T.royalBurgundy} />
                  </div>
                  <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>
                    Factory Loom {row.factoryLoomNumber}
                  </span>
                </>
              )}
            </div>

            {/* Materials issued, most recent last */}
            {records.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {records.map((r, i) => (
                  <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.antiqueGold, marginTop: 6, flexShrink: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                        {i === 0 ? "Issued" : `Issued (again)`}
                      </span>
                      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                        {r.materials.map(m => `${m.materialType}: ${m.quantity}${m.unit}`).join(", ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(139,112,96,0.5)", fontStyle: "italic" }}>No materials issued yet</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BatchTable({
  rows, displayRows, selected, toggleAll, toggleRow, allSelected,
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
  issueRecords: MaterialIssueRecord[];
  bulkOrders: BulkOrder[];
  setViewSareeRow: (r: SareeRow) => void;
  setViewFactoryLoom: (l: LoomOption) => void;
  setViewWeaver: (w: WeaverOption) => void;
  setViewBulkOrder: (o: BulkOrder) => void;
  setLoomPickerRow: (r: SareeRow) => void;
  openSareeTypeCard: (code: string) => void;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
    <SectionCard
      icon={Table2}
      title={`${rows.length} Sarees`}
      subtitle={`${completeRows.length} complete${incompleteRows.length > 0 ? ` · ${incompleteRows.length} incomplete` : ""}`}
      actions={
        selected.size > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.75)" }}>{selected.size} selected</span>
            {([
              { key: "weaver",     icon: Users,       label: "Assign Weaver" },
              { key: "bulkorder",  icon: ShoppingBag, label: "Assign Bulk Order" },
              { key: "factoryloom", icon: Factory,     label: "Assign Factory Loom" },
              { key: "design",     icon: Tag,          label: "Assign Design Code" },
              { key: "saretype",   icon: Tag,          label: "Assign Saree Type" },
            ] as const).map(a => (
              <Button key={a.key} onClick={() => setPicker(a.key as ActivePicker)} variant="secondary" size="sm" iconLeft={a.icon} className="bg-white/10 text-[#FFFDF9] border-white/20 hover:bg-white/18 hover:border-white/30 hover:text-[#FFFDF9] active:bg-white/25 active:border-white/40 active:text-[#FFFDF9]">
                {a.label}
              </Button>
            ))}
            <Button onClick={removeSelected} variant="danger-subtle" size="sm" iconLeft={Trash}>
              Remove Row(s)
            </Button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <SortAscending size={14} color="#FFFDF9" />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.75)" }}>Sort by</span>
            <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)} size="sm" className="h-[30px] w-auto min-w-[130px]">
              <SelectItem value="serial">Default (#)</SelectItem>
              <SelectItem value="weaver">Weaver</SelectItem>
              <SelectItem value="factoryLoom">Factory Loom</SelectItem>
            </Select>
          </div>
        )
      }
    >
      {/* Filters */}
      <div style={{ margin: "-24px -28px 0", padding: "16px 24px", borderBottom: `1px solid ${T.borderDef}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
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
      {/* Raw <table> intentionally kept — documented Phase 4 exclusion (row
          selection + modal pickers + rowSpan), see design-system/09-RESPONSIVE.md
          §3 "Known exclusions". minWidth:800 on the table inside this
          overflowX:auto wrapper is the standard horizontal-scroll pattern for
          a raw table, not a page-overflow risk. */}
      <div style={{ overflowX: "auto", margin: "0 -28px -28px" }}>
        {/* eslint-disable-next-line no-restricted-syntax -- raw table, documented Phase 4 exclusion; minWidth:800 is the intentional horizontal-scroll pattern inside the overflowX:auto wrapper above */}
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ background: T.warmCream }}>
              {/* eslint-disable-next-line no-restricted-syntax -- raw <th>, documented Phase 4 exclusion (see comment above table) */}
              <th style={th}>
                <Checkbox checked={allSelected} onCheckedChange={() => toggleAll()} aria-label="Select all rows" />
              </th>
              {["#", "Saree ID", "Weaver / Factory Loom", "Loom No.", "Saree Type", "Bulk Order", ""].map(h => (
                // eslint-disable-next-line no-restricted-syntax -- raw <th>, documented Phase 4 exclusion (see comment above table)
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, idx) => {
              const isSelected = selected.has(row.serial);
              const weaverForRow = row.weaverId ? weavers.find(x => x.id === row.weaverId) : undefined;
              return (
                <tr key={row.serial}
                  style={{ background: isSelected ? "rgba(110,15,45,0.04)" : idx % 2 === 0 ? "#fff" : "rgba(247,242,234,0.5)", borderBottom: `1px solid ${T.borderDef}` }}>
                  <td style={td}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(row.serial)} aria-label={`Select row ${row.serial}`} />
                  </td>
                  <td style={{ ...td, fontFamily: F.ui, fontVariantNumeric: "tabular-nums", fontSize: 12, color: T.taupe, width: 40 }}>{row.serial}</td>
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
                    ) : row.weaverId ? (
                      <Button onClick={() => { if (weaverForRow) setViewWeaver(weaverForRow); }}
                        variant="link" className="flex items-center gap-[7px] p-0 no-underline hover:no-underline" disabled={!weaverForRow}>
                        <Pip initials={weaverForRow?.initials ?? row.weaverInitials ?? "?"} bg={pipColor(row.weaverId)} size={22} />
                        <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, textDecoration: weaverForRow ? "underline" : "none", textDecorationColor: "rgba(110,15,45,0.2)" }}>
                          {weaverForRow?.name ?? row.weaverName ?? row.weaverId}
                        </span>
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
                  <td style={{ ...td, width: 24 }}>
                    <StatusDot row={row} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>

    <div style={{ marginTop: 20 }}>
      <SectionCard icon={PackageCheck} title="Materials Given" subtitle="Grouped by weaver / factory loom">
        <MaterialsGivenPanel rows={rows} issueRecords={issueRecords} batchId={batchId} weavers={weavers} />
      </SectionCard>
    </div>
    </div>
  );
}
