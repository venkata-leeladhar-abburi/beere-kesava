import React from "react";
import { T, F } from "./WorkerQCTypes";

interface WorkerQCQueueHeaderProps {
  pendingLength: number;
  qcTab: "weavers" | "batches";
  setQcTab: (tab: "weavers" | "batches") => void;
  setWeaverSearch: (search: string) => void;
  isDesktop?: boolean;
}

export function WorkerQCQueueHeader({
  pendingLength,
  qcTab,
  setQcTab,
  setWeaverSearch,
  isDesktop,
}: WorkerQCQueueHeaderProps) {
  return (
    <>
      <div style={{ display: "flex", gap: 8, padding: isDesktop ? "0 0 12px" : "0 16px 12px", flexWrap: "wrap" }}>
        {[
          { label: `${pendingLength} Pending Inspection`, bg: T.bgCrim, color: T.crim, bdr: "rgba(192,57,43,0.20)" },
          { label: "238 Passed This Month", bg: T.bgGreen, color: T.green, bdr: "rgba(30,102,64,0.20)" },
          { label: "10 Rejected", bg: T.bgGold, color: T.gold, bdr: "rgba(200,155,71,0.25)" },
        ].map((s, i) => (
          <div key={i} id={i === 0 ? "wqc-pending" : i === 1 ? "wqc-completed" : undefined} style={{ background: s.bg, border: `1px solid ${s.bdr}`, borderRadius: 999, padding: isDesktop ? "6px 16px" : "5px 12px" }}>
            <span style={{ fontFamily: F.u, fontSize: isDesktop ? 13 : 11, fontWeight: 600, color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div id="wqc-in-progress" style={{ display: "flex", margin: isDesktop ? "0 0 12px" : "0 16px 12px", background: "#F5F0F2", borderRadius: 10, padding: 3 }}>
        {([["weavers", "By Weaver"], ["batches", "By Batch"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setQcTab(key); setWeaverSearch(""); }}
            style={{ flex: 1, padding: "9px 8px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: F.u, fontSize: 13, fontWeight: 600, background: qcTab === key ? T.burg : "transparent", color: qcTab === key ? "#FFF" : T.muted }}>
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
