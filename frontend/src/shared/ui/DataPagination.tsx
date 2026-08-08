import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { brand, semantic, fonts } from "../../design-system/tokens";

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

export function Pagination({ page, pageCount, total, pageSize, start, onPageChange, onPageSizeChange, itemLabel = "items" }: {
  page: number; pageCount: number; total: number; pageSize: number; start: number;
  onPageChange: (p: number) => void; onPageSizeChange?: (n: number) => void; itemLabel?: string;
}) {
  if (total === 0) return null;
  const end = Math.min(start + pageSize, total);

  const btn: React.CSSProperties = {
    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "#FFF", color: T.royalBurgundy,
    cursor: "pointer",
  };
  const btnDisabled: React.CSSProperties = { ...btn, opacity: 0.35, cursor: "not-allowed", color: T.taupe };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12, padding: "12px 4px" }}>
      <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
        Showing <strong style={{ color: T.luxuryBrown }}>{start + 1}–{end}</strong> of <strong style={{ color: T.luxuryBrown }}>{total}</strong> {itemLabel}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onPageSizeChange && (
          <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}
            style={{ height: 32, padding: "0 8px", borderRadius: 8, border: `1px solid ${T.borderDef}`, background: T.silkCream, fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, cursor: "pointer" }}>
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
        )}
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onPageChange(1)} disabled={page === 1} style={page === 1 ? btnDisabled : btn} title="First page"><ChevronsLeft size={14} /></button>
          <button onClick={() => onPageChange(page - 1)} disabled={page === 1} style={page === 1 ? btnDisabled : btn} title="Previous page"><ChevronLeft size={14} /></button>
          <div style={{ display: "flex", alignItems: "center", padding: "0 10px", fontFamily: F.mono, fontSize: 12.5, color: T.luxuryBrown, fontWeight: 700 }}>
            {page} / {pageCount}
          </div>
          <button onClick={() => onPageChange(page + 1)} disabled={page === pageCount} style={page === pageCount ? btnDisabled : btn} title="Next page"><ChevronRight size={14} /></button>
          <button onClick={() => onPageChange(pageCount)} disabled={page === pageCount} style={page === pageCount ? btnDisabled : btn} title="Last page"><ChevronsRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
