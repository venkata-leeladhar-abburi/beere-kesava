import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Camera, UploadCloud, CheckCircle2, AlertTriangle,
  Plus, Printer,
} from "lucide-react";
import { C, F, card } from "../tokens";
import { FieldLabel, PageHeader, type ReceivedSareeLog } from "./shared";
import { MaterialSplitPanel, type MatSplit } from "./MaterialSplitPanel";
import { type WeaverBatchData } from "./weaversData";
import { weaversApi } from "../../../../../shared/api/weavers";
import { WeaverSigBlock } from "./WeaverSigBlock";
import { useRatesPricing } from "../../../../pricing/contexts/RatesContext";
import { useBatches } from "../../../../production/contexts/BatchContext";
import { DefectPhotoPrompt } from "./DefectPhotoPrompt";
import { OwnFactoryReceiveTab } from "./OwnFactoryReceiveTab";
import { SareeSelectionTable } from "./SareeSelectionTable";
import { Button, Input, Select, SelectItem } from "../../../../../shared/ui/primitives";

interface RejectedSaree {
  id: string;
  weaver: string;
  weight: string;
  date: string;
  photoUrl: string;
}

export function ReceiveSareesPage({ onBack, onSareeReceived }: { onBack: () => void; onSareeReceived?: (rec: ReceivedSareeLog) => void }) {
  const { getSareeTypeByCode } = useRatesPricing();
  const { data: weaversRes } = useQuery({
    queryKey: ["worker-receive-weavers"],
    queryFn: () => weaversApi.list(),
  });
  const WEAVERS = useMemo(() => {
    if (!weaversRes?.items) return [];
    return weaversRes.items.map(w => ({
      name: w.name,
      code: w.id,
      looms: w.looms,
      avatar: w.initials || `${w.firstName.charAt(0)}${w.lastName.charAt(0)}`,
    }));
  }, [weaversRes]);

  const { batches: allBatches, receiveRow } = useBatches();

  const [activeSection, setActiveSection] = useState<"outsourced" | "own">("outsourced");
  const [selectedWeaver, setSelectedWeaver] = useState<typeof WEAVERS[0] | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedSareeNo, setSelectedSareeNo] = useState<number | null>(null);
  const [sareeSort, setSareeSort] = useState<"serial" | "status">("serial");
  const [isSaving, setIsSaving] = useState(false);

  // Default to the first weaver once the real list loads.
  useEffect(() => {
    if (!selectedWeaver && WEAVERS.length > 0) setSelectedWeaver(WEAVERS[0]);
  }, [WEAVERS, selectedWeaver]);

  // Real per-weaver batches, built from active batches' rows that have
  // already been assigned a sareeId (by admin) but not yet received.
  // Only rows still pending receipt are shown — once received, a saree
  // moves into the QC queue instead of staying in this list.
  const batches = useMemo<Record<string, WeaverBatchData[]>>(() => {
    const result: Record<string, WeaverBatchData[]> = {};
    for (const b of allBatches) {
      if (b.status !== "active") continue;
      for (const r of b.rows) {
        if (!r.weaverId || !r.sareeId || r.receivedAt) continue;
        if (!result[r.weaverId]) result[r.weaverId] = [];
        let wb = result[r.weaverId].find(x => x.id === b.batchId);
        if (!wb) {
          wb = { id: b.batchId, total: 0, sareeTypeCode: r.sareeTypeCode ?? "—", bulkOrderLabel: r.bulkOrderLabel ?? undefined, sarees: [] };
          result[r.weaverId].push(wb);
        }
        wb.sarees.push({ no: r.serial, sareeId: r.sareeId, serial: r.serial, status: "pending" });
        wb.total += 1;
      }
    }
    return result;
  }, [allBatches]);

  const [sareeColor, setSareeColor] = useState("");
  const [sareeWeight, setSareeWeight] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [matEdits, setMatEdits] = useState<Partial<MatSplit>>({});
  const [showTagPrint, setShowTagPrint] = useState(false);
  const [rejectedSarees, setRejectedSarees] = useState<RejectedSaree[]>([]);
  const [showDefectPrompt, setShowDefectPrompt] = useState(false);
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [signed, setSigned] = useState(false);
  const [remoteSent, setRemoteSent] = useState(false);
  const [remoteConfirmed, setRemoteConfirmed] = useState(false);

  const weaverBatches = selectedWeaver ? (batches[selectedWeaver.code] ?? []) : [];
  const currentBatch = weaverBatches.find(b => b.id === selectedBatchId) ?? weaverBatches[0] ?? null;
  const doneCount = currentBatch ? currentBatch.sarees.filter(s => s.status !== "pending").length : 0;
  const allDone = currentBatch ? doneCount === currentBatch.total : false;

  const weightNum = sareeWeight ? parseFloat(sareeWeight) : null;
  const weightOk = weightNum !== null && weightNum >= 600;
  const selectedSaree = currentBatch?.sarees.find(s => s.no === selectedSareeNo) ?? null;
  const sareeId = selectedSaree?.sareeId ?? "—";

  const pickWeaver = (name: string) => {
    const w = WEAVERS.find(w => w.name === name) || null;
    setSelectedWeaver(w);
    setSelectedBatchId(w ? (batches[w.code]?.[0]?.id ?? null) : null);
    setSelectedSareeNo(null);
    setSareeColor(""); setSareeWeight(""); setHasPhoto(false); setMatEdits({});
  };

  const pickBatch = (batchId: string) => {
    setSelectedBatchId(batchId);
    setSelectedSareeNo(null);
    setSareeColor(""); setSareeWeight(""); setHasPhoto(false); setMatEdits({});
  };

  const selectSareeSlot = (no: number) => {
    const s = currentBatch?.sarees.find(s => s.no === no);
    if (!s || s.status !== "pending") return;
    setSelectedSareeNo(prev => prev === no ? null : no);
    setSareeColor(""); setSareeWeight(""); setHasPhoto(false); setMatEdits({});
  };

  const canSaveSaree = !!sareeColor && !!sareeWeight && hasPhoto && !isSaving;

  const saveSaree = async () => {
    if (!selectedWeaver || !currentBatch || !selectedSareeNo || !canSaveSaree) return;
    setIsSaving(true);
    try {
      await receiveRow(currentBatch.id, selectedSareeNo, {
        weight: parseFloat(sareeWeight),
        color: sareeColor,
      });
      onSareeReceived?.({
        id: sareeId, weaver: selectedWeaver.name, wcode: selectedWeaver.code, batch: currentBatch.id,
        weight: `${sareeWeight}g`, date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        color: sareeColor, status: "Pending QC",
      });
      setSelectedSareeNo(null); setSareeColor(""); setSareeWeight(""); setHasPhoto(false); setMatEdits({});
    } finally {
      setIsSaving(false);
    }
  };

  if (showTagPrint) {
    return (
      <>
        <PageHeader title="Tag Preview" onBack={() => setShowTagPrint(false)} />
        <div style={{ paddingBottom: 28 }}>
          <div style={{ margin: "14px 16px", border: `1px solid rgba(139,26,46,0.20)`, borderRadius: 12, padding: 16, background: "#FFF" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 8 }}>Beere Kesava & Brothers Silks · Est. 1999</div>
            <div style={{ background: "#000", height: 36, borderRadius: 4, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: F.m, fontSize: 7, color: "#FFF", letterSpacing: 3 }}>||| | || ||| || |</span>
            </div>
            <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, textAlign: "center", color: C.text, marginBottom: 10 }}>{sareeId}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div><span style={{ fontFamily: F.u, fontSize: 12, color: C.gold }}>Weaver: </span><span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>{selectedWeaver?.name}</span></div>
              <div><span style={{ fontFamily: F.u, fontSize: 12, color: C.gold }}>Date: </span><span style={{ fontFamily: F.u, fontSize: 12, color: C.text }}>13 Jun 2026</span></div>
            </div>
          </div>
          <div style={{ padding: "0 16px" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 8 }}>Printer: TSC TE244 &nbsp;🔒</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>Copies:</span>
              <Input type="number" defaultValue={1} className="w-[65px] h-[38px] text-center font-mono" />
            </div>
            <Button variant="primary" fullWidth iconLeft={Printer} className="h-[50px] rounded-full bg-[#6B1A2A] hover:bg-[#6B1A2A] mb-2.5">Print Now</Button>
            <Button variant="link" fullWidth onClick={() => setShowTagPrint(false)} className="text-[13px] text-[#69635E] p-2.5">Skip Printing</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ paddingBottom: 28 }}>
        <div style={{ display: "flex", margin: "12px 16px 4px", background: "#F5F0F2", borderRadius: 10, padding: 3 }}>
          {[["outsourced", "Outsourced"], ["own", "Own Factory"]].map(([key, label]) => (
            <Button key={key} variant={activeSection === key ? "primary" : "tertiary"} fullWidth
              onClick={() => setActiveSection(key as "outsourced" | "own")}
              className={activeSection === key ? "rounded-lg bg-[#6B1A2A] hover:bg-[#6B1A2A]" : "rounded-lg"}>
              {label}
            </Button>
          ))}
        </div>

        {activeSection === "outsourced" && (
          <>
            <div style={{ margin: "10px 16px 0" }}>
              <FieldLabel>Select Weaver</FieldLabel>
              <Select value={selectedWeaver?.name ?? ""} onValueChange={pickWeaver} size="lg">
                {WEAVERS.map(w => <SelectItem key={w.code} value={w.name}>{w.name}</SelectItem>)}
              </Select>
            </div>

            {selectedWeaver && weaverBatches.length > 0 && (
              <div style={{ margin: "10px 16px 0" }}>
                <FieldLabel>Select Batch</FieldLabel>
                <Select value={selectedBatchId ?? ""} onValueChange={pickBatch} size="lg">
                  {weaverBatches.map(b => {
                    const bDone = b.sarees.filter(s => s.status !== "pending").length;
                    return <SelectItem key={b.id} value={b.id}>{b.id} · {bDone}/{b.total} sarees done</SelectItem>;
                  })}
                </Select>

                {currentBatch && (
                  <div style={{ ...card, padding: "10px 14px", marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{currentBatch.id}</div>
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

            {currentBatch && selectedWeaver && (
              <SareeSelectionTable
                currentBatch={currentBatch}
                selectedWeaver={selectedWeaver}
                doneCount={doneCount}
                sareeSort={sareeSort}
                setSareeSort={setSareeSort}
                selectedSareeNo={selectedSareeNo}
                selectSareeSlot={selectSareeSlot}
              />
            )}

            {selectedSareeNo && currentBatch && (
              <div style={{ ...card, margin: "10px 16px 10px", padding: 14 }}>
                <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
                  Saree #{selectedSareeNo} — {currentBatch.id}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <FieldLabel>Saree Color</FieldLabel>
                  <Input value={sareeColor} onChange={e => setSareeColor(e.target.value)} placeholder="e.g. Maroon, Cream Gold"
                    className="h-11 text-sm" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <FieldLabel>Weight (grams)</FieldLabel>
                    <div style={{ position: "relative" }}>
                      <Input type="number" value={sareeWeight} onChange={e => setSareeWeight(e.target.value)} placeholder="0"
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
                    {!hasPhoto ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <Button variant="primary" size="sm" iconLeft={Camera} onClick={() => setHasPhoto(true)} className="h-[38px] rounded-lg bg-[#6B1A2A] hover:bg-[#6B1A2A]">
                          Camera
                        </Button>
                        <Button variant="secondary" size="sm" iconLeft={UploadCloud} onClick={() => setHasPhoto(true)} className="h-[38px] rounded-lg border-[#6B1A2A] text-[#6B1A2A]">
                          Gallery
                        </Button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 82, background: "linear-gradient(135deg,#F0E8D0,#C4923A)", borderRadius: 8, border: `1px solid ${C.bdr}`, position: "relative" }}>
                        <Camera size={20} color="rgba(255,255,255,0.85)" />
                        <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, background: C.green, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CheckCircle2 size={10} color="#FFF" />
                        </div>
                        <Button variant="link" onClick={() => setHasPhoto(false)} className="absolute bottom-[3px] right-[5px] p-0 text-xs text-black/50">Retake</Button>
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
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 2 }}>Saree ID</div>
                    <div style={{ fontFamily: F.m, fontSize: 16, fontWeight: 600, color: C.burg }}>{sareeId}</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <Button variant="secondary" fullWidth size="sm" iconLeft={Printer} onClick={() => setShowTagPrint(true)} className="h-[42px] rounded-full border-[#C4923A] text-[#C4923A]">
                    Print Tag
                  </Button>
                  <Button variant="secondary" fullWidth size="sm" iconLeft={Plus} onClick={saveSaree} disabled={!canSaveSaree}
                    className="h-[42px] rounded-full border-[#6B1A2A] text-[#6B1A2A]">
                    Next Saree
                  </Button>
                </div>
                <Button variant="secondary" fullWidth size="sm" iconLeft={AlertTriangle} onClick={() => setShowDefectPrompt(true)}
                  className="h-[38px] rounded-full border-[rgba(220,53,69,0.25)] bg-[rgba(220,53,69,0.06)] text-[#C0392B] hover:bg-[rgba(220,53,69,0.06)]">
                  Mark as Defective
                </Button>
              </div>
            )}

            {currentBatch && !selectedSareeNo && !allDone && (
              <div style={{ margin: "10px 16px 0", padding: "10px 14px", background: "rgba(107,26,42,0.04)", border: `1px dashed ${C.bdr}`, borderRadius: 10, textAlign: "center" }}>
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Tap a pending saree above to record its color, weight and photo.</span>
              </div>
            )}

            {showDefectPrompt && (
              <DefectPhotoPrompt
                onCancel={() => setShowDefectPrompt(false)}
                onCapture={() => {
                  if (selectedWeaver && currentBatch && selectedSareeNo) {
                    setRejectedSarees(prev => [
                      {
                        id: sareeId,
                        weaver: selectedWeaver.name,
                        weight: sareeWeight ? `${sareeWeight}g` : "—",
                        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                        photoUrl: "captured-defect-photo",
                      },
                      ...prev,
                    ]);
                    onSareeReceived?.({
                      id: sareeId, weaver: selectedWeaver.name, wcode: selectedWeaver.code, batch: currentBatch.id,
                      weight: sareeWeight ? `${sareeWeight}g` : "—", date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                      color: sareeColor || "—", status: "Defective",
                    });
                  }
                  setShowDefectPrompt(false);
                  setSelectedSareeNo(null);
                  setSareeColor(""); setSareeWeight(""); setHasPhoto(false); setMatEdits({});
                }}
              />
            )}

            {rejectedSarees.length > 0 && (
              <div style={{ margin: "0 16px 10px" }}>
                <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.crim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  Rejected at Receipt ({rejectedSarees.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {rejectedSarees.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(220,53,69,0.04)", border: "1px solid rgba(220,53,69,0.18)", borderRadius: 10, padding: "8px 10px" }}>
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
                        className={`h-[50px] rounded-full ${sigOk ? "bg-[#1E6640] hover:bg-[#1E6640]" : ""}`}>
                        Mark Batch Complete
                      </Button>
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}

        {activeSection === "own" && <OwnFactoryReceiveTab />}
      </div>
    </>
  );
}
