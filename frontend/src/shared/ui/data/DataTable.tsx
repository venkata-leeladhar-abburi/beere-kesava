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
import { Fragment, useEffect, useMemo, useState, type AriaAttributes, type ReactNode } from "react";
import { cn } from "../utils";
import { Icon } from "../primitives/Icon";
import { Checkbox } from "../primitives/Checkbox";
import type { ColumnDef, SortDirection } from "./columns";
import { columnAlign, defaultSort } from "./columns";
import { defaultCell } from "./formatCell";
import { TableSkeleton, TableEmpty, TableFilteredEmpty, TableError } from "./TableStates";
import { usePagination, Pagination } from "../DataPagination";

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

  /** Forces one presentation regardless of viewport. "auto" (the default)
   *  keeps the breakpoint behaviour above: table from `md` up, cards below
   *  when `responsive` is set. "table" and "cards" are for consumers that
   *  offer the reader an explicit view toggle. */
  view?: "auto" | "table" | "cards";

  /** Row expansion (drill-down detail / inline-edit-row patterns). Opt-in —
   *  omitting `renderExpandedRow` renders no extra markup at all. The
   *  expand trigger itself (a button in one of the columns) is the
   *  consumer's responsibility; DataTable only owns inserting the
   *  full-width row when the row's id is in `expandedIds`. */
  expandedIds?: Set<string>;
  renderExpandedRow?: (row: T) => ReactNode;

  /** Built-in pagination support. Enabled by default if row count > pageSize (default 10). */
  pageSize?: number;
  pagination?: boolean;
  itemLabel?: string;

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
  view = "auto",
  expandedIds, renderExpandedRow,
  pageSize = 10, pagination = false, itemLabel = "items",
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
    return [...data].sort((a, b) => (activeSort.direction === "desc" ? -cmp(a, b) : cmp(a, b)));
  }, [data, columns, activeSort]);

  const pag = usePagination(sortedData, pageSize);
  const showPagination = pagination === true && sortedData.length > 0;
  const displayData = showPagination ? pag.pageItems : sortedData;

  function handleSortClick(col: ColumnDef<T>) {
    if (!col.sortable) return;
    const direction = nextDirection(activeSort?.columnId === col.id ? activeSort.direction : undefined);
    const next = { columnId: col.id, direction };
    if (onSortChange) {
      onSortChange(next);
    } else if (sort !== undefined) {
      // Controlled `sort` without `onSortChange` — internalSort would be
      // written but `activeSort` always prefers the `sort` prop, so it would
      // silently never be read and header clicks would appear dead. Surface
      // the misconfiguration instead of failing silently (same convention
      // React uses for a controlled <input> with no onChange).
      if (process.env.NODE_ENV !== "production") {
        console.warn(`DataTable: column "${col.id}" is sortable and \`sort\` is controlled, but no \`onSortChange\` was passed — sort clicks will have no effect. Pass \`onSortChange\` or omit \`sort\` to use uncontrolled sorting.`);
      }
    } else {
      setInternalSort(next);
    }
  }

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !columns.some(c => c.mergeKey)) return;
    // mergeKey spans a cell across consecutive rows that share a key, which
    // only makes sense when those rows are already adjacent — a header click
    // that sorts by a *different* column scatters them and the merged span
    // breaks silently. Likewise a `renderExpandedRow` inserted between two
    // rows of the same merge run splits the spanned cell across it. Neither
    // has a real fix without redesigning around a concrete use case (no
    // caller uses mergeKey today), so this is a loud heads-up for whoever
    // adopts it rather than a silent trap.
    if (columns.some(c => c.sortable)) {
      console.warn("DataTable: a column uses `mergeKey` alongside sortable columns — sorting by a non-merge column will scatter merged rows and break their rowSpan.");
    }
    if (renderExpandedRow) {
      console.warn("DataTable: a column uses `mergeKey` alongside `renderExpandedRow` — an expanded row inserted between two rows of the same merge run will split the merged cell.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, !!renderExpandedRow]);

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

  // "auto": the table owns md-and-up, cards own below it (when `responsive`).
  // A forced view drops the breakpoint classes and renders one branch only.
  const showTable = view !== "cards";
  const showCards = view === "cards" || (view === "auto" && responsive);
  const tableVisibility = view === "auto" && responsive ? "hidden md:block" : undefined;
  const cardVisibility = view === "auto" ? "md:hidden" : undefined;

  const table = (
    <div className={cn("relative w-full overflow-x-auto", tableVisibility)}>
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
          {stateBody ?? displayData.map((row, rowIndex) => {
              const id = getRowId(row);
              const isExpanded = !!(renderExpandedRow && expandedIds?.has(id));
              return (
                <Fragment key={id}>
                <tr
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? e => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
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
                          width: col.width === "auto" ? undefined : col.width,
                        }}
                      >
                        {col.cell ? col.cell(value, row, sortedData.indexOf(row)) : defaultCell(col, value)}
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

  return (
    <div data-pagination-target className="bk-data-table-container">
      {showTable && table}
      {showCards && (
        <CardList
          visibilityClass={cardVisibility}
          columns={columns}
          data={displayData}
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
      )}
      {showPagination && (
        <Pagination
          page={pag.page}
          pageCount={pag.pageCount}
          total={pag.total}
          pageSize={pag.pageSize}
          start={pag.start}
          onPageChange={pag.setPage}
          onPageSizeChange={pag.setPageSize}
          itemLabel={itemLabel}
        />
      )}
    </div>
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
  className, visibilityClass,
}: {
  columns: ColumnDef<T>[]; data: T[]; getRowId: (row: T) => string;
  loading?: boolean; error?: boolean; onRetry?: () => void;
  isFiltered?: boolean; onClearFilters?: () => void; emptyTitle?: string; emptyDescription?: string;
  onRowClick?: (row: T) => void;
  selectable: boolean; selectedIds?: Set<string>; onToggleRow: (id: string) => void;
  className?: string;
  /** Breakpoint gate — "md:hidden" in auto mode, absent when the view is forced. */
  visibilityClass?: string;
}) {
  const titleCol = columns.find(c => c.priority === 1);
  // A consumer-defined `id: "select"` column (a manual checkbox column, used
  // instead of DataTable's own selectedIds/onSelectionChange props when the
  // selection logic needs extra per-row rules e.g. "only dispatchable rows
  // are pickable") has no natural `priority` and would otherwise fall into
  // bodyCols below — rendering its *header* cell (the select-all checkbox)
  // as if it were a row's label. Route it into the leading-checkbox slot by
  // id instead, using its per-row cell, so it behaves like a real checkbox.
  const selectCol = columns.find(c => c.id === "select");
  const bodyCols = columns.filter(c => (c.priority ?? 2) === 2 && c !== titleCol && c !== selectCol);

  if (loading) return <div className={visibilityClass} style={{ padding: "var(--pad-cell-y, 12px) 0" }}><TableSkeleton columns={1} /></div>;
  if (error) return <div className={visibilityClass}><TableError onRetry={onRetry ?? (() => {})} /></div>;
  if (data.length === 0) {
    return (
      <div className={visibilityClass}>
        {isFiltered
          ? <TableFilteredEmpty onClearFilters={onClearFilters ?? (() => {})} />
          : <TableEmpty title={emptyTitle} description={emptyDescription} />}
      </div>
    );
  }

  return (
    <div className={cn(visibilityClass, "flex flex-col gap-3", className)}>
      {data.map(row => {
          const id = getRowId(row);
          const cardClassName = cn("rounded-[var(--radius-md,8px)] border border-[var(--border-default)] bg-[var(--surface-raised)] p-4", onRowClick && "cursor-pointer");
          return onRowClick ? (
            <div
              key={id}
              onClick={() => onRowClick(row)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
              role="button"
              tabIndex={0}
              className={cardClassName}
            >
              <div className="flex items-start justify-between gap-3">
                {selectCol ? (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- this span only stops click bubbling to the row; it wraps an already-interactive cell/checkbox that has its own keyboard handling.
                  <span onClick={e => e.stopPropagation()}>
                    {selectCol.cell ? selectCol.cell(selectCol.accessor(row), row, data.indexOf(row)) : defaultCell(selectCol, selectCol.accessor(row))}
                  </span>
                ) : selectable && (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- this span only stops click bubbling to the row; the nested Checkbox is the real interactive control.
                  <span onClick={e => e.stopPropagation()}>
                    <Checkbox checked={!!selectedIds?.has(id)} onCheckedChange={() => onToggleRow(id)} aria-label="Select row" />
                  </span>
                )}
                {titleCol && (
                  <div className="flex-1 min-w-0" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {titleCol.cell ? titleCol.cell(titleCol.accessor(row), row, data.indexOf(row)) : defaultCell(titleCol, titleCol.accessor(row))}
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {bodyCols.map(col => (
                  <div key={col.id} className="flex items-center justify-between gap-3" style={{ fontSize: "var(--text-body-sm, 13px)" }}>
                    <span style={{ color: "var(--text-tertiary)" }}>{col.header}</span>
                    <span style={{ color: "var(--text-primary)" }}>{col.cell ? col.cell(col.accessor(row), row, data.indexOf(row)) : defaultCell(col, col.accessor(row))}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              key={id}
              className={cardClassName}
            >
              <div className="flex items-start justify-between gap-3">
                {selectCol ? (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- this span only stops click bubbling to the row; it wraps an already-interactive cell/checkbox that has its own keyboard handling.
                  <span onClick={e => e.stopPropagation()}>
                    {selectCol.cell ? selectCol.cell(selectCol.accessor(row), row, data.indexOf(row)) : defaultCell(selectCol, selectCol.accessor(row))}
                  </span>
                ) : selectable && (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- this span only stops click bubbling to the row; the nested Checkbox is the real interactive control.
                  <span onClick={e => e.stopPropagation()}>
                    <Checkbox checked={!!selectedIds?.has(id)} onCheckedChange={() => onToggleRow(id)} aria-label="Select row" />
                  </span>
                )}
                {titleCol && (
                  <div className="flex-1 min-w-0" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {titleCol.cell ? titleCol.cell(titleCol.accessor(row), row, data.indexOf(row)) : defaultCell(titleCol, titleCol.accessor(row))}
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {bodyCols.map(col => (
                  <div key={col.id} className="flex items-center justify-between gap-3" style={{ fontSize: "var(--text-body-sm, 13px)" }}>
                    <span style={{ color: "var(--text-tertiary)" }}>{col.header}</span>
                    <span style={{ color: "var(--text-primary)" }}>{col.cell ? col.cell(col.accessor(row), row, data.indexOf(row)) : defaultCell(col, col.accessor(row))}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
