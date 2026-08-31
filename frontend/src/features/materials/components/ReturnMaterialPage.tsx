import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Plus, X, CheckCircle2, Undo2 } from "lucide-react";
import { Button, IconButton } from "../../../shared/ui/primitives";
import { useMaterialReturn, MaterialReturnRecord, WeaverOutstandingLine } from "../contexts/MaterialReturnContext";
import { FactoryLoom, loomLabel } from "@/features/production";
import { useBatches } from "@/features/production";
import { DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../shared/ui/DateFilterBar";
import { weaversApi } from "../../../shared/api/weavers";
import { factoryLoomsApi } from "../../../shared/api/factory-looms";

import { F, T, WeaverLite } from "./issueMaterial/theme";
import { SectionPill, SectionCard } from "./issueMaterial/primitives";
import { RecipientSelector } from "./issueMaterial/RecipientSelector";
import { SignatureBlock } from "./issueMaterial/SignatureBlock";
import { SignatureCanvasHandle } from "./issueMaterial/SignatureCanvas";
import { ReturnMaterialRowEditor } from "./returnMaterial/ReturnMaterialRowEditor";
import { OutstandingMaterialPanel } from "./returnMaterial/OutstandingMaterialPanel";
import { DeductionBlock } from "./returnMaterial/DeductionBlock";
import { ReturnRecordDetailsModal } from "./returnMaterial/ReturnRecordDetailsModal";
import { ReturnHistorySection } from "./returnMaterial/ReturnHistorySection";
import { summarizeMaterials } from "./returnMaterial/materialFormatters";
import { emptyReturnRow, ReturnRowState } from "./returnMaterial/theme";
import { fromPaise, toPaise } from "@/lib/gst";
import { EntityCode } from "@/shared/ui/domain";

// Deterministic avatar colors for weavers fetched from the backend (mirrors IssueMaterialPage.tsx).
const WEAVER_AVATAR_COLORS = ["#5A3E6B", "#9B6B8A", "#2D6B6B", "#4A6B4A", "#2D7D6B", "#4A5E7A", "#7A2040"];
function avatarColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return WEAVER_AVATAR_COLORS[hash % WEAVER_AVATAR_COLORS.length]!;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export function ReturnMaterialPage() {
  const { returnRecords, addReturnRecord, getOutstandingForRecipient } = useMaterialReturn();
  const { batches } = useBatches();

  const [weavers, setWeavers] = useState<WeaverLite[]>([]);
  const [looms, setLooms] = useState<FactoryLoom[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [weaversRes, loomsRes] = await Promise.all([weaversApi.list(), factoryLoomsApi.list()]);
      if (cancelled) return;
      setWeavers(weaversRes.items.map(w => ({
        id: w.id, code: w.code, name: w.name, village: w.village ?? "", initials: w.initials,
        bg: avatarColorFor(w.id), status: w.status === "ACTIVE" ? "active" : "idle",
        looms: w.looms, phone: w.phone,
      })));
      setLooms(loomsRes.items.map(l => ({
        id: l.id, loomNumber: l.loomNumber, location: l.location ?? "",
        operatorName: l.operatorName ?? "", operatorPhone: l.operatorPhone ?? "",
        status: l.status === "ACTIVE" ? "active" : l.status === "MAINTENANCE" ? "maintenance" : "idle",
        installedYear: l.installedYear ? String(l.installedYear) : "", notes: l.notes ?? "",
      })));
    })();
    return () => { cancelled = true; };
  }, []);

  // Step 1 — recipient type toggle
  const [recipientType, setRecipientType] = useState<"weaver" | "factoryLoom">("weaver");

  // Step 1 — weaver
  const [weaverSearch, setWeaverSearch] = useState("");
  const [showWeaverList, setShowWeaverList] = useState(false);
  const [selectedWeaverId, setSelectedWeaverId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Step 1 — factory loom
  const [selectedLoomId, setSelectedLoomId] = useState<string | null>(null);
  const [selectedLoom, setSelectedLoom] = useState<number | "">("");

  // Outstanding material for the selected recipient
  const [outstandingLines, setOutstandingLines] = useState<WeaverOutstandingLine[]>([]);
  const [outstandingLoading, setOutstandingLoading] = useState(false);

  // Step 2 — materials being returned
  const [rows, setRows] = useState<ReturnRowState[]>([emptyReturnRow()]);

  // Step 3 — deduction
  const [deductionAmount, setDeductionAmount] = useState("");
  const [deductionReason, setDeductionReason] = useState("");

  // Step 4 — notes
  const [notes, setNotes] = useState("");

  // Step 5 — signature
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [signed, setSigned] = useState(false);
  const [remoteSent, setRemoteSent] = useState(false);

  const [successRecord, setSuccessRecord] = useState<MaterialReturnRecord | null>(null);

  // History section state
  const [histSearch, setHistSearch] = useState("");
  const [histWeaverFilter, setHistWeaverFilter] = useState("All Weavers");
  const [histDateFilter, setHistDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [histPage, setHistPage] = useState(1);
  const [viewRecord, setViewRecord] = useState<MaterialReturnRecord | null>(null);
  const ROWS_PER_PAGE = 15;

  const canvasRef = useRef<SignatureCanvasHandle | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedWeaver = weavers.find(w => w.id === selectedWeaverId) || null;
  const selectedFactoryLoom = looms.find(l => l.id === selectedLoomId) || null;

  const weaverBatches = selectedWeaver
    ? batches.filter(b => b.rows.some(r => r.weaverId === selectedWeaver.id))
    : [];
  const loomBatches = selectedFactoryLoom
    ? batches.filter(b => b.rows.some(r => r.factoryLoomId === selectedFactoryLoom.id))
    : [];

  // Fetch the outstanding balance whenever the recipient *or* the loom/batch
  // narrowing changes, so the panel always answers the question the current
  // selection asks: everything still with the weaver, then just this loom,
  // then just this batch.
  useEffect(() => {
    let cancelled = false;
    if (!selectedWeaverId && !selectedLoomId) {
      setOutstandingLines([]);
      return;
    }
    setOutstandingLoading(true);
    void getOutstandingForRecipient(selectedWeaverId ?? undefined, selectedLoomId ?? undefined, {
      // Loom number is a weaver-side concept — a factory loom is already
      // identified by selectedLoomId, and sending both would over-filter.
      loomNumber: recipientType === "weaver" ? selectedLoom : undefined,
      batchId: selectedBatchId ?? undefined,
    })
      .then(lines => { if (!cancelled) setOutstandingLines(lines); })
      .catch(() => { if (!cancelled) setOutstandingLines([]); })
      .finally(() => { if (!cancelled) setOutstandingLoading(false); });
    return () => { cancelled = true; };
  }, [selectedWeaverId, selectedLoomId, selectedLoom, selectedBatchId, recipientType, getOutstandingForRecipient]);

  const isSigned = (sigMethod === "here" && signed) || (sigMethod === "remote" && remoteSent);

  // eslint-disable-next-line no-restricted-syntax -- material quantity (kg/g/reels/buns), not currency
  const validRows = rows.filter(r => r.materialType && r.quantity && parseFloat(r.quantity) > 0);
  const recipientReady = recipientType === "weaver"
    ? (!!selectedWeaver && selectedLoom !== "" && !!selectedBatchId)
    : (!!selectedFactoryLoom && !!selectedBatchId);
  // A deduction amount with no reason leaves the weaver (and whoever pays
  // them out later) unable to tell why money is being held back — require
  // the reason whenever an amount is entered.
  const deductionNeedsReason = deductionAmount !== "" && Number(deductionAmount) > 0 && !deductionReason.trim();
  const canConfirm = recipientReady && validRows.length > 0 && isSigned && !deductionNeedsReason;

  function updateRow(uid: string, updated: ReturnRowState) {
    setRows(prev => prev.map(r => r.uid === uid ? updated : r));
  }
  function removeRow(uid: string) {
    setRows(prev => prev.filter(r => r.uid !== uid));
  }
  function addRow() {
    setRows(prev => [...prev, emptyReturnRow()]);
  }

  function resetForm() {
    setWeaverSearch(""); setSelectedWeaverId(null); setShowWeaverList(false);
    setSelectedLoomId(null);
    setSelectedLoom("");
    setSelectedBatchId(null);
    setRows([emptyReturnRow()]); setNotes("");
    setDeductionAmount(""); setDeductionReason("");
    setSigMethod("none"); setSigned(false); setRemoteSent(false);
  }

  async function handleConfirm() {
    if (!canConfirm || submitting) return;
    if (recipientType === "weaver" && !selectedWeaver) return;
    if (recipientType === "factoryLoom" && !selectedFactoryLoom) return;

    const materials = validRows.map(r => {
      const base: MaterialReturnRecord["materials"][number] = {
        materialType: r.materialType,
        // eslint-disable-next-line no-restricted-syntax -- material quantity (kg/g/reels/buns), not currency
        quantity: parseFloat(r.quantity),
        unit: r.materialType === "Jari" ? r.jariUnit : (r.warpReshamUnit || "kg"),
      };
      if (r.description) base.description = r.description;
      return base;
    });

    setSubmitting(true);
    try {
      const signatureBlob = sigMethod === "here" ? await canvasRef.current?.toBlob() ?? null : null;

      const record = await addReturnRecord({
        ...(recipientType === "weaver"
          ? { weaverId: selectedWeaver!.id, weaverName: selectedWeaver!.name, loomNumber: selectedLoom || undefined }
          : { factoryLoomId: selectedFactoryLoom!.id, factoryLoomNumber: loomLabel(selectedFactoryLoom!) }),
        batchId: selectedBatchId || undefined,
        materials,
        signatureMethod: sigMethod === "remote" ? "remote" : "here",
        signatureBlob,
        deductionAmount: deductionAmount ? fromPaise(toPaise(Number(deductionAmount))) : undefined,
        deductionReason: deductionReason || undefined,
        notes: notes || undefined,
      });

      setSuccessRecord(record);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  // History filtering
  const weaverNames = ["All Weavers", ...Array.from(new Set(returnRecords.map(r => r.weaverName).filter((n): n is string => !!n)))];
  const filteredHistory = returnRecords.filter(r => {
    const matchSearch = !histSearch ||
      (r.weaverName ?? "").toLowerCase().includes(histSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(histSearch.toLowerCase());
    const matchWeaver = histWeaverFilter === "All Weavers" || r.weaverName === histWeaverFilter;
    const matchDate = matchesDateFilter(r.receivedAt, histDateFilter);
    return matchSearch && matchWeaver && matchDate;
  });
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ROWS_PER_PAGE));
  const pagedHistory = filteredHistory.slice((histPage - 1) * ROWS_PER_PAGE, histPage * ROWS_PER_PAGE);

  const recipientLabel = selectedWeaver?.name ?? selectedFactoryLoom?.loomNumber ?? "recipient";
  // Spells out how far the figures below have been narrowed, so "18.68 kg"
  // is never ambiguous between the whole weaver and a single batch.
  const scopeLabel = [
    recipientType === "weaver" && selectedLoom !== "" ? `Loom ${selectedLoom}` : null,
    selectedBatchId,
  ].filter(Boolean).join(" · ");

  return (
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100dvh" }}>
      {/* Header */}
      <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
        <div className="px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
          <div style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 10 }}>
            Since 1999 · Material Return
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Receive Materials Back from Weaver</h1>
          </div>
          <p className="max-w-[640px]" style={{ fontFamily: F.ui, fontWeight: 400, fontSize: "clamp(14px, 2.2vw, 16px)", color: "rgba(255,253,249,0.70)", lineHeight: 1.6, margin: 0 }}>
            See what's outstanding, record what's actually coming back, note any deduction, and collect the weaver's signature.
          </p>
        </div>
      </header>

      <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32, paddingBottom: 80, width: "100%" }}>

        {/* Success banner */}
        <AnimatePresence>
          {successRecord && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: 28 }}>
              <div style={{ background: "rgba(30,102,64,0.10)", border: `1.5px solid ${T.green}`, borderRadius: 16, padding: 24, display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(30,102,64,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={26} color={T.green} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: T.green, marginBottom: 4 }}>Materials Received Successfully</div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                    <EntityCode type="goodsReceipt" value={successRecord.id} size="sm" /> · From {successRecord.weaverName ?? successRecord.factoryLoomNumber} {successRecord.loomNumber ? `(Loom ${successRecord.loomNumber})` : ""} · {summarizeMaterials(successRecord.materials)}
                  </div>
                </div>
                <IconButton icon={X} label="Dismiss" onClick={() => setSuccessRecord(null)} variant="ghost" className="text-[var(--text-success)]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ SECTION A — RETURN MATERIAL FORM ═══ */}
        <div id="return-form" style={{ marginBottom: 48 }}>
        <SectionCard icon={Undo2} title="Return Material" subtitle="Take raw materials back from a weaver or factory loom and record who signed for it.">

          {/* STEP 1 — Select Recipient */}
          <SectionPill label="Step 1 · Select Weaver / Factory Loom" />
          <RecipientSelector
            recipientType={recipientType} setRecipientType={setRecipientType}
            weaverSearch={weaverSearch} setWeaverSearch={setWeaverSearch}
            showWeaverList={showWeaverList} setShowWeaverList={setShowWeaverList}
            selectedWeaver={selectedWeaver} setSelectedWeaverId={setSelectedWeaverId}
            selectedLoom={selectedLoom} setSelectedLoom={setSelectedLoom}
            selectedFactoryLoom={selectedFactoryLoom} setSelectedLoomId={setSelectedLoomId}
            selectedBatchId={selectedBatchId} setSelectedBatchId={setSelectedBatchId}
            weaverBatches={weaverBatches} loomBatches={loomBatches}
            weavers={weavers} looms={looms}
          />

          {(selectedWeaver || selectedFactoryLoom) && (
            <OutstandingMaterialPanel loading={outstandingLoading} lines={outstandingLines} recipientLabel={recipientLabel} scopeLabel={scopeLabel} />
          )}

          {/* STEP 2 — Materials */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 2 · Add Materials Being Returned" />
            {rows.map(row => (
              <ReturnMaterialRowEditor key={row.uid} row={row} outstandingLines={outstandingLines} onChange={r => updateRow(row.uid, r)} onRemove={() => removeRow(row.uid)} showRemove={rows.length > 1} />
            ))}
            <Button onClick={addRow} variant="secondary" fullWidth iconLeft={Plus} className="border-dashed">
              Add Another Material
            </Button>
          </div>

          {/* STEP 3 — Deduction */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 3 · Deduction (Optional)" />
            <DeductionBlock amount={deductionAmount} setAmount={setDeductionAmount} reason={deductionReason} setReason={setDeductionReason} showReasonError={deductionNeedsReason} />
          </div>

          {/* STEP 4 — Notes */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 4 · Notes (Optional)" />
            <textarea aria-label="Notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any special instructions, batch references, or remarks"
              style={{ width: "100%", borderRadius: 12, border: `1.5px solid ${T.borderDef}`, padding: "12px 14px", fontFamily: F.ui, fontSize: 13, outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const }} />
          </div>

          {/* STEP 5 — Signature */}
          <div style={{ marginTop: 32 }}>
            <SectionPill label="Step 5 · Collect Weaver Signature" />
            <SignatureBlock
              weaverName={selectedWeaver?.name ?? "the weaver"}
              sigMethod={sigMethod} setSigMethod={setSigMethod}
              signed={signed} setSigned={setSigned}
              remoteSent={remoteSent} setRemoteSent={setRemoteSent}
              canvasRef={canvasRef}
            />
          </div>

          {/* Confirm */}
          <Button onClick={() => void handleConfirm()} disabled={!canConfirm || submitting} variant="primary" size="lg" fullWidth iconLeft={Check} className="mt-8">
            {submitting ? "Recording…" : "Confirm Return"}
          </Button>
        </SectionCard>
        </div>

        {/* ═══ SECTION B — RETURN HISTORY ═══ */}
        <div id="return-history">
          <ReturnHistorySection
            weaverNames={weaverNames}
            histSearch={histSearch} setHistSearch={v => { setHistSearch(v); setHistPage(1); }}
            histWeaverFilter={histWeaverFilter} setHistWeaverFilter={v => { setHistWeaverFilter(v); setHistPage(1); }}
            histDateFilter={histDateFilter} setHistDateFilter={f => { setHistDateFilter(f); setHistPage(1); }}
            pagedHistory={pagedHistory} histPage={histPage} setHistPage={setHistPage} totalPages={totalPages} totalCount={filteredHistory.length}
            setViewRecord={setViewRecord}
          />
        </div>
      </div>

      <AnimatePresence>
        {viewRecord && <ReturnRecordDetailsModal record={viewRecord} onClose={() => setViewRecord(null)} />}
      </AnimatePresence>
    </div>
  );
}
