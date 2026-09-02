/**
 * Worker Staff · Activity page.
 * ═══════════════════════════════════════════════════════════════════════════
 * The destination of the home page's "Recent Activity → View All". Same
 * chrome as every other worker page (PageHero + StatsStrip + SectionCard) and
 * the same shared filter/table primitives the rest of the app uses
 * (DateFilterBar, FilterBar, SearchInput, Select, DataTable) so nothing here
 * is a one-off component.
 */
import { useMemo, useState } from "react";
import { Activity, CheckCircle2, Package, ShieldAlert, Download } from "lucide-react";
import { C, F } from "./tokens";
import { PageHero, StatsStrip, SectionCard, type WorkerStat } from "./primitives";
import { useBatches } from "@/features/production";
import { useQc } from "@/features/qc";
import { Button, SearchInput, Select, SelectItem, StatusPill } from "@/shared/ui/primitives";
import { FilterBar, FilterBarActive, type ActiveFilter } from "@/shared/ui/filter";
import { DataTable, ViewToggle, exportTable, type ColumnDef, type SortDirection, type DataView } from "@/shared/ui/data";
import {
  DateFilterBar, DEFAULT_DATE_FILTER, matchesDateFilter, type DateFilterState,
} from "@/shared/ui/DateFilterBar";
import {
  ACTIVITY_CATEGORY_LABEL, ACTIVITY_TYPE_LABEL, buildWorkerActivity,
  formatActivityRelative, formatActivityTime,
  type WorkerActivityCategory, type WorkerActivityEvent, type WorkerActivityType,
} from "./activityFeed";

const TONE_PILL = {
  success: "success", warning: "warning", danger: "danger",
  brand: "brand", neutral: "neutral",
} as const;

interface WorkerActivityProps {
  isDesktop?: boolean;
  isTablet?: boolean;
}

export function WorkerActivity({ isDesktop = true }: WorkerActivityProps) {
  const { qcRecords, isLoading: qcLoading, isError: qcError, refetch: refetchQc } = useQc();
  const { batches, isLoading: batchesLoading, isError: batchesError, refetch: refetchBatches } = useBatches();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<WorkerActivityCategory | "all">("all");
  const [type, setType] = useState<WorkerActivityType | "all">("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  // Controlled so the header stays clickable — DataTable's `sort` prop needs
  // its `onSortChange` partner or header clicks are a no-op.
  const [sort, setSort] = useState<{ columnId: string; direction: SortDirection }>({ columnId: "when", direction: "desc" });
  const [dataView, setDataView] = useState<DataView>("table");

  const loading = qcLoading || batchesLoading;
  const error = qcError || batchesError;

  const retry = () => {
    if (qcError) refetchQc();
    if (batchesError) refetchBatches();
  };

  const events = useMemo(
    () => buildWorkerActivity(qcRecords, batches),
    [qcRecords, batches],
  );

  // The type list is derived from what's actually in the feed — a filter that
  // can only ever return nothing is worse than no filter.
  const availableTypes = useMemo(() => {
    const present = new Set(events.map(e => e.type));
    return (Object.keys(ACTIVITY_TYPE_LABEL) as WorkerActivityType[]).filter(t => present.has(t));
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter(e => {
      if (category !== "all" && e.category !== category) return false;
      if (type !== "all" && e.type !== type) return false;
      if (!matchesDateFilter(e.isoDate, dateFilter)) return false;
      if (!q) return true;
      return [e.sareeId, e.batchId, e.weaverName, e.sareeTypeName, e.actor, e.description]
        .some(v => v?.toLowerCase().includes(q));
    });
  }, [events, search, category, type, dateFilter]);

  const isFiltered = search.trim() !== "" || category !== "all" || type !== "all" || dateFilter.mode !== "all";

  const clearAll = () => {
    setSearch("");
    setCategory("all");
    setType("all");
    setDateFilter(DEFAULT_DATE_FILTER);
  };

  const activeFilters: ActiveFilter[] = [
    ...(search.trim() ? [{ key: "q", label: `Search: ${search.trim()}`, onRemove: () => setSearch("") }] : []),
    ...(category !== "all" ? [{ key: "cat", label: ACTIVITY_CATEGORY_LABEL[category], onRemove: () => setCategory("all") }] : []),
    ...(type !== "all" ? [{ key: "type", label: ACTIVITY_TYPE_LABEL[type], onRemove: () => setType("all") }] : []),
    ...(dateFilter.mode !== "all" ? [{ key: "date", label: `Date: ${dateFilter.mode}`, onRemove: () => setDateFilter(DEFAULT_DATE_FILTER) }] : []),
  ];

  const todayKey = new Date().toDateString();
  const todayCount = events.filter(e => new Date(e.isoDate).toDateString() === todayKey).length;
  const qcCount = events.filter(e => e.category === "qc").length;
  const failedCount = events.filter(e => e.type === "qc-defective").length;

  const stats: WorkerStat[] = [
    {
      label: "Activities today", icon: Activity,
      value: error ? "Error" : loading ? "…" : todayCount,
      sub: error ? "Tap to retry" : "Recorded since midnight",
      highlight: todayCount > 0,
      onClick: error ? retry : undefined,
    },
    {
      label: "Total activities", icon: Package,
      value: error ? "Error" : loading ? "…" : events.length,
      sub: error ? "Tap to retry" : "Across QC, receipts and finishing",
      onClick: error ? retry : undefined,
    },
    {
      label: "Quality checks", icon: CheckCircle2,
      value: error ? "Error" : loading ? "…" : qcCount,
      sub: error ? "Tap to retry" : "Inspections on record",
      onClick: error ? retry : undefined,
    },
    {
      label: "Defective results", icon: ShieldAlert,
      value: error ? "Error" : loading ? "…" : failedCount,
      sub: error ? "Tap to retry" : failedCount > 0 ? "⚠ Needs follow-up" : "None recorded",
      alert: failedCount > 0,
      onClick: error ? retry : undefined,
    },
  ];

  const columns: ColumnDef<WorkerActivityEvent>[] = [
    {
      id: "when", header: "When", type: "datetime", accessor: e => e.isoDate,
      sortable: true, priority: 2,
      cell: (_v, e) => (
        <div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{formatActivityTime(e.isoDate)}</div>
          <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>{formatActivityRelative(e.isoDate)}</div>
        </div>
      ),
    },
    {
      id: "activity", header: "Activity", type: "text", accessor: e => e.description,
      priority: 1,
      cell: (_v, e) => (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0, background: toneColor(e.tone) }} />
          <span style={{ fontFamily: F.u, fontSize: 14, color: C.text, lineHeight: 1.45 }}>{e.description}</span>
        </div>
      ),
    },
    {
      id: "type", header: "Type", type: "badge", accessor: e => e.label,
      sortable: true, priority: 2,
      cell: (_v, e) => <StatusPill tone={TONE_PILL[e.tone]} label={e.label} size="sm" />,
    },
    { id: "sareeId", header: "Saree ID", type: "code", accessor: e => e.sareeId, sortable: true, priority: 2 },
    { id: "batchId", header: "Batch", type: "code", accessor: e => e.batchId ?? "—", sortable: true, priority: 3 },
    { id: "weaver", header: "Weaver / Loom", type: "text", accessor: e => e.weaverName ?? "—", sortable: true, priority: 3 },
    { id: "sareeType", header: "Saree type", type: "text", accessor: e => e.sareeTypeName ?? "—", priority: 3 },
    { id: "actor", header: "Recorded by", type: "text", accessor: e => e.actor ?? "—", priority: 3 },
  ];

  return (
    <div style={{ background: C.bg }}>
      <PageHero
        eyebrow="Worker Staff · Activity"
        title="Activity"
        titleAccent="Log"
        description="Every quality check, saree receipt, finishing completion and tally recorded in the factory — searchable and filterable by date, category and outcome."
        minHeight={300}
      />

      <StatsStrip stats={stats} />

      <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <SectionCard
          icon={Activity}
          title="All Activity"
          subtitle="Newest first. Use the filters to narrow the log down."
          actions={
            <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
              {filtered.length} of {events.length}
            </span>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            <FilterBar>
              <SearchInput
                aria-label="Search activity"
                placeholder="Search saree ID, batch, weaver…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="min-w-[220px] flex-1"
              />
              <Select
                value={category}
                onValueChange={v => { setCategory(v as WorkerActivityCategory | "all"); setType("all"); }}
                placeholder="Category"
                containerClassName="min-w-[170px]"
              >
                <SelectItem value="all">All categories</SelectItem>
                {(Object.keys(ACTIVITY_CATEGORY_LABEL) as WorkerActivityCategory[]).map(c => (
                  <SelectItem key={c} value={c}>{ACTIVITY_CATEGORY_LABEL[c]}</SelectItem>
                ))}
              </Select>
              <Select
                value={type}
                onValueChange={v => setType(v as WorkerActivityType | "all")}
                placeholder="Type"
                containerClassName="min-w-[180px]"
              >
                <SelectItem value="all">All types</SelectItem>
                {availableTypes.map(t => (
                  <SelectItem key={t} value={t}>{ACTIVITY_TYPE_LABEL[t]}</SelectItem>
                ))}
              </Select>
              <Button
                variant="secondary"
                iconLeft={Download}
                onClick={() => void exportTable({ columns, rows: filtered, filename: "worker-activity", format: "csv", totalRowCount: events.length })}
                disabled={filtered.length === 0}
              >
                Export
              </Button>
            </FilterBar>

            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <ViewToggle value={dataView} onChange={setDataView} />
            </div>

            <FilterBarActive filters={activeFilters} onClearAll={clearAll} />
          </div>

          <DataTable
            caption="Worker staff activity log"
            columns={columns}
            data={filtered}
            getRowId={e => e.id}
            view={dataView}
            density={isDesktop ? "default" : "compact"}
            loading={loading}
            error={error}
            onRetry={retry}
            isFiltered={isFiltered}
            onClearFilters={clearAll}
            emptyTitle="No activity yet"
            emptyDescription="Quality checks, saree receipts and finishing completions will appear here as they are recorded."
            sort={sort}
            onSortChange={setSort}
            pagination
            pageSize={20}
            itemLabel="activities"
          />
        </SectionCard>
      </div>
    </div>
  );
}

function toneColor(tone: WorkerActivityEvent["tone"]): string {
  if (tone === "success") return C.green;
  if (tone === "danger") return C.crim;
  if (tone === "warning") return C.gold;
  if (tone === "brand") return C.burg;
  return C.muted;
}
