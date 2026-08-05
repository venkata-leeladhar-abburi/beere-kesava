import React, { useState } from "react";
import {
  ChevronRight, Camera, UploadCloud, CheckCircle2, AlertTriangle,
  Plus, Printer,
} from "lucide-react";
import { C, F, card, inputStyle, btnPrimary } from "../tokens";
import { FieldLabel, PageHeader, type ReceivedSareeLog } from "./shared";
import { MaterialSplitPanel, autoMaterialSplit, type MatSplit } from "./MaterialSplitPanel";
import { WEAVERS, WEAVER_BATCHES, type WeaverBatchData } from "./weaversData";
import { WeaverSigBlock } from "./WeaverSigBlock";
import { DefectPhotoPrompt } from "./DefectPhotoPrompt";
import { OwnFactoryReceiveTab } from "./OwnFactoryReceiveTab";
import { SareeSelectionTable } from "./SareeSelectionTable";

interface RejectedSaree {
  id: string;
  weaver: string;
  weight: string;
  date: string;
  photoUrl: string;
}

export function ReceiveSareesPage({ onBack, onSareeReceived }: { onBack: () => void; onSareeReceived?: (rec: ReceivedSareeLog) => void }) {
  const [activeSection, setActiveSection] = useState<"outsourced" | "own">("outsourced");
  const [selectedWeaver, setSelectedWeaver] = useState<typeof WEAVERS[0] | null>(WEAVERS[0]);
  const [batches, setBatches] = useState<Record<string, WeaverBatchData[]>>(() => JSON.parse(JSON.stringify(WEAVER_BATCHES)));
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(WEAVER_BATCHES[WEAVERS[0].code]?.[0]?.id ?? null);
  const [selectedSareeNo, setSelectedSareeNo] = useState<number | null>(null);
  const [sareeSort, setSareeSort] = useState<"serial" | "status">("serial");
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
  const sareeId = selectedWeaver && currentBatch && selectedSareeNo
    ? `${selectedWeaver.name.split(" ")[0].toUpperCase()}-L${selectedWeaver.looms}-00${selectedSareeNo}` : "—";

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

  const canSaveSaree = !!sareeColor && !!sareeWeight && hasPhoto;

  const saveSaree = () => {
    if (!selectedWeaver || !currentBatch || !selectedSareeNo || !canSaveSaree) return;
    setBatches(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as Record<string, WeaverBatchData[]>;
      const b = next[selectedWeaver.code].find(b => b.id === currentBatch.id)!;
      const s = b.sarees.find(s => s.no === selectedSareeNo)!;
      s.status = "received"; s.color = sareeColor; s.weight = sareeWeight;
      const split = autoMaterialSplit(currentBatch.sareeTypeCode, sareeWeight);
      if (split) {
        s.warp = matEdits.warp ?? split.warp;
        s.resham = matEdits.resham ?? split.resham;
        s.jari = matEdits.jari ?? split.jari;
      }
      return next;
    });
    onSareeReceived?.({
      id: sareeId, weaver: selectedWeaver.name, wcode: selectedWeaver.code, batch: currentBatch.id,
      weight: `${sareeWeight}g`, date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      color: sareeColor, status: "Pending QC",
    });
    setSelectedSareeNo(null); setSareeColor(""); setSareeWeight(""); setHasPhoto(false); setMatEdits({});
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
              <input type="number" defaultValue={1} style={{ ...inputStyle, width: 65, height: 38, textAlign: "center", fontFamily: F.m }} />
            </div>
            <button style={{ ...btnPrimary, height: 50, gap: 7, marginBottom: 10 }}><Printer size={16} /> Print Now</button>
            <button onClick={() => setShowTagPrint(false)} style={{ display: "block", width: "100%", background: "none", border: "none", fontFamily: F.u, fontSize: 13, color: C.muted, cursor: "pointer", padding: 10 }}>Skip Printing</button>
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
            <button key={key} onClick={() => setActiveSection(key as "outsourced" | "own")}
              style={{ flex: 1, padding: "9px 8px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: F.u, fontSize: 12, fontWeight: 600, background: activeSection === key ? C.burg : "transparent", color: activeSection === key ? "#FFF" : C.muted }}>
              {label}
            </button>
          ))}
        </div>

        {activeSection === "outsourced" && (
          <>
            <div style={{ margin: "10px 16px 0" }}>
              <FieldLabel>Select Weaver</FieldLabel>
              <div style={{ position: "relative" }}>
                <select value={selectedWeaver?.name ?? ""} style={{ ...inputStyle, appearance: "none", cursor: "pointer", height: 46 }} onChange={e => pickWeaver(e.target.value)}>
                  {WEAVERS.map(w => <option key={w.code}>{w.name}</option>)}
                </select>
                <ChevronRight size={14} color={C.muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%) rotate(90deg)", pointerEvents: "none" }} />
              </div>
            </div>

            {selectedWeaver && weaverBatches.length > 0 && (
              <div style={{ margin: "10px 16px 0" }}>
                <FieldLabel>Select Batch</FieldLabel>
                <div style={{ position: "relative" }}>
                  <select value={selectedBatchId ?? ""} onChange={e => pickBatch(e.target.value)}
                    style={{ ...inputStyle, appearance: "none", cursor: "pointer", height: 46 }}>
                    {weaverBatches.map(b => {
                      const bDone = b.sarees.filter(s => s.status !== "pending").length;
                      return <option key={b.id} value={b.id}>{b.id} · {bDone}/{b.total} sarees done</option>;
                    })}
                  </select>
                  <ChevronRight size={14} color={C.muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%) rotate(90deg)", pointerEvents: "none" }} />
                </div>

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
                  <input value={sareeColor} onChange={e => setSareeColor(e.target.value)} placeholder="e.g. Maroon, Cream Gold"
                    style={{ ...inputStyle, height: 44, fontSize: 14 }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <FieldLabel>Weight (grams)</FieldLabel>
                    <div style={{ position: "relative" }}>
                      <input type="number" value={sareeWeight} onChange={e => setSareeWeight(e.target.value)} placeholder="0"
                        style={{ ...inputStyle, height: 52, fontFamily: F.m, fontSize: 18, paddingRight: 10 }} />
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
                        <button onClick={() => setHasPhoto(true)} style={{ height: 38, background: C.burg, border: "none", borderRadius: 8, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <Camera size={12} /> Camera
                        </button>
                        <button onClick={() => setHasPhoto(true)} style={{ height: 38, background: "#FFF", border: `1px solid ${C.burg}`, borderRadius: 8, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <UploadCloud size={12} /> Gallery
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 82, background: "linear-gradient(135deg,#F0E8D0,#C4923A)", borderRadius: 8, border: `1px solid ${C.bdr}`, position: "relative" }}>
                        <Camera size={20} color="rgba(255,255,255,0.85)" />
                        <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, background: C.green, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CheckCircle2 size={10} color="#FFF" />
                        </div>
                        <button onClick={() => setHasPhoto(false)} style={{ position: "absolute", bottom: 3, right: 5, background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: "rgba(0,0,0,0.5)", cursor: "pointer" }}>Retake</button>
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
                  <button onClick={() => setShowTagPrint(true)} style={{ flex: 1, height: 42, background: "#FFF", border: `1px solid ${C.gold}`, borderRadius: 999, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <Printer size={12} /> Print Tag
                  </button>
                  <button onClick={saveSaree} disabled={!canSaveSaree}
                    style={{ flex: 1, height: 42, background: canSaveSaree ? "#FFF" : "#F5F0EC", border: `1px solid ${canSaveSaree ? C.burg : C.bdr}`, borderRadius: 999, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: canSaveSaree ? C.burg : C.muted, cursor: canSaveSaree ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <Plus size={12} /> Next Saree
                  </button>
                </div>
                <button onClick={() => setShowDefectPrompt(true)}
                  style={{ width: "100%", height: 38, background: "rgba(220,53,69,0.06)", border: `1px solid rgba(220,53,69,0.25)`, borderRadius: 999, fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.crim, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <AlertTriangle size={12} /> Mark as Defective
                </button>
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
                    setBatches(prev => {
                      const next = JSON.parse(JSON.stringify(prev)) as Record<string, WeaverBatchData[]>;
                      const b = next[selectedWeaver.code].find(b => b.id === currentBatch.id)!;
                      const s = b.sarees.find(s => s.no === selectedSareeNo)!;
                      s.status = "defective"; s.color = sareeColor || undefined; s.weight = sareeWeight || undefined;
                      return next;
                    });
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
                      <button
                        disabled={!sigOk}
                        style={{ ...btnPrimary, height: 50, gap: 7, background: sigOk ? C.green : "#E0D5CC", color: sigOk ? "#FFF" : C.muted, cursor: sigOk ? "pointer" : "not-allowed" }}>
                        <CheckCircle2 size={16} /> Mark Batch Complete
                      </button>
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
