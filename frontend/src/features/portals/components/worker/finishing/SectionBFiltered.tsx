import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckSquare, Square, X, CheckCircle2, ChevronLeft, LayoutGrid, List, Users } from "lucide-react";
import { C, F } from "../tokens";
import { useFinishing } from "@/features/finishing";
import { EASE, WORKER_NAME, ScanBar, ScanFeedback, useSareeScan, Toast } from "./shared";
import { VerificationModal, VerifData } from "./VerificationModal";
import { ReceiveStaffGrid, ReceiveBatchGrid } from "./ReceiveSareeGridCards";
import { FinishingSareeTable, rowSearchText, type FinishingTableRow } from "./FinishingSareeTable";
import { useSareeDetails, formatDate } from "./sareeDetails";
import { Button, IconButton, Select, SelectItem, SearchInput } from "../../../../../shared/ui/primitives";
import { DateFilterBar, type DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";

// ── Section B with filters — Receive returns ──────────────────────────────────

type GroupMode = "list" | "staff" | "batch";

const GREEN = "#1F774E";
const AWAITING_STATUS = { label: "Awaiting Return", fg: "#8D5802", bg: "rgba(200,155,71,0.14)", bd: "rgba(200,155,71,0.32)" };

export function SectionBFiltered({ isMobile, isDesktop, isTablet }: { isMobile?: boolean; isDesktop?: boolean; isTablet?: boolean }) {
  const { assignments, receiveReturn, isLoading, isError, refetch } = useFinishing();
  const details = useSareeDetails();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showVerif, setShowVerif] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filterStaff, setFilterStaff] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [groupMode, setGroupMode] = useState<GroupMode>("list");
  const [drilldown, setDrilldown] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  const awaiting = useMemo(() => assignments.filter(a => a.status === "awaiting-return"), [assignments]);

  // Rows are keyed by assignment id (a saree can be assigned more than once
  // over its life) but scanned by saree id, which is what is on the barcode.
  const allRows = useMemo<FinishingTableRow[]>(() => awaiting.map(a => ({
    key: a.id,
    sareeId: a.sareeId,
    detail: details.get(a.sareeId),
    fallbackProducer: a.weaverName,
    fallbackTypeCode: a.sareeTypeCode ?? null,
    fallbackTypeName: a.sareeType,
    fallbackBatchId: a.batchId ?? null,
    staffName: a.finishingStaffName,
    quotationRef: a.quotationRef ?? null,
    date: a.assignedDate,
    status: AWAITING_STATUS,
  })), [awaiting, details]);

  const batchOf = useCallback(
    (r: FinishingTableRow) => r.detail?.batchId ?? (r.fallbackBatchId && r.fallbackBatchId !== "—" ? r.fallbackBatchId : "No Batch"),
    [],
  );
  const typeOf = useCallback(
    (r: FinishingTableRow) => r.detail?.sareeTypeCode ?? r.fallbackTypeCode ?? r.detail?.sareeTypeName ?? r.fallbackTypeName ?? "—",
    [],
  );

  const uniqueStaff = useMemo(() => Array.from(new Set(allRows.map(r => r.staffName ?? "—"))).sort(), [allRows]);
  const uniqueBatches = useMemo(() => Array.from(new Set(allRows.map(batchOf).filter(b => b !== "No Batch"))).sort(), [allRows, batchOf]);
  const uniqueTypes = useMemo(() => Array.from(new Set(allRows.map(typeOf).filter(t => t !== "—"))).sort(), [allRows, typeOf]);

  const q = search.trim().toLowerCase();
  const filteredRows = useMemo(() => allRows.filter(r => {
    const staffOk = filterStaff === "all" || r.staffName === filterStaff;
    const batchOk = filterBatch === "all" || batchOf(r) === filterBatch;
    const typeOk = filterType === "all" || typeOf(r) === filterType;
    const dateOk = matchesDateFilter(r.date ?? "", dateFilter);
    const searchOk = !q || rowSearchText(r).includes(q);
    return staffOk && batchOk && typeOk && dateOk && searchOk;
  }), [allRows, filterStaff, filterBatch, filterType, dateFilter, q, batchOf, typeOf]);

  const isFiltered = filterStaff !== "all" || filterBatch !== "all" || filterType !== "all"
    || dateFilter.mode !== "all" || q !== "";

  const clearFilters = useCallback(() => {
    setFilterStaff("all"); setFilterBatch("all"); setFilterType("all");
    setDateFilter(DEFAULT_DATE_FILTER); setSearch("");
  }, []);

  const staffGroups = useMemo(() => {
    const map = new Map<string, FinishingTableRow[]>();
    filteredRows.forEach(r => {
      const k = r.staffName ?? "—";
      map.set(k, [...(map.get(k) ?? []), r]);
    });
    return Array.from(map.entries()).map(([name, rows]) => ({ name, rows })).sort((a, b) => b.rows.length - a.rows.length);
  }, [filteredRows]);

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
      ? (groupMode === "staff" ? staffGroups.find(g => g.name === drilldown)?.rows : batchGroups.find(g => g.id === drilldown)?.rows) ?? []
      : null;

  const toggleRow = useCallback((key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  // Barcodes carry the saree id, but selection is keyed by assignment id — so
  // the scan resolves saree → assignment before ticking anything.
  const keyForSaree = useCallback(
    (sareeId: string, rows: FinishingTableRow[]) => rows.find(r => r.sareeId === sareeId)?.key,
    [],
  );

  const { scanMsg, scanTone, scanValue, setScanValue, submitScan, submitDetected } = useSareeScan({
    visibleIds: (displayRows ?? []).map(r => r.sareeId),
    allIds: allRows.map(r => r.sareeId),
    selectedIds: new Set(allRows.filter(r => selected.has(r.key)).map(r => r.sareeId)),
    onScanned: sareeId => {
      const key = keyForSaree(sareeId, displayRows ?? []);
      if (key) toggleRow(key);
    },
    onReveal: sareeId => {
      clearFilters();
      setGroupMode("list");
      setDrilldown(null);
      const key = keyForSaree(sareeId, allRows);
      if (key) setSelected(prev => new Set(prev).add(key));
    },
  });

  const toggleAll = () => {
    const list = displayRows ?? [];
    if (list.length > 0 && list.every(r => selected.has(r.key))) setSelected(new Set());
    else setSelected(new Set(list.map(r => r.key)));
  };

  const selectedAssignments = useMemo(
    () => awaiting.filter(a => selected.has(a.id)),
    [awaiting, selected],
  );
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const allChecked = (displayRows?.length ?? 0) > 0 && displayRows!.every(r => selected.has(r.key));
  const groupLabel = groupMode === "staff" ? "Staff" : "Batch";

  const handleSave = (data: Record<string, VerifData>) => {
    selectedAssignments.forEach(a => {
      const d = data[a.id];
      if (!d?.condition) return;
      receiveReturn({
        assignmentId: a.id,
        sareeId: a.sareeId,
        condition: d.condition,
        damageType: d.damageType || undefined,
        damageSeverity: d.damageSeverity || undefined,
        damageNotes: d.damageNotes || undefined,
        damagePhotoUrl: d.damagePhotoUrl,
        receivedBy: WORKER_NAME,
        receivedDate: today,
      });
    });
    const perfect = Object.values(data).filter(d => d.condition === "perfect").length;
    const damaged = Object.values(data).filter(d => d.condition === "damaged").length;
    setToast(`${perfect} perfect, ${damaged} damaged — logged`);
    setSelected(new Set());
    setShowVerif(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Grouping tabs — List / By Staff / By Batch */}
      {awaiting.length > 0 && (
        <div style={{ display: "flex", background: "#F5F0F2", borderRadius: 10, padding: 3 }}>
          {([["list", "List", List], ["staff", "By Staff", Users], ["batch", "By Batch", LayoutGrid]] as const).map(([key, label, Icon]) => (
            <Button key={key} variant={groupMode === key ? "primary" : "tertiary"} fullWidth size="sm"
              iconLeft={Icon}
              onClick={() => { setGroupMode(key); setDrilldown(null); }}
              className={groupMode === key ? "rounded-[9px] bg-[#1E6640] hover:bg-[#1E6640] text-xs" : "rounded-[9px] text-xs"}>
              {label}
            </Button>
          ))}
        </div>
      )}

      {/* Scan + search + filters */}
      <div className="flex flex-col gap-4 w-full mb-2">
        <ScanBar value={scanValue} onChange={setScanValue} onSubmit={submitScan} onDetected={submitDetected} tone="green" inputRef={scanRef} />
        <ScanFeedback msg={scanMsg} tone={scanTone} />

        <SearchInput
          aria-label="Search sarees out for finishing"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onSearch={setSearch}
          placeholder="Search by saree ID, staff, weaver, loom, batch, quotation…"
          className="w-full"
        />

        <div className="flex flex-wrap items-center gap-2 w-full">
          <Select value={filterStaff} onValueChange={setFilterStaff} className="w-[190px] max-w-full">
            <SelectItem value="all">All Staff</SelectItem>
            {uniqueStaff.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </Select>
          <Select value={filterBatch} onValueChange={setFilterBatch} className="w-[170px] max-w-full">
            <SelectItem value="all">All Batches</SelectItem>
            {uniqueBatches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </Select>
          <Select value={filterType} onValueChange={setFilterType} className="w-[170px] max-w-full">
            <SelectItem value="all">All Saree Types</SelectItem>
            {uniqueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </Select>
          {isFiltered && (
            <Button variant="link" onClick={clearFilters} className="whitespace-nowrap text-sm">Clear filters</Button>
          )}

          {displayRows !== null && displayRows.length > 0 && (
            <Button variant="link" onClick={toggleAll} className="gap-2 p-0 px-2 py-1 text-sm text-[#69635E] whitespace-nowrap ml-auto">
              {allChecked ? <CheckSquare size={16} color={GREEN} /> : <Square size={16} color={C.muted} />}
              {allChecked ? "Deselect All" : `Select All (${displayRows.length})`}
            </Button>
          )}
        </div>
      </div>

      {/* Assigned-date filter */}
      {awaiting.length > 0 && <DateFilterBar filter={dateFilter} onChange={setDateFilter} />}

      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
        Showing <strong style={{ color: C.text }}>{displayRows?.length ?? filteredRows.length}</strong> of {allRows.length} sarees out for finishing
        {selected.size > 0 && <> · <strong style={{ color: GREEN }}>{selected.size} selected</strong></>}
      </div>

      {/* Grouped card grid */}
      {displayRows === null && groupMode === "staff" && (
        staffGroups.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No results for selected filters.</div>
        ) : (
          <ReceiveStaffGrid groups={staffGroups} onSelect={setDrilldown} isDesktop={isDesktop} isTablet={isTablet} />
        )
      )}
      {displayRows === null && groupMode === "batch" && (
        batchGroups.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No results for selected filters.</div>
        ) : (
          <ReceiveBatchGrid groups={batchGroups} onSelect={setDrilldown} isDesktop={isDesktop} isTablet={isTablet} />
        )
      )}

      {displayRows !== null && (
        <>
          {groupMode !== "list" && drilldown && (
            <button onClick={() => setDrilldown(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "0 0 4px", cursor: "pointer", fontFamily: F.u, fontSize: 13, fontWeight: 600, color: GREEN }}>
              <ChevronLeft size={15} /> {groupLabel}: {drilldown}
            </button>
          )}
          <FinishingSareeTable
            rows={displayRows}
            selected={selected}
            onToggle={toggleRow}
            onSelectionChange={setSelected}
            accent={GREEN}
            dateHeader="Assigned"
            fmtDate={formatDate}
            showStaff
            isMobile={isMobile}
            loading={isLoading}
            error={isError}
            onRetry={refetch}
            isFiltered={isFiltered}
            onClearFilters={clearFilters}
            emptyTitle={awaiting.length === 0 ? "No sarees currently awaiting return" : "No sarees match these filters"}
            emptyDescription={awaiting.length === 0 ? "Sarees appear here once they are assigned to finishing staff." : undefined}
          />
        </>
      )}

      {/* Action bar */}
      <AnimatePresence>
        {selected.size > 0 && (isMobile ? (
          <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.26, ease: EASE }}
            style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 250, background: "#FFF", borderRadius: "16px 16px 0 0", padding: "14px 16px calc(16px + env(safe-area-inset-bottom))", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10, textAlign: "center" as const }}>
              {selected.size} saree{selected.size > 1 ? "s" : ""} selected
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 w-full flex-nowrap min-w-0">
              <Button variant="primary" iconLeft={CheckCircle2} onClick={() => setShowVerif(true)}
                className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center h-[44px] rounded-full bg-[#1E6640] hover:bg-[#1E6640]">
                Mark Received ({selected.size})
              </Button>
              <Button variant="secondary" onClick={() => setSelected(new Set())}
                className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center h-[44px] rounded-full border-[rgba(30,102,64,0.30)] text-[#1E6640]">
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="bar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2, ease: EASE }}
            style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
            <Button variant="primary" fullWidth iconLeft={CheckCircle2} onClick={() => setShowVerif(true)} className="h-[46px] rounded-full bg-[#1E6640] hover:bg-[#1E6640] text-sm">
              Mark {selected.size} as Received
            </Button>
            <IconButton icon={X} label="Cancel selection" variant="secondary" onClick={() => setSelected(new Set())}
              className="w-[46px] h-[46px] flex-shrink-0 rounded-xl border-[rgba(110,15,45,0.30)] text-[#6E0F2D]" />
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {showVerif && (
          <VerificationModal assignments={selectedAssignments} onSave={handleSave} onClose={() => setShowVerif(false)} isMobile={isMobile} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
    </div>
  );
}
