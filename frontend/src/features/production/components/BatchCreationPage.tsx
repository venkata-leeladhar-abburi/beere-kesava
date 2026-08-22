import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { CheckCircle2 as CheckCircle, PackageCheck } from "lucide-react";
import { useBatches, SareeRow, BatchRecord } from "../contexts/BatchContext";
import { useBulkOrders, BulkOrder } from "@/features/bulk-orders";
import { SareeTypeCard, SareeTypeRecord } from "@/features/pricing";
import { useRatesPricing } from "@/features/pricing";
import { useMaterialIssue } from "@/features/materials";
import { DateFilterState, DEFAULT_DATE_FILTER } from "../../../shared/ui/DateFilterBar";
import { weaversApi } from "../../../shared/api/weavers";
import { factoryLoomsApi } from "../../../shared/api/factory-looms";
import { Button, NumberInput } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";

import { T, F, rowComplete, lbl } from "./batch-creation/constants";
import {
  WeaverPickerModal, BulkOrderPickerModal,
  SareeTypePickerModal, WeaverLoomPickerModal, FactoryLoomPickerModal,
} from "./batch-creation/PickerModals";
import {
  WeaverDetailsModal, FactoryLoomDetailsModal, BulkOrderDetailsModal, SareeDetailsModal,
} from "./batch-creation/DetailModals";
import { BatchTable } from "./batch-creation/BatchTable";
import { MaterialsGivenPanel } from "./batch-creation/MaterialsGivenPanel";
import { BatchActionBar } from "./batch-creation/BatchActionBar";
import { BulkOrderCapacityModal, UnsavedChangesModal } from "./batch-creation/BatchWarningModals";
import { SectionCard } from "./common/primitives";
import { DraftsTab } from "./batch-creation/DraftsTab";
import { BatchCreationStatsHeader } from "./BatchCreationStatsHeader";
import { BatchSetupStep } from "./BatchSetupStep";
import { useBatchFormHandlers, WeaverOption, LoomOption } from "./useBatchFormHandlers";

export function BatchCreationPage() {
  const { rates } = useRatesPricing();
  const { batches, saveDraft, isSaving, finalizeBatch, isFinalizing, nextBatchId, pendingOpenBatchId, setPendingOpenBatchId } = useBatches();
  const { bulkOrders } = useBulkOrders();
  const { issueRecords } = useMaterialIssue();

  // Real weaver/factory-loom directories for the picker modals — replaces
  // the old static WEAVERS/FACTORY_LOOMS_LIST mocks so assigned ids are
  // always real backend records (required for batch-row assignment to
  // validate server-side).
  const [weavers, setWeavers] = useState<WeaverOption[]>([]);
  const [looms, setLooms] = useState<LoomOption[]>([]);
  // Real saree-type rate catalog (Rates & Pricing) — the picker and the card
  // view both read from this instead of the old hardcoded SAREE_TYPES_BRIEF
  // list, so the making charge shown always matches what's configured there.
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  const loadDirectories = useCallback(async () => {
    try {
      const [weaversRes, loomsRes] = await Promise.all([
        weaversApi.list(), factoryLoomsApi.list(),
      ]);
      setWeavers(weaversRes.items.map(w => ({ id: w.id, name: w.name, initials: w.initials, looms: w.looms })));
      setLooms(loomsRes.items.map(l => ({
        id: l.id, loomNumber: l.loomNumber, location: l.location ?? "", status: l.status,
        operatorName: l.operatorName ?? "", operatorPhone: l.operatorPhone ?? "",
        installedYear: l.installedYear, notes: l.notes ?? "",
      })));
      setDirectoryError(null);
    } catch (err) {
      setDirectoryError(err instanceof Error ? err.message : "Could not load weavers/looms/rates.");
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

  // How many sarees each bulk order has already claimed in *other* batches —
  // a bulk order's capacity is global, so an assignment here has to account
  // for rows sitting on the same order elsewhere, not just in this batch.
  const assignedElsewhereByRef = React.useMemo(() => {
    const acc: Record<string, number> = {};
    for (const b of batches) {
      if (b.batchId === editingBatchId) continue;
      for (const r of b.rows) {
        if (r.bulkOrderRef) acc[r.bulkOrderRef] = (acc[r.bulkOrderRef] ?? 0) + 1;
      }
    }
    return acc;
  // editingBatchId is read above; recompute when either input changes.
  }, [batches, editingBatchId]);

  // Custom hook for row management and picker handlers
  const {
    rows, setRows, selected, setSelected, picker, setPicker, generated, setGenerated,
    loomPickerRow, setLoomPickerRow, generateRows, addRows, allSelected, toggleAll, toggleRow,
    applyWeaver, applyWeaverLoomToRow, applyFactoryLoom, applyBulkOrder,
    applySareeType, removeSelected,
    bulkOrderConflict, assignBulkOrderUpToCapacity, dismissBulkOrderConflict,
  } = useBatchFormHandlers(bulkOrders, assignedElsewhereByRef);

  // ── Add more sarees to an already-generated table (editing a draft/active
  // batch shouldn't require regenerating and losing existing row data).
  const [addSareesCount, setAddSareesCount] = useState<string>("");
  function handleAddSarees() {
    const n = parseInt(addSareesCount, 10);
    if (!n || n < 1) return;
    addRows(n);
    setAddSareesCount("");
  }

  // ── Finalize result popup (Part D — replaces the easy-to-miss inline
  // text with a real modal, matching the app's other confirmation flows).
  const [finalizeResult, setFinalizeResult] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  // ── Card view modals
  const [viewSareeType, setViewSareeType] = useState<SareeTypeRecord | null>(null);
  const [viewWeaver, setViewWeaver] = useState<WeaverOption | null>(null);
  const [viewFactoryLoom, setViewFactoryLoom] = useState<LoomOption | null>(null);
  const [viewBulkOrder, setViewBulkOrder] = useState<BulkOrder | null>(null);
  const [viewSareeRow, setViewSareeRow] = useState<SareeRow | null>(null);

  // ── Sort control
  const [sortBy, setSortBy] = useState<"serial" | "weaver" | "factoryLoom">("serial");

  // ── Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [weaverFilter, setWeaverFilter] = useState("All");
  const [orderFilter, setOrderFilter] = useState("All");
  const [sareeTypeFilter, setSareeTypeFilter] = useState("All");

  // ── Saved feedback
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // ── Unsaved-change tracking ────────────────────────────────────────────────
  // A snapshot of what was last persisted. Edits made to a batch used to be
  // lost silently when the tab changed (nothing but the bottom-of-page Save
  // button ever wrote them back), so the page now knows when it is dirty and
  // both warns before leaving and offers Save at the top of the table.
  const savedSnapshot = useRef<string>("");
  const snapshotOf = useCallback(
    (r: SareeRow[], due: string) => JSON.stringify({ due, rows: r }),
    [],
  );
  const isDirty = rows.length > 0 && snapshotOf(rows, dueDate) !== savedSnapshot.current;

  // Navigation the user asked for but that is blocked pending a dirty check.
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const guardLeave = useCallback((go: () => void) => {
    if (isDirty) setPendingLeave(() => go);
    else go();
  }, [isDirty]);

  // Keep batchId in sync with next available when not editing a draft
  useEffect(() => {
    if (!editingBatchId) setBatchId(nextBatchId);
  }, [nextBatchId, editingBatchId]);

  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Save as draft
  // Awaits the real backend id and adopts it locally — the id shown before
  // the first save is only a client-side guess (see nextBatchId), and the
  // server's IdCounter may assign something different. Without this sync,
  // every later save/finalize call would target a batchId the backend has
  // never heard of, silently spawning a new empty batch each time.
  async function handleSaveDraft(): Promise<boolean> {
    const record: BatchRecord = {
      batchId, totalCount: rows.length, dueDate, rows,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSaveError(null);
    try {
      const realId = await saveDraft(record);
      setBatchId(realId);
      setEditingBatchId(realId);
      savedSnapshot.current = snapshotOf(rows, dueDate);
      setSavedMsg("All changes saved.");
      setTimeout(() => setSavedMsg(null), 3000);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save the draft. Please try again.");
      return false;
    }
  }

  // ── Finalize
  const completeRows = rows.filter(rowComplete);
  const incompleteRows = rows.filter(r => !rowComplete(r));
  const canFinalize = rows.length > 0 && incompleteRows.length === 0;

  async function handleFinalize() {
    if (!canFinalize) return;
    const record: BatchRecord = {
      batchId, totalCount: rows.length, dueDate, rows,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSaveError(null);
    try {
      // Save must land (and its real id be known) before finalize can target
      // the right batch — finalizing the stale local id would 404 silently.
      const realId = await saveDraft(record);
      // The backend only allows finalize on a DRAFT batch (400 otherwise).
      // Editing an already-ACTIVE batch is allowed at any time — that edit
      // is just persisted via saveDraft's row assignments above; there's
      // nothing left to "finalize" a second time.
      const currentStatus = batches.find(b => b.batchId === realId)?.status;
      if (currentStatus === "draft" || currentStatus === undefined) {
        await finalizeBatch(realId);
        setFinalizeResult({ kind: "success", message: `Batch ${realId} finalized and active!` });
      } else {
        setFinalizeResult({ kind: "success", message: `Batch ${realId} updated.` });
      }
      savedSnapshot.current = "";
      setBatchId(realId);
      setEditingBatchId(realId);
      setRows([]);
      setTotalCount("");
      setDueDate("");
      setGenerated(false);
      setSelected(new Set());
      setEditingBatchId(null);
    } catch (err) {
      setFinalizeResult({ kind: "error", message: err instanceof Error ? err.message : "Could not finalize the batch. Please try again." });
    }
  }

  const weaverOptions = React.useMemo(() => ["All", ...Array.from(new Set(rows.map(r => r.weaverName || r.factoryLoomNumber).filter(Boolean)))].sort(), [rows]);
  const orderOptions = React.useMemo(() => ["All", "General Stock", ...Array.from(new Set(rows.map(r => r.bulkOrderLabel).filter(l => l && l !== "General Stock")))].sort(), [rows]);
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
    savedSnapshot.current = snapshotOf(b.rows, b.dueDate);
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
    const r = rates.find(x => x.code === code);
    if (r) setViewSareeType(r);
  }

  const drafts = batches.filter(b => b.status === "draft");
  const active = batches.filter(b => b.status === "active");

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", fontFamily: F.ui }}>
      {directoryError && (
        <div className="px-4 md:px-7 xl:px-14" style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", paddingTop: 12, paddingBottom: 12, fontFamily: F.ui, fontSize: 13, color: T.red, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        guardLeave={guardLeave}
      />

      {/* ════════════════════ TAB: NEW BATCH ════════════════════ */}
      {tab === "new" && (
        <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 28, paddingBottom: 64 }}>

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
            isEditing={!!editingBatchId}
            rowCount={rows.length}
            batchStatus={editingBatchId ? batches.find(b => b.batchId === editingBatchId)?.status : undefined}
          />

          {/* Add more sarees to the table without losing existing rows */}
          {generated && rows.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 140 }}>
                <label htmlFor="add-sarees-count" style={lbl}>Add No. of Sarees</label>
                <NumberInput id="add-sarees-count" min={1} max={500} value={addSareesCount === "" ? "" : Number(addSareesCount)}
                  onValueChange={v => setAddSareesCount(v === "" ? "" : String(v))}
                  placeholder="e.g. 5" />
              </div>
              <Button onClick={handleAddSarees} disabled={!addSareesCount || parseInt(addSareesCount, 10) < 1} variant="secondary" size="md">
                + Add Sarees
              </Button>
            </div>
          )}

          {/* Save/Finalize pinned above the table — a 30-saree batch should
              never have to be scrolled to the bottom just to save an edit. */}
          {generated && rows.length > 0 && (
            <BatchActionBar
              variant="sticky"
              onSaveDraft={() => void handleSaveDraft()}
              onFinalize={() => void handleFinalize()}
              isSaving={isSaving}
              isFinalizing={isFinalizing}
              canFinalize={canFinalize}
              isDirty={isDirty}
              savedMsg={savedMsg}
              saveError={saveError}
            />
          )}

          {/* Materials Given — above the saree table, where it is visible
              without scrolling past every row. */}
          {generated && rows.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SectionCard
                icon={PackageCheck}
                title="Materials Given"
                subtitle="Every material issued for this batch, grouped by weaver / factory loom"
              >
                <MaterialsGivenPanel rows={rows} issueRecords={issueRecords} batchId={batchId} weavers={weavers} />
              </SectionCard>
            </div>
          )}

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
              bulkOrders={bulkOrders}
              setViewSareeRow={setViewSareeRow}
              setViewFactoryLoom={setViewFactoryLoom}
              setViewWeaver={setViewWeaver}
              setViewBulkOrder={setViewBulkOrder}
              setLoomPickerRow={setLoomPickerRow}
              openSareeTypeCard={openSareeTypeCard}
            />
          )}

          {/* Step 5: Save buttons (also pinned above the table) */}
          {generated && rows.length > 0 && (
            <BatchActionBar
              variant="footer"
              onSaveDraft={() => void handleSaveDraft()}
              onFinalize={() => void handleFinalize()}
              isSaving={isSaving}
              isFinalizing={isFinalizing}
              canFinalize={canFinalize}
              isDirty={isDirty}
              // Feedback lives on the sticky bar only — showing the same
              // "saved"/error line twice on one screen reads as a glitch.
              savedMsg={null}
              saveError={null}
            />
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
        {picker === "saretype"   && (
          <SareeTypePickerModal
            key="sp"
            sareeTypes={rates.map(r => ({ code: r.code, name: r.type, charge: Number(r.charge) }))}
            onClose={() => setPicker(null)}
            onSelect={applySareeType}
          />
        )}
        {loomPickerRow && loomPickerRow.weaverId && (() => {
          const w = weavers.find(x => x.id === loomPickerRow.weaverId);
          return w ? (
            <WeaverLoomPickerModal key="wlp" weaver={w} current={loomPickerRow.weaverLoom}
              onClose={() => setLoomPickerRow(null)}
              onSelect={(loomNum) => applyWeaverLoomToRow(loomPickerRow, loomNum)} />
          ) : null;
        })()}
        {viewSareeType && <SareeTypeCard   key="sc" sareeType={viewSareeType} onClose={() => setViewSareeType(null)} />}
        {viewWeaver    && <WeaverDetailsModal key="wv" weaver={viewWeaver} onClose={() => setViewWeaver(null)} />}
        {viewFactoryLoom && <FactoryLoomDetailsModal key="fld" loom={viewFactoryLoom} onClose={() => setViewFactoryLoom(null)} />}
        {viewBulkOrder && <BulkOrderDetailsModal key="bo" order={viewBulkOrder} onClose={() => setViewBulkOrder(null)} />}
        {viewSareeRow  && <SareeDetailsModal key="sr" row={viewSareeRow} onClose={() => setViewSareeRow(null)} />}
      </AnimatePresence>

      {/* Bulk order over-capacity guard */}
      <BulkOrderCapacityModal
        conflict={bulkOrderConflict}
        onAssignPartial={assignBulkOrderUpToCapacity}
        onCancel={dismissBulkOrderConflict}
      />

      {/* Unsaved-changes guard on leaving the batch being edited */}
      <UnsavedChangesModal
        open={!!pendingLeave}
        isSaving={isSaving}
        onCancel={() => setPendingLeave(null)}
        onDiscard={() => {
          // Roll the form back to what the server last stored, so the discarded
          // edits are actually gone rather than lingering in memory.
          const saved = editingBatchId ? batches.find(b => b.batchId === editingBatchId) : undefined;
          if (saved) {
            setRows(saved.rows);
            setDueDate(saved.dueDate);
            savedSnapshot.current = snapshotOf(saved.rows, saved.dueDate);
          } else {
            savedSnapshot.current = snapshotOf(rows, dueDate);
          }
          setSelected(new Set());
          const go = pendingLeave;
          setPendingLeave(null);
          go?.();
        }}
        onSaveAndLeave={() => { void (async () => {
          const ok = await handleSaveDraft();
          if (!ok) return;
          const go = pendingLeave;
          setPendingLeave(null);
          go?.();
        })(); }}
      />

      {/* Finalize result popup */}
      <Modal open={!!finalizeResult} onOpenChange={o => { if (!o) setFinalizeResult(null); }} size="xs">
        <div style={{ padding: "28px 28px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center",
            background: finalizeResult?.kind === "error" ? "rgba(192,57,43,0.10)" : "rgba(30,102,64,0.10)",
          }}>
            {finalizeResult?.kind === "error"
              ? <span style={{ fontSize: 22, color: T.red }}>⚠</span>
              : <CheckCircle size={24} color={T.green} />}
          </div>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>
            {finalizeResult?.kind === "error" ? "Could Not Finalize" : "Success"}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, lineHeight: 1.5 }}>
            {finalizeResult?.message}
          </div>
          <Button onClick={() => setFinalizeResult(null)} variant="primary" size="md" className="mt-2 w-full">
            OK
          </Button>
        </div>
      </Modal>
    </div>
  );
}
