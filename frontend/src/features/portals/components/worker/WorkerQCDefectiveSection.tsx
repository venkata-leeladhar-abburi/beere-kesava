import { useMemo, useState } from "react";
import { Eye, ShieldAlert, ImageOff } from "lucide-react";
import { T, F, DefectiveLogItem } from "./WorkerQCTypes";
import { SectionCard } from "./primitives";
import { DateFilterBar, type DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { WorkerQCDefectiveDetailModal } from "./WorkerQCDefectiveDetailModal";
import { ImageZoomModal, type ZoomImage } from "../../../../shared/ui/ImageZoomModal";
import { DataTable, ViewToggle, type ColumnDef } from "../../../../shared/ui/data";
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

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const filteredDefLog = defLog.filter(d =>
    matchesDateFilter(d.isoDate || d.date, defFilter) && (!canFilterByStaff || !staffFilter || d.inspectedBy === staffFilter),
  );
  const [viewing, setViewing] = useState<DefectiveLogItem | null>(null);
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);
  const ITEMS_PER_PAGE = isDesktop ? 20 : isTablet ? 10 : 5;
  const pag = usePagination(filteredDefLog, ITEMS_PER_PAGE);

  const columns: ColumnDef<DefectiveLogItem>[] = [
    {
      id: "photo",
      header: "Photo",
      accessor: d => d.photoUrl ?? "",
      priority: 3,
      cell: (_v, d) =>
        d.photoUrl ? (
          <button
            type="button"
            onClick={() => setZoomImage({ url: d.photoUrl!, label: `Defect photo — ${d.id}` })}
            title="View defect photo"
            aria-label={`View defect photo for ${d.id}`}
            className="w-10 h-10 rounded-[10px] border border-[#EAE5E1] overflow-hidden flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
          >
            <img src={d.photoUrl} alt="" className="w-full h-full object-cover" />
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
      id: "batch",
      header: "Batch",
      accessor: d => d.batchId ?? "—",
      priority: 3,
      cell: (_v, d) => <span style={{ fontFamily: F.m, fontSize: 12, color: T.muted }}>{d.batchId || "—"}</span>,
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
          <ViewToggle value={viewMode} onChange={setViewMode} />

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
            {viewMode === "table" ? (
              <div className="w-full overflow-x-auto" style={{ border: `1.5px solid ${T.bdr}`, borderRadius: 12, overflow: "hidden" }}>
                <DataTable
                  columns={columns}
                  data={pag.pageItems}
                  getRowId={d => d.recordId || d.id}
                  view="table"
                  pagination={false}
                />
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={pag.pageItems}
                getRowId={d => d.recordId || d.id}
                view="cards"
                pagination={false}
              />
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
