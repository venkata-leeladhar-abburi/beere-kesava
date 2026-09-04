/* eslint-disable no-restricted-syntax */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Camera, CheckCircle2, AlertTriangle,
  Plus, Printer, RotateCcw,
} from "lucide-react";
import { C, F, card } from "../tokens";
import { FieldLabel, type ReceivedSareeLog } from "./shared";
import { MaterialSplitPanel, autoMaterialSplit, type MatSplit } from "./MaterialSplitPanel";
import { SareeTypePicker } from "./SareeTypePicker";
import { type WeaverBatchData } from "./weaversData";
import { weaversApi } from "../../../../../shared/api/weavers";
import { WeaverSigBlock } from "./WeaverSigBlock";
import { TagPreviewScreen } from "./TagPreviewScreen";
import { useRatesPricing } from "@/features/pricing";
import { useBatches } from "@/features/production";
import { useFinishing } from "@/features/finishing";
import { DefectPhotoPrompt } from "./DefectPhotoPrompt";
import { OwnFactoryReceiveTab } from "./OwnFactoryReceiveTab";
import { SareeSelectionTable } from "./SareeSelectionTable";
import { ReceiveRecipientPicker, type RecipientOption } from "./ReceiveRecipientPicker";
import { Button, Input, NumberInput } from "../../../../../shared/ui/primitives";
import { toPaise, fromPaise } from "../../../../../lib/gst";
import { useAuth } from "../../../../../contexts/AuthContext";
import { isApiError } from "@/shared/api/client";
import { Modal } from "@/shared/ui/overlay/Modal";

interface RejectedSaree {
  id: string;
  weaver: string;
  weight: string;
  date: string;
  photoUrl: string;
}

export function ReceiveSareesPage({ onSareeReceived }: { onBack: () => void; onSareeReceived?: (rec: ReceivedSareeLog) => void }) {
  const { getSareeTypeByCode } = useRatesPricing();
  const { user } = useAuth();
  const { data: weaversRes, isLoading: weaversLoading } = useQuery({
    queryKey: ["worker-receive-weavers"],
    queryFn: () => weaversApi.list(),
  });
  const WEAVERS = useMemo(() => {
    if (!weaversRes?.items) return [];
    return weaversRes.items.map(w => ({
      name: w.name,
      // `id` is the UUID everything is keyed by; `code` is the human-facing
      // weaver id ("Ramarao-001") and is the only one ever displayed.
      id: w.id,
      code: w.code,
      looms: w.looms,
      village: w.village ?? null,
      status: w.status,
      avatar: (w.initials || `${w.firstName.charAt(0)}${w.lastName.charAt(0)}`).slice(0, 2).toUpperCase(),
    }));
  }, [weaversRes]);

  const { batches: allBatches, receiveRow } = useBatches();
  const { dispatches } = useFinishing();
  // A saree that has already left the premises on a dispatch has no business
  // reappearing in a receive queue, no matter what its QC verdict says — this
  // is a data-hygiene backstop for a saree that was dispatched (by mistake,
  // or before a late-entered QC result) rather than the normal path.
  const dispatchedSareeIds = useMemo(
    () => new Set(dispatches.flatMap(d => d.sareeIds)),
    [dispatches],
  );

  const [activeSection, setActiveSection] = useState<"outsourced" | "own">("outsourced");
  const [selectedWeaver, setSelectedWeaver] = useState<typeof WEAVERS[0] | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedSareeNos, setSelectedSareeNos] = useState<Set<number>>(new Set());
  const [sareeSort, setSareeSort] = useState<"serial" | "status">("serial");
  const [isSaving, setIsSaving] = useState(false);
  // Set when the backend refuses a receipt because the weaver's outstanding
  // material balance can't cover the entered weight (BatchesService.receiveRow
  // -> MaterialReturnsService.createAutoReturnForReceiptByWeight/
  // createAutoReturnForReceipt) — surfaced as a blocking popup rather than a
  // toast so Worker Staff can't miss it and re-submit the same bad weight.
  const [insufficientMaterialError, setInsufficientMaterialError] = useState<string | null>(null);

  // Default to the first weaver once the real list loads.
  useEffect(() => {
    if (!selectedWeaver && WEAVERS.length > 0) setSelectedWeaver(WEAVERS[0]);
  }, [WEAVERS, selectedWeaver]);

  // Real per-weaver batches, built from active batches' rows that have
  // already been assigned a sareeId (by admin) but not yet received.
  // Only rows still pending receipt are shown — once received, a saree
  // moves into the QC queue instead of staying in this list.
  //
  // Rework rounds land back here: a semi-approved or defective saree goes back
  // to the weaver with its receipt cleared, so it shows up again (flagged as a
  // rework) and has to be received a second time. Only a passed verdict is
  // final enough to keep a saree out of this list for good — and regardless
  // of verdict, a saree already on a dispatch record is gone from the
  // premises and must not linger here either.
  const batches = useMemo<Record<string, WeaverBatchData[]>>(() => {
    const result: Record<string, WeaverBatchData[]> = {};
    for (const b of allBatches) {
      if (b.status !== "active") continue;
      for (const r of b.rows) {
        if (!r.weaverId || !r.sareeId || r.receivedAt || r.finished) continue;
        if (r.qcResult === "passed") continue;
        if (dispatchedSareeIds.has(r.sareeId)) continue;
        if (!result[r.weaverId]) result[r.weaverId] = [];
        let wb = result[r.weaverId].find(x => x.id === b.batchId);
        if (!wb) {
          wb = {
            id: b.batchId, total: 0, sareeTypeCode: r.sareeTypeCode ?? "—", bulkOrderLabel: r.bulkOrderLabel ?? undefined,
            // Which of the weaver's own looms this batch was actually
            // assigned to at creation — not the weaver's total loom count.
            loomNumber: r.weaverLoom ?? undefined,
            sarees: [],
          };
          result[r.weaverId].push(wb);
        }
        wb.sarees.push({ no: r.serial, sareeId: r.sareeId, serial: r.serial, status: "pending", isRework: r.awaitingRework === true, weaverLoom: r.weaverLoom ?? undefined });
        wb.total += 1;
      }
    }
    return result;
  }, [allBatches, dispatchedSareeIds]);

  // Everything the picker shows about a weaver — name, human-facing code,
  // village and loom count — so a weaver is identifiable without opening the
  // registry.
  const WEAVER_OPTIONS = useMemo<RecipientOption[]>(() => WEAVERS.map(w => ({
    id: w.id,
    code: w.code,
    name: w.name,
    avatar: w.avatar,
    looms: w.looms,
    status: w.status,
    subtitle: [w.village, `${w.looms} loom${w.looms === 1 ? "" : "s"}`].filter(Boolean).join(" · "),
  })), [WEAVERS]);

  const [sareeColor, setSareeColor] = useState("");
  const [sareeWeight, setSareeWeight] = useState("");
  // Retail selling price for this specific saree — optional; when left
  // blank, the New Sale flow falls back to the saree type's shared rate.
  const [sareePrice, setSareePrice] = useState("");
  const [matEdits, setMatEdits] = useState<Partial<MatSplit>>({});
  // Type this receipt is booked under — seeded from the batch row's assigned
  // type, overridable per receipt (see SareeTypePicker). `null` means "not
  // touched yet", so it re-seeds when the worker switches batch.
  const [typeOverride, setTypeOverride] = useState<string | null>(null);
  const [showTagPrint, setShowTagPrint] = useState(false);
  const [rejectedSarees, setRejectedSarees] = useState<RejectedSaree[]>([]);
  const [showDefectPrompt, setShowDefectPrompt] = useState(false);
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [signed, setSigned] = useState(false);
  const [remoteSent, setRemoteSent] = useState(false);
  const [remoteConfirmed, setRemoteConfirmed] = useState(false);

  const weaverBatches = selectedWeaver ? (batches[selectedWeaver.id] ?? []) : [];
  const currentBatch = weaverBatches.find(b => b.id === selectedBatchId) ?? weaverBatches[0] ?? null;
  const doneCount = currentBatch ? currentBatch.sarees.filter(s => s.status !== "pending").length : 0;
  const allDone = currentBatch ? doneCount === currentBatch.total : false;
  const reworkSarees = currentBatch ? currentBatch.sarees.filter(s => s.isRework) : [];

  // The type this receipt is booked under: the worker's pick if they made
  // one, otherwise whatever the batch was assigned. "—" is the upstream
  // stand-in for a row that never got a type, and is not a real code.
  const assignedTypeCode =
    currentBatch && currentBatch.sareeTypeCode !== "—" ? currentBatch.sareeTypeCode : undefined;
  const effectiveTypeCode = typeOverride ?? assignedTypeCode;

  const weightNum = sareeWeight ? parseFloat(sareeWeight) : null;
  const weightOk = weightNum !== null && weightNum >= 600;
  const selectedSarees = currentBatch ? currentBatch.sarees.filter(s => selectedSareeNos.has(s.no)) : [];
  // Single-selection views (tag preview, saree-ID readout) key off the first
  // selected saree — multi-select still supports these incidentally.
  const sareeId = selectedSarees[0]?.sareeId ?? "—";

  const pickWeaver = useCallback((id: string) => {
    // Matched on the weaver's unique id, never `name` -- two weavers can share
    // a display name, and matching by name would silently resolve to whichever
    // one happens to come first, showing the wrong weaver's
    // looms/batches/details regardless of which was clicked.
    const w = WEAVERS.find(w => w.id === id) || null;
    setSelectedWeaver(w);
    setSelectedBatchId(w ? (batches[w.id]?.[0]?.id ?? null) : null);
    setSelectedSareeNos(new Set());
    setSareeColor(""); setSareeWeight(""); setSareePrice(""); setMatEdits({}); setTypeOverride(null);
  }, [WEAVERS, batches]);

  const pickBatch = useCallback((batchId: string) => {
    setSelectedBatchId(batchId);
    setSelectedSareeNos(new Set());
    setSareeColor(""); setSareeWeight(""); setSareePrice(""); setMatEdits({}); setTypeOverride(null);
  }, []);

  const selectSareeSlot = (no: number) => {
    const s = currentBatch?.sarees.find(s => s.no === no);
    if (!s || s.status !== "pending") return;
    setSelectedSareeNos(prev => {
      const next = new Set(prev);
      if (next.has(no)) next.delete(no);
      else next.add(no);
      return next;
    });
    setSareeColor(""); setSareeWeight(""); setSareePrice(""); setMatEdits({});
  };

  const toggleAllSarees = () => {
    const pending = currentBatch?.sarees.filter(s => s.status === "pending") ?? [];
    const allSelected = pending.length > 0 && pending.every(s => selectedSareeNos.has(s.no));
    setSelectedSareeNos(allSelected ? new Set() : new Set(pending.map(s => s.no)));
    setSareeColor(""); setSareeWeight(""); setSareePrice(""); setMatEdits({}); setTypeOverride(null);
  };

  // A type is required, not optional: QcService refuses a saree with none
  // ("has no saree type assigned yet"), which would strand it between receipt
  // and QC with nothing on screen explaining why.
  const canSaveSaree =
    selectedSareeNos.size > 0 && !!sareeColor && !!sareeWeight && !!effectiveTypeCode && !isSaving;

  const saveSaree = async () => {
    if (!selectedWeaver || !currentBatch || selectedSareeNos.size === 0 || !canSaveSaree) return;
    setIsSaving(true);
    try {
      const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      // Whatever's on screen for this saree right now — the auto split from
      // the rate card, or Worker Staff's own edit on top of it — is what
      // actually gets recorded per saree, so a bulk order's material tally
      // reflects real entries instead of a re-derived guess later.
      const auto = autoMaterialSplit(effectiveTypeCode, sareeWeight, getSareeTypeByCode);
      const warpG = matEdits.warp !== undefined ? parseFloat(matEdits.warp) : (auto ? parseFloat(auto.warp) : undefined);
      const reshamG = matEdits.resham !== undefined ? parseFloat(matEdits.resham) : (auto ? parseFloat(auto.resham) : undefined);
      const jariReels = matEdits.jari !== undefined ? parseFloat(matEdits.jari) : (auto ? parseFloat(auto.jari) : undefined);

      for (const no of selectedSareeNos) {
        const s = currentBatch.sarees.find(x => x.no === no);
        if (!s) continue;
        try {
          await receiveRow(currentBatch.id, no, {
            weight: parseFloat(sareeWeight),
            color: sareeColor,
            warpG: Number.isFinite(warpG) ? warpG : undefined,
            reshamG: Number.isFinite(reshamG) ? reshamG : undefined,
            jariReels: Number.isFinite(jariReels) ? jariReels : undefined,
            // Only sent when it actually differs, so an untouched receipt
            // leaves the assigned type exactly as it was.
            sareeTypeCode: effectiveTypeCode !== assignedTypeCode ? effectiveTypeCode : undefined,
            sellingPrice: sareePrice ? fromPaise(toPaise(Number(sareePrice) || 0)) : undefined,
            actorId: user?.id,
          });
        } catch (err) {
          // A 400 here means the weaver doesn't have enough material
          // outstanding to cover this saree's weight — stop processing the
          // rest of the batch selection so the same bad weight isn't retried
          // saree after saree, and surface it as a blocking popup.
          if (isApiError(err) && err.statusCode === 400) {
            setInsufficientMaterialError(err.message);
            return;
          }
          throw err;
        }
        onSareeReceived?.({
          id: s.sareeId, weaver: selectedWeaver.name, wcode: selectedWeaver.id, weaverCode: selectedWeaver.code, batch: currentBatch.id,
          weight: `${sareeWeight}g`, date: dateStr,
          color: sareeColor, status: "Pending QC",
          loomNumber: s.weaverLoom ?? currentBatch.loomNumber ?? null,
          sareeType: effectiveTypeCode ?? currentBatch.sareeTypeCode, bulkOrder: currentBatch.bulkOrderLabel ?? null,
          receivedBy: user?.name ?? null,
        });
      }
      setSelectedSareeNos(new Set()); setSareeColor(""); setSareeWeight(""); setSareePrice(""); setMatEdits({}); setTypeOverride(null);
    } finally {
      setIsSaving(false);
    }
  };

  if (showTagPrint) {
    return (
      <TagPreviewScreen
        sareeIds={selectedSarees.length > 0 ? selectedSarees.map(s => s.sareeId) : [sareeId]}
        entityLabel="Weaver"
        entityValue={selectedWeaver?.name ?? "—"}
        onBack={() => setShowTagPrint(false)}
        onPrint={() => { toast.success("Sent to printer"); setShowTagPrint(false); }}
      />
    );
  }

  return (
    <>
      <div style={{ paddingBottom: 28 }}>
        <div style={{ display: "flex", margin: "12px 16px 4px", background: "#F5F0F2", borderRadius: 10, padding: 3 }}>
          {[["outsourced", "Outsourced"], ["own", "Own Factory"]].map(([key, label]) => (
            <Button key={key} variant={activeSection === key ? "primary" : "tertiary"} fullWidth
              onClick={() => setActiveSection(key as "outsourced" | "own")}
              className={activeSection === key ? "rounded-[9px] bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-[9px]"}>
              {label}
            </Button>
          ))}
        </div>

        {activeSection === "outsourced" && (
          <>
            <ReceiveRecipientPicker
              kind="weaver"
              options={WEAVER_OPTIONS}
              batchesByRecipient={batches}
              selectedId={selectedWeaver?.id ?? null}
              onPickRecipient={pickWeaver}
              selectedBatchId={currentBatch?.id ?? null}
              onPickBatch={pickBatch}
              loading={weaversLoading}
            />

            {reworkSarees.length > 0 && (
              <div style={{ margin: "10px 16px 0", padding: "10px 14px", background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.20)`, borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <RotateCcw size={15} color={C.burg} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.burg }}>
                    {reworkSarees.length} saree{reworkSarees.length > 1 ? "s" : ""} back for rework
                  </div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {reworkSarees.map(s => s.sareeId).join(", ")} {reworkSarees.length > 1 ? "were" : "was"} semi-approved or marked defective at QC and sent back to the weaver. Receive {reworkSarees.length > 1 ? "them" : "it"} again to send {reworkSarees.length > 1 ? "them" : "it"} back through quality check.
                  </div>
                </div>
              </div>
            )}

            {currentBatch && selectedWeaver && (
              <SareeSelectionTable
                currentBatch={currentBatch}
                entityName={selectedWeaver.name}
                entityAvatar={selectedWeaver.avatar}
                entityCode={selectedWeaver.code}
                doneCount={doneCount}
                sareeSort={sareeSort}
                setSareeSort={setSareeSort}
                selectedSareeNos={selectedSareeNos}
                selectSareeSlot={selectSareeSlot}
                onToggleAll={toggleAllSarees}
              />
            )}

            {selectedSareeNos.size > 0 && currentBatch && (
              <div style={{ ...card, margin: "10px 16px 10px", padding: 14 }}>
                <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
                  {selectedSareeNos.size === 1
                    ? `Saree #${[...selectedSareeNos][0]} — ${currentBatch.id}`
                    : `${selectedSareeNos.size} sarees selected — ${currentBatch.id}`}
                </div>
                {selectedSareeNos.size > 1 && (
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 10 }}>
                    Color and weight entered below apply to all {selectedSareeNos.size} selected sarees.
                  </div>
                )}

                <div style={{ marginBottom: 10 }}>
                  <FieldLabel>Saree Color</FieldLabel>
                  <Input value={sareeColor} onChange={e => setSareeColor(e.target.value)} placeholder="e.g. Maroon, Cream Gold"
                    className="h-12 text-sm" />
                </div>

                {/* Above the weight field on purpose — the split below can't be
                    computed until the type is known. */}
                <SareeTypePicker
                  assignedCode={assignedTypeCode}
                  value={effectiveTypeCode}
                  onChange={setTypeOverride}
                  count={selectedSareeNos.size}
                />



                <div style={{ marginBottom: 10 }}>
                  <div>
                    <FieldLabel>Weight (grams)</FieldLabel>
                    <div style={{ position: "relative" }}>
                      <NumberInput value={sareeWeight === "" ? "" : Number(sareeWeight)} onValueChange={v => setSareeWeight(v === "" ? "" : String(v))} placeholder="0"
                        size="lg" className="font-mono text-lg" />
                    </div>
                    {weightNum !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        {weightOk ? <CheckCircle2 size={11} color={C.green} /> : <AlertTriangle size={11} color={C.crim} />}
                        <span style={{ fontFamily: F.u, fontSize: 12, color: weightOk ? C.green : C.crim }}>
                          {weightOk ? "OK" : "Too low"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <MaterialSplitPanel
                  typeCode={effectiveTypeCode}
                  weight={sareeWeight}
                  edits={matEdits}
                  onEdit={setMatEdits}
                />

                {sareeColor && sareeWeight && (
                  <div style={{ textAlign: "center", marginBottom: 10 }}>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 2 }}>
                      {selectedSareeNos.size === 1 ? "Saree ID" : `Saree IDs (${selectedSareeNos.size})`}
                    </div>
                    <div style={{ fontFamily: F.m, fontSize: 16, fontWeight: 600, color: C.burg }}>
                      {selectedSareeNos.size === 1 ? sareeId : selectedSarees.map(s => s.sareeId).join(", ")}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <Button variant="secondary" fullWidth size="sm" iconLeft={Printer} onClick={() => setShowTagPrint(true)} className="h-11 rounded-full border-[rgba(200,155,71,0.55)] text-[#845E04]">
                    Print Tag{selectedSareeNos.size > 1 ? "s" : ""}
                  </Button>
                  <Button variant="secondary" fullWidth size="sm" iconLeft={Plus} onClick={saveSaree} disabled={!canSaveSaree}
                    className="h-11 rounded-full border-[#6E0F2D] text-[#6E0F2D]">
                    {selectedSareeNos.size > 1 ? `Save ${selectedSareeNos.size} Sarees` : "Next Saree"}
                  </Button>
                </div>
                <Button variant="secondary" fullWidth size="sm" iconLeft={AlertTriangle} onClick={() => setShowDefectPrompt(true)}
                  className="h-11 rounded-full border-[rgba(171,56,50,0.28)] bg-[rgba(171,56,50,0.06)] text-[#AB3832] hover:bg-[rgba(171,56,50,0.10)]">
                  Mark {selectedSareeNos.size > 1 ? `${selectedSareeNos.size} Sarees` : "as"} Defective
                </Button>
              </div>
            )}

            {currentBatch && selectedSareeNos.size === 0 && !allDone && (
              <div style={{ margin: "10px 16px 0", padding: "10px 14px", background: "rgba(110,15,45,0.04)", border: `1px dashed ${C.bdr}`, borderRadius: 10, textAlign: "center" }}>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Tap one or more pending sarees above (or Select All) to record color and weight.</span>
              </div>
            )}

            {showDefectPrompt && (
              <DefectPhotoPrompt
                onCancel={() => setShowDefectPrompt(false)}
                onCapture={() => {
                  if (selectedWeaver && currentBatch && selectedSareeNos.size > 0) {
                    const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                    selectedSarees.forEach(s => {
                      setRejectedSarees(prev => [
                        {
                          id: s.sareeId,
                          weaver: selectedWeaver.name,
                          weight: sareeWeight ? `${sareeWeight}g` : "—",
                          date: dateStr,
                          photoUrl: "captured-defect-photo",
                        },
                        ...prev,
                      ]);
                      onSareeReceived?.({
                        id: s.sareeId, weaver: selectedWeaver.name, wcode: selectedWeaver.id, weaverCode: selectedWeaver.code, batch: currentBatch.id,
                        weight: sareeWeight ? `${sareeWeight}g` : "—", date: dateStr,
                        color: sareeColor || "—", status: "Defective",
                        loomNumber: s.weaverLoom ?? currentBatch.loomNumber ?? null,
                        sareeType: effectiveTypeCode ?? currentBatch.sareeTypeCode, bulkOrder: currentBatch.bulkOrderLabel ?? null,
                        receivedBy: user?.name ?? null,
                      });
                    });
                  }
                  setShowDefectPrompt(false);
                  setSelectedSareeNos(new Set());
                  setSareeColor(""); setSareeWeight(""); setSareePrice(""); setMatEdits({});
                }}
              />
            )}

            {rejectedSarees.length > 0 && (
              <div style={{ margin: "0 16px 10px" }}>
                <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.crim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  Rejected at Receipt ({rejectedSarees.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {rejectedSarees.map((r) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(220,53,69,0.04)", border: "1px solid rgba(220,53,69,0.18)", borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Camera size={14} color="rgba(255,255,255,0.85)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.text }}>{r.id}</div>
                        <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{r.weaver} · {r.weight} · {r.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentBatch && allDone && (
              <div style={{ margin: "10px 16px 0", padding: "10px 14px", background: "rgba(30,102,64,0.06)", border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color={C.green} />
                <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.green }}>All {currentBatch.total} sarees recorded. Collect weaver signature to complete the batch.</span>
              </div>
            )}

            {currentBatch && allDone && (
              <>
                <WeaverSigBlock
                  weaverName={selectedWeaver?.name ?? "Weaver"}
                  sigMethod={sigMethod} setSigMethod={setSigMethod}
                  signed={signed} setSigned={setSigned}
                  remoteSent={remoteSent} setRemoteSent={setRemoteSent}
                  remoteConfirmed={remoteConfirmed} setRemoteConfirmed={setRemoteConfirmed}
                />

                {(() => {
                  const sigOk = (sigMethod === "here" && signed) || (sigMethod === "remote" && remoteConfirmed);
                  return (
                    <div style={{ padding: "14px 16px 0" }}>
                      {!sigOk && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "8px 12px", background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.20)", borderRadius: 8 }}>
                          <AlertTriangle size={13} color={C.crim} />
                          <span style={{ fontFamily: F.u, fontSize: 12, color: C.crim }}>Weaver signature required to complete batch</span>
                        </div>
                      )}
                      <Button
                        variant="primary"
                        fullWidth
                        iconLeft={CheckCircle2}
                        disabled={!sigOk}
                        className={`h-12 rounded-full text-[14px] ${sigOk ? "bg-[#1F774E] hover:bg-[#15603D]" : ""}`}>
                        Mark Batch Complete
                      </Button>
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}

        {activeSection === "own" && <OwnFactoryReceiveTab onSareeReceived={onSareeReceived} />}
      </div>

      <Modal open={insufficientMaterialError !== null} onOpenChange={(open) => { if (!open) setInsufficientMaterialError(null); }} size="xs">
        <Modal.Header title="Not Enough Material" subtitle="This weaver's outstanding material can't cover this saree" />
        <Modal.Body>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "4px 0 16px" }}>
            <AlertTriangle size={20} color={C.crim} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontFamily: F.u, fontSize: 14, color: C.text, lineHeight: 1.5 }}>{insufficientMaterialError}</span>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setInsufficientMaterialError(null)} className="rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D]">
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
