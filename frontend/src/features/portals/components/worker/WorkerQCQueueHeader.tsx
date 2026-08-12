import React from "react";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { T, F } from "./WorkerQCTypes";
import { StatsStrip, type WorkerStat } from "./primitives";
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
      <div id="wqc-pending" style={{ marginBottom: 24 }}>
        <StatsStrip stats={stats} overlap={false} gutter={isDesktop ? 0 : 16} />
      </div>

      <div id="wqc-in-progress" style={{ display: "flex", margin: isDesktop ? "0 0 12px" : "0 16px 12px", background: T.bg, border: `1px solid ${T.bdr}`, borderRadius: 12, padding: 4 }}>
        {([["weavers", "By Weaver"], ["batches", "By Batch"]] as const).map(([key, label]) => (
          <Button key={key} variant={qcTab === key ? "primary" : "tertiary"} fullWidth
            onClick={() => { setQcTab(key); setWeaverSearch(""); }}
            className={qcTab === key ? "rounded-[9px] bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-[9px] bg-transparent"}>
            {label}
          </Button>
        ))}
      </div>

      <div style={{ margin: isDesktop ? "0 0 12px" : "0 16px 12px" }}>
        <DateFilterBar filter={qcDateFilter} onChange={setQcDateFilter} />
      </div>
    </>
  );
}
