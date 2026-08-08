import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Save as FloppyDisk, CheckCircle2 as CheckCircle } from "lucide-react";
import { useBatches, SareeRow, BatchRecord } from "../contexts/BatchContext";
import { useBulkOrders } from "../../bulk-orders/contexts/BulkOrderContext";
import { useDesignLibrary, DesignEntry } from "../../design-library/contexts/DesignLibraryContext";
import { DesignCodeCard } from "../../design-library/components/DesignLibraryPage";
import { SareeTypeCard, SareeTypeRecord } from "../../pricing/components/RatesPricingPage";
import { DispatchDetailsModal } from "./DispatchDetailsModal";
import { useMaterialIssue } from "../../materials/contexts/MaterialIssueContext";
import { DateFilterState, DEFAULT_DATE_FILTER } from "../../../shared/ui/DateFilterBar";
import { weaversApi } from "../../../shared/api/weavers";
import { factoryLoomsApi } from "../../../shared/api/factory-looms";
import { Button } from "../../../shared/ui/primitives";

import { T, F, G, SAREE_TYPE_RECORDS, rowComplete } from "./batch-creation/constants";
import {
  WeaverPickerModal, BulkOrderPickerModal, DesignCodePickerModal,
  SareeTypePickerModal, WeaverLoomPickerModal, FactoryLoomPickerModal,
} from "./batch-creation/PickerModals";
import {
  WeaverDetailsModal, FactoryLoomDetailsModal, BulkOrderDetailsModal, SareeDetailsModal,
} from "./batch-creation/DetailModals";
import { BatchTable } from "./batch-creation/BatchTable";
import { DraftsTab } from "./batch-creation/DraftsTab";
import { BatchCreationStatsHeader } from "./BatchCreationStatsHeader";
import { BatchSetupStep } from "./BatchSetupStep";
import { useBatchFormHandlers, WeaverOption, LoomOption } from "./useBatchFormHandlers";

export function BatchCreationPage() {
  const { batches, saveDraft, finalizeBatch, nextBatchId, pendingOpenBatchId, setPendingOpenBatchId } = useBatches();
  const { dispatches } = useDesignLibrary();
  const { bulkOrders } = useBulkOrders();
  const { issueRecords } = useMaterialIssue();

  // Real weaver/factory-loom directories for the picker modals — replaces
  // the old static WEAVERS/FACTORY_LOOMS_LIST mocks so assigned ids are
  // always real backend records (required for batch-row assignment to
  // validate server-side).
  const [weavers, setWeavers] = useState<WeaverOption[]>([]);
  const [looms, setLooms] = useState<LoomOption[]>([]);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  const loadDirectories = useCallback(async () => {
    try {
      const [weaversRes, loomsRes] = await Promise.all([weaversApi.list(), factoryLoomsApi.list()]);
      setWeavers(weaversRes.items.map(w => ({ id: w.id, name: w.name, initials: w.initials, looms: w.looms })));
      setLooms(loomsRes.items.map(l => ({
        id: l.id, loomNumber: l.loomNumber, location: l.location ?? "", status: l.status,
        operatorName: l.operatorName ?? "", operatorPhone: l.operatorPhone ?? "",
        installedYear: l.installedYear, notes: l.notes ?? "",
      })));
      setDirectoryError(null);
    } catch (err) {
      setDirectoryError(err instanceof Error ? err.message : "Could not load weavers/looms.");
    }
  }, []);

  useEffect(() => { void loadDirectories(); }, [loadDirectories]);

  // ── Tab: "new" or "drafts"
  const [tab, setTab] = useState<"new" | "drafts">("new");
  const [batchDateFilter, setBatchDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);

  // ── Editing state: either creating new or editing a draft
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);

  // ── Step 1 form
  const [batchId, setBatchId] = useState(nextBatchId);
  const [totalCount, setTotalCount] = useState<string>("");
  const [dueDate, setDueDate] = useState("");

  // Custom hook for row management and picker handlers
  const {
    rows, setRows, selected, setSelected, picker, setPicker, generated, setGenerated,
    loomPickerRow, setLoomPickerRow, generateRows, allSelected, toggleAll, toggleRow,
    applyWeaver, applyWeaverLoomToRow, applyFactoryLoom, applyBulkOrder, applyDesign,
    applySareeType, removeSelected,
  } = useBatchFormHandlers(bulkOrders);

  // ── Card view modals
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);
  const [viewSareeType, setViewSareeType] = useState<SareeTypeRecord | null>(null);
  const [viewWeaver, setViewWeaver] = useState<WeaverOption | null>(null);
  const [viewFactoryLoom, setViewFactoryLoom] = useState<LoomOption | null>(null);
  const [viewBulkOrder, setViewBulkOrder] = useState<any | null>(null);
  const [viewSareeRow, setViewSareeRow] = useState<SareeRow | null>(null);
  const [viewDispatches, setViewDispatches] = useState<{ weaverName: string; records: any[] } | null>(null);

  // ── Sort control
  const [sortBy, setSortBy] = useState<"serial" | "weaver" | "factoryLoom">("serial");

  // ── Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [weaverFilter, setWeaverFilter] = useState("All");
  const [orderFilter, setOrderFilter] = useState("All");
  const [sareeTypeFilter, setSareeTypeFilter] = useState("All");

  // ── Saved feedback
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Keep batchId in sync with next available when not editing a draft
  useEffect(() => {
    if (!editingBatchId) setBatchId(nextBatchId);
  }, [nextBatchId, editingBatchId]);

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

  useEffect(() => {
    if (pendingOpenBatchId) {
      const b = batches.find(x => x.batchId === pendingOpenBatchId);
      if (b) openDraft(b);
      setPendingOpenBatchId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOpenBatchId]);

  function openSareeTypeCard(code: string) {
    const r = SAREE_TYPE_RECORDS.find(x => x.code === code);
    if (r) setViewSareeType(r);
  }

  const drafts = batches.filter(b => b.status === "draft");
  const active = batches.filter(b => b.status === "active");

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", fontFamily: F.ui }}>
      {directoryError && (
        <div style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", padding: "12px 56px", fontFamily: F.ui, fontSize: 13, color: T.red, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Could not load weavers/factory looms: {directoryError}</span>
          <Button onClick={() => void loadDirectories()} variant="ghost" size="sm" className="border border-[var(--text-danger)] text-[var(--text-danger)] hover:bg-[var(--surface-danger-subtle)]">Retry</Button>
        </div>
      )}

      {/* Header & Stats Banner */}
      <BatchCreationStatsHeader
        active={active}
        drafts={drafts}
        batches={batches}
        weaversActiveCount={weavers.length}
        tab={tab}
        setTab={setTab}
        editingBatchId={editingBatchId}
        setEditingBatchId={setEditingBatchId}
        setBatchId={setBatchId}
        nextBatchId={nextBatchId}
        setRows={setRows}
        setTotalCount={setTotalCount}
        setDueDate={setDueDate}
        setGenerated={setGenerated}
        setSelected={setSelected}
      />

      {/* ════════════════════ TAB: NEW BATCH ════════════════════ */}
      {tab === "new" && (
        <div style={{ padding: "28px 56px 64px" }}>

          <BatchSetupStep
            batchId={batchId}
            totalCount={totalCount}
            setTotalCount={setTotalCount}
            dueDate={dueDate}
            setDueDate={setDueDate}
            generateRows={() => generateRows(totalCount)}
            setGenerated={setGenerated}
            generated={generated}
            incompleteRows={incompleteRows}
          />

          {/* Step 2+3: Table */}
          {generated && rows.length > 0 && (
            <BatchTable
              weavers={weavers}
              looms={looms}
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

          {/* Step 5: Save buttons */}
          {generated && rows.length > 0 && (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Button onClick={handleSaveDraft} variant="secondary" size="lg">
                <FloppyDisk size={17} /> Save as Draft
              </Button>
              <Button onClick={handleFinalize} disabled={!canFinalize} variant="primary" size="lg">
                <CheckCircle size={17} /> Finalize Batch
              </Button>
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
        {picker === "weaver"     && <WeaverPickerModal     key="wp" weavers={weavers} onClose={() => setPicker(null)} onSelect={applyWeaver} />}
        {picker === "bulkorder"  && <BulkOrderPickerModal  key="bp" onClose={() => setPicker(null)} onSelect={applyBulkOrder} />}
        {picker === "factoryloom" && <FactoryLoomPickerModal key="flp" looms={looms} onClose={() => setPicker(null)} onSelect={applyFactoryLoom} />}
        {picker === "design"     && <DesignCodePickerModal key="dp" onClose={() => setPicker(null)} onSelect={applyDesign} />}
        {picker === "saretype"   && <SareeTypePickerModal  key="sp" onClose={() => setPicker(null)} onSelect={applySareeType} />}
        {loomPickerRow && loomPickerRow.weaverId && (() => {
          const w = weavers.find(x => x.id === loomPickerRow.weaverId);
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
