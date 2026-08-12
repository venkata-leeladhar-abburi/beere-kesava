import React, { useState } from "react";
import { PackageCheck } from "lucide-react";
import { C, F, G } from "./tokens";
import { useMaterialIssue } from "../../../materials/contexts/MaterialIssueContext";
import { DesignPlanningPage } from "./weavers/DesignPlanningPage";
import { ReceiveSareesPage } from "./weavers/ReceiveSareesPage";
import { HistorySection } from "./weavers/HistorySection";
import { type WeaversPage, type ReceivedSareeLog } from "./weavers/shared";
import { Button } from "../../../../shared/ui/primitives";

// Re-exported for consumers that reach into this module directly.
export { MaterialSplitPanel, type MatSplit } from "./weavers/MaterialSplitPanel";

// ─── Main Weavers (now Receive Sarees) Hub ───────────────────────────────────
interface WorkerWeaversProps {
  subPage?: WeaversPage;
  onSubPageChange?: (page: WeaversPage) => void;
}

export function WorkerWeavers({ subPage, onSubPageChange }: WorkerWeaversProps) {
  const [localPage, setLocalPage] = useState<WeaversPage>("receive");
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
      <div style={{ paddingBottom: 20 }}>
        {/* Banner header — same anatomy as the admin SectionCard header
            (icon tile + display title + subtitle over the wine gradient). */}
        <div style={{ background: G.header, padding: "22px 32px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PackageCheck size={26} color="#FFFDF9" />
          </div>
          <div>
            <div style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: "#FFFDF9", letterSpacing: "-0.2px" }}>Receive Sarees</div>
            <div style={{ fontFamily: F.u, fontSize: 14, color: "rgba(255,253,249,0.65)", marginTop: 3 }}>Record completed sarees from weavers</div>
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
