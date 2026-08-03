import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FloppyDisk, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useBatches, SareeRow, BatchRecord, generateSareeId } from "../contexts/BatchContext";
import { useBulkOrders } from "../../bulk-orders/contexts/BulkOrderContext";
import { useDesignLibrary, DesignEntry } from "../../design-library/contexts/DesignLibraryContext";
import { DesignCodeCard } from "../../design-library/components/DesignLibraryPage";
import { SareeTypeCard, SareeTypeRecord } from "../../pricing/components/RatesPricingPage";
import { FACTORY_LOOMS_LIST } from "../data/factoryLooms";
import { DispatchDetailsModal } from "./DispatchDetailsModal";
import { useMaterialIssue } from "../../materials/contexts/MaterialIssueContext";
import { DateFilterState, DEFAULT_DATE_FILTER } from "../../../shared/ui/DateFilterBar";

import { T, F, G, WEAVERS, SAREE_TYPE_RECORDS, fld, lbl, rowComplete } from "./batch-creation/constants";
import type { ActivePicker } from "./batch-creation/types";
import {
  WeaverPickerModal, BulkOrderPickerModal, DesignCodePickerModal,
  SareeTypePickerModal, WeaverLoomPickerModal, FactoryLoomPickerModal,
} from "./batch-creation/PickerModals";
import {
  WeaverDetailsModal, FactoryLoomDetailsModal, BulkOrderDetailsModal, SareeDetailsModal,
} from "./batch-creation/DetailModals";
import { BatchTable } from "./batch-creation/BatchTable";
import { DraftsTab } from "./batch-creation/DraftsTab";

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function BatchCreationPage() {
  const { batches, saveDraft, finalizeBatch, nextBatchId, pendingOpenBatchId, setPendingOpenBatchId } = useBatches();
  const { designs, dispatches } = useDesignLibrary();

  // ── Tab: "new" or "drafts"
  const [tab, setTab] = useState<"new" | "drafts">("new");
  const [batchDateFilter, setBatchDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  // ── Editing state: either creating new or editing a draft
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  // ── Step 1 form
  const [batchId, setBatchId] = useState(nextBatchId);
  const [totalCount, setTotalCount] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [generated, setGenerated] = useState(false);

  // ── Saree rows
  const [rows, setRows] = useState<SareeRow[]>([]);

  // ── Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // ── Active picker
  const [picker, setPicker] = useState<ActivePicker>(null);

  // ── Card view modals
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);
  const [viewSareeType, setViewSareeType] = useState<SareeTypeRecord | null>(null);
  const [viewWeaver, setViewWeaver] = useState<typeof WEAVERS[0] | null>(null);
  const [viewFactoryLoom, setViewFactoryLoom] = useState<typeof FACTORY_LOOMS_LIST[0] | null>(null);
  const [viewBulkOrder, setViewBulkOrder] = useState<any | null>(null);
  const [viewSareeRow, setViewSareeRow] = useState<SareeRow | null>(null);
  const [viewDispatches, setViewDispatches] = useState<{ weaverName: string; records: any[] } | null>(null);

  // ── Per-row loom picker (scoped to that row's weaver's own loom count)
  const [loomPickerRow, setLoomPickerRow] = useState<SareeRow | null>(null);

  // ── Sort control
  const [sortBy, setSortBy] = useState<"serial" | "weaver" | "factoryLoom">("serial");

  // ── Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [weaverFilter, setWeaverFilter] = useState("All");
  const [orderFilter, setOrderFilter] = useState("All");
  const [sareeTypeFilter, setSareeTypeFilter] = useState("All");

  const { issueRecords } = useMaterialIssue();

  // ── Saved feedback
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Keep batchId in sync with next available when not editing a draft
  useEffect(() => {
    if (!editingBatchId) setBatchId(nextBatchId);
  }, [nextBatchId, editingBatchId]);

  // ── Generate rows
  function generateRows() {
    const n = parseInt(totalCount, 10);
    if (!n || n < 1 || n > 500) return;
    setRows(Array.from({ length: n }, (_, i) => ({
      serial: i + 1,
      sareeId: null, recipientType: undefined,
      weaverId: null, weaverName: null, weaverInitials: null, weaverLoom: null,
      factoryLoomId: null, factoryLoomNumber: null,
      designCode: null, sareeTypeCode: null, sareeTypeName: null,
      bulkOrderRef: null, bulkOrderLabel: null,
    })));
    setSelected(new Set());
    setGenerated(true);
  }

  // ── Selection helpers
  const allSelected = rows.length > 0 && selected.size === rows.length;
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(rows.map(r => r.serial))); }
  function toggleRow(serial: number) {
    setSelected(prev => { const n = new Set(prev); if (n.has(serial)) n.delete(serial); else n.add(serial); return n; });
  }

  // ── Apply weaver to selected rows
  function applyWeaver(w: typeof WEAVERS[0]) {
    // Per-weaver sequence tracking within this batch
    const seqMap: Record<string, number> = {};
    rows.forEach(r => {
      if (r.weaverId === w.id && r.sareeId) {
        const m = r.sareeId.match(/-(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          seqMap[w.id] = Math.max(seqMap[w.id] || 0, n);
        }
      }
    });
    let seq = seqMap[w.id] || 0;
    setRows(prev => prev.map(r => {
      if (!selected.has(r.serial)) return r;
      seq++;
      return {
        ...r, recipientType: "weaver" as const,
        weaverId: w.id, weaverName: w.name, weaverInitials: w.initials, weaverLoom: 1,
        factoryLoomId: null, factoryLoomNumber: null,
        sareeId: generateSareeId(w.name, 1, seq),
      };
    }));
    setPicker(null);
  }

  // ── Apply a specific loom (scoped to that weaver's own loom count) to one row
  function applyWeaverLoomToRow(row: SareeRow, loomNum: number) {
    setRows(prev => prev.map(r => {
      if (r.serial !== row.serial) return r;
      const seqMatch = r.sareeId ? r.sareeId.match(/-(\d+)$/) : null;
      const seq = seqMatch ? parseInt(seqMatch[1], 10) : r.serial;
      const newSareeId = r.weaverName ? generateSareeId(r.weaverName, loomNum, seq) : r.sareeId;
      return { ...r, weaverLoom: loomNum, sareeId: newSareeId };
    }));
    setLoomPickerRow(null);
  }

  // ── Apply a factory loom to selected rows (replaces any weaver assignment)
  function applyFactoryLoom(loom: typeof FACTORY_LOOMS_LIST[0]) {
    const seqMap: Record<string, number> = {};
    rows.forEach(r => {
      if (r.factoryLoomId === loom.id && r.sareeId) {
        const m = r.sareeId.match(/-(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          seqMap[loom.id] = Math.max(seqMap[loom.id] || 0, n);
        }
      }
    });
    let seq = seqMap[loom.id] || 0;
    setRows(prev => prev.map(r => {
      if (!selected.has(r.serial)) return r;
      seq++;
      return {
        ...r, recipientType: "factoryLoom" as const,
        weaverId: null, weaverName: null, weaverInitials: null, weaverLoom: null,
        factoryLoomId: loom.id, factoryLoomNumber: loom.loomNumber,
        sareeId: `${loom.id}-${String(seq).padStart(3, "0")}`,
      };
    }));
    setPicker(null);
  }

  const { bulkOrders } = useBulkOrders();

  // ── Apply bulk order
  function applyBulkOrder(ref: string | null, label: string) {
    const order = bulkOrders.find(o => o.ref === ref);
    let sareeTypeCode = null;
    let sareeTypeName = null;
    let designCode = null;
    if (order) {
      const match = order.sareeType.match(/(.*)\s+·\s+(.*)/) || order.sareeType.match(/(.*)·(.*)/);
      if (match) {
        sareeTypeName = match[1].trim();
        sareeTypeCode = match[2].trim();
      } else {
        sareeTypeName = order.sareeType;
      }
      designCode = order.design;
    }

    setRows(prev => prev.map(r => {
      if (!selected.has(r.serial)) return r;
      return {
        ...r,
        bulkOrderRef: ref,
        bulkOrderLabel: label,
        ...(order ? { sareeTypeCode, sareeTypeName, designCode } : {})
      };
    }));
    setPicker(null);
  }

  // ── Apply design code
  function applyDesign(code: string) {
    setRows(prev => prev.map(r => selected.has(r.serial) ? { ...r, designCode: code } : r));
    setPicker(null);
  }

  // ── Apply saree type
  function applySareeType(code: string, name: string) {
    setRows(prev => prev.map(r => selected.has(r.serial) ? { ...r, sareeTypeCode: code, sareeTypeName: name } : r));
    setPicker(null);
  }

  // ── Remove selected rows
  function removeSelected() {
    setRows(prev => prev.filter(r => !selected.has(r.serial)).map((r, i) => ({ ...r, serial: i + 1 })));
    setSelected(new Set());
  }

  // ── Save as draft
  function handleSaveDraft() {
    const record: BatchRecord = {
      batchId, totalCount: rows.length, dueDate, rows,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveDraft(record);
    setEditingBatchId(batchId);
    setSavedMsg("Saved as draft.");
    setTimeout(() => setSavedMsg(null), 3000);
  }

  // ── Finalize
  const completeRows = rows.filter(rowComplete);
  const incompleteRows = rows.filter(r => !rowComplete(r));
  const canFinalize = rows.length > 0 && incompleteRows.length === 0;

  function handleFinalize() {
    if (!canFinalize) return;
    const record: BatchRecord = {
      batchId, totalCount: rows.length, dueDate, rows,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveDraft(record);
    finalizeBatch(batchId);
    setSavedMsg(`Batch ${batchId} finalized and active!`);

    // Clear and reset the form state so the user can create the next batch
    setTimeout(() => {
      setSavedMsg(null);
      setRows([]);
      setTotalCount("");
      setDueDate("");
      setGenerated(false);
      setSelected(new Set());
      setEditingBatchId(null);
    }, 2000);
  }

  // ── Sorted and filtered view of rows (does not mutate underlying row order/serials)
  const weaverOptions = React.useMemo(() => ["All", ...Array.from(new Set(rows.map(r => r.weaverName || r.factoryLoomNumber).filter(Boolean)))].sort(), [rows]);
  const orderOptions = React.useMemo(() => ["All", "General Stock", ...Array.from(new Set(rows.map(r => r.bulkOrderLabel).filter(Boolean)))].sort(), [rows]);
  const sareeTypeOptions = React.useMemo(() => ["All", ...Array.from(new Set(rows.map(r => r.sareeTypeCode).filter(Boolean)))].sort(), [rows]);

  const displayRows = [...rows].filter(r => {
    const q = searchFilter.toLowerCase();
    const mSearch = !q || r.sareeId?.toLowerCase().includes(q) || r.weaverName?.toLowerCase().includes(q) || r.factoryLoomNumber?.toLowerCase().includes(q);
    const wName = r.weaverName || r.factoryLoomNumber;
    const mWeaver = weaverFilter === "All" || wName === weaverFilter;
    const orderLabel = r.bulkOrderLabel || "General Stock";
    const mOrder = orderFilter === "All" || orderLabel === orderFilter;
    const mType = sareeTypeFilter === "All" || r.sareeTypeCode === sareeTypeFilter;
    return mSearch && mWeaver && mOrder && mType;
  }).sort((a, b) => {
    if (sortBy === "weaver") {
      const an = a.weaverName || "", bn = b.weaverName || "";
      return an.localeCompare(bn) || a.serial - b.serial;
    }
    if (sortBy === "factoryLoom") {
      const an = a.factoryLoomNumber || "", bn = b.factoryLoomNumber || "";
      return an.localeCompare(bn) || a.serial - b.serial;
    }
    return a.serial - b.serial;
  });

  // ── Open a draft for editing
  function openDraft(b: BatchRecord) {
    setEditingBatchId(b.batchId);
    setBatchId(b.batchId);
    setTotalCount(String(b.totalCount));
    setDueDate(b.dueDate);
    setRows(b.rows);
    setGenerated(true);
    setSelected(new Set());
    setTab("new");
  }

  // ── Auto-open batch signaled from another page (e.g. "Open in Batch Creation" from ProductionPage)
  useEffect(() => {
    if (pendingOpenBatchId) {
      const b = batches.find(x => x.batchId === pendingOpenBatchId);
      if (b) openDraft(b);
      setPendingOpenBatchId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOpenBatchId]);

  // ── Design/SareeType for card view
  function openSareeTypeCard(code: string) {
    const r = SAREE_TYPE_RECORDS.find(x => x.code === code);
    if (r) setViewSareeType(r);
  }

  const drafts = batches.filter(b => b.status === "draft");
  const active = batches.filter(b => b.status === "active");

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", fontFamily: F.ui }}>

      {/* ── Header ── */}
      <div style={{ background: G.header, padding: "32px 56px 64px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, bottom: -60, width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.14)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 60, bottom: -10, width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(200,155,71,0.08)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: F.mono, fontSize: 9, letterSpacing: "0.14em", color: T.antiqueGold, textTransform: "uppercase", marginBottom: 10 }}>
            Since 1999 · Production
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.1 }}>Batch Creation</h1>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontStyle: "italic", color: T.antiqueGold, marginBottom: 12 }}>& Management</div>
          <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.55)", maxWidth: 500, margin: 0, lineHeight: 1.6 }}>
            Create a new production batch, assign weavers, design codes, and bulk orders to individual sarees, then finalize or save as draft.
          </p>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ padding: "0 48px", marginTop: -36, position: "relative", zIndex: 20 }}>
        <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 14, display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr 1px 1fr", boxShadow: "0 8px 28px rgba(44,6,27,0.22)", overflow: "hidden" }}>
          {[
            { label: "Active Batches",   val: active.length    },
            { label: "Draft Batches",    val: drafts.length    },
            { label: "Total Sarees",     val: [...active, ...drafts].reduce((s, b) => s + b.totalCount, 0) },
            { label: "Weavers Active",   val: WEAVERS.length, gold: true },
          ].flatMap((s, i, arr) => {
            const cell = (
              <div key={s.label} style={{ padding: "20px 28px", background: s.gold ? "linear-gradient(135deg, rgba(200,155,71,0.18) 0%, rgba(200,155,71,0.08) 100%)" : undefined, borderTop: s.gold ? `3px solid ${T.antiqueGold}` : undefined }}>
                <div style={{ fontFamily: F.mono, fontSize: 9, color: s.gold ? T.goldLight : "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: s.gold ? T.goldLight : "#fff", lineHeight: 1 }}>{s.val}</div>
              </div>
            );
            return i < arr.length - 1 ? [cell, <div key={`d${i}`} style={{ background: "rgba(255,255,255,0.08)" }} />] : [cell];
          })}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: "32px 56px 0" }}>
        <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 12, padding: 4, width: "fit-content", border: `1px solid ${T.borderDef}` }}>
          {/* New Batch */}
          <button
            onClick={() => {
              if (editingBatchId) {
                setEditingBatchId(null);
                setBatchId(nextBatchId);
                setRows([]);
                setTotalCount("");
                setDueDate("");
                setGenerated(false);
                setSelected(new Set());
              }
              setTab("new");
            }}
            style={{
              padding: "9px 20px",
              borderRadius: 9,
              border: "none",
              background: tab === "new" && !editingBatchId ? T.royalBurgundy : "transparent",
              color: tab === "new" && !editingBatchId ? "#fff" : T.taupe,
              fontFamily: F.ui,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s"
            }}
          >
            Create New Batch
          </button>

          {/* Edit Batch (Conditional) */}
          {editingBatchId && (
            <button
              onClick={() => setTab("new")}
              style={{
                padding: "9px 20px",
                borderRadius: 9,
                border: "none",
                background: tab === "new" ? T.royalBurgundy : "transparent",
                color: tab === "new" ? "#fff" : T.taupe,
                fontFamily: F.ui,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.18s"
              }}
            >
              Edit {editingBatchId}
            </button>
          )}

          {/* All Batches */}
          <button
            onClick={() => setTab("drafts")}
            style={{
              padding: "9px 20px",
              borderRadius: 9,
              border: "none",
              background: tab === "drafts" ? T.royalBurgundy : "transparent",
              color: tab === "drafts" ? "#fff" : T.taupe,
              fontFamily: F.ui,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s"
            }}
          >
            All Batches ({batches.length})
          </button>
        </div>
      </div>

      {/* ════════════════════ TAB: NEW BATCH ════════════════════ */}
      {tab === "new" && (
        <div style={{ padding: "28px 56px 64px" }}>

          {/* Step 1: Setup form */}
          <div style={{ background: "#fff", borderRadius: 18, border: `1.5px solid ${T.borderDef}`, padding: "28px 32px", marginBottom: 24, boxShadow: "0 2px 12px rgba(74,6,27,0.05)" }}>
            <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: T.luxuryBrown, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#fff" }}>1</span>
              </div>
              Batch Setup
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 16, alignItems: "end" }}>
              <div>
                <label style={lbl}>Batch ID</label>
                <div style={{ ...fld, display: "flex", alignItems: "center", background: T.warmCream, color: T.taupe, fontFamily: F.mono, fontSize: 14, fontWeight: 700, borderStyle: "dashed", cursor: "default" }}>
                  {batchId}
                </div>
              </div>
              <div>
                <label style={lbl}>Total Saree Count <span style={{ color: T.royalBurgundy }}>*</span></label>
                <input type="number" min={1} max={500} value={totalCount}
                  onChange={e => { setTotalCount(e.target.value); setGenerated(false); }}
                  style={fld} placeholder="e.g. 30" />
              </div>
              <div>
                <label style={lbl}>Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={fld} />
              </div>
              <motion.button onClick={generateRows} disabled={!totalCount || parseInt(totalCount, 10) < 1}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ height: 44, padding: "0 24px", background: totalCount && parseInt(totalCount, 10) > 0 ? G.button : T.taupe, color: "#fff", border: "none", borderRadius: 10, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", opacity: totalCount && parseInt(totalCount, 10) > 0 ? 1 : 0.5 }}>
                Generate Table →
              </motion.button>
            </div>
          </div>

          {/* Step 2+3: Table */}
          {generated && rows.length > 0 && (
            <BatchTable
              rows={rows}
              displayRows={displayRows}
              selected={selected}
              toggleAll={toggleAll}
              toggleRow={toggleRow}
              allSelected={allSelected}
              sortBy={sortBy}
              setSortBy={setSortBy}
              searchFilter={searchFilter}
              setSearchFilter={setSearchFilter}
              weaverFilter={weaverFilter}
              setWeaverFilter={setWeaverFilter}
              sareeTypeFilter={sareeTypeFilter}
              setSareeTypeFilter={setSareeTypeFilter}
              orderFilter={orderFilter}
              setOrderFilter={setOrderFilter}
              weaverOptions={weaverOptions}
              orderOptions={orderOptions}
              sareeTypeOptions={sareeTypeOptions}
              completeRows={completeRows}
              incompleteRows={incompleteRows}
              setPicker={setPicker}
              removeSelected={removeSelected}
              batchId={batchId}
              dispatches={dispatches}
              issueRecords={issueRecords}
              bulkOrders={bulkOrders}
              setViewSareeRow={setViewSareeRow}
              setViewFactoryLoom={setViewFactoryLoom}
              setViewWeaver={setViewWeaver}
              setViewDispatches={setViewDispatches}
              setViewBulkOrder={setViewBulkOrder}
              setLoomPickerRow={setLoomPickerRow}
              openSareeTypeCard={openSareeTypeCard}
            />
          )}

          {/* Step 5: Incomplete rows warning */}
          {generated && incompleteRows.length > 0 && (
            <div style={{ background: "rgba(183,121,31,0.08)", border: "1px solid rgba(183,121,31,0.28)", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <WarningCircle size={17} color={T.amber} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontFamily: F.ui, fontSize: 13, color: "#7A5A10", lineHeight: 1.6 }}>
                <strong>{incompleteRows.length} row(s) are incomplete</strong> — missing weaver or saree type.
                {" "}Rows {incompleteRows.slice(0, 8).map(r => r.serial).join(", ")}{incompleteRows.length > 8 ? "…" : ""} need attention.
                {" "}You can save as draft and complete them later, but <strong>Finalize</strong> will remain disabled until all rows are complete.
              </div>
            </div>
          )}

          {/* Step 5: Save buttons */}
          {generated && rows.length > 0 && (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <motion.button onClick={handleSaveDraft} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 28px", background: "transparent", border: `2px solid ${T.royalBurgundy}`, color: T.royalBurgundy, borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                <FloppyDisk size={17} weight="bold" /> Save as Draft
              </motion.button>
              <motion.button onClick={handleFinalize} disabled={!canFinalize}
                whileHover={canFinalize ? { scale: 1.02 } : undefined} whileTap={canFinalize ? { scale: 0.97 } : undefined}
                style={{ display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 28px", background: canFinalize ? G.green : T.taupe, color: "#fff", border: "none", borderRadius: 12, fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: canFinalize ? "pointer" : "not-allowed", opacity: canFinalize ? 1 : 0.55 }}>
                <CheckCircle size={17} weight="bold" /> Finalize Batch
              </motion.button>
              {savedMsg && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  style={{ fontFamily: F.ui, fontSize: 13, color: T.green, fontWeight: 600 }}>
                  ✓ {savedMsg}
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ TAB: DRAFTS ════════════════════ */}
      {tab === "drafts" && (
        <DraftsTab
          batches={batches}
          batchDateFilter={batchDateFilter}
          setBatchDateFilter={setBatchDateFilter}
          setTab={setTab}
          openDraft={openDraft}
        />
      )}

      {/* ── Picker modals ── */}
      <AnimatePresence>
        {picker === "weaver"     && <WeaverPickerModal     key="wp" onClose={() => setPicker(null)} onSelect={applyWeaver} />}
        {picker === "bulkorder"  && <BulkOrderPickerModal  key="bp" onClose={() => setPicker(null)} onSelect={applyBulkOrder} />}
        {picker === "factoryloom" && <FactoryLoomPickerModal key="flp" onClose={() => setPicker(null)} onSelect={applyFactoryLoom} />}
        {picker === "design"     && <DesignCodePickerModal key="dp" onClose={() => setPicker(null)} onSelect={applyDesign} />}
        {picker === "saretype"   && <SareeTypePickerModal  key="sp" onClose={() => setPicker(null)} onSelect={applySareeType} />}
        {loomPickerRow && loomPickerRow.weaverId && (() => {
          const w = WEAVERS.find(x => x.id === loomPickerRow.weaverId);
          return w ? (
            <WeaverLoomPickerModal key="wlp" weaver={w} current={loomPickerRow.weaverLoom}
              onClose={() => setLoomPickerRow(null)}
              onSelect={(loomNum) => applyWeaverLoomToRow(loomPickerRow, loomNum)} />
          ) : null;
        })()}
        {viewDesign    && <DesignCodeCard  key="dc" design={viewDesign}    onClose={() => setViewDesign(null)} />}
        {viewSareeType && <SareeTypeCard   key="sc" sareeType={viewSareeType} onClose={() => setViewSareeType(null)} />}
        {viewWeaver    && <WeaverDetailsModal key="wv" weaver={viewWeaver} onClose={() => setViewWeaver(null)} />}
        {viewFactoryLoom && <FactoryLoomDetailsModal key="fld" loom={viewFactoryLoom} onClose={() => setViewFactoryLoom(null)} />}
        {viewBulkOrder && <BulkOrderDetailsModal key="bo" order={viewBulkOrder} onClose={() => setViewBulkOrder(null)} />}
        {viewSareeRow  && <SareeDetailsModal key="sr" row={viewSareeRow} onClose={() => setViewSareeRow(null)} />}
        {viewDispatches && <DispatchDetailsModal key="dd" weaverName={viewDispatches.weaverName} records={viewDispatches.records} onClose={() => setViewDispatches(null)} />}
      </AnimatePresence>
    </div>
  );
}
