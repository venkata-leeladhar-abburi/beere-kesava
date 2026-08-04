import React, { useState } from "react";
import { usePO } from "../contexts/POContext";
import { useSuppliers } from "../../suppliers/contexts/SupplierContext";
import { PODocumentModal } from "./PODocumentModal";
import { toast } from "sonner";

import { T, F } from "./approvals/tokens";
import { PO_DATA, WARP_DATA, RATE_DATA } from "./approvals/data";
import { ApprovalsHeader } from "./approvals/ApprovalsHeader";
import { StatsStrip } from "./approvals/StatsStrip";
import { TabsNav, TabContent } from "./approvals/TabContent";
import { HistorySection } from "./approvals/HistorySection";

// ─── Main component ───────────────────────────────────────────────────────────
export function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"po" | "ext" | "warp" | "rate">("po");
  const [poList, setPoList]       = useState(PO_DATA);
  const [warpList, setWarpList]   = useState(WARP_DATA);
  const [rateList, setRateList]   = useState(RATE_DATA);
  const [histFilter, setHistFilter] = useState("All History");
  const [histPeriod, setHistPeriod] = useState("This Month");
  const [viewDocPOId, setViewDocPOId] = useState<string | null>(null);

  const { pos, approvePO, rejectPO } = usePO();
  const { requests, decideRequest } = useSuppliers();
  const pendingRequests = requests.filter(r => r.status === "pending");

  const decideExternal = (id: string, status: "approved" | "rejected") => {
    decideRequest(id, status, "Superadmin");
    const req = requests.find(r => r.id === id);
    toast[status === "approved" ? "success" : "info"](
      status === "approved"
        ? `Approved — external purchase created for ${req?.supplierName ?? "supplier"}`
        : `Rejected the purchase request from ${req?.supplierName ?? "supplier"}`
    );
  };

  // Build combined PO list: context pending POs first, then static ones not duplicated
  const contextPendingIds = new Set(pos.filter(p => p.status === "pending").map(p => p.id));
  const contextPendingItems = pos
    .filter(p => p.status === "pending")
    .map(p => ({
      id: p.id,
      raised: new Date(p.submittedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      vendor: p.vendor,
      vendorCity: p.vendorCity,
      materials: p.materials.map(m => ({ label: `${m.materialType}${m.subtype ? ` ${m.subtype}` : ""}`, qty: `${m.quantity} ${m.unit}`, icon: "pkg" })),
      estimated: `₹${p.totalValue?.toLocaleString("en-IN")}`,
      stock: "",
      raisedBy: p.raisedBy,
      notesAdmin: p.notesAdmin,
      urgency: p.urgency,
      totalValue: p.totalValue,
    }));
  const staticItems = poList.filter(p => !contextPendingIds.has(p.id));
  const combinedPOList = [...contextPendingItems, ...staticItems];

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

      <ApprovalsHeader poCount={combinedPOList.length} externalCount={pendingRequests.length} />

      <StatsStrip
        totalPending={combinedPOList.length + pendingRequests.length + warpList.length + rateList.length}
        poCount={combinedPOList.length}
        externalCount={pendingRequests.length}
        externalTotal={pendingRequests.reduce((sum, r) => sum + r.estimatedAmount, 0)}
      />

      <TabsNav tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      <TabContent
        activeTab={activeTab}
        combinedPOList={combinedPOList}
        contextPendingItems={contextPendingItems}
        pos={pos}
        pendingRequests={pendingRequests}
        warpList={warpList}
        rateList={rateList}
        allEmpty={allEmpty}
        setPoList={setPoList}
        approvePO={approvePO}
        rejectPO={rejectPO}
        setViewDocPOId={setViewDocPOId}
        decideExternal={decideExternal}
        setWarpList={setWarpList}
        setRateList={setRateList}
      />

      <HistorySection
        histFilter={histFilter}
        setHistFilter={setHistFilter}
        histPeriod={histPeriod}
        setHistPeriod={setHistPeriod}
      />

      {/* ── 6. FOOTER ───────────────────────────────────────────────────────── */}
      <div style={{
        background: T.luxuryBrown,
        padding: "24px 56px",
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
