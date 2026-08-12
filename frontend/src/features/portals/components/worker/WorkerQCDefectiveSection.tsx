import React, { useState } from "react";
import { Eye, ShieldAlert, AlertTriangle } from "lucide-react";
import { T, F, DefectiveLogItem } from "./WorkerQCTypes";
import { SectionCard } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";
import { DateFilterBar, type DateFilterState, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { WorkerQCDefectiveDetailModal } from "./WorkerQCDefectiveDetailModal";

interface WorkerQCDefectiveSectionProps {
  defLog: DefectiveLogItem[];
  defFilter: DateFilterState;
  setDefFilter: (filter: DateFilterState) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
}

function DefectiveCard({ d, onView }: { d: DefectiveLogItem; onView: () => void }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1px solid ${T.bdr}`,
        borderLeft: `4px solid ${T.crim}`,
        borderRadius: 16,
        boxShadow: "0 2px 12px rgba(74,6,27,0.07)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 500, color: T.burg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.id}
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: T.muted, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.weaver}
          </div>
        </div>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
            fontFamily: F.u, fontSize: 12, fontWeight: 600, color: T.crim,
            background: "rgba(171,56,50,0.08)", border: "1px solid rgba(171,56,50,0.20)",
            padding: "3px 9px", borderRadius: 999,
          }}
        >
          <AlertTriangle size={13} /> {d.result === "semi" ? "Semi" : "Defective"}
        </span>
      </div>

      {/* Defect reasons — the thing an inspector actually reads this card for */}
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 7 }}>
          Defects found
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {d.defects.length === 0 ? (
            <span style={{ fontFamily: F.u, fontSize: 13, color: T.muted }}>—</span>
          ) : d.defects.map(df => (
            <span key={df} style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: T.crim, background: "rgba(171,56,50,0.08)", border: "1px solid rgba(171,56,50,0.18)", padding: "3px 9px", borderRadius: 8 }}>
              {df}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end", padding: "12px 16px", background: T.bg, borderTop: `1px solid ${T.bdr}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Inspected</div>
          <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 500, color: T.brown, marginTop: 3 }}>{d.date}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Deduction</div>
          <div style={{ fontFamily: F.u, fontSize: 18, fontWeight: 600, color: T.crim, marginTop: 2, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
            {d.deduction}
          </div>
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <Button variant="secondary" fullWidth size="sm" iconLeft={Eye} onClick={onView} className="rounded-[10px]">
          View Details
        </Button>
      </div>
    </div>
  );
}

export function WorkerQCDefectiveSection({
  defLog,
  defFilter,
  setDefFilter,
  isDesktop,
  isTablet,
}: WorkerQCDefectiveSectionProps) {
  const cols = isDesktop ? "repeat(auto-fill, minmax(280px, 1fr))" : isTablet ? "repeat(2, 1fr)" : "1fr";
  const filteredDefLog = defLog.filter(d => matchesDateFilter(d.isoDate || d.date, defFilter));
  const [viewing, setViewing] = useState<DefectiveLogItem | null>(null);

  return (
    <div id="wqc-defective" style={{ margin: isDesktop ? "40px 0 0" : "32px 16px 0" }}>
      <SectionCard
        icon={ShieldAlert}
        title="Defective Sarees"
        subtitle="Failed quality check — stored separately."
        actions={
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
            {filteredDefLog.length} of {defLog.length}
          </span>
        }
      >
        <div style={{ marginBottom: 20 }}>
          <DateFilterBar filter={defFilter} onChange={setDefFilter} />
        </div>

        {filteredDefLog.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontFamily: F.u, fontSize: 14, color: T.muted }}>No defective sarees in this range.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: 16 }}>
            {filteredDefLog.map((d, i) => (
              <DefectiveCard key={d.id + i} d={d} onView={() => setViewing(d)} />
            ))}
          </div>
        )}
      </SectionCard>

      {viewing && <WorkerQCDefectiveDetailModal item={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
