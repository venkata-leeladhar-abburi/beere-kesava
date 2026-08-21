import React from "react";
import { ChevronRight, Package, Users as UsersIcon } from "lucide-react";
import { C, F } from "../tokens";
import { type FinishingAssignment } from "@/features/finishing";
import { Button } from "../../../../../shared/ui/primitives";

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

export interface StaffGroup { name: string; assignments: FinishingAssignment[]; }
export interface BatchGroup { id: string; assignments: FinishingAssignment[]; }

// ── Finishing-staff cards — mirrors the Assign Sarees "by weaver/loom" grid
// so grouping reads the same way across the worker portal.
export function ReceiveStaffGrid({ groups, onSelect, isDesktop, isTablet }: {
  groups: StaffGroup[]; onSelect: (name: string) => void; isDesktop?: boolean; isTablet?: boolean;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr 1fr", gap: isDesktop ? 14 : 10 }}>
      {groups.map(sg => (
        <Button key={sg.name} variant="tertiary" onClick={() => onSelect(sg.name)}
          className="h-auto flex-col items-start gap-2 whitespace-normal rounded-xl border border-[rgba(110,15,45,0.10)] bg-white px-3.5 py-4 text-left shadow-[0_2px_12px_rgba(74,6,27,0.07)]">
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(100deg, #15603D 0%, #1F774E 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: "#FFF" }}>{initials(sg.name)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.u, fontSize: isDesktop ? 14 : 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sg.name}</div>
            </div>
            <ChevronRight size={14} color={C.muted} />
          </div>
          <div style={{ background: "rgba(200,155,71,0.14)", border: "1px solid rgba(200,155,71,0.32)", borderRadius: 999, padding: "3px 9px" }}>
            <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#8D5802" }}>{sg.assignments.length} awaiting</span>
          </div>
        </Button>
      ))}
    </div>
  );
}

// ── Batch cards — mirrors the Assign Sarees "by batch" grid.
export function ReceiveBatchGrid({ groups, onSelect, isDesktop, isTablet }: {
  groups: BatchGroup[]; onSelect: (id: string) => void; isDesktop?: boolean; isTablet?: boolean;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr 1fr", gap: isDesktop ? 14 : 10 }}>
      {groups.map(bg => {
        const bstaff = Array.from(new Set(bg.assignments.map(a => a.finishingStaffName)));
        return (
          <Button key={bg.id} variant="tertiary" onClick={() => onSelect(bg.id)}
            className="h-auto flex-col items-start gap-2 whitespace-normal rounded-xl border border-[rgba(110,15,45,0.10)] bg-white px-3.5 py-4 text-left shadow-[0_2px_12px_rgba(74,6,27,0.07)]">
            <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={18} color="#8B6018" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.m, fontSize: isDesktop ? 13 : 11, fontWeight: 700, color: C.burg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bg.id}</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 1 }}>{bg.assignments.length} sarees</div>
              </div>
              <ChevronRight size={14} color={C.muted} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              <UsersIcon size={11} color={C.muted} style={{ marginTop: 2 }} />
              {bstaff.slice(0, 2).map(s => (
                <span key={s} style={{ fontFamily: F.u, fontSize: 12, color: C.text, background: "rgba(59,35,20,0.07)", padding: "2px 7px", borderRadius: 999 }}>{s}</span>
              ))}
              {bstaff.length > 2 && <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>+{bstaff.length - 2} more</span>}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
