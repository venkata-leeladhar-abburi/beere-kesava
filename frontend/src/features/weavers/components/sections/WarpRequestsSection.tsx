// ── Warp requests approval section ─────────────────────────────────────────
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, XOctagon } from "lucide-react";
import { Package, CheckCircle2 as CheckCircle, XCircle, Clock, AlertCircle as WarningCircle } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, ActionDialog, SectionCard } from "../common/primitives";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { warpRequestsApi, BackendWarpRequest } from "../../../../shared/api/warpRequests";
import { Button, Textarea } from "../../../../shared/ui/primitives";

export function WarpRequestsSection() {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<{ type: "approve" | "reject"; req: BackendWarpRequest } | null>(null);
  // The rejection reason was collected in the dialog and then dropped on the
  // floor — PATCH /warp-requests/:id/reject has always accepted `notes`.
  const [rejectReason, setRejectReason] = useState("");

  const { data: res, isLoading } = useQuery({
    queryKey: ["warp-requests-pending"],
    queryFn: () => warpRequestsApi.list("PENDING"),
  });
  const requests = res?.items ?? [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => warpRequestsApi.approve(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["warp-requests-pending"] });
      setDecision(null);
      toast.success("Warp request approved");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to approve warp request");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      warpRequestsApi.reject(id, undefined, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["warp-requests-pending"] });
      setDecision(null);
      setRejectReason("");
      toast.success("Warp request rejected");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to reject warp request");
    },
  });
  return (
    <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 36 }}>
      <FadeUp>

      <SectionCard
        icon={WarningCircle}
        title="Warp Requests Waiting for Approval"
        subtitle="Review each weaver's progress and material need before approving"
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(192,57,43,0.30)", border: "1px solid rgba(192,57,43,0.45)", borderRadius: 10, padding: "8px 16px" }}>
            <Clock size={18} color="#F4A6A6" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "#F4A6A6", letterSpacing: "0.3px" }}>{requests.length} request{requests.length === 1 ? "" : "s"} pending</span>
          </div>
        }
      >
          {isLoading ? (
            <div style={{ padding: "16px 0", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Loading warp requests…</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: "16px 0", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>No warp requests waiting for approval.</div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: 22, alignItems: "stretch" }}>
            {requests.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ y: -4, boxShadow: "0 20px 52px rgba(74,6,27,0.14)" }}
                style={{ background: "#FFFDF9", borderRadius: 12, border: `1.5px solid ${T.antiqueGold}`, boxShadow: "0 4px 20px rgba(200,155,71,0.15)", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}
              >
                {/* Accent top */}
                <div style={{ height: 4, background: T.royalBurgundy, width: "100%", flexShrink: 0 }} />

                {/* Weaver identity */}
                <div style={{ padding: "20px 22px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `3px solid ${T.antiqueGold}`, display: "flex", alignItems: "center", justifyContent: "center", background: T.royalBurgundy, fontFamily: F.display, fontSize: 22, fontWeight: 700, color: "#FFF" }}>
                    {r.weaver.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{r.weaver.name}</div>
                    {r.weaver.village && <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px", marginBottom: 3 }}>{r.weaver.village}</div>}
                    {r.loomNumber && <div style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 7, padding: "3px 10px" }}>Loom {r.loomNumber}</div>}
                  </div>
                </div>

                {/* Info rows */}
                <div style={{ padding: "8px 22px 18px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

                  {/* Raised */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Clock size={20} color={T.royalBurgundy} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Request raised</div>
                      <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{new Date(r.requestedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                    </div>
                  </div>

                  {/* Material */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Package size={20} color={T.royalBurgundy} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Material requested</div>
                      <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginBottom: 2 }}>{r.warpType} · {r.lengthMeters}m{r.color ? ` · ${r.color}` : ""}</div>
                      {r.notes && <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.45 }}>{r.notes}</div>}
                    </div>
                  </div>

                </div>

                {/* Action buttons */}
                <div style={{ padding: "18px 22px 22px", display: "flex", gap: 12 }}>
                  <Button
                    onClick={() => setDecision({ type: "approve", req: r })}
                    variant="primary"
                    className="flex-1 rounded-xl bg-[#1F774E] hover:bg-[#15603D] shadow-none"
                  >
                    <CheckCircle size={22} />
                    Approve
                  </Button>
                  <Button
                    onClick={() => setDecision({ type: "reject", req: r })}
                    variant="danger-subtle"
                    className="flex-1 rounded-xl"
                  >
                    <XCircle size={22} />
                    Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          )}

      </SectionCard>
      </FadeUp>
      <AnimatePresence>
        {decision && (
          <ActionDialog open={!!decision} title={decision.type === "approve" ? "Approve warp request" : "Reject warp request"} tone={decision.type === "approve" ? "green" : "red"} onClose={() => { setDecision(null); setRejectReason(""); }}>
            <div style={{ fontFamily: F.ui, color: T.luxuryBrown, fontSize: 16, lineHeight: 1.65 }}>
              {decision.type === "approve" ? <Check size={32} color={T.green} /> : <XOctagon size={32} color={T.crimson} />}
              Confirm {decision.type} for <b>{decision.req.weaver?.name || decision.req.weaverId}</b> ({decision.req.id}) requesting <b>{decision.req.warpType} ({decision.req.lengthMeters}m)</b> {decision.req.loomNumber ? `for Loom ${decision.req.loomNumber}` : ""}.
            </div>
            {decision.type === "reject" && (
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection"
                className="mt-[18px] min-h-[94px]"
              />
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 22 }}>
              <Button onClick={() => { setDecision(null); setRejectReason(""); }} variant="secondary" className="rounded-xl">Cancel</Button>
              <Button
                disabled={approveMutation.isPending || rejectMutation.isPending}
                loading={approveMutation.isPending || rejectMutation.isPending}
                onClick={() => {
                  if (decision.type === "approve") {
                    approveMutation.mutate(decision.req.id);
                  } else {
                    rejectMutation.mutate({ id: decision.req.id, notes: rejectReason.trim() || undefined });
                  }
                }}
                variant={decision.type === "approve" ? "primary" : "danger"}
                className={decision.type === "approve" ? "rounded-xl bg-[#1F774E] hover:bg-[#15603D]" : "rounded-xl"}
              >
                {decision.type === "approve" ? "Approve & issue material" : "Reject request"}
              </Button>
            </div>
          </ActionDialog>
        )}
      </AnimatePresence>
    </div>
  );
}
