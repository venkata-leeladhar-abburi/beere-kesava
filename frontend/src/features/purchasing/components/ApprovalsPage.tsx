import React, { useState } from "react";
import { usePO } from "../contexts/POContext";
import { useSuppliers } from "@/features/suppliers";
import { PODocumentModal } from "./PODocumentModal";
import { toast } from "sonner";

import { T, F } from "./approvals/tokens";
import { ApprovalsHeader } from "./approvals/ApprovalsHeader";
import { StatsStrip } from "./approvals/StatsStrip";
import { TabsNav, TabContent } from "./approvals/TabContent";
import { HistorySection } from "./approvals/HistorySection";

import { useQuery } from "@tanstack/react-query";
import { warpRequestsApi } from "../../../shared/api/warpRequests";
import { rupees, formatMoney } from "@/lib/domain/money";
import { rateRequestsApi } from "../../../shared/api/rateRequests";
import { Button } from "../../../shared/ui/primitives";
import { LoadingState } from "../../../shared/ui/state";

// ─── Main component ───────────────────────────────────────────────────────────
export function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"po" | "ext" | "warp" | "rate">("po");
  const [histFilter, setHistFilter] = useState("All History");
  const [histPeriod, setHistPeriod] = useState("This Month");
  const [viewDocPOId, setViewDocPOId] = useState<string | null>(null);

  const { data: warpRes, isError: warpError, isLoading: warpLoading, refetch: refetchWarp } = useQuery({
    queryKey: ["warp-requests-pending"],
    queryFn: () => warpRequestsApi.list("PENDING"),
  });
  const warpList = warpRes?.items ?? [];

  const { data: rateRes, isError: rateError, isLoading: rateLoading, refetch: refetchRate } = useQuery({
    queryKey: ["rate-requests-pending"],
    queryFn: () => rateRequestsApi.list("PENDING"),
  });
  const rateList = rateRes?.items ?? [];

  const { pos, approvePO, rejectPO, isError: poError, isLoading: poLoading, refetch: refetchPO } = usePO();
  const hasApprovalsError = warpError || rateError || poError;
  const isLoading = warpLoading || rateLoading || poLoading;
  const refetchAll = () => { void refetchWarp(); void refetchRate(); void refetchPO(); };
  const { requests, decideRequest } = useSuppliers();
  const pendingRequests = requests.filter(r => r.status === "pending");

  // Mirrors SupplierContext.decideRequest's own "approved" | "rejected"
  // param type (features/suppliers, out of this pass's scope) — both values
  // already match DOCUMENT_STATUS's canonical spelling, but widening this to
  // DocumentStatus would stop type-checking against that out-of-scope
  // function's narrower signature, so it stays a local 2-value literal union.
  const decideExternal = (id: string, status: "approved" | "rejected") => {
    decideRequest(id, status, "Superadmin");
    const req = requests.find(r => r.id === id);
    toast[status === "approved" ? "success" : "info"](
      status === "approved"
        ? `Approved — external purchase created for ${req?.supplierName ?? "supplier"}`
        : `Rejected the purchase request from ${req?.supplierName ?? "supplier"}`
    );
  };

  // Purchase Orders tab now renders exclusively from the real backend
  // (PurchaseOrdersContext, GET /purchase-orders) filtered to PENDING.
  const contextPendingItems = pos
    .filter(p => p.status === "pending")
    .map(p => ({
      id: p.id,
      raised: new Date(p.submittedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      vendor: p.vendor,
      vendorCity: p.vendorCity,
      materials: p.materials.map(m => ({ label: `${m.materialType}${m.subtype ? ` ${m.subtype}` : ""}`, qty: `${m.quantity} ${m.unit}`, icon: "pkg" })),
      estimated: formatMoney(rupees(p.totalValue ?? 0)),
      stock: "",
      raisedBy: p.raisedBy,
      notesAdmin: p.notesAdmin,
      urgency: p.urgency,
      totalValue: p.totalValue,
    }));
  const combinedPOList = contextPendingItems;

  // Find PO for document view
  const viewDocPO = viewDocPOId
    ? pos.find(p => p.id === viewDocPOId) ?? null
    : null;

  const allEmpty = combinedPOList.length === 0 && warpList.length === 0 && rateList.length === 0 && pendingRequests.length === 0;

  const tabs: { key: "po" | "ext" | "warp" | "rate"; label: string; count: number }[] = [
    { key: "po",   label: "Purchase Orders",   count: combinedPOList.length },
    { key: "ext",  label: "External Purchases", count: pendingRequests.length },
    { key: "warp", label: "Warp Requests",     count: warpList.length },
    { key: "rate", label: "Rate Changes",      count: rateList.length },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>

      <ApprovalsHeader />

      <StatsStrip
        totalPending={combinedPOList.length + pendingRequests.length + warpList.length + rateList.length}
        poCount={combinedPOList.length}
        externalCount={pendingRequests.length}
        externalTotal={pendingRequests.reduce((sum, r) => sum + r.estimatedAmount, 0)}
        warpCount={warpList.length}
        rateCount={rateList.length}
      />

      <TabsNav tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      {hasApprovalsError && (
        <div style={{ margin: "0 56px", padding: "14px 20px", borderRadius: 12, background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.30)", fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#C0392B", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <span>Failed to load some approvals data. Counts and lists shown below may be incomplete.</span>
          <Button onClick={refetchAll} variant="danger-subtle" size="sm">Retry</Button>
        </div>
      )}

      {isLoading ? (
        <div style={{ margin: "0 56px" }}>
          <LoadingState variant="skeleton" rows={4} />
        </div>
      ) : (
      <TabContent
        activeTab={activeTab}
        combinedPOList={combinedPOList}
        contextPendingItems={contextPendingItems}
        pos={pos}
        pendingRequests={pendingRequests}
        warpList={warpList}
        rateList={rateList}
        allEmpty={allEmpty}
        approvePO={approvePO}
        rejectPO={rejectPO}
        setViewDocPOId={setViewDocPOId}
        decideExternal={decideExternal}
      />
      )}

      <HistorySection
        histFilter={histFilter}
        setHistFilter={setHistFilter}
        histPeriod={histPeriod}
        setHistPeriod={setHistPeriod}
      />

      {/* ── 6. FOOTER ───────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-7 xl:px-14" style={{
        background: T.luxuryBrown,
        paddingTop: 24, paddingBottom: 24,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      }}>
        <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 400, color: T.warmCream }}>
          Beere Kesava &amp; Brothers Silks · Est. 1999
        </span>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          Superadmin Portal · Approvals Management
        </span>
      </div>

      {/* PO Document Modal */}
      <PODocumentModal
        open={!!viewDocPOId}
        onClose={() => setViewDocPOId(null)}
        po={viewDocPO}
        isApproved={viewDocPO?.status === "approved" || viewDocPO?.status === "received"}
      />
    </div>
  );
}
