import { useState } from "react";
import { History, LayoutGrid, LayoutList, CheckCircle2, ImageOff } from "lucide-react";
import { T, F, PassedLogItem } from "./WorkerQCTypes";
import { SectionCard } from "./primitives";
import { WorkerQCPassedCard } from "./WorkerQCPassedCard";
import { ImageZoomModal, type ZoomImage } from "../../../../shared/ui/ImageZoomModal";
import { DateFilterBar, type DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { EntityCode } from "../../../../shared/ui/domain";
import { Button } from "../../../../shared/ui/primitives";

interface WorkerQCHistorySectionProps {
  items: PassedLogItem[];
  historyFilter: DateFilterState;
  setHistoryFilter: (filter: DateFilterState) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
}

export function WorkerQCHistorySection({ items, historyFilter, setHistoryFilter, isDesktop, isTablet }: WorkerQCHistorySectionProps) {
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const cols = isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr";
  const filtered = items.filter(p => matchesDateFilter(p.isoDate, historyFilter));
  const ITEMS_PER_PAGE = isDesktop ? 20 : isTablet ? 10 : 5;
  const pag = usePagination(filtered, ITEMS_PER_PAGE);
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);

  const columns: ColumnDef<PassedLogItem>[] = [
    {
      id: "photo",
      header: "Photo",
      accessor: p => p.photoUrl ?? "",
      priority: 3,
      cell: (_v, p) =>
        p.photoUrl ? (
          <button
            type="button"
            onClick={() => setZoomImage({ url: p.photoUrl!, label: `Saree photo — ${p.id}` })}
            title="View saree photo"
            aria-label={`View saree photo for ${p.id}`}
            className="w-10 h-10 rounded-[10px] border border-[#C9E8D4] overflow-hidden flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
          >
            <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
          </button>
        ) : (
          <div
            title="No photo on file"
            className="w-10 h-10 rounded-[10px] bg-[#FAF8F5] border border-dashed border-[#D6C7B2] flex items-center justify-center text-[#A38D70] flex-shrink-0"
          >
            <ImageOff size={16} />
          </div>
        ),
    },
    {
      id: "sareeId",
      header: "Saree ID",
      accessor: p => p.id,
      priority: 1,
      cell: (_v, p) => <EntityCode type="saree" value={p.id} size="sm" />,
    },
    {
      id: "weaver",
      header: "Weaver",
      accessor: p => p.weaver,
      priority: 2,
      cell: (_v, p) => <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: T.brown }}>{p.weaver}</span>,
    },
    {
      id: "sareeType",
      header: "Saree Type",
      accessor: p => p.sareeType,
      priority: 2,
      cell: (_v, p) => <span style={{ fontFamily: F.u, fontSize: 13, color: T.brown }}>{p.sareeType}</span>,
    },
    {
      id: "date",
      header: "Completed Date",
      accessor: p => p.date,
      priority: 3,
      cell: (_v, p) => <span style={{ fontFamily: F.u, fontSize: 12, color: T.muted, whiteSpace: "nowrap" }}>{p.date}</span>,
    },
    {
      id: "payable",
      header: "Payable",
      accessor: p => p.payable,
      priority: 2,
      cell: (_v, p) => <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: T.burg }}>{p.payable}</span>,
    },
    {
      id: "inspectedBy",
      header: "Inspected By",
      accessor: p => p.inspectedBy ?? "—",
      priority: 3,
      cell: (_v, p) => <span style={{ fontFamily: F.u, fontSize: 12, color: T.muted }}>{p.inspectedBy ?? "—"}</span>,
    },
    {
      id: "status",
      header: "Status",
      accessor: () => "Passed",
      type: "status",
      cell: () => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#1E6640", background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.20)", borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>
          <CheckCircle2 size={12} /> Passed ✓
        </span>
      ),
    },
  ];

  return (
    <div id="wqc-history" style={{ margin: isDesktop ? "40px 0 0" : "32px 16px 0" }}>
      <SectionCard
        icon={History}
        title="QC History"
        subtitle="All sarees that have passed quality check."
        actions={
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
            {filtered.length} of {items.length}
          </span>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center border border-[#E8DCC4] rounded-[12px] overflow-hidden bg-white shrink-0">
            <Button
              type="button"
              onClick={() => setViewMode("card")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3.5 text-[12px] font-bold ${
                viewMode === "card"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
              }`}
            >
              <LayoutGrid size={14} /> Card View
            </Button>
            <Button
              type="button"
              onClick={() => setViewMode("table")}
              variant="ghost"
              className={`h-auto rounded-none gap-1.5 py-1.5 px-3.5 text-[12px] font-bold ${
                viewMode === "table"
                  ? "bg-[#6E0F2D] text-[#FFFDF9] hover:bg-[#6E0F2D]"
                  : "bg-white text-[var(--text-tertiary)] hover:bg-[#F7F2EA]"
              }`}
            >
              <LayoutList size={14} /> Table View
            </Button>
          </div>

          <DateFilterBar filter={historyFilter} onChange={(f) => { setHistoryFilter(f); pag.setPage(1); }} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontFamily: F.u, fontSize: 14, color: T.muted }}>No passed sarees in this range.</div>
          </div>
        ) : (
          <>
            {viewMode === "card" ? (
              <div style={{ display: "grid", gridTemplateColumns: cols, gap: 16 }}>
                {pag.pageItems.map((p) => (
                  <WorkerQCPassedCard key={p.recordId || p.id} id={p.id} weaver={p.weaver} date={p.date} sareeType={p.sareeType} payable={p.payable} inspectedBy={p.inspectedBy} photoUrl={p.photoUrl} onViewPhoto={setZoomImage} />
                ))}
              </div>
            ) : (
              <div className="w-full overflow-x-auto" style={{ border: `1.5px solid ${T.bdr}`, borderRadius: 12, overflow: "hidden" }}>
                <DataTable
                  columns={columns}
                  data={pag.pageItems}
                  getRowId={p => p.recordId || p.id}
                  pagination={false}
                />
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#EAE5E1]">
              <Pagination
                targetId="wqc-history"
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
          </>
        )}
      </SectionCard>
      <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
}
