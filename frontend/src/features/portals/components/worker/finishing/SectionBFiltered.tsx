import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckSquare, Square, X, CheckCircle2, Clock, ChevronLeft, LayoutGrid, List, Users } from "lucide-react";
import { C, F } from "../tokens";
import { useFinishing } from "@/features/finishing";
import { EASE, WORKER_NAME, ScanBar, useScan, Toast } from "./shared";
import { VerificationModal, VerifData } from "./VerificationModal";
import { ReceiveStaffGrid, ReceiveBatchGrid } from "./ReceiveSareeGridCards";
import { Button, IconButton, Select, SelectItem } from "../../../../../shared/ui/primitives";
import { DateFilterBar, type DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../../shared/ui/DateFilterBar";

// ── Section B with filters — Receive returns ──────────────────────────────────

type GroupMode = "list" | "staff" | "batch";

export function SectionBFiltered({ isMobile, isDesktop, isTablet }: { isMobile?: boolean; isDesktop?: boolean; isTablet?: boolean }) {
  const { assignments, receiveReturn } = useFinishing();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showVerif, setShowVerif] = useState(false);
  const [toast, setToast] = useState("");
  const [filterStaff, setFilterStaff] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [groupMode, setGroupMode] = useState<GroupMode>("list");
  const [drilldown, setDrilldown] = useState<string | null>(null);

  const awaiting = useMemo(() => assignments.filter(a => a.status === "awaiting-return"), [assignments]);

  // Get unique batches from awaiting
  const uniqueBatches = useMemo(() => {
    const bSet = new Set(awaiting.map(a => a.batchId ?? "—"));
    return Array.from(bSet).filter(b => b !== "—");
  }, [awaiting]);

  // Get unique staff names from awaiting
  const uniqueStaff = useMemo(() => {
    const sSet = new Set(awaiting.map(a => a.finishingStaffName));
    return Array.from(sSet);
  }, [awaiting]);

  // Get unique saree types from awaiting
  const uniqueTypes = useMemo(() => {
    const tSet = new Set(awaiting.map(a => a.sareeTypeCode || a.sareeType).filter(Boolean));
    return Array.from(tSet);
  }, [awaiting]);

  const filteredAwaiting = useMemo(() => awaiting.filter(a => {
    const staffOk = filterStaff === "all" || a.finishingStaffName === filterStaff;
    const batchOk = filterBatch === "all" || a.batchId === filterBatch;
    const typeOk = filterType === "all" || (a.sareeTypeCode || a.sareeType) === filterType;
    const dateOk = matchesDateFilter(a.assignedDate, dateFilter);
    return staffOk && batchOk && typeOk && dateOk;
  }), [awaiting, filterStaff, filterBatch, filterType, dateFilter]);

  const staffGroups = useMemo(() => {
    const map = new Map<string, typeof filteredAwaiting>();
    filteredAwaiting.forEach(a => {
      const list = map.get(a.finishingStaffName) ?? [];
      list.push(a);
      map.set(a.finishingStaffName, list);
    });
    return Array.from(map.entries()).map(([name, list]) => ({ name, assignments: list }));
  }, [filteredAwaiting]);

  const batchGroups = useMemo(() => {
    const map = new Map<string, typeof filteredAwaiting>();
    filteredAwaiting.forEach(a => {
      const key = a.batchId ?? "No Batch";
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    });
    return Array.from(map.entries()).map(([id, list]) => ({ id, assignments: list }));
  }, [filteredAwaiting]);

  // Switching grouping tabs drops any drilldown — the group's own list scopes
  // the table below whenever one is picked.
  useEffect(() => { setDrilldown(null); }, [groupMode]);

  const displayAwaiting = groupMode === "list"
    ? filteredAwaiting
    : drilldown
      ? (groupMode === "staff" ? staffGroups.find(g => g.name === drilldown)?.assignments : batchGroups.find(g => g.id === drilldown)?.assignments) ?? []
      : null;

  const unselectedIds = (displayAwaiting ?? []).filter(a => !selected.has(a.id)).map(a => a.sareeId);
  const { scanMsg, scanValue, setScanValue, submitScan } = useScan(unselectedIds, sareeId => {
    const match = (displayAwaiting ?? []).find(a => a.sareeId === sareeId);
    if (match) setSelected(prev => { const next = new Set(prev); next.add(match.id); return next; });
  });

  const toggleRow = (id: string) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleAll = () => {
    const list = displayAwaiting ?? [];
    if (selected.size === list.length) setSelected(new Set());
    else setSelected(new Set(list.map(a => a.id)));
  };

  const selectedAssignments = (displayAwaiting ?? []).filter(a => selected.has(a.id));
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const allChecked = (displayAwaiting?.length ?? 0) > 0 && selected.size === displayAwaiting?.length;
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
    <div>
      {/* Grouping tabs — List / By Staff / By Batch, same idea as Assign Sarees' grouping */}
      {awaiting.length > 0 && (
        <div style={{ display: "flex", margin: "0 0 10px", background: "#F5F0F2", borderRadius: 10, padding: 3 }}>
          {([["list", "List", List], ["staff", "By Staff", Users], ["batch", "By Batch", LayoutGrid]] as const).map(([key, label, Icon]) => (
            <Button key={key} variant={groupMode === key ? "primary" : "tertiary"} fullWidth size="sm"
              iconLeft={Icon}
              onClick={() => setGroupMode(key)}
              className={groupMode === key ? "rounded-[9px] bg-[#1E6640] hover:bg-[#1E6640] text-xs" : "rounded-[9px] text-xs"}>
              {label}
            </Button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" as const }}>
        <ScanBar value={scanValue} onChange={setScanValue} onSubmit={submitScan} />
        <div style={{ flex: 1, minWidth: 120 }}>
          <Select value={filterStaff} onValueChange={setFilterStaff} size="sm">
            <SelectItem value="all">All Staff</SelectItem>
            {uniqueStaff.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </Select>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <Select value={filterBatch} onValueChange={setFilterBatch} size="sm">
            <SelectItem value="all">All Batches</SelectItem>
            {uniqueBatches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </Select>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <Select value={filterType} onValueChange={setFilterType} size="sm">
            <SelectItem value="all">All Saree Types</SelectItem>
            {uniqueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </Select>
        </div>
        {displayAwaiting !== null && displayAwaiting.length > 0 && (
          <Button variant="link" onClick={toggleAll} className="gap-1.5 p-0 px-1.5 py-1 text-xs text-[#69635E] whitespace-nowrap">
            {allChecked ? <CheckSquare size={15} color={C.burg} /> : <Square size={15} color={C.muted} />}
            {allChecked ? "Deselect All" : "Select All"}
          </Button>
        )}
      </div>

      {/* Assigned-date filter */}
      {awaiting.length > 0 && (
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      )}

      {/* Scan feedback */}
      {scanMsg && (
        <div style={{ background: "rgba(30,102,64,0.06)", border: `1px solid rgba(30,102,64,0.18)`, borderRadius: 10, padding: "9px 13px", marginBottom: 12, fontFamily: F.m, fontSize: 12, color: "#1F774E" }}>
          {scanMsg}
        </div>
      )}

      {/* Grouped card grid — shown when a grouping tab is active and nothing is drilled into yet */}
      {displayAwaiting === null && groupMode === "staff" && (
        staffGroups.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No results for selected filters.</div>
        ) : (
          <ReceiveStaffGrid groups={staffGroups} onSelect={setDrilldown} isDesktop={isDesktop} isTablet={isTablet} />
        )
      )}
      {displayAwaiting === null && groupMode === "batch" && (
        batchGroups.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>No results for selected filters.</div>
        ) : (
          <ReceiveBatchGrid groups={batchGroups} onSelect={setDrilldown} isDesktop={isDesktop} isTablet={isTablet} />
        )
      )}

      {displayAwaiting !== null && (
      <>
      {groupMode !== "list" && drilldown && (
        <button onClick={() => setDrilldown(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "0 0 10px", cursor: "pointer", fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#1E6640" }}>
          <ChevronLeft size={15} /> {groupLabel}: {drilldown}
        </button>
      )}
      {displayAwaiting.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          {awaiting.length === 0 ? "No sarees currently awaiting return." : "No results for selected filters."}
        </div>
      ) : (
        <div style={{ border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 14, overflow: "hidden" }}>
          {displayAwaiting.map((a, i) => {
            const checked = selected.has(a.id);
            return (
              <div key={a.id} onClick={() => toggleRow(a.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => toggleRow(a.id))?.(); } }}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", minHeight: 64, borderTop: i > 0 ? `1px solid rgba(110,15,45,0.07)` : "none", borderLeft: `3px solid ${checked ? "#1F774E" : "transparent"}`, background: checked ? "rgba(31,119,78,0.06)" : "#FFF", cursor: "pointer", transition: "background 0.12s" }}>
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                  {checked ? <CheckSquare size={20} color="#1F774E" /> : <Square size={20} color={C.muted} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 500, color: C.burg }}>{a.sareeId}</div>
                  {/* Show saree type code instead of design code */}
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.sareeTypeCode || a.sareeType} · {a.finishingStaffName}
                  </div>
                  {a.batchId && <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{a.batchId}</div>}
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Assigned</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, margin: "3px 0 6px", fontVariantNumeric: "tabular-nums" }}>{a.assignedDate}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.32)", borderRadius: 999, padding: "3px 9px" }}>
                    <Clock size={11} color="#8D5802" />
                    <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#8D5802" }}>Awaiting</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
            style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
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
