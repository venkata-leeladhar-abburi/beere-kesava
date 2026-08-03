import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Plus, X, CheckCircle2 } from "lucide-react";
import { useMaterialIssue, MaterialIssueRecord, IssuedMaterialItem } from "../contexts/MaterialIssueContext";
import { FACTORY_LOOMS_LIST } from "../../production/data/factoryLooms";
import { useBatches } from "../../production/contexts/BatchContext";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";

import { F, GrnBatch, INITIAL_GRN_BATCHES, MaterialRowState, T, WEAVERS, emptyRow } from "./issueMaterial/theme";
import { SectionPill } from "./issueMaterial/primitives";
import { RecipientSelector } from "./issueMaterial/RecipientSelector";
import { MaterialRowEditor } from "./issueMaterial/MaterialRowEditor";
import { SignatureBlock } from "./issueMaterial/SignatureBlock";
import { RecordDetailsModal } from "./issueMaterial/RecordDetailsModal";
import { IssuanceHistorySection } from "./issueMaterial/IssuanceHistorySection";
import { summarizeMaterials } from "./issueMaterial/materialFormatters";

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function IssueMaterialPage() {
  const { issueRecords, addIssueRecord } = useMaterialIssue();
  const { batches } = useBatches();
  const [grnBatches, setGrnBatches] = useState<GrnBatch[]>(INITIAL_GRN_BATCHES);

  // Step 1 — recipient type toggle
  const [recipientType, setRecipientType] = useState<"weaver" | "factoryLoom">("weaver");

  // Step 1 — weaver
  const [weaverSearch, setWeaverSearch] = useState("");
  const [showWeaverList, setShowWeaverList] = useState(false);
  const [selectedWeaverId, setSelectedWeaverId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Step 1 — factory loom
  const [selectedLoomId, setSelectedLoomId] = useState<string | null>(null);

  // Step 2 — materials
  const [rows, setRows] = useState<MaterialRowState[]>([emptyRow()]);

  // Step 4 — notes
  const [notes, setNotes] = useState("");

  // Step 5 — signature
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [signed, setSigned] = useState(false);
  const [remoteSent, setRemoteSent] = useState(false);
  const [remoteConfirmed, setRemoteConfirmed] = useState(false);

  // Success state
  const [successRecord, setSuccessRecord] = useState<MaterialIssueRecord | null>(null);

  // History section state
  const [histSearch, setHistSearch] = useState("");
  const [histWeaverFilter, setHistWeaverFilter] = useState("All Weavers");
  const [histDateFilter, setHistDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [histPage, setHistPage] = useState(1);
  const [viewRecord, setViewRecord] = useState<MaterialIssueRecord | null>(null);
  const ROWS_PER_PAGE = 15;

  const [selectedLoom, setSelectedLoom] = useState<number | "">("");

  const selectedWeaver = WEAVERS.find(w => w.id === selectedWeaverId) || null;
  const selectedFactoryLoom = FACTORY_LOOMS_LIST.find(l => l.id === selectedLoomId) || null;

  const weaverBatches = selectedWeaver
    ? batches.filter(b => b.status !== "completed" && b.rows.some(r => r.weaverId === selectedWeaver.id))
    : [];
  const loomBatches = selectedFactoryLoom
    ? batches.filter(b => b.status !== "completed" && b.rows.some(r => r.factoryLoomId === selectedFactoryLoom.id))
    : [];

  const isSigned = (sigMethod === "here" && signed) || (sigMethod === "remote" && remoteConfirmed);

  const validRows = rows.filter(r => r.materialType && r.quantity && parseFloat(r.quantity) > 0 && r.grnBatchId);
  const recipientReady = recipientType === "weaver"
    ? (!!selectedWeaver && selectedLoom !== "" && !!selectedBatchId)
    : (!!selectedFactoryLoom && !!selectedBatchId);
  const canConfirm = recipientReady && validRows.length > 0 && isSigned;

  function updateRow(uid: string, updated: MaterialRowState) {
    setRows(prev => prev.map(r => r.uid === uid ? updated : r));
  }
  function removeRow(uid: string) {
    setRows(prev => prev.filter(r => r.uid !== uid));
  }
  function addRow() {
    setRows(prev => [...prev, emptyRow()]);
  }

  function resetForm() {
    setWeaverSearch(""); setSelectedWeaverId(null); setShowWeaverList(false);
    setSelectedLoomId(null);
    setSelectedLoom("");
    setSelectedBatchId(null);
    setRows([emptyRow()]); setNotes("");
    setSigMethod("none"); setSigned(false); setRemoteSent(false); setRemoteConfirmed(false);
  }

  function handleConfirm() {
    if (!canConfirm) return;
    if (recipientType === "weaver" && !selectedWeaver) return;
    if (recipientType === "factoryLoom" && !selectedFactoryLoom) return;

    const materials: IssuedMaterialItem[] = validRows.map(r => {
      const base: IssuedMaterialItem = {
        materialType: r.materialType,
        quantity: parseFloat(r.quantity),
        unit: r.materialType === "Jari" ? r.jariUnit : (r.warpReshamUnit || "kg"),
        grnBatchId: r.grnBatchId,
      };
      if (r.materialType === "Warp") { base.warpSubtype = r.warpSubtype; if (r.description) base.description = r.description; }
      if (r.materialType === "Resham") { if (r.description) base.description = r.description; if (r.jariColor) base.jariColor = r.jariColor; }
      if (r.materialType === "Jari") { base.jariType = r.jariType; base.jariGrade = r.jariGrade; base.jariColor = r.jariColor; }
      return base;
    });

    const record = addIssueRecord({
      ...(recipientType === "weaver"
        ? { weaverId: selectedWeaver!.id, weaverName: selectedWeaver!.name, loomNumber: selectedLoom || undefined }
        : { factoryLoomId: selectedFactoryLoom!.id, factoryLoomNumber: selectedFactoryLoom!.loomNumber }),
      batchId: selectedBatchId || undefined,
      issuedBy: "Admin (Kesava Rao)",
      issuedAt: new Date().toISOString(),
      materials,
      signatureMethod: sigMethod === "remote" ? "remote" : "here",
      signatureCaptured: true,
      signatureTimestamp: new Date().toISOString(),
      notes: notes || undefined,
      status: "signed",
    });

    // Reduce GRN batch remaining quantities
    setGrnBatches(prev => prev.map(g => {
      const used = materials.filter(m => m.grnBatchId === g.grnBatchId).reduce((s, m) => s + m.quantity, 0);
      return used > 0 ? { ...g, availableQty: Math.max(0, g.availableQty - used) } : g;
    }));

    setSuccessRecord(record);
    resetForm();
  }

  // History filtering
  const weaverNames = ["All Weavers", ...Array.from(new Set(issueRecords.map(r => r.weaverName)))];
  const filteredHistory = issueRecords.filter(r => {
    const matchSearch = !histSearch ||
      r.weaverName.toLowerCase().includes(histSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(histSearch.toLowerCase()) ||
      r.materials.some(m => m.grnBatchId.toLowerCase().includes(histSearch.toLowerCase()));
    const matchWeaver = histWeaverFilter === "All Weavers" || r.weaverName === histWeaverFilter;
    const matchDate = matchesDateFilter(r.issuedAt, histDateFilter);
    return matchSearch && matchWeaver && matchDate;
  });
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ROWS_PER_PAGE));
  const pagedHistory = filteredHistory.slice((histPage - 1) * ROWS_PER_PAGE, histPage * ROWS_PER_PAGE);

  return (
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: T.darkBurgundy, position: "relative" as const, overflow: "hidden", minHeight: 190, display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, padding: "44px 56px 44px", zIndex: 10, position: "relative" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
            <span style={{ fontFamily: F.mono, fontSize: 9, color: `${T.antiqueGold}80`, letterSpacing: "1.5px", textTransform: "uppercase" as const }}>SINCE 1999 · MATERIAL ISSUANCE</span>
          </div>
          <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 42, color: "#fff", margin: "0 0 8px", lineHeight: 1.1 }}>Issue Raw Materials to Weaver</h1>
          <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 560, margin: 0, lineHeight: 1.65 }}>
            Record material handover, link GRN batch, and collect weaver's digital signature
          </p>
        </div>
        {[300, 440].map((sz, i) => (
          <div key={i} style={{ position: "absolute" as const, right: -sz * 0.3, bottom: -sz * 0.4, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(200,155,71,${0.10 - i * 0.03})`, pointerEvents: "none" as const }} />
        ))}
      </div>

      <div style={{ padding: "40px 56px 80px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Success banner */}
        <AnimatePresence>
          {successRecord && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: 28 }}>
              <div style={{ background: "rgba(30,102,64,0.10)", border: `1.5px solid ${T.green}`, borderRadius: 16, padding: 24, display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(30,102,64,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={26} color={T.green} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 19, color: T.green, marginBottom: 4 }}>Materials Issued Successfully</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown }}>
                    <span style={{ fontFamily: F.mono, color: T.royalBurgundy, fontWeight: 700 }}>{successRecord.id}</span> · Given to {successRecord.weaverName} {successRecord.loomNumber ? `(Loom ${successRecord.loomNumber})` : ""} · {summarizeMaterials(successRecord.materials)}
                  </div>
                </div>
                <button onClick={() => setSuccessRecord(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={T.green} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ SECTION A — ISSUE MATERIAL FORM ═══ */}
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(44,24,16,0.06)", padding: 28, marginBottom: 48 }}>

          {/* STEP 1 — Select Recipient */}
          <SectionPill label="Step 1 · Select Recipient" />
          <RecipientSelector
            recipientType={recipientType} setRecipientType={setRecipientType}
            weaverSearch={weaverSearch} setWeaverSearch={setWeaverSearch}
            showWeaverList={showWeaverList} setShowWeaverList={setShowWeaverList}
            selectedWeaver={selectedWeaver} setSelectedWeaverId={setSelectedWeaverId}
            selectedLoom={selectedLoom} setSelectedLoom={setSelectedLoom}
            selectedFactoryLoom={selectedFactoryLoom} setSelectedLoomId={setSelectedLoomId}
            selectedBatchId={selectedBatchId} setSelectedBatchId={setSelectedBatchId}
            weaverBatches={weaverBatches} loomBatches={loomBatches}
          />

          {/* STEP 2 — Materials */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 2 · Add Materials Being Given" />
            {rows.map(row => (
              <MaterialRowEditor key={row.uid} row={row} grnBatches={grnBatches} onChange={r => updateRow(row.uid, r)} onRemove={() => removeRow(row.uid)} showRemove={rows.length > 1} />
            ))}
            <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: `1.5px dashed ${T.borderGold}`, borderRadius: 12, padding: "12px 18px", width: "100%", justifyContent: "center", cursor: "pointer", fontFamily: F.ui, fontWeight: 600, fontSize: 13.5, color: T.royalBurgundy }}>
              <Plus size={15} /> Add Another Material
            </button>
          </div>

          {/* STEP 4 — Notes */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 3 · Notes (Optional)" />
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any special instructions, batch references, or remarks"
              style={{ width: "100%", borderRadius: 12, border: `1.5px solid ${T.borderDef}`, padding: "12px 14px", fontFamily: F.ui, fontSize: 13.5, outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const }} />
          </div>

          {/* STEP 5 — Signature */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 4 · Collect Weaver Signature" />
            <SignatureBlock
              weaverName={selectedWeaver?.name ?? "the weaver"} weaverPhone={selectedWeaver?.phone ?? "—"}
              sigMethod={sigMethod} setSigMethod={setSigMethod}
              signed={signed} setSigned={setSigned}
              remoteSent={remoteSent} setRemoteSent={setRemoteSent}
              remoteConfirmed={remoteConfirmed} setRemoteConfirmed={setRemoteConfirmed}
            />
          </div>

          {/* Confirm */}
          <button onClick={handleConfirm} disabled={!canConfirm} style={{
            marginTop: 32, width: "100%", height: 56, borderRadius: 14, border: "none",
            background: canConfirm ? T.green : "#C0C0C0", color: "#FFF",
            fontFamily: F.ui, fontWeight: 700, fontSize: 16, cursor: canConfirm ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <Check size={20} /> Confirm Issuance
          </button>
        </div>

        {/* ═══ SECTION B — ISSUANCE HISTORY ═══ */}
        <IssuanceHistorySection
          weaverNames={weaverNames}
          histSearch={histSearch} setHistSearch={v => { setHistSearch(v); setHistPage(1); }}
          histWeaverFilter={histWeaverFilter} setHistWeaverFilter={v => { setHistWeaverFilter(v); setHistPage(1); }}
          histDateFilter={histDateFilter} setHistDateFilter={f => { setHistDateFilter(f); setHistPage(1); }}
          pagedHistory={pagedHistory} histPage={histPage} setHistPage={setHistPage} totalPages={totalPages}
          setViewRecord={setViewRecord}
        />
      </div>

      <AnimatePresence>
        {viewRecord && <RecordDetailsModal record={viewRecord} onClose={() => setViewRecord(null)} />}
      </AnimatePresence>
    </div>
  );
}
