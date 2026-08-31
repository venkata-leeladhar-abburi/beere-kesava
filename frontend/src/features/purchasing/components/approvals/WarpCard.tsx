import { motion } from "motion/react";
import { Check, X, Package } from "lucide-react";
import { T, F } from "./tokens";
import { GreenBtn, CrimsonBtn } from "./SharedUI";

import { BackendWarpRequest, warpRequestsApi } from "../../../../shared/api/warpRequests";
import { toast } from "sonner";

// ─── Warp Card ────────────────────────────────────────────────────────────────
export function WarpCard({ item, onAction }: { item: BackendWarpRequest; onAction: (id: string) => void }) {
  const handleApprove = async () => {
    try {
      await warpRequestsApi.approve(item.id);
      toast.success(`Approved warp request ${item.id}`);
      onAction(item.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve warp request");
    }
  };

  const handleReject = async () => {
    try {
      await warpRequestsApi.reject(item.id);
      toast.success(`Rejected warp request ${item.id}`);
      onAction(item.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject warp request");
    }
  };

  const name = item.weaver?.name || "Weaver";
  const initials = item.weaver?.initials || name.slice(0, 2).toUpperCase();

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
        borderLeft: "4px solid " + T.green,
        boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
        padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      {/* Top row: avatar + name + batch */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid " + T.borderGold, display: "flex", alignItems: "center", justifyContent: "center", background: T.cream, fontFamily: F.display, fontSize: 16, fontWeight: 700, color: T.royalBurgundy }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
              {name}
            </div>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy,
              background: "rgba(110,15,45,0.07)", borderRadius: 5, padding: "2px 7px",
            }}>
              {item.id}
            </span>
          </div>
        </div>
        {item.loomNumber && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe,
            background: T.cream, borderRadius: 6, padding: "4px 10px",
          }}>
            Loom {item.loomNumber}
          </span>
        )}
      </div>

      {/* Raised chip */}
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe,
        background: T.cream, borderRadius: 6, padding: "4px 10px", alignSelf: "flex-start",
      }}>
        Requested: {new Date(item.requestedAt).toLocaleDateString("en-IN")}
      </span>

      {/* Material */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={15} color={T.taupe} />
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Material Requested:</span>
          <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.luxuryBrown }}>{item.warpType} ({item.lengthMeters}m)</span>
        </div>
        {item.notes && (
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic", paddingLeft: 24 }}>
            {item.notes}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 mt-2 w-full flex-nowrap min-w-0">
        <GreenBtn className="flex-[1.4] min-w-0 px-2 text-[12px] whitespace-nowrap justify-center" onClick={handleApprove}>
          <Check size={14} /> Approve
        </GreenBtn>
        <CrimsonBtn className="flex-1 min-w-0 px-2 text-[12px] whitespace-nowrap justify-center" onClick={handleReject}>
          <X size={14} /> Reject
        </CrimsonBtn>
      </div>
    </motion.div>
  );
}
