import React from "react";
import { ChevronRight, Package, Users as UsersIcon } from "lucide-react";
import { C, F } from "../tokens";
import { type ReadySaree } from "@/features/finishing";
import { Button } from "../../../../../shared/ui/primitives";

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

export interface WeaverGroup { name: string; sarees: ReadySaree[]; }
export interface BatchGroup { id: string; sarees: ReadySaree[]; }

// ── Weaver / Factory-loom cards — mirrors the Quality Check "by weaver" grid
// so grouping reads the same way across the worker portal.
export function AssignWeaverGrid({ groups, onSelect, isDesktop, isTablet }: {
  groups: WeaverGroup[]; onSelect: (name: string) => void; isDesktop?: boolean; isTablet?: boolean;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr 1fr", gap: isDesktop ? 14 : 10 }}>
      {groups.map(wg => (
        <Button key={wg.name} variant="tertiary" onClick={() => onSelect(wg.name)}
          className="h-auto flex-col items-start gap-2 whitespace-normal rounded-xl border border-[rgba(110,15,45,0.10)] bg-white px-3.5 py-4 text-left shadow-[0_2px_12px_rgba(74,6,27,0.07)]">
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(100deg, #3D0E1A 0%, #6E0F2D 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: "#FFF" }}>{initials(wg.name)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.u, fontSize: isDesktop ? 14 : 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wg.name}</div>
            </div>
            <ChevronRight size={14} color={C.muted} />
          </div>
          <div style={{ background: "rgba(30,102,64,0.09)", border: "1px solid rgba(30,102,64,0.20)", borderRadius: 999, padding: "3px 9px" }}>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#1F774E" }}>{wg.sarees.length} ready</span>
          </div>
        </Button>
      ))}
    </div>
  );
}

// ── Batch cards — mirrors the Quality Check "by batch" grid.
export function AssignBatchGrid({ groups, onSelect, isDesktop, isTablet }: {
  groups: BatchGroup[]; onSelect: (id: string) => void; isDesktop?: boolean; isTablet?: boolean;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr 1fr", gap: isDesktop ? 14 : 10 }}>
      {groups.map(bg => {
        const bweavers = Array.from(new Set(bg.sarees.map(s => s.weaverName)));
        return (
          <Button key={bg.id} variant="tertiary" onClick={() => onSelect(bg.id)}
            className="h-auto flex-col items-start gap-2 whitespace-normal rounded-xl border border-[rgba(110,15,45,0.10)] bg-white px-3.5 py-4 text-left shadow-[0_2px_12px_rgba(74,6,27,0.07)]">
            <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={18} color="#8B6018" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.m, fontSize: isDesktop ? 13 : 11, fontWeight: 700, color: C.burg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bg.id}</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 1 }}>{bg.sarees.length} sarees</div>
              </div>
              <ChevronRight size={14} color={C.muted} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              <UsersIcon size={11} color={C.muted} style={{ marginTop: 2 }} />
              {bweavers.slice(0, 2).map(w => (
                <span key={w} style={{ fontFamily: F.u, fontSize: 12, color: C.text, background: "rgba(59,35,20,0.07)", padding: "2px 7px", borderRadius: 999 }}>{w}</span>
              ))}
              {bweavers.length > 2 && <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>+{bweavers.length - 2} more</span>}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
