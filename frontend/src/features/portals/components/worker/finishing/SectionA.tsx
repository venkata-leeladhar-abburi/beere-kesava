import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckSquare, Square, Users, X, ChevronLeft, LayoutGrid, List } from "lucide-react";
import { C, F } from "../tokens";
import { useFinishing } from "@/features/finishing";
import { EASE, WORKER_NAME, ScanBar, useScan, Toast } from "./shared";
import { StaffPickerModal } from "./StaffPickerModal";
import { AssignWeaverGrid, AssignBatchGrid } from "./AssignSareeGridCards";
import { Button, IconButton, Select, SelectItem } from "../../../../../shared/ui/primitives";
import { DateFilterBar, type DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";
import { LoadingState, ErrorState } from "../../../../../shared/ui/state";

// ── Section A — Assign sarees ─────────────────────────────────────────────────

type GroupMode = "list" | "weaver" | "batch";

function formatDateShort(dateStr?: string) {
  if (!dateStr || dateStr === "—") return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function SectionA({ isMobile, isDesktop, isTablet }: { isMobile?: boolean; isDesktop?: boolean; isTablet?: boolean }) {
  const { readySarees, assignSarees, isLoading, isError, error, refetch } = useFinishing();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [toast, setToast] = useState("");
  const [filterWeaver, setFilterWeaver] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [groupMode, setGroupMode] = useState<GroupMode>("list");
  const [drilldown, setDrilldown] = useState<string | null>(null);

  const uniqueWeavers = useMemo(() => {
    const wSet = new Set(readySarees.map(s => s.weaverName));
    return Array.from(wSet);
  }, [readySarees]);

  const uniqueTypes = useMemo(() => {
    const tSet = new Set(readySarees.map(s => s.sareeTypeCode || s.sareeType).filter(Boolean));
    return Array.from(tSet);
  }, [readySarees]);

  const filteredSarees = useMemo(() => readySarees.filter(s => {
    const weaverOk = filterWeaver === "all" || s.weaverName === filterWeaver;
    const typeOk = filterType === "all" || (s.sareeTypeCode || s.sareeType) === filterType;
    const dateOk = matchesDateFilter(s.qcPassDate, dateFilter);
    return weaverOk && typeOk && dateOk;
  }), [readySarees, filterWeaver, filterType, dateFilter]);

  const weaverGroups = useMemo(() => {
    const map = new Map<string, typeof filteredSarees>();
    filteredSarees.forEach(s => {
      const list = map.get(s.weaverName) ?? [];
      list.push(s);
      map.set(s.weaverName, list);
    });
    return Array.from(map.entries()).map(([name, sarees]) => ({ name, sarees }));
  }, [filteredSarees]);

  const batchGroups = useMemo(() => {
    const map = new Map<string, typeof filteredSarees>();
    filteredSarees.forEach(s => {
      const key = s.batchId ?? "No Batch";
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    });
    return Array.from(map.entries()).map(([id, sarees]) => ({ id, sarees }));
  }, [filteredSarees]);

  // Grouping tab reset drops any drilldown; the group's own sarees list
  // scopes the table below whenever one is picked.
  useEffect(() => { setDrilldown(null); }, [groupMode]);

  const displaySarees = groupMode === "list"
    ? filteredSarees
    : drilldown
      ? (groupMode === "weaver" ? weaverGroups.find(g => g.name === drilldown)?.sarees : batchGroups.find(g => g.id === drilldown)?.sarees) ?? []
      : null;

  const unselectedIds = (displaySarees ?? []).filter(s => !selected.has(s.id)).map(s => s.id);
  const { scanMsg, scanValue, setScanValue, submitScan } = useScan(unselectedIds, id => {
    setSelected(prev => { const next = new Set(prev); next.add(id); return next; });
  });

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const list = displaySarees ?? [];
    if (selected.size === list.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(list.map(s => s.id)));
    }
  };

  const handleAssign = (staff: { id: string; name: string }) => {
    assignSarees([...selected], staff, WORKER_NAME);
    setToast(`${selected.size} saree${selected.size > 1 ? "s" : ""} assigned to ${staff.name}`);
    setSelected(new Set());
    setShowPicker(false);
  };

  const allChecked = (displaySarees?.length ?? 0) > 0 && selected.size === displaySarees?.length;
  const groupLabel = groupMode === "weaver" ? "Weaver / Loom" : "Batch";

  return (
    <div className="flex flex-col gap-3">
      {/* Grouping tabs — List / By Weaver / By Batch */}
      {readySarees.length > 0 && (
        <div style={{ display: "flex", margin: "0 0 4px", background: "#F5F0F2", borderRadius: 10, padding: 3 }}>
          {([["list", "List", List], ["weaver", "By Weaver / Loom", Users], ["batch", "By Batch", LayoutGrid]] as const).map(([key, label, Icon]) => (
            <Button key={key} variant={groupMode === key ? "primary" : "tertiary"} fullWidth size="sm"
              iconLeft={Icon}
              onClick={() => setGroupMode(key)}
              className={groupMode === key ? "rounded-[9px] bg-[#6E0F2D] hover:bg-[#6E0F2D] text-xs" : "rounded-[9px] text-xs"}>
              {label}
            </Button>
          ))}
        </div>
      )}

      {/* Sub-header: scan + select-all */}
      <div className="flex flex-col gap-2.5 w-full mb-1">
        <ScanBar value={scanValue} onChange={setScanValue} onSubmit={submitScan} />

        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="grid grid-cols-[3fr_2fr] md:flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="w-full md:w-[180px]">
              <Select value={filterWeaver} onValueChange={setFilterWeaver} size="sm" className="w-full">
                <SelectItem value="all">All Weavers / Looms</SelectItem>
                {uniqueWeavers.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </Select>
            </div>
            <div className="w-full md:w-[150px]">
              <Select value={filterType} onValueChange={setFilterType} size="sm" className="w-full">
                <SelectItem value="all">All Saree Types</SelectItem>
                {uniqueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </Select>
            </div>
          </div>

          {readySarees.length > 0 && (
            <div className="flex justify-end md:justify-start shrink-0">
              <Button variant="link" onClick={toggleAll} className="gap-1.5 p-0 px-1.5 py-1 text-xs text-[#69635E] whitespace-nowrap">
                {allChecked ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
                {allChecked ? "Deselect All" : "Select All"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* QC-pass date filter */}
      {readySarees.length > 0 && (
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      )}

      {/* Scan feedback */}
      {scanMsg && (
        <div style={{ background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.12)`, borderRadius: 10, padding: "9px 13px", marginBottom: 12, fontFamily: F.m, fontSize: 12, color: C.burg }}>
          {scanMsg}
        </div>
      )}

      {/* Grouped card grid — shown when a grouping tab is active and nothing is drilled into yet */}
      {displaySarees === null && groupMode === "weaver" && (
        weaverGroups.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No results for selected filters.</div>
        ) : (
          <AssignWeaverGrid groups={weaverGroups} onSelect={setDrilldown} isDesktop={isDesktop} isTablet={isTablet} />
        )
      )}
      {displaySarees === null && groupMode === "batch" && (
        batchGroups.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No results for selected filters.</div>
        ) : (
          <AssignBatchGrid groups={batchGroups} onSelect={setDrilldown} isDesktop={isDesktop} isTablet={isTablet} />
        )
      )}

      {/* Table — flat list mode, or a drilled-into weaver/batch group */}
      {displaySarees !== null && (
        <>
          {groupMode !== "list" && drilldown && (
            <button onClick={() => setDrilldown(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "0 0 10px", cursor: "pointer", fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.burg }}>
              <ChevronLeft size={15} /> {groupLabel}: {drilldown}
            </button>
          )}
          {isLoading ? (
            <LoadingState variant="skeleton" rows={4} />
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : displaySarees.length === 0 ? (
            <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
              {readySarees.length === 0 ? "No QC-passed sarees awaiting finishing." : "No results for selected filters."}
            </div>
          ) : (
            <div style={{ border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 14, overflow: "hidden" }}>
              {displaySarees.map((s, i) => {
                const checked = selected.has(s.id);
                const typeText = [s.designCode !== "—" && s.designCode, s.sareeType !== "—" && s.sareeType].filter(Boolean).join(" · ") || s.sareeType;
                return (
                  <div key={s.id}
                    onClick={() => toggleRow(s.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => toggleRow(s.id))?.(); } }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", minHeight: 64, borderTop: i > 0 ? `1px solid rgba(110,15,45,0.07)` : "none", borderLeft: `3px solid ${checked ? C.burg : "transparent"}`, background: checked ? "rgba(110,15,45,0.05)" : "#FFF", cursor: "pointer", transition: "background 0.12s" }}
                  >
                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                      {checked ? <CheckSquare size={18} color={C.burg} /> : <Square size={18} color={C.muted} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 600, color: C.burg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.id}
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.text, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {typeText}
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.weaverName}{s.batchId && s.batchId !== "—" ? ` · ${s.batchId}` : ""}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                      <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.burg, background: "rgba(110,15,45,0.08)", padding: "2px 7px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        QC Passed
                      </div>
                      <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
                        {formatDateShort(s.qcPassDate)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
            style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
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
