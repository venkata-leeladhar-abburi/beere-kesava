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
import { Fragment, useMemo, useState, type AriaAttributes, type ReactNode } from "react";
import { cn } from "../utils";
import { Icon } from "../primitives/Icon";
import { Checkbox } from "../primitives/Checkbox";
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

  /** Row selection (Part E.3). Fully opt-in — omitting both props renders
   *  no checkbox column at all, identical to today's markup. */
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;

  /** Card-mode fallback below `md` (Part H.2), driven by each column's
   *  `priority`. Opt-in — omitting it keeps the table-only markup every
   *  existing consumer already renders, so nothing else is affected. */
  responsive?: boolean;

  /** Row expansion (drill-down detail / inline-edit-row patterns). Opt-in —
   *  omitting `renderExpandedRow` renders no extra markup at all. The
   *  expand trigger itself (a button in one of the columns) is the
   *  consumer's responsibility; DataTable only owns inserting the
   *  full-width row when the row's id is in `expandedIds`. */
  expandedIds?: Set<string>;
  renderExpandedRow?: (row: T) => ReactNode;

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
  onRowClick, rowClassName,
  selectedIds, onSelectionChange,
  responsive,
  expandedIds, renderExpandedRow,
  className,
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<{ columnId: string; direction: SortDirection } | undefined>(sort);
  const activeSort = sort ?? internalSort;
  const selectable = !!onSelectionChange;

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

  const mergeRuns = useMemo(() => {
    const runs = new Map<string, { span: number; skip: boolean }[]>();
    columns.forEach(col => {
      if (!col.mergeKey) return;
      const info: { span: number; skip: boolean }[] = [];
      let i = 0;
      while (i < sortedData.length) {
        const key = col.mergeKey!(sortedData[i]);
        let span = 1;
        if (key != null) {
          while (i + span < sortedData.length && col.mergeKey!(sortedData[i + span]) === key) span++;
        }
        for (let j = 0; j < span; j++) info.push(j === 0 ? { span, skip: false } : { span: 0, skip: true });
        i += span;
      }
      runs.set(col.id, info);
    });
    return runs;
  }, [columns, sortedData]);

  const pageIds = useMemo(() => sortedData.map(getRowId), [sortedData, getRowId]);
  const selectedOnPage = selectable ? pageIds.filter(id => selectedIds?.has(id)).length : 0;
  const allOnPageSelected = selectable && pageIds.length > 0 && selectedOnPage === pageIds.length;
  const someOnPageSelected = selectable && selectedOnPage > 0 && !allOnPageSelected;

  function toggleAllOnPage() {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds ?? []);
    if (allOnPageSelected) pageIds.forEach(id => next.delete(id));
    else pageIds.forEach(id => next.add(id));
    onSelectionChange(next);
  }

  function toggleRow(id: string) {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds ?? []);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  const rowHeight = ROW_HEIGHT[density];
  const colSpan = columns.length + (selectable ? 1 : 0);

  const stateBody = loading ? (
    <tr><td colSpan={colSpan} style={{ padding: 0 }}><TableSkeleton columns={colSpan} /></td></tr>
  ) : error ? (
    <tr><td colSpan={colSpan}><TableError onRetry={onRetry ?? (() => {})} /></td></tr>
  ) : sortedData.length === 0 ? (
    <tr>
      <td colSpan={colSpan}>
        {isFiltered
          ? <TableFilteredEmpty onClearFilters={onClearFilters ?? (() => {})} />
          : <TableEmpty title={emptyTitle} description={emptyDescription} />}
      </td>
    </tr>
  ) : null;

  const table = (
    <div className={cn("relative w-full overflow-x-auto", responsive && "hidden md:block")}>
      <table className="w-full border-collapse" style={{ fontSize: "var(--text-body-md, 14px)" }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {selectable && (
              <th scope="col" style={{ width: 44, background: "var(--surface-sunken)", borderBottom: "1px solid var(--border-default)", position: "sticky", top: 0, zIndex: 10 }}>
                <span className="flex items-center justify-center" style={{ height: 44 }}>
                  <Checkbox
                    checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAllOnPage}
                    aria-label="Select all rows on this page"
                  />
                </span>
              </th>
            )}
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
          {stateBody ?? sortedData.map((row, rowIndex) => {
              const id = getRowId(row);
              const isExpanded = !!(renderExpandedRow && expandedIds?.has(id));
              return (
                <Fragment key={id}>
                <tr
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors duration-[var(--duration-fast)]",
                    onRowClick && "cursor-pointer hover:bg-[var(--surface-raised-hover)]",
                    rowClassName?.(row)
                  )}
                  style={{ height: rowHeight, borderBottom: "1px solid var(--border-subtle)" }}
                >
                  {selectable && (
                    <td style={{ padding: "0 var(--pad-cell-x, 16px)", verticalAlign: "middle" }} onClick={e => e.stopPropagation()}>
                      <span className="flex items-center justify-center">
                        <Checkbox
                          checked={!!selectedIds?.has(id)}
                          onCheckedChange={() => toggleRow(id)}
                          aria-label="Select row"
                        />
                      </span>
                    </td>
                  )}
                  {columns.map(col => {
                    const merge = col.mergeKey ? mergeRuns.get(col.id)?.[rowIndex] : undefined;
                    if (merge?.skip) return null;
                    const value = col.accessor(row);
                    const align = columnAlign(col);
                    return (
                      <td
                        key={col.id}
                        rowSpan={merge && merge.span > 1 ? merge.span : undefined}
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
                {isExpanded && (
                  <tr>
                    <td colSpan={colSpan} style={{ padding: 0, borderBottom: "1px solid var(--border-subtle)" }}>
                      {renderExpandedRow!(row)}
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
        </tbody>
      </table>
    </div>
  );

  if (!responsive) return table;

  return (
    <>
      {table}
      <CardList
        columns={columns}
        data={sortedData}
        getRowId={getRowId}
        loading={loading}
        error={error}
        onRetry={onRetry}
        isFiltered={isFiltered}
        onClearFilters={onClearFilters}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        onRowClick={onRowClick}
        selectable={selectable}
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        className={className}
      />
    </>
  );
}

/** Card-mode fallback for `< md` (Part H.2). Rendered from the same
 *  ColumnDef[] as the table — priority 1 becomes the card title, 2 the
 *  body label/value pairs, 3 stays hidden. One source of truth: a column
 *  added to the table appears on the card automatically. */
function CardList<T>({
  columns, data, getRowId, loading, error, onRetry,
  isFiltered, onClearFilters, emptyTitle, emptyDescription,
  onRowClick, selectable, selectedIds, onToggleRow,
  className,
}: {
  columns: ColumnDef<T>[]; data: T[]; getRowId: (row: T) => string;
  loading?: boolean; error?: boolean; onRetry?: () => void;
  isFiltered?: boolean; onClearFilters?: () => void; emptyTitle?: string; emptyDescription?: string;
  onRowClick?: (row: T) => void;
  selectable: boolean; selectedIds?: Set<string>; onToggleRow: (id: string) => void;
  className?: string;
}) {
  const titleCol = columns.find(c => c.priority === 1);
  const bodyCols = columns.filter(c => (c.priority ?? 2) === 2 && c !== titleCol);

  if (loading) return <div className="md:hidden" style={{ padding: "var(--pad-cell-y, 12px) 0" }}><TableSkeleton columns={1} /></div>;
  if (error) return <div className="md:hidden"><TableError onRetry={onRetry ?? (() => {})} /></div>;
  if (data.length === 0) {
    return (
      <div className="md:hidden">
        {isFiltered
          ? <TableFilteredEmpty onClearFilters={onClearFilters ?? (() => {})} />
          : <TableEmpty title={emptyTitle} description={emptyDescription} />}
      </div>
    );
  }

  return (
    <div className={cn("md:hidden flex flex-col gap-3", className)}>
      {data.map(row => {
          const id = getRowId(row);
          return (
            <div
              key={id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn("rounded-[var(--radius-md,8px)] border border-[var(--border-default)] bg-[var(--surface-raised)] p-4", onRowClick && "cursor-pointer")}
            >
              <div className="flex items-start justify-between gap-3">
                {selectable && (
                  <span onClick={e => e.stopPropagation()}>
                    <Checkbox checked={!!selectedIds?.has(id)} onCheckedChange={() => onToggleRow(id)} aria-label="Select row" />
                  </span>
                )}
                {titleCol && (
                  <div className="flex-1 min-w-0" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {titleCol.cell ? titleCol.cell(titleCol.accessor(row), row) : defaultCell(titleCol, titleCol.accessor(row))}
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {bodyCols.map(col => (
                  <div key={col.id} className="flex items-center justify-between gap-3" style={{ fontSize: "var(--text-body-sm, 13px)" }}>
                    <span style={{ color: "var(--text-tertiary)" }}>{col.header}</span>
                    <span style={{ color: "var(--text-primary)" }}>{col.cell ? col.cell(col.accessor(row), row) : defaultCell(col, col.accessor(row))}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
