import React from "react";
import { ChevronRight, Package } from "lucide-react";
import { T, F, initials, type SareeItem } from "./WorkerQCTypes";
import { Button } from "../../../../shared/ui/primitives";

interface WeaverGroup {
  name: string;
  code: string;
  source: string;
  sarees: SareeItem[];
}

interface BatchGroup {
  id: string;
  sarees: SareeItem[];
}

interface WorkerQCWeaverGridProps {
  filteredWeavers: WeaverGroup[];
  setSelectedWeaverQC: (name: string) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
  pad: string;
}

export function WorkerQCWeaverGrid({
  filteredWeavers,
  setSelectedWeaverQC,
  isDesktop,
  isTablet,
  pad,
}: WorkerQCWeaverGridProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr 1fr", gap: isDesktop ? 14 : 10, padding: pad }}>
      {filteredWeavers.map(wg => (
        <Button key={wg.name} variant="tertiary" onClick={() => setSelectedWeaverQC(wg.name)}
          className="h-auto flex-col items-start gap-2 whitespace-normal rounded-xl border border-[rgba(110,15,45,0.10)] bg-white px-3.5 py-4 text-left shadow-[0_2px_12px_rgba(74,6,27,0.07)]">
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.gradHero, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: "#FFF" }}>{initials(wg.name)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.u, fontSize: isDesktop ? 14 : 12, fontWeight: 700, color: T.brown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wg.name}</div>
              {wg.code && <div style={{ fontFamily: F.m, fontSize: 12, color: T.muted, marginTop: 1 }}>{wg.code}</div>}
            </div>
            <ChevronRight size={14} color={T.muted} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ background: T.bgCrim, border: `1px solid rgba(192,57,43,0.20)`, borderRadius: 999, padding: "3px 9px" }}>
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: T.crim }}>{wg.sarees.length} pending</span>
            </div>
            <div style={{ background: wg.source === "outsourced" ? T.bgGreen : T.bgGold, borderRadius: 999, padding: "3px 9px" }}>
              <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: wg.source === "outsourced" ? T.green : T.gold }}>{wg.source === "outsourced" ? "Outsourced" : "Own Factory"}</span>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}

interface WorkerQCBatchGridProps {
  batchGroups: BatchGroup[];
  setSelectedBatchQC: (id: string) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
  pad: string;
}

export function WorkerQCBatchGrid({
  batchGroups,
  setSelectedBatchQC,
  isDesktop,
  isTablet,
  pad,
}: WorkerQCBatchGridProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr 1fr", gap: isDesktop ? 14 : 10, padding: pad }}>
      {batchGroups.map(bg => {
        const bweavers = Array.from(new Set(bg.sarees.map(s => s.weaver)));
        return (
          <Button key={bg.id} variant="tertiary" onClick={() => setSelectedBatchQC(bg.id)}
            className="h-auto flex-col items-start gap-2 whitespace-normal rounded-xl border border-[rgba(110,15,45,0.10)] bg-white px-3.5 py-4 text-left shadow-[0_2px_12px_rgba(74,6,27,0.07)]">
            <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: T.bgGold, border: `1px solid rgba(200,155,71,0.30)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={18} color={T.gold} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.m, fontSize: isDesktop ? 13 : 11, fontWeight: 700, color: T.burg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bg.id}</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: T.muted, marginTop: 1 }}>{bg.sarees.length} sarees</div>
              </div>
              <ChevronRight size={14} color={T.muted} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {bweavers.slice(0, 3).map(w => (
                <span key={w} style={{ fontFamily: F.u, fontSize: 12, color: T.brown, background: "rgba(59,35,20,0.07)", padding: "2px 7px", borderRadius: 999 }}>{w}</span>
              ))}
              {bweavers.length > 3 && <span style={{ fontFamily: F.u, fontSize: 12, color: T.muted }}>+{bweavers.length - 3} more</span>}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
