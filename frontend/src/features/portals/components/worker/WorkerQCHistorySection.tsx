import React from "react";
import { History } from "lucide-react";
import { T, F, PassedLogItem } from "./WorkerQCTypes";
import { SectionCard } from "./primitives";
import { WorkerQCPassedCard } from "./WorkerQCPassedCard";
import { DateFilterBar, type DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";

interface WorkerQCHistorySectionProps {
  items: PassedLogItem[];
  historyFilter: DateFilterState;
  setHistoryFilter: (filter: DateFilterState) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
}

export function WorkerQCHistorySection({ items, historyFilter, setHistoryFilter, isDesktop, isTablet }: WorkerQCHistorySectionProps) {
  const cols = isDesktop ? "repeat(auto-fill, minmax(280px, 1fr))" : isTablet ? "repeat(2, 1fr)" : "1fr";
  const filtered = items.filter(p => matchesDateFilter(p.isoDate, historyFilter));

  return (
    <div id="wqc-history" style={{ margin: isDesktop ? "40px 0 0" : "32px 16px 0" }}>
      <SectionCard
        icon={History}
        title="QC History"
        subtitle="All sarees that have passed quality check."
        actions={
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
            {filtered.length} of {items.length}
          </span>
        }
      >
        <div style={{ marginBottom: 20 }}>
          <DateFilterBar filter={historyFilter} onChange={setHistoryFilter} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontFamily: F.u, fontSize: 14, color: T.muted }}>No passed sarees in this range.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: 16 }}>
            {filtered.map((p, i) => (
              <WorkerQCPassedCard key={p.id + i} id={p.id} weaver={p.weaver} date={p.date} sareeType={p.sareeType} payable={p.payable} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
