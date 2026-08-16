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
import { ExternalPurchaseCard } from "./ExternalPurchaseCard";

type POItem = POListItem;

// ─── 3. TABS NAV ─────────────────────────────────────────────────────────────
export function TabsNav({
  tabs,
  activeTab,
  setActiveTab,
}: {
  tabs: { key: "po" | "ext" | "warp" | "rate"; label: string; count: number }[];
  activeTab: "po" | "ext" | "warp" | "rate";
  setActiveTab: (t: "po" | "ext" | "warp" | "rate") => void;
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

// ─── 4. TAB CONTENT ───────────────────────────────────────────────────────────
export function TabContent({
  activeTab,
  combinedPOList,
  contextPendingItems,
  pos,
  pendingRequests,
  warpList,
  rateList,
  allEmpty,
  approvePO,
  rejectPO,
  setViewDocPOId,
  decideExternal,
}: {
  activeTab: "po" | "ext" | "warp" | "rate";
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
  const handleWarpAction = () => {
    void queryClient.invalidateQueries({ queryKey: ["warp-requests-pending"] });
  };
  const handleRateAction = () => {
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

        {/* — External Purchase Requests — */}
        {activeTab === "ext" && (
          <motion.div
            key="ext"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {pendingRequests.length === 0 ? (
              <EmptyState message="No pending external purchase requests" />
            ) : (
              <>
                <BulkActionStrip
                  count={pendingRequests.length}
                  noun="external purchase requests"
                  onApproveAll={() => pendingRequests.forEach(r => decideExternal(r.id, "approved"))}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <AnimatePresence>
                    {pendingRequests.map(req => (
                      <ExternalPurchaseCard
                        key={req.id}
                        req={req}
                        onApprove={id => decideExternal(id, "approved")}
                        onReject={id => decideExternal(id, "rejected")}
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
                  onApproveAll={handleWarpAction}
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
                  onApproveAll={handleRateAction}
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
