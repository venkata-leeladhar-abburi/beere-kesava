// ── Warp requests approval section ─────────────────────────────────────────
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, XOctagon } from "lucide-react";
import { Package, CheckCircle, XCircle, Clock, WarningCircle, ChartBar } from "@phosphor-icons/react";
import { T, F } from "../theme";
import { WARP_REQUESTS } from "../data";
import { FadeUp, ActionDialog } from "../common/primitives";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warpRequestsApi, BackendWarpRequest } from "../../../../shared/api/warpRequests";

export function WarpRequestsSection() {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<{ type: "approve" | "reject"; req: BackendWarpRequest } | null>(null);

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
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => warpRequestsApi.reject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["warp-requests-pending"] });
      setDecision(null);
    },
  });
  return (
    <div style={{ padding: "36px 48px 0" }}>
      <FadeUp>

        {/* ── Section wrapper ── */}
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: `1px solid rgba(192,57,43,0.16)`, boxShadow: "0 6px 32px rgba(74,6,27,0.09)", overflow: "hidden" }}>

          {/* Header bar */}
          <div style={{ background: `linear-gradient(100deg, #3D0E1A 0%, #6E0F2D 100%)`, padding: "22px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <WarningCircle size={26} color="#FFFDF9" weight="fill" />
              </div>
              <div>
                <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, color: "#FFFDF9", letterSpacing: "-0.2px" }}>Warp Requests Waiting for Approval</div>
                <div style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>Review each weaver's progress and material need before approving</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(192,57,43,0.30)", border: "1px solid rgba(192,57,43,0.45)", borderRadius: 10, padding: "8px 16px" }}>
              <Clock size={18} color="#F4A6A6" weight="fill" />
              <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 600, color: "#F4A6A6", letterSpacing: "0.3px" }}>3 requests pending</span>
            </div>
          </div>

          {/* Cards grid */}
          <div style={{ padding: "28px 28px 28px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, alignItems: "stretch" }}>
            {WARP_REQUESTS.map((r, idx) => (
              <motion.div
                key={r.code}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ y: -4, boxShadow: "0 20px 52px rgba(74,6,27,0.14)" }}
                style={{ background: T.warmIvory, borderRadius: 18, border: `1px solid rgba(110,15,45,0.12)`, boxShadow: "0 4px 18px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                {/* Gold accent top */}
                <div style={{ height: 4, background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`, flexShrink: 0 }} />

                {/* Weaver identity */}
                <div style={{ padding: "22px 22px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `3px solid ${T.antiqueGold}` }}>
                    <img src={r.photo} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{r.name}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px", marginBottom: 3 }}>{r.code}</div>
                    <div style={{ display: "inline-block", fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 7, padding: "3px 10px" }}>{r.batch}</div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(110,15,45,0.08)", margin: "0 22px" }} />

                {/* Info rows */}
                <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

                  {/* Raised */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Clock size={20} color={T.royalBurgundy} weight="regular" />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Request raised</div>
                      <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>{r.raised}</div>
                    </div>
                  </div>

                  {/* Material */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Package size={20} color={T.royalBurgundy} weight="regular" />
                    </div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 3 }}>Material requested</div>
                      <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, marginBottom: 2 }}>{r.material}</div>
                      <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, lineHeight: 1.45 }}>{r.reason}</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ChartBar size={20} color={T.royalBurgundy} weight="regular" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.6px", textTransform: "uppercase", marginBottom: 6 }}>Batch progress</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                        <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{r.done} of {r.total} sarees done</div>
                        <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.antiqueGold }}>{r.pct}%</div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 10, background: "rgba(110,15,45,0.09)", borderRadius: 99, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${r.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.2 + idx * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                          style={{ height: "100%", background: `linear-gradient(90deg, ${T.antiqueGold}, ${T.goldLight})`, borderRadius: 99 }}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(110,15,45,0.08)", margin: "0 22px" }} />

                {/* Action buttons */}
                <div style={{ padding: "18px 22px 22px", display: "flex", gap: 12 }}>
                  <motion.button
                    onClick={() => setDecision({ type: "approve", req: r })}
                    whileHover={{ scale: 1.02, backgroundColor: "#145230" }}
                    whileTap={{ scale: 0.97 }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: T.green, color: "#FFFFFF", border: "none", borderRadius: 12, padding: "14px 12px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >
                    <CheckCircle size={22} weight="fill" />
                    Approve
                  </motion.button>
                  <motion.button
                    onClick={() => setDecision({ type: "reject", req: r })}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(192,57,43,0.08)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: T.crimson, background: "rgba(192,57,43,0.05)", border: `1.5px solid rgba(192,57,43,0.30)`, borderRadius: 12, padding: "14px 12px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >
                    <XCircle size={22} weight="fill" />
                    Reject
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </FadeUp>
      <AnimatePresence>
        {decision && (
          <ActionDialog open={!!decision} title={decision.type === "approve" ? "Approve warp request" : "Reject warp request"} tone={decision.type === "approve" ? "green" : "red"} onClose={() => setDecision(null)}>
            <div style={{ fontFamily: F.ui, color: T.luxuryBrown, fontSize: 16, lineHeight: 1.65 }}>
              {decision.type === "approve" ? <Check size={32} color={T.green} /> : <XOctagon size={32} color={T.crimson} />}
              Confirm {decision.type} for <b>{decision.req.weaver?.name || decision.req.weaverId}</b> ({decision.req.id}) requesting <b>{decision.req.warpType} ({decision.req.lengthMeters}m)</b> {decision.req.loomNumber ? `for Loom ${decision.req.loomNumber}` : ""}.
            </div>
            {decision.type === "reject" && <textarea placeholder="Reason for rejection" style={{ marginTop: 18, width: "100%", minHeight: 94, border: `1.5px solid ${T.borderDef}`, borderRadius: 12, padding: 14, fontFamily: F.ui }} />}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 22 }}>
              <button onClick={() => setDecision(null)} style={{ padding: "12px 18px", borderRadius: 12, border: `1px solid ${T.borderDef}`, background: "#fff", color: T.taupe, fontFamily: F.ui, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button
                disabled={approveMutation.isPending || rejectMutation.isPending}
                onClick={() => {
                  if (decision.type === "approve") {
                    approveMutation.mutate(decision.req.id);
                  } else {
                    rejectMutation.mutate(decision.req.id);
                  }
                }}
                style={{ padding: "12px 22px", borderRadius: 12, border: "none", background: decision.type === "approve" ? T.green : T.crimson, color: "#fff", fontFamily: F.ui, fontWeight: 700, cursor: "pointer" }}
              >
                {decision.type === "approve" ? "Approve & issue material" : "Reject request"}
              </button>
            </div>
          </ActionDialog>
        )}
      </AnimatePresence>
    </div>
  );
}
