import { useMemo, useState } from "react";
import { Eye, ShieldAlert, AlertTriangle, ImageOff, Calendar, Tag, Package, LayoutGrid, LayoutList } from "lucide-react";
import { T, F, DefectiveLogItem } from "./WorkerQCTypes";
import { SectionCard } from "./primitives";
import { DateFilterBar, type DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { WorkerQCDefectiveDetailModal } from "./WorkerQCDefectiveDetailModal";
import { ImageZoomModal, type ZoomImage } from "../../../../shared/ui/ImageZoomModal";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { Pagination, usePagination } from "../../../../shared/ui/DataPagination";
import { EntityCode } from "../../../../shared/ui/domain";
import { Button } from "../../../../shared/ui/primitives";
import { StaffFilterSelect } from "../../../../shared/ui/StaffFilterSelect";
import { useAuth } from "../../../../contexts/AuthContext";

interface WorkerQCDefectiveSectionProps {
  defLog: DefectiveLogItem[];
  defFilter: DateFilterState;
  setDefFilter: (filter: DateFilterState) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
}

function DefectiveCard({ d, onView, onViewPhoto }: { d: DefectiveLogItem; onView: () => void; onViewPhoto: (image: ZoomImage) => void }) {
  return (
    <div className="group relative flex flex-col justify-between rounded-[20px] bg-[#FFFDFB] border border-[#F0E5D8] p-5 text-left shadow-[0_4px_20px_rgba(74,6,27,0.05)] hover:shadow-[0_8px_24px_rgba(74,6,27,0.09)] transition-all duration-200 overflow-hidden">
      {/* Top Header: Image/Placeholder + Saree ID & Weaver + Defective Pill */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {d.photoUrl ? (
              <button
                type="button"
                onClick={() => onViewPhoto({ url: d.photoUrl!, label: `Defect photo — ${d.id}` })}
                title="View defect photo"
                aria-label={`View defect photo for ${d.id}`}
                className="w-14 h-14 rounded-[14px] border border-[#EAE5E1] overflow-hidden flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
              >
                <img src={d.photoUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ) : (
              <div
                title="No photo on file"
                className="w-14 h-14 rounded-[14px] bg-[#FAF8F5] border border-dashed border-[#D6C7B2] flex items-center justify-center text-[#A38D70] flex-shrink-0"
              >
                <ImageOff size={20} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              {/* Saree IDs run long ("RAMOJI RAO-L1-B001-002"); truncate hid the
                  trailing serial, which is the part that tells two sarees in a
                  batch apart. Wraps instead, matching WorkerQCPassedCard. */}
              <div title={d.id} style={{ fontFamily: F.m }} className="text-[13.5px] font-bold text-[#6E0F2D] break-all">
                {d.id}
              </div>
              <div style={{ fontFamily: F.u }} className="text-[13.5px] font-medium text-[#4F4A45] mt-0.5 truncate">
                {d.weaver}
              </div>
            </div>
          </div>

          <span style={{ fontFamily: F.u }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF5F3] border border-[#FED3CD] text-[#AB3832] text-[12px] font-bold flex-shrink-0">
            <AlertTriangle size={12} /> Defective
          </span>
        </div>

        {/* Defects Found */}
        <div className="mt-4.5">
          <div style={{ fontFamily: F.u }} className="text-[11px] font-bold tracking-widest text-[#89837E] uppercase mb-2">
            DEFECTS FOUND
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {d.defects.length === 0 ? (
              <span style={{ fontFamily: F.u }} className="text-[13px] text-[#69635E]">—</span>
            ) : (
              d.defects.map(df => (
                <span
                  key={df}
                  style={{ fontFamily: F.u }}
                  className="inline-flex items-center px-3 py-1 rounded-lg bg-[#FEF5F3] border border-[#FED3CD] text-[#AB3832] text-[12.5px] font-semibold"
                >
                  {df}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Specs Grid: 2x2 with clean divider lines */}
        <div className="mt-4 pt-3.5 border-t border-[#F0E5D8]/70 grid grid-cols-2 gap-x-3 gap-y-3.5">
          {/* Inspected */}
          <div className="min-w-0">
            <div style={{ fontFamily: F.u }} className="text-[11px] font-bold tracking-widest text-[#89837E] uppercase">
              INSPECTED
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[13.5px] font-bold text-[#1D1814]">
              <Calendar size={15} className="text-[#C89B47] flex-shrink-0" />
              <span style={{ fontFamily: F.u }}>{d.date}</span>
            </div>
            <div style={{ fontFamily: F.u }} className="mt-0.5 truncate text-[11.5px] font-medium text-[#89837E]">
              Defected by {d.inspectedBy || "Worker Staff"}
            </div>
          </div>

          {/* Deduction */}
          <div className="min-w-0">
            <div style={{ fontFamily: F.u }} className="text-[11px] font-bold tracking-widest text-[#89837E] uppercase">
              DEDUCTION
            </div>
            <div style={{ fontFamily: F.d }} className="text-[20px] font-bold text-[#AB3832] mt-0.5">
              {d.deduction}
            </div>
          </div>

          {/* Saree Type */}
          <div className="min-w-0 pt-3 border-t border-[#F0E5D8]/50">
            <div style={{ fontFamily: F.u }} className="text-[11px] font-bold tracking-widest text-[#89837E] uppercase">
              SAREE TYPE
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[13px] font-semibold text-[#1D1814] min-w-0">
              <Tag size={14} className="text-[#C89B47] flex-shrink-0" />
              <span style={{ fontFamily: F.u }} className="truncate">{d.sareeType || "Standard Saree"}</span>
            </div>
          </div>

          {/* Batch */}
          <div className="min-w-0 pt-3 border-t border-[#F0E5D8]/50">
            <div style={{ fontFamily: F.u }} className="text-[11px] font-bold tracking-widest text-[#89837E] uppercase">
              BATCH
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[13px] font-bold text-[#1D1814] min-w-0">
              <Package size={14} className="text-[#C89B47] flex-shrink-0" />
              <span style={{ fontFamily: F.m }} className="truncate">{d.batchId || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="mt-5 pt-1">
        <button
          type="button"
          onClick={onView}
          className="w-full py-2.5 rounded-xl bg-[#FFFDFB] border border-[#EAE5E1] text-[#6E0F2D] hover:bg-[#FEF4F5] hover:border-[#FEE8EB] font-bold text-[13.5px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <Eye size={16} className="text-[#6E0F2D]" />
          <span style={{ fontFamily: F.u }}>View Details</span>
        </button>
      </div>
    </div>
  );
}

export function WorkerQCDefectiveSection({
  defLog,
  defFilter,
  setDefFilter,
  isDesktop,
  isTablet,
}: WorkerQCDefectiveSectionProps) {
  const { role } = useAuth();
  const canFilterByStaff = role === "admin" || role === "superadmin";
  const [staffFilter, setStaffFilter] = useState("");
  const staffNames = useMemo(
    () => Array.from(new Set(defLog.map(d => d.inspectedBy).filter((n): n is string => !!n))).sort(),
    [defLog],
  );

  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const cols = isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr";
  const filteredDefLog = defLog.filter(d =>
    matchesDateFilter(d.isoDate || d.date, defFilter) && (!canFilterByStaff || !staffFilter || d.inspectedBy === staffFilter),
  );
  const [viewing, setViewing] = useState<DefectiveLogItem | null>(null);
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);
  const ITEMS_PER_PAGE = isDesktop ? 20 : isTablet ? 10 : 5;
  const pag = usePagination(filteredDefLog, ITEMS_PER_PAGE);

  const columns: ColumnDef<DefectiveLogItem>[] = [
    {
      id: "sareeId",
      header: "Saree ID",
      accessor: d => d.id,
      priority: 1,
      cell: (_v, d) => <EntityCode type="saree" value={d.id} size="sm" />,
    },
    {
      id: "weaver",
      header: "Weaver",
      accessor: d => d.weaver,
      priority: 2,
      cell: (_v, d) => <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: T.brown }}>{d.weaver}</span>,
    },
    {
      id: "sareeType",
      header: "Saree Type",
      accessor: d => d.sareeType ?? "—",
      priority: 2,
      cell: (_v, d) => <span style={{ fontFamily: F.u, fontSize: 13, color: T.brown }}>{d.sareeType ?? "—"}</span>,
    },
    {
      id: "date",
      header: "Inspection Date",
      accessor: d => d.date,
      priority: 3,
      cell: (_v, d) => <span style={{ fontFamily: F.u, fontSize: 12, color: T.muted, whiteSpace: "nowrap" }}>{d.date}</span>,
    },
    {
      id: "defects",
      header: "Defect Reason",
      accessor: d => d.defects?.join(", ") || d.notes || "—",
      priority: 2,
      cell: (_v, d) => (
        <span style={{ fontFamily: F.u, fontSize: 12, color: "#8A1224", fontWeight: 600 }}>
          {d.defects?.length ? d.defects.join(", ") : d.notes || "—"}
        </span>
      ),
    },
    {
      id: "deduction",
      header: "Deduction",
      accessor: d => d.deduction ?? "—",
      priority: 3,
      cell: (_v, d) => <span style={{ fontFamily: F.m, fontSize: 12, color: T.muted }}>{d.deduction || "—"}</span>,
    },
    {
      id: "inspectedBy",
      header: "Defected By",
      accessor: d => d.inspectedBy ?? "—",
      priority: 3,
      cell: (_v, d) => <span style={{ fontFamily: F.u, fontSize: 12, color: T.muted }}>{d.inspectedBy ?? "—"}</span>,
    },
    {
      id: "status",
      header: "Status",
      accessor: () => "Defective",
      type: "status",
      cell: () => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#8A1224", background: "rgba(138,18,36,0.10)", border: "1px solid rgba(138,18,36,0.22)", borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>
          <ShieldAlert size={12} /> Defective
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      accessor: () => null,
      type: "actions",
      cell: (_v, d) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setViewing(d)}
          className="rounded-[8px] border-[#6E0F2D] text-[#6E0F2D] hover:bg-[#6E0F2D] hover:text-white text-[12px] font-semibold py-1 px-3"
        >
          <Eye size={13} className="mr-1 inline" /> Details
        </Button>
      ),
    },
  ];

  return (
    <div id="wqc-defective" style={{ margin: isDesktop ? "40px 0 0" : "32px 16px 0" }}>
      <SectionCard
        icon={ShieldAlert}
        title="Defective Sarees"
        subtitle="Failed quality check — stored separately."
        actions={
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
            {filteredDefLog.length} of {defLog.length}
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

          <div className="flex items-center gap-2 flex-wrap">
            <DateFilterBar filter={defFilter} onChange={(f) => { setDefFilter(f); pag.setPage(1); }} />
            {canFilterByStaff && (
              <StaffFilterSelect names={staffNames} value={staffFilter} onChange={(v) => { setStaffFilter(v); pag.setPage(1); }} />
            )}
          </div>
        </div>

        {filteredDefLog.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontFamily: F.u, fontSize: 14, color: T.muted }}>No defective sarees in this range.</div>
          </div>
        ) : (
          <>
            {viewMode === "card" ? (
              <div style={{ display: "grid", gridTemplateColumns: cols, gap: 16 }}>
                {pag.pageItems.map((d) => (
                  <DefectiveCard key={d.recordId || d.id} d={d} onView={() => setViewing(d)} onViewPhoto={setZoomImage} />
                ))}
              </div>
            ) : (
              <div className="w-full overflow-x-auto" style={{ border: `1.5px solid ${T.bdr}`, borderRadius: 12, overflow: "hidden" }}>
                <DataTable
                  columns={columns}
                  data={pag.pageItems}
                  getRowId={d => d.recordId || d.id}
                  pagination={false}
                />
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#EAE5E1]">
              <Pagination
                targetId="wqc-defective"
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

      {viewing && <WorkerQCDefectiveDetailModal item={viewing} onClose={() => setViewing(null)} />}
      <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
}
