import React, { useState } from "react";
import { Eye, RotateCcw, AlertTriangle, ImageOff, Calendar, Tag, Package } from "lucide-react";
import { T, F, DefectiveLogItem } from "./WorkerQCTypes";
import { SectionCard } from "./primitives";
import { DateFilterBar, type DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { WorkerQCDefectiveDetailModal } from "./WorkerQCDefectiveDetailModal";
import { ImageZoomModal, type ZoomImage } from "../../../../shared/ui/ImageZoomModal";

interface WorkerQCSemiDefectiveSectionProps {
  semiLog: DefectiveLogItem[];
  semiFilter: DateFilterState;
  setSemiFilter: (filter: DateFilterState) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
}

function SemiDefectiveCard({ d, onView, onViewPhoto }: { d: DefectiveLogItem; onView: () => void; onViewPhoto: (image: ZoomImage) => void }) {
  return (
    <div className="group relative flex flex-col justify-between rounded-[20px] bg-[#FFFDFB] border border-[#F0E5D8] p-5 text-left shadow-[0_4px_20px_rgba(74,6,27,0.05)] hover:shadow-[0_8px_24px_rgba(74,6,27,0.09)] transition-all duration-200 overflow-hidden">
      {/* Top Header: Image/Placeholder + Saree ID & Weaver + Semi Pill */}
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
              <div style={{ fontFamily: F.m }} className="text-[13.5px] font-bold text-[#6E0F2D] truncate">
                {d.id}
              </div>
              <div style={{ fontFamily: F.u }} className="text-[13.5px] font-medium text-[#4F4A45] mt-0.5 truncate">
                {d.weaver}
              </div>
            </div>
          </div>

          <span style={{ fontFamily: F.u }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF9EE] border border-[#F6E3B8] text-[#845E04] text-[12px] font-bold flex-shrink-0">
            <RotateCcw size={12} /> Semi
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
                  className="inline-flex items-center px-3 py-1 rounded-lg bg-[#FEF9EE] border border-[#F6E3B8] text-[#845E04] text-[12.5px] font-semibold"
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
          </div>

          {/* Deduction */}
          <div className="min-w-0">
            <div style={{ fontFamily: F.u }} className="text-[11px] font-bold tracking-widest text-[#89837E] uppercase">
              DEDUCTION
            </div>
            <div style={{ fontFamily: F.d }} className="text-[20px] font-bold text-[#6E0F2D] mt-0.5">
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
              <span style={{ fontFamily: F.u }} className="truncate">{d.sareeType || "New saree type"}</span>
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

// ─── Semi Defective Sarees — sareees sent back to the weaver/loom for
// rework rather than rejected outright, kept in their own section so they
// aren't mistaken for a hard reject in the Defective Sarees list.
export function WorkerQCSemiDefectiveSection({
  semiLog,
  semiFilter,
  setSemiFilter,
  isDesktop,
  isTablet,
}: WorkerQCSemiDefectiveSectionProps) {
  const cols = isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr";
  const filteredSemiLog = semiLog.filter(d => matchesDateFilter(d.isoDate || d.date, semiFilter));
  const [viewing, setViewing] = useState<DefectiveLogItem | null>(null);
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = isDesktop ? 20 : isTablet ? 10 : 5;

  const totalPages = Math.ceil(filteredSemiLog.length / ITEMS_PER_PAGE);
  const pageItems = filteredSemiLog.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div id="wqc-semi-defective" style={{ margin: isDesktop ? "40px 0 0" : "32px 16px 0" }}>
      <SectionCard
        icon={AlertTriangle}
        title="Semi Defective Sarees"
        subtitle="Semi-approved — sent back to the weaver for rework."
        actions={
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
            {filteredSemiLog.length} of {semiLog.length}
          </span>
        }
      >
        <div style={{ marginBottom: 20 }}>
          <DateFilterBar filter={semiFilter} onChange={(f) => { setSemiFilter(f); setPage(1); }} />
        </div>

        {filteredSemiLog.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontFamily: F.u, fontSize: 14, color: T.muted }}>No semi defective sarees in this range.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: 16 }}>
              {pageItems.map((d) => (
                <SemiDefectiveCard key={d.recordId || d.id} d={d} onView={() => setViewing(d)} onViewPhoto={setZoomImage} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-[#EAE5E1]">
                <div style={{ fontFamily: F.u }} className="text-[13px] text-[#69635E]">
                  Showing <span className="font-semibold text-[#1D1814]">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredSemiLog.length)}</span> of <span className="font-semibold text-[#1D1814]">{filteredSemiLog.length}</span> sarees
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-[#EAE5E1] bg-white text-[12px] font-semibold text-[#4F4A45] hover:bg-[#FAF8F6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-[12px] font-bold cursor-pointer transition-colors ${
                        page === p
                          ? "bg-[#6E0F2D] text-white"
                          : "border border-[#EAE5E1] bg-white text-[#4F4A45] hover:bg-[#FAF8F6]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-[#EAE5E1] bg-white text-[12px] font-semibold text-[#4F4A45] hover:bg-[#FAF8F6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {viewing && <WorkerQCDefectiveDetailModal item={viewing} onClose={() => setViewing(null)} />}
      <ImageZoomModal image={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
}
