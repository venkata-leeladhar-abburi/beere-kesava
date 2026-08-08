/**
 * DataTable — design-system/04-DATA-DISPLAY.md Part D.
 * ═══════════════════════════════════════════════════════════════════════════
 * Real <table>/<thead>/<tbody>/<th scope="col">, driven by one ColumnDef[].
 * This is the fix for the audit's two worst findings:
 *   - 300+ <th> at 9-11px, monospace, #8B7060 (4.11:1) → one 12px/Inter/
 *     --text-tertiary (5.92:1) header spec, applied here once.
 *   - 262 "grid-as-table" divs with no <th>, no scope, no caption → real
 *     table semantics, sortable, with all 5 mandatory states.
 *
 * This component is additive: it exists and can be adopted by a feature
 * incrementally (Part S, Step 3 — "migrate one feature end-to-end"). No
 * existing page has been changed to use it yet.
 */
import { useMemo, useState, type AriaAttributes } from "react";
import { cn } from "../utils";
import { Icon } from "../primitives/Icon";
import type { ColumnDef, SortDirection } from "./columns";
import { columnAlign, defaultSort } from "./columns";
import { defaultCell } from "./formatCell";
import { TableSkeleton, TableEmpty, TableFilteredEmpty, TableError } from "./TableStates";

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  getRowId: (row: T) => string;

  caption?: string;
  density?: "comfortable" | "default" | "compact";

  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;

  /** True when filters/search are active — switches the empty state from
   *  TableEmpty to TableFilteredEmpty (Part F.3). */
  isFiltered?: boolean;
  onClearFilters?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;

  sort?: { columnId: string; direction: SortDirection };
  onSortChange?: (sort: { columnId: string; direction: SortDirection }) => void;

  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;

  className?: string;
}

const ROW_HEIGHT: Record<NonNullable<DataTableProps<unknown>["density"]>, string> = {
  comfortable: "var(--row-height-comfortable, 56px)",
  default: "var(--row-height-default, 48px)",
  compact: "var(--row-height-compact, 40px)",
};

function nextDirection(current: SortDirection | undefined): SortDirection {
  if (current === "asc") return "desc";
  if (current === "desc") return "none";
  return "asc";
}

export function DataTable<T>({
  columns, data, getRowId, caption, density = "default",
  loading, error, onRetry,
  isFiltered, onClearFilters, emptyTitle = "Nothing here yet", emptyDescription,
  sort, onSortChange,
  onRowClick, rowClassName, className,
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<{ columnId: string; direction: SortDirection } | undefined>(sort);
  const activeSort = sort ?? internalSort;

  const sortedData = useMemo(() => {
    if (!activeSort || activeSort.direction === "none") return data;
    const col = columns.find(c => c.id === activeSort.columnId);
    if (!col) return data;
    const cmp = col.sortFn ?? defaultSort(col);
    const sorted = [...data].sort(cmp);
    return activeSort.direction === "desc" ? sorted.reverse() : sorted;
  }, [data, columns, activeSort]);

  function handleSortClick(col: ColumnDef<T>) {
    if (!col.sortable) return;
    const direction = nextDirection(activeSort?.columnId === col.id ? activeSort.direction : undefined);
    const next = { columnId: col.id, direction };
    if (onSortChange) onSortChange(next);
    else setInternalSort(next);
  }

  const rowHeight = ROW_HEIGHT[density];

  return (
    <div className={cn("relative w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse" style={{ fontSize: "var(--text-body-md, 14px)" }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map(col => {
              const align = columnAlign(col);
              const isSorted = activeSort?.columnId === col.id && activeSort.direction !== "none";
              const ariaSort = !col.sortable ? undefined : isSorted ? (activeSort!.direction === "asc" ? "ascending" : "descending") : "none";
              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={ariaSort as AriaAttributes["aria-sort"]}
                  title={col.headerTooltip}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    lineHeight: 1.3,
                    color: "var(--text-tertiary)",
                    background: "var(--surface-sunken)",
                    height: 44,
                    padding: "0 var(--pad-cell-x, 16px)",
                    textAlign: align,
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid var(--border-default)",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    width: col.width === "auto" ? undefined : col.width,
                  }}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSortClick(col)}
                      className="inline-flex items-center gap-1 bg-transparent border-0 p-0 m-0 cursor-pointer"
                      style={{ font: "inherit", color: "inherit", justifyContent: align === "end" ? "flex-end" : "flex-start", minHeight: 44 }}
                    >
                      {col.header}
                      <Icon
                        name={isSorted && activeSort!.direction === "desc" ? "expandDown" : "expandUp"}
                        size="xs"
                        className={isSorted ? "opacity-100" : "opacity-40"}
                      />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} style={{ padding: 0 }}><TableSkeleton columns={columns.length} /></td></tr>
          ) : error ? (
            <tr><td colSpan={columns.length}><TableError onRetry={onRetry ?? (() => {})} /></td></tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                {isFiltered
                  ? <TableFilteredEmpty onClearFilters={onClearFilters ?? (() => {})} />
                  : <TableEmpty title={emptyTitle} description={emptyDescription} />}
              </td>
            </tr>
          ) : (
            sortedData.map(row => {
              const id = getRowId(row);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors duration-[var(--duration-fast)]",
                    onRowClick && "cursor-pointer hover:bg-[var(--surface-raised-hover)]",
                    rowClassName?.(row)
                  )}
                  style={{ height: rowHeight, borderBottom: "1px solid var(--border-subtle)" }}
                >
                  {columns.map(col => {
                    const value = col.accessor(row);
                    const align = columnAlign(col);
                    return (
                      <td
                        key={col.id}
                        style={{
                          padding: "var(--pad-cell-y, 12px) var(--pad-cell-x, 16px)",
                          textAlign: align,
                          color: "var(--text-primary)",
                          verticalAlign: "middle",
                          whiteSpace: col.type === "code" ? "nowrap" : undefined,
                        }}
                      >
                        {col.cell ? col.cell(value, row) : defaultCell(col, value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
