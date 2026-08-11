import React from "react";
import { CheckCircle2 } from "lucide-react";
import { T, F, baseCard, PassedLogItem } from "./WorkerQCTypes";

interface WorkerQCCompletedTodaySectionProps {
  items: PassedLogItem[];
  isDesktop?: boolean;
  isTablet?: boolean;
}

export function WorkerQCCompletedTodaySection({ items, isDesktop, isTablet }: WorkerQCCompletedTodaySectionProps) {
  const cols = isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(3, 1fr)" : "1fr 1fr";

  return (
    <>
      <div id="wqc-completed" style={{ margin: isDesktop ? "20px 0 8px" : "20px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 3, height: 18, background: T.green, borderRadius: 2 }} />
        <div style={{ fontFamily: F.u, fontSize: isDesktop ? 15 : 14, fontWeight: 700, color: T.brown }}>Completed Today</div>
      </div>
      <div style={{ margin: isDesktop ? "2px 0 10px" : "2px 16px 10px", fontFamily: F.u, fontSize: isDesktop ? 13 : 12, color: T.muted }}>
        Sarees passed quality check today.
      </div>

      {items.length === 0 ? (
        <div style={{ padding: isDesktop ? "20px 0" : "20px 16px", textAlign: "center" }}>
          <div style={{ fontFamily: F.u, fontSize: 12, color: T.muted }}>No sarees passed today yet.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: isDesktop ? 12 : 8, padding: isDesktop ? "0" : "0 16px" }}>
          {items.map((p, i) => (
            <div key={i} style={{ ...baseCard, padding: isDesktop ? "14px 16px" : "12px 12px", borderLeft: `3px solid ${T.green}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontFamily: F.m, fontSize: isDesktop ? 13 : 10, fontWeight: 700, color: T.burg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{p.id}</span>
                <CheckCircle2 size={14} color={T.green} style={{ flexShrink: 0, marginLeft: 6 }} />
              </div>
              <div style={{ fontFamily: F.u, fontSize: isDesktop ? 12 : 10, color: T.muted, marginBottom: 7 }}>{p.weaver} · {p.date}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: F.u, fontSize: isDesktop ? 11 : 9, fontWeight: 600, color: T.green, background: T.bgGreen, border: "1px solid rgba(30,102,64,0.15)", padding: "2px 7px", borderRadius: 999 }}>{p.sareeType || "—"}</span>
                <span style={{ fontFamily: F.m, fontSize: isDesktop ? 13 : 11, fontWeight: 700, color: T.green }}>{p.payable}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
