import React from "react";
import { CheckCircle2 } from "lucide-react";
import { T, F, PassedLogItem } from "./WorkerQCTypes";
import { SectionCard } from "./primitives";
import { WorkerQCPassedCard } from "./WorkerQCPassedCard";

interface WorkerQCCompletedTodaySectionProps {
  items: PassedLogItem[];
  isDesktop?: boolean;
  isTablet?: boolean;
}

export function WorkerQCCompletedTodaySection({ items, isDesktop, isTablet }: WorkerQCCompletedTodaySectionProps) {
  const cols = isDesktop ? "repeat(auto-fill, minmax(280px, 1fr))" : isTablet ? "repeat(2, 1fr)" : "1fr";

  return (
    <div id="wqc-completed" style={{ margin: isDesktop ? "40px 0 0" : "32px 16px 0" }}>
      <SectionCard
        icon={CheckCircle2}
        title="Completed Today"
        subtitle="Sarees passed quality check today."
        actions={
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
            {items.length} passed
          </span>
        }
      >
        {items.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontFamily: F.u, fontSize: 14, color: T.muted }}>No sarees passed today yet.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: 16 }}>
            {items.map((p) => (
              <WorkerQCPassedCard key={p.id} id={p.id} weaver={p.weaver} date={p.date} sareeType={p.sareeType} payable={p.payable} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
