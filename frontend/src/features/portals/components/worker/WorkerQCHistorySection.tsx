import React, { useState } from "react";
import { History } from "lucide-react";
import { T, F, PassedLogItem } from "./WorkerQCTypes";
import { SectionCard } from "./primitives";
import { WorkerQCPassedCard } from "./WorkerQCPassedCard";
import { DateFilterBar, type DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";

interface WorkerQCHistorySectionProps {
  items: PassedLogItem[];
  historyFilter: DateFilterState;
  setHistoryFilter: (filter: DateFilterState) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
}

export function WorkerQCHistorySection({ items, historyFilter, setHistoryFilter, isDesktop, isTablet }: WorkerQCHistorySectionProps) {
  const cols = isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr";
  const filtered = items.filter(p => matchesDateFilter(p.isoDate, historyFilter));
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = isDesktop ? 20 : isTablet ? 10 : 5;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
        <div style={{ marginBottom: 20 }}>
          <DateFilterBar filter={historyFilter} onChange={(f) => { setHistoryFilter(f); setPage(1); }} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontFamily: F.u, fontSize: 14, color: T.muted }}>No passed sarees in this range.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: 16 }}>
              {pageItems.map((p) => (
                <WorkerQCPassedCard key={p.id} id={p.id} weaver={p.weaver} date={p.date} sareeType={p.sareeType} payable={p.payable} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-[#EAE5E1]">
                <div style={{ fontFamily: F.u }} className="text-[13px] text-[#69635E]">
                  Showing <span className="font-semibold text-[#1D1814]">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span> of <span className="font-semibold text-[#1D1814]">{filtered.length}</span> sarees
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
    </div>
  );
}
