import React, { useRef, useState } from "react";

import { Check, CheckCircle2, Clock } from "lucide-react";

import { JARI_REEL_GRAMS, MaterialIssueRecord, BatchMaterialSummary, WeaverMaterialSummary, materialItemToGrams, BUNS_PER_REEL } from "@/features/materials";

import { C, F, FABRIC_BG, MaterialHistoryCard, SignatureCanvas, SignatureCanvasHandle, Tab5 } from "../theme";

import { SectionHeading } from "@/shared/ui/portal/PortalChrome";

import { DesktopHero } from "./DesktopHero";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useCurrentWeaver } from "../useCurrentWeaver";
import { useMyMaterialReturns } from "../useMyMaterialReturns";
import { useMaterialIssue } from "@/features/materials";
import { LoadingState, ErrorState } from "@/shared/ui/state";


/** Thin wrapper on the shared portal heading — see PaymentsSection. */
function DSectionHeader({ label }: { label: string }) {
  return <SectionHeading title={label} />;
}

export function ConfirmSection({
  bp, isTablet, pendingMaterialRecord, confirmed, confirmedRecord,
  matByBatch, matSummary, weaverMaterialRecords,
  setActive, setConfirmed, setConfirmedRecord, setSigMethod, setHasSig, setRequestSent,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean;
  pendingMaterialRecord: MaterialIssueRecord | null;
  confirmed: boolean;
  confirmedRecord: MaterialIssueRecord | null;
  matByBatch: BatchMaterialSummary[];
  matSummary: WeaverMaterialSummary;
  weaverMaterialRecords: MaterialIssueRecord[];
  setActive: (t: Tab5) => void;
  setConfirmed: (v: boolean) => void;
  setConfirmedRecord: (v: MaterialIssueRecord | null) => void;
  setSigMethod: (v: "none" | "here" | "remote") => void;
  setHasSig: (v: boolean) => void;
  setRequestSent: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const { weaverCode } = useCurrentWeaver();
  const { isLoading: materialsLoading, isError: materialsError, error: materialsErrorObj, refetch: refetchMaterials, updateSignatureStatus } = useMaterialIssue();
  const { confirmedRecords: confirmedReturns } = useMyMaterialReturns();
  const [hasSig, setHasSigLocal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<SignatureCanvasHandle | null>(null);
  const name = user?.name || "—";
  const initials = name === "—" ? "—" : name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const identityBadge = user?.name ? (weaverCode ? `${user.name} · ${weaverCode}` : user.name) : "—";

  const handleConfirm = async () => {
    if (!pendingMaterialRecord || !hasSig || submitting) return;
    const blob = await canvasRef.current?.toBlob();
    if (!blob) return;
    setSubmitting(true);
    try {
      await updateSignatureStatus(pendingMaterialRecord.id, blob);
      setConfirmedRecord(pendingMaterialRecord);
      setConfirmed(true);
      setHasSigLocal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · WEAVER PORTAL · MATERIAL RECEIPT"
        titleMain="Confirm Materials"
        titleSub="& Open Your Batch"
        description="Review all materials issued to you, check the color slip, and sign to officially open your batch and start weaving."
        pills={pendingMaterialRecord ? [
          { text: identityBadge },
          { text: `${pendingMaterialRecord.id} · Awaiting Signature`, color: C.gold },
          { text: `${pendingMaterialRecord.materials.length} Material${pendingMaterialRecord.materials.length !== 1 ? "s" : ""} to Review` },
        ] : [{ text: identityBadge }, { text: "No pending materials" }]}
        alertBadge={pendingMaterialRecord ? "New Materials Issued" : undefined}
        bgUrl={FABRIC_BG}
      />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        {confirmed && confirmedRecord ? (
          <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" as const, padding: "60px 48px", background: "#FFF", borderRadius: 24, border: `1px solid ${C.bdr}`, boxShadow: "0 4px 32px rgba(44,24,16,0.10)" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
              <Check size={52} color={C.green} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: C.text, marginBottom: 16 }}>Materials Confirmed!</div>
            <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>You have confirmed receipt of all materials in {confirmedRecord.id}. Good luck with your weaving!</div>
            <div style={{ display: "inline-block", background: "rgba(110,15,45,0.08)", color: C.burg, borderRadius: 999, padding: "10px 24px", fontFamily: F.m, fontSize: 18, marginBottom: 36 }}>{confirmedRecord.id}</div>
            <button
              onClick={() => { setConfirmed(false); setConfirmedRecord(null); setSigMethod("none"); setHasSig(false); setRequestSent(false); }}
              style={{
                width: "100%",
                height: 60,
                borderRadius: 999,
                border: "none",
                background: "#6E0F2D",
                color: "#FFFFFF",
                fontFamily: F.u,
                fontWeight: 700,
                fontSize: 18,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(110,15,45,0.30)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#520920"; e.currentTarget.style.color = "#FFFFFF"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#6E0F2D"; e.currentTarget.style.color = "#FFFFFF"; }}
            >
              ← Back to My Batches
            </button>
          </div>
        ) : !pendingMaterialRecord ? (
          <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" as const, padding: "60px 48px", background: "#FFF", borderRadius: 24, border: `1px solid ${C.bdr}`, boxShadow: "0 4px 32px rgba(44,24,16,0.10)" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
              <Check size={52} color={C.green} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.text, marginBottom: 16 }}>No pending material receipt</div>
            <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>All material receipts are confirmed. Nothing pending.</div>
            <button
              onClick={() => setActive("batches")}
              style={{
                width: "100%",
                height: 56,
                borderRadius: 999,
                border: "none",
                background: "#6E0F2D",
                color: "#FFFFFF",
                fontFamily: F.u,
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(110,15,45,0.30)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#520920"; e.currentTarget.style.color = "#FFFFFF"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#6E0F2D"; e.currentTarget.style.color = "#FFFFFF"; }}
            >
              ← Go to My Batches
            </button>
          </div>
        ) : (
          <div style={{ background: "rgba(200,155,71,0.12)", border: `2px solid ${C.gold}`, borderRadius: 20, padding: "26px 30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.burg, border: `2px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#FFF" }}>{initials}</span>
              </div>
              <div>
                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.text }}>{name}, your materials are ready</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <span style={{ fontFamily: F.m, fontSize: 14, color: C.burg }}>{pendingMaterialRecord.id}</span>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.muted, display: "inline-block" }} />
                  <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Issued {new Date(pendingMaterialRecord.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
              </div>
            </div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
              The admin has issued your materials. Review the list below in Materials Received History, then sign here to confirm receipt.
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <div style={{ background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.22)", borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={14} color={C.green} />
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.green, fontWeight: 500 }}>{pendingMaterialRecord.materials.length} material{pendingMaterialRecord.materials.length !== 1 ? "s" : ""} to confirm</span>
              </div>
              <div style={{ background: "rgba(110,15,45,0.08)", border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={14} color={C.muted} />
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Signature required</span>
              </div>
            </div>

            {/* Sign directly on the alert — don't make the weaver hunt for
                the pad further down in Materials Received History. */}
            <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px dashed ${C.bdr}` }}>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 10 }}>Your Signature</div>
              <div style={{ maxWidth: "min(480px, 100%)" }}>
                <div style={{ border: `1.5px solid rgba(110,15,45,0.22)`, borderRadius: 14, overflow: "hidden", background: "#FFF", marginBottom: 14 }}>
                  <SignatureCanvas ref={canvasRef} onSigned={setHasSigLocal} />
                </div>
                <button
                  onClick={() => void handleConfirm()}
                  disabled={!hasSig || submitting}
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 999,
                    border: "none",
                    background: hasSig && !submitting ? "#1E6640" : "#C8C0B8",
                    color: "#FFFFFF",
                    fontFamily: F.u,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: hasSig && !submitting ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s ease",
                  }}
                >
                  <Check size={18} color="#FFFFFF" /> {submitting ? "Confirming…" : "Confirm Material Receipt"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Outstanding Material still with the weaver */}
        {matByBatch.length > 0 && (() => {
          const fmtKg = (g: number) => `${(g / 1000).toFixed(2)} kg`;
          const outColor = matSummary.outstandingGrams > 0 ? C.crim : C.green;
          return (
            <div style={{ marginTop: 48 }}>
              <DSectionHeader label="Material Still With You" />
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 22 }}>
                Material issued minus the weight of sarees you have submitted. Jari is counted at 1 reel = {JARI_REEL_GRAMS} g.
              </div>

              {/* Totals */}
              <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 14, marginBottom: 20 }}>
                {[
                  { label: "Issued", value: fmtKg(matSummary.issuedGrams), sub: `incl. ${matSummary.jariReels} jari reels`, color: C.text },
                  { label: "Submitted", value: fmtKg(matSummary.receivedGrams), sub: `${matSummary.sareesReceived} sarees`, color: C.green },
                  { label: "Outstanding", value: fmtKg(matSummary.outstandingGrams), sub: "still with you", color: outColor },
                ].map(s => (
                  <div key={s.label} style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: F.d, fontSize: 30, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 5 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Batch wise — combined with the handovers that make up each batch */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
                {(() => {
                  const recordsByBatch = new Map<string, typeof weaverMaterialRecords>();
                  weaverMaterialRecords.forEach(r => {
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
                      <div key={b.batchId} style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 16, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", background: C.cream, borderBottom: `1px solid ${C.bdr}`, flexWrap: "wrap" as const, gap: 8 }}>
                          <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.burg }}>{b.batchId}</span>
                          <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{b.sareesReceived} saree{b.sareesReceived !== 1 ? "s" : ""} submitted</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${C.bdr}` }}>
                          {[
                            { label: "Issued", value: fmtKg(b.issuedGrams), sub: b.jariReels > 0 ? `incl. ${b.jariReels} jari reels` : undefined, color: C.text },
                            { label: "Submitted", value: fmtKg(b.receivedGrams), sub: undefined, color: C.green },
                            { label: "Outstanding", value: fmtKg(b.outstandingGrams), sub: undefined, color: b.outstandingGrams > 0 ? C.crim : C.green },
                          ].map((s, i) => (
                            <div key={s.label} style={{ padding: "14px 22px", borderRight: i < 2 ? `1px solid ${C.bdr}` : "none" }}>
                              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{s.label}</div>
                              <div style={{ fontFamily: F.m, fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                              {s.sub && <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 3 }}>{s.sub}</div>}
                            </div>
                          ))}
                        </div>
                        {materialBreakdown.length > 0 && (
                          <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.bdr}`, display: "flex", flexDirection: "column" as const, gap: 10 }}>
                            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Outstanding by Material</div>
                            {materialBreakdown.map(m => {
                              const mOutColor = m.outstandingGrams > 0 ? C.crim : C.green;
                              const isJari = m.label === "Jari";
                              const outstandingReels = Math.round(m.outstandingGrams / JARI_REEL_GRAMS);
                              return (
                                <div key={m.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: C.cream, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px", flexWrap: "wrap" as const }}>
                                  <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: C.text }}>{m.label}</span>
                                  <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                                    <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
                                      Issued: <span style={{ fontFamily: F.m, fontWeight: 700, color: C.text }}>{isJari ? `${m.reels} reels` : fmtKg(m.issuedGrams)}</span>
                                    </span>
                                    <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
                                      Outstanding: <span style={{ fontFamily: F.m, fontWeight: 700, color: mOutColor }}>{isJari ? `${outstandingReels} reels` : fmtKg(m.outstandingGrams)}</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
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
          <div style={{ marginTop: 48 }}>
            <DSectionHeader label="Material Returns Confirmed by Admin" />
            <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 22 }}>
              Material you returned that Admin has verified and signed off — this amount has already been removed from your outstanding balance above.
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
              {confirmedReturns.map(r => (
                <div key={r.id} style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 10, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, color: C.burg }}>{r.id}</span>
                      {r.batchId && <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Batch {r.batchId}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(30,102,64,0.12)", borderRadius: 999, padding: "5px 14px" }}>
                      <Check size={14} color={C.green} />
                      <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: C.green }}>Confirmed & Signed</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, marginBottom: r.signatureUrl ? 12 : 0 }}>
                    {r.items.map((item, i) => (
                      // eslint-disable-next-line react/no-array-index-key -- return items have no stable id and material type can repeat.
                      <span key={`${item.materialType}-${i}`} style={{ fontFamily: F.u, fontSize: 13, color: C.text, background: C.cream, borderRadius: 999, padding: "6px 14px" }}>
                        {item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari"}: {item.quantity} {item.unit}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, display: "flex", flexWrap: "wrap" as const, gap: 18 }}>
                    <span>Returned {new Date(r.receivedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    {r.signatureTimestamp && (
                      <span>Signed {new Date(r.signatureTimestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    )}
                  </div>
                  {r.signatureUrl && (
                    <img
                      src={r.signatureUrl}
                      alt={`Confirmation signature for ${r.id}`}
                      style={{ marginTop: 12, height: 50, objectFit: "contain" as const, background: C.cream, borderRadius: 10, padding: "6px 12px" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {materialsLoading ? (
          <div style={{ marginTop: 48 }}>
            <DSectionHeader label="Materials Received History" />
            <LoadingState variant="skeleton" rows={4} />
          </div>
        ) : materialsError ? (
          <div style={{ marginTop: 48 }}>
            <DSectionHeader label="Materials Received History" />
            <ErrorState error={materialsErrorObj} onRetry={refetchMaterials} />
          </div>
        ) : matByBatch.length === 0 && (
          <div style={{ marginTop: 48 }}>
            <DSectionHeader label="Materials Received History" />
            <div style={{ padding: "40px 20px", textAlign: "center" as const, background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}` }}>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No materials have been issued to you yet.</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
