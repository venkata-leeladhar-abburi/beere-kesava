import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { PurchaseOrder } from "../../contexts/POContext";
import { PurchaseRequest } from "@/features/suppliers";
import { T, F } from "./tokens";
import { BulkActionStrip, EmptyState } from "./SharedUI";
import { Button } from "../../../../shared/ui/primitives";
import { POCard, POListItem } from "./POCard";
import { WarpCard } from "./WarpCard";
import { RateCard } from "./RateCard";

type POItem = POListItem;

// ─── 3. TABS NAV ─────────────────────────────────────────────────────────────
export function TabsNav({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: { key: "po" | "warp" | "rate"; label: string; count: number }[];
  activeTab: "po" | "warp" | "rate";
  setActiveTab: (t: "po" | "warp" | "rate") => void;
}) {
  return (
    <div className="px-4 md:px-7 xl:px-14" style={{
      position: "relative", zIndex: 10,
      background: "#FFF",
      borderBottom: "1px solid " + T.borderDef,
      marginTop: 32,
      display: "flex", alignItems: "center",
      overflowX: "auto", WebkitOverflowScrolling: "touch",
    }}>
      <div style={{ display: "flex", alignItems: "center", minWidth: "max-content" }}>
      {tabs.map(tab => (
        <Button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          variant={activeTab === tab.key ? "primary" : "tertiary"} size="md"
          className={"rounded-none border-b-2 " + (activeTab === tab.key ? "border-b-[var(--bk-gold-500,#C89B47)]" : "border-b-transparent")}
        >
          {tab.label}
          <span style={{
            background: activeTab === tab.key ? "rgba(255,255,255,0.20)" : T.cream,
            color: activeTab === tab.key ? "#FFF" : T.taupe,
            borderRadius: 10, padding: "1px 7px", fontSize: 12,
          }}>
            {tab.count}
          </span>
        </Button>
      ))}
      </div>
    </div>
  );
}

// ─── 4. TAB CONTENT ───────────────────────────────────────────────────────────
import { useQueryClient } from "@tanstack/react-query";
import { BackendWarpRequest } from "../../../../shared/api/warpRequests";
import { BackendRateChangeRequest } from "../../../../shared/api/rateRequests";
import { removeFromEnvelopeWhere } from "../../../../lib/cacheUpdates";

// ─── 4. TAB CONTENT ───────────────────────────────────────────────────────────
export function TabContent({
  activeTab,
  combinedPOList,
  contextPendingItems,
  pos,
  warpList,
  rateList,
  allEmpty,
  approvePO,
  rejectPO,
  setViewDocPOId,
}: {
  activeTab: "po" | "warp" | "rate";
  combinedPOList: POItem[];
  contextPendingItems: { id: string }[];
  pos: PurchaseOrder[];
  pendingRequests: PurchaseRequest[];
  warpList: BackendWarpRequest[];
  rateList: BackendRateChangeRequest[];
  allEmpty: boolean;
  approvePO: (id: string) => void;
  rejectPO: (id: string) => void;
  setViewDocPOId: (id: string | null) => void;
  // See ApprovalsPage.tsx's decideExternal — mirrors SupplierContext's
  // out-of-scope decideRequest signature, kept as a local literal union.
  decideExternal: (id: string, status: "approved" | "rejected") => void;
  setWarpList?: React.Dispatch<React.SetStateAction<BackendWarpRequest[]>>;
  setRateList?: React.Dispatch<React.SetStateAction<BackendRateChangeRequest[]>>;
}) {
  const queryClient = useQueryClient();
  // WarpCard/RateCard already pass the id of the request they just decided —
  // it was being discarded. Both lists are PENDING-only, so a decided request
  // has left them: dropping it here retires the card on the click instead of
  // leaving it sitting there, still offering Approve/Reject, until the refetch
  // lands. The invalidate still follows and reconciles (it matches by prefix,
  // so the weavers-page and all-weavers pending counts refresh with it).
  const handleWarpAction = (id: string) => {
    removeFromEnvelopeWhere<BackendWarpRequest>(queryClient, ["warp-requests-pending"], r => r.id === id);
    void queryClient.invalidateQueries({ queryKey: ["warp-requests-pending"] });
  };
  const handleRateAction = (id: string) => {
    removeFromEnvelopeWhere<BackendRateChangeRequest>(queryClient, ["rate-requests-pending"], r => r.id === id);
    void queryClient.invalidateQueries({ queryKey: ["rate-requests-pending"] });
  };
  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32 }}>
      <AnimatePresence mode="wait">
        {/* — Purchase Orders — */}
        {activeTab === "po" && (
          <motion.div
            key="po"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {combinedPOList.length === 0 ? (
              <EmptyState message="No pending purchase orders" />
            ) : (
              <>
                <BulkActionStrip
                  count={combinedPOList.length}
                  noun="purchase orders"
                  onApproveAll={() => contextPendingItems.forEach(p => approvePO(p.id))}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <AnimatePresence>
                    {combinedPOList.map(item => (
                      <POCard
                        key={item.id}
                        item={item}
                        onAction={() => {}}
                        onApprove={id => approvePO(id)}
                        onReject={id => rejectPO(id)}
                        onViewDoc={pos.some(p => p.id === item.id) ? (id) => setViewDocPOId(id) : undefined}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* — Warp Requests — */}
        {activeTab === "warp" && (
          <motion.div
            key="warp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {warpList.length === 0 ? (
              <EmptyState message="No pending warp requests" />
            ) : (
              <>
                <BulkActionStrip
                  count={warpList.length}
                  noun="warp requests"
                  onApproveAll={() => void queryClient.invalidateQueries({ queryKey: ["warp-requests-pending"] })}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <AnimatePresence>
                    {warpList.map(item => (
                      <WarpCard
                        key={item.id}
                        item={item}
                        onAction={handleWarpAction}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* — Rate Changes — */}
        {activeTab === "rate" && (
          <motion.div
            key="rate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {rateList.length === 0 ? (
              <EmptyState message="No pending rate change requests" />
            ) : (
              <>
                <BulkActionStrip
                  count={rateList.length}
                  noun="rate change requests"
                  onApproveAll={() => void queryClient.invalidateQueries({ queryKey: ["rate-requests-pending"] })}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <AnimatePresence>
                    {rateList.map(item => (
                      <RateCard
                        key={item.id}
                        item={item}
                        onAction={handleRateAction}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* All-empty state */}
      {allEmpty && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "#FFF", borderRadius: 16,
            border: "1px solid " + T.borderDef,
            boxShadow: "0 2px 12px rgba(44,24,16,0.07)",
            padding: "48px 24px", marginTop: 24,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
          }}
        >
          <Check size={64} color={T.green} strokeWidth={1.5} />
          <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600, color: T.luxuryBrown }}>
            All caught up!
          </span>
          <span className="max-w-[400px]" style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, textAlign: "center", lineHeight: 1.6 }}>
            There are no pending approvals right now. All purchase orders, warp requests, and rate changes have been actioned.
          </span>
        </motion.div>
      )}
    </div>
  );
}
