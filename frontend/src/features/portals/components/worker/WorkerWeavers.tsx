import React, { useState } from "react";
import { Plus } from "lucide-react";
import { C, F } from "./tokens";
import { useMaterialIssue } from "../../../materials/contexts/MaterialIssueContext";
import { DesignPlanningPage } from "./weavers/DesignPlanningPage";
import { ReceiveSareesPage } from "./weavers/ReceiveSareesPage";
import { HistorySection } from "./weavers/HistorySection";
import { ManualEntryModal } from "./weavers/ManualEntryModal";
import { type WeaversPage, type ReceivedSareeLog } from "./weavers/shared";

// Re-exported for consumers that reach into this module directly.
export { MaterialSplitPanel, type MatSplit } from "./weavers/MaterialSplitPanel";

// ─── Main Weavers (now Receive Sarees) Hub ───────────────────────────────────
interface WorkerWeaversProps {
  subPage?: WeaversPage;
  onSubPageChange?: (page: WeaversPage) => void;
}

export function WorkerWeavers({ subPage, onSubPageChange }: WorkerWeaversProps) {
  const [localPage, setLocalPage] = useState<WeaversPage>("receive");
  const [showManual, setShowManual] = useState(false);
  const [liveRecords, setLiveRecords] = useState<ReceivedSareeLog[]>([]);
  const { addReceivedSaree } = useMaterialIssue();
  const page = subPage ?? localPage;
  const setPage = onSubPageChange ?? setLocalPage;

  const handleSareeReceived = (rec: ReceivedSareeLog) => {
    setLiveRecords(prev => [rec, ...prev]);
    // Feed into the material ledger so outstanding material at the weaver updates.
    const weightGrams = parseFloat(rec.weight.replace(/[^\d.]/g, "")) || 0;
    if (rec.wcode && weightGrams > 0) {
      addReceivedSaree({
        id: rec.id,
        weaverId: rec.wcode,
        batchId: rec.batch,
        weightGrams,
        receivedAt: new Date().toISOString(),
        color: rec.color,
        status: rec.status === "Defective" ? "defective" : "received",
      });
    }
  };

  if (page === "design") return <DesignPlanningPage onBack={() => setPage("receive")} />;

  return (
    <>
      {showManual && <ManualEntryModal onClose={() => setShowManual(false)} />}
      <div style={{ paddingBottom: 20 }}>
        {/* Page header strip */}
        <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${C.burg} 100%)`, padding: "16px 16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: F.d, fontSize: 18, fontWeight: 700, color: "#FFF", marginBottom: 2 }}>Receive Sarees</div>
              <div style={{ fontFamily: F.u, fontSize: 11, color: "rgba(255,255,255,0.60)" }}>Record completed sarees from weavers</div>
            </div>
            <button onClick={() => setShowManual(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 12, fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#FFF", cursor: "pointer" }}>
              <Plus size={14} /> Add Manually
            </button>
          </div>
        </div>

        {/* Receive Sarees form area */}
        <ReceiveSareesPage onBack={() => {}} onSareeReceived={handleSareeReceived} />

        {/* History section */}
        <HistorySection liveRecords={liveRecords} />
      </div>
    </>
  );
}
