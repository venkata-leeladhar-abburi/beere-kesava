import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckSquare, Square, Users, X, ChevronLeft, LayoutGrid, List } from "lucide-react";
import { C, F } from "../tokens";
import { useFinishing } from "@/features/finishing";
import { EASE, WORKER_NAME, ScanBar, ScanFeedback, useSareeScan, Toast } from "./shared";
import { StaffPickerModal } from "./StaffPickerModal";
import { AssignWeaverGrid, AssignBatchGrid } from "./AssignSareeGridCards";
import { FinishingSareeTable, rowSearchText, type FinishingTableRow } from "./FinishingSareeTable";
import { useSareeDetails, formatDate } from "./sareeDetails";
import { Button, IconButton, Select, SelectItem, SearchInput } from "../../../../../shared/ui/primitives";
import { DateFilterBar, type DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";

// ── Section A — Assign sarees ─────────────────────────────────────────────────

type GroupMode = "list" | "weaver" | "batch";

const QC_STATUS = { label: "QC Passed", fg: "#1F774E", bg: "rgba(30,102,64,0.10)", bd: "rgba(30,102,64,0.22)" };

export function SectionA({ isMobile, isDesktop, isTablet }: { isMobile?: boolean; isDesktop?: boolean; isTablet?: boolean }) {
  const { readySarees, assignSarees, isLoading, isError, refetch } = useFinishing();
  const details = useSareeDetails();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filterWeaver, setFilterWeaver] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [groupMode, setGroupMode] = useState<GroupMode>("list");
  const [drilldown, setDrilldown] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  // Every ready saree, joined to its batch row so the table has a loom, a
  // design, a bulk order, a weight and a colour to show — none of which the
  // QC ready-list endpoint returns on its own.
  const allRows = useMemo<FinishingTableRow[]>(() => readySarees.map(s => ({
    key: s.id,
    sareeId: s.id,
    detail: details.get(s.id),
    fallbackProducer: s.weaverName,
    fallbackTypeCode: s.sareeTypeCode ?? null,
    fallbackTypeName: s.sareeType,
    fallbackBatchId: s.batchId ?? null,
    date: s.qcPassDate,
    status: QC_STATUS,
  })), [readySarees, details]);

  const producerOf = useCallback(
    (r: FinishingTableRow) => r.detail?.producerName ?? (r.fallbackProducer && r.fallbackProducer !== "—" ? r.fallbackProducer : "Unassigned"),
    [],
  );
  const batchOf = useCallback(
    (r: FinishingTableRow) => r.detail?.batchId ?? (r.fallbackBatchId && r.fallbackBatchId !== "—" ? r.fallbackBatchId : "No Batch"),
    [],
  );
  const typeOf = useCallback(
    (r: FinishingTableRow) => r.detail?.sareeTypeCode ?? r.fallbackTypeCode ?? r.detail?.sareeTypeName ?? r.fallbackTypeName ?? "—",
    [],
  );

  const uniqueWeavers = useMemo(() => Array.from(new Set(allRows.map(producerOf))).sort(), [allRows, producerOf]);
  const uniqueTypes = useMemo(() => Array.from(new Set(allRows.map(typeOf).filter(t => t !== "—"))).sort(), [allRows, typeOf]);
  const uniqueBatches = useMemo(() => Array.from(new Set(allRows.map(batchOf).filter(b => b !== "No Batch"))).sort(), [allRows, batchOf]);

  const q = search.trim().toLowerCase();
  const filteredRows = useMemo(() => allRows.filter(r => {
    const weaverOk = filterWeaver === "all" || producerOf(r) === filterWeaver;
    const typeOk = filterType === "all" || typeOf(r) === filterType;
    const batchOk = filterBatch === "all" || batchOf(r) === filterBatch;
    const dateOk = matchesDateFilter(r.date ?? "", dateFilter);
    const searchOk = !q || rowSearchText(r).includes(q);
    return weaverOk && typeOk && batchOk && dateOk && searchOk;
  }), [allRows, filterWeaver, filterType, filterBatch, dateFilter, q, producerOf, typeOf, batchOf]);

  const isFiltered = filterWeaver !== "all" || filterType !== "all" || filterBatch !== "all"
    || dateFilter.mode !== "all" || q !== "";

  const clearFilters = useCallback(() => {
    setFilterWeaver("all"); setFilterType("all"); setFilterBatch("all");
    setDateFilter(DEFAULT_DATE_FILTER); setSearch("");
  }, []);

  const weaverGroups = useMemo(() => {
    const map = new Map<string, FinishingTableRow[]>();
    filteredRows.forEach(r => {
      const k = producerOf(r);
      map.set(k, [...(map.get(k) ?? []), r]);
    });
    return Array.from(map.entries()).map(([name, rows]) => ({ name, rows })).sort((a, b) => b.rows.length - a.rows.length);
  }, [filteredRows, producerOf]);

  const batchGroups = useMemo(() => {
    const map = new Map<string, FinishingTableRow[]>();
    filteredRows.forEach(r => {
      const k = batchOf(r);
      map.set(k, [...(map.get(k) ?? []), r]);
    });
    return Array.from(map.entries()).map(([id, rows]) => ({ id, rows })).sort((a, b) => a.id.localeCompare(b.id));
  }, [filteredRows, batchOf]);

  const displayRows = groupMode === "list"
    ? filteredRows
    : drilldown
      ? (groupMode === "weaver" ? weaverGroups.find(g => g.name === drilldown)?.rows : batchGroups.find(g => g.id === drilldown)?.rows) ?? []
      : null;

  const toggleRow = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Scanning searches everything the section knows about, not just what the
  // current tab happens to be showing — a scanned saree hidden behind a filter
  // or a grouping tab reveals itself instead of reporting "not available".
  const { scanMsg, scanTone, scanValue, setScanValue, submitScan, submitDetected } = useSareeScan({
    visibleIds: (displayRows ?? []).map(r => r.sareeId),
    allIds: allRows.map(r => r.sareeId),
    selectedIds: selected,
    onScanned: toggleRow,
    onReveal: id => {
      clearFilters();
      setGroupMode("list");
      setDrilldown(null);
      setSelected(prev => new Set(prev).add(id));
    },
  });

  const toggleAll = () => {
    const list = displayRows ?? [];
    if (list.length > 0 && list.every(r => selected.has(r.key))) setSelected(new Set());
    else setSelected(new Set(list.map(r => r.key)));
  };

  const handleAssign = (staff: { id: string; name: string }) => {
    assignSarees([...selected], staff, WORKER_NAME);
    setToast(`${selected.size} saree${selected.size > 1 ? "s" : ""} assigned to ${staff.name}`);
    setSelected(new Set());
    setShowPicker(false);
  };

  const allChecked = (displayRows?.length ?? 0) > 0 && displayRows!.every(r => selected.has(r.key));
  const groupLabel = groupMode === "weaver" ? "Weaver / Loom" : "Batch";

  return (
    <div className="flex flex-col gap-3">
      {/* Grouping tabs — List / By Weaver / By Batch */}
      {readySarees.length > 0 && (
        <div style={{ display: "flex", margin: "0 0 4px", background: "#F5F0F2", borderRadius: 10, padding: 3 }}>
          {([["list", "List", List], ["weaver", "By Weaver / Loom", Users], ["batch", "By Batch", LayoutGrid]] as const).map(([key, label, Icon]) => (
            <Button key={key} variant={groupMode === key ? "primary" : "tertiary"} fullWidth size="sm"
              iconLeft={Icon}
              onClick={() => { setGroupMode(key); setDrilldown(null); }}
              className={groupMode === key ? "rounded-[9px] bg-[#6E0F2D] hover:bg-[#6E0F2D] text-xs" : "rounded-[9px] text-xs"}>
              {label}
            </Button>
          ))}
        </div>
      )}

      {/* Scan + search + filters in a single inline flex toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 w-full mb-2">
        <ScanBar value={scanValue} onChange={setScanValue} onSubmit={submitScan} onDetected={submitDetected} inputRef={scanRef} className="flex items-center gap-2 flex-1 min-w-[260px] sm:min-w-[300px]" />

        <SearchInput
          aria-label="Search ready sarees"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onSearch={setSearch}
          placeholder="Search by saree ID, weaver, batch..."
          className="flex-1 min-w-[180px] sm:min-w-[220px]"
        />

        <Select value={filterWeaver} onValueChange={setFilterWeaver} className="w-[180px] shrink-0">
          <SelectItem value="all">All Weavers / Looms</SelectItem>
          {uniqueWeavers.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
        </Select>
        <Select value={filterType} onValueChange={setFilterType} className="w-[160px] shrink-0">
          <SelectItem value="all">All Saree Types</SelectItem>
          {uniqueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </Select>
        <Select value={filterBatch} onValueChange={setFilterBatch} className="w-[150px] shrink-0">
          <SelectItem value="all">All Batches</SelectItem>
          {uniqueBatches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
        </Select>
        {isFiltered && (
          <Button variant="link" onClick={clearFilters} className="whitespace-nowrap text-sm shrink-0">Clear filters</Button>
        )}

        {displayRows !== null && displayRows.length > 0 && (
          <Button variant="link" onClick={toggleAll} className="gap-2 p-0 px-2 py-1 text-sm text-[#69635E] whitespace-nowrap ml-auto shrink-0">
            {allChecked ? <CheckSquare size={16} color={C.burg} /> : <Square size={16} color={C.muted} />}
            {allChecked ? "Deselect All" : `Select All (${displayRows.length})`}
          </Button>
        )}
      </div>
      <ScanFeedback msg={scanMsg} tone={scanTone} />

      {/* QC-pass date filter */}
      {readySarees.length > 0 && <DateFilterBar filter={dateFilter} onChange={setDateFilter} />}

      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
        Showing <strong style={{ color: C.text }}>{displayRows?.length ?? filteredRows.length}</strong> of {allRows.length} QC-passed sarees
        {selected.size > 0 && <> · <strong style={{ color: C.burg }}>{selected.size} selected</strong></>}
      </div>

      {/* Grouped card grid — shown when a grouping tab is active and nothing is drilled into yet */}
      {displayRows === null && groupMode === "weaver" && (
        weaverGroups.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No results for selected filters.</div>
        ) : (
          <AssignWeaverGrid groups={weaverGroups} onSelect={setDrilldown} isDesktop={isDesktop} isTablet={isTablet} />
        )
      )}
      {displayRows === null && groupMode === "batch" && (
        batchGroups.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No results for selected filters.</div>
        ) : (
          <AssignBatchGrid groups={batchGroups} onSelect={setDrilldown} isDesktop={isDesktop} isTablet={isTablet} />
        )
      )}

      {/* Table — flat list mode, or a drilled-into weaver/batch group */}
      {displayRows !== null && (
        <>
          {groupMode !== "list" && drilldown && (
            <button onClick={() => setDrilldown(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "0 0 4px", cursor: "pointer", fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.burg }}>
              <ChevronLeft size={15} /> {groupLabel}: {drilldown}
            </button>
          )}
          <FinishingSareeTable
            rows={displayRows}
            selected={selected}
            onToggle={toggleRow}
            onSelectionChange={setSelected}
            accent={C.burg}
            dateHeader="QC Passed"
            fmtDate={formatDate}
            isMobile={isMobile}
            loading={isLoading}
            error={isError}
            onRetry={refetch}
            isFiltered={isFiltered}
            onClearFilters={clearFilters}
            emptyTitle={readySarees.length === 0 ? "No QC-passed sarees awaiting finishing" : "No sarees match these filters"}
            emptyDescription={readySarees.length === 0 ? "Sarees appear here once they pass quality check." : undefined}
          />
        </>
      )}

      {/* Action bar — inline on tablet/desktop, bottom action sheet on mobile */}
      <AnimatePresence>
        {selected.size > 0 && (isMobile ? (
          <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.26, ease: EASE }}
            style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 250, background: "#FFF", borderRadius: "16px 16px 0 0", padding: "14px 16px calc(16px + env(safe-area-inset-bottom))", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10, textAlign: "center" as const }}>
              {selected.size} saree{selected.size > 1 ? "s" : ""} selected
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 w-full flex-nowrap min-w-0">
              <Button variant="primary" iconLeft={Users} onClick={() => setShowPicker(true)}
                className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center h-[44px] rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D]">
                Assign Staff ({selected.size})
              </Button>
              <Button variant="secondary" onClick={() => setSelected(new Set())}
                className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center h-[44px] rounded-full border-[rgba(110,15,45,0.30)] text-[#6E0F2D]">
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="bar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2, ease: EASE }}
            style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
            <Button variant="primary" fullWidth iconLeft={Users} onClick={() => setShowPicker(true)}
              className="h-[46px] rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D] text-sm">
              Assign {selected.size} Saree{selected.size > 1 ? "s" : ""} to Finishing Staff
            </Button>
            <IconButton icon={X} label="Cancel selection" variant="secondary" onClick={() => setSelected(new Set())}
              className="w-[46px] h-[46px] flex-shrink-0 rounded-xl border-[rgba(110,15,45,0.30)] text-[#6E0F2D]" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showPicker && <StaffPickerModal onSelect={handleAssign} onClose={() => setShowPicker(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
    </div>
  );
}
