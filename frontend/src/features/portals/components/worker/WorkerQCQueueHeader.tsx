import React from "react";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { T } from "./WorkerQCTypes";
import { PageHero, StatsStrip, type WorkerStat } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";
import { DateFilterBar, type DateFilterState } from "../../../../shared/ui/DateFilterBar";

interface WorkerQCQueueHeaderProps {
  pendingLength: number;
  passedThisMonthCount: number;
  rejectedCount: number;
  qcTab: "weavers" | "batches";
  setQcTab: (tab: "weavers" | "batches") => void;
  setWeaverSearch: (search: string) => void;
  qcDateFilter: DateFilterState;
  setQcDateFilter: (filter: DateFilterState) => void;
  isDesktop?: boolean;
}

export function WorkerQCQueueHeader({
  pendingLength,
  passedThisMonthCount,
  rejectedCount,
  qcTab,
  setQcTab,
  setWeaverSearch,
  qcDateFilter,
  setQcDateFilter,
  isDesktop,
}: WorkerQCQueueHeaderProps) {
  const stats: WorkerStat[] = [
    { label: "Pending inspection", value: pendingLength, sub: pendingLength > 0 ? "⚠ Waiting on QC" : "All caught up", icon: AlertCircle, alert: pendingLength > 0 },
    { label: "Passed this month", value: passedThisMonthCount, sub: "Cleared into stock", icon: CheckCircle2, highlight: true },
    { label: "Rejected", value: rejectedCount, sub: "Held as defective", icon: ShieldAlert },
  ];

  return (
    <>
      {!isDesktop && (
        <PageHero
          eyebrow="Worker Staff Portal · Quality Check"
          title="Quality Check"
          titleAccent="& Inspection"
          description="Inspect sarees received from weavers, verify weight and material quality, and approve or log defects before sarees move to stock."
        />
      )}

      <div id="wqc-pending" className="mb-6">
        <StatsStrip stats={stats} overlap={!isDesktop} gutter={isDesktop ? 0 : undefined} />
      </div>

      <div className={isDesktop ? "" : "px-4"}>
        <div id="wqc-in-progress" style={{ display: "flex", marginBottom: 14, background: T.bg, border: `1px solid ${T.bdr}`, borderRadius: 12, padding: 4 }}>
          {([["weavers", "By Weaver / Loom"], ["batches", "By Batch"]] as const).map(([key, label]) => (
            <Button key={key} variant={qcTab === key ? "primary" : "tertiary"} fullWidth
              onClick={() => { setQcTab(key); setWeaverSearch(""); }}
              className={qcTab === key ? "rounded-[9px] bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-[9px] bg-transparent"}>
              {label}
            </Button>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <DateFilterBar filter={qcDateFilter} onChange={setQcDateFilter} />
        </div>
      </div>
    </>
  );
}
