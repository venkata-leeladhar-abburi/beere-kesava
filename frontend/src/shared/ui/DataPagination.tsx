import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { brand, semantic, fonts } from "../../design-system/tokens";
import { Select, SelectItem } from "./primitives";

// ─── Shared pagination ────────────────────────────────────────────────────────
// One control + one hook, reused by every tabular / inventory view in the app so
// long lists (sarees, purchases, payments, orders…) don't render hundreds of DOM
// rows at once.

const T = {
  royalBurgundy: brand.burgundy[900],
  luxuryBrown: "#3B2314",
  taupe: semantic.text.tertiary,
  silkCream: semantic.surface.canvas,
  borderDef: "rgba(110,15,45,0.10)",
};
const F = { ui: fonts.ui, mono: fonts.code };

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export type UsePaginationReturn = ReturnType<typeof usePagination>;

/** Slices `items` to the current page and resets to page 1 whenever the
 *  underlying list (after filtering/sorting) shrinks below the current page. */
export function usePagination<T>(items: T[], initialPageSize = 25) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [pageCount, page]);

  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    page, setPage, pageSize,
    setPageSize: (n: number) => { setPageSize(n); setPage(1); },
    pageCount, start, total: items.length, pageItems,
  };
}

export function Pagination({ page, pageCount, total, pageSize, start, onPageChange, onPageSizeChange, itemLabel = "items", targetId, scrollToTop = true }: {
  page: number; pageCount: number; total: number; pageSize: number; start: number;
  onPageChange: (p: number) => void; onPageSizeChange?: (n: number) => void; itemLabel?: string;
  targetId?: string; scrollToTop?: boolean;
}) {
  if (total === 0) return null;
  const end = Math.min(start + pageSize, total);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > pageCount) return;
    onPageChange(newPage);
    if (!scrollToTop) return;

    setTimeout(() => {
      let targetEl: HTMLElement | null = null;
      if (targetId) {
        targetEl = document.getElementById(targetId);
      }
      if (!targetEl && containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const localTarget = parent.querySelector("[data-pagination-target], [id$='-table'], [id$='-cards'], [id^='every-'], table, .overflow-x-auto");
          if (localTarget && localTarget !== containerRef.current) {
            targetEl = localTarget as HTMLElement;
          } else if (parent.hasAttribute("data-pagination-target") || parent.id?.endsWith("-table") || parent.classList.contains("bk-table-card")) {
            targetEl = parent;
          } else {
            targetEl = containerRef.current.closest("[data-pagination-target], [id$='-table'], [id$='-cards'], [id^='every-'], .overflow-x-auto, table, .bk-table-card") as HTMLElement;
          }
        }
        if (!targetEl) {
          targetEl = containerRef.current.parentElement;
        }
      }
      if (targetEl) {
        const isMobile = window.innerWidth <= 768;
        const topNavOffset = isMobile ? 80 : 130;
        const rect = targetEl.getBoundingClientRect();
        const absoluteTop = window.scrollY + rect.top - topNavOffset;
        window.scrollTo({ top: Math.max(0, absoluteTop), behavior: "smooth" });
      }
    }, 40);
  };

  const btn: React.CSSProperties = {
    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 12, border: `1.5px solid rgba(110,15,45,0.14)`, background: "#FFFDF9", color: T.royalBurgundy,
    cursor: "pointer", transition: "all 0.15s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  };
  const btnDisabled: React.CSSProperties = {
    ...btn, opacity: 0.35, cursor: "not-allowed", color: T.taupe, border: `1.5px solid rgba(110,15,45,0.08)`, boxShadow: "none",
  };

  return (
    <div ref={containerRef} className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-full py-3 px-2">
      {/* Heading Line */}
      <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }} className="w-full sm:w-auto text-center sm:text-left">
        Showing <strong style={{ color: T.luxuryBrown }}>{start + 1}–{end}</strong> of <strong style={{ color: T.luxuryBrown }}>{total}</strong> {itemLabel}
      </div>

      {/* Controls & Buttons Lines */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
        {onPageSizeChange && (
          <div className="flex items-center justify-center w-full sm:w-auto">
            <Select
              size="sm"
              value={String(pageSize)}
              onValueChange={val => { onPageSizeChange(Number(val)); handlePageChange(1); }}
              className="rounded-xl border-[1.5px] border-[rgba(110,15,45,0.14)] bg-[#FFFDF9] font-bold text-[#3B2314]"
            >
              {PAGE_SIZE_OPTIONS.map(n => (
                <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
              ))}
            </Select>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0">
          <button onClick={() => handlePageChange(1)} disabled={page === 1} style={page === 1 ? btnDisabled : btn} title="First page"><ChevronsLeft size={15} /></button>
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} style={page === 1 ? btnDisabled : btn} title="Previous page"><ChevronLeft size={15} /></button>
          <div style={{ display: "flex", alignItems: "center", padding: "0 10px", fontFamily: F.mono, fontSize: 13, color: T.luxuryBrown, fontWeight: 700 }}>
            {page} / {pageCount}
          </div>
          <button onClick={() => handlePageChange(page + 1)} disabled={page === pageCount} style={page === pageCount ? btnDisabled : btn} title="Next page"><ChevronRight size={15} /></button>
          <button onClick={() => handlePageChange(pageCount)} disabled={page === pageCount} style={page === pageCount ? btnDisabled : btn} title="Last page"><ChevronsRight size={15} /></button>
        </div>
      </div>
    </div>
  );
}
