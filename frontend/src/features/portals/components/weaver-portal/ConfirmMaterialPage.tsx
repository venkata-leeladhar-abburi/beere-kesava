import { materialTypeIcon } from "./MyBatchesPage";

import React, { useState, useMemo } from "react";
import { useResponsive } from "../../../../hooks/useResponsive";
import { useBatches } from "@/features/production";
import { useDesignLibrary, DesignEntry } from "@/features/design-library";
import { DesignCodeCard } from "@/features/design-library";
import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS, materialItemToGrams, REELS_PER_BUN } from "@/features/materials";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell, Check,
} from "lucide-react";

import {
  C, F, SectionTitle, Card, SignatureCanvas, MaterialHistoryCard, HeroHeader, DesignCodeTileGrid
} from './theme';
import { useCurrentWeaver } from "./useCurrentWeaver";
import { ReferenceHistorySection } from "./ReferenceHistorySection";
import { Button } from "../../../../shared/ui/primitives";

export function ConfirmMaterialPage({ onGoToBatches }: { onGoToBatches?: () => void } = {}) {
  const { isMobile, isTablet, cols } = useResponsive();
  const { getRecordsForWeaver, updateSignatureStatus, getMaterialSummaryForWeaver, getMaterialSummaryByBatch } = useMaterialIssue();
  const { batches } = useBatches();
  const { getDesign } = useDesignLibrary();
  const { weaverId, isLoading: weaverLoading, isError: weaverError } = useCurrentWeaver();

  const matSummary = getMaterialSummaryForWeaver(weaverId ?? "");
  const matByBatch = weaverId ? getMaterialSummaryByBatch(weaverId) : [];

  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [hasSig, setHasSig] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedRecord, setConfirmedRecord] = useState<MaterialIssueRecord | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);

  const weaverRecords = weaverId ? getRecordsForWeaver(weaverId) : [];
  const pendingRecords = weaverRecords.filter(r => r.status === "pending-signature");
  const signedRecords = weaverRecords.filter(r => r.status === "signed");
  const pending = pendingRecords[0] ?? null;

  const mySarees = useMemo(() => {
    return batches
      .filter(b => b.status !== "draft")
      .flatMap(b =>
      b.rows
        .filter(r => r.weaverId === weaverId)
        .map(r => ({
          batchId: b.batchId,
          sareeId: r.sareeId || "Pending Setup",
          designCode: r.designCode || "—",
          sareeTypeCode: r.sareeTypeCode || "—",
          sareeTypeName: r.sareeTypeName || "—",
          loom: r.weaverLoom || "—",
          qcPassed: r.qcPassed
        }))
    );
  }, [batches, weaverId]);

  const myWeavingBatches = useMemo(() => {
    return batches
      .filter(b => b.status !== "draft")
      .map(b => {
        const rows = b.rows.filter(r => r.weaverId === weaverId);
        return {
          batchId: b.batchId,
          status: b.status,
          dueDate: b.dueDate,
          rowsCount: rows.length,
          passedCount: rows.filter(r => r.qcPassed === true).length
        };
      })
      .filter(b => b.rowsCount > 0);
  }, [batches, weaverId]);

  const myDesignCodes = Array.from(new Set(
    batches
      .filter(b => b.status === "active")
      .flatMap(b => b.rows)
      .filter(r => r.weaverId === weaverId)
      .map(r => r.designCode)
      .filter((c): c is string => Boolean(c))
  ));

  const canConfirm = (sigMethod === "here" && hasSig) || (sigMethod === "remote" && requestSent);

  const handleConfirm = () => {
    if (!pending || !canConfirm) return;
    updateSignatureStatus(pending.id, sigMethod === "remote" ? "remote" : "here");
    setConfirmedRecord(pending);
    setConfirmed(true);
  };

  const resetToPending = () => {
    setConfirmed(false); setConfirmedRecord(null);
    setSigMethod("none"); setHasSig(false); setRequestSent(false);
  };

  if (weaverLoading) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · MATERIAL RECEIPT" title="Confirm Materials" sub="Sign to confirm receipt" />
        <div style={{ margin: "40px 20px", textAlign: "center" as const, fontFamily: F.u, fontSize: 14, color: C.muted }}>Loading your material receipts…</div>
      </div>
    );
  }

  if (weaverError || !weaverId) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · MATERIAL RECEIPT" title="Confirm Materials" sub="Sign to confirm receipt" />
        <div style={{ margin: "40px 20px", background: C.cream, borderRadius: 14, padding: "28px 20px", textAlign: "center" as const }}>
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, fontWeight: 600 }}>Couldn't find your weaver profile</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 4 }}>Your login isn't linked to a weaver record yet. Contact your supervisor.</div>
        </div>
      </div>
    );
  }

  if (confirmed && confirmedRecord) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check size={36} color={C.green} />
        </div>
        <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 12 }}>Materials Confirmed!</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>You have confirmed receipt of all materials in {confirmedRecord.id}. Good luck with your weaving!</div>
        <div style={{ display: "inline-block", background: "rgba(110,15,45,0.08)", color: C.burg, borderRadius: 999, padding: "6px 16px", fontFamily: F.m, fontSize: 14, marginBottom: 28 }}>{confirmedRecord.id}</div>
        <Button onClick={resetToPending} fullWidth className="block h-[52px] bg-[#6E0F2D] border-none rounded-full font-semibold text-base text-white mb-2.5">
          View More Pending Receipts
        </Button>
        <Button onClick={onGoToBatches} fullWidth className="block h-12 bg-transparent border border-[rgba(110,15,45,0.10)] rounded-full font-semibold text-sm text-[#69635E]">
          ← Go to My Batches
        </Button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · MATERIAL RECEIPT" title="Confirm Materials" sub="Sign to confirm receipt" />

      {pending ? (
        <>
          {/* Alert card */}
          <div style={{ margin: "16px 20px", background: "rgba(200,155,71,0.15)", border: `2px solid ${C.gold}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Bell size={24} color={C.gold} />
              <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>Material Handover Pending Confirmation</span>
            </div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
              Your materials have been issued. Please review the list below and sign to confirm receipt.
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontFamily: F.m, fontSize: 14, color: C.burg }}>{pending.id}</span>
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Issued {new Date(pending.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          </div>

          {/* Materials List */}
          <SectionTitle title="Materials You Are Receiving" />
          <div style={{ display: "grid", gridTemplateColumns: cols(1, 2, 2), gap: 10, margin: "0 20px 10px" }}>
            {pending.materials.map((m, i) => (
              // eslint-disable-next-line react/no-array-index-key -- material lines have no stable id and materialType can repeat, so pair it with index.
              <div key={`${m.materialType}-${i}`} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, justifyContent: "center" }}>
                  {materialTypeIcon(m.materialType)}
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>
                    {m.materialType}{m.materialType === "Warp" && m.warpSubtype ? ` — ${m.warpSubtype}` : ""}
                  </span>
                </div>
                <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold, textAlign: "center" as const, marginBottom: 4 }}>
                  {m.quantity} {m.unit}{m.materialType === "Jari" ? ` (${m.jariType} · ${m.jariGrade} · ${m.jariColor})` : ""}
                </div>
                {m.description && <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" as const, marginBottom: 4 }}>{m.description}</div>}
                <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, textAlign: "center" as const }}>From batch: {m.grnBatchId}</div>
              </div>
            ))}
          </div>

          {/* Design Codes */}
          <SectionTitle title="Your Design Instructions" />
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, margin: "-4px 20px 12px" }}>
            Tap a design code to view full weaving instructions.
          </div>
          {myDesignCodes.length === 0 ? (
            <div style={{ margin: "0 20px 16px", background: C.cream, borderRadius: 12, padding: "18px 16px", textAlign: "center" as const }}>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Design codes will appear here once assigned by Admin.</div>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <DesignCodeTileGrid codes={myDesignCodes} onOpen={code => { const d = getDesign(code); if (d) setViewDesign(d); }} />
            </div>
          )}
          <AnimatePresence>
            {viewDesign && <DesignCodeCard design={viewDesign} onClose={() => setViewDesign(null)} />}
          </AnimatePresence>

          {/* Signature Section */}
          <SectionTitle title="Your Signature" />
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, margin: "-4px 20px 14px", lineHeight: 1.5 }}>
            Sign below to confirm you have received all materials listed above. This creates a permanent record.
          </div>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" as const : "row" as const, gap: 12, margin: "0 20px 10px" }}>
            <div style={{ flex: 1 }}>
              <Button
                onClick={() => setSigMethod(sigMethod === "here" ? "none" : "here")}
                variant="ghost"
                fullWidth
                className={
                  "h-auto bg-white rounded-xl p-4 text-left justify-start block " +
                  (sigMethod === "here" ? "border border-[#6E0F2D]" : "border border-[rgba(110,15,45,0.10)]")
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📱</span>
                  <div>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Sign here on this phone</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>If the worker is with you, sign directly below</div>
                  </div>
                </div>
              </Button>
            </div>

            <div style={{ flex: 1 }}>
              <Button
                onClick={() => setSigMethod(sigMethod === "remote" ? "none" : "remote")}
                variant="ghost"
                fullWidth
                className={
                  "h-auto bg-white rounded-xl p-4 text-left justify-start block " +
                  (sigMethod === "remote" ? "border border-[#6E0F2D] mb-2.5" : "border border-[rgba(110,15,45,0.10)]")
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📲</span>
                  <div>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Sign on your own phone</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>Worker will send you a notification to sign on your own device</div>
                  </div>
                </div>
              </Button>
              <AnimatePresence>
                {sigMethod === "remote" && (
                  <motion.div key="remote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {requestSent ? (
                      <div style={{ background: "rgba(30,102,64,0.08)", border: `1px solid ${C.green}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <Check size={16} color={C.green} />
                        <span style={{ fontFamily: F.u, fontSize: 14, color: C.green }}>Signature request sent to your phone!</span>
                      </div>
                    ) : (
                      <Button onClick={() => setRequestSent(true)} fullWidth className="h-12 border border-[#C89B47] bg-transparent rounded-full font-semibold text-sm text-[#C89B47]">
                        Send Signature Request
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {sigMethod === "here" && (
              <motion.div key="sigbox" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ padding: "0 0 16px 0", margin: isMobile ? "0" : "0 auto", maxWidth: isMobile ? undefined : isTablet ? "100%" : "560px", ...(isMobile ? {} : { paddingLeft: 20, paddingRight: 20 }) }}>
                  <SignatureCanvas onSigned={setHasSig} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ margin: "0 20px" }}>
            <div style={{ background: C.cream, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>By signing and confirming, you agree that you have received all the materials listed above. This record is permanent.</span>
            </div>
            <Button
              onClick={handleConfirm}
              fullWidth
              className={
                "h-14 border-none rounded-full font-semibold text-base text-white " +
                (canConfirm ? "bg-[#1E6640] hover:bg-[#1E6640]" : "bg-[#C0C0C0]")
              }
            >
              <Check size={20} /> Confirm Material Receipt
            </Button>
          </div>
        </>
      ) : (
        <div style={{ margin: 20 }}>
          <Card style={{ padding: 32, textAlign: "center" as const }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check size={28} color={C.green} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 10 }}>No pending material receipt</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>All material receipts are confirmed. Nothing pending.</div>
            <Button onClick={onGoToBatches} fullWidth className="h-12 bg-[#6E0F2D] border-none rounded-full font-semibold text-sm text-white">Go to My Batches</Button>
          </Card>
        </div>
      )}

      {/* Outstanding Material */}
      {matByBatch.length > 0 && (() => {
        const fmtKg = (g: number) => `${(g / 1000).toFixed(2)} kg`;
        const outColor = matSummary.outstandingGrams > 0 ? C.crim : C.green;
        return (
          <div style={{ marginTop: 28 }}>
            <SectionTitle title="Material Still With You" />
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, margin: "-4px 20px 12px", lineHeight: 1.5 }}>
              Material issued minus the weight of sarees you have submitted. Jari is counted at 1 reel = {JARI_REEL_GRAMS} g.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 10, margin: "0 20px 14px" }}>
              {[
                { label: "Issued", value: fmtKg(matSummary.issuedGrams), color: C.text },
                { label: "Submitted", value: fmtKg(matSummary.receivedGrams), color: C.green },
                { label: "Outstanding", value: fmtKg(matSummary.outstandingGrams), color: outColor },
              ].map(s => (
                <div key={s.label} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 12px", textAlign: "center" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ margin: "0 20px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
              {(() => {
                const recordsByBatch = new Map<string, typeof weaverRecords>();
                weaverRecords.forEach(r => {
                  const key = r.batchId || "Unassigned";
                  if (!recordsByBatch.has(key)) recordsByBatch.set(key, []);
                  recordsByBatch.get(key)!.push(r);
                });
                return matByBatch.map(b => {
                  const records = (recordsByBatch.get(b.batchId) ?? []).slice()
                    .sort((a, c) => new Date(c.issuedAt).getTime() - new Date(a.issuedAt).getTime());

                  // Break outstanding down per material type. Submitted sarees are
                  // only weighed in aggregate (no per-material split at receipt),
                  // so each material's outstanding is apportioned from the batch's
                  // total outstanding in proportion to how much of it was issued.
                  const byMaterial = new Map<string, { label: string; issuedGrams: number; reels: number }>();
                  records.forEach(r => r.materials.forEach(m => {
                    const key = m.materialType === "Warp" && m.warpSubtype ? `Warp — ${m.warpSubtype}` : m.materialType;
                    if (!byMaterial.has(key)) byMaterial.set(key, { label: key, issuedGrams: 0, reels: 0 });
                    const entry = byMaterial.get(key)!;
                    entry.issuedGrams += materialItemToGrams(m);
                    if (m.materialType === "Jari") {
                      entry.reels += (m.unit || "").toLowerCase().startsWith("bun")
                        ? (m.quantity || 0) * REELS_PER_BUN
                        : (m.quantity || 0);
                    }
                  }));
                  const outstandingRatio = b.issuedGrams > 0 ? b.outstandingGrams / b.issuedGrams : 0;
                  const materialBreakdown = Array.from(byMaterial.values()).map(entry => ({
                    ...entry,
                    outstandingGrams: entry.issuedGrams * outstandingRatio,
                  }));

                  return (
                    <div key={b.batchId} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: C.cream, borderBottom: `1px solid ${C.bdr}`, flexWrap: "wrap" as const, gap: 6 }}>
                        <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{b.batchId}</span>
                        <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{b.sareesReceived} saree{b.sareesReceived !== 1 ? "s" : ""} submitted</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${C.bdr}` }}>
                        {[
                          { label: "Issued", value: fmtKg(b.issuedGrams), color: C.text },
                          { label: "Submitted", value: fmtKg(b.receivedGrams), color: C.green },
                          { label: "Outstanding", value: fmtKg(b.outstandingGrams), color: b.outstandingGrams > 0 ? C.crim : C.green },
                        ].map((s, i) => (
                          <div key={s.label} style={{ padding: "10px 14px", borderRight: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
                            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                      {materialBreakdown.length > 0 && (
                        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.bdr}`, display: "flex", flexDirection: "column" as const, gap: 8 }}>
                          <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.4px" }}>Outstanding by Material</div>
                          {materialBreakdown.map(m => {
                            const mOutColor = m.outstandingGrams > 0 ? C.crim : C.green;
                            const isJari = m.label === "Jari";
                            const outstandingReels = Math.round(m.outstandingGrams / JARI_REEL_GRAMS);
                            return (
                              <div key={m.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: C.cream, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "8px 12px", flexWrap: "wrap" as const }}>
                                <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 12, color: C.text }}>{m.label}</span>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                                  <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>
                                    Issued: <span style={{ fontFamily: F.m, fontWeight: 700, color: C.text }}>{isJari ? `${m.reels} reels` : fmtKg(m.issuedGrams)}</span>
                                  </span>
                                  <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>
                                    Outstanding: <span style={{ fontFamily: F.m, fontWeight: 700, color: mOutColor }}>{isJari ? `${outstandingReels} reels` : fmtKg(m.outstandingGrams)}</span>
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column" as const, gap: 12 }}>
                        {records.map(r => (
                          <MaterialHistoryCard key={r.id} r={r} isTablet={isTablet} />
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        );
      })()}

      {/* Complete Reference History */}
      <ReferenceHistorySection
        signedRecords={signedRecords}
        myWeavingBatches={myWeavingBatches}
        mySarees={mySarees}
        isMobile={isMobile}
        isTablet={isTablet}
      />
    </div>
  );
}
