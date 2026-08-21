import React, { useState } from "react";
import { PackageCheck, Package, ShieldAlert } from "lucide-react";
import { C, F, G } from "./tokens";
import { useMaterialIssue } from "@/features/materials";
import { useBatches } from "@/features/production";
import { PageHero, StatsStrip, type WorkerStat } from "./primitives";
import { DesignPlanningPage } from "./weavers/DesignPlanningPage";
import { ReceiveSareesPage } from "./weavers/ReceiveSareesPage";
import { HistorySection } from "./weavers/HistorySection";
import { type WeaversPage, type ReceivedSareeLog } from "./weavers/shared";

// Re-exported for consumers that reach into this module directly.
export { MaterialSplitPanel, type MatSplit } from "./weavers/MaterialSplitPanel";

// ─── Main Weavers (now Receive Sarees) Hub ───────────────────────────────────
interface WorkerWeaversProps {
  subPage?: WeaversPage;
  onSubPageChange?: (page: WeaversPage) => void;
  isDesktop?: boolean;
}

export function WorkerWeavers({ subPage, onSubPageChange }: WorkerWeaversProps) {
  const [localPage, setLocalPage] = useState<WeaversPage>("receive");
  const [liveRecords, setLiveRecords] = useState<ReceivedSareeLog[]>([]);
  const { addReceivedSaree } = useMaterialIssue();
  const { batches } = useBatches();
  const page = subPage ?? localPage;
  const setPage = onSubPageChange ?? setLocalPage;

  const pendingReceiptCount = batches
    .filter(b => b.status === "active")
    .flatMap(b => b.rows)
    .filter(r => r.sareeId && !r.receivedAt).length;

  const pendingQcCount = batches
    .filter(b => b.status === "active")
    .flatMap(b => b.rows)
    .filter(r => r.sareeId && r.receivedAt && r.qcPassed == null).length;

  const stats: WorkerStat[] = [
    { label: "Awaiting Receipt", value: pendingReceiptCount, sub: "From active batches", icon: Package, highlight: true },
    { label: "Received Today", value: liveRecords.length, sub: "Recorded today", icon: PackageCheck },
    { label: "Pending QC", value: pendingQcCount, sub: "Waiting inspection", icon: ShieldAlert },
  ];

  const handleSareeReceived = (rec: ReceivedSareeLog) => {
    setLiveRecords(prev => [rec, ...prev]);
    // Feed into the material ledger so outstanding material at the weaver updates.
    // eslint-disable-next-line no-restricted-syntax -- saree weight in grams, not money
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
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <PageHero
        eyebrow="Worker Staff Portal · Receive Sarees"
        title="Receive Sarees"
        titleAccent="& Record Weight"
        description="Record completed sarees from weavers, enter saree weight, verify batch details, and track receipt history."
      />
      <StatsStrip stats={stats} overlap={true} />

      <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Receive Sarees form area */}
        <ReceiveSareesPage onBack={() => {}} onSareeReceived={handleSareeReceived} />

        {/* History section */}
        <HistorySection liveRecords={liveRecords} />
      </div>
    </div>
  );
}
