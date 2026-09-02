import React, { useState, useMemo, useCallback } from "react";
import { Check, Info, Send, Shield, Package } from "lucide-react";
import { C, F, BG_IMAGE } from "../theme";
import { SectionHeading } from "@/shared/ui/portal/PortalChrome";
import { DesktopHero } from "./DesktopHero";
import { Button, Input, Textarea } from "../../../../../shared/ui/primitives";
import { LoadingState, ErrorState } from "../../../../../shared/ui/state";
import { useBatches } from "@/features/production";
import { useCurrentWeaver } from "../useCurrentWeaver";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { warpRequestsApi, BackendWarpRequest } from "../../../../../shared/api/warpRequests";
import { prependToEnvelope } from "../../../../../lib/cacheUpdates";
import { DataTable, ViewToggle, type ColumnDef, type ViewMode } from "@/shared/ui/data";

/** Thin wrapper on the shared portal heading — see PaymentsSection. */
function DSectionHeader({ label }: { label: string }) {
  return <SectionHeading title={label} />;
}

type MaterialKey = "warp" | "resham" | "jari";

const MATERIAL_TO_WARP_TYPE: Record<MaterialKey, string> = {
  warp: "WARP", resham: "RESHAM", jari: "JARI",
};

export function WarpSection({
  bp, isTablet,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean;
  warpBatch?: string; setWarpBatch?: (b: string) => void;
  materials?: Record<MaterialKey, boolean>; setMaterials?: React.Dispatch<React.SetStateAction<Record<MaterialKey, boolean>>>;
  amounts?: Record<MaterialKey, string>; setAmounts?: React.Dispatch<React.SetStateAction<Record<MaterialKey, string>>>;
  reason?: string; setReason?: (v: string) => void;
  warpSubmitted?: boolean; setWarpSubmitted?: (v: boolean) => void;
}) {
  const { batches } = useBatches();
  const { weaver, weaverId, weaverCode } = useCurrentWeaver();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const identityBadge = user?.name ? (weaverCode ? `${user.name} · ${weaverCode}` : user.name) : "—";

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

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const activeBatchId = selectedBatchId ?? myBatches[0]?.batchId ?? null;
  const activeBatch = myBatches.find(b => b.batchId === activeBatchId) ?? null;

  const [materials, setMaterials] = useState<Record<MaterialKey, boolean>>({ warp: false, resham: false, jari: false });
  const [amounts, setAmounts] = useState<Record<MaterialKey, string>>({ warp: "", resham: "", jari: "" });
  const [reason, setReason] = useState("");
  const [warpSubmitted, setWarpSubmitted] = useState(false);
  const [requestsView, setRequestsView] = useState<ViewMode>("table");

  const batchProgress = useMemo(() => {
    if (!activeBatch) return { total: 0, done: 0, pct: 0 };
    const total = activeBatch.myRows.length;
    const done = activeBatch.myRows.filter(r => r.qcPassed === true || r.sareeId).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [activeBatch]);

  const isLocked = batchProgress.pct < 50;

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

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      if (!weaverId) throw new Error("No weaver profile resolved.");
      const selectedMaterials = (["warp", "resham", "jari"] as const).filter(m => materials[m]);
      return Promise.all(selectedMaterials.map(mat =>
        warpRequestsApi.create({
          weaverId,
          warpType: MATERIAL_TO_WARP_TYPE[mat],
          // eslint-disable-next-line no-restricted-syntax -- length in meters, not money
          lengthMeters: parseFloat(amounts[mat]) || 0,
          notes: reason || undefined,
        }),
      ));
    },
    onSuccess: (created) => {
      // Put the new request(s) straight into the weaver's own history list. The
      // create response is the same BackendWarpRequest the list is built from,
      // so nothing has to be reconstructed — and a weaver who just submitted a
      // request sees it listed instead of an unchanged screen.
      prependToEnvelope<BackendWarpRequest>(queryClient, ["warpRequests"], created);
      void queryClient.invalidateQueries({ queryKey: ["warpRequests"] });
      setWarpSubmitted(true);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit warp request. Please try again.");
    },
  });

  const pills = [
    ...(myBatches.slice(0, 2).map(b => {
      const done = b.myRows.filter(r => r.qcPassed === true || r.sareeId).length;
      const total = b.myRows.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { text: `${b.batchId} · ${pct}% Complete · ${pct >= 50 ? "Unlocked" : "Locked"}`, color: C.gold };
    })),
    { text: `${approvedCount} of ${totalRequests} Requests Approved` },
  ];

  const heroStats = [
    { label: `${activeBatchId ?? "No Active Batch"} Progress`, val: activeBatch ? `${batchProgress.done}/${batchProgress.total}` : "0/0", sub: `${batchProgress.pct}% complete — ${isLocked ? "warp locked" : "warp unlocked"}` },
    { label: "Total Requests Raised", val: `${totalRequests}`, sub: "This month" },
    { label: "Approval Rate", val: `${approvalRate}%`, sub: `${approvedCount} approved, ${rejectedCount} rejected`, highlight: true },
  ];

  const requestColumns: ColumnDef<BackendWarpRequest>[] = [
    {
      id: "date", header: "Date", priority: 1, accessor: r => r.requestedAt,
      cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted }}>{new Date(r.requestedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>,
    },
    {
      id: "material", header: "Material", priority: 2, accessor: r => `${r.lengthMeters}m ${r.warpType}${r.color ? ` (${r.color})` : ""}`,
      cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: 15, fontWeight: 500, color: C.text }}>{r.lengthMeters}m {r.warpType}{r.color ? ` (${r.color})` : ""}</span>,
    },
    {
      id: "status", header: "Status", priority: 2, type: "badge", accessor: r => r.status,
      cell: (_v, r) => {
        const isApproved = r.status === "APPROVED";
        const isRejected = r.status === "REJECTED";
        return (
          <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: isApproved ? C.green : isRejected ? C.crim : C.gold }}>
            {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <DesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · WEAVER PORTAL · WARP REQUEST"
        titleMain="Warp Request"
        titleSub="& Additional Materials"
        description="Request additional raw materials for your active batches. Warp requests are unlocked after submitting 50% of your batch."
        pills={pills}
        alertBadge={identityBadge}
        stats={heroStats}
        bgUrl={BG_IMAGE}
      />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        {/* Batch selector */}
        {myBatches.length > 0 ? (
          <div style={{ display: "flex", gap: 14, marginBottom: 36, flexWrap: "wrap" }}>
            {myBatches.map(b => (
              <Button
                key={b.batchId}
                onClick={() => setSelectedBatchId(b.batchId)}
                className={
                  "rounded-full px-8 py-3 h-auto border-2 border-[#6E0F2D] font-mono text-sm font-bold transition-all " +
                  (activeBatchId === b.batchId ? "bg-[#6E0F2D] text-white" : "bg-transparent text-[#6E0F2D]")
                }
              >
                {b.batchId}
              </Button>
            ))}
          </div>
        ) : (
          <div style={{ background: C.cream, border: `1px solid ${C.bdr}`, borderRadius: 16, padding: "28px 24px", marginBottom: 32, textAlign: "center" as const }}>
            <Package size={28} color={C.muted} style={{ margin: "0 auto 10px" }} />
            <div style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>No active batches assigned</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginTop: 4 }}>Warp requests can only be submitted against active batches assigned to you.</div>
          </div>
        )}

        {warpSubmitted ? (
          <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" as const, padding: "60px 48px", background: "#FFF", borderRadius: 24, border: `1px solid ${C.bdr}`, boxShadow: "0 4px 32px rgba(44,24,16,0.10)" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
              <Check size={52} color={C.green} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: C.text, marginBottom: 16 }}>Warp Request Sent!</div>
            <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 36 }}>Your request has been sent to worker staff, admin, and superadmin. You will be notified when a decision is made.</div>
            <Button onClick={() => { setWarpSubmitted(false); setMaterials({ warp: false, resham: false, jari: false }); setAmounts({ warp: "", resham: "", jari: "" }); setReason(""); }} fullWidth className="block h-[60px] bg-[#6E0F2D] border-none rounded-[14px] font-bold text-lg text-white">
              ← Back to Warp Requests
            </Button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 380px", gap: 36, alignItems: "start" }}>
            {/* Left: Form */}
            <div>
              {/* Unlock status */}
              {isLocked ? (
                <div style={{ background: "rgba(192,57,43,0.06)", border: `2px solid ${C.crim}`, borderRadius: 18, padding: "22px 28px", marginBottom: 32, display: "flex", alignItems: "center", gap: 18 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.crim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Shield size={28} color="#FFF" />
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.crim }}>Warp Request Locked for {activeBatchId ?? "No Batch"}</div>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 4 }}>
                      You have submitted {batchProgress.done} of {batchProgress.total} ({batchProgress.pct}%) sarees — 50% required to unlock warp requests.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: "rgba(30,102,64,0.08)", border: `2px solid ${C.green}`, borderRadius: 18, padding: "22px 28px", marginBottom: 32, display: "flex", alignItems: "center", gap: 18 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={28} color="#FFF" />
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.green }}>Warp Request Unlocked for {activeBatchId}</div>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 4 }}>
                      You have submitted {batchProgress.done} of {batchProgress.total} ({batchProgress.pct}%) sarees — warp request is now available.
                    </div>
                  </div>
                </div>
              )}

              <DSectionHeader label="Request Additional Materials" />
              <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, padding: "32px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", marginBottom: 24 }}>
                <div style={{ display: "inline-block", background: "rgba(110,15,45,0.08)", color: C.burg, borderRadius: 999, padding: "8px 20px", fontFamily: F.m, fontSize: 16, marginBottom: 28 }}>{activeBatchId ?? "N/A"}</div>

                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 20 }}>What material do you need?</div>
                <div style={{ marginBottom: 28 }}>
                  {(["warp", "resham", "jari"] as const).map((mat) => (
                    <label key={mat} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", cursor: "pointer", borderBottom: mat !== "jari" ? `1px solid ${C.bdr}` : "none" }}>
                      <div onClick={() => setMaterials(m => ({ ...m, [mat]: !m[mat] }))} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setMaterials(m => ({ ...m, [mat]: !m[mat] })))?.(); } }} style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${materials[mat] ? C.burg : C.bdr}`, background: materials[mat] ? C.burg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                        {materials[mat] && <Check size={16} color="#FFF" />}
                      </div>
                      <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>
                        {mat === "warp" ? "More Warp" : mat === "resham" ? "More Resham" : "More Jari"}
                      </span>
                    </label>
                  ))}
                </div>

                {(["warp", "resham", "jari"] as const).filter(m => materials[m]).map(mat => (
                  <div key={mat} style={{ marginBottom: 20 }}>
                    <span style={{ display: "block", fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 10 }}>
                      {mat === "warp" ? "Warp amount (kg):" : mat === "resham" ? "Resham amount and color:" : "Jari amount (reels):"}
                    </span>
                    <Input value={amounts[mat]} onChange={e => setAmounts(a => ({ ...a, [mat]: e.target.value }))} placeholder={mat === "warp" ? "e.g. 3 kg" : mat === "resham" ? "e.g. 500g Red" : "e.g. 4 reels"}
                      size="lg" className="font-mono" containerClassName="rounded-xl h-14" />
                  </div>
                ))}

                <div>
                  <span style={{ display: "block", fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 10 }}>Why do you need more material?</span>
                  <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Example: Extra sarees needed for a large order" rows={3}
                    className="rounded-[14px] min-h-[110px] resize-none text-base" />
                </div>
              </div>

              <Button
                onClick={() => (!isLocked && (materials.warp || materials.resham || materials.jari)) ? createRequestMutation.mutate() : undefined}
                disabled={isLocked || createRequestMutation.isPending || !(materials.warp || materials.resham || materials.jari)}
                fullWidth
                className="h-[60px] bg-[#6E0F2D] hover:bg-[#520920] active:bg-[#3D0616] text-white hover:text-white border-none rounded-full font-bold text-lg gap-3 shadow-[0_4px_20px_rgba(110,15,45,0.35)] disabled:bg-[#E8DCC4] disabled:text-[#8C7A6B] disabled:opacity-80 cursor-pointer">
                <Send size={22} className="shrink-0" /> {createRequestMutation.isPending ? "Sending Request…" : isLocked ? "Warp Request Locked" : "Send Warp Request"}
              </Button>
            </div>

            {/* Right: Rules + History */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 22 }}>
              <div style={{ background: "#FFF8E8", border: `1px solid rgba(200,155,71,0.28)`, borderRadius: 18, padding: "24px 26px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <Info size={22} color={C.gold} />
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: C.text }}>System Rule</div>
                </div>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.75 }}>You can raise a warp request only after submitting 50% of your batch. This ensures enough progress before more materials are allocated.</div>
              </div>

              <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
                <div style={{ padding: "20px 26px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 5, height: 22, background: C.burg, borderRadius: 3 }} />
                    <span style={{ fontFamily: F.u, fontSize: 16, fontWeight: 700, color: C.text }}>Previous Requests</span>
                  </div>
                  {myPrevRequests.length > 0 && <ViewToggle value={requestsView} onChange={setRequestsView} />}
                </div>

                {warpLoading ? (
                  <div style={{ padding: 20 }}>
                    <LoadingState variant="skeleton" rows={3} />
                  </div>
                ) : warpError ? (
                  <div style={{ padding: 20 }}>
                    <ErrorState error={undefined} onRetry={() => void refetchWarp()} />
                  </div>
                ) : myPrevRequests.length === 0 ? (
                  <div style={{ padding: "28px 24px", textAlign: "center" as const }}>
                    <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>No previous warp requests recorded.</div>
                  </div>
                ) : (
                  <DataTable columns={requestColumns} data={myPrevRequests} getRowId={r => r.id} view={requestsView} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

