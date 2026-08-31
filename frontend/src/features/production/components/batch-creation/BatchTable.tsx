import { useState } from "react";
import {
  Users, Tag, ShoppingBag, Trash2 as Trash, Factory, ArrowUpNarrowWide as SortAscending, Table2, ImageOff,
} from "lucide-react";
import { SareeRow } from "../../contexts/BatchContext";
import { T, F, th, td, rowComplete, Pip, EmptyCell } from "./constants";
import type { ActivePicker } from "./types";
import type { WeaverOption, LoomOption } from "../useBatchFormHandlers";
import { pipColor } from "./PickerModals";
import { Button, Checkbox, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { SectionCard } from "../common/primitives";
import type { BulkOrder } from "@/features/bulk-orders";
import { ImageZoomModal, type ZoomImage } from "../../../../shared/ui/ImageZoomModal";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";

// Photo captured by Worker Staff at Receive Sarees — same source as the
// worker portal's Received History. Null until the saree is actually
// received back from the weaver/loom, which is normal for most rows here
// since this table is the pre-receipt batch-assignment editor.
function PhotoCell({ row, onView }: { row: SareeRow; onView: (image: ZoomImage) => void }) {
  const url = row.receivedPhotoUrl;
  return url ? (
    <button
      type="button"
      onClick={() => onView({ url, label: `Saree photo — ${row.sareeId}` })}
      title="View saree photo"
      aria-label={`View photo for ${row.sareeId}`}
      style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.borderDef}`, padding: 0, cursor: "pointer", backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center" }}
    />
  ) : (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 7, border: `1px dashed ${T.borderDef}`, color: T.taupe }} title="No photo on file">
      <ImageOff size={13} />
    </span>
  );
}

// ── Status dot per row ────────────────────────────────────────────────────────
function StatusDot({ row }: { row: SareeRow }) {
  const complete = rowComplete(row);
  const empty = !row.weaverId && !row.factoryLoomId && !row.sareeTypeCode;
  const color = complete ? T.green : empty ? T.taupe : T.amber;
  const title = complete ? "Complete" : empty ? "Not started" : "Partially filled";
  return <div title={title} style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

interface BatchTableProps {
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
  bulkOrders: BulkOrder[];
  setViewSareeRow: (r: SareeRow) => void;
  setViewFactoryLoom: (l: LoomOption) => void;
  setViewWeaver: (w: WeaverOption) => void;
  setViewBulkOrder: (o: BulkOrder) => void;
  setLoomPickerRow: (r: SareeRow) => void;
  openSareeTypeCard: (code: string) => void;
}

export function BatchTable({
  rows, displayRows, selected, toggleAll, toggleRow, allSelected,
  sortBy, setSortBy, searchFilter, setSearchFilter, weaverFilter, setWeaverFilter,
  sareeTypeFilter, setSareeTypeFilter, orderFilter, setOrderFilter,
  weaverOptions, orderOptions, sareeTypeOptions,
  completeRows, incompleteRows, setPicker, removeSelected, bulkOrders,
  setViewSareeRow, setViewFactoryLoom, setViewWeaver, setViewBulkOrder,
  setLoomPickerRow, openSareeTypeCard, weavers, looms,
}: BatchTableProps) {
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);
  return (
    <>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0 }}>
            <SortAscending size={14} color="#FFFDF9" className="shrink-0" />
            <span style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,253,249,0.75)", whiteSpace: "nowrap" }}>Sort by</span>
            <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)} size="sm" className="h-[30px] w-auto min-w-[130px] shrink-0">
              <SelectItem value="serial">Default (#)</SelectItem>
              <SelectItem value="weaver">Weaver</SelectItem>
              <SelectItem value="factoryLoom">Factory Loom</SelectItem>
            </Select>
          </div>
        )
      }
    >
      {/* Mobile Flipkart-style Filter Bar */}
      <div className="md:hidden -mx-2.5 sm:-mx-5 md:-mx-6 -mt-2.5 sm:-mt-5 md:-mt-6 p-3.5 border-b border-[#E8DCC4] bg-white">
        <MobileFilterBar
          search={searchFilter}
          onSearchChange={setSearchFilter}
          searchPlaceholder="Search saree ID, weaver, loom..."
          filterGroups={[
            {
              id: "weaver",
              label: "Weaver",
              value: weaverFilter,
              defaultValue: "All",
              options: weaverOptions.map(w => ({ value: w as string, label: w === "All" ? "All Weavers" : w as string })),
              onChange: setWeaverFilter,
            },
            {
              id: "type",
              label: "Saree Type",
              value: sareeTypeFilter,
              defaultValue: "All",
              options: sareeTypeOptions.map(w => ({ value: w as string, label: w === "All" ? "All Saree Types" : w as string })),
              onChange: setSareeTypeFilter,
            },
            {
              id: "order",
              label: "Bulk Order",
              value: orderFilter,
              defaultValue: "All",
              options: orderOptions.map(o => ({ value: o as string, label: o === "All" ? "All Orders" : o as string })),
              onChange: setOrderFilter,
            },
            {
              id: "sort",
              label: "Sort By",
              value: sortBy,
              defaultValue: "serial",
              options: [
                { value: "serial", label: "Default (#)" },
                { value: "weaver", label: "Weaver" },
                { value: "factoryLoom", label: "Factory Loom" },
              ],
              onChange: (v: string) => setSortBy(v as typeof sortBy),
            },
          ]}
          onResetAll={() => {
            setSearchFilter("");
            setWeaverFilter("All");
            setSareeTypeFilter("All");
            setOrderFilter("All");
            setSortBy("serial");
          }}
        />
      </div>

      {/* Desktop Filters — side-by-side single row */}
      <div className="hidden md:flex -mx-2.5 sm:-mx-5 md:-mx-6 -mt-2.5 sm:-mt-5 md:-mt-6 px-3.5 sm:px-5 md:px-6 py-3.5 sm:py-4 flex-row items-center gap-2.5 border-b border-[#E8DCC4]">
        <SearchInput aria-label="Search saree ID or weaver" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="Search Saree ID, Weaver..." className="w-full md:w-[240px] shrink-0" />
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto shrink-0 w-auto pb-0 scrollbar-none">
          <Select value={weaverFilter} onValueChange={setWeaverFilter} size="sm" className="w-auto min-w-[125px] shrink-0">
            {weaverOptions.map(w => <SelectItem key={w as string} value={w as string}>{w === "All" ? "All Weavers" : w as string}</SelectItem>)}
          </Select>
          <Select value={sareeTypeFilter} onValueChange={setSareeTypeFilter} size="sm" className="w-auto min-w-[125px] shrink-0">
            {sareeTypeOptions.map(w => <SelectItem key={w as string} value={w as string}>{w === "All" ? "All Saree Types" : w as string}</SelectItem>)}
          </Select>
          <Select value={orderFilter} onValueChange={setOrderFilter} size="sm" className="w-auto min-w-[125px] shrink-0">
            {orderOptions.map(o => <SelectItem key={o as string} value={o as string}>{o === "All" ? "All Orders" : o as string}</SelectItem>)}
          </Select>
        </div>
      </div>

      {/* Table */}
      {/* Raw <table> intentionally kept — documented Phase 4 exclusion (row
          selection + modal pickers + rowSpan), see design-system/09-RESPONSIVE.md
          §3 "Known exclusions". minWidth:800 on the table inside this
          overflowX:auto wrapper is the standard horizontal-scroll pattern for
          a raw table, not a page-overflow risk. */}
      <div className="-mx-2.5 sm:-mx-5 md:-mx-6 -mb-2.5 sm:-mb-4 md:-mb-4 overflow-x-auto">
        {/* eslint-disable-next-line no-restricted-syntax -- raw table, documented Phase 4 exclusion; minWidth:800 is the intentional horizontal-scroll pattern inside the overflowX:auto wrapper above */}
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ background: T.warmCream }}>
              {/* eslint-disable-next-line no-restricted-syntax -- raw <th>, documented Phase 4 exclusion (see comment above table) */}
              <th style={th}>
                <Checkbox checked={allSelected} onCheckedChange={() => toggleAll()} aria-label="Select all rows" />
              </th>
              {["#", "Saree ID", "Photo", "Weaver / Factory Loom", "Loom No.", "Saree Type", "Bulk Order", ""].map(h => (
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
                  <td style={td}>
                    <PhotoCell row={row} onView={setZoomImage} />
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
    </div>
    <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </>
  );
}
