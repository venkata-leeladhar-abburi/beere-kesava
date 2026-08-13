import React from "react";
import { Check, CheckCircle2, Clock } from "lucide-react";
import { JARI_REEL_GRAMS, MaterialIssueRecord, BatchMaterialSummary, WeaverMaterialSummary, materialItemToGrams, REELS_PER_BUN } from "../../../../materials/contexts/MaterialIssueContext";
import { C, F, FABRIC_BG, MaterialHistoryCard, Tab5 } from "../theme";
import { SectionHeading } from "@/shared/ui/portal/PortalChrome";
import { DesktopHero } from "./DesktopHero";
import { Button } from "../../../../../shared/ui/primitives";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useCurrentWeaver } from "../useCurrentWeaver";

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
  const name = user?.name || "—";
  const initials = name === "—" ? "—" : name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const identityBadge = user?.name ? (weaverCode ? `${user.name} · ${weaverCode}` : user.name) : "—";

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
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" as const, padding: "60px 48px", background: "#FFF", borderRadius: 24, border: `1px solid ${C.bdr}`, boxShadow: "0 4px 32px rgba(44,24,16,0.10)" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
              <Check size={52} color={C.green} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: C.text, marginBottom: 16 }}>Materials Confirmed!</div>
            <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>You have confirmed receipt of all materials in {confirmedRecord.id}. Good luck with your weaving!</div>
            <div style={{ display: "inline-block", background: "rgba(110,15,45,0.08)", color: C.burg, borderRadius: 999, padding: "10px 24px", fontFamily: F.m, fontSize: 18, marginBottom: 36 }}>{confirmedRecord.id}</div>
            <Button onClick={() => { setConfirmed(false); setConfirmedRecord(null); setSigMethod("none"); setHasSig(false); setRequestSent(false); }} fullWidth className="block h-[60px] bg-[#6E0F2D] border-none rounded-full font-bold text-lg text-white">
              ← Back to My Batches
            </Button>
          </div>
        ) : !pendingMaterialRecord ? (
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" as const, padding: "60px 48px", background: "#FFF", borderRadius: 24, border: `1px solid ${C.bdr}`, boxShadow: "0 4px 32px rgba(44,24,16,0.10)" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
              <Check size={52} color={C.green} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.text, marginBottom: 16 }}>No pending material receipt</div>
            <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>All material receipts are confirmed. Nothing pending.</div>
            <Button onClick={() => setActive("batches")} fullWidth className="block h-14 bg-[#6E0F2D] border-none rounded-full font-bold text-base text-white">
              ← Go to My Batches
            </Button>
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
              The admin has issued your materials. Review the list below in Materials Received History, then sign to confirm receipt.
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
              <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr 1fr 1fr" : "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
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
                              return (
                                <div key={m.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: C.cream, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px", flexWrap: "wrap" as const }}>
                                  <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: C.text }}>{m.label}</span>
                                  <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                                    <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
                                      Issued: <span style={{ fontFamily: F.m, fontWeight: 700, color: C.text }}>{fmtKg(m.issuedGrams)}</span>
                                      {m.reels > 0 && ` (${m.reels} reels)`}
                                    </span>
                                    <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>
                                      Outstanding: <span style={{ fontFamily: F.m, fontWeight: 700, color: mOutColor }}>{fmtKg(m.outstandingGrams)}</span>
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

        {matByBatch.length === 0 && (
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
