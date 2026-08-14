import React from "react";
import { motion } from "motion/react";
import { Check, X, Settings } from "lucide-react";
import { T, F } from "./tokens";
import { GreenBtn, CrimsonBtn } from "./SharedUI";

import { BackendRateChangeRequest, rateRequestsApi } from "../../../../shared/api/rateRequests";
import { toast } from "sonner";
import { rupees, formatMoney } from "@/lib/domain/money";

// ─── Rate Card ────────────────────────────────────────────────────────────────
export function RateCard({ item, onAction }: { item: BackendRateChangeRequest; onAction: (id: string) => void }) {
  const handleApprove = async () => {
    try {
      await rateRequestsApi.approve(item.id);
      toast.success(`Approved rate change for ${item.sareeTypeCode}`);
      onAction(item.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve rate change");
    }
  };

  const handleReject = async () => {
    try {
      await rateRequestsApi.reject(item.id);
      toast.success(`Rejected rate change for ${item.sareeTypeCode}`);
      onAction(item.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject rate change");
    }
  };

  const diff = Number(item.newMakingCharge) - Number(item.oldMakingCharge);
  const diffLabel = formatMoney(rupees(diff), { sign: true });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      style={{
        background: "#FFF", borderRadius: 16,
        border: "1px solid " + T.borderDef,
        borderLeft: "4px solid " + T.royalBurgundy,
        boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
        padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Settings size={16} color={T.royalBurgundy} />
          <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
            Rate Change Request ({item.id})
          </span>
        </div>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe,
          background: T.cream, borderRadius: 6, padding: "4px 10px",
        }}>
          {new Date(item.createdAt).toLocaleDateString("en-IN")}
        </span>
      </div>

      {/* Status strip */}
      <div style={{
        background: "rgba(110,15,45,0.07)", borderRadius: 8, padding: "7px 12px",
        fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: T.taupe,
      }}>
        Admin has requested a rate change. Review and approve or reject.
      </div>

      {/* Saree type */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Saree Type:</span>
        <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>
          {item.sareeType?.type || item.sareeTypeCode} <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>({item.sareeTypeCode})</span>
        </span>
      </div>

      {/* Rate comparison */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Current rate box */}
        <div style={{
          flex: 1, background: T.crimsonBg, borderRadius: 10, padding: "12px 16px",
          border: "1px solid rgba(192,57,43,0.15)", textAlign: "center",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.crimson, marginBottom: 4, letterSpacing: 1 }}>
            CURRENT RATE
          </div>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.crimson }}>
            {formatMoney(rupees(Number(item.oldMakingCharge)))}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ fontFamily: F.display, fontSize: 20, color: T.antiqueGold, flexShrink: 0 }}>→</div>

        {/* Requested rate box */}
        <div style={{
          flex: 1, background: T.greenBg, borderRadius: 10, padding: "12px 16px",
          border: "1px solid rgba(30,102,64,0.15)", textAlign: "center",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.green, marginBottom: 4, letterSpacing: 1 }}>
            REQUESTED RATE
          </div>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.green }}>
            {formatMoney(rupees(Number(item.newMakingCharge)))}
          </div>
        </div>
      </div>

      {/* Diff */}
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
        Difference: <strong style={{ color: diff >= 0 ? T.green : T.crimson }}>{diffLabel}</strong> per saree
      </div>

      {/* Reason */}
      {item.reason && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Reason given:</span>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, fontStyle: "italic" }}>
            "{item.reason}"
          </span>
        </div>
      )}

      {/* Requested by */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Requested by:</span>
        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown }}>{item.requestedBy?.firstName} {item.requestedBy?.lastName}</span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <GreenBtn className="flex-1" onClick={handleApprove}>
          <Check size={14} /> Approve Rate Change
        </GreenBtn>
        <CrimsonBtn className="flex-1" onClick={handleReject}>
          <X size={14} /> Reject
        </CrimsonBtn>
      </div>
    </motion.div>
  );
}
