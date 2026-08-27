/* eslint-disable no-restricted-syntax */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Camera, UploadCloud, CheckCircle2, AlertTriangle,
  Plus, Printer, RotateCcw,
} from "lucide-react";
import { C, F, card } from "../tokens";
import { FieldLabel, type ReceivedSareeLog } from "./shared";
import { MaterialSplitPanel, autoMaterialSplit, type MatSplit } from "./MaterialSplitPanel";
import { type WeaverBatchData } from "./weaversData";
import { factoryLoomsApi } from "../../../../../shared/api/factory-looms";
import { WeaverSigBlock } from "./WeaverSigBlock";
import { TagPreviewScreen } from "./TagPreviewScreen";
import { useRatesPricing } from "@/features/pricing";
import { useBatches } from "@/features/production";
import { useFinishing } from "@/features/finishing";
import { DefectPhotoPrompt } from "./DefectPhotoPrompt";
import { SareeSelectionTable } from "./SareeSelectionTable";
import { Button, Input, NumberInput, Select, SelectItem, Combobox } from "../../../../../shared/ui/primitives";
import { resolveAssetUrl } from "@/shared/api/uploads";
import { useImageUpload } from "@/shared/hooks/useImageUpload";
import { useAuth } from "../../../../../contexts/AuthContext";

interface RejectedSaree {
  id: string;
  weaver: string;
  weight: string;
  date: string;
  photoUrl: string;
}

// ─── Receive Sarees — Own Factory tab ────────────────────────────────────────
// Mirrors the outsourced-weaver flow in ReceiveSareesPage, but keyed by
// factory loom instead of weaver: pick a real loom (searchable, since a
// factory can run many), pick one of its active batches, then receive its
// sarees. Saree type is read off the batch (assigned at batch creation),
// never picked by hand here.
export function OwnFactoryReceiveTab({ onSareeReceived }: { onSareeReceived?: (rec: ReceivedSareeLog) => void }) {
  const { getSareeTypeByCode } = useRatesPricing();
  const { user } = useAuth();
  const { data: loomsRes } = useQuery({
    queryKey: ["worker-receive-factory-looms"],
    queryFn: () => factoryLoomsApi.list(),
  });
  const LOOMS = useMemo(() => {
    if (!loomsRes?.items) return [];
    return loomsRes.items.map(l => ({
      id: l.id,
      loomNumber: l.loomNumber,
      operatorName: l.operatorName,
      avatar: l.loomNumber.replace(/[^0-9A-Za-z]/g, "").slice(-2).toUpperCase() || "FL",
    }));
  }, [loomsRes]);

  const { batches: allBatches, receiveRow } = useBatches();
  const { dispatches } = useFinishing();
  const dispatchedSareeIds = useMemo(
    () => new Set(dispatches.flatMap(d => d.sareeIds)),
    [dispatches],
  );

  const [selectedLoom, setSelectedLoom] = useState<typeof LOOMS[0] | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedSareeNos, setSelectedSareeNos] = useState<Set<number>>(new Set());
  const [sareeSort, setSareeSort] = useState<"serial" | "status">("serial");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedLoom && LOOMS.length > 0) setSelectedLoom(LOOMS[0]);
  }, [LOOMS, selectedLoom]);

  // Real per-loom batches, built the same way as the outsourced weaver flow:
  // active batches' rows already assigned a sareeId on this factory loom but
  // not yet received. A rework round (semi/defective at QC) clears the
  // receipt and lands the saree back here to be received again.
  const batches = useMemo<Record<string, WeaverBatchData[]>>(() => {
    const result: Record<string, WeaverBatchData[]> = {};
    for (const b of allBatches) {
      if (b.status !== "active") continue;
      for (const r of b.rows) {
        if (r.recipientType !== "factoryLoom" || !r.factoryLoomId || !r.sareeId || r.receivedAt || r.finished) continue;
        if (r.qcResult === "passed") continue;
        if (dispatchedSareeIds.has(r.sareeId)) continue;
        if (!result[r.factoryLoomId]) result[r.factoryLoomId] = [];
        let wb = result[r.factoryLoomId].find(x => x.id === b.batchId);
        if (!wb) {
          wb = {
            id: b.batchId, total: 0, sareeTypeCode: r.sareeTypeCode ?? "—", bulkOrderLabel: r.bulkOrderLabel ?? undefined,
            sarees: [],
          };
          result[r.factoryLoomId].push(wb);
        }
        wb.sarees.push({ no: r.serial, sareeId: r.sareeId, serial: r.serial, status: "pending", isRework: r.awaitingRework === true });
        wb.total += 1;
      }
    }
    return result;
  }, [allBatches, dispatchedSareeIds]);

  const [sareeColor, setSareeColor] = useState("");
  const [sareeWeight, setSareeWeight] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const hasPhoto = photoUrl !== null;
  const setHasPhoto = (v: boolean) => { if (!v) setPhotoUrl(null); };
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  // The received-saree photo is evidence kept on the batch row, so it goes to
  // object storage and we hold the stored path — not a base64 data URL, which
  // never reached the server at all before.
  const { upload: uploadPhoto, uploading: photoUploading, error: photoError } = useImageUpload();
  const handlePhotoFile = async (file: File | undefined) => {
    if (!file) return;
    const url = await uploadPhoto(file);
    if (url) setPhotoUrl(url);
  };
  const [matEdits, setMatEdits] = useState<Partial<MatSplit>>({});
  const [showTagPrint, setShowTagPrint] = useState(false);
  const [rejectedSarees, setRejectedSarees] = useState<RejectedSaree[]>([]);
  const [showDefectPrompt, setShowDefectPrompt] = useState(false);
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [signed, setSigned] = useState(false);
  const [remoteSent, setRemoteSent] = useState(false);
  const [remoteConfirmed, setRemoteConfirmed] = useState(false);

  const loomBatches = selectedLoom ? (batches[selectedLoom.id] ?? []) : [];
  const currentBatch = loomBatches.find(b => b.id === selectedBatchId) ?? loomBatches[0] ?? null;
  const doneCount = currentBatch ? currentBatch.sarees.filter(s => s.status !== "pending").length : 0;
  const allDone = currentBatch ? doneCount === currentBatch.total : false;
  const reworkSarees = currentBatch ? currentBatch.sarees.filter(s => s.isRework) : [];

  const weightNum = sareeWeight ? parseFloat(sareeWeight) : null;
  const weightOk = weightNum !== null && weightNum >= 600;
  const selectedSarees = currentBatch ? currentBatch.sarees.filter(s => selectedSareeNos.has(s.no)) : [];
  const sareeId = selectedSarees[0]?.sareeId ?? "—";

  const loomLabel = selectedLoom ? `${selectedLoom.loomNumber}${selectedLoom.operatorName ? ` · ${selectedLoom.operatorName}` : ""}` : "—";

  const resetEntryFields = () => {
    setSareeColor(""); setSareeWeight(""); setHasPhoto(false); setMatEdits({});
  };

  const pickLoom = (loomId: string) => {
    const l = LOOMS.find(l => l.id === loomId) || null;
    setSelectedLoom(l);
    setSelectedBatchId(l ? (batches[l.id]?.[0]?.id ?? null) : null);
    setSelectedSareeNos(new Set());
    resetEntryFields();
  };

  const pickBatch = (batchId: string) => {
    setSelectedBatchId(batchId);
    setSelectedSareeNos(new Set());
    resetEntryFields();
  };

  const selectSareeSlot = (no: number) => {
    const s = currentBatch?.sarees.find(s => s.no === no);
    if (!s || s.status !== "pending") return;
    setSelectedSareeNos(prev => {
      const next = new Set(prev);
      if (next.has(no)) next.delete(no);
      else next.add(no);
      return next;
    });
    resetEntryFields();
  };

  const toggleAllSarees = () => {
    const pending = currentBatch?.sarees.filter(s => s.status === "pending") ?? [];
    const allSelected = pending.length > 0 && pending.every(s => selectedSareeNos.has(s.no));
    setSelectedSareeNos(allSelected ? new Set() : new Set(pending.map(s => s.no)));
    resetEntryFields();
  };

  const canSaveSaree = selectedSareeNos.size > 0 && !!sareeColor && !!sareeWeight && hasPhoto && !isSaving;

  const saveSaree = async () => {
    if (!selectedLoom || !currentBatch || selectedSareeNos.size === 0 || !canSaveSaree) return;
    setIsSaving(true);
    try {
      const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const auto = autoMaterialSplit(currentBatch.sareeTypeCode, sareeWeight, getSareeTypeByCode);
      const warpG = matEdits.warp !== undefined ? parseFloat(matEdits.warp) : (auto ? parseFloat(auto.warp) : undefined);
      const reshamG = matEdits.resham !== undefined ? parseFloat(matEdits.resham) : (auto ? parseFloat(auto.resham) : undefined);
      const jariReels = matEdits.jari !== undefined ? parseFloat(matEdits.jari) : (auto ? parseFloat(auto.jari) : undefined);

      for (const no of selectedSareeNos) {
        const s = currentBatch.sarees.find(x => x.no === no);
        if (!s) continue;
        await receiveRow(currentBatch.id, no, {
          weight: parseFloat(sareeWeight),
          color: sareeColor,
          photoUrl: photoUrl ?? undefined,
          warpG: Number.isFinite(warpG) ? warpG : undefined,
          reshamG: Number.isFinite(reshamG) ? reshamG : undefined,
          jariReels: Number.isFinite(jariReels) ? jariReels : undefined,
          actorId: user?.id,
        });
        onSareeReceived?.({
          id: s.sareeId, weaver: loomLabel, wcode: "", batch: currentBatch.id,
          weight: `${sareeWeight}g`, date: dateStr,
          color: sareeColor, status: "Pending QC",
          photoUrl, loomNumber: selectedLoom.loomNumber,
          sareeType: currentBatch.sareeTypeCode, bulkOrder: currentBatch.bulkOrderLabel ?? null,
        });
      }
      setSelectedSareeNos(new Set());
      resetEntryFields();
    } finally {
      setIsSaving(false);
    }
  };

  if (showTagPrint) {
    return (
      <TagPreviewScreen
        sareeIds={selectedSarees.length > 0 ? selectedSarees.map(s => s.sareeId) : [sareeId]}
        entityLabel="Loom"
        entityValue={loomLabel}
        onBack={() => setShowTagPrint(false)}
        onPrint={() => { toast.success("Sent to printer"); setShowTagPrint(false); }}
      />
    );
  }

  return (
    <>
      <div style={{ margin: "10px 16px 0" }}>
        <FieldLabel>Select Factory Loom</FieldLabel>
        <Combobox
          size="lg"
          value={selectedLoom?.id ?? ""}
          onValueChange={pickLoom}
          placeholder="Select a loom…"
          searchPlaceholder="Search looms…"
          emptyMessage="No factory looms found"
          options={LOOMS.map(l => ({ value: l.id, label: `${l.loomNumber}${l.operatorName ? ` · ${l.operatorName}` : ""}` }))}
        />
      </div>

      {selectedLoom && loomBatches.length > 0 && (
        <div style={{ margin: "10px 16px 0" }}>
          <FieldLabel>Select Batch</FieldLabel>
          <Select value={selectedBatchId ?? ""} onValueChange={pickBatch} size="lg">
            {loomBatches.map(b => {
              const bDone = b.sarees.filter(s => s.status !== "pending").length;
              return <SelectItem key={b.id} value={b.id}>{b.id} · {bDone}/{b.total} sarees done</SelectItem>;
            })}
          </Select>

          {currentBatch && (
            <div style={{ ...card, padding: "10px 14px", marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{currentBatch.id}</div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 1 }}>
                    {currentBatch.sareeTypeCode}{currentBatch.bulkOrderLabel ? ` · ${currentBatch.bulkOrderLabel}` : ""}
                  </div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 1 }}>{doneCount} of {currentBatch.total} sarees done</div>
                </div>
                <span style={{ fontFamily: F.u, fontSize: 12, color: allDone ? C.gold : C.green, background: allDone ? "rgba(196,146,58,0.12)" : "rgba(30,102,64,0.10)", padding: "2px 7px", borderRadius: 999 }}>
                  {allDone ? "Ready for signature" : "Active"}
                </span>
              </div>
              <div style={{ background: "#F0F0F0", borderRadius: 999, height: 5, overflow: "hidden" }}>
                <div style={{ width: `${(doneCount / currentBatch.total) * 100}%`, height: "100%", background: C.gold, borderRadius: 999 }} />
              </div>
            </div>
          )}
        </div>
      )}

      {selectedLoom && loomBatches.length === 0 && (
        <div style={{ margin: "10px 16px 0", padding: "10px 14px", background: "rgba(110,15,45,0.04)", border: `1px dashed ${C.bdr}`, borderRadius: 10, textAlign: "center" }}>
          <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>No pending sarees for this loom right now.</span>
        </div>
      )}

      {reworkSarees.length > 0 && (
        <div style={{ margin: "10px 16px 0", padding: "10px 14px", background: "rgba(110,15,45,0.05)", border: `1px solid rgba(110,15,45,0.20)`, borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <RotateCcw size={15} color={C.burg} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.burg }}>
              {reworkSarees.length} saree{reworkSarees.length > 1 ? "s" : ""} back for rework
            </div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>
              {reworkSarees.map(s => s.sareeId).join(", ")} {reworkSarees.length > 1 ? "were" : "was"} semi-approved or marked defective at QC and sent back. Receive {reworkSarees.length > 1 ? "them" : "it"} again to send {reworkSarees.length > 1 ? "them" : "it"} back through quality check.
            </div>
          </div>
        </div>
      )}

      {currentBatch && selectedLoom && (
        <SareeSelectionTable
          currentBatch={currentBatch}
          entityName={loomLabel}
          entityAvatar={selectedLoom.avatar}
          columnHeader="Loom / Operator"
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
              Color, weight and photo entered below apply to all {selectedSareeNos.size} selected sarees.
            </div>
          )}

          <div style={{ marginBottom: 10 }}>
            <FieldLabel>Saree Color</FieldLabel>
            <Input value={sareeColor} onChange={e => setSareeColor(e.target.value)} placeholder="e.g. Maroon, Cream Gold"
              className="h-12 text-sm" />
          </div>

          <div className="grid-cols-1 md:grid-cols-2" style={{ display: "grid", gap: 10, marginBottom: 10 }}>
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
            <div>
              <FieldLabel>Photo</FieldLabel>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={e => { void handlePhotoFile(e.target.files?.[0]); e.target.value = ""; }}
                aria-label="Camera photo input"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => { void handlePhotoFile(e.target.files?.[0]); e.target.value = ""; }}
                aria-label="Gallery photo input"
              />
              {!hasPhoto ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Button variant="primary" size="sm" iconLeft={Camera} disabled={photoUploading} onClick={() => cameraInputRef.current?.click()} className="h-11 rounded-[12px] bg-[#6E0F2D] hover:bg-[#4A061B]">
                    {photoUploading ? "Uploading…" : "Camera"}
                  </Button>
                  <Button variant="secondary" size="sm" iconLeft={UploadCloud} disabled={photoUploading} onClick={() => galleryInputRef.current?.click()} className="h-11 rounded-[12px] border-[#6E0F2D] text-[#6E0F2D]">
                    Gallery
                  </Button>
                  {photoError && <span style={{ fontSize: 11, color: "#C0392B" }}>{photoError}</span>}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 82, backgroundImage: `url(${resolveAssetUrl(photoUrl)})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 8, border: `1px solid ${C.bdr}`, position: "relative" }}>
                  <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, background: C.green, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={10} color="#FFF" />
                  </div>
                  <Button variant="link" onClick={() => setHasPhoto(false)} className="absolute bottom-[3px] right-[5px] p-0 text-xs text-white bg-black/40 rounded px-1">Retake</Button>
                </div>
              )}
            </div>
          </div>

          <MaterialSplitPanel
            typeCode={currentBatch.sareeTypeCode}
            weight={sareeWeight}
            edits={matEdits}
            onEdit={setMatEdits}
          />

          {sareeColor && sareeWeight && hasPhoto && (
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
            <Button variant="secondary" fullWidth size="sm" iconLeft={Printer} onClick={() => setShowTagPrint(true)}
              disabled={!sareeColor || !sareeWeight || !hasPhoto}
              className="h-11 rounded-full border-[rgba(200,155,71,0.55)] text-[#845E04]">
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
          <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Tap one or more pending sarees above (or Select All) to record color, weight and photo.</span>
        </div>
      )}

      {showDefectPrompt && (
        <DefectPhotoPrompt
          onCancel={() => setShowDefectPrompt(false)}
          onCapture={() => {
            if (selectedLoom && currentBatch && selectedSareeNos.size > 0) {
              const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
              selectedSarees.forEach(s => {
                setRejectedSarees(prev => [
                  {
                    id: s.sareeId,
                    weaver: loomLabel,
                    weight: sareeWeight ? `${sareeWeight}g` : "—",
                    date: dateStr,
                    photoUrl: "captured-defect-photo",
                  },
                  ...prev,
                ]);
                onSareeReceived?.({
                  id: s.sareeId, weaver: loomLabel, wcode: "", batch: currentBatch.id,
                  weight: sareeWeight ? `${sareeWeight}g` : "—", date: dateStr,
                  color: sareeColor || "—", status: "Defective",
                  photoUrl, loomNumber: selectedLoom.loomNumber,
                  sareeType: currentBatch.sareeTypeCode, bulkOrder: currentBatch.bulkOrderLabel ?? null,
                });
              });
            }
            setShowDefectPrompt(false);
            setSelectedSareeNos(new Set());
            resetEntryFields();
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
          <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.green }}>All {currentBatch.total} sarees recorded. Collect operator signature to complete the batch.</span>
        </div>
      )}

      {currentBatch && allDone && (
        <>
          <WeaverSigBlock
            weaverName={selectedLoom?.operatorName || "Loom Operator"}
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
                    <span style={{ fontFamily: F.u, fontSize: 12, color: C.crim }}>Operator signature required to complete batch</span>
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
  );
}
