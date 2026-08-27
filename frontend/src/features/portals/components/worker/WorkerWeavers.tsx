import React, { useState } from "react";
import { PackageCheck, Package, ShieldAlert } from "lucide-react";
import { C } from "./tokens";
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
    // The material ledger itself now updates from the real backend: receiving
    // a saree (BatchesService.receiveRow) auto-creates a MaterialReturnRecord
    // that draws the weight down from the weaver's outstanding balance, and
    // BatchContext's receiveRow mutation invalidates the receivedSarees query
    // on success. Feeding this local mock in on top would double-count it.
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
