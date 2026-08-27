
import { useState, useMemo, useCallback } from "react";
import { useBatches } from "@/features/production";
import { useCurrentWeaver } from "./useCurrentWeaver";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { warpRequestsApi, BackendWarpRequest } from "../../../../shared/api/warpRequests";
import {
  Shield, Send,
  Package, Check,
  AlertTriangle, Info,
} from "lucide-react";

// ─── Design Tokens ─────────────────────────────────────────────────────────
import {
  C, F, HeroHeader } from './theme';
import { SectionHeading } from "@/shared/ui/portal/PortalChrome";
import { Button, Input, Textarea } from '../../../../shared/ui/primitives';
import { LoadingState, ErrorState } from "../../../../shared/ui/state";

const MATERIAL_TO_WARP_TYPE: Record<"warp" | "resham" | "jari", string> = {
  warp: "WARP", resham: "RESHAM", jari: "JARI",
};

import { useAuth } from "../../../../contexts/AuthContext";
import { BG_IMAGE } from "./WeaverBatchNotifData";
import { LuxuryStatsCard, type StatItem } from "@/shared/ui/LuxuryStatsCard";
import { IcoResourceMgmt, IcoFabricRoll, IcoQualityCheck } from "@/features/dashboards";

export function WarpRequestPage() {
  const { batches } = useBatches();
  const { weaver, weaverId, weaverCode, isLoading: weaverLoading, isError: weaverError } = useCurrentWeaver();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isMyRow = useCallback((r: { weaverId?: string | null }) => {
    if (!r.weaverId) return false;
    return r.weaverId === weaverId || (weaver && (r.weaverId === weaver.id || r.weaverId === weaver.code));
  }, [weaverId, weaver]);

  const myBatches = useMemo(() => {
    return batches
      .filter(b => b.status !== "draft")
      .map(b => ({ ...b, myRows: b.rows.filter(isMyRow) }))
      .filter(b => b.myRows.length > 0 && b.status !== "completed");
  }, [batches, isMyRow]);

  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const activeBatchId = selectedBatch ?? myBatches[0]?.batchId ?? null;
  const activeBatch = myBatches.find(b => b.batchId === activeBatchId) ?? null;

  const [materials, setMaterials] = useState({ warp: false, resham: false, jari: false });
  const [amounts, setAmounts] = useState({ warp: "", resham: "", jari: "" });
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const batchProgress = useMemo(() => {
    if (!activeBatch) return { total: 0, done: 0, pct: 0 };
    const total = activeBatch.myRows.length;
    const done = activeBatch.myRows.filter(r => r.qcPassed === true || r.sareeId).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [activeBatch]);

  const isLocked = batchProgress.pct < 50;

  // Previous requests raised by this weaver, most recent first.
  const { data: warpRequestsData, isLoading: warpLoading, isError: warpError, refetch: refetchWarp } = useQuery({
    queryKey: ["warpRequests"],
    queryFn: () => warpRequestsApi.list(),
  });
  const myPrevRequests: BackendWarpRequest[] = useMemo(() => {
    return (warpRequestsData?.items ?? [])
      .filter(r => r.weaverId === weaverId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [warpRequestsData, weaverId]);

  const approvedCount = myPrevRequests.filter(r => r.status === "APPROVED").length;
  const rejectedCount = myPrevRequests.filter(r => r.status === "REJECTED").length;
  const totalRequests = myPrevRequests.length;
  const approvalRate = totalRequests > 0 ? Math.round((approvedCount / totalRequests) * 100) : 0;

  const statIcons = useMemo(() => [
    <IcoResourceMgmt key="r" sz={22} col="#F5E8D0" />,
    <IcoFabricRoll key="f" sz={22} col="#F5E8D0" />,
    <IcoQualityCheck key="q" sz={22} col="#F5E8D0" />,
  ], []);

  const pills: Array<{ text: string; color?: string }> = useMemo(() => [
    { text: user?.name ? (weaverCode ? `${user.name} · ${weaverCode}` : user.name) : "Weaver" },
    ...(myBatches.slice(0, 2).map(b => {
      const done = b.myRows.filter(r => r.qcPassed === true || r.sareeId).length;
      const total = b.myRows.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { text: `${b.batchId} · ${pct}% Complete · ${pct >= 50 ? "Unlocked" : "Locked"}`, color: C.gold };
    })),
    { text: `${approvedCount} of ${totalRequests} Requests Approved` },
  ], [user, weaverCode, myBatches, approvedCount, totalRequests]);

  const statItems: StatItem[] = useMemo(() => [
    {
      label: `${activeBatchId ?? "No Active Batch"} Progress`,
      value: activeBatch ? `${batchProgress.done}/${batchProgress.total}` : "0/0",
      sub: `${batchProgress.pct}% complete — ${isLocked ? "warp locked" : "warp unlocked"}`,
      icon: statIcons[0],
    },
    {
      label: "Total Requests Raised",
      value: `${totalRequests}`,
      sub: "This month",
      icon: statIcons[1],
    },
    {
      label: "Approval Rate",
      value: `${approvalRate}%`,
      sub: `${approvedCount} approved, ${rejectedCount} rejected`,
      icon: statIcons[2],
      highlight: true,
      goldVal: true,
    },
  ], [activeBatchId, activeBatch, batchProgress, isLocked, totalRequests, approvalRate, approvedCount, rejectedCount, statIcons]);

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      if (!weaverId) throw new Error("No weaver profile resolved for this login.");
      const selectedMaterials = (["warp", "resham", "jari"] as const).filter(m => materials[m]);
      await Promise.all(selectedMaterials.map(mat =>
        warpRequestsApi.create({
          weaverId,
          warpType: MATERIAL_TO_WARP_TYPE[mat],
          // eslint-disable-next-line no-restricted-syntax -- length in meters, not money
          lengthMeters: parseFloat(amounts[mat]) || 0,
          notes: reason || undefined,
        }),
      ));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["warpRequests"] });
      setSubmitted(true);
    },
    onError: (err) => {
       
      console.error("Failed to submit warp request:", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit warp request. Please try again.");
    },
  });

  if (weaverLoading || warpLoading) {
    return (
      <div style={{ padding: 24 }}>
        <LoadingState variant="skeleton" rows={4} />
      </div>
    );
  }

  if (warpError) {
    return (
      <div style={{ padding: 24 }}>
        <ErrorState error={undefined} onRetry={() => void refetchWarp()} />
      </div>
    );
  }

  if (weaverError || !weaverId) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
        <AlertTriangle size={28} color={C.crim} style={{ margin: "0 auto 12px" }} />
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, fontWeight: 600 }}>Couldn't find your weaver profile</div>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 4 }}>Your login isn't linked to a weaver record yet. Contact your supervisor.</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check size={36} color={C.green} />
        </div>
        <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 12 }}>Request Sent!</div>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 28 }}>Your request has been sent to the worker staff, admin, and superadmin. You will be notified when a decision is made.</div>
        <Button onClick={() => { setSubmitted(false); setMaterials({ warp: false, resham: false, jari: false }); setAmounts({ warp: "", resham: "", jari: "" }); setReason(""); }} fullWidth className="h-[52px] bg-[#6E0F2D] border-none rounded-[14px] font-semibold text-base text-white">
          ← Back to Warp Requests
        </Button>
      </div>
    );
  }

  if (myBatches.length === 0) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · WARP REQUEST" title="Raise Warp Request" sub="Request additional material" />
        <div style={{ margin: "20px", background: C.cream, borderRadius: 14, padding: "28px 20px", textAlign: "center" as const }}>
          <Package size={28} color={C.muted} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>You have no active batches yet.</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Warp requests can only be raised against a batch assigned to you.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* ── HERO BANNER MATCHING MY BATCHES MOBILE HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "#0D0207", padding: "28px 16px 76px" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${BG_IMAGE})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.22, pointerEvents: "none"
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,2,7,0.7) 0%, #0D0207 100%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontFamily: F.m, fontSize: 11, letterSpacing: "1.8px", color: "rgba(255,253,249,0.50)", textTransform: "uppercase" }}>
            SINCE 1999 · WEAVER PORTAL · WARP REQUEST
          </div>

          <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 28, color: "#FFFDF9", lineHeight: 1.15 }}>
            Warp Request <span style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 400, fontSize: 22, color: C.gold }}>& Additional Materials</span>
          </div>

          <div style={{ fontFamily: F.u, fontSize: 13.5, color: "rgba(255,253,249,0.75)", lineHeight: 1.6 }}>
            Request additional raw materials for your active batches. Warp requests are unlocked after submitting 50% of your batch.
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {pills.map((p) => (
              <div key={p.text} style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "5px 14px" }}>
                <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: p.color || "#FFF" }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLOATING LUXURY STATS CARD (MATCHING MY BATCHES MOBILE PAGE) ── */}
      <div style={{ padding: "0 16px", marginTop: -56, position: "relative", zIndex: 20 }}>
        <LuxuryStatsCard stats={statItems} />
      </div>

      {/* Batch Selector */}
      {myBatches.length > 0 ? (
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Select Active Batch</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            {myBatches.map(b => (
              <button
                key={b.batchId}
                onClick={() => setSelectedBatch(b.batchId)}
                style={{
                  borderRadius: 999,
                  padding: "8px 22px",
                  border: "2px solid #6E0F2D",
                  background: activeBatchId === b.batchId ? "#6E0F2D" : "transparent",
                  color: activeBatchId === b.batchId ? "#FFFFFF" : "#6E0F2D",
                  fontFamily: F.m,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >{b.batchId}</button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ margin: "20px", background: C.cream, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "24px 20px", textAlign: "center" as const }}>
          <Package size={28} color={C.muted} style={{ margin: "0 auto 10px" }} />
          <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>No active batches assigned</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 4 }}>Warp requests can only be submitted against active batches assigned to you.</div>
        </div>
      )}

      {/* Unlock Status Banner */}
      {isLocked ? (
        <div style={{ background: "rgba(192,57,43,0.06)", border: `2px solid ${C.crim}`, borderRadius: 16, padding: "18px 20px", margin: "14px 20px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.crim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Shield size={22} color="#FFF" />
          </div>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.crim }}>Warp Request Locked for {activeBatchId ?? "No Batch"}</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>
              You have submitted {batchProgress.done} of {batchProgress.total} ({batchProgress.pct}%) sarees — 50% required to unlock warp requests.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: "rgba(30,102,64,0.08)", border: `2px solid ${C.green}`, borderRadius: 16, padding: "18px 20px", margin: "14px 20px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Check size={22} color="#FFF" />
          </div>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.green }}>Warp Request Unlocked for {activeBatchId}</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>
              You have submitted {batchProgress.done} of {batchProgress.total} ({batchProgress.pct}%) sarees — warp request is now available.
            </div>
          </div>
        </div>
      )}

      {/* Section Title */}
      <SectionHeading title="Request Additional Materials" />

      {/* Form Card */}
      <div style={{ margin: "0 20px 20px", background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, padding: "24px 20px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
        <div style={{ display: "inline-block", background: "rgba(110,15,45,0.08)", color: C.burg, borderRadius: 999, padding: "6px 16px", fontFamily: F.m, fontSize: 13, marginBottom: 20 }}>{activeBatchId ?? "N/A"}</div>

        <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 16 }}>What material do you need?</div>
        <div style={{ marginBottom: 24 }}>
          {(["warp", "resham", "jari"] as const).map((mat) => (
            <label key={mat} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", cursor: "pointer", borderBottom: mat !== "jari" ? `1px solid ${C.bdr}` : "none" }}>
              <div onClick={() => setMaterials(m => ({ ...m, [mat]: !m[mat] }))} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setMaterials(m => ({ ...m, [mat]: !m[mat] })))?.(); } }} style={{ width: 26, height: 26, borderRadius: 7, border: `2px solid ${materials[mat] ? C.burg : C.bdr}`, background: materials[mat] ? C.burg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                {materials[mat] && <Check size={15} color="#FFF" />}
              </div>
              <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>
                {mat === "warp" ? "More Warp" : mat === "resham" ? "More Resham" : "More Jari"}
              </span>
            </label>
          ))}
        </div>

        {(["warp", "resham", "jari"] as const).filter(m => materials[m]).map(mat => (
          <div key={mat} style={{ marginBottom: 18 }}>
            <span style={{ display: "block", fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 8 }}>
              {mat === "warp" ? "Warp amount (kg):" : mat === "resham" ? "Resham amount and color:" : "Jari amount (reels):"}
            </span>
            <Input value={amounts[mat]} onChange={e => setAmounts(a => ({ ...a, [mat]: e.target.value }))} placeholder={mat === "warp" ? "e.g. 3 kg" : mat === "resham" ? "e.g. 500g Red" : "e.g. 4 reels"}
              size="lg" className="font-mono" containerClassName="rounded-xl h-12" />
          </div>
        ))}

        <div>
          <span style={{ display: "block", fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 8 }}>Why do you need more material?</span>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Example: Extra sarees needed for a large order" rows={3}
            className="rounded-[14px] min-h-[100px] resize-none text-sm" />
        </div>
      </div>

      {/* Submit Button */}
      <div style={{ margin: "0 20px 24px" }}>
        <Button
          onClick={() => (!isLocked && (materials.warp || materials.resham || materials.jari)) ? createRequestMutation.mutate() : undefined}
          disabled={isLocked || createRequestMutation.isPending || !(materials.warp || materials.resham || materials.jari)}
          fullWidth
          className="h-14 bg-[#6E0F2D] hover:bg-[#520920] active:bg-[#3D0616] text-white hover:text-white font-bold text-base rounded-full gap-2.5 shadow-[0_4px_20px_rgba(110,15,45,0.35)] disabled:bg-[#E8DCC4] disabled:text-[#8C7A6B] disabled:opacity-80 border-none cursor-pointer"
        >
          <Send size={20} className="shrink-0" /> {createRequestMutation.isPending ? "Sending Request…" : isLocked ? "Warp Request Locked" : "Send Warp Request"}
        </Button>
      </div>

      {/* System Rule Card */}
      <div style={{ background: "#FFF8E8", border: `1px solid rgba(200,155,71,0.28)`, borderRadius: 18, padding: "20px 22px", margin: "0 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Info size={20} color={C.gold} />
          <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text }}>System Rule</div>
        </div>
        <div style={{ fontFamily: F.u, fontSize: 13.5, color: C.muted, lineHeight: 1.65 }}>
          You can raise a warp request only after submitting 50% of your batch. This ensures enough progress before more materials are allocated.
        </div>
      </div>

      {/* Previous Requests Card */}
      <div style={{ margin: "0 20px", background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.06)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 18, background: C.burg, borderRadius: 2 }} />
            <span style={{ fontFamily: F.u, fontSize: 15, fontWeight: 700, color: C.text }}>Previous Requests</span>
          </div>
        </div>

        {myPrevRequests.length === 0 ? (
          <div style={{ padding: "28px 20px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.u, fontSize: 13.5, color: C.muted }}>No previous warp requests recorded.</div>
          </div>
        ) : (
          myPrevRequests.map((r, i) => {
            const isApproved = r.status === "APPROVED";
            const isRejected = r.status === "REJECTED";
            const dateStr = new Date(r.requestedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
            const matStr = `${r.lengthMeters}m ${r.warpType}${r.color ? ` (${r.color})` : ""}`;
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: i < myPrevRequests.length - 1 ? `1px solid rgba(110,15,45,0.06)` : "none" }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: isApproved ? C.green : isRejected ? C.crim : C.gold, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginBottom: 2 }}>{dateStr}</div>
                  <div style={{ fontFamily: F.u, fontSize: 14.5, fontWeight: 500, color: C.text }}>{matStr}</div>
                </div>
                <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 700, color: isApproved ? C.green : isRejected ? C.crim : C.gold }}>
                  {isApproved ? "✓ Approved" : isRejected ? "✗ Rejected" : "⏳ Pending"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── PAGE 05 — PAYMENT LEDGER ─────────────────────────────────────────────
