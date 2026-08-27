import { Layers, RotateCcw } from "lucide-react";
import { Modal } from "@/shared/ui/overlay/Modal";
import { Money } from "@/shared/ui/domain";
import { rupees } from "@/lib/domain/money";
import { useRatesPricing } from "@/features/pricing";
import type { MyBatchEntry } from "./WeaverMobileBatchCard";

const C = {
  burg: "#6E0F2D", gold: "#C89B47", green: "#1E6640",
  crim: "#C0392B", text: "#3B2314", muted: "#69635E",
  bdr: "rgba(110,15,45,0.10)", cream: "#F7F2EA",
};
const F = {
  d: "'Plus Jakarta Sans', sans-serif",
  u: "'Inter', sans-serif",
  m: "'JetBrains Mono', monospace",
};

/**
 * Weaver-facing saree list for a batch. Deliberately excludes tally fields
 * (tallied/talliedByName/receivedWarpG/etc.) — that per-saree admin
 * verification belongs to production's BatchTallyPage, not the weaver
 * portal. Weavers only need to see which sarees are theirs and each one's
 * current stage.
 */
function sareeStage(r: MyBatchEntry["myRows"][number]): { label: string; color: string; bg: string } {
  if (r.awaitingRework) return { label: "Rework Needed", color: C.gold, bg: "rgba(200,155,71,0.12)" };
  if (r.qcPassed === true || r.finished === true) return { label: "Produced", color: C.green, bg: "rgba(30,102,64,0.10)" };
  if (r.qcResult === "defective") return { label: "QC Failed", color: C.crim, bg: "rgba(192,57,43,0.10)" };
  if (r.receivedAt) return { label: "Received — Awaiting QC", color: "#1D4ED8", bg: "rgba(29,78,216,0.10)" };
  if (r.sareeId) return { label: "In Progress", color: C.muted, bg: "rgba(139,112,96,0.10)" };
  return { label: "Not Started", color: C.muted, bg: "rgba(139,112,96,0.07)" };
}

export function WeaverBatchSareesModal({
  batch,
  open,
  onOpenChange,
}: {
  batch: MyBatchEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rows = batch?.myRows ?? [];
  const { getSareeTypeByCode } = useRatesPricing();

  // Only a produced (QC-passed or finished) saree has actually earned its
  // making charge — a saree still in progress or reworking hasn't yet.
  const producedRows = rows.filter(r => r.qcPassed === true || r.finished === true);
  const totalEarned = producedRows.reduce((sum, r) => {
    const charge = r.sareeTypeCode ? getSareeTypeByCode(r.sareeTypeCode)?.charge : undefined;
    return sum + (charge ? Number(charge) : 0);
  }, 0);

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg">
      <Modal.Header
        title={batch ? `Batch ${batch.batchId}` : "Batch"}
        subtitle={`${rows.length} saree${rows.length !== 1 ? "s" : ""} assigned to you`}
      />
      <Modal.Body>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, paddingBottom: 8 }}>
          {rows.length === 0 && (
            <div style={{ padding: "32px 0", textAlign: "center" as const, fontFamily: F.u, fontSize: 14, color: C.muted }}>
              No sarees assigned to you in this batch yet.
            </div>
          )}
          {rows.map((r, i) => {
            const stage = sareeStage(r);
            const charge = r.sareeTypeCode ? getSareeTypeByCode(r.sareeTypeCode)?.charge : undefined;
            return (
              <div
                key={r.sareeId ?? `pending-${i}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: "14px 16px", borderRadius: 14, border: `1px solid ${C.bdr}`, background: C.cream,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(110,15,45,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Layers size={16} color={C.burg} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 14, color: C.text }}>
                      {r.sareeId ?? "ID pending"}
                    </div>
                    <div style={{ fontFamily: F.u, fontSize: 12.5, color: C.muted, marginTop: 2 }}>
                      {r.sareeTypeName ?? "Saree type not set"}
                      {r.designCode ? ` · ${r.designCode}` : ""}
                      {r.bulkOrderLabel ? ` · ${r.bulkOrderLabel}` : " · General Stock"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                  <span
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontFamily: F.u, fontWeight: 600, fontSize: 12, color: stage.color,
                      background: stage.bg, borderRadius: 999, padding: "5px 12px", whiteSpace: "nowrap" as const,
                    }}
                  >
                    {r.awaitingRework && <RotateCcw size={11} color={stage.color} />}
                    {stage.label}
                  </span>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, whiteSpace: "nowrap" as const }}>
                    {charge ? <Money value={rupees(Number(charge))} /> : "—"} making charge
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {rows.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            marginTop: 4, padding: "14px 16px", borderRadius: 14,
            background: "rgba(200,155,71,0.10)", border: "1px solid rgba(200,155,71,0.25)",
          }}>
            <div>
              <div style={{ fontFamily: F.m, fontSize: 11, color: C.gold, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Earned so far</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{producedRows.length} of {rows.length} produced sarees</div>
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold }}>
              <Money value={rupees(totalEarned)} />
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
