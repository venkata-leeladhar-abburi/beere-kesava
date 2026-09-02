import { useState } from "react";
import { CheckCircle2, Clock, History, LayoutGrid, List } from "lucide-react";
import { MaterialIssueRecord, useMaterialIssue } from "../../contexts/MaterialIssueContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER } from "../../../../shared/ui/DateFilterBar";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";
import { F, T } from "./theme";
import { SectionCard } from "./primitives";
import { renderIssuedMaterials } from "./materialFormatters";
import { Button, SearchInput, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { EntityCode } from "@/shared/ui/domain";
import { LoadingState, ErrorState, EmptyState, FilteredEmptyState } from "../../../../shared/ui/state";
import { Pagination } from "../../../../shared/ui/DataPagination";

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  signed: { label: "Signed", color: T.green, bg: "rgba(30,102,64,0.10)" },
  "pending-signature": { label: "Pending Signature", color: "#8B6018", bg: "rgba(196,146,58,0.14)" },
  cancelled: { label: "Cancelled", color: T.crimson, bg: "rgba(192,57,43,0.09)" },
};

export function IssuanceHistorySection({
  weaverNames, histSearch, setHistSearch, histWeaverFilter, setHistWeaverFilter,
  histDateFilter, setHistDateFilter, pagedHistory, histPage, setHistPage, totalPages,
  setViewRecord, totalCount,
}: {
  weaverNames: string[];
  histSearch: string; setHistSearch: (v: string) => void;
  histWeaverFilter: string; setHistWeaverFilter: (v: string) => void;
  histDateFilter: DateFilterState; setHistDateFilter: (f: DateFilterState) => void;
  pagedHistory: MaterialIssueRecord[];
  histPage: number; setHistPage: (fn: (p: number) => number) => void;
  totalPages: number;
  setViewRecord: (r: MaterialIssueRecord) => void;
  totalCount?: number;
}) {
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const { isLoading, isError, error, refetch } = useMaterialIssue();

  const columns: ColumnDef<MaterialIssueRecord>[] = [
    {
      id: "id", header: "MIR ID", accessor: r => r.id, priority: 1,
      cell: (_v, r) => <EntityCode type="goodsReceipt" value={r.id} size="sm" />,
    },
    {
      id: "date", header: "Date", accessor: r => r.issuedAt,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>,
    },
    {
      id: "weaver", header: "Weaver / Factory Loom", accessor: r => r.weaverName ?? r.factoryLoomNumber,
      cell: (_v, r) => (
        <div style={{ whiteSpace: "nowrap" }}>
          <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>{r.weaverName ?? r.factoryLoomNumber}</div>
          {r.loomNumber && <div style={{ fontFamily: F.ui, fontVariantNumeric: "tabular-nums", fontSize: 12, color: T.antiqueGold, fontWeight: 700, marginTop: 2 }}>Loom {r.loomNumber}</div>}
        </div>
      ),
    },
    {
      // The human-facing weaver code ("Wea-003"), not Weaver.id — this column
      // used to print the raw UUID, which matched nothing shown elsewhere.
      id: "weaverId", header: "Weaver ID", accessor: r => r.weaverCode, priority: 3,
      cell: (_v, r) => r.weaverCode
        ? <EntityCode type="weaver" value={r.weaverCode} size="sm" />
        : <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>—</span>,
    },
    {
      // Type, description, quantity and the exact GRN line id per material —
      // the separate "GRN Batch IDs" column this replaces listed only the
      // parent receipts, so you couldn't tell which line fed which material.
      id: "materials", header: "Materials Summary", accessor: r => r.materials,
      cell: (_v, r) => renderIssuedMaterials(r.materials),
    },
    {
      id: "grnIds", header: "GRN Receipt", accessor: r => r.materials, priority: 3,
      cell: (_v, r) => {
        const grnIds = Array.from(new Set(r.materials.map(m => m.grnBatchId).filter(Boolean)));
        return (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {grnIds.length === 0
              ? <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>—</span>
              : grnIds.map(g => <EntityCode key={g} type="goodsReceipt" value={g} size="sm" />)}
          </div>
        );
      },
    },
    {
      id: "issuedBy", header: "Issued By", accessor: r => r.issuedBy, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{r.issuedBy}</span>,
    },
    {
      id: "signature", header: "Signature", accessor: r => r.signatureCaptured, priority: 3,
      cell: (_v, r) => r.signatureCaptured ? (
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.green, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}><CheckCircle2 size={13} /> Signed — {r.signatureMethod === "here" ? "On screen" : "Remote"}</span>
      ) : (
        <span style={{ fontFamily: F.ui, fontSize: 12, color: "#8B6018", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}><Clock size={13} /> Pending</span>
      ),
    },
    {
      id: "status", header: "Status", accessor: r => r.status, type: "status",
      cell: (_v, r) => {
        const badge = STATUS_BADGE[r.status];
        return <span style={{ background: badge.bg, color: badge.color, borderRadius: 999, padding: "4px 10px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{badge.label}</span>;
      },
    },
    {
      id: "actions", header: "", accessor: () => null, type: "actions",
      cell: (_v, r) => (
        <Button
          variant="secondary"
          size="sm"
          iconLeft="view"
          onClick={() => setViewRecord(r)}
          className="whitespace-nowrap border-[rgba(200,155,71,0.22)] text-[#6E0F2D]"
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <SectionCard icon={History} title="Material Issuance History" subtitle="Every material issued to a weaver or factory loom, with signature status.">
      {/* Mobile Flipkart-style Filter Bar */}
      <div className="md:hidden mb-4 bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
        <MobileFilterBar
          search={histSearch}
          onSearchChange={setHistSearch}
          searchPlaceholder="Search weaver, MIR ID, or GRN batch..."
          filterGroups={[
            {
              id: "time",
              label: "Time Period",
              value: histDateFilter.mode,
              defaultValue: "all",
              options: [
                { value: "all", label: "All Time" },
                { value: "day", label: "Specific Date" },
                { value: "range", label: "Date Range" },
                { value: "month", label: "Monthly" },
                { value: "year", label: "Yearly" },
              ],
              onChange: (m: string) => {
                const mode = m as DateFilterState["mode"];
                if (mode === "day") setHistDateFilter({ mode, day: new Date().toISOString().slice(0, 10), from: "", to: "", month: "", year: "" });
                else if (mode === "month") setHistDateFilter({ mode, day: "", from: "", to: "", month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, year: "" });
                else if (mode === "year") setHistDateFilter({ mode, day: "", from: "", to: "", month: "", year: String(new Date().getFullYear()) });
                else setHistDateFilter({ mode, day: "", from: "", to: "", month: "", year: "" });
              },
            },
            {
              id: "weaver",
              label: "Weaver / Loom",
              value: histWeaverFilter,
              defaultValue: weaverNames[0] ?? "All Weavers",
              options: weaverNames.map(n => ({ value: n, label: n })),
              onChange: setHistWeaverFilter,
            },
          ]}
          onResetAll={() => {
            setHistSearch("");
            setHistWeaverFilter(weaverNames[0] ?? "All Weavers");
            setHistDateFilter(DEFAULT_DATE_FILTER);
          }}
        />
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:block mb-4">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 20 }}>
          <div style={{ flex: "1 1 260px" }}>
            <SearchInput aria-label="Search weaver, MIR ID, or GRN batch" value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Search weaver, MIR ID, or GRN batch…" className="w-full" />
          </div>
          <Select value={histWeaverFilter} onValueChange={setHistWeaverFilter} align="end">
            {weaverNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <DateFilterBar filter={histDateFilter} onChange={setHistDateFilter} />
        </div>
      </div>

      <div className="flex md:hidden items-center border border-[#E8DCC4] rounded-xl overflow-hidden bg-white shrink-0 mb-4 w-fit">
        <Button
          onClick={() => setViewMode("card")}
          variant="ghost"
          className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
            viewMode === "card"
              ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
              : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
          }`}
        >
          <LayoutGrid size={14} /> Card View
        </Button>
        <Button
          onClick={() => setViewMode("table")}
          variant="ghost"
          className={`h-auto rounded-none gap-1.5 py-1.5 px-3 text-[12px] font-bold ${
            viewMode === "table"
              ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D] hover:text-[#FFFDF9]"
              : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA] hover:text-[#6E0F2D]"
          }`}
        >
          <List size={14} /> Table View
        </Button>
      </div>

      {/* Mobile View (Card View or Table View based on viewMode toggle) */}
      <div className="block md:hidden">
        {viewMode === "card" ? (
          isLoading ? (
            <LoadingState variant="skeleton" rows={4} />
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : pagedHistory.length === 0 ? (
            histSearch.trim() || histWeaverFilter !== "All Weavers" ? (
              <FilteredEmptyState onClearFilters={() => { setHistSearch(""); setHistWeaverFilter("All Weavers"); }} />
            ) : (
              <EmptyState title="No issuance records yet" description="Materials issued to weavers or looms will show up here." />
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {pagedHistory.map(r => {
                const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE["signed"];
                const formattedDate = new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                const recipient = r.weaverName ?? r.factoryLoomNumber ?? "—";
                
                return (
                  <div
                    key={r.id}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 16,
                      border: `1px solid ${T.borderDef}`,
                      boxShadow: "0 2px 12px rgba(74,6,27,0.06)",
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <EntityCode type="goodsReceipt" value={r.id} size="sm" />
                      <span style={{ background: badge.bg, color: badge.color, borderRadius: 999, padding: "4px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {badge.label}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, fontFamily: F.ui, borderTop: `1px solid ${T.borderDef}`, paddingTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: T.taupe, fontSize: 12, fontWeight: 500 }}>Date Issued</span>
                        <span style={{ color: T.luxuryBrown, fontSize: 13, fontWeight: 600 }}>{formattedDate}</span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: T.taupe, fontSize: 12, fontWeight: 500 }}>Weaver / Loom</span>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, color: T.luxuryBrown, fontSize: 13 }}>{recipient}</div>
                          {r.loomNumber && <div style={{ fontSize: 11, color: T.antiqueGold, fontWeight: 700 }}>Loom {r.loomNumber}</div>}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: `1px dashed ${T.borderDef}`, paddingTop: 10 }}>
                        <span style={{ color: T.taupe, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Materials Summary</span>
                        <div style={{ background: T.warmCream, borderRadius: 10, padding: "10px 12px" }}>
                          {renderIssuedMaterials(r.materials)}
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${T.borderDef}`, paddingTop: 10, marginTop: "auto" }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setViewRecord(r)}
                        className="w-full justify-center text-[12px] font-bold border-[rgba(200,155,71,0.25)] text-[#6E0F2D] hover:bg-[#F7F2EA]"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div id="issuance-history-table-mobile" style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
            <DataTable
              columns={columns}
              data={pagedHistory}
              getRowId={r => r.id}
              loading={isLoading}
              error={isError}
              onRetry={refetch}
              isFiltered={!!(histSearch.trim() || histWeaverFilter !== "All Weavers")}
              onClearFilters={() => { setHistSearch(""); setHistWeaverFilter("All Weavers"); }}
              emptyTitle="No issuance records match your filters"
              pagination={false}
            />
          </div>
        )}
      </div>

      {/* Desktop View — always Table View */}
      <div id="issuance-history-table" className="hidden md:block" style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
        <DataTable
          columns={columns}
          data={pagedHistory}
          getRowId={r => r.id}
          loading={isLoading}
          error={isError}
          onRetry={refetch}
          isFiltered={!!(histSearch.trim() || histWeaverFilter !== "All Weavers")}
          onClearFilters={() => { setHistSearch(""); setHistWeaverFilter("All Weavers"); }}
          emptyTitle="No issuance records match your filters"
          pagination={false}
        />
      </div>

      {totalPages > 0 && (
        <div className="mt-3 p-2 bg-white rounded-xl border border-[var(--border-default)]">
          <Pagination
            targetId="issuance-history-table"
            page={histPage}
            pageCount={totalPages}
            total={totalCount ?? (totalPages * 15)}
            pageSize={15}
            start={(histPage - 1) * 15}
            onPageChange={p => setHistPage(() => p)}
            itemLabel="issuance records"
          />
        </div>
      )}
    </SectionCard>
  );
}
