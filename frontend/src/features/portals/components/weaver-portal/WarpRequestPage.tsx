
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { useResponsive } from "../../../../hooks/useResponsive";
import { useBatches, SareeRow } from "../../../production/contexts/BatchContext";
import { useDesignLibrary, DesignEntry } from "../../../design-library/contexts/DesignLibraryContext";
import { DesignCodeCard } from "../../../design-library/components/DesignLibraryPage";
import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS } from "../../../materials/contexts/MaterialIssueContext";
import { useWeaverPayments } from "../../../weavers/contexts/WeaverPaymentsContext";
import { useAuth } from "../../../../contexts/AuthContext";
import { useCurrentWeaver } from "./useCurrentWeaver";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { warpRequestsApi, BackendWarpRequest } from "../../../../shared/api/warpRequests";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Bell, ClipboardList, CheckSquare, Palette, ArrowUpRight,
  Wallet, Shield, Send, ChevronRight, X, ChevronLeft,
  Package, Check, Eye, LogOut, Search, RotateCcw,
  AlertCircle, Clock, Flower2, Layers, Info, Pencil,
  Scissors, LayoutGrid, CreditCard, ClipboardCheck,
  TrendingUp, ArrowRight, Sparkles, UserRound,
  CheckCircle2, History, ListChecks,
  AlertTriangle, Inbox, Zap,
} from "lucide-react";
import { imgBKLogo } from "../../../../shared/constants/weaverImages";

// ─── Design Tokens ─────────────────────────────────────────────────────────
import {
  C, F, SAREE_TYPE_RATES, DesignDetailCard, SareeTypeDetailCard, SectionTitle, Card, ProgressBar, StatusBadge, SignatureCanvas, MaterialHistoryCard, HeroHeader, DesignCodeTileGrid, MobileBatchCard, CompletedBatchCard, BATCH_QUICK_FILTERS, BatchQuickFilterPills, WN_T, WN_G, WN_EASE, WN_NUM, WN_DATA, WN_PRIORITY, WN_CATEGORY, WN_FILTERS, WNFadeUp, BatchCard, FadeUpBatch, BG_IMAGE, FABRIC_BG
} from './theme';
import { Button, Input, Textarea, Field } from '../../../../shared/ui/primitives';
import { DataTable, type ColumnDef } from '../../../../shared/ui/data';

const MATERIAL_TO_WARP_TYPE: Record<"warp" | "resham" | "jari", string> = {
  warp: "WARP", resham: "RESHAM", jari: "JARI",
};

export function WarpRequestPage() {
  const { isMobile, isTablet } = useResponsive();
  const { batches } = useBatches();
  const { weaver, weaverId, isLoading: weaverLoading, isError: weaverError } = useCurrentWeaver();
  const queryClient = useQueryClient();

  const isMyRow = (r: { weaverId?: string | null }) => {
    if (!r.weaverId) return false;
    return r.weaverId === weaverId || (weaver && (r.weaverId === weaver.id || r.weaverId === weaver.code));
  };

  const myBatches = useMemo(() => {
    return batches
      .filter(b => b.status !== "draft")
      .map(b => ({ ...b, myRows: b.rows.filter(isMyRow) }))
      .filter(b => b.myRows.length > 0 && b.status !== "completed");
  }, [batches, weaverId, weaver]);

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
  const { data: warpRequestsData } = useQuery({
    queryKey: ["warpRequests"],
    queryFn: () => warpRequestsApi.list(),
  });
  const myPrevRequests: BackendWarpRequest[] = useMemo(() => {
    return (warpRequestsData?.items ?? [])
      .filter(r => r.weaverId === weaverId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [warpRequestsData, weaverId]);

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      if (!weaverId) throw new Error("No weaver profile resolved for this login.");
      const selectedMaterials = (["warp", "resham", "jari"] as const).filter(m => materials[m]);
      await Promise.all(selectedMaterials.map(mat =>
        warpRequestsApi.create({
          weaverId,
          warpType: MATERIAL_TO_WARP_TYPE[mat],
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
      // eslint-disable-next-line no-console -- surface submit failures instead of failing silently
      console.error("Failed to submit warp request:", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit warp request. Please try again.");
    },
  });

  if (weaverLoading) {
    return <div style={{ padding: "60px 20px", textAlign: "center" as const, fontFamily: F.u, fontSize: 14, color: C.muted }}>Loading…</div>;
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
        <Button onClick={() => { setSubmitted(false); setMaterials({ warp: false, resham: false, jari: false }); setAmounts({ warp: "", resham: "", jari: "" }); setReason(""); }} fullWidth className="h-[52px] bg-[#6E0F2D] border-none rounded-full font-semibold text-base text-white">
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
      <HeroHeader eyebrow="SINCE 1999 · WARP REQUEST" title="Raise Warp Request" sub="Request additional material" />

      {/* Batch Selector */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginBottom: 10 }}>Which batch?</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
          {myBatches.map(b => (
            <Button
              key={b.batchId}
              onClick={() => setSelectedBatch(b.batchId)}
              size="sm"
              className={
                activeBatchId === b.batchId
                  ? "rounded-full px-5 py-2 h-auto border border-[#6E0F2D] bg-[#6E0F2D] font-semibold text-xs text-white"
                  : "rounded-full px-5 py-2 h-auto border border-[#6E0F2D] bg-transparent font-semibold text-xs text-[#6E0F2D]"
              }
            >{b.batchId}</Button>
          ))}
        </div>
      </div>

      {isLocked ? (
        /* STATE A — LOCKED */
        <>
          <div style={{ margin: "16px 20px" }}>
            <Card style={{ padding: 28, textAlign: "center" as const }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(110,15,45,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Shield size={32} color={C.burg} />
              </div>
              <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 20, color: C.text, marginBottom: 12 }}>Warp Request Locked</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 300, margin: "0 auto 20px" }}>
                You can raise a warp request only after submitting 50% of your batch. This ensures enough progress before more material is given.
              </div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 8 }}>Your current progress:</div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 12 }}>{batchProgress.done} of {batchProgress.total} sarees submitted</div>
              <ProgressBar pct={batchProgress.pct} height={12} />
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, textAlign: "right" as const, marginTop: 4, marginBottom: 16 }}>{batchProgress.pct}% complete</div>
              <div style={{ background: C.cream, borderRadius: 10, padding: "12px 16px", textAlign: "left" as const }}>
                <div style={{ fontFamily: F.u, fontSize: 13, color: C.text, lineHeight: 1.5, marginBottom: 8 }}>Reach 50% progress to unlock warp requests for this batch.</div>
                <ProgressBar pct={(batchProgress.pct / 50) * 100} height={6} />
              </div>
            </Card>
          </div>
          <div style={{ margin: "0 20px" }}>
            <Button disabled fullWidth className="h-14 bg-[#E0D5CC] border-none rounded-full font-semibold text-sm text-[#69635E]">
              <Shield size={18} /> Warp Request — Locked
            </Button>
          </div>
        </>
      ) : (
        /* STATE B — UNLOCKED */
        <>
          <div style={{ margin: "16px 20px", background: "rgba(30,102,64,0.10)", border: `1px solid ${C.green}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Check size={18} color={C.green} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.green, marginBottom: 4 }}>Warp Request Unlocked!</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>You have submitted 50% of your batch. You can now request additional raw material.</div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ margin: "0 20px 16px", textAlign: "center" as const }}>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, marginBottom: 10 }}>
              {batchProgress.done} of {batchProgress.total} sarees submitted
            </div>
            <ProgressBar pct={batchProgress.pct} height={12} />
            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, textAlign: "right" as const, marginTop: 4 }}>{batchProgress.pct}% complete</div>
          </div>

          {/* Request Form */}
          <SectionTitle title="Request Materials" />
          <div style={{ margin: isMobile ? "0 20px 16px" : "0 auto 16px", maxWidth: isMobile ? undefined : isTablet ? "80%" : 560, padding: isMobile ? undefined : "0 20px" }}>
            <Card style={{ padding: 20 }}>
              {/* Batch Reference */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 8 }}>Batch Reference</div>
                <div style={{ display: "inline-block", background: "rgba(110,15,45,0.08)", color: C.burg, borderRadius: 999, padding: "6px 16px", fontFamily: F.m, fontSize: 14 }}>{activeBatchId}</div>
              </div>

              {/* Material checkboxes */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 12 }}>What material do you need? *</div>
                {(["warp", "resham", "jari"] as const).map(mat => (
                  <label key={mat} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer", borderBottom: mat !== "jari" ? `1px solid ${C.bdr}` : "none" }}>
                    <div
                      onClick={() => setMaterials(m => ({ ...m, [mat]: !m[mat] }))} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setMaterials(m => ({ ...m, [mat]: !m[mat] })))?.(); } }}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: `2px solid ${materials[mat] ? C.burg : C.bdr}`,
                        background: materials[mat] ? C.burg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer",
                      }}>
                      {materials[mat] && <Check size={14} color="#FFF" />}
                    </div>
                    <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text }}>
                      {mat === "warp" ? "More Warp" : mat === "resham" ? "More Resham" : "More Jari"}
                    </span>
                  </label>
                ))}
              </div>

              {/* Amount fields per checked material */}
              {(["warp", "resham", "jari"] as const).filter(m => materials[m]).map(mat => (
                <div key={mat} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 6 }}>
                    {mat === "warp" ? "Warp amount (kg):" : mat === "resham" ? "Resham amount (kg) and color:" : "Jari amount (reels):"}
                  </label>
                  <Input
                    value={amounts[mat]} onChange={e => setAmounts(a => ({ ...a, [mat]: e.target.value }))}
                    placeholder={mat === "warp" ? "e.g. 3" : mat === "resham" ? "e.g. 500g Red" : "e.g. 4 reels"}
                    size="lg"
                    className="font-mono"
                    containerClassName="rounded-xl h-14"
                  />
                </div>
              ))}

              {/* Reason */}
              <div style={{ marginBottom: 4 }}>
                <label style={{ display: "block", fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 6 }}>Why do you need more material?</label>
                <Textarea
                  value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Example: Extra sarees needed for a big order"
                  rows={3}
                  className="rounded-[14px] min-h-[100px] resize-none"
                />
              </div>
            </Card>
          </div>

          <div style={{ margin: isMobile ? "0 20px" : "0 auto", maxWidth: isMobile ? undefined : isTablet ? "80%" : 560, padding: isMobile ? undefined : "0 20px", display: "flex", justifyContent: isMobile ? undefined : "flex-end" }}>
            <Button
              onClick={() => (materials.warp || materials.resham || materials.jari) ? createRequestMutation.mutate() : undefined}
              disabled={createRequestMutation.isPending || !(materials.warp || materials.resham || materials.jari)}
              className={isMobile ? "w-full h-14 bg-[#6E0F2D] border-none rounded-full font-semibold text-sm text-white disabled:opacity-60" : "w-[200px] h-14 bg-[#6E0F2D] border-none rounded-full font-semibold text-sm text-white disabled:opacity-60"}
            >
              <Send size={18} /> {createRequestMutation.isPending ? "Sending…" : "Send Warp Request"}
            </Button>
          </div>
        </>
      )}

      {/* Previous Requests */}
      <SectionTitle title="Your Previous Requests" />
      {(() => {
        const rows = myPrevRequests.map(r => ({
          id: r.id.slice(0, 8),
          material: `${r.lengthMeters}m ${r.warpType}${r.color ? ` (${r.color})` : ""}`,
          batch: r.loomNumber ?? "—",
          date: new Date(r.requestedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          status: r.status === "APPROVED" ? "✓ Approved" : r.status === "REJECTED" ? "✗ Rejected" : "⏳ Pending",
          color: r.status === "APPROVED" ? C.green : r.status === "REJECTED" ? C.crim : C.gold,
          bg: r.status === "APPROVED" ? "rgba(30,102,64,0.10)" : r.status === "REJECTED" ? "rgba(192,57,43,0.10)" : "rgba(200,155,71,0.15)",
        }));

        if (rows.length === 0) {
          return (
            <div style={{ margin: "0 20px 8px", background: C.cream, borderRadius: 14, padding: "24px 20px", textAlign: "center" as const }}>
              <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>You haven't raised any warp requests yet.</div>
            </div>
          );
        }

        if (isMobile) {
          return rows.map((r, i) => (
            <div key={i} style={{ margin: "0 20px 8px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{r.date}</div>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, marginTop: 2 }}>{r.material}</div>
              </div>
              <StatusBadge label={r.status} color={r.color} bg={r.bg} />
            </div>
          ));
        }
        const warpColumns: ColumnDef<(typeof rows)[number]>[] = [
          { id: "id", header: "Request ID", accessor: r => r.id, cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>{r.id}</span> },
          { id: "material", header: "Material", accessor: r => r.material, cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>{r.material}</span> },
          { id: "batch", header: "Loom", accessor: r => r.batch, cell: (_v, r) => <span style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{r.batch}</span> },
          { id: "status", header: "Status", accessor: r => r.status, cell: (_v, r) => <StatusBadge label={r.status} color={r.color} bg={r.bg} /> },
          { id: "date", header: "Date", accessor: r => r.date, cell: (_v, r) => <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{r.date}</span> },
        ];
        return (
          <div style={{ margin: "0 20px 8px", background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 12, overflowX: isTablet ? "auto" : "hidden" }}>
            <div style={{ minWidth: isTablet ? 640 : undefined }}>
              <DataTable columns={warpColumns} data={rows} getRowId={r => r.id} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── PAGE 05 — PAYMENT LEDGER ─────────────────────────────────────────────
