import { materialTypeIcon } from "./MyBatchesPage";

import React, { useState, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { useResponsive } from "../../../../hooks/useResponsive";

import { useBatches } from "@/features/production";

import { useDesignLibrary, DesignEntry } from "@/features/design-library";

import { DesignCodeCard } from "@/features/design-library";

import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS, materialItemToGrams, BUNS_PER_REEL } from "@/features/materials";

import { Bell, Check } from "lucide-react";


import {
  C, F, SectionTitle, Card, SignatureCanvas, SignatureCanvasHandle, MaterialHistoryCard, HeroHeader, DesignCodeTileGrid
} from './theme';
import { useCurrentWeaver } from "./useCurrentWeaver";
import { useMyMaterialReturns } from "./useMyMaterialReturns";
import { useAuth } from "../../../../contexts/AuthContext";
import { BG_IMAGE } from "./WeaverBatchNotifData";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";

export function ConfirmMaterialPage({ onGoToBatches }: { onGoToBatches?: () => void } = {}) {
  const { isMobile, isTablet, cols } = useResponsive();
  const { user } = useAuth();
  const { getRecordsForWeaver, updateSignatureStatus, getMaterialSummaryForWeaver, getMaterialSummaryByBatch, isLoading: materialsLoading, isError: materialsError, error: materialsErrorObj, refetch: refetchMaterials } = useMaterialIssue();
  const { batches } = useBatches();
  const { getDesign } = useDesignLibrary();
  const { weaverId, isLoading: weaverLoading, isError: weaverError } = useCurrentWeaver();
  const { confirmedRecords: confirmedReturns } = useMyMaterialReturns();

  const weaverName = user?.name ?? "Weaver";
  const weaverCode = user?.empId ?? (weaverId ? weaverId.slice(0, 10) : "Weaver");

  const matSummary = getMaterialSummaryForWeaver(weaverId ?? "");
  const matByBatch = weaverId ? getMaterialSummaryByBatch(weaverId) : [];

  const [hasSig, setHasSig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedRecord, setConfirmedRecord] = useState<MaterialIssueRecord | null>(null);
  const [viewDesign, setViewDesign] = useState<DesignEntry | null>(null);
  const canvasRef = useRef<SignatureCanvasHandle | null>(null);

  const weaverRecords = weaverId ? getRecordsForWeaver(weaverId) : [];
  const pendingRecords = weaverRecords.filter(r => r.status === "pending-signature");
  const pending = pendingRecords[0] ?? null;



  const myDesignCodes = Array.from(new Set(
    batches
      .filter(b => b.status === "active")
      .flatMap(b => b.rows)
      .filter(r => r.weaverId === weaverId)
      .map(r => r.designCode)
      .filter((c): c is string => Boolean(c))
  ));

  const handleConfirm = async () => {
    if (!pending || !hasSig || submitting) return;
    const blob = await canvasRef.current?.toBlob();
    if (!blob) return;
    setSubmitting(true);
    try {
      await updateSignatureStatus(pending.id, blob);
      setConfirmedRecord(pending);
      setConfirmed(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetToPending = () => {
    setConfirmed(false); setConfirmedRecord(null);
    setHasSig(false);
  };

  if (weaverLoading || materialsLoading) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · MATERIAL RECEIPT" title="Confirm Materials" sub="Sign to confirm receipt" />
        <div style={{ margin: "20px" }}>
          <LoadingState variant="skeleton" rows={4} />
        </div>
      </div>
    );
  }

  if (materialsError) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · MATERIAL RECEIPT" title="Confirm Materials" sub="Sign to confirm receipt" />
        <div style={{ margin: "20px" }}>
          <ErrorState error={materialsErrorObj} onRetry={refetchMaterials} />
        </div>
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
        <button
          onClick={resetToPending}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 999,
            border: "none",
            background: "#6E0F2D",
            color: "#FFFFFF",
            fontFamily: F.u,
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            marginBottom: 10,
            boxShadow: "0 4px 16px rgba(110,15,45,0.30)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#520920"; e.currentTarget.style.color = "#FFFFFF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#6E0F2D"; e.currentTarget.style.color = "#FFFFFF"; }}
        >
          View More Pending Receipts
        </button>
        <button
          onClick={onGoToBatches}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 999,
            border: `1px solid ${C.bdrMed}`,
            background: "#FFFFFF",
            color: "#6E0F2D",
            fontFamily: F.u,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#6E0F2D"; e.currentTarget.style.color = "#FFFFFF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.color = "#6E0F2D"; }}
        >
          ← Go to My Batches
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* ── HERO BANNER MATCHING DESKTOP CONFIRM MATERIALS HERO ── */}
      <div style={{ position: "relative", overflow: "hidden", background: "#0D0207", padding: isTablet ? "36px 28px 32px" : "28px 20px 24px" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${BG_IMAGE})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.22, pointerEvents: "none"
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,2,7,0.75) 0%, #0D0207 100%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: F.m, fontSize: 11, letterSpacing: "1.8px", color: "rgba(255,253,249,0.50)", textTransform: "uppercase", marginBottom: 10 }}>
            SINCE 1999 · WEAVER PORTAL · MATERIAL RECEIPT
          </div>

          <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: isTablet ? 38 : 28, color: "#FFFDF9", lineHeight: 1.15, marginBottom: 8 }}>
            Confirm Materials <span style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 400, fontSize: isTablet ? 30 : 22, color: C.gold }}>& Open Your Batch</span>
          </div>

          <div style={{ fontFamily: F.u, fontSize: 13.5, color: "rgba(255,253,249,0.75)", lineHeight: 1.6, maxWidth: "620px", marginBottom: 16 }}>
            Review all materials issued to you, check the color slip, and sign to officially open your batch and start weaving.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 16px" }}>
              <span style={{ fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: "#FFF" }}>
                {weaverName} · {weaverCode}
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 16px" }}>
              <span style={{ fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: "#FFF" }}>
                {pendingRecords.length > 0 ? `${pendingRecords.length} Pending Material Handover` : "No pending materials"}
              </span>
            </div>
          </div>
        </div>
      </div>

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

          <div style={{ padding: "0 0 16px 0", margin: isMobile ? "0" : "0 auto", maxWidth: isMobile ? undefined : isTablet ? "100%" : "560px", ...(isMobile ? {} : { paddingLeft: 20, paddingRight: 20 }) }}>
            <SignatureCanvas ref={canvasRef} onSigned={setHasSig} />
          </div>

          <div style={{ margin: "0 20px" }}>
            <div style={{ background: C.cream, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>By signing and confirming, you agree that you have received all the materials listed above. This record is permanent.</span>
            </div>
            <button
              onClick={() => void handleConfirm()}
              disabled={!hasSig || submitting}
              style={{
                width: "100%",
                height: 54,
                borderRadius: 999,
                border: "none",
                background: hasSig && !submitting ? "#1E6640" : "#C0C0C0",
                color: "#FFFFFF",
                fontFamily: F.u,
                fontWeight: 600,
                fontSize: 16,
                cursor: hasSig && !submitting ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (hasSig && !submitting) {
                  e.currentTarget.style.background = "#144D2F";
                  e.currentTarget.style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (hasSig && !submitting) {
                  e.currentTarget.style.background = "#1E6640";
                  e.currentTarget.style.color = "#FFFFFF";
                }
              }}
            >
              <Check size={20} color="#FFFFFF" /> {submitting ? "Confirming…" : "Confirm Material Receipt"}
            </button>
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
            <button
              onClick={onGoToBatches}
              style={{
                width: "100%",
                height: 48,
                borderRadius: 999,
                border: "none",
                background: "#6E0F2D",
                color: "#FFFFFF",
                fontFamily: F.u,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(110,15,45,0.30)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#520920"; e.currentTarget.style.color = "#FFFFFF"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#6E0F2D"; e.currentTarget.style.color = "#FFFFFF"; }}
            >
              ← Go to My Batches
            </button>
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
                        ? (m.quantity || 0) / BUNS_PER_REEL
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

      {/* Material Returns — admin-confirmed handovers back, signature included */}
      {confirmedReturns.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <SectionTitle title="Material Returns Confirmed by Admin" />
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, margin: "-4px 20px 12px", lineHeight: 1.5 }}>
            Material you returned that Admin has verified and signed off — this amount has already been removed from your outstanding balance above.
          </div>
          <div style={{ margin: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {confirmedReturns.map(r => (
              <div key={r.id} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }}>{r.id}</span>
                    {r.batchId && <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Batch {r.batchId}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(30,102,64,0.12)", borderRadius: 999, padding: "4px 12px" }}>
                    <Check size={13} color={C.green} />
                    <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.green }}>Confirmed & Signed</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: r.signatureUrl ? 10 : 0 }}>
                  {r.items.map((item, i) => (
                    // eslint-disable-next-line react/no-array-index-key -- return items have no stable id and material type can repeat.
                    <span key={`${item.materialType}-${i}`} style={{ fontFamily: F.u, fontSize: 12.5, color: C.text, background: C.cream, borderRadius: 999, padding: "5px 12px" }}>
                      {item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari"}: {item.quantity} {item.unit}
                    </span>
                  ))}
                </div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, display: "flex", flexWrap: "wrap" as const, gap: 14 }}>
                  <span>Returned {new Date(r.receivedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  {r.signatureTimestamp && (
                    <span>Signed {new Date(r.signatureTimestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  )}
                </div>
                {r.signatureUrl && (
                  <img
                    src={r.signatureUrl}
                    alt={`Confirmation signature for ${r.id}`}
                    style={{ marginTop: 10, height: 44, objectFit: "contain" as const, background: C.cream, borderRadius: 8, padding: "4px 10px" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
