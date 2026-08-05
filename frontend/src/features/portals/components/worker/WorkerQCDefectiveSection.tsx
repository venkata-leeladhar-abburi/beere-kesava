import React from "react";
import { Eye } from "lucide-react";
import { T, F, baseCard, DefectiveLogItem } from "./WorkerQCTypes";
import { Button } from "../../../../shared/ui/primitives";

interface WorkerQCDefectiveSectionProps {
  defLog: DefectiveLogItem[];
  defFilter: string;
  setDefFilter: (filter: string) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
}

export function WorkerQCDefectiveSection({
  defLog,
  defFilter,
  setDefFilter,
  isDesktop,
  isTablet,
}: WorkerQCDefectiveSectionProps) {
  const defCols = isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(3, 1fr)" : "1fr 1fr";

  return (
    <>
      <div id="wqc-defective" style={{ margin: isDesktop ? "20px 0 8px" : "20px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 3, height: 18, background: T.crim, borderRadius: 2 }} />
        <div style={{ fontFamily: F.u, fontSize: isDesktop ? 15 : 14, fontWeight: 700, color: T.brown }}>Defective Sarees</div>
      </div>
      <div style={{ margin: isDesktop ? "2px 0 10px" : "2px 16px 10px", fontFamily: F.u, fontSize: isDesktop ? 13 : 12, color: T.muted }}>
        Failed quality check — stored separately.
      </div>

      <div style={{ display: "flex", gap: 6, padding: isDesktop ? "0 0 10px" : "0 16px 8px" }}>
        {["Today", "This Week", "This Month", "All Time"].map(f => (
          <Button key={f} variant={defFilter === f ? "primary" : "secondary"} size={isDesktop ? "md" : "sm"} onClick={() => setDefFilter(f)}
            className={defFilter === f ? "flex-shrink-0 rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "flex-shrink-0 rounded-full border-[rgba(110,15,45,0.10)]"}>
            {f}
          </Button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: defCols, gap: isDesktop ? 12 : 8, padding: isDesktop ? "0" : "0 16px" }}>
        {defLog.map((d, i) => (
          <div key={i} style={{ ...baseCard, padding: isDesktop ? "14px 16px" : "12px 12px", borderLeft: `3px solid ${T.crim}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontFamily: F.m, fontSize: isDesktop ? 13 : 10, fontWeight: 700, color: T.burg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{d.id}</span>
              <span style={{ fontFamily: F.m, fontSize: isDesktop ? 13 : 11, fontWeight: 700, color: T.crim, flexShrink: 0, marginLeft: 6 }}>{d.deduction}</span>
            </div>
            <div style={{ fontFamily: F.u, fontSize: isDesktop ? 12 : 10, color: T.muted, marginBottom: 7 }}>{d.weaver} · {d.date}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
              {d.defects.map(df => (
                <span key={df} style={{ fontFamily: F.u, fontSize: isDesktop ? 11 : 9, fontWeight: 600, color: T.crim, background: T.bgCrim, border: `1px solid rgba(192,57,43,0.15)`, padding: "2px 7px", borderRadius: 999 }}>{df}</span>
              ))}
            </div>
            <Button variant="secondary" fullWidth size="sm" iconLeft={Eye} className="rounded-[7px] border-[rgba(110,15,45,0.10)] text-[#69635E]">
              View Details
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
